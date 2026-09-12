import type { Regime, SecondaryRegime } from "@/lib/types"

/**
 * SECONDARY REGIMES — the canonical Level-2 market-condition registry.
 *
 * The three primary regimes (Bull / Sideways / Bear) remain the simple public
 * classification. Secondary regimes are more time-specific, directional or
 * phase-specific conditions that exist inside or between them. In the PUBLIC
 * Archive language they are called **Market Phases** — never "secondary
 * regimes", which stays an internal/backend term.
 *
 * They power:
 *   - the guided retrieval flow step 02 MARKET PHASE (single phase selection)
 *   - strategy documentation (record pages: "Best during")
 *   - strategy matching & ranking inside a primary regime (phase bonus)
 *   - future Matrix Finance / AI agents, which can supply
 *     { regime: "BEAR", secondaryRegime: "CAPITULATION_DELEVERAGING" }
 *     to the match endpoints for finer ranking.
 *
 * Stored as part of the strategy's marketFit sub-document using the shared
 * enum values (uppercase, DB-portable). This module is the single source of
 * truth every surface (admin form, archive UI, seed, engines) consumes.
 */

export interface SecondaryRegimeDef {
  /** Enum value stored in marketFit.secondaryRegimes. */
  value: SecondaryRegime
  /** Kebab-case URL slug used in the guided flow (?phase=btc-led-expansion). */
  slug: string
  /** Archival shelf code shown on phase cards, e.g. "B01". */
  code: string
  /** Human label, e.g. "Early Recovery". */
  label: string
  /** Parent primary regime, when the condition lives inside one regime.
   * Transition conditions (spanning two regimes) use `transition` instead. */
  parent?: Regime
  /** Transition this condition straddles, e.g. "Bear → Bull". */
  transition?: string
  /** One-line meaning. */
  meaning: string
  /** Short keyword line for phase cards, e.g. "Leadership / Momentum / Early expansion". */
  keywords: string
  /** Typical characteristics (documentation bullets). */
  characteristics: string[]
  /** Strategy styles the condition is useful for. */
  usefulFor: string[]
}

export const SECONDARY_REGIME_REGISTRY: SecondaryRegimeDef[] = [
  {
    value: "EARLY_RECOVERY",
    slug: "early-recovery",
    code: "R01",
    label: "Early Recovery",
    transition: "Bear → Bull",
    keywords: "STABILIZATION / STRUCTURE / REBUILDING",
    meaning:
      "Selling pressure is weakening and market structure is beginning to improve, but a full bull trend is not yet confirmed.",
    characteristics: [
      "Downside momentum fading",
      "Price reclaims important moving averages",
      "Participation improves",
      "Volatility may remain elevated",
      "Open interest begins rebuilding",
      "BTC often stabilizes before broader risk assets",
    ],
    usefulFor: [
      "Gradual accumulation",
      "Lending",
      "Selective LP",
      "Cautious directional exposure",
    ],
  },
  {
    value: "BTC_LED_EXPANSION",
    slug: "btc-led-expansion",
    code: "B01",
    label: "BTC-Led Expansion",
    parent: "BULL",
    keywords: "LEADERSHIP / MOMENTUM / EARLY EXPANSION",
    meaning:
      "Bitcoin leads the market higher while ETH, SOL and broader altcoins remain relatively weaker.",
    characteristics: [
      "Strong BTC trend",
      "Positive momentum",
      "BTC dominance stable or rising",
      "Broader participation not yet developed",
      "ETH/BTC may remain weak",
    ],
    usefulFor: [
      "BTC exposure",
      "Conservative staking",
      "Lending",
      "Avoiding excessive altcoin risk",
    ],
  },
  {
    value: "ALT_EXPANSION",
    slug: "alt-expansion",
    code: "B02",
    label: "Alt Expansion",
    parent: "BULL",
    keywords: "BREADTH / RISK-ON / PARTICIPATION",
    meaning:
      "The bull market broadens beyond BTC and risk appetite expands into ETH, SOL and other assets.",
    characteristics: [
      "ETH/SOL outperform BTC",
      "Participation broadens",
      "Stronger volumes across assets",
      "Risk appetite increases",
      "Altcoin relative strength improves",
    ],
    usefulFor: [
      "Staking",
      "Growth exposure",
      "Altcoin strategies",
      "Selected LP strategies",
    ],
  },
  {
    value: "LATE_BULL_DISTRIBUTION",
    slug: "late-bull-distribution",
    code: "B03",
    label: "Late Bull / Distribution",
    transition: "Bull → Sideways / Bear",
    keywords: "DIVERGENCE / DISTRIBUTION / LATE CYCLE",
    meaning:
      "Price may still be high or trending upward, but underlying participation and momentum begin deteriorating.",
    characteristics: [
      "Momentum divergence",
      "Elevated leverage",
      "High funding",
      "Large open interest",
      "Weaker breadth",
      "Profit-taking and reduced risk-adjusted upside",
    ],
    usefulFor: [
      "Taking profit",
      "Distribution LP",
      "Hedging",
      "Reducing leverage",
      "Stablecoin rotation",
    ],
  },
  {
    value: "CAPITULATION_DELEVERAGING",
    slug: "capitulation-deleveraging",
    code: "D01",
    label: "Capitulation / Deleveraging",
    parent: "BEAR",
    keywords: "RISK-OFF / LIQUIDATIONS / DELEVERAGING",
    meaning:
      "A sharp risk-off phase where leveraged positions are rapidly unwound.",
    characteristics: [
      "Large liquidations",
      "Falling open interest",
      "Extreme downside volume",
      "High volatility and rapid price declines",
      "Very negative sentiment",
    ],
    usefulFor: [
      "Defensive positioning",
      "Deleveraging",
      "Stablecoin strategies",
      "Later-stage accumulation after stabilization",
    ],
  },
  {
    value: "LOW_VOL_COMPRESSION",
    slug: "low-vol-compression",
    code: "S01",
    label: "Low-Vol Compression",
    parent: "SIDEWAYS",
    keywords: "RANGE / COMPRESSION / QUIET VOLATILITY",
    meaning: "Price trades inside a relatively tight range while volatility declines.",
    characteristics: [
      "Narrow price range",
      "Low realized volatility",
      "Declining momentum",
      "Weak directional conviction",
      "Reduced liquidation activity",
    ],
    usefulFor: [
      "Concentrated LP",
      "Stablecoin LP",
      "Range strategies",
      "Market-neutral yield",
    ],
  },
  {
    value: "HIGH_VOLATILITY_CHOP",
    slug: "high-volatility-chop",
    code: "S02",
    label: "High-Volatility Chop",
    parent: "SIDEWAYS",
    keywords: "REVERSALS / SWINGS / NO SUSTAINED TREND",
    meaning:
      "The market lacks a sustained trend but moves aggressively in both directions.",
    characteristics: [
      "Frequent reversals",
      "Elevated realized volatility",
      "Large intraday swings",
      "No persistent directional trend",
      "Repeated liquidation events",
    ],
    usefulFor: [
      "Broader LP ranges",
      "Delta-neutral strategies",
      "Hedged strategies",
      "Avoiding excessive leverage",
    ],
  },
]

