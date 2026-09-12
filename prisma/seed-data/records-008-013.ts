import type { SeedStrategy } from "./types"

/**
 * Seed records for the INITIAL OFFICIAL STRATEGY COLLECTION (part 2).
 *
 * STRATEGY_008 SOL Liquid Staking
 * STRATEGY_009 Distribution LP
 * STRATEGY_010 Covered Call Yield
 * STRATEGY_011 Stablecoin Yield Rotation
 * STRATEGY_012 Deleveraging Into Weakness
 * STRATEGY_013 Stablecoin Reserve Strategy
 *
 * Written to the documentation quality standard of the Accumulation LP
 * benchmark in prisma/seed.ts: researched long-form overviews, execution-grade
 * methodology, explicit entry/exit invalidation rules and strategy-specific
 * risk analysis. No static APY/return claims — only the SOURCE of return.
 * Assets / protocols / networks are referenced by SYMBOL / SLUG strings; the
 * seed script resolves them to database rows.
 */
export const records: SeedStrategy[] = [
  // -------------------------------------------------------------------------
  // STRATEGY_008 — SOL Liquid Staking
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_008",
    name: "SOL Liquid Staking",
    slug: "sol-liquid-staking",
    type: "Liquid Staking",
    status: "PUBLISHED",
    objectives: ["yield", "growth"],
    summary:
      "Stake SOL through a liquid staking protocol and receive a liquid staking token that accrues validator rewards while staying deployable across Solana DeFi.",
    description:
      "SOL Liquid Staking converts SOL from a static holding into a productive, composable position. You deposit SOL into a liquid staking protocol — Marinade or Jito being the established venues — and receive a liquid staking token (mSOL or jitoSOL) in return. The token represents a claim on the underlying staked SOL plus accumulated rewards, and it accrues value through a slowly rising exchange rate against native SOL rather than by rebasing, so nothing needs to be claimed or re-staked.\n\nThe return has two components, both variable. The first is Solana's native staking issuance: the network mints new SOL to reward validators for voting and block production, and stakers receive their share minus validator commissions and protocol fees. The second, protocol-dependent, is MEV and priority-fee income: Jito's block engine auctions transaction ordering and forwards tips to stakers, which can add meaningfully to baseline issuance during periods of network congestion. Issuance follows network parameters and the amount of active stake, while MEV income follows fee-market conditions — the strategy should be understood as capturing the source of the yield, not a fixed rate.\n\nThe delegation mechanics are specific to Solana and differ materially from Ethereum's staking pools. Liquid staking protocols operate stake pools: a single pool account holds the stake and delegates it across a curated, diversified validator set — hundreds of validators in Marinade's case — with algorithmic delegation rules that aim to avoid stake concentration and to direct stake toward performant validators. Delegation weight adjusts at epoch boundaries, and Solana's protocol-level penalties have historically been limited to reduced rewards for offline validators (missed credits) rather than active slashing of principal, so validator-level risk shows up mostly as reward drag — and the stake pool diversifies most of it away. The consequence for the staker is that the quality of the delegation algorithm, and the governance that controls it, becomes part of the due diligence.\n\nWhat you ultimately hold is a higher-beta digital-asset position with a yield overlay. SOL has typically traded as a higher-beta asset during broad risk-on expansion, amplifying moves in both directions, and liquid staking keeps that directional participation intact while the stake earns. The reason to use it rather than native staking is composability: mSOL and jitoSOL remain usable as lending collateral, LP inventory, or trading float across Solana DeFi, so the capital is neither locked nor idle. The reason to use it rather than simply holding SOL is the staking income itself, which compounds through the exchange rate and partially offsets drawdowns in flat and falling markets.\n\nThe main operational difference from native staking is the exit path, and it deserves respect. Unstaking through the protocol takes effect across epoch boundaries — typically a delay of a day or more — while swapping the liquid staking token for SOL or USDC on a Solana DEX is immediate but routes through the token's secondary liquidity. mSOL and jitoSOL both maintain deep pools by Solana standards, but depth is finite: large exits or stressed markets can trade at a discount to fair exchange-rate value, and during Solana network congestion even simple swaps can fail or reprice. The strategy underperforms simple SOL holding when the token persistently trades below fair value, when the protocol's delegation or fee structure changes unfavorably, or when SOL enters a deep bear market — the reward stream is real but small relative to SOL's volatility, so this is a long-SOL position first and a yield position second.",
    marketFit: {
      regimes: ["BULL", "SIDEWAYS"],
      scores: { BULL: 90, SIDEWAYS: 70, BEAR: 30 },
      secondaryRegimes: ["ALT_EXPANSION"],
      secondaryScores: { ALT_EXPANSION: 95 },
      explanation:
        "In a bull market the strategy earns on two levels at once: SOL price appreciation — often amplified, since SOL tends to trade as a higher-beta asset during risk-on expansion — plus the staking return compounding through the rising exchange rate. In sideways conditions the yield becomes the dominant return and provides a steady drip while optionality stays open, because the liquid staking token remains deployable in DeFi. In a bear market the position still earns, but SOL's drawdowns routinely dwarf the reward stream, and secondary LST liquidity can deteriorate exactly when exit demand peaks — capital preservation argues for reducing exposure. The Alt Expansion fit (95) is the strongest single condition: broad risk-on expansion is precisely when SOL's higher-beta character shows, and liquid staking combines full directional participation with staking rewards while keeping the capital composable for other opportunities.",
    },
    steps: [
      {
        title: "Choose the liquid staking protocol",
        description:
          "Compare Marinade and Jito on the dimensions that matter: validator set size and delegation policy, fee structure (protocol fee and validator commission share), whether MEV and priority-fee income is forwarded to stakers, and the secondary liquidity depth of the resulting token. Both spread stake across large diversified validator sets, but their fee and reward models differ.",
      },
      {
        title: "Stake SOL and receive the liquid staking token",
        description:
          "Deposit SOL into the stake pool and receive mSOL or jitoSOL. Rewards begin accruing from the next epoch and compound automatically through the token's rising exchange rate against SOL — there is nothing to claim or re-stake manually.",
      },
      {
        title: "Keep the token productive or hold it",
        description:
          "Composability is the point of the liquid variant. The token can be held as-is — still accruing staking value — or deployed as lending collateral, LP inventory, or trading float across Solana DeFi. Any deployment adds its own risks on top of the staking position, so treat held-as-is as the conservative default.",
      },
      {
        title: "Monitor the exchange rate and secondary liquidity",
        description:
          "Track the token's exchange rate against SOL (it should only drift upward), the stake pool's performance metrics, and the secondary market depth of the LST. A widening discount to fair value on DEXes is the early warning sign of liquidity stress or lost confidence in the protocol.",
      },
      {
        title: "Review protocol health periodically",
        description:
          "Check for changes to delegation policy, fee parameters, or governance, along with any Solana network-level events — congestion episodes or validator outages — that affect reward flow. A monthly review is sufficient in calm conditions; review immediately after any material network event.",
      },
      {
        title: "Exit via liquidity or via unstaking",
        description:
          "For immediate exit, swap the liquid staking token on a DEX, sizing the trade against available pool depth to limit slippage. For patient exit, unstake through the protocol and wait for epoch deactivation. In stressed conditions expect both paths to be slower and costlier than usual.",
      },
    ],
    entryConditions: [
      "Long-term conviction in SOL, with a bull or sideways market view",
      "Comfortable holding a higher-beta asset whose drawdowns can exceed those of the broader market",
      "Secondary liquidity for the chosen liquid staking token is deep enough for your position size",
      "You have reviewed the protocol's validator delegation model and fee structure",
      "No near-term need for the SOL — immediate exit routes through secondary liquidity or an epoch-delayed unstake",
      "Comfortable with Solana program risk and periodic network congestion",
    ],
    exitConditions: [
      "Conviction on SOL is lost, or a confirmed bear regime makes directional exposure undesirable",
      "The liquid staking token persistently trades at a discount to fair value, signaling liquidity or confidence stress",
      "Protocol governance, delegation, or fee changes materially worsen the risk/reward",
      "A materially better deployment for the capital appears at acceptable risk",
      "Solana network instability or stake-pool security events raise concern",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The dominant risk is SOL price volatility — the reward stream is small relative to SOL's swings, so the position behaves like a higher-beta directional bet with a yield kicker, not like a fixed-income substitute. Second is Solana program risk: liquid staking adds a smart-contract layer (the stake pool program and its manager) on top of the base chain, and a vulnerability there can trap staked SOL. Third is LST liquidity risk: the immediate exit route runs through secondary swap depth, which can compress and trade at a discount exactly when markets are stressed, while the protocol-native unstake path waits on epoch deactivation. Validator-level risk is largely diversified by the stake pool, but poor delegation performance still shows up as weaker rewards. Neither variant involves leverage, liquidation, or impermanent loss.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "Immediate via LST swap on DEXes (depth-dependent, possible discount in stress) or protocol unstake with epoch deactivation delay",
      lockupPeriod: "None contractual; practical exit delay comes from epochs or secondary liquidity",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "NONE",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "Any (Solana transaction fees are negligible)",
      requiredHoldings: ["SOL"],
      walletSetup: "Solana wallet (e.g. Phantom, Solflare)",
      other:
        "Basic familiarity with Solana staking and DeFi; monthly review cadence is sufficient, weekly if the LST is deployed elsewhere in DeFi",
    },
    references: [
      {
        title: "Marinade Finance",
        url: "https://marinade.finance/",
        publisher: "Marinade",
        notes: "mSOL liquid staking and diversified validator delegation",
      },
      {
        title: "Marinade Documentation",
        url: "https://docs.marinade.finance/",
        publisher: "Marinade",
        notes: "Stake pool mechanics, fees and unstaking",
      },
      {
        title: "Jito Network",
        url: "https://www.jito.network/",
        publisher: "Jito",
        notes: "jitoSOL liquid staking with MEV reward distribution",
      },
      {
        title: "Solana Staking",
        url: "https://solana.com/staking",
        publisher: "Solana Labs",
        notes: "Native staking, epochs and validator delegation",
      },
    ],
    lastReviewedAt: "2026-09-05",
    depositAssets: ["SOL"],
    exposureAssets: ["mSOL", "jitoSOL", "SOL"],
    rewardAssets: [],
    networks: ["solana"],
    protocols: ["marinade", "jito"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_009 — Distribution LP
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_009",
    name: "Distribution LP",
    slug: "distribution-lp",
    type: "Concentrated Liquidity",
    status: "PUBLISHED",
    objectives: ["capital-preservation", "liquidity", "yield"],
    summary:
      "Convert appreciated ETH into USDC systematically by providing concentrated liquidity above spot — a rules-based distribution ladder that earns fees while it sells into strength.",
    description:
      "Distribution LP is the mirror image of Accumulation LP. Instead of positioning a concentrated liquidity range below the market to buy weakness, you position it at and above the current ETH price, seeded with ETH you have already decided to distribute. As price rises through the range, the position automatically converts ETH into USDC at progressively higher prices — a ladder of self-executing sales — while earning trading fees on every swap that crosses the range.\n\nThe strategy has two sources of return. The first is deliberate conversion: appreciated ETH becomes stablecoins at your chosen price levels, executing a distribution plan without requiring you to time a top. The second is fee income: a concentrated range collects a large share of its pool's trading fees relative to the capital committed, and the ETH/USDC pair on Ethereum (Uniswap V3) and on Base (Aerodrome) is among the deepest trading venue pairs in DeFi. Fees are the secondary return; the conversion itself is the mechanism, and treating the intentional upward conversion as an accident would be a misreading of the position.\n\nThe trade-off is symmetrical to accumulation. Upside beyond the top of your range is surrendered — the position is fully converted to USDC once price exits above it, and every further dollar of ETH appreciation is missed. Downside, the risk is structural: while price sits below the range the position is entirely ETH, so a failed advance leaves full directional exposure intact. The investor accepts a capped exit price in exchange for certainty of execution and fee income along the way.\n\nThat is why the strategy belongs in a mature or late bull market. The goal is not to maximize the sale price of ETH but to guarantee that appreciation gets converted at all. Late-cycle advances draw peak momentum and headline participation precisely when internal market structure — breadth, participation quality, momentum durability — is quietly deteriorating, and investors who planned to sell the top frequently end up distributing into weakness instead. A pre-committed ladder above spot converts into strength, mechanically, while the market is still paying for the privilege of buying.\n\nRelative to a grid of limit sell orders on an exchange, the on-chain variant earns fees while it works, keeps the assets in self-custody, and stays adjustable — the position can be withdrawn, re-ranged, or re-struck at any time. Relative to simply holding, it trades upside beyond the range for systematic conversion. It is a distribution tool first and a yield strategy second, and it should be sized like one.",
    marketFit: {
      regimes: ["BULL", "SIDEWAYS"],
      scores: { BULL: 90, SIDEWAYS: 65, BEAR: 15 },
      secondaryRegimes: ["LATE_BULL_DISTRIBUTION"],
      secondaryScores: { LATE_BULL_DISTRIBUTION: 95 },
      explanation:
        "In a bull market the conversion mechanism actually engages: price advances through the range, ETH converts to USDC at progressively higher levels, and fee income is strongest because uptrends draw the heaviest swap volume. In sideways markets the strategy still earns fees when the range sits near the active trading zone, but distribution stalls — price that never reaches the range leaves the position as unconverted, unhedged ETH. In bear markets it is close to inert: with price below the range nothing converts, fee flow dries up, and the position is simply directional exposure with extra steps, so the fit collapses. The Late Bull / Distribution fit (95) is the core use case — liquidity positioned above the market systematically converts appreciated crypto into stablecoins while earning fees, which is rules-based distribution into strength exactly when momentum and broad participation begin deteriorating.",
    },
    steps: [
      {
        title: "Fund the position with ETH to distribute",
        description:
          "Start from appreciated ETH that you have committed, in advance, to distributing. A USDC component is only needed if the range will straddle the current price; a pure above-spot range is seeded entirely with ETH.",
      },
      {
        title: "Define the distribution range above spot",
        description:
          "Set the price band over which you want ETH converted into stablecoins. A tighter band converts faster and earns more fees per unit of capital; a wider band behaves like a broad ladder of limit sells. Anchor the top of the range to the level above which you genuinely accept missing further appreciation.",
      },
      {
        title: "Provide liquidity on the chosen venue",
        description:
          "Deposit the ETH into the ETH/USDC concentrated liquidity pool — Uniswap V3 on Ethereum or Aerodrome on Base. Verify the fee tier (or incentive structure on Aerodrome), confirm the position sits above spot, and submit.",
      },
      {
        title: "Monitor conversion as price ascends",
        description:
          "Track the position's composition as price climbs: it shifts progressively from ETH toward USDC as the range is traversed, with fee accrual peaking while price actively trades inside the band. The conversion is the strategy working, not an impermanent-loss accident.",
      },
      {
        title: "Manage the range deliberately",
        description:
          "If price falls back below the range before conversion completes, decide explicitly whether to re-set the ladder lower (re-committing to distribution) or to withdraw and reassess the distribution thesis. If price exits above the top, the distribution is complete and the position is now stablecoins.",
      },
      {
        title: "Harvest and redeploy the stablecoins",
        description:
          "Once conversion is finished, withdraw the USDC and redeploy it into a conservative stablecoin venue. Treat the harvested proceeds as defensive capital rather than trading float — that is the entire point of having distributed.",
      },
    ],
    entryConditions: [
      "Bull or sideways regime, with an ETH position you have pre-committed to distributing",
      "ETH price at or below the bottom of your intended distribution range",
      "Distribution targets defined in advance as a rule, not improvised after the move",
      "Explicit acceptance that upside above the range top is surrendered",
      "Pool fee volume is healthy relative to your position size (Uniswap V3 on Ethereum, Aerodrome on Base)",
      "Sufficient capital that gas and management costs are negligible (roughly $2,000+ on mainnet)",
    ],
    exitConditions: [
      "Price exits the range upward and the distribution target is complete — harvest the USDC",
      "A confirmed bear regime invalidates the distribution thesis — withdraw rather than ride residual ETH exposure down",
      "Fee earnings no longer compensate for the opportunity cost of capped upside",
      "Your objective changes from distributing ETH back to accumulating or holding it",
      "The venue's fee economics deteriorate materially (volume migration, incentive changes)",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The defining risk is capped upside: once price exits above the range the position is entirely USDC, and all further ETH appreciation is missed. The upward divergence that concentrated-liquidity users call impermanent loss is, in this strategy, both the deliberate sale price and its opportunity cost — the position will underperform plain ETH holding on any breakout beyond the range top. The secondary risk is structural: below the range the position is pure ETH, so a failed advance or a late-cycle reversal leaves full directional exposure precisely when the market turns. Smart contract risk sits in the venue — Uniswap V3 is among the most battle-tested deployments in DeFi, while Aerodrome is a newer codebase — and a concentrated range amplifies both fee-economics sensitivity and range-misjudgment cost. The strategy is unleveraged with no liquidation risk, but it demands the discipline to harvest when conversion completes rather than re-striking out of greed.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "None — the position can be removed at any time, though removal mid-range realizes the partially converted composition",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "MEDIUM",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$2,000",
      requiredHoldings: ["ETH", "USDC"],
      walletSetup:
        "Ethereum-compatible wallet (e.g. MetaMask, Rabby) with a gas buffer; a Base deployment additionally needs the wallet funded on Base",
      other:
        "Ability to interact with Uniswap V3 or Aerodrome and to monitor the position at least weekly",
    },
    references: [
      {
        title: "Uniswap V3 Documentation",
        url: "https://docs.uniswap.org/",
        publisher: "Uniswap Labs",
        notes: "Concentrated liquidity positions and fee tiers",
      },
      {
        title: "Uniswap V3 Announcement",
        url: "https://uniswap.org/blog/uniswap-v3",
        publisher: "Uniswap Labs",
        notes: "Design rationale for concentrated liquidity",
      },
      {
        title: "Aerodrome",
        url: "https://aerodrome.finance/",
        publisher: "Aerodrome",
        notes: "Base's central liquidity venue; concentrated liquidity pools",
      },
      {
        title: "Impermanent Loss Explained",
        url: "https://academy.binance.com/en/articles/impermanent-loss-explained",
        publisher: "Binance Academy",
        notes: "Divergence risk — here, the cost of capped upside",
      },
    ],
    lastReviewedAt: "2026-08-30",
    depositAssets: ["ETH", "USDC"],
    exposureAssets: ["ETH", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "base"],
    protocols: ["uniswap", "aerodrome"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_010 — Covered Call Yield
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_010",
    name: "Covered Call Yield",
    slug: "covered-call-yield",
    type: "Options Income",
    status: "PUBLISHED",
    objectives: ["yield", "capital-preservation", "advanced"],
    summary:
      "Hold ETH and sell call options against part or all of the stack, collecting premium income while agreeing to sell ETH above the strike price.",
    description:
      "Covered Call Yield is an options-income strategy built on a spot position. You hold ETH and sell call options against part or all of it — directly through a DeFi options venue such as Aevo, or via an automated covered-call vault such as those run by Thetanuts. In exchange for a premium received upfront, you take on the obligation to sell ETH at the strike price if the option finishes in the money. The premium is the return; the capped upside above the strike is the price of that return.\n\nThe premium exists because option buyers pay for convexity. Implied volatility usually prices in more movement than the market subsequently delivers — the volatility risk premium — and a disciplined call seller harvests that spread across repeated expiries, along with the time decay of options that expire worthless. This is why the strategy's return should be understood as insurance-writing income rather than a yield on collateral: it is variable, path-dependent, and earned by accepting an obligation that others are willing to pay to avoid.\n\nThe economics improve in exactly the conditions where outright conviction deteriorates. Late in a bull cycle, expected incremental upside shrinks — the easy re-rating has already happened — while volatility, and therefore premium, frequently remains elevated because late-cycle markets are still eventful. Selling calls then means giving up less expected upside per unit of premium collected; the cost of capping upside falls. The same logic applies in sideways markets, where the underlying drifts while premium decays cycle after cycle. In an early explosive bull phase the trade-off reverses: capping a strong expansion can forfeit the majority of the move, which is why this strategy complements, rather than replaces, a hold-first posture early in a cycle.\n\nIt must be stated plainly: a covered call is not downside protection. If ETH falls, the short call expires worthless, but the ETH position carries the full drawdown, softened only by the premium collected — a limited buffer, nothing more. The strategy is a way to monetize a mature or aging position, not a hedge against decline, and any use of it as a bear defense is a category error.\n\nOperationally, the DeFi implementations differ in settlement. Physically-settled options deliver the underlying at strike on exercise, converting ETH into USDC at the strike price; cash-settled variants pay out intrinsic value and leave the spot position intact. Vaults automate strike selection and rolling, at the cost of less control and one additional protocol layer between you and the option. Either way the workflow is periodic — sell, wait for expiry, roll — which makes this a cadence strategy rather than a continuously-managed position.",
    marketFit: {
      regimes: ["BULL", "SIDEWAYS"],
      scores: { BULL: 80, SIDEWAYS: 85, BEAR: 30 },
      secondaryRegimes: ["LATE_BULL_DISTRIBUTION"],
      secondaryScores: { LATE_BULL_DISTRIBUTION: 90 },
      explanation:
        "Sideways markets are the natural habitat: price drifts, options expire out of the money, and premium compounds cycle after cycle without the underlying being called away. Bull markets are workable but conditional — a moderate uptrend still earns, while an explosive early-bull breakout is precisely when capped upside costs the most, which is why the fit is higher for a mature or late bull (80, and 90 for the Late Bull / Distribution phase, where expected incremental upside is deteriorating while volatility and premium remain elevated) than for the start of an expansion. Bear markets expose the structure's weakness: the premium buffer is small relative to drawdowns, so the strategy behaves like holding ETH with a rebate rather than like a defensive position (30).",
    },
    steps: [
      {
        title: "Decide the covered fraction",
        description:
          "Choose how much of the ETH stack to write calls against. Covering all of it maximizes premium but caps all upside; a partial overlay keeps uncapped participation on the remainder. The fraction should reflect how much upside you are genuinely willing to sell, not how much premium you want.",
      },
      {
        title: "Select the venue and instrument",
        description:
          "Compare a direct options venue (Aevo) with automated covered-call vaults (Thetanuts). Check whether the options are physically or cash-settled, what the margin and collateral model requires, and exactly how exercise at expiry is processed.",
      },
      {
        title: "Choose strike and tenor",
        description:
          "Set the strike at the level above which you accept selling ETH — further strikes earn less premium but cap less upside. Choose a tenor that matches your rolling cadence: shorter expiries compound time decay faster but demand more frequent operation.",
      },
      {
        title: "Sell the call and collect the premium",
        description:
          "Deposit the ETH with the venue or vault and sell the calls. The premium is received upfront and is yours regardless of how the option resolves; from this moment the maximum sale price of the covered ETH is the strike.",
      },
      {
        title: "Roll at expiry",
        description:
          "If price finishes below strike, the option expires worthless — re-sell the next cycle at a fresh strike. If price finishes above, the option settles (physically delivering ETH at strike, or paying cash intrinsic) and you decide whether to re-strike with what remains of the position.",
      },
      {
        title: "Exit the strategy deliberately",
        description:
          "Stop selling calls when the regime changes — a new explosive expansion phase where the cap costs more than the premium pays, or a decisive breakdown where you should reduce spot rather than keep writing. An open short call can be exited before expiry by buying it back at current option value.",
      },
    ],
    entryConditions: [
      "Regime is sideways, or a mature / late bull where expected incremental upside is deteriorating",
      "Implied volatility — and therefore premium — is elevated relative to your expectation of realized movement",
      "You have explicitly accepted the cap: ETH above the strike will be sold at the strike",
      "You accept full downside exposure on the ETH, softened only by the premium buffer",
      "Position size is meaningful relative to the venue's minimum sizes and option liquidity (roughly $5,000+)",
      "The venue's settlement mechanics (physical vs cash) and collateral model are understood before depositing",
    ],
    exitConditions: [
      "A new explosive bull phase is expected — capped upside now costs more than the premium is worth",
      "Volatility collapses and premium no longer compensates for capping upside",
      "A bear signal emerges — covered calls are not a hedge, and spot should be reduced instead",
      "The options venue or vault shows signs of stress (settlement issues, withdrawal delays, oracle problems)",
      "Repeated exercise above strike has converted more ETH than intended — stop and reassess the position",
    ],
    risk: {
      overallRisk: "MEDIUM",
      explanation:
        "The defining risk is capped upside: above the strike, every dollar of appreciation accrues to the option buyer, and in a breakout the opportunity cost dwarfs the premium collected. The second risk is downside asymmetry: the position retains ETH's full drawdown minus only the premium, so it must never be mistaken for protection. Third is volatility mispricing — selling calls when implied volatility is too cheap, or when your read on realized movement is wrong, earns insufficient premium for the obligation taken. Fourth is settlement and venue mechanics: physically-settled exercise forces a sale at strike below market on the exercise event, and cash-settled books can leave residual exposure if managed carelessly. Finally, DeFi options venues and vaults are younger and mechanically more complex than lending or AMM protocols — margin engines, oracle feeds and clearing logic all add counterparty and smart-contract risk on top of the option itself. No leverage, no liquidation, no impermanent loss.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "Vault positions typically withdraw at cycle boundaries; a directly sold short call can be closed any time by buying back the option at its current value",
      lockupPeriod: "Typically one option cycle per vault epoch for automated vaults",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "NONE",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "$5,000",
      requiredHoldings: ["ETH"],
      walletSetup:
        "Ethereum-compatible wallet; some options venues operate their own app environment or chain (e.g. Aevo) with deposits bridged or rolled into it",
      other:
        "Working knowledge of options mechanics (strike, expiry, settlement); ability to judge implied versus realized volatility; monitoring at least once per option cycle, weekly when markets are active",
    },
    references: [
      {
        title: "Covered Call",
        url: "https://www.investopedia.com/terms/c/coveredcall.asp",
        publisher: "Investopedia",
        notes: "Classic covered-call structure and trade-offs",
      },
      {
        title: "Aevo",
        url: "https://aevo.xyz/",
        publisher: "Aevo",
        notes: "On-chain options and derivatives venue",
      },
      {
        title: "Aevo Documentation",
        url: "https://docs.aevo.xyz/",
        publisher: "Aevo",
        notes: "Options settlement, margin and collateral mechanics",
      },
      {
        title: "Thetanuts Finance",
        url: "https://thetanuts.finance/",
        publisher: "Thetanuts",
        notes: "Automated covered-call and options-income vaults",
      },
    ],
    lastReviewedAt: "2026-09-01",
    depositAssets: ["ETH"],
    exposureAssets: ["ETH", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "aevo"],
    protocols: ["thetanuts", "aevo"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_011 — Stablecoin Yield Rotation
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_011",
    name: "Stablecoin Yield Rotation",
    slug: "stablecoin-yield-rotation",
    type: "Stablecoin Yield",
    status: "PUBLISHED",
    objectives: ["yield", "capital-preservation"],
    summary:
      "Rotate stablecoin deposits across conservative lending venues when the risk-adjusted rate elsewhere clearly justifies the move — productive defensive capital without chasing headline APY.",
    description:
      "Stablecoin Yield Rotation treats the conservative end of DeFi lending as a single marketplace. You hold USDC and USDT across established venues — Aave, Morpho, Compound, Spark, and Curve's stable pools — and move capital only when the net rate available elsewhere becomes meaningfully more attractive after costs. The strategy is a superset of simply parking stablecoins: it accepts operational effort in exchange for consistently capturing the best risk-adjusted rate among venues you have already vetted.\n\nThe yield itself is rent on collateralized borrowing: lenders earn interest paid by leveraged users who borrow stablecoins against crypto collateral, with each venue's rate set by its utilization curve, sometimes topped up by incentive emissions. Spreads between venues persist because liquidity is fragmented — different collateral frameworks, incentive budgets and borrower bases produce different rates at any moment — and disciplined rotation is the mechanism for harvesting those spreads without adding directional or leverage risk.\n\nThe discipline lies in what you do not do. Headline APY is not the signal; it is frequently the risk. An unusually high stablecoin rate usually means the venue is paying for risk somewhere — stressed collateral, unsustainable incentives, or borrow demand that cannot last. Before any capital moves, the evaluation framework covers protocol risk (audit history, governance, oracle integrity), stablecoin risk (issuer and depeg exposure of the asset being lent), liquidity (what withdrawal looks like at stressed utilization), incentive durability (what share of the rate is emissions that can end versus organic borrower interest), the transaction and bridge costs of the move itself, and the durability of the rate after the move.\n\nThe strategy works across all three regimes, which is unusual in this collection. In bull markets it is the natural home for dry powder — underperforming risk assets, but paid rather than idle. In sideways markets it is often the best return available without directional exposure. In bear markets it can be strongest of all: borrow demand from shorts and deleveraging flows pushes stablecoin utilization up while safe-haven inflows seek exactly these venues. Late in a bull, capital already taken off directional exposure stays productive rather than sitting idle; during capitulation the same venues absorb flight-to-safety deposits — but that is precisely when venue risk review becomes critical, because systemic stress reaches lending markets through bad debt, oracle failures and utilization spikes, not through the rate.\n\nThe contrast that defines the strategy is against the Stablecoin Reserve Strategy: the reserve posture optimizes for availability and simplicity at whatever rate follows, while rotation actively optimizes the rate within a vetted venue set — accepting monitoring effort, multiple concurrent venue exposures and transaction costs as the price of the extra return.",
    marketFit: {
      regimes: ["BULL", "SIDEWAYS", "BEAR"],
      scores: { BULL: 70, SIDEWAYS: 85, BEAR: 90 },
      secondaryRegimes: ["LATE_BULL_DISTRIBUTION", "CAPITULATION_DELEVERAGING"],
      secondaryScores: { LATE_BULL_DISTRIBUTION: 80, CAPITULATION_DELEVERAGING: 85 },
      explanation:
        "In bear markets the strategy earns its highest fit: stablecoin borrow demand persists — shorts and deleveraging keep utilization elevated — while flight-to-safety inflows seek exactly these venues, and defensive capital is what the regime calls for; the caveat is that systemic stress simultaneously makes venue-by-venue risk review the binding constraint rather than the rate. In sideways markets it approaches the ideal low-risk return: full liquidity, no directional exposure, and spreads wide enough to be worth harvesting. In bull markets it underperforms risk assets by design and functions as the paid parking place for capital awaiting deployment. The Late Bull phase (80) captures capital rotating off directional exposure remaining productive rather than idle; the Capitulation phase (85) captures peak defensive demand across venues whose leverage demand has collapsed while safe-haven inflows arrive — with venue risk review elevated to first-priority.",
    },
    steps: [
      {
        title: "Build the vetted venue shortlist",
        description:
          "Restrict the universe to conservative, established venues — Aave, Morpho, Compound, Spark, Curve stable pools — and apply the evaluation framework to each before any capital moves: protocol risk, collateral base, oracle setup, and liquidity at high utilization. Venues that fail the framework never enter rotation, whatever their rate.",
      },
      {
        title: "Decompose each venue's rate",
        description:
          "Split the headline rate into organic borrower interest and incentive emissions, and check current utilization. A rate propped up mostly by incentives should be discounted for durability; an unusually high organic rate should prompt the question of which borrowers are paying it, and why.",
      },
      {
        title: "Deploy across two or three venues",
        description:
          "Split capital deliberately rather than concentrating in the current best payer — both to diversify venue risk and to keep optionality across future rate moves. Match the split and the chain placement (Ethereum, Arbitrum, Base) to your liquidity needs and cost tolerance.",
      },
      {
        title: "Monitor rates and risk signals on a fixed cadence",
        description:
          "Track supply rates, utilization, and venue risk events — parameter changes, collateral stress, governance proposals — on a weekly cadence. The cadence, not the size of any single move, is what compounds the edge over time.",
      },
      {
        title: "Rotate only on a justified net spread",
        description:
          "Move capital when the after-cost spread between your current venue and the target clears a threshold you set in advance — covering gas, bridge fees if moving across chains, and your operational time. Never move for a headline number, and never move into an unvetted venue.",
      },
      {
        title: "Consolidate or withdraw deliberately",
        description:
          "When capital is needed elsewhere, withdraw from the least advantageous venue first. When systemic stress rises, the rotation logic inverts: consolidate toward the safest venues rather than the highest payers, and treat venue safety as the only criterion.",
      },
    ],
    entryConditions: [
      "Stablecoin capital (USDC/USDT) that can remain deployed for weeks or longer",
      "A venue shortlist already vetted through the full risk framework",
      "Meaningful rate spreads or utilization differences exist across the shortlist",
      "Acceptance of concurrent smart-contract exposure across multiple venues",
      "Commitment to a fixed monitoring cadence for rates and venue risk",
      "Transaction and bridge costs are understood and small relative to expected spread capture",
    ],
    exitConditions: [
      "Spreads across vetted venues compress below the threshold that pays for the effort",
      "A venue in the set shows material risk deterioration — utilization extremes, collateral stress, governance concerns",
      "Systemic stress makes venue safety the only criterion — consolidate to the safest venue or withdraw",
      "Capital is redeployed to a better opportunity (for example early-recovery accumulation)",
      "You choose to simplify into the passive Stablecoin Reserve posture",
    ],
    risk: {
      overallRisk: "LOW",
      explanation:
        "The risks are individually small but plural, and their plurality is itself the point to manage. Smart-contract risk is low per venue on established lending markets, but the strategy deliberately holds exposure across several venues simultaneously, which compounds tail risk — the probability that some venue in the set fails grows with the set's size, and a single failure can exceed years of harvested spread. Stablecoin risk sits underneath everything: both USDC and USDT carry issuer and depeg exposure, and a depeg converts a stable yield into a principal loss. Liquidity risk appears at extremes: withdrawal from a lending market at very high utilization can be delayed or expensive, and moving capital across Ethereum, Arbitrum and Base adds bridge risk and cost. Incentive reliance is real but bounded — part of the rate at some venues is emissions that can end without warning, so rates can decay abruptly. Finally, the strategy's own discipline is a failure mode: chasing headline rates into unvetted venues converts a conservative strategy into concentrated protocol risk.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "Withdrawals on demand in normal conditions; can be delayed or costly at extreme utilization during stress events",
      lockupPeriod: "",
      incentiveReliance: "MEDIUM",
      smartContractRisk: "LOW",
      impermanentLoss: "NONE",
      assetVolatility: "LOW",
    },
    requirements: {
      minCapital: "$1,000",
      requiredHoldings: ["USDC", "USDT"],
      walletSetup:
        "Ethereum-compatible wallet (e.g. MetaMask, Rabby); deployments span Ethereum, Arbitrum and Base",
      other:
        "Weekly rate and risk monitoring cadence; discipline to apply a fixed evaluation framework instead of chasing headline APY; comfort moving funds across venues and chains",
    },
    references: [
      {
        title: "Aave Documentation",
        url: "https://docs.aave.com/",
        publisher: "Aave",
        notes: "Supply rates, utilization curves and risk parameters",
      },
      {
        title: "Morpho",
        url: "https://morpho.org/",
        publisher: "Morpho",
        notes: "Curated lending markets and rate mechanics",
      },
      {
        title: "Compound Documentation",
        url: "https://docs.compound.finance/",
        publisher: "Compound",
        notes: "Money-market supply rates and utilization",
      },
      {
        title: "Spark",
        url: "https://spark.fi/",
        publisher: "Spark",
        notes: "Stablecoin lending venue and incentive structure",
      },
    ],
    lastReviewedAt: "2026-09-03",
    depositAssets: ["USDC", "USDT"],
    exposureAssets: ["USDC", "USDT"],
    rewardAssets: [],
    networks: ["ethereum", "arbitrum", "base"],
    protocols: ["aave", "morpho", "compound", "spark", "curve"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_012 — Deleveraging Into Weakness
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_012",
    name: "Deleveraging Into Weakness",
    slug: "deleveraging-into-weakness",
    type: "Risk Management",
    status: "PUBLISHED",
    objectives: ["capital-preservation", "hedging"],
    summary:
      "A defensive playbook for deteriorating markets: systematically repay debt, unwind leveraged loops and reduce LTV before liquidation thresholds are reached.",
    description:
      "Deleveraging Into Weakness is a risk-management strategy, not an alpha strategy. Its objective is not to earn a return but to systematically reduce leverage as market structure deteriorates — repaying debt, adding collateral, cutting directional exposure and closing leveraged loops before falling prices force the issue. Where the other strategies in this collection ask what to do with capital, this one asks how to keep capital alive.\n\nThe mechanical reason this strategy exists is how collateralized debt fails. As collateral prices fall, loan-to-value ratios rise toward liquidation thresholds; once crossed, the venue liquidates collateral at a penalty to restore the ratio, realizing losses at the worst possible moment — into thinning liquidity, alongside everyone else's forced sellers. Oracle feeds lag spot during violent moves, so the threshold can be crossed before a manual response is even possible. The strategy's core insight is that the option to act voluntarily is worth preserving: deleveraging early converts an uncontrolled, penalized outcome into a controlled one.\n\nThe playbook is rank-ordered. Measure aggregate LTV and health factor across every venue and position — across Aave and Morpho on Ethereum and Arbitrum, and anything else in the book. Rank positions by liquidation proximity: distance to threshold in collateral-price terms, weighted by the volatility of the specific collateral. Repay the most dangerous debt first, using stablecoin reserves to retire debt secured by the most volatile collateral, which reduces LTV fastest per dollar repaid. Unwind looped positions in the least-slippage order — small and liquid legs before large or thin ones, never dumping illiquid collateral into a falling market to save a liquid position. Throughout, hold a gas and liquidity reserve on every chain where positions live: gas spikes during cascades are routine, and a wallet that cannot pay to transact cannot defend itself.\n\nThe methodology must be defined before stress arrives. Defensive ceilings — LTV levels that trigger action — should sit far enough above the protocol's liquidation threshold to leave execution room, because execution degrades under stress: gas spikes, slippage widens, oracles lag, and everyone else is racing through the same doors. A rule triggered early is a rule that can still be executed; a rule triggered at the threshold is already too late.\n\nThe posture governing all of it is survival over return maximization. Deleveraging too early costs a rebound's upside; deleveraging too late can cost the portfolio. Those outcomes are not symmetric. When liquidation exposure cannot otherwise be removed, the strategy explicitly accepts a realized loss — selling collateral into weakness to repay debt — as the correct move, because a realized loss that preserves the remaining capital base beats a forced liquidation that takes a penalty on top of it.",
    marketFit: {
      regimes: ["BEAR"],
      scores: { BULL: 20, SIDEWAYS: 50, BEAR: 100 },
      secondaryRegimes: ["CAPITULATION_DELEVERAGING"],
      secondaryScores: { CAPITULATION_DELEVERAGING: 100 },
      explanation:
        "In bear markets the strategy is at full relevance: falling collateral values continuously push leveraged positions toward liquidation thresholds, and every day of delay raises the probability of forced execution — this is the environment it was designed for. In sideways markets it sits at half relevance: LTV drifts rather than spikes, and routine maintenance (repaying the most dangerous debt, keeping ceilings comfortable) is worthwhile but rarely urgent. In bull markets it is nearly dormant: rising collateral values deleverage positions automatically, and the only action the playbook demands is resisting the temptation to re-lever into strength. The Capitulation / Deleveraging fit (100) is the extreme case — falling collateral values and forced liquidations cascade, liquidity thins, oracles lag, and the gap between voluntary and forced execution is at its widest.",
    },
    steps: [
      {
        title: "Measure aggregate leverage across all venues",
        description:
          "Inventory every debt, collateral and looped position across venues and chains — Aave and Morpho positions on Ethereum and Arbitrum, plus anything else in the book. Compute LTV and health factor for each position and in aggregate: a portfolio can be safe on average and one position away from liquidation.",
      },
      {
        title: "Rank positions by liquidation proximity",
        description:
          "Order positions by distance to their liquidation threshold in collateral-price terms, weighting by the collateral's volatility. The closest, most volatile positions are the ones the playbook attacks first — proximity, not position size, sets the priority.",
      },
      {
        title: "Set defensive LTV ceilings that trigger action early",
        description:
          "Define ceiling levels for each venue well above the protocol's liquidation threshold — enough room to act while gas is still affordable, liquidity still exists, and oracles still track spot. Write the rules down before they are needed, because they will be executed under the worst conditions of the cycle.",
      },
      {
        title: "Repay the most dangerous debt first",
        description:
          "Use stablecoin reserves to retire debt secured by the most volatile collateral — this reduces LTV fastest per dollar repaid. Adding collateral is the alternative when repayment is impractical, but it pushes more assets inside the stressed venue and does not reduce the debt itself.",
      },
      {
        title: "Unwind looped positions in the least-slippage order",
        description:
          "Close the smallest and most liquid legs first, unwinding loops step by step rather than tearing down the whole structure in one forced transaction. Never dump illiquid collateral into a falling market through Uniswap to defend a position that could be simplified instead.",
      },
      {
        title: "Maintain the gas and liquidity reserve",
        description:
          "Keep a dedicated reserve of ETH for gas and stablecoins for opportunistic repayment on every chain where positions live. During liquidation cascades, gas spikes and congestion are the norm — a wallet that cannot transact cannot defend itself, and the cheapest insurance in the playbook is being able to act.",
      },
      {
        title: "Accept realized losses to remove liquidation exposure",
        description:
          "When a position cannot otherwise be brought inside its defensive ceiling, sell collateral and repay the debt deliberately, taking the realized loss as the cost of survival. This is the playbook's terminal move and its most important discipline — the alternative is losing the same collateral to a penalized forced liquidation.",
      },
    ],
    entryConditions: [
      "Bear regime confirmed, or market structure deteriorating — falling highs, weakening breadth, rising liquidations",
      "Aggregate LTV approaching your pre-defined defensive ceiling on any venue",
      "At least one position sits within striking distance of its liquidation threshold",
      "A gas and liquidity reserve is in place on every chain where positions live",
      "Defensive rules are written in advance — ceilings, order of operations, loss-acceptance criteria",
      "Genuine acceptance that survival outranks return, which means the plan will sometimes trigger 'too early'",
    ],
    exitConditions: [
      "Leverage has been reduced to or inside defensive ceilings on every venue — the playbook has done its job",
      "Market structure stabilizes and the regime is no longer deteriorating — resume normal position management",
      "All leveraged positions are closed, and residual capital transitions to the Stablecoin Reserve posture",
      "Venues in use are exited entirely due to venue-specific risk rather than market risk",
    ],
    risk: {
      overallRisk: "HIGH",
      explanation:
        "The strategy is rated HIGH not because it takes risk but because it is executed under the worst conditions with the most dangerous inventory. The positions being managed carry liquidation exposure — that is why the playbook exists — and during a liquidation cascade execution itself degrades: gas spikes, liquidity thins, slippage widens, and oracle feeds lag spot prices, so a threshold can be crossed before any defensive transaction confirms. Interacting with lending venues during systemic stress also concentrates smart-contract exposure exactly when protocols are under their greatest load. The strategy uses no leverage — it removes it — but its own errors are costly: unwinding in the wrong order realizes avoidable slippage, hesitating converts a manageable position into a forced one, and triggering a rule too late leaves no room to act at all. The residual risk after full execution is that damage already absorbed — the drawdown taken while acting — cannot be recovered; this strategy preserves what remains rather than restoring what was lost.",
      leverageUsed: false,
      leverageAmount:
        "None — the strategy removes leverage; the positions it manages are the leveraged ones",
      liquidationExposure: "HIGH",
      withdrawalRestrictions:
        "Debt repayment and position unwinds execute on demand in normal conditions; during cascades, gas spikes and congestion can delay or reprice transactions",
      lockupPeriod: "",
      incentiveReliance: "NONE",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "NONE",
      assetVolatility: "HIGH",
    },
    requirements: {
      minCapital: "Any (keep a gas + liquidity reserve during stress)",
      requiredHoldings: ["ETH", "WBTC", "USDC"],
      walletSetup:
        "Ethereum-compatible wallet (e.g. MetaMask, Rabby) funded on every chain where positions live, with a dedicated gas reserve",
      other:
        "Existing leveraged positions to manage; pre-written defensive rules (LTV ceilings, order of operations, loss-acceptance criteria); daily or faster monitoring during stress; willingness to accept realized losses to remove liquidation exposure",
    },
    references: [
      {
        title: "Aave Documentation",
        url: "https://docs.aave.com/",
        publisher: "Aave",
        notes: "Health factor, LTV and collateral management",
      },
      {
        title: "Aave Risk Framework & Liquidations",
        url: "https://aave.com/docs/",
        publisher: "Aave",
        notes: "Liquidation mechanics, thresholds and risk parameters",
      },
      {
        title: "Morpho",
        url: "https://morpho.org/",
        publisher: "Morpho",
        notes: "Curated lending markets and position management",
      },
      {
        title: "Uniswap V3 Documentation",
        url: "https://docs.uniswap.org/",
        publisher: "Uniswap Labs",
        notes: "Unwinding swaps and slippage management during deleveraging",
      },
    ],
    lastReviewedAt: "2026-08-28",
    depositAssets: ["ETH", "WBTC", "USDC"],
    exposureAssets: ["ETH", "WBTC", "USDC"],
    rewardAssets: [],
    networks: ["ethereum", "arbitrum"],
    protocols: ["aave", "morpho", "uniswap"],
  },

  // -------------------------------------------------------------------------
  // STRATEGY_013 — Stablecoin Reserve Strategy
  // -------------------------------------------------------------------------
  {
    strategyId: "STRATEGY_013",
    name: "Stablecoin Reserve Strategy",
    slug: "stablecoin-reserve-strategy",
    type: "Stablecoin Reserve",
    status: "PUBLISHED",
    objectives: ["capital-preservation", "yield"],
    summary:
      "Hold capital in stablecoins across high-quality, simple venues — prioritizing availability and preservation over yield, so reserves survive stress and stay deployable at the turn.",
    description:
      "The Stablecoin Reserve Strategy is the archive's most defensive posture. Capital is held in USDC and USDT, deployed across a handful of the most conservative venues on Ethereum — Aave, Morpho, Spark, Compound — with the objective of remaining modestly productive while staying immediately available. It is what a portfolio holds when it is waiting: for markets to bottom, for a cycle to turn, or for a deployment opportunity to appear.\n\nThe yield is deliberately modest and comes from the same source as all conservative stablecoin lending: interest paid by collateralized borrowers, set by each venue's utilization curve. The strategy does not optimize for that yield. It optimizes for the properties around it — capital availability, low complexity, protocol quality, stablecoin diversification and withdrawal liquidity — and accepts whatever rate follows from venues that satisfy those properties. The real return being purchased is optionality: the ability to act at the moment of maximum opportunity, funded by a small carry while waiting.\n\nEach priority exists because of how stress behaves. Capital availability: reserves must be withdrawable when needed, so utilization dynamics matter more than rate. Low complexity: every additional moving part — exotic venues, auto-compounding wrappers, cross-chain bridges — is another failure surface during precisely the period when the reserve is supposed to be the safe part of the portfolio. Protocol quality: the venue set is restricted to long-standing, deeply audited markets. Stablecoin diversification: USDC and USDT carry different issuer and depeg exposures, so the reserve splits across both — and across multiple venues — so that no single failure is total. Withdrawal liquidity: the strategy checks, before depositing, what withdrawal looks like at stressed utilization levels, not just at current ones.\n\nDuring violent deleveraging this posture earns its keep. Capital preservation, liquidity and optionality become more valuable than maximizing return exactly when protocol stress is systemic — and reserve capital positioned this way is positioned both to survive the stress and to be deployable at the turn. The cost of the posture is real and must be owned honestly: in a bull market, reserves underperform every risk asset, and the discipline of holding them is the price of having capital when the next opportunity arrives. This strategy exists for investors who would rather pay that known cost than discover, mid-cascade, that their 'safe' capital was in the wrong place.\n\nThe contrast that defines the strategy is against Stablecoin Yield Rotation. Rotation is the active posture: monitoring rates, moving capital, harvesting spreads across a vetted venue set. The reserve is the passive-defensive posture: it accepts a lower and simpler return in exchange for maximum availability and minimum complexity. The two share a venue universe but differ in what they optimize for — capital typically graduates from reserve to rotation when the regime stabilizes, and from both into risk assets when the cycle turns.",
    marketFit: {
      regimes: ["BEAR", "SIDEWAYS"],
      scores: { BULL: 40, SIDEWAYS: 80, BEAR: 95 },
      secondaryRegimes: ["CAPITULATION_DELEVERAGING"],
      secondaryScores: { CAPITULATION_DELEVERAGING: 95 },
      explanation:
        "In bear markets the strategy approaches its ceiling: preservation, liquidity and optionality dominate return considerations, and the reserve's split across issuers and venues is designed for exactly the protocol stress that systemic drawdowns bring. In sideways markets it remains highly fitting: lending rates are usually the best return available without directional exposure, and the optionality costs nothing while capital waits. In bull markets the fit drops — not because the strategy fails, but because reserves underperform risk assets by design; a reserve exists to be drawn down into deployment, not held through expansions. The Capitulation / Deleveraging phase (95) is the defining case: during violent deleveraging and protocol stress, preservation and availability are worth more than any incremental yield, and reserve capital positioned for withdrawal both survives the stress and remains deployable at the turn.",
    },
    steps: [
      {
        title: "Split capital across stablecoin issuers",
        description:
          "Divide reserves between USDC and USDT — and for large reserves, keep a tranche outside any venue entirely. The split diversifies issuer and depeg exposure, the two failure modes that no amount of venue diversification can fix.",
      },
      {
        title: "Select venues on quality, not rate",
        description:
          "Restrict the set to the most conservative, longest-operating markets on Ethereum — Aave's core market, Morpho's blue-chip curated markets, Spark, Compound — and choose among them on withdrawal liquidity and simplicity, treating the rate as a secondary criterion.",
      },
      {
        title: "Deploy and verify the exit path",
        description:
          "Deposit the stablecoins into the selected venues and immediately test a small withdrawal to confirm the mechanics end-to-end. Know, before stress arrives, the utilization level at which each venue's withdrawal would begin to strain.",
      },
      {
        title: "Monitor lightly but regularly",
        description:
          "Check utilization levels, venue stress indicators — bad-debt events, parameter changes, governance actions — and stablecoin issuer news on a periodic cadence. The reserve should demand attention measured in minutes per week, not hours; if it demands more, it has become something else.",
      },
      {
        title: "Keep the reserve deployable",
        description:
          "Maintain the discipline of the posture: do not reach for extra yield through complexity, and keep a rehearsed plan for moving from reserve to deployment when the opportunity arrives — which venues to draw from first, in what order, and how quickly the full amount can move.",
      },
    ],
    entryConditions: [
      "Regime is bear or sideways, or systemic stress is expected",
      "The capital's highest calling is availability — deployment optionality is worth more than incremental yield",
      "Preservation is explicitly prioritized over return for this tranche of capital",
      "Venues are vetted for withdrawal liquidity at stressed utilization, not just current rates",
      "A diversification plan across issuers (USDC/USDT) and venues is defined in advance",
    ],
    exitConditions: [
      "An attractive risk-asset entry appears — capitulation exhausted, early recovery forming — and the reserve is deployed into it",
      "The regime turns decisively bullish — deliberately re-risk the capital rather than holding reserves through an expansion",
      "A venue or stablecoin issuer shows deterioration — consolidate into the safest available option immediately",
      "The capital is needed for non-market purposes",
      "The regime stabilizes and you choose to upgrade the posture to active Stablecoin Yield Rotation",
    ],
    risk: {
      overallRisk: "LOW",
      explanation:
        "The strategy is low-risk, not risk-free, and its risks deserve precision. Smart-contract tail risk is small in probability but severe in outcome — a failure at a major lending market can freeze or lose deposits — and diversification across venues only mitigates it, never removes it. Stablecoin issuer and depeg risk sits beneath the venues: USDC and USDT are claims on distinct off-chain arrangements with distinct regulatory and operational exposures, which is exactly why the reserve splits across both rather than concentrating in either. Liquidity risk appears at extremes: during a cascade, utilization on stablecoin lending can spike as everyone borrows at once, delaying or complicating withdrawal at the precise moment access matters most. Finally, opportunity cost: the strategy underperforms every risk asset in a bull market, and the reserve holder pays that known cost in exchange for availability — a cost that feels obvious only after the market has run. No leverage, no liquidation, no impermanent loss.",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions:
        "On demand in normal conditions; temporary delays are possible at extreme utilization during stress events",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "LOW",
      impermanentLoss: "NONE",
      assetVolatility: "LOW",
    },
    requirements: {
      minCapital: "$100",
      requiredHoldings: ["USDC", "USDT"],
      walletSetup: "Ethereum-compatible wallet (e.g. MetaMask, Rabby) with a small gas buffer",
      other:
        "Minimal operational skill; periodic (weekly or biweekly) checks of venue utilization and stablecoin issuer news; discipline to prioritize availability over incremental yield",
    },
    references: [
      {
        title: "Aave Documentation",
        url: "https://docs.aave.com/",
        publisher: "Aave",
        notes: "Core market supply mechanics and utilization",
      },
      {
        title: "Morpho",
        url: "https://morpho.org/",
        publisher: "Morpho",
        notes: "Blue-chip curated lending markets",
      },
      {
        title: "Spark",
        url: "https://spark.fi/",
        publisher: "Spark",
        notes: "Conservative stablecoin lending venue",
      },
      {
        title: "Compound Documentation",
        url: "https://docs.compound.finance/",
        publisher: "Compound",
        notes: "Money-market supply rates and withdrawal mechanics",
      },
    ],
    lastReviewedAt: "2026-08-26",
    depositAssets: ["USDC", "USDT"],
    exposureAssets: ["USDC", "USDT"],
    rewardAssets: [],
    networks: ["ethereum"],
    protocols: ["aave", "morpho", "spark", "compound"],
  },
]
