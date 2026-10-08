import type { StrategyEducation } from "../../src/lib/education";
import { EDITORIAL_VERSION } from "./market-context";
import { hedgeStrategy } from "./hedge";

const reviewedAt = "2026-10-08";
export const sources = {
  aave: "https://aave.com/help/supplying/withdraw-tokens",
  aaveSupply: "https://aave.com/help/supplying/supply-tokens",
  lido: "https://docs.lido.fi/guides/lido-tokens-integration-guide/",
  lidoExit: "https://docs.lido.fi/contracts/withdrawal-queue-erc721/",
  jito: "https://www.jito.network/docs/jitosol/get-started/stake-sol-for-jitosol-flow/overview/",
  jitoExit:
    "https://www.jito.network/docs/jitosol/get-started/unstaking-jitosol-flow/unstaking-overview/",
  uni: "https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity",
  uniMath: "https://app.uniswap.org/whitepaper-v3.pdf",
  uniDeployments: "https://developers.uniswap.org/docs/protocols/v3/deployments/v3-ethereum-deployments",
  uniV2: "https://docs.uniswap.org/contracts/v2/concepts/core-concepts/pools",
};
const lending = (asset: string) => ({
  key: `aave-${asset.toLowerCase()}`,
  label: `${asset} · Aave V3 · Ethereum`,
  protocol: "aave",
  product: "Aave V3 supply",
  network: "ethereum",
  assets: [asset],
  requirements: [
    `${asset} on Ethereum; ETH reserved for transaction costs.`,
    "An Ethereum wallet; verify the official interface and token address.",
    "Check the selected reserve is supply-enabled, below its cap and has withdrawal liquidity.",
  ],
  enter: `Select the Ethereum V3 market. Approve only the intended ${asset} amount and supply it. Do not borrow; check collateral settings separately.`,
  accounting:
    "The aToken claim tracks the supplied asset and accrued borrower interest. Interest varies with demand; no fixed rate is promised.",
  exit: "Withdraw the supplied asset through the dashboard when liquidity is available. Outstanding debt elsewhere in the same account may restrict withdrawal.",
  risks:
    "Contract failures, reserve bad debt, oracle and governance changes; token-specific price or peg risk.",
  sources: [sources.aaveSupply, sources.aave],
  reviewedAt,
});
const uni = (
  assets: string[],
  product = "Uniswap V3 concentrated liquidity",
) => ({
  key: "uniswap-ethereum",
  label: `${assets.join(" / ")} · ${product} · Ethereum`,
  protocol: "uniswap",
  product,
  network: "ethereum",
  assets,
  requirements: [
    "An Ethereum wallet and ETH for entry, collecting fees and exit.",
    `The token mix required by your selected pool and range (${assets.join(" / ")}).`,
    "Verify token contracts, price orientation, fee tier and pool identity in the official interface.",
  ],
  enter:
    "Choose the verified pool and price bounds, preview the required amounts, approve only those amounts and mint the position. Confirm its actual bounds and token balances.",
  accounting:
    "A V3 position is represented by an NFT. Its token mix changes through the range. Fees accrue separately and do not automatically compound in a direct V3 position.",
  exit: "Remove liquidity and collect the assets and accrued fees. Removing does not automatically swap the returned assets. Gas and any subsequent swap cost extra.",
  risks:
    "Contract and token failures, price divergence, inactive ranges, execution costs and withdrawal into an unwanted token mix.",
  sources: [sources.uni, sources.uniMath],
  reviewedAt,
});
export function rangeAmounts(
  liquidity: number,
  lower: number,
  upper: number,
  price: number,
) {
  const p = Math.max(lower, Math.min(upper, price));
  return {
    asset: liquidity * (1 / Math.sqrt(p) - 1 / Math.sqrt(upper)),
    stable: liquidity * (Math.sqrt(p) - Math.sqrt(lower)),
  };
}
const money = (v: number) => `${v.toFixed(2)} USDC`;
const lpMonitor = [
  "Check price versus your bounds and the actual token mix regularly; increase checks near your trigger.",
  "Review accrued fees separately from changes in principal value and compare with holding.",
  "Check pool/token warnings and the cost of collecting, withdrawing or changing the range.",
];
const lpFits = [
  "You understand that liquidity changes your token quantities.",
  "You can monitor a range and accept the assets returned at either boundary.",
];
const lpReconsider = [
  "You no longer want the resulting asset exposure.",
  "The price reaches your exit trigger, the position is inactive or costs overwhelm the objective.",
];
const rangeL = 3000 / (Math.sqrt(3600) - Math.sqrt(2400));
const rangeStart = rangeAmounts(rangeL, 2400, 3600, 3000);
const rangeScenario = (price: number, label: string) => {
  const a = rangeAmounts(rangeL, 2400, 3600, price);
  const hold = rangeStart.asset * price + rangeStart.stable;
  return {
    label,
    condition: `ETH at ${price} USDC`,
    assets: `${a.asset.toFixed(4)} ETH + ${money(a.stable)}`,
    value: `${money(a.asset * price + a.stable)}; holding: ${money(hold)}`,
    next: "Review the token mix and trigger before changing the range; fees would need to offset any holding shortfall plus costs.",
  };
};
const accumL = 3000 / (Math.sqrt(3000) - Math.sqrt(2000));
const accumAsset = rangeAmounts(accumL, 2000, 3000, 2000).asset;
// Continuous V3 check for the partial-fill example: at 2,500, L≈298.4808459
// gives 0.5201271752 ETH and 1,575.5730667 USDC (value 2,875.8910048 USD).
// Above 3,000, it is 3,000 USDC. Full conversion is 3,000/1.2247448714
// ≈ 2,449.4897428 USDC per ETH; at 1,800 the ETH is worth 2,204.5407685 USD.
const sellL = 1 / (1 / Math.sqrt(3000) - 1 / Math.sqrt(4000));
const sellProceeds = rangeAmounts(sellL, 3000, 4000, 4000).stable;

