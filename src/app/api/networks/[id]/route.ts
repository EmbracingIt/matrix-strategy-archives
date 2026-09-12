import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { networkInputSchema } from "@/lib/validation"
import { slugify } from "@/lib/server/strategy-serializer"

/** PUT /api/networks/:id — edit a network (admin). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = networkInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid network payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const input = parsed.data

    const existing = await db.network.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 })
    }

    const slug = slugify(input.slug?.trim() || input.name) || existing.slug
    if (slug !== existing.slug) {
      const conflict = await db.network.findUnique({ where: { slug } })
      if (conflict) {
        return NextResponse.json(
          { error: `Network slug "${slug}" already exists` },
          { status: 409 }
        )
      }
    }

    const updated = await db.network.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        chainId: input.chainId ?? null,
        iconUrl: input.iconUrl || null,
        active: input.active ?? true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/networks/:id failed:", error)
    return NextResponse.json({ error: "Failed to update network" }, { status: 500 })
  }
}
