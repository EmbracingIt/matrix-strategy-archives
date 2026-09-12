import type {
  AssetRef,
  MatchFactor,
  MatchInput,
  MatchResult,
  Regime,
  RiskLevel,
  StrategyDTO,
} from "@/lib/types"
import { REGIME_LABELS, RISK_LABELS } from "@/lib/format"
import { secondaryRegimeLabel } from "@/lib/secondary-regimes"

/**
 * Match engine — scores published strategies against a profile.
 *
 * Composite score (0–100) = weighted sum of four dimensions:
 *   Regime fit          × 0.50  — declared fit score for the selected regime
 *                                  (fallback: 70 if curated but unscored, 15 otherwise)
 *   Risk alignment      × 0.25  — strategy risk vs. tolerance tier
 *   Asset overlap       × 0.15  — fraction of deposit assets already held
 *   Capital eligibility × 0.10  — min-capital requirement vs. available capital
 *
 * When the profile also supplies the optional `secondaryRegime` (Level-2
 * market condition, e.g. from a future Matrix Finance regime detector), a
 * fifth dimension joins the composite and the primary regime weight is
 * reduced — the primary regime stays the strongest single signal:
 *   Regime fit          × 0.35
 *   Market condition    × 0.15  — declared secondary fit (75 curated / 30
 *                                  other-condition / 55 no secondary data)
 *   Risk alignment      × 0.25
 *   Asset overlap       × 0.15
 *   Capital eligibility × 0.10
 *
 * Strategies without secondary-regime metadata are never rejected for
 * lacking it — the condition factor is simply neutral for them, so older
 * records keep ranking on the classic four factors.
 *
 * Deliberately deterministic and explainable: every factor carries a note and
 * the composite derives a human-readable reason, so Matrix Finance agents can
 * audit why a strategy ranked where it did.
 */

const RISK_RANK: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3 }

const WEIGHTS = { regime: 0.5, risk: 0.25, assets: 0.15, capital: 0.1 } as const
const WEIGHTS_WITH_CONDITION = {
  regime: 0.35,
  condition: 0.15,
  risk: 0.25,
  assets: 0.15,
  capital: 0.1,
} as const

/** Parses a min-capital string like "$2,000" into a number. */
export function parseMinCapital(raw?: string | null): number | undefined {
  if (!raw) return undefined
  const match = raw.replace(/,/g, "").match(/\d+(?:\.\d+)?/)
  return match ? Number.parseFloat(match[0]) : undefined
}

