import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { networkInputSchema } from "@/lib/validation"
import { slugify } from "@/lib/server/strategy-serializer"
import type { NetworkDTO } from "@/lib/types"

/** GET /api/networks — all networks with strategy counts. */
export async function GET() {
  try {
    const [networks, joins] = await Promise.all([
      db.network.findMany({ orderBy: { name: "asc" } }),
      db.strategyNetwork.findMany({ select: { networkId: true, strategyId: true } }),
    ])

    const counts = new Map<string, Set<string>>()
    for (const { networkId, strategyId } of joins) {
      let set = counts.get(networkId)
      if (!set) {
        set = new Set()
        counts.set(networkId, set)
      }
      set.add(strategyId)
    }

    const dtos: NetworkDTO[] = networks.map((n) => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      chainId: n.chainId,
      iconUrl: n.iconUrl,
      active: n.active,
      strategyCount: counts.get(n.id)?.size ?? 0,
    }))

    return NextResponse.json(dtos)
  } catch (error) {
    console.error("GET /api/networks failed:", error)
    return NextResponse.json({ error: "Failed to list networks" }, { status: 500 })
  }
}

/** POST /api/networks — create a network (admin). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = networkInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid network payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const input = parsed.data

    const slug = slugify(input.slug?.trim() || input.name) || "network"
    const conflict = await db.network.findUnique({ where: { slug } })
    if (conflict) {
      return NextResponse.json(
        { error: `Network slug "${slug}" already exists` },
        { status: 409 }
      )
    }

    const created = await db.network.create({
      data: {
        name: input.name,
        slug,
        chainId: input.chainId ?? null,
        iconUrl: input.iconUrl || null,
        active: input.active ?? true,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("POST /api/networks failed:", error)
    return NextResponse.json({ error: "Failed to create network" }, { status: 500 })
  }
}
