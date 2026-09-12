import type { ObjectiveKey, StrategyDTO } from "@/lib/types"

export type { ObjectiveKey }

/**
 * Strategy objectives — the user-facing goals of the public Archive.
 *
 * The database stores mechanical strategy *types* ("Concentrated Liquidity",
 * "Lending", …) AND, since the official collection, an optional curated
 * `objectives` list per record (Strategy.objectivesJson). The public archive
 * speaks human *objectives* ("Accumulation", "Yield", "Hedging", …).
 *
 * Resolution order in `objectivesForStrategy`:
 *   1. curated DB objectives (when the record has them)
 *   2. deterministic type→objective mapping + structural enrichment
 */

export interface ObjectiveDefinition {
  key: ObjectiveKey
  /** Archive collection code shown in monospace metadata. */
  code: string
  label: string
  /** One-line human description shown on the objective selection page. */
  description: string
  /** Keywords reinforcing the choice, shown as mono metadata. */
  keywords: string
}

export const OBJECTIVES: ObjectiveDefinition[] = [
  {
    key: "yield",
    code: "OBJ_01",
    label: "Yield",
    description: "Put idle assets to work.",
    keywords: "Lending · Staking · Fixed income",
  },
  {
    key: "accumulation",
    code: "OBJ_02",
    label: "Accumulation",
    description: "Increase your position over time.",
    keywords: "Compounding · Fee capture · Reinvestment",
  },
  {
    key: "liquidity",
    code: "OBJ_03",
    label: "Liquidity",
    description: "Earn from market activity.",
    keywords: "Market making · LP positions",
  },
  {
    key: "capital-preservation",
    code: "OBJ_04",
    label: "Capital Preservation",
    description: "Prioritize defense and lower risk.",
    keywords: "Stablecoins · Defensive allocation",
  },
  {
    key: "growth",
    code: "OBJ_05",
    label: "Growth",
    description: "Position for expanding markets.",
    keywords: "Beta exposure · Staking upside",
  },
  {
    key: "hedging",
    code: "OBJ_06",
    label: "Hedging",
    description: "Reduce directional exposure.",
    keywords: "Market neutral · Offset risk",
  },
  {
    key: "advanced",
    code: "OBJ_07",
    label: "Advanced",
    description: "Structured, leveraged and market-neutral strategies.",
    keywords: "Leverage · Structured products",
  },
]

export const OBJECTIVE_ALL = "all" as const

export type ObjectiveParam = ObjectiveKey | typeof OBJECTIVE_ALL

export const OBJECTIVE_MAP: Record<ObjectiveKey, ObjectiveDefinition> = Object.fromEntries(
  OBJECTIVES.map((o) => [o.key, o])
) as Record<ObjectiveKey, ObjectiveDefinition>

/** Objective keys for a URL param ("all" is a UI-only wildcard, never stored). */
export function isValidObjective(value: string | null | undefined): value is ObjectiveParam {
  return value === OBJECTIVE_ALL || OBJECTIVES.some((o) => o.key === value)
}

/**
 * Mechanical type → objectives. Exact table first, keyword fallback for
 * admin-created custom types, then structural enrichment (leverage, etc.).
 */
const TYPE_OBJECTIVES: Record<string, ObjectiveKey[]> = {
  lending: ["yield", "capital-preservation"],
  staking: ["yield", "growth"],
  "liquid staking": ["yield", "growth"],
  "stablecoin yield": ["yield", "capital-preservation"],
  "concentrated liquidity": ["liquidity", "accumulation"],
  "liquidity provision": ["liquidity", "accumulation"],
  "yield farming": ["yield", "accumulation"],
  "delta-neutral": ["yield", "hedging", "advanced"],
  "fixed income": ["yield", "capital-preservation"],
  "systematic deployment": ["accumulation", "growth"],
  "yield-funded accumulation": ["yield", "accumulation"],
  "collateralized borrowing": ["liquidity", "growth", "advanced"],
  "directional yield": ["growth", "yield"],
  "options income": ["yield", "capital-preservation", "advanced"],
  "risk management": ["capital-preservation", "hedging"],
  "stablecoin reserve": ["capital-preservation", "yield"],
  "defensive portfolio": ["capital-preservation", "yield"],
  "hedged liquidity": ["yield", "hedging", "advanced"],
  "market-neutral yield": ["yield", "hedging", "advanced"],
}

/** Keyword fallback for custom types created in the admin CMS. */
const TYPE_KEYWORD_RULES: { pattern: RegExp; objectives: ObjectiveKey[] }[] = [
  { pattern: /delta.?neutral|hedg/i, objectives: ["hedging", "advanced"] },
  { pattern: /leverage|levered|perp|funding/i, objectives: ["advanced", "hedging"] },
  { pattern: /stable|fixed|income|lend|money market/i, objectives: ["yield", "capital-preservation"] },
  { pattern: /stak/i, objectives: ["yield", "growth"] },
  { pattern: /liquid|lp|amm|market.?mak/i, objectives: ["liquidity", "accumulation"] },
  { pattern: /farm/i, objectives: ["yield", "accumulation"] },
  { pattern: /borrow|loop/i, objectives: ["advanced", "yield"] },
]

/** Stablecoin asset categories used by the capital-preservation enrichment. */
const STABLE_CATEGORIES = new Set(["stablecoin"])

function normalizeType(type: string): string {
  return type.trim().toLowerCase()
}

/** Canonical display order shared by the curated and derived paths. */
const CANONICAL_ORDER: ObjectiveKey[] = [
  "yield",
  "accumulation",
  "liquidity",
  "capital-preservation",
  "growth",
  "hedging",
  "advanced",
]

/**
 * Resolve the user-facing objectives of a strategy. Curated DB objectives win
 * when present; otherwise they are derived from the mechanical type plus
 * structural characteristics (leverage, asset mix). Deterministic and
 * explainable — no scoring, no randomness.
 */
export function objectivesForStrategy(strategy: StrategyDTO): ObjectiveKey[] {
  const curated = strategy.objectives ?? []
  if (curated.length > 0) {
    return CANONICAL_ORDER.filter((key) => curated.includes(key))
  }
  return deriveObjectivesFromType(strategy)
}

function deriveObjectivesFromType(strategy: StrategyDTO): ObjectiveKey[] {
  const type = normalizeType(strategy.type)
  let objectives = TYPE_OBJECTIVES[type]

  if (!objectives) {
    objectives = []
    for (const rule of TYPE_KEYWORD_RULES) {
      if (rule.pattern.test(strategy.type)) {
        objectives = [...new Set([...objectives, ...rule.objectives])]
      }
    }
    if (objectives.length === 0) objectives = ["yield"]
  }

  // Structural enrichment — deterministic, derived from existing data only.
  const enriched = new Set(objectives)
  if (strategy.risk?.leverageUsed) enriched.add("advanced")

  const deposits = strategy.depositAssets ?? []
  const allDepositsStable =
    deposits.length > 0 &&
    deposits.every((a) => STABLE_CATEGORIES.has((a.category ?? "").toLowerCase()))
  if (allDepositsStable && strategy.risk?.liquidationExposure === "NONE") {
    enriched.add("capital-preservation")
  }

  return [...enriched]
}

/** Human labels for a strategy's objectives, in canonical order. */
export function objectiveLabels(strategy: StrategyDTO): string[] {
  const keys = objectivesForStrategy(strategy)
  return OBJECTIVES.filter((o) => keys.includes(o.key)).map((o) => o.label)
}
