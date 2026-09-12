// Matrix Strategy Archives — shared domain types.
// These types are the contract between the database, the REST API and both
// the public site and the admin CMS. Matrix Finance / AI agents will consume
// the same shapes via /api/*.

// --- Enums (stored as plain uppercase strings for DB portability) -----------

export type Regime = "BULL" | "SIDEWAYS" | "BEAR"
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
export type ExposureLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH"
export type StrategyStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

/**
 * User-facing Archive objectives (see lib/strategyObjectives.ts for the
 * definitions). Stored per-strategy in Strategy.objectivesJson; records
 * without curated objectives fall back to the type-derived mapping.
 */
export type ObjectiveKey =
  | "yield"
  | "accumulation"
  | "liquidity"
  | "capital-preservation"
  | "growth"
  | "hedging"
  | "advanced"

export const OBJECTIVE_KEYS: ObjectiveKey[] = [
  "yield",
  "accumulation",
  "liquidity",
  "capital-preservation",
  "growth",
  "hedging",
  "advanced",
]

/**
 * Level-2 market conditions — more time-specific, directional or phase-specific
 * than the three primary regimes. Optional metadata: a strategy may declare zero
 * or more. See src/lib/secondary-regimes.ts for the canonical definitions.
 */
export type SecondaryRegime =
  | "EARLY_RECOVERY"
  | "BTC_LED_EXPANSION"
  | "ALT_EXPANSION"
  | "LATE_BULL_DISTRIBUTION"
  | "CAPITULATION_DELEVERAGING"
  | "LOW_VOL_COMPRESSION"
  | "HIGH_VOLATILITY_CHOP"

export const REGIMES: Regime[] = ["BULL", "SIDEWAYS", "BEAR"]
export const SECONDARY_REGIMES: SecondaryRegime[] = [
  "EARLY_RECOVERY",
  "BTC_LED_EXPANSION",
  "ALT_EXPANSION",
  "LATE_BULL_DISTRIBUTION",
  "CAPITULATION_DELEVERAGING",
  "LOW_VOL_COMPRESSION",
  "HIGH_VOLATILITY_CHOP",
]
export const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]
export const EXPOSURE_LEVELS: ExposureLevel[] = ["NONE", "LOW", "MEDIUM", "HIGH"]
export const STRATEGY_STATUSES: StrategyStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"]

// --- Structured sub-documents -----------------------------------------------

export interface StrategyStep {
  title: string
  description: string
}

/**
 * Market classification — two layers.
 *
 * Level 1 (always present): the three primary regimes. This stays the simple
 * public classification (Bull / Sideways / Bear) and the strongest market
 * signal in every matching engine.
 *
 * Level 2 (optional): secondary regimes — more precise conditions that exist
 * inside or between the primary regimes. Used for strategy documentation,
 * ranking inside a primary regime, and future Matrix Finance / AI agents, which
 * can supply `secondaryRegime` alongside `regime` for finer matching.
 *
 * Both layers live in this single sub-document (the DB convention for market
 * classification); older records without Level-2 data deserialize to an empty
 * array and keep working unchanged.
 */
export interface MarketFit {
  regimes: Regime[]
  /** Optional 0–100 fit scores — designed for future AI matching. */
  scores?: Partial<Record<Regime, number>>
  /** Optional Level-2 conditions this strategy is tuned for (empty = none). */
  secondaryRegimes?: SecondaryRegime[]
  /** Optional 0–100 fit scores for the declared secondary regimes. */
  secondaryScores?: Partial<Record<SecondaryRegime, number>>
  explanation?: string
}

