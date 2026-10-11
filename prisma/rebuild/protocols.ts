import type { ProtocolReview } from "../../src/lib/education";
import { sources } from "./content";
type Entry = {
  name: string;
  slug: string;
  website: string;
  description: string;
  review: ProtocolReview;
};
const reviewed = (
  categories: string[],
  products: ProtocolReview["products"],
  docs: string[],
  risks: string,
  exit: string,
): ProtocolReview => ({
  categories,
  products,
  docs,
  status: "reviewed",
  reviewedAt: "2026-10-08",
  prerequisites:
    "Use a compatible wallet and native network fees. Verify the specific token, market or pool before approving funds.",
  exit,
  risks,
  unresolved:
    "Identity and named product mechanics reviewed only. Individual pools, rates, audits and user eligibility are not certified.",
});
export const reviewedProtocols: Entry[] = [
  {name:"Hyperliquid",slug:"hyperliquid",website:"https://app.hyperliquid.xyz",description:"Trade spot assets and margined perpetual contracts on HyperCore.",review:reviewed(["Perpetual Futures Exchanges"],[{name:"USDC-margined ETH perpetual",networks:["HyperCore; USDC deposit route from Arbitrum"],purpose:"An ETH short can offset current LP ETH delta, with active resizing as inventory changes; margin and funding obligations remain."}],["https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-start-trading","https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining","https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding","https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"],"Liquidation, changing funding, mark-price/basis differences, execution, USDC, platform and deposit-route risks. Check jurisdiction eligibility.","Reduce-only close the short, verify residual exposure and withdraw free collateral through the official route.")},
  {
    name: "Aave",
    slug: "aave",
    website: "https://aave.com",
    description:
      "Supply assets to markets where borrowers pay variable interest.",
    review: reviewed(
      ["Lending/Borrowing"],
      [
        {
          name: "Aave V3",
          networks: ["Ethereum"],
          purpose:
            "USDC and WETH supply without borrowing in the archive plans.",
        },
      ],
      [sources.aaveSupply, sources.aave],
      "Contracts, bad debt, asset risk and unavailable withdrawal liquidity.",
      "Withdraw when market liquidity permits; existing debt can constrain withdrawal.",
    ),
  },
  {
    name: "Compound",
    slug: "compound",
    website: "https://compound.finance",
    description:
      "Compound III has Ethereum USDC markets where suppliers can earn variable base-asset interest.",
    review: {
      ...reviewed(
        ["Lending/Borrowing"],
        [
          {
            name: "Compound III USDC market",
            networks: ["Ethereum"],
            purpose: "Supply USDC as the base asset and earn variable market interest; borrowing is not part of this strategy.",
          },
        ],
        ["https://docs.compound.finance/", "https://docs.compound.finance/interest-rates/"],
        "Market contracts, bad debt, utilization-driven rate changes, USDC issuer and peg risk, and withdrawal liquidity.",
        "Withdraw USDC when the selected market has available liquidity.",
      ),
      reviewedAt: "2026-10-11",
      unresolved:
        "Product mechanics and the documented Ethereum USDC market were checked; live rates, market parameters, audits and individual user eligibility are not certified.",
    },
  },
  {
    name: "Spark",
    slug: "spark",
    website: "https://spark.finance",
    description:
      "Spark Savings USDC V2 (spUSDC) is a savings vault using the Spark Liquidity Layer; it is distinct from a direct lending-market deposit.",
    review: {
      ...reviewed(
        ["Lending/Borrowing", "Yield Aggregation"],
        [
          {
            name: "Spark Savings USDC V2 (spUSDC)",
            networks: ["Ethereum", "X Layer"],
            purpose: "Deposit USDC into an ERC-4626 savings vault; yield comes through the Spark Liquidity Layer, rather than direct USDC borrower interest.",
          },
        ],
        ["https://docs.spark.finance/products/spark-savings", "https://app.spark.finance/savings"],
        "Vault and allocator contracts, underlying deployments and USDS backing, governance-managed rates, USDC issuer and peg risk, and redemption liquidity.",
        "Redeem spUSDC through the official Spark Savings app; larger Ethereum withdrawals can use a liquidity-intent request.",
      ),
      reviewedAt: "2026-10-11",
      unresolved:
        "Product mechanics and documented supported networks were checked; live rates, vault state, audits, underlying allocations and individual user eligibility are not certified.",
    },
  },
  {
    name: "Uniswap",
    slug: "uniswap",
    website: "https://uniswap.org",
    description: "Trade tokens or provide liquidity that earns swap fees.",
    review: reviewed(
      ["Decentralized Exchanges"],
      [
        {
          name: "V3",
          networks: ["Ethereum"],
          purpose: "Buying, selling and fee-income ranges; not V4 hooks.",
        },
        {
          name: "V2",
          networks: ["Ethereum"],
          purpose: "Full-range two-asset liquidity with fungible LP tokens.",
        },
      ],
      [sources.uni, sources.uniMath, sources.uniV2],
      "Divergence versus holding, inactive V3 ranges, tokens and contracts.",
      "Remove liquidity and collect; token mix changes. V3 fees do not automatically compound in a direct position.",
    ),
  },
  {
    name: "Lido",
    slug: "lido",
    website: "https://lido.fi",
    description: "Stake ETH and receive stETH; optionally wrap it as wstETH.",
    review: reviewed(
      ["Liquid Staking"],
      [
        {
          name: "Lido Core liquid staking",
          networks: ["Ethereum"],
          purpose: "ETH staking; rebasing stETH and exchange-rate wstETH.",
        },
      ],
      [sources.lido, sources.lidoExit],
      "Slashing, operators, contracts, token discounts and withdrawal timing.",
      "Request and later claim ETH through the queue, or sell at a market price.",
    ),
  },
  {
    name: "Jito",
    slug: "jito",
    website: "https://www.jito.network",
    description: "Stake SOL through a pool and receive JitoSOL.",
    review: reviewed(
      ["Liquid Staking"],
      [
        {
          name: "JitoSOL stake pool",
          networks: ["Solana"],
          purpose: "Staking and MEV rewards reflected in SOL per JitoSOL.",
        },
      ],
      [sources.jito, sources.jitoExit],
      "Validators, stake-pool contracts, fees and market discounts.",
      "Compare instant routes with withdrawal to a stake account and subsequent deactivation.",
    ),
  },
  {
    name: "Morpho",
    slug: "morpho",
    website: "https://morpho.org",
    description: "Lend through individual markets or curator-managed vaults.",
    review: reviewed(
      ["Lending/Borrowing"],
      [
        {
          name: "Morpho Blue variable-rate markets",
          networks: ["Ethereum (documentation scope)"],
          purpose:
            "Market-specific collateral, oracle and rate parameters; vaults add curator choices.",
        },
      ],
      [
        "https://docs.morpho.org/learn/",
        "https://github.com/morpho-org/morpho-blue",
      ],
      "Market collateral, oracles, bad debt and curator decisions for vaults.",
      "Withdrawal depends on market/vault liquidity. No Morpho vault has been selected for the launch strategies.",
    ),
  },
  {
    name: "Orca",
    slug: "orca",
    website: "https://www.orca.so",
    description: "Concentrated liquidity trading pools on Solana.",
    review: reviewed(
      ["Decentralized Exchanges"],
      [
        {
          name: "Whirlpools",
          networks: ["Solana"],
          purpose:
            "Concentrated liquidity; SDK/program identity checked, not individual pools.",
        },
      ],
      [
        "https://github.com/orca-so/whirlpools",
        "https://orca-so.github.io/whirlpools/",
      ],
      "Token, program, range and price-divergence risks.",
      "Remove position liquidity and collect fees/rewards; no archive implementation is currently selected.",
    ),
  },
  {
    name: "Suilend",
    slug: "suilend",
    website: "https://suilend.fi",
    description: "Supply or borrow assets through lending markets on Sui.",
    review: reviewed(
      ["Lending/Borrowing"],
      [
        {
          name: "Suilend lending",
          networks: ["Sui"],
          purpose:
            "Borrower interest on supplied assets; other suite products are separate.",
        },
      ],
      [
        "https://docs.suilend.fi/",
        "https://docs.suilend.fi/ecosystem/suilend-sdk-guide",
      ],
      "Bad debt, asset/oracle risk, contracts and withdrawal liquidity.",
      "Withdraw subject to lending-market conditions; not a currently selected archive implementation.",
    ),
  },
  {
    name: "Aerodrome",
    slug: "aerodrome",
    website: "https://aerodrome.finance",
    description:
      "Provide liquidity on Base; some positions can receive AERO incentives.",
    review: reviewed(
      ["Decentralized Exchanges"],
      [
        {
          name: "Stable and volatile pools",
          networks: ["Base"],
          purpose:
            "Pool mechanics differ; fee and reward entitlement depends on how the position is held/staked.",
        },
      ],
      [
        "https://aerodrome.finance/docs",
        "https://github.com/aerodrome-finance/docs/blob/main/content/liquidity.mdx",
      ],
      "Pool/token risks and incentive emissions; stable-pool assumptions can fail.",
      "Review staking, reward claims and liquidity-removal order for the exact pool. No active reward programme is certified here.",
    ),
  },
];
// All remaining supplied candidates are retained in the same Protocol registry,
// visible to administrators. No guessed official links or deployment claims.
export const candidates = [
  ["Raydium", "raydium", "Decentralized Exchanges"],
  ["PancakeSwap", "pancakeswap", "Decentralized Exchanges"],
  ["QuickSwap", "quickswap", "Decentralized Exchanges"],
  ["SushiSwap", "sushiswap", "Decentralized Exchanges"],
  ["JustLend", "justlend", "Lending/Borrowing"],
  ["Kamino Lend", "kamino", "Lending/Borrowing"],
  ["Venus Core Pool", "venus", "Lending/Borrowing"],
  ["Hyperliquid", "hyperliquid", "Perpetual Futures Exchanges"],
  ["Jupiter", "jupiter", "Perpetual Futures Exchanges"],
  ["GMX", "gmx", "Perpetual Futures Exchanges"],
  ["Marinade", "marinade", "Liquid Staking"],
];
export const pendingReview = (category: string): ProtocolReview => ({
  categories: [category],
  status: "candidate",
  products: [],
  docs: [],
  reviewedAt: null,
  prerequisites: "Pending product-specific verification.",
  exit: "Pending product-specific verification.",
  risks: "No safety assessment has been made.",
  unresolved:
    "Verify identity, official links, current product/version, deployments and withdrawal mechanics before publishing.",
});
