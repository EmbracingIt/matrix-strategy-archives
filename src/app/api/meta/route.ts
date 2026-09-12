import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { MetaDTO } from "@/lib/types"

/**
 * GET /api/meta — lightweight metadata for the public site and admin:
 * distinct strategy types (with counts) and overall database counters.
 */
export async function GET() {
  try {
    const [strategies, assetCount, protocolCount, networkCount] = await Promise.all([
      db.strategy.findMany({ select: { type: true, status: true } }),
      db.asset.count(),
      db.protocol.count(),
      db.network.count(),
    ])

    const typeMap = new Map<string, number>()
    let published = 0
    let draft = 0
    let archived = 0
    for (const s of strategies) {
      typeMap.set(s.type, (typeMap.get(s.type) ?? 0) + 1)
      if (s.status === "PUBLISHED") published++
      else if (s.status === "DRAFT") draft++
      else if (s.status === "ARCHIVED") archived++
    }

    const meta: MetaDTO = {
      types: Array.from(typeMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      counts: {
        strategies: strategies.length,
        published,
        draft,
        archived,
        assets: assetCount,
        protocols: protocolCount,
        networks: networkCount,
      },
    }

    return NextResponse.json(meta)
  } catch (error) {
    console.error("GET /api/meta failed:", error)
    return NextResponse.json({ error: "Failed to compute meta" }, { status: 500 })
  }
}
