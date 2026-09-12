import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { FULL_STRATEGY_INCLUDE, serializeStrategy } from "@/lib/server/strategy-serializer"
import type { StrategyDTO } from "@/lib/types"

/**
 * POST /api/strategies/:id/revisions/:revId/restore — roll a strategy back
 * to a previous revision.
 *
 * Safety: the current live state is snapshotted as a NEW revision first
 * ("Auto-snapshot before restore"), so a restore is itself reversible.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; revId: string }> }
) {
  try {
    const { id, revId } = await params

    const existing = await db.strategy.findUnique({
      where: { id },
      include: FULL_STRATEGY_INCLUDE,
    })
    if (!existing) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    const revision = await db.revision.findFirst({
      where: { id: revId, strategyId: id },
    })
    if (!revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 })
    }

    const target = JSON.parse(revision.snapshot) as StrategyDTO
    const current = serializeStrategy(existing)

    // Snapshot the live state so the restore can itself be undone.
    const last = await db.revision.findFirst({
      where: { strategyId: id },
      orderBy: { revisionNumber: "desc" },
      select: { revisionNumber: true },
    })
    await db.revision.create({
      data: {
        strategyId: id,
        revisionNumber: (last?.revisionNumber ?? 0) + 1,
        snapshot: JSON.stringify(current),
        changeNote: `Auto-snapshot before restoring revision ${revision.revisionNumber}`,
      },
    })

    // Apply the snapshot's definition onto the strategy (keep identity fields).
    await db.strategyDepositAsset.deleteMany({ where: { strategyId: id } })
    await db.strategyExposureAsset.deleteMany({ where: { strategyId: id } })
    await db.strategyRewardAsset.deleteMany({ where: { strategyId: id } })
    await db.strategyNetwork.deleteMany({ where: { strategyId: id } })
    await db.strategyProtocol.deleteMany({ where: { strategyId: id } })

    const restored = await db.strategy.update({
      where: { id },
      data: {
        name: target.name,
        summary: target.summary ?? "",
        description: target.description ?? "",
        type: target.type,
        marketFit: JSON.stringify(target.marketFit ?? { regimes: [] }),
        steps: JSON.stringify(target.steps ?? []),
        entryConditions: JSON.stringify(target.entryConditions ?? []),
        exitConditions: JSON.stringify(target.exitConditions ?? []),
        risk: JSON.stringify(target.risk ?? {}),
        requirements: JSON.stringify(target.requirements ?? { requiredHoldings: [] }),
        referencesJson: JSON.stringify(target.references ?? []),
        lastReviewedAt: target.lastReviewedAt ? new Date(target.lastReviewedAt) : null,
        depositAssets: {
          create: (target.depositAssets ?? []).map((a) => ({ assetId: a.id })),
        },
        exposureAssets: {
          create: (target.exposureAssets ?? []).map((a) => ({ assetId: a.id })),
        },
        rewardAssets: {
          create: (target.rewardAssets ?? []).map((a) => ({ assetId: a.id })),
        },
        networks: {
          create: (target.networks ?? []).map((n) => ({ networkId: n.id })),
        },
        protocols: {
          create: (target.protocols ?? []).map((p) => ({ protocolId: p.id })),
        },
      },
      include: FULL_STRATEGY_INCLUDE,
    })

    return NextResponse.json(serializeStrategy(restored))
  } catch (error) {
    console.error("POST restore revision failed:", error)
    return NextResponse.json({ error: "Failed to restore revision" }, { status: 500 })
  }
}
