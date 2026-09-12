import type {
  ExposureLevel,
  ObjectiveKey,
  Regime,
  RiskLevel,
  SecondaryRegime,
  StrategyDTO,
  StrategyInput,
  StrategyStatus,
} from "@/lib/types"
import { SECONDARY_REGIMES } from "@/lib/types"

/**
 * Admin form state + conversions between StrategyDTO (API) ↔ form state ↔
 * StrategyInput (API). Kept in one module so the form components stay lean.
 */

export interface StrategyFormState {
  name: string
  strategyId: string
  slug: string
  slugLocked: boolean // true once the user edits the slug manually
  summary: string
  description: string
  type: string
  status: StrategyStatus
  /** Curated user-facing objectives; empty = derive from type. */
  objectives: ObjectiveKey[]
  marketFit: {
    regimes: Regime[]
    explanation: string
    scores: Record<Regime, string> // "" = not set
    /** Optional Level-2 conditions (see lib/secondary-regimes.ts). */
    secondaryRegimes: SecondaryRegime[]
    secondaryScores: Record<SecondaryRegime, string> // "" = not set
  }
  steps: { title: string; description: string }[]
  entryConditions: string[]
  exitConditions: string[]
  risk: {
    overallRisk: RiskLevel
    explanation: string
    leverageUsed: boolean
    leverageAmount: string
    liquidationExposure: ExposureLevel
    withdrawalRestrictions: string
    lockupPeriod: string
    incentiveReliance: ExposureLevel
    smartContractRisk: RiskLevel
    impermanentLoss: ExposureLevel
    assetVolatility: ExposureLevel
  }
  requirements: {
    minCapital: string
    requiredHoldings: string[]
    walletSetup: string
    other: string
  }
  references: { title: string; url: string; publisher: string; notes: string }[]
  lastReviewedAt: string // YYYY-MM-DD or ""
  depositAssetIds: string[]
  exposureAssetIds: string[]
  rewardAssetIds: string[]
  networkIds: string[]
  protocolIds: string[]
  changeNote: string
}

export function emptyFormState(nextId?: string): StrategyFormState {
  return {
    name: "",
    strategyId: nextId ?? "",
    slug: "",
    slugLocked: false,
    summary: "",
    description: "",
    type: "",
    status: "DRAFT",
    objectives: [],
    marketFit: {
      regimes: [],
      explanation: "",
      scores: { BULL: "", SIDEWAYS: "", BEAR: "" },
      secondaryRegimes: [],
      secondaryScores: {
        EARLY_RECOVERY: "",
        BTC_LED_EXPANSION: "",
        ALT_EXPANSION: "",
        LATE_BULL_DISTRIBUTION: "",
        CAPITULATION_DELEVERAGING: "",
        LOW_VOL_COMPRESSION: "",
        HIGH_VOLATILITY_CHOP: "",
      },
    },
    steps: [{ title: "", description: "" }],
    entryConditions: [],
    exitConditions: [],
    risk: {
      overallRisk: "MEDIUM",
      explanation: "",
      leverageUsed: false,
      leverageAmount: "",
      liquidationExposure: "NONE",
      withdrawalRestrictions: "",
      lockupPeriod: "",
      incentiveReliance: "LOW",
      smartContractRisk: "MEDIUM",
      impermanentLoss: "NONE",
      assetVolatility: "MEDIUM",
    },
    requirements: { minCapital: "", requiredHoldings: [], walletSetup: "", other: "" },
    references: [],
    lastReviewedAt: "",
    depositAssetIds: [],
    exposureAssetIds: [],
    rewardAssetIds: [],
    networkIds: [],
    protocolIds: [],
    changeNote: "",
  }
}

export function dtoToFormState(dto: StrategyDTO): StrategyFormState {
  return {
    name: dto.name,
    strategyId: dto.strategyId,
    slug: dto.slug,
    slugLocked: true,
    summary: dto.summary,
    description: dto.description,
    type: dto.type,
    status: dto.status,
    objectives: dto.objectives ?? [],
    marketFit: {
      regimes: dto.marketFit.regimes ?? [],
      explanation: dto.marketFit.explanation ?? "",
      scores: {
        BULL: dto.marketFit.scores?.BULL?.toString() ?? "",
        SIDEWAYS: dto.marketFit.scores?.SIDEWAYS?.toString() ?? "",
        BEAR: dto.marketFit.scores?.BEAR?.toString() ?? "",
      },
      secondaryRegimes: dto.marketFit.secondaryRegimes ?? [],
      secondaryScores: Object.fromEntries(
        SECONDARY_REGIMES.map(
          (r) => [r, dto.marketFit.secondaryScores?.[r]?.toString() ?? ""] as const
        )
      ) as Record<SecondaryRegime, string>,
    },
    steps: dto.steps?.length ? dto.steps : [{ title: "", description: "" }],
    entryConditions: dto.entryConditions ?? [],
    exitConditions: dto.exitConditions ?? [],
    risk: {
      overallRisk: dto.risk.overallRisk ?? "MEDIUM",
      explanation: dto.risk.explanation ?? "",
      leverageUsed: dto.risk.leverageUsed ?? false,
      leverageAmount: dto.risk.leverageAmount ?? "",
      liquidationExposure: dto.risk.liquidationExposure ?? "NONE",
      withdrawalRestrictions: dto.risk.withdrawalRestrictions ?? "",
      lockupPeriod: dto.risk.lockupPeriod ?? "",
      incentiveReliance: dto.risk.incentiveReliance ?? "LOW",
      smartContractRisk: dto.risk.smartContractRisk ?? "MEDIUM",
      impermanentLoss: dto.risk.impermanentLoss ?? "NONE",
      assetVolatility: dto.risk.assetVolatility ?? "MEDIUM",
    },
    requirements: {
      minCapital: dto.requirements.minCapital ?? "",
      requiredHoldings: dto.requirements.requiredHoldings ?? [],
      walletSetup: dto.requirements.walletSetup ?? "",
      other: dto.requirements.other ?? "",
    },
    references: (dto.references ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      publisher: r.publisher ?? "",
      notes: r.notes ?? "",
    })),
    lastReviewedAt: dto.lastReviewedAt ? dto.lastReviewedAt.slice(0, 10) : "",
    depositAssetIds: dto.depositAssets.map((a) => a.id),
    exposureAssetIds: dto.exposureAssets.map((a) => a.id),
    rewardAssetIds: dto.rewardAssets.map((a) => a.id),
    networkIds: dto.networks.map((n) => n.id),
    protocolIds: dto.protocols.map((p) => p.id),
    changeNote: "",
  }
}

