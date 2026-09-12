import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assetInputSchema } from "@/lib/validation"

/** PUT /api/assets/:id — edit an asset (admin). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = assetInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid asset payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const input = parsed.data

    const existing = await db.asset.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    if (input.symbol !== existing.symbol) {
      const conflict = await db.asset.findUnique({ where: { symbol: input.symbol } })
      if (conflict) {
        return NextResponse.json(
          { error: `Asset symbol "${input.symbol}" already exists` },
          { status: 409 }
        )
      }
    }

    const updated = await db.asset.update({
      where: { id },
      data: {
        symbol: input.symbol,
        name: input.name,
        coingeckoId: input.coingeckoId || null,
        iconUrl: input.iconUrl || null,
        category: input.category || null,
        active: input.active ?? true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/assets/:id failed:", error)
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
  }
}

/** DELETE /api/assets/:id — removed in favor of deactivation via PUT (active=false). */
export async function DELETE() {
  return NextResponse.json(
    { error: "Assets are deactivated, not deleted — set active=false via PUT" },
    { status: 405 }
  )
}
