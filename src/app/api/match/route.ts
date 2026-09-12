import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { matchInputSchema } from "@/lib/validation"
import { FULL_STRATEGY_INCLUDE, serializeStrategy } from "@/lib/server/strategy-serializer"
import { withLatestObservations } from "@/lib/server/observation-service"
import { rankStrategies } from "@/lib/server/match-engine"

/**
 * POST /api/match — the agent-facing matching endpoint.
 *
 * Ranks every PUBLISHED strategy against a profile:
 *   { assetIds: string[], regime: "BULL"|"SIDEWAYS"|"BEAR",
 *     riskTolerance: "LOW"|"MEDIUM"|"HIGH"|"VERY_HIGH", capital?: number }
 *
 * Composite score weights: regime fit 50% · risk alignment 25% ·
 * asset overlap 15% · capital eligibility 10%. Each result carries a
 * per-factor breakdown and a human-readable reason, so rankings are
 * auditable end-to-end. Asset ids may also be passed as symbols (ETH, USDC…).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = matchInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid match profile", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const input = parsed.data

    // Resolve portfolio entries: each value may be an asset id OR a symbol.
    let assetIds = input.assetIds
    if (assetIds.length) {
      const allAssets = await db.asset.findMany({ select: { id: true, symbol: true } })
      const idSet = new Set(allAssets.map((a) => a.id))
      const symbolToId = new Map(allAssets.map((a) => [a.symbol, a.id]))
      assetIds = Array.from(
        new Set(
          assetIds
            .map((value) => (idSet.has(value) ? value : symbolToId.get(value.toUpperCase())))
            .filter((v): v is string => Boolean(v))
        )
      )
    }

    const rows = await db.strategy.findMany({
      where: { status: "PUBLISHED" },
      include: FULL_STRATEGY_INCLUDE,
      orderBy: { updatedAt: "desc" },
    })
    const strategies = await withLatestObservations(rows.map(serializeStrategy))
    const results = rankStrategies(strategies, { ...input, assetIds })

    return NextResponse.json(results)
  } catch (error) {
    console.error("POST /api/match failed:", error)
    return NextResponse.json({ error: "Failed to match strategies" }, { status: 500 })
  }
}
