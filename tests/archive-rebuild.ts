import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";
import {
  catalogue,
  consolidation,
  rangeAmounts,
} from "../prisma/rebuild/content";
import { educationSchema, protocolReviewSchema } from "../src/lib/education";
import { dtoToInput } from "../src/lib/strategy-form";
import { passesArchiveFilter } from "../src/lib/matching";
import { marketContexts } from "../prisma/rebuild/market-context";
import {
  serializeStrategy,
  FULL_STRATEGY_INCLUDE,
} from "../src/lib/server/strategy-serializer";

const origin = "http://localhost:3010";
if (
  !process.env.STORAGE_DATABASE_URL?.includes("@127.0.0.1:55432/matrix_rebuild")
)
  throw new Error("Tests are local-only");
const db = new PrismaClient();
async function main() {
  const secret = "local-preview-secret-not-for-production-2026";
  const token = await encode({
    secret,
    token: {
      sub: "admin",
      passwordVersion: createHmac("sha256", secret)
        .update("local-preview-only")
        .digest("hex"),
      adminExpires: Date.now() + 3600000,
    },
  });
  const auth = {
    cookie: `next-auth.session-token=${token}`,
    origin,
    "content-type": "application/json",
  };
  async function json(path: string, init?: RequestInit) {
    const r = await fetch(origin + path, init);
    assert.equal(
      r.status,
      200,
      `${path}: ${await (r.status === 200 ? Promise.resolve("") : r.text())}`,
    );
    return r.json();
  }
  try {
    for (const c of catalogue) {
      educationSchema.parse(c.education);
      assert.ok(c.steps.length >= 4 && c.steps.length <= 6);
      assert.equal(c.education.example.scenarios.length, 3);
      assert.ok(
        c.education.implementations.every(
          (i) => i.requirements.length && i.sources.length,
        ),
      );
    }
    // Independently expected full-range conversions; clamp outside either boundary.
    const L = 3000 / (Math.sqrt(3000) - Math.sqrt(2000));
    const bought = rangeAmounts(L, 2000, 3000, 1800);
    assert.ok(Math.abs(bought.asset - 3000 / Math.sqrt(2000 * 3000)) < 1e-10);
    assert.equal(bought.stable, 0);
    const returned = rangeAmounts(L, 2000, 3000, 3200);
    assert.equal(returned.asset, 0);
    assert.ok(Math.abs(returned.stable - 3000) < 1e-10);
    const sellL = 1 / (1 / Math.sqrt(3000) - 1 / Math.sqrt(4000));
    assert.ok(
      Math.abs(
        rangeAmounts(sellL, 3000, 4000, 5000).stable - Math.sqrt(3000 * 4000),
      ) < 1e-10,
    );
    const publicRows = await json("/api/strategies");
    assert.ok(publicRows.every(s=>!('detailedResearch' in s.education)));
    assert.equal(publicRows.length, 8);
    assert.equal(new Set(publicRows.map((s) => s.id)).size, 8);
    for (const [regime, count] of Object.entries({ BULL: 5, SIDEWAYS: 8, BEAR: 3 })) {
      assert.equal(publicRows.filter(s => s.marketFit.regimes.includes(regime)).length, count);
      assert.equal((await json(`/api/strategies?regime=${regime}`)).length, count);
    }
    for (const s of publicRows) {
      assert.deepEqual(s.marketFit.secondaryRegimes, marketContexts[s.strategyId].secondaryRegimes);
      assert.ok(s.marketFit.secondaryRegimes.length > 0);
    }
    const btcPhase = publicRows.filter(s => passesArchiveFilter(s, { market: "bull", secondaryRegime: "BTC_LED_EXPANSION", assets: [], objective: "all" }));
    assert.deepEqual(btcPhase.map(s => s.name), ["Crypto Lending"]);
    const hedge = publicRows.find(s => s.slug === "delta-neutral-lp-hedge");
    assert.equal(hedge.education.complexity, "Advanced");
    assert.equal((await json('/api/strategies/hedged-concentrated-liquidity')).slug, hedge.slug);
    assert.equal((await json('/api/strategies/spot-perp-hedge')).slug, hedge.slug);
    assert.ok(hedge.protocols.some(p => p.slug === 'uniswap'));
    assert.ok(hedge.protocols.some(p => p.slug === 'hyperliquid'));
    // V3 boundary inventory + fixed initial short + separate margin/fees/costs.
    const hedgeL = 1 / (1 / Math.sqrt(3000) - 1 / Math.sqrt(4500));
    for (const [price, fees, expected] of [[2000, 80, 8499.49], [4500, 80, 8224.23], [3000, 100, 9070]]) {
      const inventory = rangeAmounts(hedgeL, 2000, 4500, price);
      const total = inventory.asset * price + inventory.stable + 3000 + (3000 - price) + fees - 30;
      assert.ok(Math.abs(total - expected) < 0.005);
      assert.ok(hedge.education.example.scenarios.some(s => s.value.includes(expected.toLocaleString('en-US'))));
    }
    assert.ok(
      publicRows.every(
        (s) =>
          s.recordType === "strategy" &&
          !s.canonicalSlug &&
          s.education &&
          !s.latestObservation,
      ),
    );
    assert.equal((await json("/api/meta")).counts.published, 8);
    assert.equal((await json("/api/strategies?regime=NEUTRAL")).length, 8);
    assert.ok(
      publicRows.every((s) => s.marketFit.appRegimes.includes("NEUTRAL")),
    );
    assert.equal(
      (await fetch(origin + "/api/strategies?status=ALL")).status,
      401,
    );
    const originals = await db.strategy.findMany({
      include: FULL_STRATEGY_INCLUDE,
    });
    assert.equal(originals.length, 22);
    for (const row of originals) {
      const map = consolidation[row.strategyId];
      assert.ok(map);
      for (const identifier of [row.id, row.slug]) {
        const r = await fetch(`${origin}/api/strategies/${identifier}`);
        const result = await r.json();
        if (
          map.destination ||
          catalogue.some((c) => c.legacyId === row.strategyId)
        ) {
          assert.equal(r.status, 200, identifier);
          assert.equal(result.slug, map.destination || row.slug);
        } else {
          assert.equal(r.status, 410, identifier);
          assert.equal(result.destination, `/?view=learn&lesson=${map.lesson}`);
        }
      }
    }
    assert.equal((await json("/api/strategies?q=accumulation")).length, 1);
    assert.equal((await json("/api/strategies?leverage=levered")).length, 1);
    const matched = await json("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assetIds: ["USDC"],
        regime: "NEUTRAL",
        riskTolerance: "MEDIUM",
      }),
    });
    assert.equal(matched.length, 8);
    assert.ok(
      matched.every((m) => publicRows.some((s) => s.id === m.strategy.id)),
    );
    const protocols = await json("/api/protocols");
    assert.equal(protocols.length, 9);
    protocols.forEach((p) => {
      protocolReviewSchema.parse(p.review);
      assert.equal(p.review.status, "reviewed");
    });
    assert.equal(
      (await json(`/api/strategies/${publicRows[0].id}/observations`))
        .observations.length,
      0,
    );

    // Exercise the actual authenticated shared editor payload and reversible restore.
    const canonicalId = publicRows.find((s) => s.strategyId === "STRATEGY_001").id;
    const original = await json(`/api/strategies/${canonicalId}`, { headers: auth });
    const before = await db.revision.count({
      where: { strategyId: original.id },
    });
    try {
      const input = dtoToInput(original);
      input.education = {
        ...original.education,
        tradeOff: original.education.tradeOff + " Local test.",
      };
      const saved = await json(`/api/strategies/${original.id}`, {
        method: "PUT",
        headers: auth,
        body: JSON.stringify(input),
      });
      assert.equal(saved.education.tradeOff, input.education!.tradeOff);
      assert.equal(saved.strategyId, original.strategyId);
      assert.equal(
        await db.revision.count({ where: { strategyId: original.id } }),
        before + 1,
      );
    } finally {
      await json(`/api/strategies/${original.id}`, {
        method: "PUT",
        headers: auth,
        body: JSON.stringify(dtoToInput(original)),
      });
    }
    const historical = await db.revision.findFirst({
      where: { strategyId: original.id },
      orderBy: { revisionNumber: "asc" },
    });
    try {
      const restored = await json(
        `/api/strategies/${original.id}/revisions/${historical!.id}/restore`,
        { method: "POST", headers: auth },
      );
      assert.equal(restored.name, original.name);
      assert.ok(restored.education);
      assert.equal((await json("/api/strategies")).length, 8);
    } finally {
      await json(`/api/strategies/${original.id}`, {
        method: "PUT",
        headers: auth,
        body: JSON.stringify(dtoToInput(original)),
      });
    }
    const retired = originals.find(
      (s) => s.canonicalSlug && !s.canonicalSlug.startsWith("learn:"),
    )!;
    const revision = await db.revision.findFirst({
      where: { strategyId: retired.id },
      orderBy: { revisionNumber: "desc" },
    });
    try {
      await json(
        `/api/strategies/${retired.id}/revisions/${revision!.id}/restore`,
        { method: "POST", headers: auth },
      );
      const restored = await db.strategy.findUniqueOrThrow({
        where: { id: retired.id },
      });
      assert.equal(restored.canonicalSlug, retired.canonicalSlug);
      assert.equal(restored.status, "ARCHIVED");
      assert.equal((await json("/api/strategies")).length, 8);
    } finally {
      await json(`/api/strategies/${retired.id}`, {
        method: "PUT",
        headers: auth,
        body: JSON.stringify(dtoToInput(serializeStrategy(retired))),
      });
    }
    assert.equal(await db.marketObservation.count(), 1710);
    console.log(
      "PASS: eight public plans, 22 identities, 44 legacy resolutions, examples, filters, matching, protocols, admin edits/restores and retained observations.",
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
