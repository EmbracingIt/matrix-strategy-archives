import type { SeedStrategy } from "./types"

/**
 * Matrix Strategy Archives — INITIAL OFFICIAL COLLECTION, part 1 of 3.
 *
 * STRATEGY_001 – STRATEGY_007 (records 008–019 live in the sibling files).
 *
 * Written to the documentation quality standard of the Accumulation LP
 * benchmark record (prisma/seed.ts): financial-research tone, no static
 * APY/return figures anywhere in permanent text — descriptions explain the
 * SOURCE of each return instead, because every rate in DeFi is variable.
 * Assets / protocols / networks are referenced by SYMBOL / SLUG strings; the
 * seed orchestrator resolves them to database rows.
 *
 * Phase-fit reasoning (Level-2 market conditions) follows the canonical
 * assignments from the collection spec, embedded in marketFit.explanation.
 */
export const records: SeedStrategy[] = [
  // ---------------------------------------------------------------------------
  // STRATEGY_001 — Accumulation LP
  // ---------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_001",
    name: "Accumulation LP",
    slug: "accumulation-lp",
    type: "Concentrated Liquidity",
    status: "PUBLISHED",
    objectives: ["accumulation", "liquidity"],
    summary:
      "Accumulate ETH during weak markets while earning trading fees inside a defined liquidity range.",
    description:
      "Accumulation LP is a concentrated liquidity strategy designed for investors who want to build ETH exposure during weak or ranging market conditions. Instead of buying spot at uncertain prices, you deposit ETH and USDC into a Uniswap V3 liquidity range positioned at and below the current price.\n\nWhile price stays inside the range, the position earns trading fees from every swap passing through it. If price falls through the range, the position automatically converts toward ETH as it moves down — effectively accumulating ETH at progressively lower prices, similar to a limit-order ladder. If price recovers through the range, the position converts back toward USDC, locking in the accumulated ETH at higher levels.\n\nThe strategy deliberately accepts one-directional impermanent loss (downward conversion) as the mechanism for accumulation, while trading fees and disciplined range selection compensate along the way. The downward conversion is the strategy, not an accident: the investor has chosen in advance to be rewarded with more ETH for the same capital if the market weakens. It is a patient, rules-based alternative to manual averaging that pays you to wait at your chosen entry zone.",
    marketFit: {
      regimes: ["BEAR", "SIDEWAYS"],
      scores: { BULL: 20, SIDEWAYS: 80, BEAR: 90 },
      secondaryRegimes: ["EARLY_RECOVERY", "LOW_VOL_COMPRESSION"],
      secondaryScores: { EARLY_RECOVERY: 95, LOW_VOL_COMPRESSION: 85 },
      explanation:
        "In bear and sideways markets, price tends to spend long stretches inside a defined range — exactly where concentrated liquidity earns the most fees per unit of risk. Downward moves convert the position into ETH at progressively lower cost, serving the accumulation goal, which is why the strategy scores highest in bear regimes (90). Within those regimes, Early Recovery (95) is close to its ideal condition: the market is improving but directional conviction is still unproven, and the range lets the investor keep acquiring ETH through residual weakness while fees offset the cost of waiting — rather than committing everything to one large directional entry. Low-Vol Compression (85) suits the position mechanically: a tight, stable trading range keeps the liquidity position active and continuously earning without repeated range moves or realized impermanent loss. In sideways regimes the same mechanics apply but accumulation happens more slowly (80). In a strong bull market the strategy underperforms simply holding ETH, because the position converts back to USDC early and caps upside (20).",
    },
    steps: [
      {
        title: "Deposit ETH and USDC",
        description:
          "Fund the strategy with an approximately 50/50 split of ETH and USDC. The USDC side provides the dry powder that converts into ETH if price moves down through the range.",
      },
      {
        title: "Select the liquidity range",
        description:
          "Define a concentrated price range at and below the current ETH price. A tighter range earns more fees but converts faster; a wider range behaves more like a broad limit ladder. Range width should reflect your volatility expectation and rebalancing appetite.",
      },
      {
        title: "Provide liquidity",
        description:
          "Deposit both assets into the ETH/USDC pool on Uniswap V3 within the selected range. Confirm the position and its fee tier before submitting.",
      },
      {
        title: "Monitor price relative to range",
        description:
          "Track where price sits inside the range. Fee earnings are highest when price actively crosses the middle of the range; the composition of the position shifts toward ETH near the bottom and toward USDC near the top.",
      },
      {
        title: "Rebalance under defined conditions",
        description:
          "If price exits the range downward and you want to keep accumulating, remove the position and re-create it lower (accepting the realized impermanent loss as the cost of accumulated ETH). If price exits upward and accumulation is complete, harvest and exit.",
      },
      {
        title: "Exit when conditions change",
        description:
          "Close the position when a confirmed bull regime makes passive ETH holding more attractive, when fee earnings no longer compensate for risk, or when your accumulation target has been reached. Exiting upward through the range is the strategy's payoff event — the ETH was both bought at progressively lower levels and earned fees along the way — so treat a clean exit as the plan completing, not a trade to squeeze.",
      },
    ],
    entryConditions: [
      "Market regime is bear or sideways with no confirmed trend reversal",
      "ETH price is at or above the top of your intended accumulation range",
      "You are comfortable holding ETH long-term if price falls through the range",
      "Sufficient capital to make gas and rebalancing costs negligible (roughly $2,000+ on mainnet)",
      "Trading fees in the selected pool are healthy relative to your position size",
    ],
    exitConditions: [
      "A confirmed bull-regime breakout with sustained momentum above your range",
      "Price exits the range upward and your ETH accumulation target is met",
      "You no longer want directional exposure to ETH",
      "Fee earnings no longer compensate for impermanent-loss risk",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The dominant risk is impermanent loss: if price crashes through the range quickly, the position is mostly ETH at the bottom and the accumulated size can show a marked loss versus the initial deposit. Smart contract risk in Uniswap V3 pools is real but the codebase is among the most battle-tested in DeFi. The strategy is unleveraged and has no liquidation risk, but it requires active monitoring and disciplined rebalancing. Rapid rebounds after you rebalance lower can also cause you to re-enter at worse prices.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "None — the position can be removed at any time, though removing mid-range realizes impermanent loss",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "MEDIUM",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$2,000",
      requiredHoldings: ["ETH", "USDC"],
      walletSetup: "Ethereum-compatible wallet (e.g. MetaMask, Rabby) with a small gas buffer",
      other:
        "Must be able to interact with Uniswap V3 on Ethereum mainnet and monitor the position at least weekly",
    },
    references: [
      {
        title: "Uniswap V3 Documentation",
        url: "https://docs.uniswap.org/",
        publisher: "Uniswap Labs",
        notes: "Concentrated liquidity, positions and fee tiers",
      },
      {
        title: "Uniswap V3 Announcement",
        url: "https://uniswap.org/blog/uniswap-v3",
        publisher: "Uniswap Labs",
        notes: "Design rationale for concentrated liquidity",
      },
      {
        title: "Impermanent Loss Explained",
        url: "https://academy.binance.com/en/articles/impermanent-loss-explained",
        publisher: "Binance Academy",
        notes: "Primer on LP divergence risk",
      },
    ],
    lastReviewedAt: "2026-09-10",
    depositAssets: ["ETH", "USDC"],
    exposureAssets: ["ETH", "USDC"],
    rewardAssets: [],
    networks: ["ethereum"],
    protocols: ["uniswap"],
  },

  // ---------------------------------------------------------------------------
  // STRATEGY_002 — Stablecoin DCA Into Crypto
  // ---------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_002",
    name: "Stablecoin DCA Into Crypto",
    slug: "stablecoin-dca-into-crypto",
    type: "Systematic Deployment",
    status: "PUBLISHED",
    objectives: ["accumulation", "growth"],
    summary:
      "Systematically deploy a stablecoin war chest into BTC, ETH and SOL on a predetermined schedule, keeping undeployed capital liquid and productive between tranches.",
    description:
      "Stablecoin DCA Into Crypto is a capital-allocation discipline for converting a stablecoin war chest into crypto exposure without betting on a single entry point. The investor defines a deployment plan up front — a total stablecoin budget, a target allocation across assets such as BTC, ETH and SOL, a tranche size, and a cadence — and then executes it mechanically. Between purchases, the undeployed stablecoin balance is not idle: it is held in conservative, liquid venues (for example a blue-chip money market) so the waiting capital itself stays productive. Execution runs through on-chain venues such as Uniswap on Ethereum or its L2s, or Jupiter on Solana, which makes each tranche a self-custodied, composable transaction rather than an exchange order.\n\nEconomically, the strategy is an entry-risk management tool rather than a yield strategy. Its return has two components: the modest income earned on the undeployed balance while it waits, and — far more importantly — the entry price distribution achieved on the deployed tranches. Replacing one large irreversible entry with many small staged ones converts a single timing decision into an averaged outcome: some tranches will execute at better prices than any lump-sum entry would have achieved, others at worse prices, and the cost basis lands near the average of the deployment window. The plan's value is psychological as much as financial: with sizes and dates fixed in advance, the investor cannot over-commit at cycle euphoria or freeze entirely during drawdowns.\n\nThe honest comparison is against lump-sum deployment. In markets that rise persistently from the moment of decision, lump-sum wins more often than not — staged purchases keep buying at increasing prices, and DCA knowingly pays that cost as insurance against entering at a local top. The disadvantages are equally real: many small executions accrue gas and swap costs, deployment through a V-shaped recovery buys progressively worse levels, and averaging into an asset that never recovers builds a position at prices the market may not revisit. The strategy's edge exists specifically when the path forward is volatile and directionally unclear — which is why it belongs to bear and sideways regimes rather than confirmed trends.\n\nWhat separates this from a naive recurring buy is that the stablecoin side is treated as a managed portfolio position: undeployed capital earns, remains withdrawable if the plan terminates, and is governed by a predetermined rule set rather than sentiment. It also differs fundamentally from Yield-Funded Accumulation — DCA consumes principal tranche by tranche until the stablecoin budget is spent, whereas yield-funded accumulation preserves the base and spends only its output. An investor uses this strategy when they want a controlled, scheduled transition into crypto exposure, and accepts that in a strong immediate uptrend it will lag a bolder single deployment.",
    marketFit: {
      regimes: ["BEAR", "SIDEWAYS"],
      scores: { BULL: 35, SIDEWAYS: 75, BEAR: 85 },
      secondaryRegimes: ["EARLY_RECOVERY"],
      secondaryScores: { EARLY_RECOVERY: 90 },
      explanation:
        "Bear regimes (85) are the classic habitat: deploying stablecoins into persistent weakness averages the entry price down across the accumulation window, while the undeployed balance stays safe and productive — the strategy is the disciplined form of buying a bear market without betting on its bottom. In sideways regimes (75) entries average around the range and the cost basis lands near its midpoint, with the stablecoin base earning while it waits. In bull regimes (35) the strategy still functions but structurally lags: staged purchases keep executing at rising prices, so a lump-sum entry at trend confirmation would have outperformed — the insurance-like cost of staging becomes pure drag. Early Recovery (90) is its strongest phase: conditions have improved enough to justify building exposure, but the recovery is unproven enough that gradual purchases dominate committing everything at once.",
    },
    steps: [
      {
        title: "Define the deployment plan before buying anything",
        description:
          "Fix the total stablecoin budget, the target allocation across BTC, ETH and SOL, the tranche size, the cadence, and the completion date in writing. The plan must be finalized before the first purchase so that sizing cannot bend to market sentiment later.",
      },
      {
        title: "Park undeployed capital productively",
        description:
          "Supply the stablecoin balance to a conservative, liquid venue such as a blue-chip money market. The waiting capital earns while remaining withdrawable on each tranche date, and the venue choice should prioritize liquidity depth over rate.",
      },
      {
        title: "Execute each tranche on schedule",
        description:
          "On each planned date, withdraw the tranche from the stablecoin venue and swap it into the target assets — through Uniswap on Ethereum or an L2, or Jupiter on Solana for the SOL leg. Batch executions if gas costs make frequent small swaps uneconomical.",
      },
      {
        title: "Apply pre-committed rules, not judgment",
        description:
          "If the plan includes modulation rules — accelerating modestly in deep drawdowns, pausing when predefined overheat conditions trigger — execute them mechanically. Otherwise the schedule stands regardless of headlines; discretionary overrides are how the plan dies.",
      },
      {
        title: "Track cost basis and execution quality",
        description:
          "Record the running average entry price versus the market price, and confirm that cumulative gas and swap costs remain a small fraction of deployed value. Rising execution costs are a signal to batch tranches or move to a cheaper network.",
      },
      {
        title: "Complete or terminate the plan",
        description:
          "When the final tranche executes, rebalance to the target asset weights if prices have drifted. If a predefined stop triggers — thesis invalidated or discipline failure — terminate the plan and preserve the remaining stablecoins rather than improvising a new one mid-stream.",
      },
    ],
    entryConditions: [
      "Market regime is bear, sideways, or early recovery — deploying into weakness or a range, not into a confirmed strong trend",
      "A written deployment plan exists: total budget, asset targets, tranche size, cadence and completion date fixed before the first purchase",
      "The stablecoin budget is genuinely allocable capital held (or parked) in a conservative venue — not emergency reserves",
      "Execution costs are amortized: tranche sizes large enough that gas and swap fees stay a small fraction of each purchase (L2 or Solana execution for smaller plans)",
      "You accept the lump-sum trade-off: in a persistent immediate uptrend, staged deployment will underperform a single entry",
    ],
    exitConditions: [
      "The deployment plan completes — final tranche executed and the allocation rebalanced to target weights",
      "A predefined stop triggers (investment thesis invalidated, or a breach of your own rules) — remaining stablecoins are preserved, not redeployed by improvisation",
      "Discipline breaks down — if you find yourself overriding the schedule emotionally, terminate the plan rather than distort it",
      "A confirmed strong bull makes the remaining tranches pure drag — accelerate completion only under a pre-committed rule, not impulse",
      "Cumulative execution costs prove materially higher than planned and erode deployed value",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The strategy's risks are behavioral and market-structural rather than mechanical — nothing here can liquidate. Deployed tranches carry full crypto asset volatility, and averaging into a declining asset systematically builds exposure at prices the market may never revisit: the discipline that protects entry timing does nothing for asset selection. The strategy's real failure mode is abandoning the plan — halting tranches after drawdowns (locking in the worst entries) or accelerating into euphoria (abandoning sizing rules) — which converts a rules-based deployment into emotional trading. The undeployed stablecoin balance carries its own second-order exposure for as long as it waits: the parking venue's smart-contract risk and stablecoin depeg tail risk, sized to the full remaining budget. Every tranche adds swap fees and gas, which too-frequent or too-small executions can erode materially.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "Undeployed balance is withdrawable at any time (instant while the parking venue's pool liquidity is available); deployed tranches are fully liquid spot positions",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "LOW",
      impermanentLoss: "NONE",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$500 (gas-optimal on L2; $2,000+ on Ethereum mainnet)",
      requiredHoldings: ["USDC", "USDT"],
      walletSetup:
        "Ethereum-compatible wallet (e.g. MetaMask, Rabby) for EVM deployment, plus a Solana wallet (e.g. Phantom) for SOL purchases via Jupiter",
      other:
        "Commitment to the written deployment plan; execution and review on the planned cadence (typically weekly or monthly)",
    },
    references: [
      {
        title: "What Is Dollar-Cost Averaging?",
        url: "https://academy.binance.com/en/articles/what-is-dollar-cost-averaging",
        publisher: "Binance Academy",
        notes: "DCA mechanics and the lump-sum trade-off",
      },
      {
        title: "Uniswap Documentation",
        url: "https://docs.uniswap.org/",
        publisher: "Uniswap Labs",
        notes: "On-chain swap execution for deployment tranches",
      },
      {
        title: "Jupiter",
        url: "https://jup.ag/",
        publisher: "Jupiter",
        notes: "Solana swap aggregation for the SOL leg",
      },
    ],
    lastReviewedAt: "2026-09-08",
    depositAssets: ["USDC", "USDT"],
    exposureAssets: ["BTC", "ETH", "SOL"],
    rewardAssets: [],
    networks: ["ethereum", "arbitrum", "base", "solana"],
    protocols: ["uniswap", "jupiter"],
  },

  // ---------------------------------------------------------------------------
  // STRATEGY_003 — Yield-Funded Accumulation
  // ---------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_003",
    name: "Yield-Funded Accumulation",
    slug: "yield-funded-accumulation",
    type: "Yield-Funded Accumulation",
    status: "PUBLISHED",
    objectives: ["yield", "accumulation"],
    summary:
      "Preserve a stablecoin principal in conservative lending while redirecting the yield it generates into BTC, ETH and SOL — accumulating crypto with return on capital, not the capital itself.",
    description:
      "Yield-Funded Accumulation builds crypto exposure using the output of capital rather than the capital itself. The principal — a stablecoin base the investor intends to preserve — stays deployed inside a conservative yield strategy, typically supplying USDC or USDT to a battle-tested money market such as Aave or a tightly curated Morpho market. Only the interest that this base generates is periodically harvested and redirected into the target accumulation assets: BTC, ETH, SOL, or another chosen exposure.\n\nThe economics are those of a conversion engine. One side produces a low-volatility income stream backed by overcollateralized borrower demand; the other side converts each harvest into high-volatility, high-upside assets. Over time the portfolio drifts from a pure stablecoin position toward a growing crypto allocation that was financed entirely by return — the accumulated position is effectively house money. The pace is structurally bounded: a modest lending rate applied to a stable base generates limited absolute yield, so accumulation is gradual by construction. That slowness is the feature, not the flaw — it imposes a sizing discipline that lump-sum deployment and aggressive DCA never enforce.\n\nThe critical distinction is against Stablecoin DCA Into Crypto. DCA spends the stash: each tranche permanently reduces the stablecoin base until the budget is exhausted. Yield-funded accumulation never touches the base — the stablecoin principal remains intact and productive, and only its interest is converted. In exchange for that preservation, the strategy accumulates far more slowly than DCA on equal capital, because the tranche size is the yield rate times the base, not a freely chosen fraction of it. An investor chooses between them by asking which resource they are willing to spend — principal or return.\n\nThe strategy fits prolonged sideways and bear conditions precisely because the capital base never takes directional risk while accumulation still happens — weakness in the target assets actually improves the prices at which each yield harvest converts. Its known weakness is a strong bull market: capital preserved in stablecoins forfeits the trend, and the small accumulated crypto position cannot close the gap. In early recovery it offers deliberately conservative participation: most capital stays productive and protected while generated yield gradually rotates into exposure.",
    marketFit: {
      regimes: ["BEAR", "SIDEWAYS"],
      scores: { BULL: 50, SIDEWAYS: 80, BEAR: 85 },
      secondaryRegimes: ["EARLY_RECOVERY"],
      secondaryScores: { EARLY_RECOVERY: 85 },
      explanation:
        "In bear regimes (85) the strategy's separation of concerns is most valuable: the stablecoin principal never takes the drawdown while yield keeps converting into progressively cheaper accumulation assets — the base is preserved and the crypto position grows through the weakness. In sideways regimes (80) both halves operate normally: the lending base produces a steady income stream and harvested yield converts at range-bound prices. In bull regimes (50) the strategy works but lags badly: capital preserved in stablecoins forfeits the trend, and the small accumulated position cannot close the gap — the cost of conservatism dominates. Early Recovery (85) fits well because most capital remains productive and protected while generated yield is gradually redirected into exposure — participation in the recovery without betting the base on it.",
    },
    steps: [
      {
        title: "Deposit the stablecoin principal into a conservative venue",
        description:
          "Supply the USDC or USDT base to Aave's core market or a curated Morpho market. This venue choice is the strategy's principal risk decision — prioritize battle-tested risk parameters and deep liquidity over headline rate.",
      },
      {
        title: "Set a harvest threshold and cadence",
        description:
          "Let interest accrue until it crosses a threshold that makes gas and swap costs negligible per harvest — for example a fixed dollar amount or a percentage of the base, checked on a monthly or quarterly cadence. The threshold is a cost decision, not a return target: harvesting too often lets execution costs eat the tranche, while harvesting too rarely leaves generated yield sitting idle instead of converting.",
      },
      {
        title: "Harvest the interest only",
        description:
          "Withdraw exactly the accrued yield from the lending position, leaving the principal untouched and still earning. If the venue makes partial withdrawal awkward, withdraw the full amount and immediately redeploy the principal in the same action.",
      },
      {
        title: "Convert harvested yield into the target assets",
        description:
          "Swap the harvest through Uniswap into the chosen BTC/ETH/SOL split as defined by your accumulation rule. Keep the split mechanical — the strategy's discipline lives in rules, not in tranche-by-tranche judgment.",
      },
      {
        title: "Hold the accumulated position simply",
        description:
          "Keep accumulated assets in spot custody or upside-preserving venues (such as liquid staking). Avoid redeploying them into risk that undermines the conservative premise of the strategy — the crypto side is the payoff, not a second yield engine.",
      },
      {
        title: "Review the venue periodically",
        description:
          "Monitor lending rates, utilization extremes, and venue health on the harvest cadence. Rotate the principal to a different conservative venue if its risk profile deteriorates — the base is too large a share of the portfolio to be sentimental about.",
      },
    ],
    entryConditions: [
      "A stablecoin principal you intend to preserve — this is a capital base, not a deployment budget to be spent",
      "A conservative lending venue selected with battle-tested risk parameters, deep liquidity and an acceptable current rate",
      "Accumulation target and asset split rule defined in advance (e.g. fixed BTC/ETH/SOL weights per harvest)",
      "A harvest threshold set high enough that gas and swap costs are negligible per conversion",
      "Realistic pace expectations: accumulation speed is bounded by the yield rate on the base — this strategy is slow by construction",
    ],
    exitConditions: [
      "The accumulation target is reached, or the accumulated position has grown large enough to change the portfolio's risk profile — re-evaluate deliberately",
      "The lending venue's risk profile deteriorates (rate collapse, utilization extremes, governance or oracle stress) — rotate the principal or exit entirely",
      "Sustained rate compression makes the conversion engine ineffective — restructure rather than let the strategy idle",
      "The principal is needed for spending or a different deployment",
      "The regime turns strongly bullish and you consciously choose to deploy principal directly — a deliberate strategy change, never a drift into dipping into the base",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The structure concentrates principal risk in exactly one place: the conservative stablecoin venue. A smart-contract failure, an extreme utilization episode, or a stablecoin depeg event hits the entire capital base — the accumulated crypto position is the small, protected piece, not the exposed one, so venue selection matters more here than in almost any other strategy. The second failure mode is behavioral drift: when accumulation feels slow, the operator is tempted to harvest early or dip into principal for extra tranches, silently converting the strategy into an undisciplined DCA with extra steps. Rate variability is a structural drag rather than an event risk — lending income can compress for extended periods and stall accumulation entirely, while the deployed tranches still carry full crypto volatility on their (small) size. Each harvest adds routine execution risk — swap slippage and gas — that a sensible threshold keeps negligible.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "Interest is withdrawable on demand (instant while pool liquidity is available); the principal stays in place by design — withdrawing it ends the strategy",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "LOW",
      impermanentLoss: "NONE",
      assetVolatility: "MEDIUM",
    },
    requirements: {
      minCapital: "$1,000",
      requiredHoldings: ["USDC", "USDT"],
      walletSetup: "Ethereum-compatible wallet (e.g. MetaMask, Rabby)",
      other:
        "Periodic harvest cadence (monthly or quarterly) and basic monitoring of the lending venue's rate and health; discipline to never fund tranches from principal",
    },
    references: [
      {
        title: "Aave Documentation",
        url: "https://docs.aave.com/",
        publisher: "Aave",
        notes: "Supply mechanics, aTokens and variable rate accrual",
      },
      {
        title: "Morpho",
        url: "https://morpho.org/",
        publisher: "Morpho",
        notes: "Curated lending marketplace overview",
      },
      {
        title: "Morpho Documentation",
        url: "https://docs.morpho.org/",
        publisher: "Morpho",
        notes: "Market curation and risk parameters",
      },
    ],
    lastReviewedAt: "2026-09-06",
    depositAssets: ["USDC", "USDT"],
    exposureAssets: ["ETH", "BTC", "SOL"],
    rewardAssets: ["BTC", "ETH", "SOL"],
    networks: ["ethereum", "arbitrum"],
    protocols: ["aave", "morpho", "uniswap"],
  },

  // ---------------------------------------------------------------------------
  // STRATEGY_004 — Blue-Chip Asset Lending
  // ---------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_004",
    name: "Blue-Chip Asset Lending",
    slug: "blue-chip-asset-lending",
    type: "Lending",
    status: "PUBLISHED",
    objectives: ["yield", "growth"],
    summary:
      "Supply BTC, ETH or wstETH you already intend to hold into overcollateralized lending markets, earning a variable incremental return on assets that would otherwise sit idle.",
    description:
      "Blue-Chip Asset Lending applies to an investor whose baseline decision — holding BTC, ETH or staked-ETH exposure — has already been made. Rather than leaving those assets idle in a wallet, they are supplied to overcollateralized money markets such as Aave, Compound, or Morpho's curated markets. The position keeps full exposure to the asset's price while earning a variable supply rate set by borrowing demand against it.\n\nThe mechanics run on the borrower side of the market. Borrowers must post collateral worth materially more than they borrow, and their positions are liquidated if their collateral value falls too far relative to their debt — this overcollateralization is what protects suppliers from borrower default. Supply rates float with utilization: when heavy leverage demand draws down the available pool, rates rise; in quiet markets they compress. Interest accrues continuously to a receipt token (an aToken or cToken) that grows in value, requiring no action to compound.\n\nA point of frequent confusion worth making explicit: the lender does not face liquidation. Liquidation is a borrower-side mechanism, triggered by the ratio of a borrower's own collateral to their own debt. A supplied asset carries no debt against it — nothing about its price falling causes a supplier's position to be closed or seized. This is lending, not leveraged borrowing; the leveraged cousin of this strategy — posting an asset as collateral to borrow against it — is a fundamentally different and higher-risk playbook (see Borrow Against BTC).\n\nThe return is incremental and the risk is not incremental: the full volatility of the underlying asset remains, and a supply rate will never offset a serious drawdown — lending monetizes a hold decision, it does not hedge it. Rates can compress toward zero when leverage demand evaporates, extreme utilization can delay withdrawals temporarily, and the venue adds smart-contract risk to the entire deposit. In bull markets the strategy is doubly favored — utilization is typically strong while the asset itself appreciates — and in BTC-led phases it lets the holder keep the leading asset working rather than rotating out of it prematurely.",
    marketFit: {
      regimes: ["BULL", "SIDEWAYS"],
      scores: { BULL: 85, SIDEWAYS: 75, BEAR: 55 },
      secondaryRegimes: ["BTC_LED_EXPANSION"],
      secondaryScores: { BTC_LED_EXPANSION: 90 },
      explanation:
        "In bull regimes (85) the strategy is doubly favored: leverage demand typically keeps utilization and supply rates healthy while the supplied asset itself appreciates — lending return stacks on top of price exposure. In sideways regimes (75) the supply rate does most of the work, monetizing a holding period that would otherwise earn nothing. In bear regimes (55) the strategy still functions mechanically, but borrowing demand often softens as leverage unwinds, compressing rates exactly when the asset's drawdown dominates any lending income — the return is incremental and never offsets price risk. BTC-Led Expansion (90) is its standout phase: BTC and other blue chips remain the assets the market wants to hold and borrow against, so the strategy keeps the leading asset working — generating incremental lending yield — without prematurely rotating out of it.",
    },
    steps: [
      {
        title: "Confirm the hold decision precedes the lending decision",
        description:
          "Only supply assets that are already part of your intended long-term holdings. Lending is a way to monetize a hold decision — it is never a reason to acquire an asset in the first place.",
      },
      {
        title: "Choose the venue and market deliberately",
        description:
          "Compare Aave core markets, Compound, and Morpho's curated markets on supply rate, liquidity depth, supply caps, and risk parameters. The venue holds your entire deposit, so its risk profile matters more than a marginal rate difference.",
      },
      {
        title: "Supply the asset and receive the accruing receipt token",
        description:
          "Deposit WBTC, ETH, or wstETH into the chosen market. The receipt token's value grows continuously as interest accrues — no claiming or compounding action is required.",
      },
      {
        title: "Monitor utilization and the rate environment",
        description:
          "Track the supply rate and the market's utilization. Expect variability with leverage demand, and compare rates across venues on a periodic cadence — rotating when divergence materially rewards it.",
      },
      {
        title: "Watch supply caps and venue health",
        description:
          "Deposits can be blocked when a market's supply cap saturates, and utilization extremes can delay withdrawals temporarily. Monitor oracle integrity, governance disputes, and risk-parameter changes on the venue.",
      },
      {
        title: "Withdraw or rotate when the hold ends",
        description:
          "Redeem the receipt token when you sell the underlying exposure, rotate to a materially better venue, or redeploy the asset into another upside-preserving yield source. Withdrawals are immediate while pool liquidity is available.",
      },
    ],
    entryConditions: [
      "You already hold and intend to keep BTC, ETH or wstETH exposure — the hold decision is made independently of lending",
      "A conservative venue with deep liquidity, sensible risk parameters, and available supply capacity has been selected",
      "Current supply rates are meaningful relative to alternatives and to the monitoring effort required",
      "The expected holding horizon is long enough to amortize gas costs on entry and exit",
      "You understand the rate is variable and utilization-driven — this is not a fixed income stream",
    ],
    exitConditions: [
      "The underlying hold decision ends — you sell the asset exposure itself",
      "Supply rates compress to levels that no longer justify the venue's smart-contract risk — rotate venues or hold idle",
      "Venue risk deteriorates: oracle issues, governance disputes, or utilization extremes delaying withdrawals",
      "A materially better upside-preserving yield venue appears for the same asset — a rotation, not an exit of exposure",
      "Withdrawal liquidity becomes impaired — exit early as a precaution rather than waiting for stress to resolve",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The defining asymmetry: the return is incremental, the risk is not. The full volatility of BTC, ETH or wstETH remains — a supply rate never offsets a serious drawdown, so the strategy must be understood as monetizing a hold decision rather than hedging it. Venue risk sits on the entire deposit: smart-contract failure, oracle malfunction, or governance capture can impair principal, and supply rates are utilization-driven — they compress toward zero precisely when leverage demand evaporates, which correlates with market stress. Extreme utilization can delay withdrawals temporarily, and supply caps can block additional deposits at the worst moment. wstETH adds a wrapper layer: the LST carries its own smart-contract, socialized slashing, and secondary-market discount risks stacked on top of the lending venue's. Critically, none of this includes liquidation — liquidation is a borrower-side mechanism, and a supplied, unborrowed asset carries no debt to be liquidated against.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "Instant while pool liquidity is available; extreme utilization can delay redemptions temporarily, and saturated supply caps can block new deposits",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "NONE",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$500",
      requiredHoldings: ["ETH", "WBTC", "wstETH"],
      walletSetup: "Ethereum-compatible wallet (e.g. MetaMask, Rabby)",
      other:
        "Periodic (e.g. monthly) review of supply rates and venue health; ability to read utilization, supply caps and risk parameters before supplying",
    },
    references: [
      {
        title: "Aave Documentation",
        url: "https://docs.aave.com/",
        publisher: "Aave",
        notes: "Supply mechanics, utilization and the rate model",
      },
      {
        title: "Compound Documentation",
        url: "https://docs.compound.finance/",
        publisher: "Compound Labs",
        notes: "cTokens, collateral factors and money-market mechanics",
      },
      {
        title: "Wrapped Bitcoin (WBTC)",
        url: "https://wbtc.network/",
        publisher: "WBTC DAO",
        notes: "BTC on Ethereum: minting, custody and proof of reserves",
      },
    ],
    lastReviewedAt: "2026-09-04",
    depositAssets: ["ETH", "WBTC", "wstETH"],
    exposureAssets: ["ETH", "BTC", "WBTC", "wstETH"],
    rewardAssets: [],
    networks: ["ethereum", "base"],
    protocols: ["aave", "morpho", "compound"],
  },

  // ---------------------------------------------------------------------------
  // STRATEGY_005 — Borrow Against BTC
  // ---------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_005",
    name: "Borrow Against BTC",
    slug: "borrow-against-btc",
    type: "Collateralized Borrowing",
    status: "PUBLISHED",
    objectives: ["liquidity", "growth", "advanced"],
    summary:
      "Unlock stablecoin liquidity by borrowing against BTC (via WBTC) collateral instead of selling it — a leveraged position whose discipline is conservative LTV management.",
    description:
      "Borrow Against BTC converts held BTC into spending power without selling it. The investor wraps BTC to WBTC, supplies it as collateral on a money market such as Aave or Morpho, and borrows stablecoins against it at a conservative fraction of the collateral's value. The BTC thesis stays intact — the investor remains fully exposed to BTC's upside — while the borrowed USDC funds liquidity needs or other deployments, and in some jurisdictions may avoid the taxable disposal that a spot sale would trigger (verify locally; this is not tax advice).\n\nThe mechanics are those of an overcollateralized loan with a built-in enforcement mechanism. The borrowed amount accrues interest continuously at a variable rate. The loan's safety is measured by loan-to-value (LTV) — borrowed amount against collateral value — and every market enforces a liquidation threshold: if BTC falls far enough that LTV crosses the threshold, the protocol liquidates part or all of the collateral, usually with a penalty, to rebalance the position. This is emphatically not free liquidity: it is a leveraged position whose cost is interest, whose risk is liquidation, and whose discipline is collateral management.\n\nConservative LTV management is the strategy. Opening at 25–50% LTV — half or less of what the venue might permit — leaves a wide buffer between the starting position and the liquidation threshold, sized to survive a deep BTC drawdown without forced action. A disciplined operator monitors health factor continuously, holds a prepared response (repay, or top up collateral) for LTV drift, and treats a sharp BTC reversal as a signal to deleverage voluntarily rather than a reason to test the buffer. The position that requires no reaction for months is the one being run correctly.\n\nThe strategy's natural habitat is a bull market, and specifically BTC-led expansion: collateral appreciates while the debt stays fixed, so LTV improves on its own and the effective interest cost shrinks relative to the growing position. In sideways markets the interest cost grinds with no collateral tailwind to offset it. In bear markets the structure becomes defensive at best and catastrophic at worst — falling collateral pushes LTV toward the threshold, and forced liquidation realizes permanent loss of hard-accumulated BTC at the worst point in the cycle.",
    marketFit: {
      regimes: ["BULL"],
      scores: { BULL: 90, SIDEWAYS: 60, BEAR: 20 },
      secondaryRegimes: ["BTC_LED_EXPANSION"],
      secondaryScores: { BTC_LED_EXPANSION: 95 },
      explanation:
        "In bull regimes (90) the structure works with the market: collateral appreciates while the debt stays fixed, LTV improves on its own, and the interest cost shrinks relative to the growing BTC position. In sideways regimes (60) the loan still functions but nothing offsets the interest cost — the position bleeds slowly with no collateral tailwind, so tighter LTVs and shorter horizons are warranted. In bear regimes (20) the strategy is close to unrunnable: falling collateral continuously pushes LTV toward the liquidation threshold, and the operator is forced into defensive repayment and collateral top-ups — or watches the position liquidated at the cycle low. BTC-Led Expansion (95) is the ideal phase — stablecoin liquidity is unlocked without selling the very asset leading the expansion — provided the primary risk, liquidation on a sharp BTC reversal, is managed with a conservative LTV.",
    },
    steps: [
      {
        title: "Wrap BTC and fund the position",
        description:
          "Convert BTC to WBTC through a minting service or trusted exchange route, and transfer it to the lending venue's network (Ethereum or Base). Confirm the wrapped amount before proceeding — the WBTC layer now sits between you and native BTC.",
      },
      {
        title: "Choose the venue and market deliberately",
        description:
          "Compare Aave and Morpho markets on borrow rates, liquidation thresholds, oracle design, and risk parameters. The liquidation threshold relative to your intended LTV defines your actual safety buffer — read it before you borrow.",
      },
      {
        title: "Set a conservative target LTV before borrowing",
        description:
          "Decide the opening LTV — 25–50% at most — and compute the buffer to the liquidation threshold under a 30–50% BTC drawdown scenario. If the buffer would be consumed by that scenario, open smaller or not at all.",
      },
      {
        title: "Borrow stablecoins against the collateral",
        description:
          "Execute the borrow for the planned amount only. The venue will permit more; drawing the maximum eliminates the buffer that makes the position survivable.",
      },
      {
        title: "Deploy or hold the borrowed capital per plan",
        description:
          "Put the borrowed USDC to its defined purpose — liquidity for expenses, or a planned deployment. Remember the debt accrues interest continuously against a volatile asset while it is out.",
      },
      {
        title: "Monitor LTV continuously",
        description:
          "Configure alerts on health factor or LTV well above the danger zone and check the position at least every few days. If LTV drifts upward, execute the prepared response — repay or add collateral — and treat a sharp BTC reversal as a signal to deleverage voluntarily.",
      },
      {
        title: "Repay and close the position",
        description:
          "Repay the debt plus accrued interest, reclaim the WBTC collateral, and unwrap back to BTC. Closing cleanly at the end of a successful trend — rather than under duress — is the strategy's intended ending.",
      },
    ],
    entryConditions: [
      "Regime is confirmed bull — ideally BTC-led expansion — with genuine conviction on the collateral's trend",
      "Opening LTV at or below 25–50%, with a computed buffer to the liquidation threshold that survives a 30–50% BTC drawdown without forced action",
      "The borrowed amount has a defined purpose and a defined repayment source",
      "Monitoring is operational: LTV/health-factor alerts configured well above the danger zone, with a check cadence of at least every few days",
      "A prepared contingency exists — capital to repay or additional collateral ready, so a drawdown never forces selling BTC at the bottom",
      "Borrow rates and the expected holding period make the continuous interest cost acceptable",
    ],
    exitConditions: [
      "The BTC trend breaks or the regime turns — deleverage voluntarily, before the market forces it",
      "The loan's purpose is fulfilled and repayment is possible — close the position cleanly and reclaim the collateral",
      "LTV escalates past your maintenance band and cannot be defended — repay with the prepared source rather than gamble on a rebound",
      "Borrow rates spike to levels that make the position uneconomical to hold",
      "Venue risk deteriorates — oracle anomalies, governance disputes, prolonged utilization stress — repay and exit as a precaution",
    ],
    risk: {
      overallRisk: "HIGH",
      explanation:
        "The defining risk is forced liquidation of hard-accumulated BTC at the cycle's worst moment. If BTC falls far enough that LTV crosses the venue's liquidation threshold, the protocol seizes and sells collateral — typically with a liquidation penalty — realizing permanent loss exactly at the price low. The second structural risk is the interest cost itself: borrow rates are variable and can spike with utilization, so a position that was serviceable at opening can become expensive during precisely the stress that endangers it. Gaps matter: a violent BTC move can push LTV through the threshold faster than a human can respond, and oracle delay or malfunction adds its own failure mode. WBTC adds a custodial and bridging layer on top (wrapped-asset and proof-of-reserves risk), and the lending market adds smart-contract risk. Every mitigation — conservative opening LTV, continuous monitoring, a prepared repayment source — exists to keep liquidation a theoretical outcome rather than a realized one.",
      leverageUsed: true,
      leverageAmount: "Typically 25–50% LTV against BTC collateral",
      liquidationExposure: "HIGH",
      withdrawalRestrictions:
        "Borrowed funds are freely usable; collateral is locked while debt is open and withdrawable only within the remaining LTV buffer",
      lockupPeriod: "Collateral remains committed until the debt is repaid",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "NONE",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$5,000",
      requiredHoldings: ["WBTC"],
      walletSetup: "Ethereum-compatible wallet (e.g. MetaMask, Rabby) with a gas buffer on the lending network",
      other:
        "Near-daily position monitoring with LTV/health-factor alerts configured; a prepared repayment or collateral top-up plan; a solid understanding of liquidation mechanics before opening the position",
    },
    references: [
      {
        title: "Aave Documentation",
        url: "https://docs.aave.com/",
        publisher: "Aave",
        notes: "Borrowing mechanics, health factor and liquidations",
      },
      {
        title: "Aave Risk Framework",
        url: "https://aave.com/docs/",
        publisher: "Aave",
        notes: "Risk parameters, liquidation thresholds and collateral policy",
      },
      {
        title: "Wrapped Bitcoin (WBTC)",
        url: "https://wbtc.network/",
        publisher: "WBTC DAO",
        notes: "BTC as DeFi collateral: minting, custody and reserves",
      },
    ],
    lastReviewedAt: "2026-09-09",
    depositAssets: ["WBTC"],
    exposureAssets: ["BTC", "WBTC", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "base"],
    protocols: ["aave", "morpho"],
  },

  // ---------------------------------------------------------------------------
  // STRATEGY_006 — Bull-Market Hold + Yield
  // ---------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_006",
    name: "Bull-Market Hold + Yield",
    slug: "bull-market-hold-yield",
    type: "Directional Yield",
    status: "PUBLISHED",
    objectives: ["growth", "yield"],
    summary:
      "Hold core BTC, ETH and SOL exposure through strong trends, layering on only upside-preserving yield — liquid staking and conservative lending — rather than strategies that cap the trend.",
    description:
      "Bull-Market Hold + Yield is a strategy of restraint. Its core philosophy: during strong directional trends, strategies that cap upside systematically underperform simple holding. Liquidity provision that converts the asset away as price rises, covered calls that sell away the best outcomes, and distribution ladders that trim into strength all trade the market's dominant payoff — the trend itself — for a modest incremental yield. This strategy makes holding the primary decision and layers on only yield sources that preserve nearly all of the upside.\n\nIn practice the portfolio is deliberately simple. Core spot BTC, ETH and SOL positions are held through the trend. The ETH core converts to a liquid staking token (wstETH) and the SOL core to mSOL or jitoSOL, capturing native staking return while remaining essentially one-to-one with the underlying asset's price. Genuinely idle tranches — capital that is not part of the directional core — are supplied to blue-chip lending markets. Every yield source chosen shares one property: it does not sell the asset as price rises.\n\nThe arithmetic explains why this can outperform aggressive yield strategies during expansion. In a strong bull market, price return dwarfs any yield: a strategy that captures the trend fully and adds a small staking or lending return compounds both, while a strategy that converts or trims away a large fraction of upside to earn a few points of fee or premium yield gives up precisely the component doing the heavy lifting. The opportunity cost of a capped upside dominates the incremental yield — and the longer and stronger the trend, the wider the gap. Staking and lending returns are small but additive rather than subtractive; that distinction is the whole strategy.\n\nWhat the investor accepts is full directional risk: drawdowns of half or more from local highs remain ordinary for these assets, and the thin yield layer provides no meaningful cushion — surviving a bear turn requires exiting, not earning through it. The yield stack does add second-order risks (staking-protocol risk, LST liquidity in stress) for modest incremental return, and the discipline demanded is unusual: resisting the urge to make the portfolio work harder with capped-upside structures at exactly the moment premiums look most tempting. It underperforms in sideways markets, where a pure hold earns nothing and range-optimized strategies do the work.",
    marketFit: {
      regimes: ["BULL"],
      scores: { BULL: 95, SIDEWAYS: 50, BEAR: 20 },
      secondaryRegimes: ["BTC_LED_EXPANSION", "ALT_EXPANSION"],
      secondaryScores: { BTC_LED_EXPANSION: 85, ALT_EXPANSION: 90 },
      explanation:
        "In bull regimes (95) the strategy is close to its theoretical optimum: the full trend is captured and staking and lending returns compound on top of it. In sideways regimes (50) the yield layer still earns, but the directional core chops — hold plus thin yield is not an optimized answer to a range, where liquidity and range strategies do the work. In bear regimes (20) the strategy should not be running: full directional exposure takes the entire drawdown and the yield layer provides no meaningful cushion. Within the bull cycle, BTC-Led Expansion (85) keeps the priority on preserving directional upside — yield components are chosen only where they cannot cap the trend. Alt Expansion (90) raises the score further: during broad expansion the largest opportunity cost is capping upside, so core positions are maintained and incremental yield is added wherever it does not sell the asset.",
    },
    steps: [
      {
        title: "Establish the core directional positions",
        description:
          "Allocate spot BTC, ETH and SOL sized to conviction and drawdown tolerance. This core is the strategy's return engine — its sizing should assume a 50% drawdown from local highs is survivable without forced selling.",
      },
      {
        title: "Convert the ETH and SOL cores to liquid staking tokens",
        description:
          "Swap ETH to wstETH via Lido, and SOL to mSOL or jitoSOL via Marinade or Jito. Verify each LST's secondary-market liquidity depth against your position size before committing the full core.",
      },
      {
        title: "Put genuinely idle tranches to work conservatively",
        description:
          "Supply only capital outside the directional core to blue-chip lending markets. The idle tranche is the piece that may be harvested or redeployed; the core is not.",
      },
      {
        title: "Refuse upside-capping structures while the trend is intact",
        description:
          "No mid-trend distribution LPs, no covered calls on the core — however rich the premiums look. This restraint is the strategy: every capped-upside structure added during the trend trades away the payoff the portfolio exists to capture.",
      },
      {
        title: "Monitor trend and phase health",
        description:
          "Review regime confirmation and the market phase (BTC-led versus broad alt expansion) periodically. The yield layer itself needs no active management — the monitoring exists to inform the eventual hand-off.",
      },
      {
        title: "Hand off at the top, not before",
        description:
          "When late-bull distribution signals appear — euphoric sentiment, deteriorating momentum, blow-off behavior — rotate deliberately into distribution-oriented strategies. That regime belongs to them; holding through it belongs to no one.",
      },
    ],
    entryConditions: [
      "A bull regime is confirmed, with the phase (BTC-led or broad alt expansion) identified",
      "Core position sizes tolerate a 50%+ drawdown from local highs without forced selling",
      "LST liquidity is verified — secondary-market depth for wstETH, mSOL or jitoSOL is adequate for your position size",
      "You commit to the discipline of not capping upside mid-trend, however tempting premiums become",
      "The horizon is measured in months — the strategy needs the trend's full length to pay",
    ],
    exitConditions: [
      "The trend or regime breaks — capital preservation now outranks participation",
      "Late-bull distribution signals appear (euphoric sentiment, deteriorating momentum, blow-off price behavior) — hand off to distribution strategies",
      "LST or venue risk deteriorates materially — sustained discount to the underlying, or protocol stress",
      "A drawdown exceeds your tolerance — de-risk deliberately rather than average blindly",
      "Personal liquidity needs force partial liquidation of the core",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The dominant risk is directional and unavoidable: the portfolio runs full crypto beta, and drawdowns of half or more from local highs are ordinary for these assets — the staking and lending layer is far too thin to cushion a real bear turn, so regime exit, not yield, is the only defense. The yield stack adds second-order risks on top of that exposure: liquid staking introduces protocol smart-contract risk, socialized validator slashing, and a secondary-market discount that tends to widen exactly when liquidity is most needed; lending venues add their own smart-contract and utilization risks on the idle tranches. A minor impermanent-loss exposure appears only if small LP components are used around the portfolio's edges. No leverage and no liquidation exist anywhere in the structure. The subtlest risk is behavioral: boredom with just holding during long trends pushes investors into capped-upside structures at precisely the wrong moment — this strategy's discipline is doing less, not more.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "LST positions are liquid via market swap at any time (price may include a small discount in stressed conditions); exact-value exit uses the native unstake queue and takes days",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "LOW",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$1,000",
      requiredHoldings: ["ETH", "BTC", "SOL"],
      walletSetup:
        "Ethereum-compatible wallet for the BTC/ETH core, plus a Solana wallet (e.g. Phantom) for SOL staking via Marinade or Jito",
      other:
        "Quarterly portfolio review; the discipline to keep the yield layer upside-preserving and to refuse capped-upside structures mid-trend",
    },
    references: [
      {
        title: "Lido Documentation",
        url: "https://docs.lido.fi/",
        publisher: "Lido",
        notes: "wstETH mechanics and staking reward accrual",
      },
      {
        title: "Marinade Finance",
        url: "https://marinade.finance/",
        publisher: "Marinade",
        notes: "SOL liquid staking via mSOL",
      },
      {
        title: "Jito Network",
        url: "https://www.jito.network/",
        publisher: "Jito",
        notes: "SOL liquid staking with MEV-boosted staking rewards",
      },
    ],
    lastReviewedAt: "2026-09-02",
    depositAssets: ["ETH", "BTC", "SOL"],
    exposureAssets: ["ETH", "BTC", "SOL"],
    rewardAssets: [],
    networks: ["ethereum", "solana"],
    protocols: ["aave", "lido", "marinade", "jito"],
  },

  // ---------------------------------------------------------------------------
  // STRATEGY_007 — ETH Liquid Staking
  // ---------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_007",
    name: "ETH Liquid Staking",
    slug: "eth-liquid-staking",
    type: "Liquid Staking",
    status: "PUBLISHED",
    objectives: ["yield", "growth"],
    summary:
      "Earn native Ethereum staking rewards while keeping a liquid, DeFi-compatible staked-ETH position.",
    description:
      "ETH Liquid Staking converts idle ETH into a productive, liquid staking position. You deposit ETH into a liquid staking protocol such as Lido and receive a rebasing or rate-accruing representative token (stETH or its wrapped form wstETH) that captures consensus and execution rewards, net of validator and protocol fees.\n\nThe key advantage over native staking is liquidity: the staked representative trades freely and can be deployed as collateral, paired in liquidity pools, or sold — no 26-hour exit queue required for most practical purposes. The key advantage over simply holding ETH is a compounding reward stream sourced directly from Ethereum's protocol-level issuance to validators, without adding directional leverage.\n\nThe trade-offs are a set of second-order risks: the staked token can trade at a discount to ETH in stressed markets, the protocol adds a smart-contract layer on top of the beacon chain, and slashing events are socialized across the staking pool. None of these typically dominate the strategy's ETH price exposure — the position is still, first and foremost, a long-ETH position. What liquid staking changes is not the direction of the bet but its productivity: the same ETH exposure earns while it waits, and the token remains composable across DeFi for collateral, pairing or sale.",
    marketFit: {
      regimes: ["BULL", "SIDEWAYS"],
      scores: { BULL: 90, SIDEWAYS: 75, BEAR: 40 },
      secondaryRegimes: ["ALT_EXPANSION", "BTC_LED_EXPANSION"],
      secondaryScores: { ALT_EXPANSION: 90, BTC_LED_EXPANSION: 80 },
      explanation:
        "Staking rewards stack best on top of price appreciation, making bull regimes the natural home for the strategy (90). In sideways markets the reward stream is the main return and does the heavy lifting (75). In bear markets the strategy still earns, but capital preservation usually argues for exiting to stables — and the staked token can trade at a discount exactly when liquidity is most wanted (40). Within the bull cycle, Alt Expansion (90) is the strongest phase: as capital rotates from BTC toward ETH, liquid staking preserves directional ETH exposure while generating native staking return and retaining the DeFi liquidity that composability rewards. BTC-Led Expansion (80) is also strong — holding staked ETH through the BTC-led phase preserves exposure ahead of the expected rotation without demanding that ETH outperform immediately.",
    },
    steps: [
      {
        title: "Deposit ETH into the liquid staking protocol",
        description:
          "Submit ETH through the protocol's staking interface. The protocol routes deposits to a diversified set of professional validators.",
      },
      {
        title: "Receive the liquid staking token",
        description:
          "You receive wstETH (or stETH), which represents your staked ETH plus accumulated rewards. wstETH's value per token rises over time as rewards compound.",
      },
      {
        title: "Hold or deploy the staked position",
        description:
          "The token can simply be held, or used as collateral in lending markets, paired in liquidity pools, or allocated to other yield venues — keeping the staking yield running underneath. However it is deployed, the position remains first and foremost a long-ETH exposure: composability changes where the token sits, not what it is.",
      },
      {
        title: "Monitor exchange rate and market price",
        description:
          "Track the wstETH/ETH rate (which should grind upward) and the secondary-market price versus ETH (which can deviate in stressed conditions). A widening discount is the early signal to prefer the unstake queue over a market swap, or to reconsider the venue entirely.",
      },
      {
        title: "Exit via swap or unstake queue",
        description:
          "For immediate liquidity, swap the staked token back to ETH on a DEX/CEX. For exact-value exit, use the protocol's unstake queue and wait for processing.",
      },
    ],
    entryConditions: [
      "You have a long-term bullish or neutral thesis on ETH",
      "You are comfortable with the protocol's smart-contract and slashing risks",
      "You want staking yield without sacrificing liquidity",
      "Your time horizon is months or longer",
    ],
    exitConditions: [
      "You lose conviction on ETH and want to reduce exposure",
      "You want to realize gains into stablecoins",
      "The protocol's risk profile deteriorates materially",
      "You need immediate liquidity and the discount to swap is unacceptable (use the unstake queue instead)",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "Primary risk remains ETH price volatility. Additional layers: smart-contract risk in the staking protocol and its validator set, potential slashing socialized across the pool, temporary depeg of the liquid staking token versus ETH in stressed markets, and queue delays for exact-value exits. Reward rates themselves are variable, set by network participation rather than by contract. None of these involve leverage or liquidation — the position cannot be forcibly closed — and none of the second-order layers changes the core fact that the position is still, first and foremost, a long-ETH position.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "Instant via market swap (price may include a small discount); exact-value exit through the native unstake queue takes days",
      lockupPeriod: "No hard lockup, but exiting at full value requires the unstake queue",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "NONE",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "Any (gas-optimal above roughly $500)",
      requiredHoldings: ["ETH"],
      walletSetup: "Ethereum-compatible wallet",
      other:
        "Ability to swap staked-ETH tokens on secondary markets if immediate liquidity is needed",
    },
    references: [
      {
        title: "Lido Documentation",
        url: "https://docs.lido.fi/",
        publisher: "Lido",
        notes: "wstETH mechanics, staking rewards and unstake queue",
      },
      {
        title: "Ethereum Staking Overview",
        url: "https://ethereum.org/en/staking/",
        publisher: "ethereum.org",
        notes: "How consensus rewards work at the protocol level",
      },
      {
        title: "Staking Withdrawals",
        url: "https://ethereum.org/en/staking/withdrawals/",
        publisher: "ethereum.org",
        notes: "Beacon-chain exit queue and withdrawal mechanics",
      },
    ],
    lastReviewedAt: "2026-09-07",
    depositAssets: ["ETH"],
    exposureAssets: ["wstETH", "ETH"],
    rewardAssets: [],
    networks: ["ethereum"],
    protocols: ["lido"],
  },
]
