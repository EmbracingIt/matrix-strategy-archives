import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { observationInputSchema } from "@/lib/validation"
import { resolveStrategy, serializeObservation } from "@/lib/server/observation-service"

/**
 * GET /api/strategies/:id/observations — the observation time series for a
 * strategy (ascending by recordedAt). Accepts internal id OR public slug.
 *
 * Query params:
 *   days — cap the series to the last N days of observations (default 365)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const strategy = await resolveStrategy(id)
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    const days = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get("days") ?? "365", 10) || 365, 1),
      3650
    )
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const rows = await db.marketObservation.findMany({
      where: { strategyId: strategy.id, recordedAt: { gte: since } },
      orderBy: { recordedAt: "asc" },
    })

    return NextResponse.json({
      strategyId: strategy.strategyId,
      slug: strategy.slug,
      observations: rows.map(serializeObservation),
    })
  } catch (error) {
    console.error("GET /api/strategies/:id/observations failed:", error)
    return NextResponse.json({ error: "Failed to list observations" }, { status: 500 })
  }
}

/**
 * POST /api/strategies/:id/observations — record a new market observation
 * (admin / future Matrix data agents). Body: { apy, tvl, source? }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const strategy = await resolveStrategy(id)
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = observationInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid observation payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const created = await db.marketObservation.create({
      data: {
        strategyId: strategy.id,
        apy: parsed.data.apy,
        tvl: parsed.data.tvl,
        source: parsed.data.source?.trim() || "admin",
      },
    })

    return NextResponse.json(serializeObservation(created), { status: 201 })
  } catch (error) {
    console.error("POST /api/strategies/:id/observations failed:", error)
    return NextResponse.json({ error: "Failed to record observation" }, { status: 500 })
  }
}