interface Canonical {
  legacyId: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  objectives: string[];
  assets: string[];
  protocols: string[];
  networks: string[];
  steps: { title: string; description: string }[];
  riskText: string;
  education: StrategyEducation;
  depositAssets?: string[];
  requirements?: { requiredHoldings: string[]; walletSetup: string; other: string };
  conversionReversalRisk?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  conversionReversalExplanation?: string;
  referenceTitles?: Record<string, string>;
}
const plan = (
  prepare: string,
  choose: string,
  enter: string,
  monitor: string,
  reconsider: string,
  exit: string,
) => [
  { title: "Prepare", description: prepare },
  { title: "Choose implementation", description: choose },
  { title: "Enter", description: enter },
  { title: "Monitor", description: monitor },
  { title: "Reconsider", description: reconsider },
  { title: "Exit", description: exit },
];
export const catalogue: Canonical[] = [
  {
    legacyId: "STRATEGY_011",
    slug: "stablecoin-yield-rotation",
    name: "Stablecoin Lending",
    summary:
      "Supply stablecoins to a lending market and earn variable borrower interest.",
    description:
      "You supply a stablecoin you intend to keep to a lending market. Borrowers pay interest, which increases your claim on that asset. You aim to earn income without deliberately buying a volatile asset, but a dollar peg and the ability to withdraw are not guaranteed.",
    objectives: ["yield", "capital-preservation"],
    assets: ["USDC"],
    protocols: ["aave"],
    networks: ["ethereum"],
    steps: plan(
      "Choose an amount you can leave exposed; keep emergency funds and gas outside the position.",
      "Select USDC in Aave V3 on Ethereum; check caps, contract addresses and withdrawal liquidity.",
      "Approve the intended amount and supply. Leave borrowing out of this plan.",
      "Check the variable rate, utilisation, peg and available liquidity weekly and after material alerts.",
      "Review a depeg, market pause, deteriorating liquidity or a rate too small to cover costs.",
      "Withdraw USDC when available; revoke unused approvals after confirming the returned balance.",
    ),
    riskText:
      "A stable price target does not eliminate loss. A depeg, bad debt or contract failure can reduce or delay recovery.",
    education: {
      family: "Lending",
      goal: "earn",
      complexity: "Basic",
      management: "Occasional checks",
      returnSource:
        "Borrower interest in the supplied stablecoin; incentive tokens, if any, are separate.",
      exposure: "A claim on supplied USDC. No debt is opened in this plan.",
      tradeOff:
        "Earn variable interest while accepting stablecoin, lending-market and withdrawal-liquidity risk.",
      fitsIf: [
        "You want income on stablecoins you already intend to hold.",
        "You can tolerate delays in accessing this portion of your funds.",
      ],
      reconsiderIf: [
        "The stablecoin loses its peg or withdrawal liquidity deteriorates.",
        "The net interest no longer justifies the risk and costs.",
      ],
      example: {
        title: "1,000 USDC for one year",
        starting:
          "1,000 USDC; goal: keep a stablecoin balance and earn interest.",
        action: "Supply USDC without borrowing.",
        assumptions:
          "Illustrative simple interest for one year at constant 5%, 1% or 0%; no compounding, gas or incentives. USDC = 1 USD except in the depeg scenario. These are not current Aave rates.",
        benchmark:
          "Hold 1,000 USDC outside the lending market over the same year.",
        scenarios: [
          {
            label: "More income",
            condition: "Constant 5% and peg maintained",
            assets: "1,050 USDC",
            value: "1,050 USD; holding: 1,000 USD",
            next: "Review the current rate and liquidity; do not assume next year's rate.",
          },
          {
            label: "Peg loss",
            condition: "Constant 1%; USDC ends at 0.90 USD",
            assets: "1,010 USDC",
            value: "909 USD; holding: 900 USD",
            next: "Interest has not prevented a dollar loss; review issuer and exit liquidity.",
          },
          {
            label: "No interest",
            condition: "0% and peg maintained",
            assets: "1,000 USDC",
            value: "1,000 USD; holding: 1,000 USD",
            next: "Decide whether leaving funds exposed still serves the objective.",
          },
        ],
      },
      monitor: [
        "Variable borrower rate and withdrawal liquidity.",
        "Stablecoin peg, reserve warnings and supply caps.",
        "Gas cost versus income; review weekly and after material changes.",
      ],
      exit: "Withdraw the supplied asset when available; do not assume immediate access during high utilisation.",
      implementations: [lending("USDC")],
      foundations: ["lending", "wallets"],
      tools: [],
      incomeNote:
        "Reserve money can be allocated to this same plan. Rotation adds gas and new market risks; compare net benefit before moving. You may choose to use withdrawn interest to buy an asset, but that is a separate spending decision, not a new lending strategy.",
    },
  },
  {
    legacyId: "STRATEGY_004",
    slug: "blue-chip-asset-lending",
    name: "Crypto Lending",
    summary: "Lend crypto you already hold while keeping its price exposure.",
    description:
      "You supply eligible crypto to a lending market instead of leaving it idle in your wallet. Borrower interest adds units or value to your claim on the same asset. You still bear its market price changes: a small interest gain cannot reliably offset a large price decline.",
    objectives: ["yield"],
    assets: ["WETH"],
    protocols: ["aave"],
    networks: ["ethereum"],
    steps: plan(
      "Decide how much WETH you intend to keep; reserve ETH for gas.",
      "Check WETH supply is enabled in the Ethereum Aave V3 market.",
      "Approve and supply WETH; do not borrow or build a leverage loop.",
      "Review price exposure, supply rate and withdrawal liquidity weekly.",
      "Reconsider if you intend to sell the asset or the market's risk changes.",
      "Withdraw WETH when available; unwrap separately if you need native ETH.",
    ),
    riskText:
      "The original asset can lose value, and lending adds contract, bad-debt and liquidity risk.",
    education: {
      family: "Lending",
      goal: "earn",
      complexity: "Basic",
      management: "Occasional checks",
      returnSource:
        "Variable interest paid by borrowers, denominated in the supplied asset.",
      exposure: "WETH price exposure plus a lending-market claim; no new debt.",
      tradeOff:
        "Additional asset units do not protect against a falling asset price.",
      fitsIf: ["You intend to keep the asset despite price swings."],
      reconsiderIf: [
        "You need to sell the asset or withdrawal liquidity deteriorates.",
      ],
      example: {
        title: "Interest versus price changes",
        starting: "1 WETH valued at 3,000 USD.",
        action: "Supply without borrowing for one year.",
        assumptions:
          "Illustrative 2% simple interest held constant for one year; no fees, gas or incentives. Final claim: 1.02 WETH. Not a live quote.",
        benchmark: "Hold 1 WETH in the wallet.",
        scenarios: [
          {
            label: "Price rises",
            condition: "WETH = 3,600 USD",
            assets: "1.02 WETH",
            value: "3,672 USD; holding: 3,600 USD",
            next: "Review your desired exposure.",
          },
          {
            label: "Price falls",
            condition: "WETH = 2,000 USD",
            assets: "1.02 WETH",
            value: "2,040 USD; holding: 2,000 USD",
            next: "A 40 USD interest benefit has not prevented a loss versus the starting value.",
          },
          {
            label: "Price unchanged",
            condition: "WETH = 3,000 USD",
            assets: "1.02 WETH",
            value: "3,060 USD; holding: 3,000 USD",
            next: "Compare income with costs and added lending risk.",
          },
        ],
      },
      monitor: [
        "Rate, asset exposure and withdrawal liquidity weekly.",
        "Reserve pauses, caps and token/contract warnings.",
      ],
      exit: "Withdraw WETH when liquidity permits; selling or unwrapping is a separate action.",
      implementations: [lending("WETH")],
      foundations: ["lending", "wallets"],
      tools: [],
    },
  },
  {
    legacyId: "STRATEGY_007",
    slug: "eth-liquid-staking",
    name: "Liquid Staking",
    summary: "Earn network rewards on ETH or SOL you intend to hold.",
    description:
      "You commit assets to network staking through a supported liquid staking implementation. You receive a token representing the stake and its rewards. You keep the underlying asset's price exposure, and you must choose between protocol withdrawal and a market sale of that representation when exiting.",
    objectives: ["yield"],
    assets: ["ETH", "SOL"],
    protocols: ["lido", "jito"],
    networks: ["ethereum", "solana"],
    steps: plan(
      "Choose ETH or SOL you intend to hold; retain native gas funds.",
      "Select Lido on Ethereum or Jito on Solana and review that implementation's accounting and exit.",
      "Use the official staking flow and verify the received token; do not borrow against it.",
      "Review underlying rewards, token exchange rate or balance and market discount weekly.",
      "Reconsider slashing, operator incidents, a widening discount or a withdrawal queue beyond your needs.",
      "Request protocol withdrawal and later claim, or compare a secondary-market sale including slippage.",
    ),
    riskText:
      "Network penalties, contracts, operators, market discounts and delayed withdrawal can reduce recovery.",
    education: {
      family: "Staking",
      goal: "earn",
      complexity: "Basic",
      management: "Occasional checks",
      returnSource:
        "Network staking rewards; JitoSOL also reflects MEV rewards after applicable charges. Rewards may change or be offset by penalties.",
      exposure:
        "ETH or SOL remains exposed to price changes; the received token adds representation and exit risk. No debt.",
      tradeOff:
        "A transferable staking token does not guarantee a 1:1 market sale or an immediate protocol exit.",
      fitsIf: [
        "You intend to hold the underlying asset and understand the representation.",
      ],
      reconsiderIf: [
        "You need immediate liquidity or cannot accept token discounts and withdrawal delays.",
      ],
      example: {
        title: "ETH rewards do not remove ETH price risk",
        starting: "1 ETH valued at 3,000 USD; Lido stETH example.",
        action: "Stake and hold for a year.",
        assumptions:
          "Illustrative net reward accrual of 0.03 ETH equivalent, not a quoted rate. No penalties or gas; stETH market discount is specified separately. Actual rewards vary.",
        benchmark: "Hold 1 ETH without staking.",
        scenarios: [
          {
            label: "Price rises",
            condition: "ETH = 3,600 USD; no market discount",
            assets: "1.03 stETH (ETH-equivalent claim)",
            value: "3,708 USD; holding: 3,600 USD",
            next: "Compare queue exit with market sale.",
          },
          {
            label: "Price and token fall",
            condition: "ETH = 2,000 USD; 2% stETH market discount",
            assets: "1.03 stETH",
            value: "Market sale: 2,018.80 USD; holding: 2,000 USD",
            next: "The claim and market-sale price differ; check the queue and discount.",
          },
          {
            label: "Price unchanged",
            condition: "ETH = 3,000 USD; no market discount",
            assets: "1.03 stETH",
            value: "3,090 USD; holding: 3,000 USD",
            next: "Review actual net rewards and exit costs.",
          },
        ],
      },
      monitor: [
        "stETH balance or wstETH/JitoSOL exchange rate, not just token quantity.",
        "Market discount and protocol exit conditions weekly and after operator warnings.",
      ],
      exit: "Follow the selected implementation's withdrawal request/claim flow or compare a market sale. The resulting asset should match your plan.",
      implementations: [
        {
          key: "lido-eth",
          label: "ETH · Lido Core · Ethereum",
          protocol: "lido",
          product: "Lido Core liquid staking",
          network: "ethereum",
          assets: ["ETH"],
          requirements: [
            "ETH on Ethereum plus gas.",
            "Understand stETH rebasing versus wstETH exchange-rate accounting.",
          ],
          enter:
            "Stake ETH through the official Lido interface and receive stETH; wrapping into wstETH is optional and separate.",
          accounting:
            "stETH balances rebase; wstETH balances stay constant while their stETH value changes. These are different accounting representations.",
          exit: "Request withdrawal of stETH or wstETH through the withdrawal queue and claim ETH after finalisation, or sell on a liquid market with slippage/discount risk.",
          risks:
            "Operator penalties, contract failures, queue delays and token discounts.",
          sources: [sources.lido, sources.lidoExit],
          reviewedAt,
        },
        {
          key: "jito-sol",
          label: "SOL · Jito Stake Pool · Solana",
          protocol: "jito",
          product: "JitoSOL stake pool",
          network: "solana",
          assets: ["SOL"],
          requirements: [
            "SOL on Solana, compatible wallet and SOL reserved for fees.",
            "Check direct mint and unstake options in the official interface.",
          ],
          enter:
            "Direct mint SOL into JitoSOL using the stake pool; check the displayed exchange rate.",
          accounting:
            "JitoSOL token quantity need not grow; accrued staking and MEV rewards increase the SOL claim per token after charges.",
          exit: "Compare instant routes and their fees/liquidity with stake-account withdrawal and deactivation before withdrawing SOL.",
          risks:
            "Validators, stake-pool contracts, fees, withdrawal timing and market discount.",
          sources: [sources.jito, sources.jitoExit],
          reviewedAt,
        },
      ],
      foundations: ["staking", "wallets"],
      tools: [],
    },
  },
  {
    legacyId: "STRATEGY_016",
    slug: "concentrated-liquidity-provision",
    name: "Concentrated Liquidity",
    summary: "Supply a chosen token mix inside a range and collect swap fees.",
    description:
      "You provide assets to a trading pool within chosen price bounds. Swaps using your active liquidity generate fees while also changing your balances. Once price leaves the range, your position becomes one-sided and stops earning active fees until price returns; past fees do not guarantee a profit.",
    objectives: ["liquidity", "yield"],
    assets: ["ETH", "USDC"],
    protocols: ["uniswap"],
    networks: ["ethereum"],
    steps: plan(
      "Decide which returned assets you can accept; reserve gas and define a review trigger.",
      "Select an Ethereum Uniswap V3 pool, fee tier and bounds in USDC per ETH.",
      "Deposit the mix required at the current price; it is not universally 50/50.",
      "Review bounds, token quantities, fees and performance versus holding regularly.",
      "Review a boundary crossing, unwanted one-sided exposure or a peg break in a stable pair.",
      "Remove liquidity and collect both assets and fees; swap only if your exit plan calls for it.",
    ),
    riskText:
      "Fees compete with price-divergence losses and costs. Tight ranges require more attention and can leave unwanted exposure.",
    education: {
      family: "Liquidity Provision",
      goal: "liquidity",
      complexity: "Intermediate",
      management: "Regular monitoring",
      returnSource:
        "Swap fees while the position's liquidity is active; price changes also affect principal value.",
      exposure:
        "A changing ETH/USDC mix; no debt. A stable-pair preset still carries both issuer and depeg risks.",
      tradeOff:
        "More concentrated liquidity can earn fees on less capital but reaches one-sided exposure sooner.",
      fitsIf: lpFits,
      reconsiderIf: lpReconsider,
      example: {
        title: "A 2,400–3,600 USDC-per-ETH range",
        starting: `${rangeStart.asset.toFixed(4)} ETH + ${money(rangeStart.stable)} at ETH = 3,000 USDC.`,
        action:
          "Provide one direct Uniswap V3 position across the stated bounds.",
        assumptions:
          "Illustrative continuous V3 range math, no tick rounding, fees, rewards or transaction costs. USDC = 1 USD. Fees cannot be predicted from these prices alone.",
        benchmark: "Hold the exact starting token quantities outside the pool.",
        scenarios: [
          rangeScenario(3600, "Upper boundary"),
          rangeScenario(2000, "Below the range"),
          rangeScenario(3000, "Price unchanged"),
        ],
      },
      monitor: lpMonitor,
      exit: "Remove and collect; review returned assets before deciding whether to swap.",
      implementations: [uni(["ETH", "USDC"])],
      foundations: ["liquidity", "divergence"],
      tools: ["simulator", "impermanent-loss"],
      incomeNote:
        "For a stable-pair setup, use the same fee-income plan with a verified stablecoin pair. Do not assume equal-value deposits or that a narrow range is appropriate; the two pegs can diverge.",
    },
  },
  {
    legacyId: "STRATEGY_001",
    slug: "accumulation-lp",
    name: "Accumulation LP",
    summary:
      "Use a Uniswap V3 range order to convert USDC into ETH gradually as price falls through a chosen range.",
    description:
      "This is effectively a range order: a gradual limit buy implemented with Uniswap V3 concentrated liquidity. You place unborrowed USDC in a range wholly below the current ETH price. As traders swap through the range, the position progressively converts USDC into ETH. Below the range you hold ETH and remain exposed to further declines; a recovery can reverse the conversion unless you withdraw the acquired asset.",
    objectives: ["accumulation"],
    assets: ["USDC", "ETH"],
    protocols: ["uniswap"],
    networks: ["ethereum"],
    steps: plan(
      "Choose a USDC budget and ETH buying bounds; no borrowing. Decide when to remove acquired ETH.",
      "Select Uniswap V3 on Ethereum and verify USDC-per-ETH orientation and the pool.",
      "If spot is above the entire range, start with USDC only. Starting while price is already in range requires both assets and is a different two-sided LP with a different risk profile; see Dual-Asset LP.",
      "Review price and ETH acquired near the boundaries; track fees separately.",
      "At completion, decide whether to withdraw and keep ETH. Recovery through the range sells it back into USDC.",
      "Moving the range means withdrawing and re-minting, which costs gas and locks in the current token mix.",
    ),
    riskText:
      "The archive rates smart-contract risk MEDIUM because this plan relies on Uniswap V3 contracts to hold and manage the position. This covers contract and protocol failure, not USDC issuer risk; USDC can depeg or be frozen/blacklisted. More ETH units can still mean a lower dollar value, and a recovery sells accumulated ETH back to USDC while the position stays open.",
    education: {
      family: "Liquidity Provision",
      goal: "accumulate",
      complexity: "Intermediate",
      management: "Active management",
      returnSource:
        "Possible swap fees while active; the main objective is conversion, not a promised yield.",
      exposure:
        "Starts in USDC; progressively takes ETH price exposure. Below range it holds ETH. No debt or liquidation from borrowing.",
      tradeOff:
        "Compared with a limit order (such as UniswapX, CoW Swap or a centralised exchange), which fills at one price, does not reverse on recovery and is simpler, this range order converts gradually and may earn fees while active. It has no order-matching solver dependency; swaps by traders move the position through its range. Its key trade-off is reversal: if price recovers through an open range, ETH converts back to USDC. Arbitrageurs trade at market-aligned prices, so do not expect a better price than a plain limit order.",
      fitsIf: [
        "You want ETH at the chosen buying range, including if price falls further.",
        "You can monitor completion and act before unwanted reverse conversion.",
      ],
      reconsiderIf: [
        "You no longer want ETH or cannot monitor the position.",
        "The buying range completes or price starts recovering through it.",
      ],
      example: {
        title: "Buy ETH through 2,000–3,000 USDC",
        starting:
          "3,000 USDC at ETH = 3,200 USDC; no ETH deposit and no borrowing.",
        action:
          "Place all USDC in a Uniswap V3 buying range wholly below spot.",
        assumptions:
          "Illustrative continuous V3 math, USDC = 1 USD, no fees, gas, rewards or tick rounding. Fees occur only from swaps using active liquidity.",
        benchmark:
          "Keep 3,000 USDC; a separate all-at-once ETH purchase is a different benchmark.",
        scenarios: [
          {
            label: "Price never enters",
            condition: "ETH stays above 3,000 USDC",
            assets: "3,000 USDC; 0 ETH",
            value: "3,000.00 USD; holding USDC: 3,000.00 USD",
            next: "No active fees are earned. Review whether the buying trigger still fits.",
          },
          {
            label: "Falls through and below",
            condition: "ETH reaches 1,800 USDC",
            assets: `${accumAsset.toFixed(4)} ETH; 0 USDC`,
            value: `${(accumAsset * 1800).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD; holding USDC: 3,000.00 USD`,
            next: "More ETH does not mean profit. Full conversion gives an effective average buy price of about 2,449 USDC per ETH (√(2,000 × 3,000)), versus 3,200 USDC spot at the start. Decide whether to withdraw and keep ETH; further declines reduce value.",
          },
          {
            label: "Recovers without withdrawal",
            condition: "Price crosses down to 2,000 then back above 3,000 USDC",
            assets: "0 ETH; 3,000 USDC (fees excluded)",
            value: "3,000.00 USD; holding USDC: 3,000.00 USD",
            next: "The conversion reversed. To retain acquired ETH, removal timing matters.",
          },
          {
            label: "Partial fill, then recovery",
            condition: "ETH falls to 2,500 USDC, then recovers above 3,000 while the position stays open",
            assets: "At 2,500: 0.5201 ETH + 1,575.57 USDC. Above 3,000: 0 ETH + 3,000 USDC (fees excluded).",
            value: "At 2,500: 2,875.89 USD; above 3,000: 3,000.00 USD. Holding USDC: 3,000.00 USD.",
            next: "Illustrative continuous V3 math with L ≈ 298.5: the mixed position reverses to USDC as price crosses the upper bound. At 2,500 its principal value is below the starting 3,000 USD, before fees and costs.",
          },
        ],
      },
      monitor: [
        "Set price alerts at the lower and upper range boundaries. A sharp move can fill the whole range within minutes.",
        "Review the token mix near each boundary; record fees separately from principal value.",
        "A 0.05% versus 0.3% fee tier changes fee capture and can affect pool use and fill behaviour. Fee income is small relative to price moves; arbitrageurs fill at market-aligned prices (adverse selection), so do not expect the LP to beat a plain limit order on price.",
        "Minting, collecting and removing on Ethereum mainnet can take a meaningful share of a small position. Size accordingly; other networks and L2 deployments have different costs and are separate implementations in this archive.",
        "Minting, swaps through the range and removing liquidity can be taxable events in many jurisdictions. Check local rules.",
      ],
      exit: "Uniswap V3 has no automatic withdrawal. If you do not remove the liquidity, a price recovery sells your ETH back into USDC.",
      implementations: [
        {
          ...uni(["ETH", "USDC"]),
          sources: [sources.uni, sources.uniMath, sources.uniDeployments],
          risks: "Smart-contract or pool failure; USDC issuer freeze/blacklist or depeg; price-conversion and adverse-selection risk; and changing pool activity. Minting and withdrawal have MEV/sandwich exposure; consider a protected RPC for larger positions. Protect the position NFT: review approvals before signing and verify the NFT in the official interface to avoid phishing approvals and fake position NFTs.",
          requirements: [
            "USDC on Ethereum for the wholly-below-spot range; keep ETH separately for gas.",
            "Approve the Uniswap V3 NonfungiblePositionManager for the specific USDC amount required; avoid unlimited approvals. Verify the manager address against Uniswap's official Ethereum deployments page.",
            "An in-range start needs both assets and is a different two-sided LP with a different risk profile. See the Dual-Asset LP record.",
            "This supported plan is on Uniswap V3 Ethereum; other networks and L2s are separate implementations with different costs.",
          ],
          enter:
            "Enter with USDC only and set the entire buying range below spot. If price is already in range, treat the two-sided entry as a different position, not this plan. Verify USDC-per-ETH price orientation.",
          exit: "Uniswap V3 has no automatic withdrawal. If you do not remove the liquidity, a price recovery sells your ETH back into USDC. Remove liquidity and collect; returned assets are not automatically swapped. Account for gas and any later swap.",
        },
      ],
      foundations: ["liquidity", "divergence", "wallets"],
      tools: ["simulator", "impermanent-loss"],
    },
    depositAssets: ["USDC"],
    requirements: {
      requiredHoldings: ["USDC"],
      walletSetup: "Use an Ethereum wallet, hold USDC for the range and ETH for gas. Approve the Uniswap V3 position manager for the limited USDC amount needed; do not approve an unlimited amount. Learn about wallets, token approvals and gas before signing.",
      other: "Uniswap V3 has no automatic withdrawal; set boundary alerts and be prepared to remove liquidity. The Ethereum NonfungiblePositionManager is 0xC36442b4a4522E871399CD717aBDD847Ab11FE88; verify it on the official deployments page.",
    },
    conversionReversalRisk: "HIGH",
    conversionReversalExplanation: "If price recovers through the open range, accumulated ETH converts back to USDC; remove liquidity if you want to retain ETH.",
      referenceTitles: {
      [sources.uni]: "Uniswap V3 concentrated liquidity docs",
      [sources.uniMath]: "Uniswap V3 whitepaper",
      [sources.uniDeployments]: "Uniswap V3 Ethereum deployments",
    },
  },
  {
    legacyId: "STRATEGY_009",
    slug: "distribution-lp",
    name: "Distribution LP",
    summary:
      "Place an asset in a selling range to convert it into stablecoins as price rises.",
    description:
      "You put ETH into a range above its current price to sell progressively into USDC. This sets a conversion plan rather than promising the best possible selling price. Above the range the position holds USDC; a fall back through the range buys ETH again unless you remove liquidity.",
    objectives: ["capital-preservation"],
    assets: ["ETH", "USDC"],
    protocols: ["uniswap"],
    networks: ["ethereum"],
    steps: plan(
      "Choose ETH to sell, selling bounds and a proceeds-withdrawal trigger.",
      "Verify the Ethereum Uniswap V3 ETH/USDC pool and USDC-per-ETH bounds.",
      "Enter in ETH if the entire range is above spot; preview the mix for an in-range start.",
      "Track the USDC conversion and fees near selling bounds.",
      "Reconsider if price never reaches the range or selling completes; an open position can buy ETH back.",
      "Remove and collect USDC at your chosen trigger; check residual ETH and costs.",
    ),
    riskText:
      "Price may never enter the selling range. Leaving proceeds in the range risks unwanted repurchase during a reversal.",
    education: {
      family: "Liquidity Provision",
      goal: "sell",
      complexity: "Intermediate",
      management: "Active management",
      returnSource:
        "Swap fees while active; the objective is converting ETH into USDC, not maximising returns.",
      exposure:
        "ETH transitions to USDC; an open range reverses this transition during a fall. No debt.",
      tradeOff:
        "A planned conversion gives up some upside versus continuing to hold ETH.",
      fitsIf: [
        "You are willing to sell through these prices and monitor completion.",
      ],
      reconsiderIf: ["Your selling goal changes or the range completes."],
      example: {
        title: "Sell 1 ETH through 3,000–4,000 USDC",
        starting: "1 ETH at 2,800 USDC; range wholly above spot.",
        action: "Place ETH in a Uniswap V3 selling range.",
        assumptions:
          "Illustrative continuous V3 math with USDC = 1 USD; no fees, gas or tick rounding.",
        benchmark: "Hold 1 ETH outside the pool.",
        scenarios: [
          {
            label: "Selling completes",
            condition: "ETH reaches 4,000 USDC",
            assets: `0 ETH + ${money(sellProceeds)}`,
            value: `${money(sellProceeds)}; holding: 4,000 USDC`,
            next: "Remove proceeds if you do not want to buy ETH back.",
          },
          {
            label: "Price falls",
            condition: "ETH = 2,000 USDC without entering the range",
            assets: "1 ETH + 0 USDC",
            value: "2,000 USDC; holding: 2,000 USDC",
            next: "No sale took place and no active fees were earned.",
          },
          {
            label: "Reverses after completion",
            condition: "Rises to 4,000 then falls below 3,000 without removal",
            assets: "1 ETH + 0 USDC (fees excluded)",
            value: "At 2,800: 2,800 USDC; holding: 2,800 USDC",
            next: "An LP range is reversible; completion is not an automatic permanent sale.",
          },
        ],
      },
      monitor: lpMonitor,
      exit: "Remove and collect at the proceeds trigger. Record the final token mix; swap residual ETH only if intended.",
      implementations: [uni(["ETH", "USDC"])],
      foundations: ["liquidity", "divergence"],
      tools: ["simulator"],
    },
  },
  {
    legacyId: "STRATEGY_022",
    slug: "dual-asset-growth-lp",
    name: "Dual-Asset LP",
    summary:
      "Earn swap fees between two assets you are willing to keep as their quantities change.",
    description:
      "You supply two assets to a pool because you are willing to hold either of them. Trading changes their relative quantities, often leaving more of the asset that underperforms the other. Both dollar prices can rise while the LP still underperforms holding, so relative price behaviour matters more than a bull-market label.",
    objectives: ["liquidity", "growth"],
    assets: ["WETH", "WBTC"],
    protocols: ["uniswap"],
    networks: ["ethereum"],
    steps: plan(
      "Choose two assets you want to hold and write down the starting quantities.",
      "Select the Ethereum Uniswap V2 WETH/WBTC pair; confirm contracts, reserves and liquidity.",
      "Provide equal value for this V2 implementation and receive fungible LP tokens.",
      "Review the asset ratio, relative prices, fees and value versus holding regularly.",
      "Reconsider a loss of conviction in either token or an unacceptable holding shortfall.",
      "Remove V2 liquidity to receive both tokens; a final desired allocation may require a separate swap.",
    ),
    riskText:
      "Both assets can fall. Relative-price divergence, wrapper/custody risk and contracts can outweigh fees.",
    education: {
      family: "Liquidity Provision",
      goal: "liquidity",
      complexity: "Intermediate",
      management: "Regular monitoring",
      returnSource:
        "V2 swap fees remain in pool reserves; asset prices change principal value.",
      exposure:
        "Two volatile tokens including their wrapper risks; proportions change. No debt.",
      tradeOff:
        "Owning both assets does not mean their prices move together or LP beats holding.",
      fitsIf: ["You want both exposures and can accept changing proportions."],
      reconsiderIf: [
        "You no longer want one asset or relative-price divergence exceeds your tolerance.",
      ],
      example: {
        title: "Relative price matters",
        starting:
          "Illustrative equal-value V2 position: 1 WETH at 3,000 USD + 0.05 WBTC at 60,000 USD; total 6,000 USD.",
        action: "Provide full-range constant-product liquidity.",
        assumptions:
          "Arbitrage aligns pool price with market prices. Constant product x×y = 0.05; exclude fees, gas, incentives and rounding. This model is not used for concentrated positions.",
        benchmark: "Hold 1 WETH and 0.05 WBTC.",
        scenarios: [
          {
            label: "Both rise together",
            condition: "WETH 3,600 USD; WBTC 72,000 USD",
            assets: "1 WETH + 0.05 WBTC",
            value: "7,200 USD; holding: 7,200 USD",
            next: "Compare fees after costs; similar relative prices do not remove token risk.",
          },
          {
            label: "Relative prices diverge",
            condition: "WETH 1,500 USD; WBTC 60,000 USD",
            assets: "1.4142 WETH + 0.03536 WBTC",
            value:
              "4,242.64 USD; holding: 4,500 USD (257.36 USD shortfall before fees)",
            next: "Review whether the increased WETH exposure still fits; loss exists before withdrawal.",
          },
          {
            label: "Prices unchanged",
            condition: "WETH 3,000 USD; WBTC 60,000 USD",
            assets: "1 WETH + 0.05 WBTC (fees excluded)",
            value: "6,000 USD; holding: 6,000 USD",
            next: "Actual net benefit depends on fees and costs, not an assumed APY.",
          },
        ],
      },
      monitor: [
        "Both asset convictions, relative prices and wrapper risks.",
        "Pool liquidity, reserves and actual fee-adjusted performance versus holding.",
      ],
      exit: "Redeem LP tokens for both assets. Exiting does not rebalance into your original proportions.",
      implementations: [
        {
          ...uni(["WETH", "WBTC"], "Uniswap V2 constant-product pool"),
          key: "uniswap-v2-ethereum",
          requirements: [
            "WETH and WBTC on Ethereum in equal value for this V2 implementation, plus ETH for gas.",
            "Verify the canonical V2 pair, token addresses and current reserves; this is not a live pool opportunity quote.",
          ],
          enter:
            "Supply both tokens in the reserve ratio and receive fungible V2 LP tokens.",
          accounting:
            "V2 has fungible LP tokens and full-range reserves. Swap fees remain in reserves; no direct V3 NFT or range is involved.",
          exit: "Redeem the V2 LP tokens for both reserve assets; a swap is a separate action.",
          sources: [sources.uniV2],
        },
      ],
      foundations: ["liquidity", "divergence"],
      tools: ["correlation", "impermanent-loss"],
    },
  },
];

