import { isAdmin, requireAdmin } from "@/lib/server/admin-auth"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { strategyInputSchema } from "@/lib/validation"
import {
  FULL_STRATEGY_INCLUDE,
  createRevisionSnapshot,
  isMaterialChange,
  serializeStrategy,
  uniqueSlug,
} from "@/lib/server/strategy-serializer"
import { withLatestObservations } from "@/lib/server/observation-service"

/**
 * GET /api/strategies/:id — accepts the internal id OR the public slug.
 * Draft/archived strategies require an authenticated administrator.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const row = (await db.strategy.findUnique({
      where: { id },
      include: FULL_STRATEGY_INCLUDE,
    })) ?? (await db.strategy.findUnique({
      where: { slug: id },
      include: FULL_STRATEGY_INCLUDE,
    }))
    if (!row || (row.status !== "PUBLISHED" && !(await isAdmin()))) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }
    const [dto] = await withLatestObservations([serializeStrategy(row)])
    return NextResponse.json(dto)
  } catch (error) {
    console.error("GET /api/strategies/:id failed:", error)
    return NextResponse.json({ error: "Failed to fetch strategy" }, { status: 500 })
  }
}

/**
 * PUT /api/strategies/:id — update a strategy (admin).
 *
 * Revision behavior: before any material content change is applied, the
 * current state is snapshotted into the Revision table with an optional
 * change note. Pure status changes don't create revisions, but a note still
 * records the event when provided.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(true)
  if (denied) return denied
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = strategyInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid strategy payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const input = parsed.data

    const existing = await db.strategy.findUnique({
      where: { id },
      include: FULL_STRATEGY_INCLUDE,
    })
    if (!existing) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    const current = serializeStrategy(existing)

    // Preserve revision history before applying a material edit.
    if (isMaterialChange(current, input)) {
      await createRevisionSnapshot(id, current, input.changeNote)
    }

    // Resolve slug: keep current unless explicitly changed.
    const desiredSlug = input.slug?.trim() || existing.slug
    const slug =
      desiredSlug === existing.slug
        ? existing.slug
        : await uniqueSlug(desiredSlug, id)

    // Replace join rows with the new selection.
    await db.strategyDepositAsset.deleteMany({ where: { strategyId: id } })
    await db.strategyExposureAsset.deleteMany({ where: { strategyId: id } })
    await db.strategyRewardAsset.deleteMany({ where: { strategyId: id } })
    await db.strategyNetwork.deleteMany({ where: { strategyId: id } })
    await db.strategyProtocol.deleteMany({ where: { strategyId: id } })

    const updated = await db.strategy.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        summary: input.summary ?? "",
        description: input.description ?? "",
        type: input.type,
        status: input.status ?? existing.status,
        marketFit: JSON.stringify(input.marketFit ?? { regimes: [] }),
        objectivesJson: JSON.stringify(input.objectives ?? []),
        steps: JSON.stringify(input.steps ?? []),
        entryConditions: JSON.stringify(input.entryConditions ?? []),
        exitConditions: JSON.stringify(input.exitConditions ?? []),
        risk: JSON.stringify(input.risk ?? {}),
        requirements: JSON.stringify(input.requirements ?? { requiredHoldings: [] }),
        referencesJson: JSON.stringify(input.references ?? []),
        lastReviewedAt: input.lastReviewedAt ? new Date(input.lastReviewedAt) : null,
        depositAssets: {
          create: (input.depositAssetIds ?? []).map((assetId) => ({ assetId })),
        },
        exposureAssets: {
          create: (input.exposureAssetIds ?? []).map((assetId) => ({ assetId })),
        },
        rewardAssets: {
          create: (input.rewardAssetIds ?? []).map((assetId) => ({ assetId })),
        },
        networks: {
          create: (input.networkIds ?? []).map((networkId) => ({ networkId })),
        },
        protocols: {
          create: (input.protocolIds ?? []).map((protocolId) => ({ protocolId })),
        },
      },
      include: FULL_STRATEGY_INCLUDE,
    })

    return NextResponse.json(serializeStrategy(updated))
  } catch (error) {
    console.error("PUT /api/strategies/:id failed:", error)
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 })
  }
}

/**
 * DELETE /api/strategies/:id — permanently removes the strategy and its
 * revision history. Archiving (status change via PUT) is preferred; hard
 * delete is reserved for mistakes and test data.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(true)
  if (denied) return denied
  try {
    const { id } = await params
    const existing = await db.strategy.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }
    await db.strategy.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/strategies/:id failed:", error)
    return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 })
  }
}
