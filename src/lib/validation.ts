import { z } from "zod"

// Server-side validation for strategy create/update payloads.
// Kept deliberately permissive: the strategy model is meant to stay
// extendable (types, categories, etc. are free-form strings).

/** Level-2 market conditions — the fixed seven (see lib/secondary-regimes.ts). */
const secondaryRegimeEnum = z.enum([
  "EARLY_RECOVERY",
  "BTC_LED_EXPANSION",
  "ALT_EXPANSION",
  "LATE_BULL_DISTRIBUTION",
  "CAPITULATION_DELEVERAGING",
  "LOW_VOL_COMPRESSION",
  "HIGH_VOLATILITY_CHOP",
])

/** User-facing Archive objectives — the fixed seven (see lib/strategyObjectives.ts). */
const objectiveKeyEnum = z.enum([
  "yield",
  "accumulation",
  "liquidity",
  "capital-preservation",
  "growth",
  "hedging",
  "advanced",
])

export const marketFitSchema = z.object({
  regimes: z.array(z.enum(["BULL", "SIDEWAYS", "BEAR"])).default([]),
  scores: z
    .object({
      BULL: z.number().int().min(0).max(100).optional(),
      SIDEWAYS: z.number().int().min(0).max(100).optional(),
      BEAR: z.number().int().min(0).max(100).optional(),
    })
    .optional(),
  /** Optional Level-2 conditions (empty/omitted = none declared). */
  secondaryRegimes: z.array(secondaryRegimeEnum).optional(),
  /** Optional 0–100 fit scores for declared secondary regimes (partial by design). */
  secondaryScores: z
    .partialRecord(secondaryRegimeEnum, z.number().int().min(0).max(100))
    .optional(),
  explanation: z.string().optional(),
})

export const riskSchema = z.object({
  overallRisk: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).default("MEDIUM"),
  explanation: z.string().optional(),
  leverageUsed: z.boolean().default(false),
  leverageAmount: z.string().optional(),
  liquidationExposure: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
  withdrawalRestrictions: z.string().optional(),
  lockupPeriod: z.string().optional(),
  incentiveReliance: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("LOW"),
  smartContractRisk: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).default("MEDIUM"),
  impermanentLoss: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
  assetVolatility: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
})

export const requirementsSchema = z.object({
  minCapital: z.string().optional(),
  requiredHoldings: z.array(z.string()).default([]),
  walletSetup: z.string().optional(),
  other: z.string().optional(),
})

export const referenceSchema = z.object({
  title: z.string().default(""),
  url: z.string().default(""),
  publisher: z.string().optional(),
  notes: z.string().optional(),
})

export const stepSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
})

export const strategyInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  strategyId: z.string().optional(),
  summary: z.string().optional().default(""),
  description: z.string().optional().default(""),
  type: z.string().min(1, "Strategy type is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("DRAFT"),
  marketFit: marketFitSchema.optional(),
  /** Curated user-facing objectives; empty/omitted keeps the type-derived mapping. */
  objectives: z.array(objectiveKeyEnum).max(7).optional(),
  steps: z.array(stepSchema).optional(),
  entryConditions: z.array(z.string()).optional(),
  exitConditions: z.array(z.string()).optional(),
  risk: riskSchema.optional(),
  requirements: requirementsSchema.optional(),
  references: z.array(referenceSchema).optional(),
  lastReviewedAt: z.string().nullable().optional(),
  depositAssetIds: z.array(z.string()).optional(),
  exposureAssetIds: z.array(z.string()).optional(),
  rewardAssetIds: z.array(z.string()).optional(),
  networkIds: z.array(z.string()).optional(),
  protocolIds: z.array(z.string()).optional(),
  changeNote: z.string().optional(),
})

export const assetInputSchema = z.object({
  symbol: z.string().min(1).transform((s) => s.trim().toUpperCase()),
  name: z.string().min(1),
  coingeckoId: z.string().optional().nullable(),
  iconUrl: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
})

export const protocolInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  iconUrl: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
})

export const networkInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  chainId: z.number().int().optional().nullable(),
  iconUrl: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
})

/** POST /api/match — portfolio profile scored against published strategies. */
export const matchInputSchema = z.object({
  assetIds: z.array(z.string()).default([]),
  regime: z.enum(["BULL", "SIDEWAYS", "BEAR"]),
  /** Optional Level-2 condition — adds a secondary-regime ranking factor. */
  secondaryRegime: secondaryRegimeEnum.optional(),
  riskTolerance: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  capital: z.number().min(0).optional(),
})

/** POST /api/strategies/:id/observations — record a market observation. */
export const observationInputSchema = z.object({
  apy: z.number().min(0, "APY cannot be negative").max(10_000),
  tvl: z.number().min(0, "TVL cannot be negative"),
  source: z.string().trim().max(40).optional(),
})
