import type { MarketParam, ArchiveQuery } from "@/lib/matching"
export type { MarketParam, ArchiveQuery } from "@/lib/matching"
import { isValidObjective, type ObjectiveParam } from "@/lib/strategyObjectives"
import {
  parseSecondaryRegimeSlug,
  secondaryRegimeDef,
  secondaryRegimeSlug,
  type SecondaryRegimeDef,
} from "@/lib/secondary-regimes"
import type { SecondaryRegime } from "@/lib/types"

/**
 * URL helpers. The sandbox exposes a single `/` route, so all views are
 * encoded as query params on `/`. These helpers are the single source of
 * truth for those URLs — swapping to real routes later (e.g.
 * /strategies/results?market=bear&phase=early-recovery) only requires
 * changing them.
 *
 *   /                                   -> archive entrance
 *   /?view=explore&step=market          -> guided flow: market collection
 *   /?view=explore&step=phase&market=bull
 *   /?view=explore&step=assets&market=bull&phase=btc-led-expansion
 *   /?view=explore&step=objective&market=bull&phase=btc-led-expansion&assets=eth
 *   /?view=results&market=bull&phase=btc-led-expansion&assets=eth&objective=growth
 *   /?view=all                          -> browse all records
 *   /?view=strategy&slug=xxx            -> strategy record
 *   /?view=compare&slugs=a,b[,c]        -> side-by-side record comparison
 *   /?view=protocols | assets | networks
 *   /?view=admin[&section=&edit=&new=]  -> admin CMS (light theme, own chrome)
 *
 * The Market Phase is stored as its kebab-case slug (?phase=btc-led-expansion).
 * "All phases" is NEVER stored as a fake value — the parameter is simply
 * omitted, exactly like market/objective "all".
 */

export const urls = {
  archive: () => "/",
  explore: (params: {
    step?: string
    market?: string
    phase?: string
    assets?: string[]
    objective?: string
  }) => buildExploreUrl(params),
  results: (query: {
    market?: string
    phase?: string
    assets?: string[]
    objective?: string
  }) => buildResultsUrl(query),
  allRecords: () => "/?view=all",
  strategy: (slug: string) => `/?view=strategy&slug=${encodeURIComponent(slug)}`,
  compare: (slugs: string[]) =>
    slugs.length > 0
      ? `/?view=compare&slugs=${slugs.map((s) => encodeURIComponent(s)).join(",")}`
      : "/?view=all",
  protocols: () => "/?view=protocols",
  assets: () => "/?view=assets",
  networks: () => "/?view=networks",
  admin: (section?: string) => (section ? `/?view=admin&section=${section}` : "/?view=admin"),
  adminEdit: (id: string) => `/?view=admin&edit=${encodeURIComponent(id)}`,
  adminNew: () => "/?view=admin&new=1",
}

export type ViewName =
  | "archive"
  | "explore"
  | "results"
  | "all"
  | "strategy"
  | "compare"
  | "protocols"
  | "assets"
  | "networks"
  | "match" // legacy — redirects to the archive entrance
  | "admin"
export type AdminSection = "strategies" | "assets" | "protocols" | "networks"
export type ExploreStep = "market" | "phase" | "assets" | "objective"

// --- Guided-flow URL building ------------------------------------------------

/**
 * Accepts a Market Phase as a kebab-case slug OR the internal enum value
 * (callers spread ArchiveQuery, whose field is the enum). Returns the URL
 * slug; undefined for "all"/absent/unknown so nothing fake is ever stored.
 */
function phaseSlugValue(value?: string | null): string | undefined {
  if (!value || value === "all") return undefined
  if (parseSecondaryRegimeSlug(value)) return secondaryRegimeSlug(value)
  return undefined
}

function flowParams(params: {
  market?: string
  phase?: string
  assets?: string[]
  objective?: string
}): Record<string, string> {
  const out: Record<string, string> = {}
  if (params.market && params.market !== "all") out.market = params.market
  const phase = phaseSlugValue(params.phase)
  if (phase) out.phase = phase
  if (params.assets && params.assets.length > 0) out.assets = params.assets.join(",")
  if (params.objective && params.objective !== "all") out.objective = params.objective
  return out
}

function buildExploreUrl(params: {
  step?: string
  market?: string
  phase?: string
  assets?: string[]
  objective?: string
}): string {
  const step = params.step ?? "market"
  const search = new URLSearchParams({ view: "explore", step, ...flowParams(params) })
  return `/?${search.toString()}`
}

function buildResultsUrl(query: {
  market?: string
  phase?: string
  assets?: string[]
  objective?: string
}): string {
  const search = new URLSearchParams({ view: "results", ...flowParams(query) })
  return `/?${search.toString()}`
}

// --- Guided-flow URL parsing ---------------------------------------------------

export function parseMarket(value: string | null): MarketParam {
  if (value === "bull" || value === "sideways" || value === "bear") return value
  return "all"
}

export function parseAssets(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24)
}

export function parseObjective(value: string | null | undefined): ObjectiveParam {
  return isValidObjective(value) ? value : "all"
}

/**
 * Parse the ?phase= parameter (kebab-case slug; the enum is also accepted for
 * robustness) into the internal secondary-regime value. Undefined = the user
 * chose "All Phases" or no phase has been selected yet.
 */
export function parsePhase(value: string | null | undefined): SecondaryRegime | undefined {
  if (!value || value === "all") return undefined
  return parseSecondaryRegimeSlug(value)
}

/** Registry definition for the currently selected phase, when there is one. */
export function phaseDef(value: SecondaryRegime | undefined): SecondaryRegimeDef | undefined {
  return value ? secondaryRegimeDef(value) : undefined
}

/** Parse the full guided-flow / results query from search params. */
export function parseArchiveQuery(params: URLSearchParams): ArchiveQuery {
  return {
    market: parseMarket(params.get("market")),
    assets: parseAssets(params.get("assets")),
    objective: parseObjective(params.get("objective")),
    secondaryRegime: parsePhase(params.get("phase")),
  }
}

export function parseExploreStep(value: string | null): ExploreStep {
  if (value === "phase" || value === "assets" || value === "objective") return value
  return "market"
}

/** Maximum records in one side-by-side comparison. */
export const COMPARE_LIMIT = 3

/**
 * Parse the ?slugs= comparison list (comma-separated strategy slugs).
 * Deduplicated, capped at COMPARE_LIMIT, invalid entries dropped.
 */
export function parseCompareSlugs(value: string | null | undefined): string[] {
  if (!value) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of value.split(",")) {
    const slug = raw.trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
    if (out.length >= COMPARE_LIMIT) break
  }
  return out
}

/** Serialize an ArchiveQuery back into URL params (omits "all"/empty). */
export function archiveQueryToParams(query: ArchiveQuery): Record<string, string> {
  return flowParams({
    market: query.market,
    phase: query.secondaryRegime,
    assets: query.assets,
    objective: query.objective,
  })
}