function fmtUsd(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`
}

function scoreStrategy(strategy: StrategyDTO, input: MatchInput): MatchResult {
  const regime = input.regime
  const regimeLabel = REGIME_LABELS[regime].toLowerCase()
  const condition = input.secondaryRegime

  // --- Regime fit (0.50, or 0.35 with a condition supplied) --------------------
  const declared = strategy.marketFit.scores?.[regime]
  const inRegime = strategy.marketFit.regimes.includes(regime)
  const regimeScore = declared ?? (inRegime ? 70 : 15)
  const regimeNote =
    declared != null
      ? `Declared fit ${declared}/100 for ${regimeLabel} regimes`
      : inRegime
        ? `Curated for ${regimeLabel} regimes (unscored)`
        : `Not designed for ${regimeLabel} regimes`

  // --- Secondary market condition (0.15, only when the profile supplies one) --
  let conditionFactor: MatchFactor | null = null
  if (condition) {
    const label = secondaryRegimeLabel(condition)
    const declaredSecondary = strategy.marketFit.secondaryRegimes ?? []
    const declaredScore = strategy.marketFit.secondaryScores?.[condition]
    const conditionScore =
      declaredScore != null
        ? declaredScore
        : declaredSecondary.includes(condition)
          ? 75
          : declaredSecondary.length > 0
            ? 30
            : 55
    const conditionNote =
      declaredScore != null
        ? `Declared fit ${declaredScore}/100 for ${label}`
        : declaredSecondary.includes(condition)
          ? `Curated for ${label} (unscored)`
          : declaredSecondary.length > 0
            ? `Tuned for other conditions, not ${label}`
            : `No secondary-regime data recorded`
    conditionFactor = { label: "Market condition", score: conditionScore, note: conditionNote }
  }

  // --- Risk alignment (0.25) --------------------------------------------------
  const riskDiff = RISK_RANK[strategy.risk.overallRisk] - RISK_RANK[input.riskTolerance]
  const riskScore = riskDiff <= 0 ? 100 : riskDiff === 1 ? 45 : 10
  const strategyRiskLabel = RISK_LABELS[strategy.risk.overallRisk].toLowerCase()
  const riskNote =
    riskDiff <= 0
      ? `${strategyRiskLabel} risk — within your tolerance`
      : riskDiff === 1
        ? `${strategyRiskLabel} risk — one tier above your tolerance`
        : `${strategyRiskLabel} risk — well above your tolerance`

  // --- Asset overlap (0.15) ---------------------------------------------------
  const deposits: AssetRef[] = strategy.depositAssets
  const matchedAssets = deposits.filter((d) => input.assetIds.includes(d.id))
  const missingAssets = deposits.filter((d) => !input.assetIds.includes(d.id))

  let assetScore: number
  let assetNote: string
  if (!deposits.length) {
    assetScore = 60
    assetNote = "No deposit assets recorded"
  } else if (!input.assetIds.length) {
    assetScore = 60
    assetNote = `No holdings provided — needs ${deposits.map((d) => d.symbol).join(", ")}`
  } else {
    assetScore = Math.round(40 + 60 * (matchedAssets.length / deposits.length))
    assetNote =
      matchedAssets.length === deposits.length
        ? `You hold all ${deposits.length} deposit asset${deposits.length === 1 ? "" : "s"}`
        : `You hold ${matchedAssets.length} of ${deposits.length} — need ${missingAssets
            .map((m) => m.symbol)
            .join(", ")}`
  }

  // --- Capital eligibility (0.10) ----------------------------------------------
  const min = parseMinCapital(strategy.requirements.minCapital)
  let capitalScore: number
  let capitalNote: string
  if (min == null) {
    capitalScore = 100
    capitalNote = "No minimum capital recorded"
  } else if (input.capital == null) {
    capitalScore = 100
    capitalNote = `Requires a ${fmtUsd(min)} minimum`
  } else if (input.capital >= min) {
    capitalScore = 100
    capitalNote = `Meets the ${fmtUsd(min)} minimum`
  } else {
    capitalScore = 0
    capitalNote = `Below the ${fmtUsd(min)} minimum`
  }

  const factors: MatchFactor[] = [
    { label: "Regime fit", score: regimeScore, note: regimeNote },
    ...(conditionFactor ? [conditionFactor] : []),
    { label: "Risk alignment", score: riskScore, note: riskNote },
    { label: "Asset overlap", score: assetScore, note: assetNote },
    { label: "Capital", score: capitalScore, note: capitalNote },
  ]

  const score = condition
    ? Math.round(
        WEIGHTS_WITH_CONDITION.regime * regimeScore +
          WEIGHTS_WITH_CONDITION.condition * (conditionFactor?.score ?? 55) +
          WEIGHTS_WITH_CONDITION.risk * riskScore +
          WEIGHTS_WITH_CONDITION.assets * assetScore +
          WEIGHTS_WITH_CONDITION.capital * capitalScore
      )
    : Math.round(
        WEIGHTS.regime * regimeScore +
          WEIGHTS.risk * riskScore +
          WEIGHTS.assets * assetScore +
          WEIGHTS.capital * capitalScore
      )

  // --- Human-readable reason ---------------------------------------------------
  const parts: string[] = []
  if (regimeScore >= 70) {
    parts.push(
      `strong ${regimeLabel} fit${declared != null ? ` (${declared}/100)` : ""}`
    )
  } else if (regimeScore >= 40) {
    parts.push(`moderate ${regimeLabel} fit`)
  } else {
    parts.push(`weak ${regimeLabel} fit`)
  }
  if (condition && conditionFactor && conditionFactor.score >= 75) {
    parts.push(`tuned for ${secondaryRegimeLabel(condition).toLowerCase()} conditions`)
  }
  parts.push(
    riskScore === 100
      ? "risk within your tolerance"
      : riskScore >= 45
        ? "risk slightly above your tolerance"
        : "risk above your tolerance"
  )
  if (deposits.length && input.assetIds.length) {
    parts.push(
      matchedAssets.length === deposits.length
        ? "you already hold the required assets"
        : `you would need to acquire ${missingAssets.map((m) => m.symbol).join(", ")}`
    )
  }
  if (min != null && input.capital != null && input.capital < min) {
    parts.push(`capital below the ${fmtUsd(min)} minimum`)
  }
  const reason = parts
    .map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(", ")

  return {
    strategy,
    score,
    factors,
    matchedAssets,
    missingAssets,
    reason,
  }
}

/** Scores and ranks every strategy against the profile (best first). */
export function rankStrategies(strategies: StrategyDTO[], input: MatchInput): MatchResult[] {
  return strategies
    .map((s) => scoreStrategy(s, input))
    .sort((a, b) => b.score - a.score || a.strategy.name.localeCompare(b.strategy.name))
}
