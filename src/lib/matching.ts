import type { SecondaryRegime, StrategyDTO } from "@/lib/types"
import { OBJECTIVE_MAP, objectivesForStrategy, type ObjectiveParam } from "@/lib/strategyObjectives"
import { secondaryRegimeDef } from "@/lib/secondary-regimes"

/**
 * Archive matching — deterministic, explainable retrieval.
 *
 * The guided Archive flow (MARKET → MARKET PHASE → ASSETS → OBJECTIVE →
 * RESULTS) resolves to a set of records with a compatibility score. This
 * module owns that logic so no React component ever computes matches. A
 * future Matrix AI service can replace it behind the same contract.
 *
 * Hierarchy: the primary regime is the strongest signal; a Market Phase
 * (Level-2 condition) is an additional signal that boosts strategies tuned
 * for it; assets and objective are membership filters. A phase selection is
 * NEVER a membership filter — records that only match the primary regime
 * still rank, just lower, and records without secondary metadata are never
 * rejected for lacking it (neutral condition factor).
 */

export type MarketParam = "bull" | "sideways" | "bear" | "all"

export interface ArchiveQuery {
  market: MarketParam
  /** Selected asset symbols (case-insensitive). Empty = no constraint. */
  assets: string[]
  /** Selected objective. "all" = no constraint (never stored as data). */
  objective: ObjectiveParam
  /**
   * Optional Market Phase (Level-2 condition) for finer ranking. Not a
   * membership filter — records that only match the primary regime still
   * rank, just lower.
   */
  secondaryRegime?: SecondaryRegime
}

export interface MatchFactor {
  label: string
  /** 0–100 dimension score (before weighting). */
  score: number
  note: string
}

export interface MatchedRecord {
  strategy: StrategyDTO
  /** Weighted ARCHIVE MATCH compatibility, 0–100. */
  score: number
  factors: MatchFactor[]
  /** "Why it matches" lines, max 4, in display order. */
  reasons: string[]
}

const REGIME_LABEL: Record<Exclude<MarketParam, "all">, string> = {
  bull: "Bull",
  sideways: "Sideways",
  bear: "Bear",
}

/** Weights — regime fit dominates, then asset coverage, then objective. */
const WEIGHTS = { regime: 0.5, assets: 0.3, objective: 0.2 } as const
/** Weights when the query carries a Market Phase — primary still leads. */
const WEIGHTS_WITH_CONDITION = { regime: 0.45, condition: 0.15, assets: 0.25, objective: 0.15 } as const

function symbolsOf(assets: { symbol: string }[]): Set<string> {
  return new Set(assets.map((a) => a.symbol.toUpperCase()))
}

/** Does the record belong to the queried part of the Archive? */
export function passesArchiveFilter(strategy: StrategyDTO, query: ArchiveQuery): boolean {
  if (query.market !== "all") {
    const regime = query.market.toUpperCase() as "BULL" | "SIDEWAYS" | "BEAR"
    if (!strategy.marketFit?.regimes?.includes(regime)) return false
  }
  if (query.assets.length > 0) {
    const supported = new Set([
      ...(strategy.depositAssets ?? []).map((a) => a.symbol.toUpperCase()),
      ...(strategy.exposureAssets ?? []).map((a) => a.symbol.toUpperCase()),
    ])
    const overlap = query.assets.some((symbol) => supported.has(symbol.toUpperCase()))
    if (!overlap) return false
  }
  if (query.objective !== "all") {
    if (!objectivesForStrategy(strategy).includes(query.objective)) return false
  }
  return true
}

