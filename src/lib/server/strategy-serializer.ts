import { db } from "@/lib/db"
import { OBJECTIVE_KEYS, SECONDARY_REGIMES } from "@/lib/types"
import type {
  AssetRef,
  MarketFit,
  NetworkRef,
  ObjectiveKey,
  ProtocolRef,
  Requirements,
  RiskProfile,
  SecondaryRegime,
  StrategyDTO,
  StrategyInput,
  StrategyReference,
  StrategyStep,
  StrategyStatus,
} from "@/lib/types"

// ---------------------------------------------------------------------------
// Prisma row -> API DTO. Parses the JSON string columns into structured data
// and normalizes relation join tables into plain arrays.
// ---------------------------------------------------------------------------

type StrategyRowWithRelations = {
  id: string
  strategyId: string
  name: string
  slug: string
  summary: string
  description: string
  type: string
  status: string
  marketFit: string
  objectivesJson: string
  steps: string
  entryConditions: string
  exitConditions: string
  risk: string
  requirements: string
  referencesJson: string
  lastReviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
  depositAssets: { asset: { id: string; symbol: string; name: string; category: string | null; iconUrl: string | null } }[]
  exposureAssets: { asset: { id: string; symbol: string; name: string; category: string | null; iconUrl: string | null } }[]
  rewardAssets: { asset: { id: string; symbol: string; name: string; category: string | null; iconUrl: string | null } }[]
  networks: { network: { id: string; name: string; slug: string; chainId: number | null; iconUrl: string | null } }[]
  protocols: { protocol: { id: string; name: string; slug: string; website: string | null; iconUrl: string | null; description: string | null } }[]
}

/** Prisma include clause that loads everything needed to serialize a strategy. */
export const FULL_STRATEGY_INCLUDE = {
  depositAssets: { include: { asset: true } },
  exposureAssets: { include: { asset: true } },
  rewardAssets: { include: { asset: true } },
  networks: { include: { network: true } },
  protocols: { include: { protocol: true } },
} as const

function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * Normalizes the marketFit sub-document so every DTO exposes the full
 * two-layer classification with safe defaults:
 *   - regimes / secondaryRegimes are always arrays (unknown values dropped)
 *   - secondary data is optional — older records normalize to [] and {}
 */
function normalizeMarketFit(raw: string): MarketFit {
  const parsed = safeJson<Partial<MarketFit>>(raw, {})
  const regimes = Array.isArray(parsed.regimes)
    ? parsed.regimes.filter((r): r is MarketFit["regimes"][number] =>
        ["BULL", "SIDEWAYS", "BEAR"].includes(r)
      )
    : []
  const secondaryRegimes = Array.isArray(parsed.secondaryRegimes)
    ? parsed.secondaryRegimes.filter((r): r is SecondaryRegime =>
        (SECONDARY_REGIMES as string[]).includes(r)
      )
    : []
  const secondaryScores: Partial<Record<SecondaryRegime, number>> = {}
  if (parsed.secondaryScores && typeof parsed.secondaryScores === "object") {
    for (const [key, value] of Object.entries(parsed.secondaryScores)) {
      if ((SECONDARY_REGIMES as string[]).includes(key) && typeof value === "number") {
        secondaryScores[key as SecondaryRegime] = value
      }
    }
  }
  return {
    regimes,
    scores: parsed.scores ?? {},
    secondaryRegimes,
    secondaryScores,
    explanation: parsed.explanation,
  }
}

/**
 * Normalizes the curated objectives list: unknown keys dropped, duplicates
 * removed, canonical display order applied. Legacy records normalize to [].
 */
function normalizeObjectives(raw: string): ObjectiveKey[] {
  const parsed = safeJson<string[]>(raw, [])
  if (!Array.isArray(parsed)) return []
  const valid = new Set(parsed.filter((k): k is ObjectiveKey => (OBJECTIVE_KEYS as string[]).includes(k)))
  return OBJECTIVE_KEYS.filter((key) => valid.has(key))
}

export function serializeStrategy(row: StrategyRowWithRelations): StrategyDTO {
  const depositAssets: AssetRef[] = row.depositAssets.map(({ asset }) => ({
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    iconUrl: asset.iconUrl,
  }))
  const exposureAssets: AssetRef[] = row.exposureAssets.map(({ asset }) => ({
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    iconUrl: asset.iconUrl,
  }))
  const rewardAssets: AssetRef[] = row.rewardAssets.map(({ asset }) => ({
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    iconUrl: asset.iconUrl,
  }))
  const networks: NetworkRef[] = row.networks.map(({ network }) => ({
    id: network.id,
    name: network.name,
    slug: network.slug,
    chainId: network.chainId,
    iconUrl: network.iconUrl,
  }))
  const protocols: ProtocolRef[] = row.protocols.map(({ protocol }) => ({
    id: protocol.id,
    name: protocol.name,
    slug: protocol.slug,
    website: protocol.website,
    iconUrl: protocol.iconUrl,
    description: protocol.description,
  }))

  return {
    id: row.id,
    strategyId: row.strategyId,
    name: row.name,
    slug: row.slug,
    summary: row.summary ?? "",
    description: row.description ?? "",
    type: row.type,
    status: row.status as StrategyStatus,
    marketFit: normalizeMarketFit(row.marketFit),
    objectives: normalizeObjectives(row.objectivesJson),
    steps: safeJson<StrategyStep[]>(row.steps, []),
    entryConditions: safeJson<string[]>(row.entryConditions, []),
    exitConditions: safeJson<string[]>(row.exitConditions, []),
    risk: safeJson<RiskProfile>(row.risk, {
      overallRisk: "MEDIUM",
      leverageUsed: false,
      liquidationExposure: "NONE",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "NONE",
      assetVolatility: "MEDIUM",
    }),
    requirements: safeJson<Requirements>(row.requirements, { requiredHoldings: [] }),
    references: safeJson<StrategyReference[]>(row.referencesJson, []),
    lastReviewedAt: row.lastReviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    depositAssets,
    exposureAssets,
    rewardAssets,
    networks,
    protocols,
  }
}