const BY_VALUE = new Map(SECONDARY_REGIME_REGISTRY.map((def) => [def.value, def]))
const BY_SLUG = new Map(SECONDARY_REGIME_REGISTRY.map((def) => [def.slug, def]))

/** Registry lookup — undefined for unknown values (null-safe by design). */
export function secondaryRegimeDef(value: string): SecondaryRegimeDef | undefined {
  return BY_VALUE.get(value as SecondaryRegime)
}

/** URL slug (kebab-case) for a secondary regime value; falls back to the raw value. */
export function secondaryRegimeSlug(value: string): string {
  return secondaryRegimeDef(value)?.slug ?? value
}

/** Archival shelf code (e.g. "B01") for a secondary regime value. */
export function secondaryRegimeCode(value: string): string {
  return secondaryRegimeDef(value)?.code ?? "—"
}

/** Keyword line for phase cards; empty string for unknown values. */
export function secondaryRegimeKeywords(value: string): string {
  return secondaryRegimeDef(value)?.keywords ?? ""
}

/** Parse a URL slug (or enum value) into a secondary regime; undefined when unknown. */
export function parseSecondaryRegimeSlug(slug: string): SecondaryRegime | undefined {
  return (BY_SLUG.get(slug) ?? BY_VALUE.get(slug as SecondaryRegime))?.value
}

/**
 * Market phases offered for each primary regime in the guided flow, in
 * display order. "all" lists the full registry (narrative cycle order:
 * recovery → expansion → distribution → capitulation → compression → chop).
 */
const MARKET_PHASES: Record<"bull" | "sideways" | "bear", SecondaryRegime[]> = {
  bull: ["BTC_LED_EXPANSION", "ALT_EXPANSION", "LATE_BULL_DISTRIBUTION"],
  sideways: ["LOW_VOL_COMPRESSION", "HIGH_VOLATILITY_CHOP"],
  bear: ["CAPITULATION_DELEVERAGING", "EARLY_RECOVERY"],
}

export function secondaryRegimesForMarket(
  market: "bull" | "sideways" | "bear" | "all"
): SecondaryRegimeDef[] {
  if (market === "all") return SECONDARY_REGIME_REGISTRY
  return MARKET_PHASES[market]
    .map((value) => secondaryRegimeDef(value))
    .filter((def): def is SecondaryRegimeDef => Boolean(def))
}

/** "All Bull Phases" / "All Sideways Phases" / "All Bear Phases" / "All Market Phases". */
export function allPhasesLabel(market: "bull" | "sideways" | "bear" | "all"): string {
  return market === "all" ? "All Market Phases" : `All ${market[0].toUpperCase()}${market.slice(1)} Phases`
}

/** Human label for a secondary regime value; falls back to the raw value. */
export function secondaryRegimeLabel(value: string): string {
  return secondaryRegimeDef(value)?.label ?? value
}

/** Parent primary regime or the transition label, e.g. "BULL" / "Bear → Bull". */
export function secondaryRegimeParentLabel(value: string): string {
  const def = secondaryRegimeDef(value)
  if (!def) return value
  return def.parent ?? def.transition ?? ""
}

/**
 * Compact tag used in dense UI contexts: "Early Recovery · Bear → Bull".
 */
export function secondaryRegimeTag(value: string): string {
  const def = secondaryRegimeDef(value)
  if (!def) return value
  return def.parent ? `${def.label} · ${def.parent}` : `${def.label} · ${def.transition}`
}
