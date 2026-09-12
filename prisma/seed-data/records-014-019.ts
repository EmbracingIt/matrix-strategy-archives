import type { SeedStrategy } from "./types"

/**
 * INITIAL OFFICIAL STRATEGY COLLECTION — part 3 (STRATEGY_014–019).
 *
 * Written to the documentation standard of the Accumulation LP benchmark
 * (prisma/seed.ts): financial-research tone, no static APY/return claims in
 * permanent text (rates are variable — these records describe the SOURCE of
 * return instead), strategy-specific risk explanations, and market-fit
 * reasoning that names where each strategy weakens, not just where it works.
 *
 * Assets / protocols / networks are referenced by SYMBOL / SLUG strings —
 * the seed script resolves them to database rows.
 */
export const records: SeedStrategy[] = [
  // -------------------------------------------------------------------------
  // STRATEGY_014 — Capital-Preservation DeFi Portfolio
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_014",
    name: "Capital-Preservation DeFi Portfolio",
    slug: "capital-preservation-defi-portfolio",
    type: "Defensive Portfolio",
    status: "PUBLISHED",
    objectives: ["capital-preservation", "yield"],
    summary:
      "Preserve capital across a diversified book of conservative DeFi lending and staking venues, accepting a modest variable yield as the price of strict loss-avoidance discipline.",
    description:
      "Capital-Preservation DeFi Portfolio is a portfolio strategy rather than a single protocol position: the object being managed is an entire book of conservative DeFi exposures whose first job is to avoid losing money and whose second job is to earn a modest, variable yield while doing it. Capital is spread across stablecoin money-market lending (Aave, Morpho, Compound, Spark), a deliberately small liquid-staked ETH sleeve (Lido), and the networks that host them (Ethereum, Base, Arbitrum). The design question is never \"which position pays most\" but \"how does the whole book survive any single failure\".\n\nReturn comes from three deliberately low-risk sources: the variable lending spread paid by overcollateralized borrowers on the stablecoin sleeves, savings-rate style yield on liquid stable reserves (Spark pairs its money market with exactly this), and staking rewards on the capped ETH sleeve. Each source is variable and modest by construction — the book takes whatever these markets pay rather than reaching for incentive-driven or leveraged yield, because reach-for-yield is precisely what a preservation portfolio exists to avoid.\n\nFive construction disciplines do the actual work. Stablecoin diversification splits the stable sleeve between USDC and USDT so no single issuer's failure is fatal. Protocol diversification spreads the book across independent codebases, governance processes and oracle stacks. Liquidity tiers are mapped explicitly before deployment: instantly redeemable money-market withdrawals; same-day liquidity via DEX exit for the staked-ETH sleeve; and queued redemption (native unstaking) as the backstop. Concentration limits cap exposure per venue, per stablecoin and per network, so a cap breach — not a feeling — triggers rebalancing. Risk budgeting assigns each sleeve a maximum tolerable loss, and the volatile ETH sleeve is sized so that even a severe ETH drawdown stays inside the total budget.\n\nThe trade-off is stated up front: in exchange for drawdown discipline the portfolio accepts structurally lower expected returns than directional strategies, and it will visibly lag in a confirmed bull market — that lag is the cost of the insurance, not a defect. It also underperforms whenever risk appetite is broadly rewarded. And the record must be honest: DeFi cannot be made literally risk-free. Smart-contract failure, stablecoin depeg, governance malfunction and self-custody error all remain; diversification reduces the chance that any one of them ends the book, not the chance that none occurs. Correlation in systemic events is real — several \"independent\" venues can degrade in the same week.",
    marketFit: {
      regimes: ["BEAR", "SIDEWAYS"],
      scores: { BULL: 45, SIDEWAYS: 80, BEAR: 95 },
      secondaryRegimes: ["CAPITULATION_DELEVERAGING"],
      secondaryScores: { CAPITULATION_DELEVERAGING: 90 },
      explanation:
        "Bear and sideways regimes are where preservation dominates the return objective: drawdowns are the main enemy, conservative lending yield keeps compounding through them, and the discipline of the whole book matters more than any single position's upside. In sideways markets the yield stream is the majority of total return, which suits a defensive allocation. In a confirmed bull market the strategy is structurally laggy — capital sits in low-beta stablecoin sleeves and a capped ETH allocation while directional assets run, and the opportunity cost grows the longer the trend persists. Under Capitulation / Deleveraging conditions the diversification thesis is at its strongest: spreading capital across conservative lending venues, liquid stable reserves and lower-risk exposures reduces dependence on one directional asset or one protocol exactly when systemic stress correlates failures across the market.",
    },
    steps: [
      {
        title: "Set the risk budget and liquidity map",
        description:
          "Before deploying anything, decide the maximum tolerable loss per sleeve, the share of capital that must be redeemable instantly versus same-day versus queued, and the total volatile-asset allowance. Every later allocation is checked against this budget rather than against yield comparisons — yield is the second question, not the first.",
      },
      {
        title: "Split stablecoin capital across issuers and venues",
        description:
          "Divide the stablecoin sleeve between USDC and USDT so no single issuer failure is fatal, then distribute the sleeve across Aave, Morpho, Compound and Spark so no single codebase, governance process or oracle stack carries the whole book. Keep every venue and every stablecoin below its concentration cap from day one.",
      },
      {
        title: "Deploy the lending sleeves",
        description:
          "Supply the stablecoin allocations to the chosen money markets on Ethereum, Base or Arbitrum. Prefer deep, audited, long-operating markets over new or heavily incentivized ones, and treat extreme utilization behavior as a venue-quality signal when deciding where the larger shares sit.",
      },
      {
        title: "Size and fund the minority ETH sleeve",
        description:
          "Convert only the budgeted share of the portfolio into Lido staked ETH (stETH/wstETH) so the book keeps a capped participation in ETH upside plus staking yield. The sleeve's exit paths are mapped in advance: same-day DEX exit at a spread, with native unstaking (a queued redemption) as the backstop.",
      },
      {
        title: "Enforce concentration limits on drift",
        description:
          "Rebalance whenever any venue, stablecoin or network breaches its cap — after yield accrual, new deposits or price moves in the ETH sleeve. Trimming a sleeve that has grown feels counterproductive; it is the core discipline of the strategy and the reason the caps were written down in advance.",
      },
      {
        title: "Monitor venue health and rotate under stress",
        description:
          "Track utilization spikes, oracle anomalies, governance proposals and stablecoin depeg spreads across every venue in the book. Exit a sleeve the moment its venue degrades, and re-tier liquidity if the redemption horizon the portfolio must serve changes.",
      },
    ],
    entryConditions: [
      "Level-1 regime is confirmed bear or sideways, with no confirmed high-momentum bull in progress",
      "Capital of at least $10,000, so it can be split across issuers, venues and networks without fragmentation or gas costs dominating the outcome",
      "A written liquidity plan exists: what share must be redeemable instantly, what can wait a day, and what may queue",
      "Venue due diligence completed for every protocol used (audit history, time in production, governance maturity, oracle stack)",
      "Explicit acceptance that the portfolio will lag directional assets in a bull market — that lag is the price of the drawdown discipline",
    ],
    exitConditions: [
      "A confirmed bull regime makes the opportunity cost of the defensive allocation unacceptable — rotate a bounded share into directional strategies rather than the whole book",
      "Any venue shows degradation (pinned utilization, oracle anomalies, governance capture, exploit reports) — exit that sleeve immediately",
      "A stablecoin sleeve shows depeg or issuer-level stress beyond transitory noise — redeem and rotate to the alternative issuer",
      "Lending yields across all venues fall below your tolerance threshold against the protocol risk being carried, with no recovery",
      "Personal liquidity needs shorten the horizon the liquidity tiers were designed for",
    ],
    risk: {
      overallRisk: "LOW",
      explanation:
        "Rated LOW in aggregate, but \"low\" means small and diversified, not absent — DeFi cannot be made literally risk-free. Per venue, smart-contract risk is LOW (long-operating, audited money markets and the largest liquid-staking protocol), yet the portfolio's aggregate smart-contract exposure is the SUM of its sleeves: diversification spreads idempotent single-protocol failure but cannot remove the market-wide component, and in systemic events correlations between venues, stablecoins and networks converge toward one — several \"independent\" sleeves can degrade simultaneously. Stablecoin issuer risk sits above protocol risk: USDC and USDT diversify each other's idiosyncratic failure, but both remain claims on the same dollar system in a broad crisis. The stETH sleeve contributes capped ETH volatility by construction and a modest swap-spread cost on same-day exit. There is no leverage, no liquidation and no impermanent loss anywhere in the book; the residual risks are execution discipline (sleeves drifting past concentration limits unnoticed) and liquidity-tier mismatch — being forced to redeem queued-tier capital for an instant-tier obligation.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "None contractual — but the liquidity tiers define how fast capital can actually be redeemed: instant money-market withdrawals, same-day DEX exit for the staked-ETH sleeve, queued native unstaking as backstop",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "LOW",
      impermanentLoss: "NONE",
      assetVolatility: "LOW",
    },
    requirements: {
      minCapital: "$10,000",
      requiredHoldings: ["USDC", "USDT", "ETH"],
      walletSetup:
        "Ethereum-compatible wallet (e.g. MetaMask, Rabby) with gas funds on each network used (Ethereum, Base, Arbitrum)",
      other:
        "Periodic review discipline — at least monthly plus event-driven checks on venue health; ability to redeem and rotate capital across three networks; no active-management expectation beyond rebalancing on cap breaches or venue stress",
    },
    references: [
      { title: "Aave Documentation", url: "https://docs.aave.com/", publisher: "Aave", notes: "Money-market supply, utilization and withdrawal mechanics" },
      { title: "Morpho", url: "https://morpho.org/", publisher: "Morpho Labs", notes: "Lending marketplace design — isolated, curatable markets" },
      { title: "Spark", url: "https://spark.fi/", publisher: "Spark Protocol", notes: "Money market paired with a savings-rate style stable reserve" },
      { title: "Lido Documentation", url: "https://docs.lido.fi/", publisher: "Lido", notes: "stETH/wstETH redemption paths and exit queues" },
    ],
    lastReviewedAt: "2026-08-24",
    depositAssets: ["USDC", "USDT", "ETH"],
    exposureAssets: ["USDC", "USDT", "ETH"],
    rewardAssets: [],
    networks: ["ethereum", "base", "arbitrum"],
    protocols: ["aave", "morpho", "compound", "spark", "lido"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_015 — Range-Bound Yield LP
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_015",
    name: "Range-Bound Yield LP",
    slug: "range-bound-yield-lp",
    type: "Concentrated Liquidity",
    status: "PUBLISHED",
    objectives: ["liquidity", "yield"],
    summary:
      "Earn concentrated-liquidity trading fees from a range deliberately centered on an established sideways trading band — a thesis position, not a generic LP.",
    description:
      "Range-Bound Yield LP is a concentrated liquidity strategy whose entire thesis is that price stays predominantly inside an established trading range. The mechanics are standard concentrated liquidity; the decision-making is not. The range is deliberately centered on the midpoint of a validated range — unlike Accumulation LP, which places its range below spot to convert into ETH on weakness, or Distribution LP, which places it above spot to sell into strength. This strategy wants no net conversion at all: it wants price to oscillate.\n\nThe economic return is trading-fee flow. A centered concentrated position acts as a market maker to the two-way traffic inside the range, earning the pool's fee on every swap it absorbs in either direction while inventory turns back and forth without net drift. The strategy is attractive when a pair has demonstrably settled into a range that real volume keeps respecting — the fee stream is then collected continuously against a position that, until the thesis breaks, experiences no directional trend.\n\nFour design levers determine results. Range placement: center on the established midpoint only after the range has been respected for weeks — a freshly drawn range is a guess, not a thesis. Width: wider ranges are more durable across volatility expansion and earn less densely; narrower ranges earn more per swap but are exited sooner — realized volatility must justify the width chosen, or the position is simply wrong. Fee tier selection: match the tier to where the pair's volume actually trades on Uniswap (Ethereum or Base) or Aerodrome (Base) — a high-fee tier with no flow earns nothing at any width. Rebalancing rules: pre-commit when to recenter (confirmed breakout, drift threshold), because every recenter realizes impermanent loss and ad-hoc moves under stress are how LPs quietly bleed.\n\nThe trade-off is symmetric thesis risk: a break in either direction converts the position the wrong way — downward into ETH during a decline, upward into USDC while the market runs away. That is what the low bull and bear scores mean: the strategy is not weak because it is poorly built, it is weak because its single assumption failing IS the loss scenario. An investor uses it rather than holding the asset outright because a genuinely range-bound asset pays nothing to hold — this position collects the range's fee flow instead, and accepts the range break as the defined risk.",
    marketFit: {
      regimes: ["SIDEWAYS"],
      scores: { BULL: 35, SIDEWAYS: 95, BEAR: 35 },
      secondaryRegimes: ["LOW_VOL_COMPRESSION"],
      secondaryScores: { LOW_VOL_COMPRESSION: 95 },
      explanation:
        "The strategy's entire edge is conditional on the sideways thesis: two-way oscillation around a stable midpoint keeps the position active, turning inventory back and forth while collecting fees on every pass — the regime where centered concentrated liquidity produces its best fee-to-risk ratio. In a bull market the position converts toward USDC as price exits the top, ending fee income and capping upside participation at exactly the wrong time. In a bear market the same mechanics convert the position toward ETH on the way down, passively accumulating a falling asset the strategy never wanted to accumulate. During Low-Volatility Compression the fit peaks: a stable trading range allows the concentrated liquidity to remain active and earn fees without repeatedly moving out of range — no recentering churn, no realized impermanent loss, just continuous fee accrual.",
    },
    steps: [
      {
        title: "Validate the range before deploying capital",
        description:
          "Identify an established trading range on the pair — support and resistance respected over weeks with an identifiable midpoint. The strategy only exists if the range exists; deploying into a freshly volatile chart is range speculation, not range provisioning.",
      },
      {
        title: "Choose the venue and fee tier",
        description:
          "Compare where the pair's volume actually trades: Uniswap fee tiers on Ethereum or Base, or Aerodrome's concentrated pools on Base. Pick the tier where real flow concentrates — a high-fee tier with thin volume earns nothing regardless of how well the range is placed.",
      },
      {
        title: "Set range placement and width",
        description:
          "Center the range on the established midpoint rather than on today's price, and set width as a multiple of realized volatility so ordinary oscillation stays inside. Wider ranges survive volatility expansion and earn less densely; narrower ranges earn more and break sooner — choose against measured volatility, not hoped-for calm.",
      },
      {
        title: "Open the position",
        description:
          "Deposit ETH and USDC in the ratio the range requires at the current price and mint the position. Confirm the pool, fee tier and range bounds before signing — a mis-typed bound on a narrow range is a materially different position.",
      },
      {
        title: "Monitor range integrity and fee accrual",
        description:
          "Track price relative to the bounds, uncollected fees and pool volume. Fee accrual while price oscillates around the midpoint is the thesis working; repeated brushes against one bound are the early warning that the range is breaking.",
      },
      {
        title: "Rebalance only by pre-set rule",
        description:
          "Recenter after a confirmed breakout and the establishment of a new range, or after a pre-defined drift threshold — never on every wiggle. Each recenter realizes impermanent loss and pays gas, so the rule must balance durability against churn cost.",
      },
    ],
    entryConditions: [
      "Confirmed sideways regime at Level-1, and a pair-specific range that has held for weeks with an identifiable midpoint",
      "Realized volatility over the recent lookback fits inside the proposed width with room to spare",
      "Price is currently near the range midpoint — opening at a bound buys imbalance risk at the worst point",
      "The chosen fee tier shows real, sustained volume for the pair on the chosen venue",
      "Position size is large enough that fee income dominates gas and recentering costs (roughly $2,000 minimum, lower on Base)",
    ],
    exitConditions: [
      "A confirmed close beyond the range on volume — the core thesis is invalidated",
      "Realized volatility expands so the width no longer contains ordinary oscillation",
      "Volume migrates to another fee tier or venue, collapsing fee income against a static range",
      "Regime classification shifts to confirmed bull or bear with follow-through",
      "Recentering costs have consumed more of the fee income than the plan allows",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The dominant risk is thesis failure: the strategy is a bet that the range holds, and a confirmed break converts the position symmetrically — downward, the position ends holding ETH into a decline; upward, it ends in USDC having forfeited the move. Impermanent loss is rated MEDIUM because the centered placement diversifies the direction of divergence but not the event itself, and narrower widths convert inventory faster. Range width is a two-edged lever: tightening it raises fee density and the frequency of exits at the same time. Smart-contract risk is MEDIUM across the Uniswap and Aerodrome deployments — mature codebases, but separate contract systems, and the Base venue adds its own sequencing and bridge environment. There is no leverage and no liquidation anywhere in the construction; the operational risks are recentering discipline (each recenter realizes impermanent loss, and improvising recentering under stress compounds it) and mainnet gas consuming fee income at small position sizes.",
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
      walletSetup: "Ethereum-compatible wallet (e.g. MetaMask, Rabby) with a small gas buffer on the chosen network",
      other:
        "Able to monitor the position at least weekly and to execute a pre-committed recentering rule without improvisation; comfortable reading realized volatility before choosing a width",
    },
    references: [
      { title: "Uniswap V3 Documentation", url: "https://docs.uniswap.org/", publisher: "Uniswap Labs", notes: "Concentrated liquidity, positions and fee tiers" },
      { title: "Uniswap V3 Announcement", url: "https://uniswap.org/blog/uniswap-v3", publisher: "Uniswap Labs", notes: "Design rationale for concentrated liquidity" },
      { title: "Aerodrome", url: "https://aerodrome.finance/", publisher: "Aerodrome", notes: "Base's central liquidity venue with concentrated pools" },
    ],
    lastReviewedAt: "2026-08-31",
    depositAssets: ["ETH", "USDC"],
    exposureAssets: ["ETH", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "base"],
    protocols: ["uniswap", "aerodrome"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_016 — Concentrated Liquidity Provision
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_016",
    name: "Concentrated Liquidity Provision",
    slug: "concentrated-liquidity-provision",
    type: "Concentrated Liquidity",
    status: "PUBLISHED",
    objectives: ["liquidity", "yield"],
    summary:
      "The general concentrated-liquidity archetype: deploy a token pair inside a bounded price range for multiplied capital efficiency, accepting inventory transformation and amplified divergence risk.",
    description:
      "Concentrated Liquidity Provision is the general archetype behind every range-based LP strategy in this archive — the umbrella record for the mechanics themselves. You deposit a token pair into an automated market maker pool, but instead of spreading that liquidity across every possible price (the full-range behavior of earlier AMM designs), you bound it to an active price range of your choosing. Accumulation LP and Range-Bound Yield LP are specialized placements of this machinery (the range deliberately below spot, the range deliberately centered on a validated band); this record documents the machinery itself, direction-neutral, with the placement decision left open.\n\nThe reason to concentrate is capital efficiency. A full-range position must quote prices from zero to infinity, which leaves almost all deposited capital idle at any given moment; concentrating the same capital into the band where price actually trades multiplies the depth available to swappers there — the same fee flow is captured with a fraction of the capital, or far more fee flow with the same capital. Efficiency, not yield, is the intrinsic property; yield follows from where price actually spends time.\n\nFee generation and inventory transformation are two faces of the same mechanism. While price sits inside the range, every swap executes against your liquidity and leaves its fee behind, accruing in both assets. Simultaneously the pool continuously converts your inventory as price moves: toward the base asset (ETH) as price falls toward the lower bound, toward the quote asset (USDC) as price rises toward the upper. This is not a side effect of fee earning — it is the market-making function itself. The LP is systematically buying weakness and selling strength inside its band.\n\nTwo mechanical consequences define the risk. Out-of-range behavior: once price exits the band, the position is entirely one asset and dormant — it stops earning, stops converting, and simply waits until price returns or you re-place it. Impermanent loss: because the position is forced to sell the appreciating asset as it appreciates, LP value diverges from a pure hold whenever price moves away from entry — and concentration amplifies this divergence exactly because the inventory conversion completes within the band rather than across an infinite range. The investor accepts both in exchange for fee income on otherwise idle capital and a passive market-making role; the strategy underperforms simply holding the winning asset in any strong trend, in either direction.",
    marketFit: {
      regimes: ["SIDEWAYS"],
      scores: { BULL: 50, SIDEWAYS: 95, BEAR: 50 },
      secondaryRegimes: ["LOW_VOL_COMPRESSION"],
      secondaryScores: { LOW_VOL_COMPRESSION: 90 },
      explanation:
        "Sideways conditions are the neutral home of the archetype: price traversing a bounded region keeps liquidity active and inventory turning, which is where fee generation concentrates. In a bull market the position converts toward the quote asset as price climbs and ends out of range holding USDC — it underperforms simply holding ETH, though it collects fees along the way. In a bear market the same mechanics convert the position toward the base asset and it rides the drawdown — fees partially offset the decline, but the position ends fully in the falling asset. The middling bull and bear scores reflect the archetype's deliberate direction-agnosticism: it can be placed in any regime, but a persistent trend is its structural weakness in both directions. During Low-Volatility Compression the fit strengthens materially: lower realized volatility makes tighter ranges practical, increasing capital efficiency and fee generation per unit of deposited capital — the position can sit narrowly where price actually trades without being run through.",
    },
    steps: [
      {
        title: "Select the pair, venue and fee tier",
        description:
          "Choose the market you will make (e.g. ETH/USDC), the deployment network — Ethereum mainnet for depth, Arbitrum or Base for materially lower gas — and the fee tier where that pair's volume actually concentrates. The venue decision is a gas-versus-flow trade-off, not a preference.",
      },
      {
        title: "Choose the range against a capital-efficiency budget",
        description:
          "Decide width by weighing efficiency (narrow earns more per dollar deployed) against durability (wide survives longer between out-of-range episodes and needs less maintenance). A range far narrower than realized volatility is a price prediction, not an allocation.",
      },
      {
        title: "Deposit the pair and mint the position",
        description:
          "Fund the position with both assets in the ratio the current price within the range demands. From the moment of minting, the position is live market-making inventory — its composition belongs to the pool's price path, not to your intentions.",
      },
      {
        title: "Track composition and accrued fees",
        description:
          "Monitor where price sits inside the range and how the ETH/USDC balance shifts as it moves. Fees accrue in both assets and compound only when harvested and re-deployed — an unharvested position is a depreciating asset earning nothing on its earnings.",
      },
      {
        title: "Follow a pre-committed out-of-range policy",
        description:
          "Decide before volatility arrives what happens when price exits the band: wait for return (dormant but intact), re-place the range around the new price (realizes impermanent loss), or close (finalizes the outcome). Ad-hoc decisions made under stress are the classic failure mode of this archetype.",
      },
      {
        title: "Harvest, re-place and record outcomes",
        description:
          "Collect fees on a schedule, re-place ranges by rule rather than by impulse, and keep a running ledger of realized fee income against realized impermanent loss. That ledger — not the pool's headline statistics — is the strategy's true performance line.",
      },
    ],
    entryConditions: [
      "The pair is not in a confirmed persistent trend — range or oscillation conditions dominate at the pool level",
      "The chosen pool's fee tier carries demonstrable volume relative to your intended position size",
      "Range width is chosen against measured realized volatility, not against hoped-for stability",
      "Gas and maintenance costs are amortizable: roughly $2,000 or more on Ethereum mainnet, materially lower on Arbitrum or Base",
      "You can commit to active position monitoring and to an out-of-range policy decided in advance",
    ],
    exitConditions: [
      "Price exits the range and the pre-committed policy for that scenario is to close rather than re-place",
      "Fee revenue collapses due to volume migration to another tier or venue, or a regime change in the pair's activity",
      "A confirmed directional trend makes holding the appreciating asset strictly better than LP-ing it",
      "Realized impermanent loss persistently outruns realized fee income across successive re-placements",
      "Monitoring capacity or capital priorities change",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "Impermanent loss is rated HIGH deliberately: concentration is the strategy's defining amplifier. A full-range position drifts toward the appreciating asset slowly; a concentrated one completes most of its inventory conversion within the band, so value diverges from a pure hold far faster whenever price leaves the range — the LP ends fully in the underperforming asset at the worst moment. The second mechanical risk is out-of-range dormancy: the position stops earning exactly when markets are most active, and re-placing it after the move both realizes the divergence loss and risks repeating it immediately. Smart-contract risk is MEDIUM — the Uniswap V3 core is among the most battle-tested contracts in DeFi, with residual exposure concentrated in periphery code, L2 deployments, and operator configuration errors (wrong fee tier, wrong bounds, wrong network). There is no leverage and no liquidation. Maintenance gas, fee-harvesting discipline and the temptation to override the out-of-range policy under stress are the operational frictions.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "None — the position can be removed at any time, though removing after price has left the range finalizes the impermanent loss",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "HIGH",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$2,000 (higher on Ethereum mainnet; materially lower on L2)",
      requiredHoldings: ["ETH", "USDC"],
      walletSetup: "Ethereum-compatible wallet with gas on the chosen network (mainnet buffer materially larger than on Arbitrum or Base)",
      other:
        "Able to monitor price relative to the range at least weekly and to execute the pre-committed out-of-range policy; L2 deployment materially lowers the capital and gas bar",
    },
    references: [
      { title: "Uniswap V3 Documentation", url: "https://docs.uniswap.org/", publisher: "Uniswap Labs", notes: "Concentrated liquidity mechanics, ranges and fee tiers" },
      { title: "Uniswap V3 Announcement", url: "https://uniswap.org/blog/uniswap-v3", publisher: "Uniswap Labs", notes: "Capital-efficiency rationale for bounded ranges" },
      { title: "Impermanent Loss Explained", url: "https://academy.binance.com/en/articles/impermanent-loss-explained", publisher: "Binance Academy", notes: "Primer on LP divergence risk" },
    ],
    lastReviewedAt: "2026-08-29",
    depositAssets: ["ETH", "USDC"],
    exposureAssets: ["ETH", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "arbitrum", "base"],
    protocols: ["uniswap"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_017 — Delta-Neutral LP
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_017",
    name: "Delta-Neutral LP",
    slug: "delta-neutral-lp",
    type: "Delta-Neutral",
    status: "PUBLISHED",
    objectives: ["yield", "hedging", "advanced"],
    summary:
      "Earn concentrated-liquidity trading fees while carrying an offsetting ETH short that suppresses — but never eliminates — the position's directional exposure.",
    description:
      "Delta-Neutral LP pairs a concentrated liquidity position with an offsetting short designed to reduce net directional delta. The construction starts from USDC: you provide ETH/USDC liquidity into a tight Uniswap range to harvest trading fees — sourcing the ETH side by conversion or by borrowing it — then neutralize the directional risk by borrowing ETH against USDC collateral on a lending market (Aave or Morpho) and selling the borrowed ETH, or by carrying the borrowed ETH directly inside the LP with the debt itself as the offset. The intended result is a position whose net value barely moves with price while fee income accrues.\n\nIn practice the hedge is dynamic, not static. As price moves, the LP position's composition shifts and its delta drifts; the short must be rebalanced to stay meaningful. The LP's delta is a curved quantity — it changes fastest near the middle of the range and flattens toward the bounds — so any fixed hedge size is a point estimate of a moving target, and hedge basis (the gap between what the short offsets and what the LP actually is) accumulates between rebalances.\n\nThe economics are a race between two continuous streams. Fee income arrives irregularly with pool volume and accrues in both assets; carry — borrow interest on the short leg, gas, and rebalancing slippage — is paid continuously. The strategy only earns while realized fees exceed total carry, and borrowing conditions can change independently of pool volume, so the ledger must be watched rather than assumed.\n\nThis is an actively-managed, execution-sensitive strategy for experienced operators, and the honest description matters: it is not risk-free and it is not perfectly neutral. Done well, it isolates fee income from market direction. Done poorly, it inherits the failure modes of both legs at once — imperfect hedging, negative carry, and a borrow whose health factor degrades in rallies — plus the operational burden of keeping all of them synchronized.",
    marketFit: {
      regimes: ["SIDEWAYS"],
      scores: { BULL: 60, SIDEWAYS: 95, BEAR: 60 },
      secondaryRegimes: ["LOW_VOL_COMPRESSION", "HIGH_VOLATILITY_CHOP"],
      secondaryScores: { LOW_VOL_COMPRESSION: 85, HIGH_VOLATILITY_CHOP: 90 },
      explanation:
        "Sideways is the sweet spot: price oscillates inside the LP range generating maximal fees while the short leg stays cheap and stable, and the hedge keeps drift within what periodic rebalancing can track. In a bull market the strategy is survivable but stressed — the hedge sells away the rally, the borrowed-ETH debt grows against stable collateral, and rebalancing costs rise exactly when fee flow is best. In a bear market the hedge truncates the downside conversion that would wreck an unhedged LP, but choppy rebounds force hedge churn and the carry ledger often sours. Under Low-Volatility Compression the strategy monetizes trading activity while carrying minimal directional exposure — with no persistent trend, neutrality is easiest to hold and cheapest to maintain. Under High-Volatility Chop the fit is strong: large two-way moves create outsized fee opportunities, while the hedge reduces the directional exposure that would otherwise dominate an LP position.",
    },
    steps: [
      {
        title: "Fund the position and pair the venues",
        description:
          "Start from USDC on Ethereum or Arbitrum, and pair a Uniswap ETH/USDC pool with a lending market (Aave or Morpho) where ETH can be borrowed against USDC collateral. Venue pairing is decided up front because the whole construction depends on both legs living on reachable, liquid venues.",
      },
      {
        title: "Establish the LP leg",
        description:
          "Provide ETH/USDC liquidity in a tight range around the current price in a high-volume, high-fee-tier pool. The ETH side can be sourced by converting part of the USDC or by borrowing the ETH outright; the tighter the range, the denser the fees and the faster the delta drifts.",
      },
      {
        title: "Establish the short leg",
        description:
          "Borrow ETH against USDC collateral on the lending market and sell the borrowed ETH — or deposit the borrowed ETH straight into the LP and carry the debt as the offset. Size the short to the LP position's current delta and leave a deliberate collateral buffer above the borrow's liquidation threshold.",
      },
      {
        title: "Monitor net delta and health factor together",
        description:
          "As price moves, the LP's composition shifts while the debt stays fixed, so net delta reappears; a rising ETH price simultaneously inflates the debt against stable collateral and pushes the borrow toward its liquidation threshold. The two gauges must be read as one picture.",
      },
      {
        title: "Rebalance within tolerance bands",
        description:
          "When net delta breaches the band, adjust the short — repay or borrow ETH — or re-place the range; top up collateral when the health factor approaches its threshold. Rebalancing frequency trades hedge accuracy against transaction cost, and the band is where that trade-off is encoded.",
      },
      {
        title: "Run the carry ledger",
        description:
          "Borrow interest accrues continuously while fee income accrues irregularly; track both on a fixed schedule. The strategy only earns while realized fees exceed total carry — borrow interest plus gas plus rebalancing slippage — and that inequality can flip without the position looking any different on screen.",
      },
      {
        title: "Unwind in the correct order",
        description:
          "Remove the LP position and harvest fees first, then buy back and repay the ETH debt, then settle remaining balances. Reversing the order creates a moment of concentrated unhedged exposure at exactly the time you are closing the strategy.",
      },
    ],
    entryConditions: [
      "Sideways regime confirmed with genuine two-way flow in the target pool",
      "Pool fee volume is high relative to your intended position size",
      "ETH borrow rates on the chosen market are clearly below the expected fee yield of the range, with a margin for error",
      "Demonstrated experience operating both concentrated liquidity positions and collateralized borrows",
      "At least $10,000 of capital so gas, spread and rebalancing costs stay small relative to income",
    ],
    exitConditions: [
      "A trending market emerges in either direction and the hedge becomes a persistent drag or a liability",
      "Carry costs exceed realized fee income for a sustained period",
      "Borrow utilization spikes on the lending market make the short leg expensive or precarious to maintain",
      "Health-factor management demands more attention than your operation can reliably supply",
      "A materially better deployment for the hedged capital appears",
    ],
    risk: {
      overallRisk: "HIGH",
      explanation:
        "The strategy is HIGH risk because it must be right about many moving parts at once. Hedge basis risk comes first: the short offsets a point estimate of an exposure that is actually curved — the LP's delta changes as price moves (gamma) — so the book is never exactly neutral and the residual accumulates between rebalances. Funding and borrow costs run continuously against irregular fee income; a carry-negative stretch silently erodes capital. Execution risk lands at the worst moments: hedge adjustments lag fast markets, and rebalancing into slippage locks in small losses that compound. The LP leg itself still suffers impermanent loss — the hedge offsets price exposure, not the divergence cost of range-based inventory conversion. The residual liquidation path is narrow but real: the borrow is ETH debt against stablecoin collateral, so a sharp sustained rally inflates the debt and erodes the health factor; if collateral top-ups lag (congestion, attention gaps) or the LP leg's value collapses under a severe range-break while the debt remains, the position can be liquidated. Finally, two protocols must behave correctly at the same time — the exchange and the lending market — and any disagreement between their price observations lands on the operator.",
      leverageUsed: true,
      leverageAmount: "Short leg funded by borrowed ETH (or perp margin) — typically ≤1× position notional",
      liquidationExposure: "LOW",
      withdrawalRestrictions:
        "The hedge should be unwound before fully exiting the LP leg to avoid a moment of concentrated unhedged exposure",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "MEDIUM",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$10,000",
      requiredHoldings: ["USDC"],
      walletSetup: "Ethereum-compatible wallet with a healthy gas buffer",
      other:
        "Working knowledge of concentrated liquidity AND collateralized borrowing; monitoring cadence of at least daily — this is an actively-managed, execution-sensitive position, not a passive deposit",
    },
    references: [
      { title: "Uniswap V3 Documentation", url: "https://docs.uniswap.org/", publisher: "Uniswap Labs", notes: "Concentrated liquidity positions and fee accrual" },
      { title: "Aave Documentation", url: "https://docs.aave.com/", publisher: "Aave", notes: "Collateralized borrowing, utilization and health factor" },
      { title: "Morpho", url: "https://morpho.org/", publisher: "Morpho Labs", notes: "Alternative isolated lending markets for the borrow leg" },
    ],
    lastReviewedAt: "2026-08-27",
    depositAssets: ["USDC"],
    exposureAssets: ["ETH", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "arbitrum"],
    protocols: ["uniswap", "aave", "morpho"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_018 — Hedged Concentrated Liquidity
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_018",
    name: "Hedged Concentrated Liquidity",
    slug: "hedged-concentrated-liquidity",
    type: "Hedged Liquidity",
    status: "PUBLISHED",
    objectives: ["yield", "hedging", "advanced"],
    summary:
      "Actively hedge a concentrated liquidity position's rapidly changing delta with perpetual shorts, resized and rebalanced against the position's live exposure.",
    description:
      "Hedged Concentrated Liquidity is the active-management escalation of delta-neutral LP. The money-market short is replaced by perpetual futures shorts on GMX or Hyperliquid, and — more importantly — the hedge is treated as a continuous control problem rather than a set-and-forget offset. A concentrated LP's delta swings from nearly full base-asset exposure below its range to nearly zero above it; a static hedge is therefore wrong most of the time. This strategy resizes the short against the position's live delta as price moves through the range.\n\nThe economics attempt to keep concentrated liquidity viable exactly where it is most dangerous: active, choppy markets with heavy two-way volume. Fee flow can be dense in those conditions, and the perp hedge — while charging funding and demanding margin — suppresses the directional exposure that would otherwise dominate the P&L. At times the carry is even favorable, when funding pays shorts rather than charging them; the sign and size of funding is itself a monitored input to the strategy, not background noise.\n\nExecution complexity is the strategy's substance, and it deserves explicit enumeration. Delta estimation: computing the LP's live delta requires the position's composition within its range and its distance to the bounds, and the result is approximate — the true delta is curved and moves as price does. Rebalance triggers: price bands, delta-drift thresholds and funding thresholds must be defined before volatility arrives, not during it. Perp margin management: the hedge runs on margin, and violent moves consume buffer exactly when rebalancing is most needed. Cross-venue execution: the LP lives on Uniswap (Ethereum or Arbitrum) while the hedge lives on GMX (Arbitrum) or Hyperliquid — capital is split across venues, transfers take time, and each venue charges its own gas and spread.\n\nThe investor accepts the highest operational intensity in this segment of the archive in exchange for attempting to harvest volatile-market fee flow with controlled direction. It underperforms when markets go quiet (funding and maintenance costs against thin fees), when trends persist (the hedge caps upside and churns on the way down), or when execution discipline slips. It is a strategy for operators who can staff the position — alerts, tooling, rehearsed procedures — not for part-time attention.",
    marketFit: {
      regimes: ["SIDEWAYS", "BEAR"],
      scores: { BULL: 60, SIDEWAYS: 90, BEAR: 70 },
      secondaryRegimes: ["HIGH_VOLATILITY_CHOP"],
      secondaryScores: { HIGH_VOLATILITY_CHOP: 95 },
      explanation:
        "Sideways markets with heavy two-way flow are the intended environment: the concentrated range earns dense fees while delta drift stays within what active rebalancing can track. In bear markets the hedge truncates the downside conversion that wrecks unhedged concentrated liquidity, and elevated volatility keeps fee flow alive — at the cost of higher margin and rebalancing stress. In bull markets the strategy survives but lags: the perp short sells away the rally and funding on shorts is typically paid, not received. Its strongest specific condition is High-Volatility Chop: trading volume generates fees, frequent reversals generate rapidly changing directional exposure, and the actively-adjusted perp hedge is the mechanism that attempts to control that exposure — precisely the situation in which a static hedge fails and an unhedged position is dominated by direction.",
    },
    steps: [
      {
        title: "Pair the LP venue with a hedge venue",
        description:
          "Choose the concentrated position (Uniswap ETH/USDC on Ethereum or Arbitrum) and the hedge execution venue (GMX perps on Arbitrum or Hyperliquid). Consider where the pair's volume lives, where perp liquidity is deepest, and how quickly capital can move between the two — cross-venue transfers are part of the strategy's operating loop.",
      },
      {
        title: "Open the concentrated LP position",
        description:
          "Deploy USDC-funded liquidity into a range sized for the intended fee density, converting the required ETH side at mint. From that moment the position's delta is live and will change with every move through the range.",
      },
      {
        title: "Estimate the position's live delta",
        description:
          "Compute the LP's current directional exposure from its composition within the range and its distance to the bounds, using position-manager tooling or a deliberately conservative approximation. Treat the estimate as approximate — the true delta is curved (gamma) and moves as price does.",
      },
      {
        title: "Open the perp short with margin buffer",
        description:
          "Sell ETH perps sized to the estimated delta, keeping posted margin well above maintenance requirements. The hedge notional typically stays at or below the LP notional (≤1x); the buffer is what buys time when a violent move arrives between rebalances.",
      },
      {
        title: "Pre-define rebalance triggers",
        description:
          "Set explicit triggers before volatility arrives: price bands at range boundaries, a delta-drift threshold beyond which the hedge is resized, and a funding-cost threshold at which carrying the hedge is re-evaluated. Triggers written during calm markets are the discipline that fails least during violent ones.",
      },
      {
        title: "Rebalance actively and manage margin",
        description:
          "On any trigger, resize the short toward the live delta, top up or trim margin, and harvest fees on schedule. In violent moves the rebalance competes with exactly the spreads and gas costs that are widest at that moment — execute the rules, not the feelings.",
      },
      {
        title: "Unwind legs in coordinated order",
        description:
          "Reduce the hedge as the LP is removed so the book never carries an outsized naked short, then close the perp position and settle remaining balances across venues. Coordinated unwinding is a rehearsed procedure, not an improvisation.",
      },
    ],
    entryConditions: [
      "High-volatility chop or active sideways conditions confirmed — the environment where fee flow is heavy and reversals frequent",
      "The pair's volume at the chosen fee tier is strong relative to position size",
      "Perp funding on the hedge venue is not persistently and severely against shorts",
      "At least $25,000 of capital, split comfortably across the LP venue, hedge margin and buffers",
      "Continuous monitoring capability — alerts, dashboards or automation — plus demonstrated experience with both concentrated liquidity and perpetual futures",
    ],
    exitConditions: [
      "The market resolves into a persistent trend — the hedge's cap on upside (or the churn of downside re-placement) becomes the dominant cost",
      "Funding costs exceed fee income for a sustained period",
      "Repeated margin stress on the hedge venue, including near-liquidation episodes",
      "Fee volume in the pool collapses, leaving only hedge costs",
      "Operational capacity to actively manage the position ends",
    ],
    risk: {
      overallRisk: "HIGH",
      explanation:
        "The defining failure mode is hedge timing: opening, adjusting and closing two legs across different venues guarantees windows of unhedged or over-hedged exposure, and violent moves land in exactly those windows (legging risk). The perp short runs on margin, so the hedge venue itself carries liquidation exposure — margin stress peaks when volatility peaks, and a liquidated hedge converts the book into a naked concentrated LP at the worst possible moment. Delta estimation error is structural: the LP's true delta is curved and moves with price, so every computed hedge size is an approximation whose error compounds with rebalance frequency. Funding costs on the perp can flip sign and persist against the position. Rebalancing during violent moves competes with the widest spreads, highest gas and thinnest liquidity — the moments that demand action are the moments where action is most expensive. Venue and correlation risk rounds it out: the perp's oracle price and the pool's spot price can diverge (basis), capital is split across Ethereum, Arbitrum and the hedge chain, and each additional venue is another contract system that must behave. Impermanent loss on the LP leg remains throughout, only partially offset by hedge gains.",
      leverageUsed: true,
      leverageAmount: "Perp hedge on margin — hedge notional sized to LP delta (typically ≤1×)",
      liquidationExposure: "MEDIUM",
      withdrawalRestrictions:
        "Cross-venue capital must be recalled before a full unwind; perp margin is only available after the hedge closes",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "MEDIUM",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$25,000",
      requiredHoldings: ["USDC"],
      walletSetup:
        "Ethereum-compatible wallet plus a funded account on the hedge venue (GMX on Arbitrum or Hyperliquid)",
      other:
        "This is the most operationally demanding strategy in this segment of the collection: near-continuous monitoring (alerts or automation), demonstrated experience with both concentrated liquidity and perpetual futures, and rehearsed unwind procedures across multiple venues",
    },
    references: [
      { title: "Uniswap V3 Documentation", url: "https://docs.uniswap.org/", publisher: "Uniswap Labs", notes: "Concentrated liquidity positions whose delta is being hedged" },
      { title: "GMX", url: "https://gmx.io/", publisher: "GMX", notes: "Perpetuals venue for the hedge leg" },
      { title: "GMX Documentation", url: "https://docs.gmx.io/", publisher: "GMX", notes: "Perp margin, funding and liquidation mechanics" },
      { title: "Hyperliquid Documentation", url: "https://hyperliquid.gitbook.io/", publisher: "Hyperliquid", notes: "Alternative perp venue for the hedge leg" },
    ],
    lastReviewedAt: "2026-08-25",
    depositAssets: ["USDC"],
    exposureAssets: ["ETH", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "arbitrum", "hyperliquid"],
    protocols: ["uniswap", "gmx", "hyperliquid"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_019 — Market-Neutral Yield Stack
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_019",
    name: "Market-Neutral Yield Stack",
    slug: "market-neutral-yield-stack",
    type: "Market-Neutral Yield",
    status: "PUBLISHED",
    objectives: ["yield", "hedging", "advanced"],
    summary:
      "Stack independent DeFi yield sources — lending, fee yield, funding spreads — and offset their aggregate directional exposure so that yield itself, not market direction, is the return.",
    description:
      "Market-Neutral Yield Stack generalizes hedged liquidity provision into portfolio construction: instead of hedging one position, you assemble several independent yield sources and offset their aggregate directional exposure, so that the return — as close as practicable — is the sum of the yields rather than the market's direction. The building blocks: stablecoin lending yield (Aave, Morpho), fee yield from liquidity provision (Uniswap), staking-style yield on directional assets, and basis or funding spreads via perpetuals (GMX). Any specific implementation is a particular stack of these blocks; the archetype is the discipline of netting their direction.\n\nTwo reference constructions illustrate the pattern. A carry stack: deploy USDC and USDT across Aave and Morpho for lending yield; allocate a bounded sleeve to ETH yield exposure (a Uniswap LP position or staked ETH); short ETH perps on GMX sized to that sleeve's delta. Net exposure sits near zero while return is lending yield plus ETH yield minus (or occasionally plus) funding. A basis-heavy variant leans on the perp leg itself: hold the yield-bearing ETH block and short an approximately equal notional, collecting the basis and funding spread as the primary yield source, with the stable lending sleeve acting as ballast and margin source. Neither construction is canonical — the archetype is the stacking and netting logic they share.\n\nThe stack is an engineering problem more than a selection problem. Each block carries its own risk profile — rate variability, funding sign, impermanent loss, contract risk — and the blocks interact: margin posted on one venue is capital unavailable to another, and a hedge sized yesterday is wrong today. The operator monitors net delta across all venues, rebalances hedges, manages margin, and rotates toward whichever block currently pays. Neutrality is a moving target that must be actively maintained, never a state that is achieved once.\n\nWhy use it: in conditions where direction is unreliable — choppy, indecisive or declining markets — it attempts to make yield itself the return. The trade-off is complexity and modest expected magnitude: returns are the sum of spreads, not a levered bet, and the failure mode is characteristic — correlation breakdown or a venue failure can turn a neutral book into a losing directional one faster than the operator can unwind it. It suits capital that wants DeFi yield with an explicit rejection of market beta, run by an operator able to treat it as what it is: a small trading operation.",
    marketFit: {
      regimes: ["SIDEWAYS", "BEAR"],
      scores: { BULL: 70, SIDEWAYS: 95, BEAR: 80 },
      secondaryRegimes: ["HIGH_VOLATILITY_CHOP"],
      secondaryScores: { HIGH_VOLATILITY_CHOP: 90 },
      explanation:
        "Sideways conditions suit the stack best: yield sources persist, neutrality is easiest to maintain, and direction pays nothing — so isolating yield is the rational objective. In bear markets the stack remains attractive: direction is dangerous and unreliable downward while lending, fee and funding spreads can persist — though stress episodes raise venue and funding risks across the book. In bull markets the stack lags directional holdings (the hedge forfeits upside) but benefits from rising borrowing demand and heavy fee flow, which keeps it viable rather than useless. Under High-Volatility Chop the rationale sharpens: repeated directional reversals make outright exposure unreliable, and a market-neutral stack attempts to isolate yield while offsetting most price exposure.",
    },
    steps: [
      {
        title: "Survey the block economics before committing capital",
        description:
          "Map what each building block currently pays: stable lending rates on Aave and Morpho, fee flow on the target Uniswap pool, and the sign and size of perp funding on GMX. A stack only makes sense when at least two blocks are independently attractive — one good block is a single strategy, not a stack.",
      },
      {
        title: "Deploy the stable lending sleeve",
        description:
          "Supply USDC and USDT into the chosen lending markets on Ethereum or Arbitrum. This sleeve carries no meaningful direction, anchors the stack's liquidity, and — where the construction allows — serves as the margin source for the hedged legs.",
      },
      {
        title: "Add the yield-bearing directional sleeve",
        description:
          "Allocate a bounded share to directional yield: an ETH-based Uniswap LP position or a staking-style ETH exposure. This block supplies the directional exposure the hedge will offset — its size is set by the risk budget, never by yield appetite.",
      },
      {
        title: "Offset the aggregate exposure",
        description:
          "Short ETH perps on GMX sized to the stack's net delta so the directional sleeve's price exposure is largely canceled while its yield is retained. Size against the combined book, not against any single block — the stack's netting is what makes it neutral.",
      },
      {
        title: "Monitor net exposure, funding and rates across venues",
        description:
          "Track the combined delta, the perp funding's sign and magnitude, and lending-rate drift across every venue in the book. Neutrality is a moving target: deltas drift, funding regimes change, and rates move at different speeds.",
      },
      {
        title: "Rebalance hedges and rotate blocks",
        description:
          "Adjust short size when net delta drifts beyond tolerance, and rotate capital toward whichever block currently pays best when spreads shift. Manage margin buffers on the hedged legs throughout — rotation is useless if the hedge gets liquidated mid-move.",
      },
      {
        title: "De-risk the stack under stress",
        description:
          "In systemic events, cut the margin legs first, consolidate to the most liquid venues, and accept lower yield for survivability. Correlation breakdown is exactly when neutral books fail, and the de-stack order should be decided before it is needed.",
      },
    ],
    entryConditions: [
      "Sideways or bear regime confirmed at Level-1 — conditions where direction is unreliable and yield isolation is most valuable",
      "At least two building blocks currently pay meaningfully (lending spread plus fee flow, or favorable funding)",
      "Perp funding is not persistently against the intended short direction",
      "At least $25,000 of capital to fund multiple venues, margin buffers and rotation without fragmentation",
      "Demonstrated ability to operate lending, LP and perp positions and to monitor them near-daily",
    ],
    exitConditions: [
      "A persistent trend emerges — neutrality forfeits upside in a bull and concentrates stress costs in a bear; de-stack toward directional or fully defensive allocations",
      "Funding flips against the hedge and stays there, turning the stack's carry negative",
      "Any leg's venue shows stress — the stack's integrity depends on every venue in it behaving",
      "Spreads across all blocks compress below the cost of maintaining the structure",
      "Monitoring capacity or capital priorities change",
    ],
    risk: {
      overallRisk: "HIGH",
      explanation:
        "The stack's risks compound across legs rather than diversifying away. Basis risk: the hedge offsets a moving target — held exposure and hedge price diverge, and the residual \"neutral\" book drifts directional exactly when it matters. Funding risk: perp funding can flip against the short and persist, turning carry negative across the whole structure. Counterparty and protocol risk accumulate across every venue in the stack — lending, LP and perp — and one failure compromises the book; the more blocks stacked, the wider the attack surface. Hedged legs carry liquidation risk under margin stress. Tracking error is inherent: deltas drift between rebalances, rates move at different speeds, and the stack is only ever approximately neutral. Execution complexity is itself a risk — multi-leg, cross-venue adjustments under time pressure invite sequencing mistakes. The defining tail risk is correlation breakdown: in liquidation cascades, relationships that made the legs offset in calm markets converge, and a \"neutral\" book can lose on multiple legs simultaneously. Impermanent loss is rated LOW only because LP exposure is one bounded block among several, not the core of the construction.",
      leverageUsed: true,
      leverageAmount: "Implementation-dependent (hedged legs on margin or debt)",
      liquidationExposure: "MEDIUM",
      withdrawalRestrictions:
        "Margin posted on hedged legs is encumbered until they are unwound; LP and lending blocks exit at block-level speed rather than instantly",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "LOW",
      assetVolatility: "MEDIUM",
    },
    requirements: {
      minCapital: "$25,000",
      requiredHoldings: ["USDC", "USDT"],
      walletSetup: "Ethereum-compatible wallet plus funded accounts on every venue in the stack",
      other:
        "Advanced multi-venue operation: near-daily attention to net delta, funding and rates across lending, LP and perp venues; experience rotating capital under stress; automation of alerts and rebalancing is strongly advisable",
    },
    references: [
      { title: "Aave Documentation", url: "https://docs.aave.com/", publisher: "Aave", notes: "Lending-yield block and margin mechanics" },
      { title: "GMX Documentation", url: "https://docs.gmx.io/", publisher: "GMX", notes: "Perp funding, basis and margin for the hedge block" },
      { title: "Uniswap V3 Documentation", url: "https://docs.uniswap.org/", publisher: "Uniswap Labs", notes: "LP fee-yield block" },
    ],
    lastReviewedAt: "2026-08-22",
    depositAssets: ["USDC", "USDT"],
    exposureAssets: ["ETH", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "arbitrum"],
    protocols: ["aave", "morpho", "uniswap", "gmx"],
  },
]
