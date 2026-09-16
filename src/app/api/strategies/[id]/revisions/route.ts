import { requireAdmin } from "@/lib/server/admin-auth"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { RevisionDTO, StrategyDTO } from "@/lib/types"

/**
 * GET /api/strategies/:id/revisions — full revision list for a strategy,
 * newest first. Snapshots are returned parsed (StrategyDTO) so the admin
 * can inspect any previous state without extra requests.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const { id } = await params
    const strategy = await db.strategy.findUnique({ where: { id }, select: { id: true } })
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    const revisions = await db.revision.findMany({
      where: { strategyId: id },
      orderBy: { revisionNumber: "desc" },
    })

    const dtos: RevisionDTO[] = revisions.map((r) => ({
      id: r.id,
      revisionNumber: r.revisionNumber,
      changeNote: r.changeNote,
      createdAt: r.createdAt.toISOString(),
      snapshot: JSON.parse(r.snapshot) as StrategyDTO,
    }))

    return NextResponse.json(dtos)
  } catch (error) {
    console.error("GET /api/strategies/:id/revisions failed:", error)
    return NextResponse.json({ error: "Failed to list revisions" }, { status: 500 })
  }
}
