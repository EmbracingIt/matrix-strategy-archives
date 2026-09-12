/**
 * Matrix Strategy Archives — seed script.
 * Populates the database with the INITIAL OFFICIAL STRATEGY COLLECTION:
 * 19 deeply-documented, published strategy archetypes (STRATEGY_001–019)
 * plus two preserved legacy records (Pendle PT draft, CRV/AERO archived) —
 * the public archive therefore contains exactly the official 19.
 *
 * Taxonomy additions required by the collection are created here (BTC, WBTC,
 * mSOL, jitoSOL assets; Jito, Aevo, Thetanuts, GMX, Hyperliquid, Spark,
 * Jupiter protocols; Aevo + Hyperliquid networks). Yield figures live ONLY
 * in the MarketObservation live-data layer — the strategy definitions
 * describe HOW a strategy works; live market data stays out.
 *
 * Run with: bun run db:seed
 */
import { PrismaClient } from "@prisma/client"
import { generateObservationSeries } from "../src/lib/server/market-sim"
import { records as officialPart1 } from "./seed-data/records-001-007"
import { records as officialPart2 } from "./seed-data/records-008-013"
import { records as officialPart3 } from "./seed-data/records-014-019"
import type { SeedStrategy } from "./seed-data/types"

const db = new PrismaClient()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function reset() {
  // Order matters: join tables + revisions first (though cascades would handle it).
  await db.marketObservation.deleteMany()
  await db.strategyDepositAsset.deleteMany()
  await db.strategyExposureAsset.deleteMany()
  await db.strategyRewardAsset.deleteMany()
  await db.strategyNetwork.deleteMany()
  await db.strategyProtocol.deleteMany()
  await db.revision.deleteMany()
  await db.strategy.deleteMany()
  await db.asset.deleteMany()
  await db.protocol.deleteMany()
  await db.network.deleteMany()
}

