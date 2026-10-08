import { isAdmin, requireAdmin } from "@/lib/server/admin-auth";
import { PUBLIC_STRATEGY_WHERE } from "@/lib/server/public-catalogue";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { protocolInputSchema } from "@/lib/validation";
import { slugify } from "@/lib/server/strategy-serializer";
import type { ProtocolDTO } from "@/lib/types";

/** GET /api/protocols — all protocols with strategy counts. */
export async function GET() {
  try {
    const admin = await isAdmin();
    const [protocols, joins] = await Promise.all([
      db.protocol.findMany({ orderBy: { name: "asc" } }),
      db.strategyProtocol.findMany({
        where: admin ? {} : { strategy: PUBLIC_STRATEGY_WHERE },
        select: { protocolId: true, strategyId: true },
      }),
    ]);

    const counts = new Map<string, Set<string>>();
    for (const { protocolId, strategyId } of joins) {
      let set = counts.get(protocolId);
      if (!set) {
        set = new Set();
        counts.set(protocolId, set);
      }
      set.add(strategyId);
    }

    const dtos: ProtocolDTO[] = protocols.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      website: p.website,
      description: p.description,
      iconUrl: p.iconUrl,
      active: p.active,
      review: JSON.parse(p.reviewJson),
      strategyCount: counts.get(p.id)?.size ?? 0,
    }));

    return NextResponse.json(
      admin
        ? dtos
        : dtos.filter((p) => p.active && p.review?.status === "reviewed"),
    );
  } catch (error) {
    console.error("GET /api/protocols failed:", error);
    return NextResponse.json(
      { error: "Failed to list protocols" },
      { status: 500 },
    );
  }
}

/** POST /api/protocols — create a protocol (admin). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(true);
  if (denied) return denied;
  try {
    const body = await request.json();
    const parsed = protocolInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid protocol payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const slug = slugify(input.slug?.trim() || input.name) || "protocol";
    const conflict = await db.protocol.findUnique({ where: { slug } });
    if (conflict) {
      return NextResponse.json(
        { error: `Protocol slug "${slug}" already exists` },
        { status: 409 },
      );
    }

    const created = await db.protocol.create({
      data: {
        name: input.name,
        slug,
        website: input.website || null,
        description: input.description || null,
        iconUrl: input.iconUrl || null,
        active: input.active ?? true,
        reviewJson: JSON.stringify(input.review ?? {}),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/protocols failed:", error);
    return NextResponse.json(
      { error: "Failed to create protocol" },
      { status: 500 },
    );
  }
}
