import type { StrategyEducation } from "../../src/lib/education";
import { EDITORIAL_VERSION } from "./market-context";
import { hedgeStrategy } from "./hedge";

const reviewedAt = "2026-10-08";
export const sources = {
  aave: "https://aave.com/help/supplying/withdraw-tokens",
  aaveSupply: "https://aave.com/help/supplying/supply-tokens",
  compoundSupply: "https://docs.compound.finance/",
  compoundRates: "https://docs.compound.finance/interest-rates/",
  sparkSavings: "https://docs.spark.finance/products/spark-savings",
  sparkApp: "https://app.spark.finance/savings",
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
const stablecoinLendingOptions = [
  { ...lending("USDC"), reviewedAt: "2026-10-11" },
  {
    key: "compound-usdc",
    label: "USDC · Compound III · Ethereum",
    protocol: "compound",
    product: "Compound III USDC supply",
    network: "ethereum",
    assets: ["USDC"],
    requirements: ["USDC on Ethereum; ETH reserved for transaction costs.", "Verify the Compound III USDC market, supply cap and withdrawal liquidity."],
    enter: "Choose the Ethereum USDC market in Compound III and supply USDC; do not borrow as part of this plan.",
    accounting: "The USDC base-asset balance earns variable supply interest; check whether any separate rewards apply.",
    exit: "Withdraw USDC when market liquidity permits.",
    risks: "Protocol and market-contract risks, bad debt, USDC issuer and peg risk, and withdrawal liquidity.",
    sources: [sources.compoundSupply, sources.compoundRates],
    reviewedAt: "2026-10-11",
  },
  {
    key: "spark-spusdc",
    label: "USDC · Spark Savings spUSDC · Ethereum",
    protocol: "spark",
    product: "Spark Savings USDC V2 (spUSDC)",
    network: "ethereum",
    assets: ["USDC"],
    requirements: ["USDC on Ethereum; ETH reserved for transaction costs.", "Confirm the current Spark USDC vault and its supported deposit and withdrawal route."],
    enter: "Deposit USDC to Spark Savings spUSDC. This is a savings vault using Spark's Liquidity Layer, not a direct borrower-funded lending pool.",
    accounting: "Vault shares represent a claim on USDC; yield comes from the Spark Liquidity Layer and rates are governed, not fixed.",
    exit: "Redeem spUSDC through the official Spark app; larger withdrawals may use a liquidity-intent flow.",
    risks: "Vault, allocator, underlying deployment, USDS backing, USDC issuer and peg, smart-contract and withdrawal risks.",
    sources: [sources.sparkSavings, sources.sparkApp],
    reviewedAt: "2026-10-11",
  },
];
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
  leverageUsed?: boolean;
  leverageAmount?: string;
  liquidationExposure?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
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
      "Put USDC that would otherwise sit idle to work while it waits for a later allocation.",
    description:
      "The main benefit is activating capital that might otherwise sit idle while you wait to allocate it. In an uncertain or sideways market, USDC can earn a variable return without deliberately buying a volatile asset. Aave and Compound are lending markets; Spark's spUSDC is a savings vault with a different yield source and risk path. Rates change, and neither USDC's peg nor immediate withdrawal is guaranteed.",
    objectives: ["yield", "capital-preservation"],
    assets: ["USDC"],
    protocols: ["aave", "compound", "spark"],
    networks: ["ethereum"],
    steps: plan(
      "Choose an amount you can leave exposed; keep emergency funds and gas outside the position.",
      "Choose Aave V3, Compound III, or Spark Savings spUSDC on Ethereum. Confirm the exact product, rate, caps and withdrawal route; Spark's vault is not a direct lending pool.",
      "Approve only the intended amount and supply or deposit it. Spark Savings returns spUSDC; leave borrowing out of this plan.",
      "Check the selected product's rate, utilisation where applicable, redemption liquidity, USDC peg and gas cost weekly and after alerts.",
      "Review a depeg, market pause, deteriorating liquidity or a net rate too small to justify the risk and costs.",
      "Withdraw or redeem through the selected product when available; confirm the returned balance, then revoke unused approvals.",
    ),
    riskText:
      "A stable price target does not eliminate loss. USDC can depeg; lending markets can incur bad debt or contract failure; and savings vaults add their own allocation and redemption risks.",
    education: {
      family: "Lending",
      goal: "earn",
      complexity: "Basic",
      management: "Occasional checks",
      returnSource:
        "Aave and Compound supply interest comes from lending-market demand. Spark spUSDC yield comes through the Spark Liquidity Layer; any incentives are separate. Rates are variable.",
      exposure: "A claim on supplied USDC. No debt is opened in this plan.",
      tradeOff:
        "Earn a variable return on waiting USDC while accepting stablecoin, protocol, product-specific and withdrawal-liquidity risks.",
      fitsIf: [
        "You want income on stablecoins you already intend to hold.",
        "You can tolerate delays in accessing this portion of your funds.",
      ],
      reconsiderIf: [
        "The stablecoin loses its peg or withdrawal liquidity deteriorates.",
        "The net interest or vault yield no longer justifies the risk and costs.",
      ],
      example: {
        title: "3,000 USDC on Aave for six months",
        starting:
          "During an uncertain, sideways market, supply 3,000 USDC on Aave V3 while the capital waits to be allocated. No crypto asset is bought in this example.",
        action: "Supply USDC without borrowing. If 4% APY stayed constant for six months, the balance would be about 3,059.41 USDC: roughly 59.41 USDC earned while capital waits, before gas and other costs. Holding the same USDC in a wallet would leave the balance at 3,000 USDC.",
        assumptions:
          "Illustrative only: a constant 4% APY for six months gives about 3,059.41 USDC using 3,000 × (1.04^0.5). APY compounds by definition; actual supply rates vary and this is not a current quote or forecast. Excludes gas and incentives; assumes USDC stays at 1 USD.",
        benchmark:
          "Hold 3,000 USDC outside the lending market over the same six months, ready for a later allocation.",
        scenarios: [
          {
            label: "Illustrative 4% APY",
            condition: "Rate stays at 4% APY for six months; USDC remains at $1.",
            assets: "About 3,059.41 USDC",
            value: "About 3,059.41 USD; holding: 3,000 USD before gas and other costs.",
            next: "The roughly 59.41 USDC difference is not guaranteed; compare expected net return with transaction costs.",
          },
          {
            label: "Rate falls",
            condition: "For illustration, APY averages 1% for the six months; USDC stays at $1.",
            assets: "About 3,014.96 USDC",
            value: "About 3,014.96 USD; holding: 3,000 USD, before gas.",
            next: "A lower rate may leave little after transaction costs; the APY can change while supplied.",
          },
          {
            label: "USDC depegs",
            condition: "The 4% APY illustration holds, but USDC is worth $0.90 at exit.",
            assets: "About 3,059.41 USDC",
            value: "About 2,753.47 USD; holding: 2,700 USD at the same peg.",
            next: "Interest does not remove issuer or depeg risk; compare exit liquidity before supplying.",
          },
        ],
      },
      monitor: [
        "The selected market rate or vault yield, and the product's withdrawal or redemption liquidity.",
        "Stablecoin peg, reserve warnings and supply caps.",
        "Gas cost versus income; review weekly and after material changes.",
      ],
      exit: "Withdraw or redeem through the selected product when available; do not assume immediate access during high utilisation or market stress.",
      implementations: stablecoinLendingOptions,
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
      "Borrow USDC against ETH you intend to keep, then use a Uniswap V3 range to accumulate additional ETH without selling your core exposure.",
    description:
      "Use ETH you already hold as collateral for a USDC loan, then place the borrowed USDC in a Uniswap V3 range wholly below spot. This keeps your original ETH exposure while the range may accumulate additional ETH as price falls; it does not remove downside exposure. The USDC debt accrues interest, collateral value can fall, and the lending market may liquidate collateral before a recovery. If price recovers through the open range, accumulated LP ETH converts back to USDC. The lending market is not selected or reviewed by this archive, so this record does not specify rates or collateral parameters.",
    objectives: ["accumulation"],
    assets: ["USDC", "ETH"],
    protocols: ["uniswap"],
    networks: ["ethereum"],
    steps: plan(
      "Decide how much ETH collateral you can afford to pledge and how you would repay the USDC debt under a large ETH decline. Do not assume you can wait for a recovery.",
      "Choose and verify a lending market separately from Uniswap V3. Check collateral eligibility, available USDC, variable borrow rate, liquidation terms and health monitoring; this archive has not selected a lender.",
      "Supply eligible ETH collateral and borrow only an amount you can manage. Place borrowed USDC in a buying range wholly below spot; reserve ETH for gas. An in-range start is a different two-sided LP, not this plan.",
      "Set alerts for both LP range boundaries and monitor the lending account's collateral health and accrued debt. A sharp move can fill the range within minutes while weakening collateral at the same time.",
      "If collateral health worsens, assess repayment or additional collateral early. ETH held in the LP is not automatically collateral; withdrawing it to supply or sell changes the LP and may add costs or tax events.",
      "Remove liquidity, collect assets, and decide whether to repay the loan plus interest before withdrawing pledged ETH. Recovery through an open LP range converts its ETH back to USDC.",
    ),
    riskText:
      "This plan adds collateralized borrowing to Uniswap V3. ETH price declines can reduce collateral health while LP assets and debt move differently; liquidation may occur before a recovery. Borrow rates can change and accrue against the USDC debt. The lending market is not selected or reviewed by this archive. Uniswap and lender contract failures, oracle or governance changes, USDC issuer freeze/blacklist or depeg, LP conversion reversal, fees and transaction costs also apply.",
    leverageUsed: true,
    leverageAmount: "USDC loan secured by ETH collateral; amount and rate depend on the selected lending market",
    liquidationExposure: "HIGH",
    education: {
      family: "Liquidity Provision",
      goal: "accumulate",
      complexity: "Intermediate",
      management: "Active management",
      returnSource:
        "The objective is to accumulate ETH with borrowed USDC while retaining existing ETH exposure. LP fees may accrue while active, but borrowing interest is a cost and can exceed fee income; no return is promised.",
      exposure:
        "Existing ETH remains pledged as collateral; borrowed USDC debt accrues interest. The LP progressively converts USDC into ETH below spot. ETH declines can reduce collateral health and LP value at the same time.",
      tradeOff:
        "Borrowing can fund the range without selling your existing ETH exposure, but adds variable interest, lender and smart-contract risk, and liquidation exposure. LP conversion is still reversible: recovery through an open range sells LP-held ETH back to USDC. Fees are not guaranteed and may not cover borrowing costs. Liquidation can happen before a market recovery.",
      fitsIf: [
        "You already hold ETH accepted as collateral and can withstand a large further decline without relying on a recovery.",
        "You can monitor both LP boundaries and loan health, and have a concrete repayment or collateral plan.",
      ],
      reconsiderIf: [
        "You cannot monitor the loan and LP together or cannot add collateral or repay if conditions worsen.",
        "Borrowing costs exceed expected benefits, collateral health deteriorates, or you no longer want the combined ETH and debt exposure.",
      ],
      example: {
        title: "Example case: borrow 3,000 USDC for a $3,000–$2,600 ETH range",
        starting: "ETH is $3,000. Keep eligible ETH as collateral rather than selling it; borrow 3,000 USDC only if the selected lending market's terms and your downside plan allow it.",
        action: "Place borrowed USDC in a Uniswap V3 buying range from $3,000 to $2,600. The range may accumulate ETH as price falls while the original collateral retains ETH exposure.",
        assumptions: "This is one possible path, not a forecast. The 30% APY fee assumption is hypothetical, not live; lender, borrowing rate, collateral amount, liquidation terms, gas and tax treatment are unspecified.",
        benchmark: "Compare with holding 1 ETH without a loan. A full comparison also needs the pledged collateral, debt and interest; an LP balance alone is not net return.",
        scenarios: [
          {
            label: "ETH falls to $2,600",
            condition: "After 1.5 months, the LP range contains about 1.1127 ETH, including the hypothetical fee assumption.",
            assets: "About 1.1127 ETH in the LP; pledged ETH collateral remains separate.",
            value: "LP assets are about $2,893. The 3,000 USDC debt plus borrowing interest remains due; this is not total portfolio value or net return.",
            next: "Collateral health may worsen as ETH falls. Liquidation can occur before a recovery; no lending market or liquidation threshold is specified here.",
          },
          {
            label: "ETH falls, then returns to $3,000",
            condition: "As price recovers above the range, the LP converts back to about 3,000 USDC principal, plus any fees earned while active.",
            assets: "About 3,000 USDC principal plus fees; pledged ETH collateral remains separate.",
            value: "Under the same simplified fee assumption, fees are about $100 equivalent. After repaying 3,000 USDC principal, they offset interest and costs only if actual fee proceeds exceed them.",
            next: "Fee income is uncertain and may not cover borrowing interest, gas or other costs. Collateral may still be liquidated before a recovery.",
          },
          {
            label: "ETH rises without entering the range",
            condition: "If ETH moves above $3,000 and never trades through the range, the LP can remain in USDC.",
            assets: "LP remains around 3,000 USDC; pledged ETH collateral keeps its ETH price exposure.",
            value: "The collateral's value can rise with ETH, while the debt remains 3,000 USDC plus interest.",
            next: "The LP may earn little or no fees if its liquidity is not active. This path preserves collateral upside but does not guarantee a net gain.",
          },
        ],
      },
      monitor: [
        "Set price alerts at both LP range boundaries and monitor the lending account's collateral health and accrued debt. A sharp move can fill the whole range within minutes.",
        "Review the LP token mix near each boundary; compare actual fee income with borrowing interest and transaction costs.",
        "A 0.05% versus 0.3% fee tier changes fee capture and can affect pool use and fill behaviour. Fee income is small relative to price moves; arbitrageurs fill at market-aligned prices (adverse selection), so do not expect the LP to beat a plain limit order on price.",
        "Minting, collecting and removing on Ethereum mainnet can take a meaningful share of a small position. Size accordingly; other networks and L2 deployments have different costs and are separate implementations in this archive.",
        "Supplying collateral, borrowing, LP swaps and removing liquidity may have tax consequences depending on jurisdiction. Check local rules.",
      ],
      exit: "Uniswap V3 has no automatic withdrawal. Remove and collect the LP assets, then assess repaying the USDC debt plus interest before withdrawing pledged collateral. If left open, a price recovery sells LP-held ETH back into USDC.",
      implementations: [
        {
          ...uni(["ETH", "USDC"]),
          sources: [sources.uni, sources.uniMath, sources.uniDeployments],
          risks: "Collateralized borrowing adds variable-rate and liquidation risk: falling ETH collateral value can put the loan at risk before a market recovery. The archive has not selected or reviewed a lending market; verify its collateral rules, borrow rate, health monitoring and repayment path. Also consider Uniswap smart-contract or pool failure; USDC issuer freeze/blacklist or depeg; price-conversion and adverse-selection risk; and changing pool activity. Minting and withdrawal have MEV/sandwich exposure; consider a protected RPC for larger positions. Protect the position NFT: review approvals before signing and verify the NFT in the official interface to avoid phishing approvals and fake position NFTs.",
          requirements: [
            "ETH collateral in a separately selected lending market, plus ETH reserved for gas; USDC borrowed for the wholly-below-spot range. This archive has not selected or reviewed a lender.",
            "Before borrowing, verify supported collateral, available liquidity, current variable rate, loan-to-value and liquidation terms in the chosen market. Monitor its collateral health; adding ETH held inside an LP requires first withdrawing that ETH from the LP.",
            "Approve the Uniswap V3 NonfungiblePositionManager for the specific USDC amount required; avoid unlimited approvals. Verify the manager address against Uniswap's official Ethereum deployments page.",
            "An in-range start needs both assets and is a different two-sided LP with a different risk profile. See the Dual-Asset LP record.",
            "This supported plan is on Uniswap V3 Ethereum; other networks and L2s are separate implementations with different costs.",
          ],
          enter:
            "After verifying the lending market and debt plan, borrow USDC against eligible ETH collateral and enter the Uniswap V3 range with borrowed USDC only; set the full range below spot. If price is already in range, treat that as a different two-sided position. Verify USDC-per-ETH orientation.",
          exit: "Uniswap V3 has no automatic withdrawal. Remove liquidity and collect; returned assets are not automatically swapped. Assess repaying the USDC debt plus interest before withdrawing collateral. If left open, a price recovery sells LP-held ETH back into USDC. Account for gas and any later swap.",
        },
      ],
      foundations: ["liquidity", "divergence", "wallets", "borrowing"],
      tools: ["simulator", "impermanent-loss"],
    },
    depositAssets: ["USDC"],
    requirements: {
      requiredHoldings: ["ETH"],
      walletSetup: "Use an Ethereum wallet with ETH eligible for collateral, and reserve ETH for gas. Select and verify a lending market; borrowed USDC funds the range. Approve only the intended collateral and USDC amounts for the correct protocols. Learn about wallets, token approvals, borrowing and gas before signing.",
      other: "Borrow rates, collateral requirements and liquidation thresholds depend on the lending market, which this archive has not selected or reviewed. Uniswap V3 has no automatic withdrawal; set LP and collateral-health alerts. The Ethereum NonfungiblePositionManager is 0xC36442b4a4522E871399CD717aBDD847Ab11FE88; verify it on the official deployments page.",
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
      "Choose BTC and ETH exposures you are willing to hold, and decide how much capital you can risk if their relative prices diverge.",
      "For the example implementation, verify the Ethereum Uniswap V3 WBTC/WETH 0.05% pool, token contracts and current liquidity; the supplied APY screenshot is not a live quote.",
      "Choose an explicit price range and supply the WBTC/WETH mix it requires. V3 positions use an NFT; fees accrue only while the position is in range.",
      "Monitor the WBTC/WETH relative price, range status, fee accrual and total value against holding the same mix; both USD prices rising does not ensure the LP outperforms.",
      "Reconsider if the position is out of range, relative-price changes leave you with an unwanted mix, or fees no longer justify management and costs.",
      "Remove liquidity and collect fees. You receive the position's current token mix, which can differ from the starting mix; any rebalance is a separate trade.",
    ),
    riskText:
      "Both assets can fall. Relative-price divergence, wrapper/custody risk and contracts can outweigh fees.",
    education: {
      family: "Liquidity Provision",
      goal: "liquidity",
      complexity: "Intermediate",
      management: "Regular monitoring",
      returnSource:
        "Uniswap V3 swap fees accrue separately while the position is active; asset prices and their relative ratio change principal value.",
      exposure:
        "Two volatile tokens, including their wrapper risks; the mix changes with WBTC/WETH relative price. The base LP is unleveraged; the worked example adds a USDC loan and liquidation exposure.",
      tradeOff:
        "Owning both assets does not mean their prices move together or LP beats holding.",
      fitsIf: ["You want both exposures and can accept changing proportions."],
      reconsiderIf: [
        "You no longer want one asset or relative-price divergence exceeds your tolerance.",
      ],
      example: {
        title: "Three months in the WBTC/WETH 0.05% pool",
        starting:
          "Illustrative leveraged example: borrow 3,000 USDC against eligible BTC and ETH collateral, then convert 1,500 USD-equivalent to WBTC and 1,500 USD-equivalent to WETH for the Ethereum Uniswap V3 pool shown in the supplied screenshot.",
        action: "Choose and verify a V3 price range, then mint a position. Compare it with holding the same borrowed WBTC/WETH mix while keeping the same collateral and debt.",
        assumptions:
          "The screenshot shows 37.04% APY, but its capture date is not visible. For arithmetic only, assume that APY persists for three months, both assets rise 20% against USD while WBTC/WETH stays at the same relative price, and the position remains in range. Estimated fees are about 245.88 USD-equivalent using 3,000 × ((1 + 0.3704)^(3/12) − 1). The lender, interest rate, collateral size, chosen range and transaction costs are unspecified.",
        benchmark: "Hold the same borrowed asset mix and repay the same loan; the original BTC and ETH collateral is common to both paths and excluded from these LP-leg values.",
        scenarios: [
          {
            label: "Both rise 20%; relative price holds",
            condition: "The position remains in range for three months; use the screenshot APY only as a constant illustration.",
            assets: "The starting WBTC/WETH mix remains similar before fees.",
            value: "LP: about 3,845.88 USD including estimated fees. Same-mix HODL: 3,600 USD. Both figures are before debt repayment and costs.",
            next: "The estimated 245.88 USD fee difference is before added LP costs and loan interest. The same interest applies to both borrowed paths; pledged collateral is not included.",
          },
          {
            label: "Prices stay near entry",
            condition: "BTC/WBTC and ETH prices are unchanged for the three months.",
            assets: "The position stays in range and retains roughly its initial mix; token fees may vary.",
            value: "If the same APY assumption held, LP value would be about 3,245.88 USD versus 3,000 USD for same-mix HODL, before debt and costs.",
            next: "Do not treat a pool APY snapshot as a forecast; actual fees depend on trading, active liquidity and your position's share.",
          },
          {
            label: "Relative prices diverge",
            condition: "ETH and BTC do not rise by the same percentage, or price exits the chosen V3 range.",
            assets: "The LP can shift toward one token; outside the range it may hold one asset and stop earning fees until price re-enters.",
            value: "No portfolio value is estimated: the result depends on the selected range and full relative-price path.",
            next: "Compare the final token mix with holding both assets. Rising USD prices can still coincide with LP underperformance if their relative price changes.",
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
          ...uni(["WETH", "WBTC"], "Uniswap V3 0.05% concentrated-liquidity pool"),
          key: "uniswap-v3-ethereum-005-wbtc-weth",
          requirements: [
            "WETH and WBTC on Ethereum, plus ETH for gas and any initial swaps needed to obtain the pool's token mix.",
            "Choose a price range and verify the exact Uniswap V3 WBTC/WETH pool, 0.05% fee tier, token addresses and current liquidity. The supplied APY image is not a live opportunity quote.",
          ],
          enter:
            "Approve only the required WBTC and WETH amounts, choose price bounds, and mint the V3 position NFT. Confirm the displayed token mix and that the current price is in range.",
          accounting:
            "A V3 position has a chosen price interval and is represented by an NFT. The asset mix changes with WBTC/WETH relative price; fees accrue separately while active and do not automatically compound.",
          exit: "Remove liquidity and collect fees from the position NFT. The returned WBTC/WETH mix may differ from entry; any conversion is a separate swap.",
          sources: [sources.uni],
        },
      ],
      foundations: ["liquidity", "divergence"],
      tools: ["correlation", "impermanent-loss"],
    },
  },
];

catalogue.push(hedgeStrategy)
for (const strategy of catalogue) strategy.education.editorialVersion = strategy.legacyId === "STRATEGY_018" ? "delta-neutral-lp-v3" : strategy.legacyId === "STRATEGY_001" ? "accumulation-lp-v6" : strategy.legacyId === "STRATEGY_022" ? "dual-asset-lp-v4" : strategy.legacyId === "STRATEGY_011" ? "stablecoin-lending-v4" : EDITORIAL_VERSION

// Complete observed inventory plus four additional archived records found in DB.
// Null destinations retire to contextual Learn, never another advanced catalogue.
export const consolidation: Record<
  string,
  { destination: string | null; lesson?: string; reason: string }
> = {
  STRATEGY_001: {
    destination: "accumulation-lp",
    reason: "Canonical collateral-backed accumulation",
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
