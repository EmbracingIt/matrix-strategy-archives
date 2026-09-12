import type {
  ExposureLevel,
  ObjectiveKey,
  Regime,
  RiskLevel,
  SecondaryRegime,
} from "../../src/lib/types"

/**
 * Seed records for the INITIAL OFFICIAL STRATEGY COLLECTION.
 *
 * Each record is a complete Matrix Strategy Archive entry written to the
 * documentation quality standard of the existing Accumulation LP benchmark
 * (see prisma/seed.ts). Assets / protocols / networks are referenced by
 * SYMBOL / SLUG strings — the seed script resolves them to database rows.
 */

export interface SeedReference {
  title: string
  url: string // "" when the URL cannot be verified — NEVER invent links
  publisher?: string
  notes?: string
}

export interface SeedStep {
  title: string
  description: string
}

export interface SeedMarketFit {
  regimes: Regime[]
  /** 0–100 primary-regime fit scores (all three keys). */
  scores: Partial<Record<Regime, number>>
  /** Market Phases (Level-2 conditions) this strategy is tuned for. */
  secondaryRegimes: SecondaryRegime[]
  /** 0–100 phase fit scores for the declared phases. */
  secondaryScores: Partial<Record<SecondaryRegime, number>>
  /** WHY the strategy works in its regimes and weakens elsewhere. */
  explanation: string
}

export interface SeedRisk {
  overallRisk: RiskLevel
  /** Substantial, strategy-specific risk explanation. */
  explanation: string
  leverageUsed: boolean
  leverageAmount?: string
  liquidationExposure: ExposureLevel
  withdrawalRestrictions?: string
  lockupPeriod?: string
  incentiveReliance: ExposureLevel
  smartContractRisk: RiskLevel
  impermanentLoss: ExposureLevel
  assetVolatility: ExposureLevel
}

export interface SeedRequirements {
  minCapital?: string
  requiredHoldings: string[]
  walletSetup?: string
  other?: string
}

export interface SeedStrategy {
  strategyId: string
  name: string
  slug: string
  type: string
  status: "PUBLISHED"
  /** Curated user-facing objectives (exact keys, no duplicates). */
  objectives: ObjectiveKey[]
  /** One or two sentences that explain the strategy immediately. */
  summary: string
  /** Substantial long-form overview (3–5 paragraphs, \n\n separated). */
  description: string
  marketFit: SeedMarketFit
  /** 4–7 ordered steps, each with 2–4 sentences of real execution detail. */
  steps: SeedStep[]
  /** 4–6 actionable entry decision rules. */
  entryConditions: string[]
  /** 4–6 exit decision rules — what invalidates the strategy. */
  exitConditions: string[]
  risk: SeedRisk
  requirements: SeedRequirements
  /** 3–5 references; only verified URLs, otherwise url: "" */
  references: SeedReference[]
  /** ISO date "YYYY-MM-DD" — must not be in the future. */
  lastReviewedAt: string
  /** Asset SYMBOLS, e.g. ["ETH", "USDC"]. */
  depositAssets: string[]
  exposureAssets: string[]
  rewardAssets: string[]
  /** Network SLUGS, e.g. ["ethereum", "arbitrum"]. */
  networks: string[]
  /** Protocol SLUGS, e.g. ["uniswap", "aave"]. */
  protocols: string[]
}
