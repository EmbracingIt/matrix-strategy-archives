import { requireAdmin } from "@/lib/server/admin-auth"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assetInputSchema } from "@/lib/validation"
import type { AssetDTO } from "@/lib/types"

/**
 * GET /api/assets — all assets with the number of strategies referencing them
 * (deposit + exposure + reward, de-duplicated per strategy).
 */
export async function GET() {
  try {
    const [assets, deposits, exposures, rewards] = await Promise.all([
      db.asset.findMany({ orderBy: { symbol: "asc" } }),
      db.strategyDepositAsset.findMany({ select: { assetId: true, strategyId: true } }),
      db.strategyExposureAsset.findMany({ select: { assetId: true, strategyId: true } }),
      db.strategyRewardAsset.findMany({ select: { assetId: true, strategyId: true } }),
    ])

    // Count unique strategies referencing each asset across all three roles.
    const counts = new Map<string, Set<string>>()
    const add = (assetId: string, strategyId: string) => {
      let set = counts.get(assetId)
      if (!set) {
        set = new Set()
        counts.set(assetId, set)
      }
      set.add(strategyId)
    }
    for (const { assetId, strategyId } of deposits) add(assetId, strategyId)
    for (const { assetId, strategyId } of exposures) add(assetId, strategyId)
    for (const { assetId, strategyId } of rewards) add(assetId, strategyId)

    const dtos: AssetDTO[] = assets.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      coingeckoId: a.coingeckoId,
      iconUrl: a.iconUrl,
      category: a.category,
      active: a.active,
      strategyCount: counts.get(a.id)?.size ?? 0,
    }))

    return NextResponse.json(dtos)
  } catch (error) {
    console.error("GET /api/assets failed:", error)
    return NextResponse.json({ error: "Failed to list assets" }, { status: 500 })
  }
}

/** POST /api/assets — create a reusable asset reference (admin). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(true)
  if (denied) return denied
  try {
    const body = await request.json()
    const parsed = assetInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid asset payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const input = parsed.data

    const conflict = await db.asset.findUnique({ where: { symbol: input.symbol } })
    if (conflict) {
      return NextResponse.json(
        { error: `Asset symbol "${input.symbol}" already exists` },
        { status: 409 }
      )
    }

    const created = await db.asset.create({
      data: {
        symbol: input.symbol,
        name: input.name,
        coingeckoId: input.coingeckoId || null,
        iconUrl: input.iconUrl || null,
        category: input.category || null,
        active: input.active ?? true,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("POST /api/assets failed:", error)
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
}