function regimeFactor(strategy: StrategyDTO, market: MarketParam): MatchFactor {
  const scores = strategy.marketFit?.scores ?? {}
  const regimes = strategy.marketFit?.regimes ?? []

  if (market === "all") {
    const values = ["BULL", "SIDEWAYS", "BEAR"].map((r) => scores[r as "BULL"]).filter(
      (v): v is number => typeof v === "number"
    )
    const score = values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : regimes.length > 0
        ? 70
        : 50
    return {
      label: "Regime fit",
      score,
      note: `Operates across ${regimes.length || "all"} market regime${regimes.length === 1 ? "" : "s"}`,
    }
  }

  const regime = market.toUpperCase() as "BULL" | "SIDEWAYS" | "BEAR"
  const declared = scores[regime]
  const score =
    typeof declared === "number"
      ? declared
      : regimes.includes(regime)
        ? 70
        : 0
  return {
    label: "Regime fit",
    score,
    note: `Designed for ${REGIME_LABEL[market]} markets — fit ${score}`,
  }
}

/**
 * Market Phase factor — ranking only, never a membership filter.
 * Records without secondary metadata score neutral (55) so they keep ranking.
 */
function conditionFactor(strategy: StrategyDTO, condition: SecondaryRegime): MatchFactor {
  const def = secondaryRegimeDef(condition)
  const label = def?.label ?? condition
  const declared = strategy.marketFit?.secondaryRegimes ?? []
  const declaredScore = strategy.marketFit?.secondaryScores?.[condition]
  const score =
    declaredScore != null
      ? declaredScore
      : declared.includes(condition)
        ? 75
        : declared.length > 0
          ? 30
          : 55
  const note =
    declaredScore != null
      ? `Best during ${label} — phase fit ${declaredScore}/100`
      : declared.includes(condition)
        ? `Curated for ${label} (unscored)`
        : declared.length > 0
          ? `Tuned for other market phases, not ${label}`
          : `No market-phase data recorded`
  return { label: "Market phase", score, note }
}

function assetFactor(strategy: StrategyDTO, selected: string[]): MatchFactor {
  const supported = new Set([
    ...symbolsOf(strategy.depositAssets ?? []),
    ...symbolsOf(strategy.exposureAssets ?? []),
  ])
  if (selected.length === 0) {
    return {
      label: "Asset coverage",
      score: 70,
      note: "No asset constraint — accepts the Archive default",
    }
  }
  const matched = selected.filter((symbol) => supported.has(symbol.toUpperCase()))
  const coverage = matched.length / selected.length
  const matchedLabels = matched.map((symbol) => symbol.toUpperCase())
  return {
    label: "Asset coverage",
    score: Math.round(40 + 60 * coverage),
    note:
      matched.length === selected.length
        ? `Supports ${matchedLabels.join(" · ")}`
        : matched.length > 0
          ? `Supports ${matchedLabels.join(" · ")} of your selected assets`
          : "Supports none of the selected assets",
  }
}

function objectiveFactor(strategy: StrategyDTO, objective: ObjectiveParam): MatchFactor {
  const keys = objectivesForStrategy(strategy)
  if (objective === "all") {
    return {
      label: "Objective",
      score: 65,
      note: "Open to every objective in the Archive",
    }
  }
  const hit = keys.includes(objective)
  const def = OBJECTIVE_MAP[objective]
  return {
    label: "Objective",
    score: hit ? 100 : 0,
    note: hit
      ? `${def.label} objective`
      : `Classified under ${keys.map((k) => OBJECTIVE_MAP[k]?.label ?? k).join(" / ")}`,
  }
}