async function main() {
  console.log("Seeding Matrix Strategy Archives — official collection…")
  await reset()

  // -----------------------------------------------------------------------
  // Networks (5 existing + Aevo + Hyperliquid for the options/perp venues)
  // -----------------------------------------------------------------------
  const [ethereum, arbitrum, base, optimism, solana, aevo, hyperliquid] = await Promise.all([
    db.network.create({ data: { name: "Ethereum", slug: "ethereum", chainId: 1 } }),
    db.network.create({ data: { name: "Arbitrum", slug: "arbitrum", chainId: 42161 } }),
    db.network.create({ data: { name: "Base", slug: "base", chainId: 8453 } }),
    db.network.create({ data: { name: "Optimism", slug: "optimism", chainId: 10 } }),
    db.network.create({ data: { name: "Solana", slug: "solana", chainId: null } }),
    db.network.create({ data: { name: "Aevo", slug: "aevo", chainId: null } }),
    db.network.create({ data: { name: "Hyperliquid", slug: "hyperliquid", chainId: null } }),
  ])
  const networkBySlug = new Map(
    [ethereum, arbitrum, base, optimism, solana, aevo, hyperliquid].map((n) => [n.slug, n.id])
  )

  // -----------------------------------------------------------------------
  // Assets (9 existing + BTC, WBTC, mSOL, jitoSOL)
  // -----------------------------------------------------------------------
  const assetRows = await Promise.all([
    db.asset.create({ data: { symbol: "ETH", name: "Ethereum", coingeckoId: "ethereum", category: "native" } }),
    db.asset.create({ data: { symbol: "USDC", name: "USD Coin", coingeckoId: "usd-coin", category: "stablecoin" } }),
    db.asset.create({ data: { symbol: "USDT", name: "Tether USD", coingeckoId: "tether", category: "stablecoin" } }),
    db.asset.create({ data: { symbol: "wstETH", name: "Wrapped Staked ETH", coingeckoId: "wrapped-steth", category: "lst" } }),
    db.asset.create({ data: { symbol: "SOL", name: "Solana", coingeckoId: "solana", category: "native" } }),
    db.asset.create({ data: { symbol: "ARB", name: "Arbitrum", coingeckoId: "arbitrum", category: "governance" } }),
    db.asset.create({ data: { symbol: "CRV", name: "Curve DAO Token", coingeckoId: "curve-dao-token", category: "governance" } }),
    db.asset.create({ data: { symbol: "AERO", name: "Aerodrome", coingeckoId: "aerodrome-finance", category: "governance" } }),
    db.asset.create({ data: { symbol: "OP", name: "Optimism", coingeckoId: "optimism", category: "governance" } }),
    db.asset.create({ data: { symbol: "BTC", name: "Bitcoin", coingeckoId: "bitcoin", category: "native" } }),
    db.asset.create({ data: { symbol: "WBTC", name: "Wrapped Bitcoin", coingeckoId: "wrapped-bitcoin", category: "wrapped" } }),
    db.asset.create({ data: { symbol: "mSOL", name: "Marinade Staked SOL", coingeckoId: "msol-token", category: "lst" } }),
    db.asset.create({ data: { symbol: "jitoSOL", name: "Jito Staked SOL", coingeckoId: "jito-staked-sol", category: "lst" } }),
  ])
  const assetBySymbol = new Map(assetRows.map((a) => [a.symbol, a.id]))

  // -----------------------------------------------------------------------
  // Protocols (9 existing + Jito, Aevo, Thetanuts, GMX, Hyperliquid, Spark,
  // Jupiter)
  // -----------------------------------------------------------------------
  const protocolRows = await Promise.all([
    db.protocol.create({
      data: { name: "Uniswap", slug: "uniswap", website: "https://uniswap.org", description: "The largest automated market maker on Ethereum, with concentrated liquidity pools since V3." },
    }),
    db.protocol.create({
      data: { name: "Aave", slug: "aave", website: "https://aave.com", description: "Battle-tested non-custodial liquidity protocol for overcollateralized lending and borrowing." },
    }),
    db.protocol.create({
      data: { name: "Morpho", slug: "morpho", website: "https://morpho.org", description: "Efficient lending marketplace built around isolated, curatable markets." },
    }),
    db.protocol.create({
      data: { name: "Compound", slug: "compound", website: "https://compound.finance", description: "One of the oldest Ethereum money markets, governed by COMP holders." },
    }),
    db.protocol.create({
      data: { name: "Lido", slug: "lido", website: "https://lido.fi", description: "The largest liquid staking protocol for Ethereum, issuing stETH/wstETH." },
    }),
    db.protocol.create({
      data: { name: "Pendle", slug: "pendle", website: "https://pendle.finance", description: "Yield tokenization protocol that splits yield-bearing assets into principal and yield tokens." },
    }),
    db.protocol.create({
      data: { name: "Curve", slug: "curve", website: "https://curve.fi", description: "Exchange specialized in low-slippage stablecoin and correlated-asset swaps." },
    }),
    db.protocol.create({
      data: { name: "Aerodrome", slug: "aerodrome", website: "https://aerodrome.finance", description: "Base's central liquidity hub, a Curve-style DEX with incentive flywheel emissions." },
    }),
    db.protocol.create({
      data: { name: "Marinade", slug: "marinade", website: "https://marinade.finance", description: "Solana liquid staking protocol issuing mSOL with automated validator delegation." },
    }),
    db.protocol.create({
      data: { name: "Jito", slug: "jito", website: "https://www.jito.network", description: "Solana liquid staking and MEV restaking protocol issuing jitoSOL." },
    }),
    db.protocol.create({
      data: { name: "Aevo", slug: "aevo", website: "https://aevo.xyz", description: "High-performance decentralized derivatives exchange for options and perpetuals." },
    }),
    db.protocol.create({
      data: { name: "Thetanuts", slug: "thetanuts", website: "https://thetanuts.finance", description: "Multi-chain options vault protocol running covered-call and put-selling strategies." },
    }),
    db.protocol.create({
      data: { name: "GMX", slug: "gmx", website: "https://gmx.io", description: "Spot and perpetual derivatives exchange on Arbitrum using a pooled liquidity model." },
    }),
    db.protocol.create({
      data: { name: "Hyperliquid", slug: "hyperliquid", website: "https://hyperliquid.xyz", description: "High-performance perp DEX on its own L1 with fully on-chain order book." },
    }),
    db.protocol.create({
      data: { name: "Spark", slug: "spark", website: "https://spark.fi", description: "MakerDAO-aligned lending and stablecoin liquidity protocol in the Sky ecosystem." },
    }),
    db.protocol.create({
      data: { name: "Jupiter", slug: "jupiter", website: "https://jup.ag", description: "Solana's leading DEX aggregator for token swaps and limit orders." },
    }),
  ])
  const protocolBySlug = new Map(protocolRows.map((p) => [p.slug, p.id]))

  // -----------------------------------------------------------------------
  // Preserved legacy records (NOT part of the official 19): the Pendle PT
  // draft demonstrates the DRAFT state, the CRV/AERO record the ARCHIVED
  // state — both invisible to the public archive.
  // -----------------------------------------------------------------------
  const preserved: (Omit<SeedStrategy, "status"> & { status: "DRAFT" | "ARCHIVED" })[] = [
    {
      strategyId: "STRATEGY_020",
      name: "Pendle PT Fixed Yield",
      slug: "pendle-pt-fixed-yield",
      type: "Fixed Income",
      status: "DRAFT",
      objectives: [], // derived from type — exercises the fallback mapping
      summary: "Lock a known effective yield on yield-bearing assets by purchasing Pendle principal tokens at a discount.",
      description:
        "Pendle splits yield-bearing assets into principal tokens (PT) and yield tokens (YT). Buying PT is functionally buying the asset's principal at a discount: at maturity, each PT redeems for the full underlying, so the purchase discount implies a fixed effective yield for the holder.\n\nThis converts an unknown floating yield into a known number at entry, which behaves like a fixed-income instrument inside a DeFi wrapper. The trade-offs are term commitment (yield is only fully realized at maturity), liquidity risk before maturity, and the protocol's derivative machinery.\n\nDraft entry — internal working notes. Needs: finalized market selection criteria, maturity ladder policy, and a depeg contingency playbook before publication.",
      marketFit: {
        regimes: ["BULL", "SIDEWAYS", "BEAR"],
        scores: { BULL: 60, SIDEWAYS: 80, BEAR: 75 },
        secondaryRegimes: ["LATE_BULL_DISTRIBUTION", "LOW_VOL_COMPRESSION"],
        secondaryScores: { LATE_BULL_DISTRIBUTION: 75, LOW_VOL_COMPRESSION: 70 },
        explanation:
          "Fixed yield is attractive when floating rates are expected to fall, typically late-cycle or defensive regimes. Draft note: refine scoring with backtested spread data.",
      },
      steps: [
        { title: "Select a PT market and maturity", description: "Choose a yield-bearing underlying (e.g. a staked stablecoin) and a maturity that matches your horizon." },
        { title: "Purchase PT at a discount", description: "Buy PT on the Pendle market; the implied fixed yield is determined by the discount to face value." },
        { title: "Hold to maturity or exit early", description: "Holding to maturity redeems PT for the full underlying. Exiting earlier sells at market price, which may be above or below the entry discount." },
        { title: "Redeem at maturity", description: "After maturity, redeem PT 1:1 for the underlying asset and redeploy." },
      ],
      entryConditions: [
        "Implied fixed yield exceeds the floating yield you forgo",
        "You can commit capital until the chosen maturity",
        "You accept Pendle's smart-contract risk",
        "Draft: define market-quality criteria",
      ],
      exitConditions: [
        "You need liquidity before maturity (sell PT at market)",
        "A materially better fixed venue appears",
        "Underlying asset risk changes",
      ],
      risk: {
        overallRisk: "MEDIUM",
        explanation:
          "Draft: PT held to maturity avoids floating-yield variability but adds term commitment, pre-maturity liquidity risk, and derivative contract risk.",
        leverageUsed: false,
        leverageAmount: "",
        liquidationExposure: "NONE",
        withdrawalRestrictions: "Full value only at maturity; early exit at market price",
        lockupPeriod: "Until chosen maturity (commonly 3–12 months)",
        incentiveReliance: "MEDIUM",
        smartContractRisk: "MEDIUM",
        impermanentLoss: "NONE",
        assetVolatility: "LOW",
      },
      requirements: {
        minCapital: "$500",
        requiredHoldings: ["USDC"],
        walletSetup: "Ethereum-compatible wallet",
        other: "Understanding of PT/YT mechanics",
      },
      references: [
        { title: "Pendle Documentation", url: "https://guide.pendle.finance/", publisher: "Pendle", notes: "PT/YT mechanics and implied yield" },
      ],
      lastReviewedAt: "2026-09-05",
      depositAssets: ["USDC"],
      exposureAssets: ["USDC"],
      rewardAssets: [],
      networks: ["ethereum"],
      protocols: ["pendle"],
    },
    {
      strategyId: "STRATEGY_021",
      name: "CRV / AERO Liquidity Farming",
      slug: "crv-aero-liquidity-farming",
      type: "Yield Farming",
      status: "ARCHIVED",
      objectives: [],
      summary: "Provide stablecoin liquidity on Curve and Aerodrome while farming incentive emissions — archived after incentives compressed.",
      description:
        "This strategy provided liquidity to Curve and Aerodrome stable pools and staked the LP tokens to farm CRV and AERO incentive emissions. Total return came from base swap fees plus emissions, which historically dominated the yield.\n\nThe strategy was archived when incentive emissions compressed across both protocols and the maintenance burden (claiming, selling or compounding emissions, monitoring gauge weights) stopped being justified by the residual return. It remains a valid template that can be revived if incentive economics change materially.",
      marketFit: {
        regimes: ["BULL", "SIDEWAYS"],
        scores: { BULL: 55, SIDEWAYS: 70, BEAR: 35 },
        // Declared without scores — exercises the unscored secondary rendering.
        secondaryRegimes: ["ALT_EXPANSION", "LATE_BULL_DISTRIBUTION"],
        secondaryScores: {},
        explanation:
          "Farming returns depended heavily on emissions value, which tracks protocol token prices. Archived — maintained for historical reference.",
      },
      steps: [
        { title: "Provide stablecoin liquidity", description: "Deposit stablecoins into Curve / Aerodrome stable pools and receive LP tokens." },
        { title: "Stake LP tokens in the gauge", description: "Deposit LP tokens into the protocol's gauge to begin earning emissions." },
        { title: "Harvest emissions periodically", description: "Claim CRV / AERO rewards and either sell or compound them per policy." },
        { title: "Exit when incentive economics deteriorate", description: "Withdraw liquidity and unstake when emissions no longer justify the position's risk and effort." },
      ],
      entryConditions: [
        "Archived — do not enter",
        "Historical condition: emissions value exceeded maintenance cost",
      ],
      exitConditions: [
        "Archived — strategy exited",
        "Revival condition: incentive economics become compelling again",
      ],
      risk: {
        overallRisk: "HIGH",
        explanation:
          "Historical: total return relied on incentive token value, adding protocol-token price risk on top of contract and depeg risks. Reward tokens often depreciated faster than they were earned.",
        leverageUsed: false,
        leverageAmount: "",
        liquidationExposure: "NONE",
        withdrawalRestrictions: "None — standard pool withdrawals",
        lockupPeriod: "",
        incentiveReliance: "HIGH",
        smartContractRisk: "HIGH",
        impermanentLoss: "LOW",
        assetVolatility: "MEDIUM",
      },
      requirements: {
        minCapital: "$1,000",
        requiredHoldings: ["USDC", "USDT"],
        walletSetup: "Ethereum and Base wallets",
        other: "Archived — reference template only",
      },
      references: [
        { title: "Curve Documentation", url: "https://docs.curve.fi/", publisher: "Curve" },
        { title: "Aerodrome Documentation", url: "https://aerodrome.finance/docs", publisher: "Aerodrome" },
      ],
      lastReviewedAt: "2026-06-20",
      depositAssets: ["USDC", "USDT"],
      exposureAssets: ["USDC", "USDT"],
      rewardAssets: ["CRV", "AERO"],
      networks: ["ethereum", "base"],
      protocols: ["curve", "aerodrome"],
    },
  ]

  // -----------------------------------------------------------------------
  // Create the strategies: 19 official (PUBLISHED) + 2 preserved
  // -----------------------------------------------------------------------
  const strategies: (Omit<SeedStrategy, "status"> & {
    status: "PUBLISHED" | "DRAFT" | "ARCHIVED"
  })[] = [
    ...officialPart1,
    ...officialPart2,
    ...officialPart3,
    ...preserved,
  ]

  for (const s of strategies) {
    const {
      depositAssets, exposureAssets, rewardAssets, networks, protocols,
      lastReviewedAt, references, objectives, ...fields
    } = s

    const resolveAssets = (symbols: string[]) =>
      symbols.map((symbol) => {
        const id = assetBySymbol.get(symbol)
        if (!id) throw new Error(`Unknown asset symbol in seed: ${symbol} (${s.strategyId})`)
        return { assetId: id }
      })
    const resolveNetworks = (slugs: string[]) =>
      slugs.map((slug) => {
        const id = networkBySlug.get(slug)
        if (!id) throw new Error(`Unknown network slug in seed: ${slug} (${s.strategyId})`)
        return { networkId: id }
      })
    const resolveProtocols = (slugs: string[]) =>
      slugs.map((slug) => {
        const id = protocolBySlug.get(slug)
        if (!id) throw new Error(`Unknown protocol slug in seed: ${slug} (${s.strategyId})`)
        return { protocolId: id }
      })

    await db.strategy.create({
      data: {
        ...fields,
        marketFit: JSON.stringify(s.marketFit),
        objectivesJson: JSON.stringify(objectives),
        steps: JSON.stringify(s.steps),
        entryConditions: JSON.stringify(s.entryConditions),
        exitConditions: JSON.stringify(s.exitConditions),
        risk: JSON.stringify(s.risk),
        requirements: JSON.stringify(s.requirements),
        referencesJson: JSON.stringify(references),
        lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : null,
        depositAssets: { create: resolveAssets(depositAssets) },
        exposureAssets: { create: resolveAssets(exposureAssets) },
        rewardAssets: { create: resolveAssets(rewardAssets) },
        networks: { create: resolveNetworks(networks) },
        protocols: { create: resolveProtocols(protocols) },
      },
    })
  }

  // -----------------------------------------------------------------------
  // Market observations (live-data layer): 90 days of daily APY/TVL series
  // per strategy, following the shared mean-reverting walk dynamics.
  // Borrow/risk-management strategies (005, 012) get NO series — an "APY"
  // would misrepresent them; the UI renders the missing observation honestly.
  // The archived strategy's series ends at its archive date.
  // -----------------------------------------------------------------------
  const OBSERVATION_SPECS: Record<
    string,
    { startApy: number; baseline: number; startTvl: number; seed: number; endsAt?: Date }
  > = {
    "accumulation-lp": { startApy: 6.4, baseline: 11.6, startTvl: 8_400_000, seed: 11 },
    "stablecoin-dca-into-crypto": { startApy: 3.2, baseline: 4.0, startTvl: 6_200_000, seed: 12 },
    "yield-funded-accumulation": { startApy: 4.8, baseline: 4.5, startTvl: 9_600_000, seed: 13 },
    "blue-chip-asset-lending": { startApy: 2.9, baseline: 2.6, startTvl: 44_000_000, seed: 14 },
    // borrow-against-btc: intentionally no observation series (cost strategy)
    "bull-market-hold-yield": { startApy: 5.5, baseline: 5.2, startTvl: 21_000_000, seed: 16 },
    "eth-liquid-staking": { startApy: 2.8, baseline: 3.3, startTvl: 58_000_000, seed: 55 },
    "sol-liquid-staking": { startApy: 8.6, baseline: 7.7, startTvl: 9_800_000, seed: 44 },
    "distribution-lp": { startApy: 9.1, baseline: 12.4, startTvl: 5_100_000, seed: 17 },
    "covered-call-yield": { startApy: 11.8, baseline: 10.2, startTvl: 3_600_000, seed: 18 },
    "stablecoin-yield-rotation": { startApy: 7.2, baseline: 5.7, startTvl: 12_600_000, seed: 33 },
    // deleveraging-into-weakness: intentionally no observation series (risk management)
    "stablecoin-reserve-strategy": { startApy: 4.3, baseline: 4.0, startTvl: 18_200_000, seed: 20 },
    "capital-preservation-defi-portfolio": { startApy: 4.9, baseline: 4.4, startTvl: 15_800_000, seed: 21 },
    "range-bound-yield-lp": { startApy: 13.4, baseline: 14.8, startTvl: 4_200_000, seed: 22 },
    "concentrated-liquidity-provision": { startApy: 16.2, baseline: 17.5, startTvl: 6_900_000, seed: 23 },
    "delta-neutral-lp": { startApy: 14.9, baseline: 12.9, startTvl: 3_900_000, seed: 66 },
    "hedged-concentrated-liquidity": { startApy: 18.7, baseline: 16.4, startTvl: 2_400_000, seed: 24 },
    "market-neutral-yield-stack": { startApy: 10.9, baseline: 9.8, startTvl: 3_100_000, seed: 25 },
    "pendle-pt-fixed-yield": { startApy: 11.4, baseline: 11.0, startTvl: 15_400_000, seed: 77 },
    "crv-aero-liquidity-farming": {
      startApy: 34.6,
      baseline: 21.4,
      startTvl: 5_200_000,
      seed: 88,
      endsAt: new Date("2026-06-20T12:00:00Z"),
    },
  }

  let obsCount = 0
  const DAY = 24 * 60 * 60 * 1000
  for (const s of strategies) {
    const spec = OBSERVATION_SPECS[s.slug]
    if (!spec) continue
    const created = await db.strategy.findUnique({ where: { slug: s.slug }, select: { id: true } })
    if (!created) continue
    const series = generateObservationSeries(90, spec.startApy, spec.baseline, spec.startTvl, spec.seed)
    const end = spec.endsAt ?? new Date()
    await db.marketObservation.createMany({
      data: series.map((p) => ({
        strategyId: created.id,
        apy: p.apy,
        tvl: p.tvl,
        source: "seed",
        recordedAt: new Date(end.getTime() - p.daysAgo * DAY),
      })),
    })
    obsCount += series.length
  }

  // Give the two most-edited looking strategies a small revision history
  // so the admin revision browser is populated on first run.
  const accumulation = await db.strategy.findUnique({
    where: { slug: "accumulation-lp" },
    include: {
      depositAssets: { include: { asset: true } },
      exposureAssets: { include: { asset: true } },
      rewardAssets: { include: { asset: true } },
      networks: { include: { network: true } },
      protocols: { include: { protocol: true } },
    },
  })
  if (accumulation) {
    const earlier = JSON.stringify({
      id: accumulation.id,
      strategyId: accumulation.strategyId,
      name: accumulation.name,
      slug: accumulation.slug,
      summary: "Accumulate ETH during weak markets while earning fees in a liquidity range.",
      description: accumulation.description,
      type: "Liquidity Provision",
      status: "PUBLISHED",
      marketFit: accumulation.marketFit,
      objectives: [],
      steps: accumulation.steps,
      entryConditions: accumulation.entryConditions,
      exitConditions: accumulation.exitConditions,
      risk: accumulation.risk,
      requirements: accumulation.requirements,
      references: accumulation.referencesJson,
      lastReviewedAt: accumulation.lastReviewedAt?.toISOString() ?? null,
      createdAt: accumulation.createdAt.toISOString(),
      updatedAt: new Date("2026-08-02").toISOString(),
      depositAssets: [],
      exposureAssets: [],
      rewardAssets: [],
      networks: [],
      protocols: [],
    })
    await db.revision.create({
      data: {
        strategyId: accumulation.id,
        revisionNumber: 1,
        snapshot: earlier,
        changeNote: "Initial publication — pre-restructure snapshot",
      },
    })
  }

  const rotation = await db.strategy.findUnique({ where: { slug: "stablecoin-yield-rotation" }, select: { id: true } })
  if (rotation) {
    const base = await db.strategy.findUnique({
      where: { id: rotation.id },
      include: {
        depositAssets: { include: { asset: true } },
        exposureAssets: { include: { asset: true } },
        rewardAssets: { include: { asset: true } },
        networks: { include: { network: true } },
        protocols: { include: { protocol: true } },
      },
    })
    if (base) {
      const snapshot = JSON.stringify({
        id: base.id,
        strategyId: base.strategyId,
        name: base.name,
        slug: base.slug,
        summary: "Rotate idle stablecoins between lending venues for the best conservative rate.",
        description: base.description,
        type: base.type,
        status: "PUBLISHED",
        marketFit: base.marketFit,
        objectives: [],
        steps: base.steps,
        entryConditions: base.entryConditions,
        exitConditions: base.exitConditions,
        risk: base.risk,
        requirements: base.requirements,
        references: base.referencesJson,
        lastReviewedAt: null,
        createdAt: base.createdAt.toISOString(),
        updatedAt: new Date("2026-08-18").toISOString(),
        depositAssets: [],
        exposureAssets: [],
        rewardAssets: [],
        networks: [],
        protocols: [],
      })
      await db.revision.create({
        data: {
          strategyId: base.id,
          revisionNumber: 1,
          snapshot,
          changeNote: "Before adding Spark and Curve to the venue set",
        },
      })
    }
  }

  // Touch updatedAt ordering for the admin list (newest reviewed first).
  for (const s of strategies) {
    await db.strategy.update({
      where: { slug: s.slug },
      data: { updatedAt: new Date(`${s.lastReviewedAt}T10:00:00Z`) },
    })
  }

  // -----------------------------------------------------------------------
  // COVERAGE VALIDATION — every Market Phase must offer at least three
  // genuinely suitable strategies in the official collection.
  // -----------------------------------------------------------------------
  const PHASES = [
    "EARLY_RECOVERY",
    "BTC_LED_EXPANSION",
    "ALT_EXPANSION",
    "LATE_BULL_DISTRIBUTION",
    "CAPITULATION_DELEVERAGING",
    "LOW_VOL_COMPRESSION",
    "HIGH_VOLATILITY_CHOP",
  ] as const
  const published = await db.strategy.findMany({ where: { status: "PUBLISHED" }, select: { marketFit: true, slug: true } })
  let coverageOk = true
  for (const phase of PHASES) {
    const matches = published.filter((s) => {
      const fit = JSON.parse(s.marketFit as string)
      return (fit.secondaryRegimes ?? []).includes(phase)
    })
    const ok = matches.length >= 3
    if (!ok) coverageOk = false
    console.log(`  ${ok ? "OK " : "!! "} ${phase}: ${matches.length} suitable strategies`)
  }

  console.log(
    `Seeded ${strategies.length} strategies (${strategies.length - preserved.length} official published + ${preserved.length} preserved), ` +
      `${assetRows.length} assets, ${protocolRows.length} protocols, ${networkBySlug.size} networks, ${obsCount} observations.`
  )
  if (!coverageOk) {
    throw new Error("Market-phase coverage validation FAILED — every phase needs ≥3 strategies")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
