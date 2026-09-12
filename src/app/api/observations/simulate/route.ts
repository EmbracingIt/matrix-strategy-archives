import { NextRequest, NextResponse } from "next/server"
import { simulateNextObservations } from "@/lib/server/observation-service"

/**
 * POST /api/observations/simulate — records the next simulated observation
 * for every strategy (or a single one via ?strategyId=).
 *
 * This is the demo stand-in for the future Matrix Finance data service:
 * it steps each strategy's mean-reverting APY/TVL walk from its latest
 * state and writes a new "simulated" observation — showing exactly how
 * external agents will feed the live-data layer without ever touching the
 * strategy definitions themselves.
 */
export async function POST(request: NextRequest) {
  try {
    const strategyId = request.nextUrl.searchParams.get("strategyId") ?? undefined
    const { created } = await simulateNextObservations(strategyId ?? undefined)
    return NextResponse.json({ ok: true, created })
  } catch (error) {
    console.error("POST /api/observations/simulate failed:", error)
    return NextResponse.json({ error: "Failed to simulate observations" }, { status: 500 })
  }
}