function buildReasons(strategy: StrategyDTO, query: ArchiveQuery, factors: MatchFactor[]): string[] {
  const reasons: string[] = []

  if (query.market !== "all" && strategy.marketFit?.regimes?.includes(query.market.toUpperCase() as "BULL")) {
    reasons.push(factors[0].note)
  }
  if (query.assets.length > 0) {
    const supported = new Set([
      ...symbolsOf(strategy.depositAssets ?? []),
      ...symbolsOf(strategy.exposureAssets ?? []),
    ])
    const matched = query.assets.filter((s) => supported.has(s.toUpperCase()))
    if (matched.length > 0) {
      const matchedLabels = matched.map((symbol) => symbol.toUpperCase())
      reasons.push(
        matched.length === query.assets.length
          ? `Supports ${matchedLabels.join(" · ")}`
          : `Supports ${matchedLabels.join(" · ")} of your selected assets`
      )
    }
  }
  if (query.objective !== "all") {
    const def = OBJECTIVE_MAP[query.objective]
    if (objectivesForStrategy(strategy).includes(query.objective)) {
      reasons.push(`${def.label} objective`)
    }
  }
  if (query.secondaryRegime && (strategy.marketFit?.secondaryRegimes ?? []).includes(query.secondaryRegime)) {
    reasons.push(`Best during ${secondaryRegimeDef(query.secondaryRegime)?.label ?? query.secondaryRegime}`)
  }
  if (query.secondaryRegime && !(strategy.marketFit?.secondaryRegimes ?? []).includes(query.secondaryRegime)) {
    // Phase is a bonus, not a filter — note primary-regime eligibility instead.
    if (query.market !== "all" && (strategy.marketFit?.regimes ?? []).includes(query.market.toUpperCase() as "BULL")) {
      reasons.push(`Eligible across the whole ${REGIME_LABEL[query.market]} collection`)
    }
  }

  const risk = strategy.risk
  if (risk?.liquidationExposure === "NONE") reasons.push("No liquidation exposure")
  if (risk && !risk.leverageUsed) reasons.push("No leverage required")

  return reasons.slice(0, 4)
}

/**
 * Retrieve and rank records for an Archive query. Filtering is exact
 * (membership tests above); scoring is the weighted composite of the three
 * explainable factors. Ties break by record number for determinism.
 */
export function matchStrategies(strategies: StrategyDTO[], query: ArchiveQuery): MatchedRecord[] {
  const results: MatchedRecord[] = []

  for (const strategy of strategies) {
    if (!passesArchiveFilter(strategy, query)) continue

    const condition = query.secondaryRegime
    const conditionEntry = condition ? conditionFactor(strategy, condition) : null
    const factors = [
      regimeFactor(strategy, query.market),
      ...(conditionEntry ? [conditionEntry] : []),
      assetFactor(strategy, query.assets),
      objectiveFactor(strategy, query.objective),
    ]
    const score = conditionEntry
      ? Math.min(
          99,
          Math.round(
            factors[0].score * WEIGHTS_WITH_CONDITION.regime +
              conditionEntry.score * WEIGHTS_WITH_CONDITION.condition +
              factors[2].score * WEIGHTS_WITH_CONDITION.assets +
              factors[3].score * WEIGHTS_WITH_CONDITION.objective
          )
        )
      : Math.min(
          99,
          Math.round(
            factors[0].score * WEIGHTS.regime +
              factors[1].score * WEIGHTS.assets +
              factors[2].score * WEIGHTS.objective
          )
        )

    results.push({
      strategy,
      score,
      factors,
      reasons: buildReasons(strategy, query, factors),
    })
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.strategy.strategyId.localeCompare(b.strategy.strategyId)
  })

  return results
}

/** Client-side full-text search across the retrieval fields users expect. */
export function archiveSearchText(strategy: StrategyDTO): string {
  return [
    strategy.name,
    strategy.summary,
    strategy.description,
    strategy.type,
    strategy.strategyId,
    ...(strategy.depositAssets ?? []).flatMap((a) => [a.symbol, a.name]),
    ...(strategy.exposureAssets ?? []).flatMap((a) => [a.symbol, a.name]),
    ...(strategy.rewardAssets ?? []).flatMap((a) => [a.symbol, a.name]),
    ...(strategy.protocols ?? []).map((p) => p.name),
    ...(strategy.networks ?? []).map((n) => n.name),
  ]
    .filter(Boolean)
    .join(" \u2022 ")
    .toLowerCase()
}

export function strategyMatchesSearch(strategy: StrategyDTO, term: string): boolean {
  const q = term.trim().toLowerCase()
  if (!q) return true
  return archiveSearchText(strategy).includes(q)
}
