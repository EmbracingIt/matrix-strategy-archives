import { PrismaClient } from "@prisma/client";
import { catalogue, consolidation } from "../prisma/rebuild/content";
import { marketContexts } from "../prisma/rebuild/market-context";
import {
  reviewedProtocols,
  candidates,
  pendingReview,
} from "../prisma/rebuild/protocols";
import { educationSchema, protocolReviewSchema } from "../src/lib/education";
import {
  FULL_STRATEGY_INCLUDE,
  serializeStrategy,
} from "../src/lib/server/strategy-serializer";

const db = new PrismaClient();
const isLocal = /^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):/.test(
  process.env.STORAGE_DATABASE_URL ?? "",
);
// Deliberate migration, never on boot or build. Production requires a separate
// reviewed deployment step; ordinary preview commands cannot change production.
if (!isLocal && process.env.ARCHIVE_MIGRATION_APPROVED !== "yes")
  throw new Error(
    "Use a local preview DB; production migration is a separate authorised action.",
  );
async function main() {
  for (const c of catalogue) educationSchema.parse(c.education);
  for (const p of reviewedProtocols) protocolReviewSchema.parse(p.review);
  await db.$transaction(
    async (tx) => {
      await tx.asset.upsert({
        where: { symbol: "WETH" },
        create: { symbol: "WETH", name: "Wrapped Ether", category: "wrapped" },
        update: {},
      });
      await tx.network.upsert({where:{slug:"hyperliquid"},create:{name:"Hyperliquid / HyperCore",slug:"hyperliquid"},update:{}})
      await tx.network.upsert({where:{slug:"arbitrum"},create:{name:"Arbitrum",slug:"arbitrum",chainId:42161},update:{}})
      await tx.protocol.upsert({where:{slug:"hyperliquid"},create:{name:"Hyperliquid",slug:"hyperliquid"},update:{}})
      const rows = await tx.strategy.findMany({
        include: FULL_STRATEGY_INCLUDE,
      });
      if (catalogue.some((c) => !rows.some((r) => r.strategyId === c.legacyId)))
        throw new Error(
          "Expected existing canonical records are missing. Import the existing archive before consolidating; do not seed production.",
        );
      const canon = new Map(catalogue.map((c) => [c.legacyId, c]));
      for (const row of rows) {
        const mapping = consolidation[row.strategyId];
        if (!mapping)
          throw new Error(
            `Unmapped record ${row.strategyId}; review before migrating`,
          );
        const c = canon.get(row.strategyId);
        // Idempotent: do not overwrite later editorial changes on a migrated record.
        const existingEducation = JSON.parse(row.educationJson)
        if(c ? existingEducation.editorialVersion === c.education.editorialVersion : (row.recordType !== "legacy" || row.canonicalSlug)) continue;
        const last = await tx.revision.findFirst({
          where: { strategyId: row.id },
          orderBy: { revisionNumber: "desc" },
        });
        await tx.revision.create({
          data: {
            strategyId: row.id,
            revisionNumber: (last?.revisionNumber ?? 0) + 1,
            snapshot: JSON.stringify(serializeStrategy(row)),
            changeNote: `Catalogue consolidation: ${mapping.reason}`,
          },
        });
        if (!c) {
          await tx.strategy.update({
            where: { id: row.id },
            data: {
              status: "ARCHIVED",
              recordType: mapping.destination
                ? "legacy"
                : mapping.lesson === "borrowing"
                  ? "advanced"
                  : "education",
              canonicalSlug: mapping.destination ?? `learn:${mapping.lesson}`,
            },
          });
          continue;
        }
        const aliases = [...new Set([...(JSON.parse(row.aliasesJson) as string[]), ...(row.slug !== c.slug ? [row.slug] : []), ...rows
          .filter(
            (r) =>
              consolidation[r.strategyId]?.destination === c.slug &&
              r.id !== row.id,
          )
          .map((r) => r.slug)])];
        const assets = await tx.asset.findMany({
          where: { symbol: { in: c.assets } },
        });
        if (assets.length !== c.assets.length)
          throw new Error(`Missing asset for ${c.name}`);
        const networks = await tx.network.findMany({
          where: { slug: { in: c.networks } },
        });
        const protocols = await tx.protocol.findMany({
          where: { slug: { in: c.protocols } },
        });
        if (
          networks.length !== c.networks.length ||
          protocols.length !== c.protocols.length
        )
          throw new Error(`Missing implementation taxonomy for ${c.name}`);
        await tx.strategyDepositAsset.deleteMany({
          where: { strategyId: row.id },
        });
        await tx.strategyExposureAsset.deleteMany({
          where: { strategyId: row.id },
        });
        await tx.strategyRewardAsset.deleteMany({
          where: { strategyId: row.id },
        });
        await tx.strategyNetwork.deleteMany({ where: { strategyId: row.id } });
        await tx.strategyProtocol.deleteMany({ where: { strategyId: row.id } });
        await tx.strategy.update({
          where: { id: row.id },
          data: {
            name: c.name,
            slug: c.slug,
            summary: c.summary,
            description: c.description,
            type: c.education.family,
            status: "PUBLISHED",
            recordType: "strategy",
            canonicalSlug: null,
            aliasesJson: JSON.stringify(aliases),
            educationJson: JSON.stringify({
              ...c.education,
              detailedResearch: existingEducation.detailedResearch ?? row.description,
            }),
            objectivesJson: JSON.stringify(c.objectives),
            steps: JSON.stringify(c.steps),
            entryConditions: JSON.stringify(c.education.fitsIf),
            exitConditions: JSON.stringify(c.education.reconsiderIf),
            marketFit: JSON.stringify(marketContexts[c.legacyId]),
            requirements: JSON.stringify({
              requiredHoldings: c.requirements?.requiredHoldings ?? c.assets,
              walletSetup: c.requirements?.walletSetup ??
                "See selected implementation; requirements are not universal.",
              ...(c.requirements ? { other: c.requirements.other } : {}),
            }),
            risk: JSON.stringify({
              overallRisk:
                ["Liquidity Provision", "Hedging"].includes(c.education.family)
                  ? "HIGH"
                  : "MEDIUM",
              explanation: c.riskText,
              leverageUsed: c.education.family === "Hedging",
              leverageAmount: c.education.family === "Hedging" ? "Derivative exposure; example uses 1× initial short notional/margin." : undefined,
              liquidationExposure: c.education.family === "Hedging" ? "HIGH" : "NONE",
              incentiveReliance: "NONE",
              smartContractRisk: "MEDIUM",
              impermanentLoss:
                ["Liquidity Provision", "Hedging"].includes(c.education.family) ? "HIGH" : "NONE",
              conversionReversalRisk: c.conversionReversalRisk,
              conversionReversalExplanation: c.conversionReversalExplanation,
              assetVolatility: c.legacyId === "STRATEGY_011" ? "LOW" : "HIGH",
            }),
            referencesJson: JSON.stringify(
              [
                ...new Set(
                  c.education.implementations.flatMap((i) => i.sources),
                ),
              ].map((url) => ({
                title: c.referenceTitles?.[url] ?? "Official implementation documentation",
                url,
              })),
            ),
            lastReviewedAt: new Date("2026-10-08"),
            depositAssets: { create: assets.filter((a) => !c.depositAssets || c.depositAssets.includes(a.symbol)).map((a) => ({ assetId: a.id })) },
            exposureAssets: { create: assets.map((a) => ({ assetId: a.id })) },
            networks: { create: networks.map((n) => ({ networkId: n.id })) },
            protocols: { create: protocols.map((p) => ({ protocolId: p.id })) },
          },
        });
      }
      // Retain unreviewed entries internally, including pre-existing taxonomy.
      for (const [name, slug, category] of candidates) {
        const existing = await tx.protocol.findUnique({ where: { slug } });
        if (!existing)
          await tx.protocol.create({
            data: {
              name,
              slug,
              reviewJson: JSON.stringify(pendingReview(category)),
            },
          });
        else if (existing.reviewJson === "{}")
          await tx.protocol.update({
            where: { slug },
            data: { reviewJson: JSON.stringify(pendingReview(category)) },
          });
      }
      for (const p of reviewedProtocols) {
        const existing = await tx.protocol.findUnique({
          where: { slug: p.slug },
        });
        if (existing && JSON.parse(existing.reviewJson).status === "reviewed")
          continue;
        await tx.protocol.upsert({
          where: { slug: p.slug },
          create: {
            name: p.name,
            slug: p.slug,
            website: p.website,
            description: p.description,
            reviewJson: JSON.stringify(p.review),
          },
          update: {
            active: true,
            website: p.website,
            description: p.description,
            reviewJson: JSON.stringify(p.review),
          },
        });
      }
      await tx.protocol.updateMany({
        where: { reviewJson: "{}" },
        data: { reviewJson: JSON.stringify(pendingReview("Other")) },
      });
    },
    { timeout: 60000 },
  );
  console.log(
    "Consolidated public catalogue: 8 canonical strategies. Legacy rows/history retained.",
  );
}
main().finally(() => db.$disconnect());