catalogue.push(hedgeStrategy)
for (const strategy of catalogue) strategy.education.editorialVersion = strategy.legacyId === "STRATEGY_018" ? "delta-neutral-lp-v3" : strategy.legacyId === "STRATEGY_001" ? "accumulation-lp-v2" : EDITORIAL_VERSION

// Complete observed inventory plus four additional archived records found in DB.
// Null destinations retire to contextual Learn, never another advanced catalogue.
export const consolidation: Record<
  string,
  { destination: string | null; lesson?: string; reason: string }
> = {
  STRATEGY_001: {
    destination: "accumulation-lp",
    reason: "Canonical unleveraged accumulation",
  },
  STRATEGY_002: {
    destination: null,
    lesson: "portfolio",
    reason: "Archived DCA record retained internally",
  },
  STRATEGY_003: {
    destination: "stablecoin-yield-rotation",
    reason: "Optional use of lending income",
  },
  STRATEGY_004: {
    destination: "blue-chip-asset-lending",
    reason: "Canonical crypto lending",
  },
  STRATEGY_005: {
    destination: null,
    lesson: "borrowing",
    reason: "Advanced debt education",
  },
  STRATEGY_006: {
    destination: null,
    lesson: "portfolio",
    reason: "Portfolio combination lesson",
  },
  STRATEGY_007: {
    destination: "eth-liquid-staking",
    reason: "Canonical combined staking",
  },
  STRATEGY_008: {
    destination: "eth-liquid-staking",
    reason: "SOL implementation of staking",
  },
  STRATEGY_009: {
    destination: "distribution-lp",
    reason: "Canonical distribution objective",
  },
  STRATEGY_010: {
    destination: null,
    lesson: "borrowing",
    reason: "Archived derivatives record retained internally",
  },
  STRATEGY_011: {
    destination: "stablecoin-yield-rotation",
    reason: "Canonical stablecoin lending",
  },
  STRATEGY_012: {
    destination: null,
    lesson: "borrowing",
    reason: "Debt repayment education",
  },
  STRATEGY_013: {
    destination: "stablecoin-yield-rotation",
    reason: "Reserve management within lending",
  },
  STRATEGY_014: {
    destination: null,
    lesson: "portfolio",
    reason: "Portfolio combination lesson",
  },
  STRATEGY_015: {
    destination: "concentrated-liquidity-provision",
    reason: "Range preset, not separate objective",
  },
  STRATEGY_016: {
    destination: "concentrated-liquidity-provision",
    reason: "Canonical fee-income range",
  },
  STRATEGY_017: {
    destination: null,
    lesson: "borrowing",
    reason: "Advanced debt/hedging education",
  },
  STRATEGY_018: {
    destination: "delta-neutral-lp-hedge",
    reason: "Actively delta-hedged LP; previous spot/perpetual plan and original research retained in revisions",
  },
  STRATEGY_019: {
    destination: null,
    lesson: "borrowing",
    reason: "Advanced stacked exposures",
  },
  STRATEGY_020: {
    destination: null,
    lesson: "rwa",
    reason: "Archived PT; not an RWA recommendation",
  },
  STRATEGY_021: {
    destination: null,
    lesson: "farming",
    reason: "No current incentive programme verified",
  },
  STRATEGY_022: {
    destination: "dual-asset-growth-lp",
    reason: "Canonical desired dual exposure",
  },
};