export function formStateToInput(form: StrategyFormState): StrategyInput {
  const scores: Partial<Record<Regime, number>> = {}
  for (const regime of ["BULL", "SIDEWAYS", "BEAR"] as Regime[]) {
    const raw = form.marketFit.scores[regime].trim()
    if (raw !== "") {
      const n = Number.parseInt(raw, 10)
      if (!Number.isNaN(n)) scores[regime] = Math.max(0, Math.min(100, n))
    }
  }
  const secondaryScores: Partial<Record<SecondaryRegime, number>> = {}
  for (const regime of form.marketFit.secondaryRegimes) {
    const raw = form.marketFit.secondaryScores[regime]?.trim()
    if (raw && raw !== "") {
      const n = Number.parseInt(raw, 10)
      if (!Number.isNaN(n)) secondaryScores[regime] = Math.max(0, Math.min(100, n))
    }
  }
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    strategyId: form.strategyId.trim(),
    summary: form.summary,
    description: form.description,
    type: form.type.trim(),
    status: form.status,
    objectives: form.objectives.length ? form.objectives : undefined,
    marketFit: {
      regimes: form.marketFit.regimes,
      scores: Object.keys(scores).length ? scores : undefined,
      secondaryRegimes: form.marketFit.secondaryRegimes,
      secondaryScores:
        form.marketFit.secondaryRegimes.length && Object.keys(secondaryScores).length
          ? secondaryScores
          : undefined,
      explanation: form.marketFit.explanation || undefined,
    },
    steps: form.steps
      .filter((s) => s.title.trim() !== "" || s.description.trim() !== "")
      .map((s) => ({ title: s.title.trim(), description: s.description.trim() })),
    entryConditions: form.entryConditions.map((c) => c.trim()).filter(Boolean),
    exitConditions: form.exitConditions.map((c) => c.trim()).filter(Boolean),
    risk: {
      overallRisk: form.risk.overallRisk,
      explanation: form.risk.explanation || undefined,
      leverageUsed: form.risk.leverageUsed,
      leverageAmount: form.risk.leverageUsed ? form.risk.leverageAmount.trim() || undefined : undefined,
      liquidationExposure: form.risk.liquidationExposure,
      withdrawalRestrictions: form.risk.withdrawalRestrictions.trim() || undefined,
      lockupPeriod: form.risk.lockupPeriod.trim() || undefined,
      incentiveReliance: form.risk.incentiveReliance,
      smartContractRisk: form.risk.smartContractRisk,
      impermanentLoss: form.risk.impermanentLoss,
      assetVolatility: form.risk.assetVolatility,
    },
    requirements: {
      minCapital: form.requirements.minCapital.trim() || undefined,
      requiredHoldings: form.requirements.requiredHoldings.map((h) => h.trim()).filter(Boolean),
      walletSetup: form.requirements.walletSetup.trim() || undefined,
      other: form.requirements.other.trim() || undefined,
    },
    references: form.references
      .filter((r) => r.title.trim() !== "" || r.url.trim() !== "")
      .map((r) => ({
        title: r.title.trim(),
        url: r.url.trim(),
        publisher: r.publisher.trim() || undefined,
        notes: r.notes.trim() || undefined,
      })),
    lastReviewedAt: form.lastReviewedAt ? new Date(form.lastReviewedAt).toISOString() : null,
    depositAssetIds: form.depositAssetIds,
    exposureAssetIds: form.exposureAssetIds,
    rewardAssetIds: form.rewardAssetIds,
    networkIds: form.networkIds,
    protocolIds: form.protocolIds,
    changeNote: form.changeNote.trim() || undefined,
  }
}

/** Full input payload derived from a DTO (used by archive / duplicate actions). */
export function dtoToInput(dto: StrategyDTO, overrides: Partial<StrategyInput> = {}): StrategyInput {
  const base = formStateToInput(dtoToFormState(dto))
  return { ...base, ...overrides }
}

/** Signature used for dirty-checking (changeNote excluded). */
export function formSignature(form: StrategyFormState): string {
  const { changeNote: _note, slugLocked: _lock, ...rest } = form
  return JSON.stringify(rest)
}
