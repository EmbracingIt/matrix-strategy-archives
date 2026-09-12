import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { protocolInputSchema } from "@/lib/validation"
import { slugify } from "@/lib/server/strategy-serializer"

/** PUT /api/protocols/:id — edit a protocol (admin). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = protocolInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid protocol payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const input = parsed.data

    const existing = await db.protocol.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Protocol not found" }, { status: 404 })
    }

    const slug = slugify(input.slug?.trim() || input.name) || existing.slug
    if (slug !== existing.slug) {
      const conflict = await db.protocol.findUnique({ where: { slug } })
      if (conflict) {
        return NextResponse.json(
          { error: `Protocol slug "${slug}" already exists` },
          { status: 409 }
        )
      }
    }

    const updated = await db.protocol.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        website: input.website || null,
        description: input.description || null,
        iconUrl: input.iconUrl || null,
        active: input.active ?? true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/protocols/:id failed:", error)
    return NextResponse.json({ error: "Failed to update protocol" }, { status: 500 })
  }
}
