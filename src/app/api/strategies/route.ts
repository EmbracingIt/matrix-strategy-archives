import { requireAdmin } from "@/lib/server/admin-auth";
import { PUBLIC_STRATEGY_WHERE, publicStrategy } from "@/lib/server/public-catalogue";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { strategyInputSchema } from "@/lib/validation";
import {
  FULL_STRATEGY_INCLUDE,
  nextStrategyId,
  serializeStrategy,
  uniqueSlug,
} from "@/lib/server/strategy-serializer";
import { withLatestObservations } from "@/lib/server/observation-service";
import type { Regime, RiskLevel, SecondaryRegime } from "@/lib/types";

/**
 * GET /api/strategies
 *
 * Public archive listing. Only PUBLISHED strategies are returned by default;
 * admin clients pass ?status=ALL (or a comma list like DRAFT,ARCHIVED).
 *
 * Supported filters (all optional, combinable):
 *   q               — free text across name/summary/description/type/id,
 *                     protocol names, network names, asset symbols & names
 *   regime          — comma list of BULL|SIDEWAYS|BEAR
 *   secondaryRegime — comma list of Level-2 conditions (EARLY_RECOVERY,
 *                     BTC_LED_EXPANSION, ALT_EXPANSION, LATE_BULL_DISTRIBUTION,
 *                     CAPITULATION_DELEVERAGING, LOW_VOL_COMPRESSION,
 *                     HIGH_VOLATILITY_CHOP)
 *   risk            — comma list of LOW|MEDIUM|HIGH|VERY_HIGH
 *   type            — comma list of strategy types (exact)
 *   network         — comma list of network ids (any-of)
 *   protocol        — comma list of protocol ids (any-of)
 *   asset           — comma list of asset ids (any-of, matches deposit/exposure/reward)
 *   leverage        — none | levered (any = default)
 *   liquidation     — none | exposed (any = default)
 *   status          — PUBLISHED (default) | ALL | comma list
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const list = (key: string) =>
      sp
        .get(key)
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

    const q = sp.get("q")?.trim() || undefined;
    const regimes = list("regime").map((value) =>
      value.toUpperCase() === "NEUTRAL" ? "SIDEWAYS" : value.toUpperCase(),
    ) as Regime[];
    const secondaryRegimes = list("secondaryRegime") as SecondaryRegime[];
    const risks = list("risk") as RiskLevel[];
    const types = list("type");
    const networkIds = list("network");
    const protocolIds = list("protocol");
    const assetIds = list("asset");
    const leverage = sp.get("leverage") || "any";
    const liquidation = sp.get("liquidation") || "any";
    const statusParam = sp.get("status") || "PUBLISHED";
    if (statusParam !== "PUBLISHED") {
      const denied = await requireAdmin();
      if (denied) return denied;
    }

    // --- Prisma-level filters -------------------------------------------------
    const where: Record<string, unknown> = {};

    if (statusParam !== "ALL") {
      const statuses = statusParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      where.status = statuses.length ? { in: statuses } : "PUBLISHED";
    }
    if (statusParam === "PUBLISHED")
      Object.assign(where, PUBLIC_STRATEGY_WHERE);

    if (q) {
      // PostgreSQL comparisons must explicitly opt into case-insensitive search.
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { type: { contains: q, mode: "insensitive" } },
        { strategyId: { contains: q, mode: "insensitive" } },
        {
          protocols: {
            some: { protocol: { name: { contains: q, mode: "insensitive" } } },
          },
        },
        {
          networks: {
            some: { network: { name: { contains: q, mode: "insensitive" } } },
          },
        },
        {
          depositAssets: {
            some: { asset: { symbol: { contains: q, mode: "insensitive" } } },
          },
        },
        {
          depositAssets: {
            some: { asset: { name: { contains: q, mode: "insensitive" } } },
          },
        },
        {
          exposureAssets: {
            some: { asset: { symbol: { contains: q, mode: "insensitive" } } },
          },
        },
        {
          exposureAssets: {
            some: { asset: { name: { contains: q, mode: "insensitive" } } },
          },
        },
        {
          rewardAssets: {
            some: { asset: { symbol: { contains: q, mode: "insensitive" } } },
          },
        },
        {
          rewardAssets: {
            some: { asset: { name: { contains: q, mode: "insensitive" } } },
          },
        },
      ];
    }

    if (types.length) where.type = { in: types };
    if (networkIds.length)
      where.networks = { some: { networkId: { in: networkIds } } };
    if (protocolIds.length)
      where.protocols = { some: { protocolId: { in: protocolIds } } };
    if (assetIds.length) {
      where.AND = [
        {
          OR: [
            { depositAssets: { some: { assetId: { in: assetIds } } } },
            { exposureAssets: { some: { assetId: { in: assetIds } } } },
            { rewardAssets: { some: { assetId: { in: assetIds } } } },
          ],
        },
      ];
    }

    // --- Fetch, then post-filter structured JSON fields ------------------------
    const rows = await db.strategy.findMany({
      where,
      include: FULL_STRATEGY_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });

    let strategies = await withLatestObservations(rows.map(serializeStrategy));

    const hasPostFilters =
      regimes.length > 0 ||
      secondaryRegimes.length > 0 ||
      risks.length > 0 ||
      leverage !== "any" ||
      liquidation !== "any";
    if (hasPostFilters) {
      strategies = strategies.filter((s) => {
        if (
          regimes.length &&
          !regimes.some((r) => s.marketFit.regimes.includes(r))
        )
          return false;
        if (
          secondaryRegimes.length &&
          !secondaryRegimes.some((r) =>
            (s.marketFit.secondaryRegimes ?? []).includes(r),
          )
        )
          return false;
        if (risks.length && !risks.includes(s.risk.overallRisk)) return false;
        if (leverage === "none" && s.risk.leverageUsed) return false;
        if (leverage === "levered" && !s.risk.leverageUsed) return false;
        if (liquidation === "none" && s.risk.liquidationExposure !== "NONE")
          return false;
        if (liquidation === "exposed" && s.risk.liquidationExposure === "NONE")
          return false;
        return true;
      });
    }

    return NextResponse.json(statusParam === "PUBLISHED" ? strategies.map(publicStrategy) : strategies);
  } catch (error) {
    console.error("GET /api/strategies failed:", error);
    return NextResponse.json(
      { error: "Failed to list strategies" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/strategies — create a strategy (admin).
 * Slug and STRATEGY_XXX id are generated when not supplied.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(true);
  if (denied) return denied;
  try {
    const body = await request.json();
    const parsed = strategyInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid strategy payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const input = parsed.data;
    if (
      input.status === "PUBLISHED" &&
      (input.recordType ?? "strategy") === "strategy" &&
      !input.canonicalSlug &&
      (!input.education ||
        !input.steps ||
        input.steps.length < 4 ||
        input.steps.length > 6)
    ) {
      return NextResponse.json(
        {
          error:
            "A public strategy needs validated beginner content and 4–6 practical steps.",
        },
        { status: 400 },
      );
    }

    // Resolve strategy id + slug
    const desiredId = input.strategyId?.trim() || (await nextStrategyId());
    const idConflict = await db.strategy.findUnique({
      where: { strategyId: desiredId },
    });
    if (idConflict) {
      return NextResponse.json(
        { error: `Strategy id "${desiredId}" is already in use` },
        { status: 409 },
      );
    }
    const slug = await uniqueSlug(input.slug?.trim() || input.name);

    const created = await db.strategy.create({
      data: {
        strategyId: desiredId,
        name: input.name,
        slug,
        summary: input.summary ?? "",
        description: input.description ?? "",
        type: input.type,
        status: input.status ?? "DRAFT",
        recordType: input.recordType ?? "strategy",
        canonicalSlug: input.canonicalSlug ?? null,
        aliasesJson: JSON.stringify(input.legacyAliases ?? []),
        educationJson: JSON.stringify(input.education ?? {}),
        marketFit: JSON.stringify(input.marketFit ?? { regimes: [] }),
        objectivesJson: JSON.stringify(input.objectives ?? []),
        steps: JSON.stringify(input.steps ?? []),
        entryConditions: JSON.stringify(input.entryConditions ?? []),
        exitConditions: JSON.stringify(input.exitConditions ?? []),
        risk: JSON.stringify(input.risk ?? {}),
        requirements: JSON.stringify(
          input.requirements ?? { requiredHoldings: [] },
        ),
        referencesJson: JSON.stringify(input.references ?? []),
        lastReviewedAt: input.lastReviewedAt
          ? new Date(input.lastReviewedAt)
          : null,
        depositAssets: {
          create: (input.depositAssetIds ?? []).map((assetId) => ({ assetId })),
        },
        exposureAssets: {
          create: (input.exposureAssetIds ?? []).map((assetId) => ({
            assetId,
          })),
        },
        rewardAssets: {
          create: (input.rewardAssetIds ?? []).map((assetId) => ({ assetId })),
        },
        networks: {
          create: (input.networkIds ?? []).map((networkId) => ({ networkId })),
        },
        protocols: {
          create: (input.protocolIds ?? []).map((protocolId) => ({
            protocolId,
          })),
        },
      },
      include: FULL_STRATEGY_INCLUDE,
    });

    return NextResponse.json(serializeStrategy(created), { status: 201 });
  } catch (error) {
    console.error("POST /api/strategies failed:", error);
    return NextResponse.json(
      { error: "Failed to create strategy" },
      { status: 500 },
    );
  }
}
