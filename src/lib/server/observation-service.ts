import { db } from "@/lib/db";
import { deriveBaseline, stepObservation } from "@/lib/server/market-sim";
import type {
  ObservationDTO,
  ObservationPoint,
  StrategyDTO,
} from "@/lib/types";

/**
 * Observation service — the data-access layer for the live-data table.
 * Keeps the strategy serializer free of observation concerns: routes call
 * `withLatestObservations` to enrich serialized DTOs in one batched query.
 */

type ObservationRow = {
  id: number;
  strategyId: string;
  apy: number;
  tvl: number;
  source: string;
  recordedAt: Date;
};

export function serializeObservation(row: ObservationRow): ObservationDTO {
  return {
    id: row.id,
    apy: row.apy,
    tvl: row.tvl,
    source: row.source,
    recordedAt: row.recordedAt.toISOString(),
  };
}

/** Maps rows to the latest observation per strategy (rows ordered desc). */
function latestPerStrategy(
  rows: ObservationRow[],
): Map<string, ObservationPoint> {
  const map = new Map<string, ObservationPoint>();
  for (const row of rows) {
    if (!map.has(row.strategyId)) {
      map.set(row.strategyId, {
        apy: row.apy,
        tvl: row.tvl,
        source: row.source,
        recordedAt: row.recordedAt.toISOString(),
      });
    }
  }
  return map;
}

/** Batches one query for all latest observations, then attaches them. */
export async function withLatestObservations(
  strategies: StrategyDTO[],
): Promise<StrategyDTO[]> {
  // Existing observations lack pool identity and APR/APY calculation basis.
  // Preserve history and private simulation APIs; expose no unverified yield.
  return strategies.map((s) => ({ ...s, latestObservation: null }));
}

/** Resolves a strategy by internal id OR slug (mirrors the strategy routes). */
export async function resolveStrategy(idOrSlug: string) {
  return (
    (await db.strategy.findUnique({
      where: { id: idOrSlug },
      select: { id: true, strategyId: true, slug: true, status: true },
    })) ??
    (await db.strategy.findUnique({
      where: { slug: idOrSlug },
      select: { id: true, strategyId: true, slug: true, status: true },
    }))
  );
}

/**
 * Simulates and records the NEXT observation for each strategy (or one
 * strategy when restricted): mean-reverting walk from the latest state,
 * baseline derived from the recent series. Used by the admin "simulate"
 * control to demo how a Matrix data agent would feed the live layer.
 */
export async function simulateNextObservations(strategyId?: string) {
  const strategies = await db.strategy.findMany({
    where: strategyId ? { id: strategyId } : undefined,
    select: { id: true },
  });
  if (!strategies.length) return { created: 0 };

  const rows = await db.marketObservation.findMany({
    where: { strategyId: { in: strategies.map((s) => s.id) } },
    orderBy: { recordedAt: "asc" },
    select: { strategyId: true, apy: true, tvl: true },
  });

  const seriesByStrategy = new Map<string, { apy: number; tvl: number }[]>();
  for (const row of rows) {
    const list = seriesByStrategy.get(row.strategyId) ?? [];
    list.push({ apy: row.apy, tvl: row.tvl });
    seriesByStrategy.set(row.strategyId, list);
  }

  let created = 0;
  for (const { id } of strategies) {
    const series = seriesByStrategy.get(id) ?? [];
    const rand = Math.random;
    const current = series.length
      ? series[series.length - 1]
      : { apy: 10, tvl: 1_000_000 };
    const baseline = deriveBaseline(series.length ? series : [current]);
    const next = stepObservation(current, baseline, rand);
    await db.marketObservation.create({
      data: {
        strategyId: id,
        apy: next.apy,
        tvl: next.tvl,
        source: "simulated",
      },
    });
    created++;
  }

  return { created };
}