// ---------------------------------------------------------------------------
// Slug / strategy-id helpers
// ---------------------------------------------------------------------------

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/** Ensures uniqueness by appending -2, -3, ... when needed. */
export async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "strategy"
  let candidate = root
  let counter = 2
  for (;;) {
    const existing = await db.strategy.findFirst({
      where: { slug: candidate, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    })
    if (!existing) return candidate
    candidate = `${root}-${counter++}`
  }
}

/** Generates the next STRATEGY_XXX reference from the current max. */
export async function nextStrategyId(): Promise<string> {
  const strategies = await db.strategy.findMany({ select: { strategyId: true } })
  let max = 0
  for (const s of strategies) {
    const m = s.strategyId.match(/^STRATEGY_(\d+)$/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `STRATEGY_${String(max + 1).padStart(3, "0")}`
}

// ---------------------------------------------------------------------------
// Revision helpers
// ---------------------------------------------------------------------------

/**
 * Compares the persisted strategy with the incoming payload to decide whether
 * the edit is "material" (content actually changed) and a revision snapshot
 * should be created. The comparison ignores volatile fields (ids, timestamps,
 * status) and focuses on the strategy definition itself.
 */
export function isMaterialChange(current: StrategyDTO, input: StrategyInput): boolean {
  const pick = (s: StrategyDTO) =>
    JSON.stringify([
      s.name,
      s.summary,
      s.description,
      s.type,
      s.marketFit,
      s.objectives,
      s.steps,
      s.entryConditions,
      s.exitConditions,
      s.risk,
      s.requirements,
      s.references,
      s.lastReviewedAt,
      s.depositAssets.map((a) => a.id).sort(),
      s.exposureAssets.map((a) => a.id).sort(),
      s.rewardAssets.map((a) => a.id).sort(),
      s.networks.map((n) => n.id).sort(),
      s.protocols.map((p) => p.id).sort(),
    ])
  return pick(current) !== pick(applyInputForComparison(current, input))
}

/** Applies the incoming partial payload over the current DTO for comparison. */
function applyInputForComparison(current: StrategyDTO, input: StrategyInput): StrategyDTO {
  return {
    ...current,
    name: input.name ?? current.name,
    summary: input.summary ?? current.summary,
    description: input.description ?? current.description,
    type: input.type ?? current.type,
    marketFit: { ...current.marketFit, ...input.marketFit },
    objectives: input.objectives ?? current.objectives,
    steps: input.steps ?? current.steps,
    entryConditions: input.entryConditions ?? current.entryConditions,
    exitConditions: input.exitConditions ?? current.exitConditions,
    risk: { ...current.risk, ...input.risk },
    requirements: { ...current.requirements, ...input.requirements },
    references: input.references ?? current.references,
    lastReviewedAt:
      input.lastReviewedAt === undefined ? current.lastReviewedAt : input.lastReviewedAt,
    depositAssets: (input.depositAssetIds ?? current.depositAssets.map((a) => a.id)).map(
      (id) => current.depositAssets.find((a) => a.id === id) ?? ({ id } as AssetRef)
    ),
    exposureAssets: (input.exposureAssetIds ?? current.exposureAssets.map((a) => a.id)).map(
      (id) => current.exposureAssets.find((a) => a.id === id) ?? ({ id } as AssetRef)
    ),
    rewardAssets: (input.rewardAssetIds ?? current.rewardAssets.map((a) => a.id)).map(
      (id) => current.rewardAssets.find((a) => a.id === id) ?? ({ id } as AssetRef)
    ),
    networks: (input.networkIds ?? current.networks.map((n) => n.id)).map(
      (id) => current.networks.find((n) => n.id === id) ?? ({ id } as NetworkRef)
    ),
    protocols: (input.protocolIds ?? current.protocols.map((p) => p.id)).map(
      (id) => current.protocols.find((p) => p.id === id) ?? ({ id } as ProtocolRef)
    ),
  }
}

/** Creates a revision snapshot of the given strategy (as it currently exists). */
export async function createRevisionSnapshot(
  strategyId: string,
  current: StrategyDTO,
  changeNote?: string | null
) {
  const last = await db.revision.findFirst({
    where: { strategyId },
    orderBy: { revisionNumber: "desc" },
    select: { revisionNumber: true },
  })
  await db.revision.create({
    data: {
      strategyId,
      revisionNumber: (last?.revisionNumber ?? 0) + 1,
      snapshot: JSON.stringify(current),
      changeNote: changeNote?.trim() || null,
    },
  })
}