export interface RiskProfile {
  overallRisk: RiskLevel
  explanation?: string
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

export interface Requirements {
  minCapital?: string
  requiredHoldings: string[]
  walletSetup?: string
  other?: string
}

export interface StrategyReference {
  title: string
  url: string
  publisher?: string
  notes?: string
}

// --- Lightweight references (populated from taxonomy collections) -----------

export interface AssetRef {
  id: string
  symbol: string
  name: string
  category?: string | null
  iconUrl?: string | null
}

export interface ProtocolRef {
  id: string
  name: string
  slug: string
  website?: string | null
  iconUrl?: string | null
  description?: string | null
}

export interface NetworkRef {
  id: string
  name: string
  slug: string
  chainId?: number | null
  iconUrl?: string | null
}

// --- Full strategy as returned by the API ------------------------------------

/** Compact latest-observation snapshot (live-data layer). */
export interface ObservationPoint {
  apy: number
  tvl: number
  source: string
  recordedAt: string
}

export interface ObservationDTO extends ObservationPoint {
  id: number
}

/** GET /api/strategies/:id/observations — the daily observation series. */
export interface ObservationSeriesDTO {
  strategyId: string
  slug: string
  observations: ObservationDTO[]
}

export interface StrategyDTO {
  id: string
  strategyId: string
  name: string
  slug: string
  summary: string
  description: string
  type: string
  status: StrategyStatus
  marketFit: MarketFit
  /** Curated user-facing objectives (empty = derive from type, see strategyObjectives.ts). */
  objectives: ObjectiveKey[]
  steps: StrategyStep[]
  entryConditions: string[]
  exitConditions: string[]
  risk: RiskProfile
  requirements: Requirements
  references: StrategyReference[]
  lastReviewedAt: string | null
  createdAt: string
  updatedAt: string
  depositAssets: AssetRef[]
  exposureAssets: AssetRef[]
  rewardAssets: AssetRef[]
  networks: NetworkRef[]
  protocols: ProtocolRef[]
  /**
   * Latest recorded market observation (live-data layer). Optional so
   * serialized revision snapshots stay backward compatible; null when the
   * strategy has no observations yet.
   */
  latestObservation?: ObservationPoint | null
}

/** Payload for POST /api/strategies and PUT /api/strategies/:id */
export interface StrategyInput {
  name: string
  slug?: string
  strategyId?: string
  summary?: string
  description?: string
  type: string
  status?: StrategyStatus
  marketFit?: Partial<MarketFit>
  /** Optional curated objectives — omit/empty to keep the type-derived mapping. */
  objectives?: ObjectiveKey[]
  steps?: StrategyStep[]
  entryConditions?: string[]
  exitConditions?: string[]
  risk?: Partial<RiskProfile>
  requirements?: Partial<Requirements>
  references?: StrategyReference[]
  lastReviewedAt?: string | null
  depositAssetIds?: string[]
  exposureAssetIds?: string[]
  rewardAssetIds?: string[]
  networkIds?: string[]
  protocolIds?: string[]
  /** Optional note recorded on the revision created by an update. */
  changeNote?: string
}

export interface RevisionDTO {
  id: string
  revisionNumber: number
  changeNote: string | null
  createdAt: string
  snapshot: StrategyDTO
}

// --- Taxonomy DTOs ------------------------------------------------------------

export interface AssetDTO {
  id: string
  symbol: string
  name: string
  coingeckoId: string | null
  iconUrl: string | null
  category: string | null
  active: boolean
  strategyCount?: number
}

export interface ProtocolDTO {
  id: string
  name: string
  slug: string
  website: string | null
  description: string | null
  iconUrl: string | null
  active: boolean
  strategyCount?: number
}

export interface NetworkDTO {
  id: string
  name: string
  slug: string
  chainId: number | null
  iconUrl: string | null
  active: boolean
  strategyCount?: number
}

export interface MetaDTO {
  types: { name: string; count: number }[]
  counts: {
    strategies: number
    published: number
    draft: number
    archived: number
    assets: number
    protocols: number
    networks: number
  }
}

// --- Public archive filters (client -> GET /api/strategies) -------------------

export interface StrategyFilters {
  q?: string
  regimes?: Regime[]
  /** Optional Level-2 condition filter (advanced; see secondary-regimes.ts). */
  secondaryRegimes?: SecondaryRegime[]
  risks?: RiskLevel[]
  types?: string[]
  networks?: string[]
  protocols?: string[]
  assets?: string[]
  leverage?: "any" | "none" | "levered"
  liquidation?: "any" | "none" | "exposed"
  status?: "PUBLISHED" | "ALL" | "DRAFT" | "ARCHIVED"
}

// --- Strategy matching (POST /api/match) --------------------------------------
// Ranks published strategies against a user (or agent) profile using a
// weighted composite: regime fit 50% · risk alignment 25% · asset overlap
// 15% · capital eligibility 10%. When the profile also supplies an optional
// secondaryRegime, a fifth factor joins the composite (see match-engine).

export interface MatchInput {
  /** Asset ids the profile already holds (portfolio). */
  assetIds: string[]
  /** Current market view — the strongest market signal. */
  regime: Regime
  /**
   * Optional Level-2 market condition (e.g. "CAPITULATION_DELEVERAGING").
   * When supplied by Matrix Finance / AI agents it adds a secondary-regime
   * scoring factor; strategies without secondary metadata are never rejected
   * for lacking it. Omit to keep the classic four-factor behavior.
   */
  secondaryRegime?: SecondaryRegime
  /** Risk the profile is willing to accept. */
  riskTolerance: RiskLevel
  /** Optional available capital in USD (used for min-capital eligibility). */
  capital?: number
}

/** One scored dimension of the composite match score. */
export interface MatchFactor {
  label: string
  /** 0–100 contribution score for this dimension (before weighting). */
  score: number
  note: string
}

export interface MatchResult {
  /** Full strategy payload (agents get complete context). */
  strategy: StrategyDTO
  /** Weighted composite score, 0–100. */
  score: number
  factors: MatchFactor[]
  /** Deposit assets the profile already holds. */
  matchedAssets: AssetRef[]
  /** Deposit assets the profile would need to acquire. */
  missingAssets: AssetRef[]
  /** Human-readable one-liner explaining the ranking. */
  reason: string
}
