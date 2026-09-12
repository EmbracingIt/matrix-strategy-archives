"use client"

import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  GroupHeading,
  SearchMultiSelect,
  SectionSurface,
  StringListEditor,
} from "@/components/admin/form-controls"
import { AssetIcon, ProtocolIcon, NetworkIcon } from "@/components/shared/icons"
import { useAssets, useNetworks, useProtocols } from "@/hooks/use-strategy-data"
import {
  EXPOSURE_LEVELS,
  RISK_LEVELS,
  REGIMES,
  STRATEGY_STATUSES,
  type ExposureLevel,
  type Regime,
  type RiskLevel,
  type SecondaryRegime,
  type StrategyStatus,
} from "@/lib/types"
import { EXPOSURE_LABELS, RISK_LABELS, REGIME_LABELS, STATUS_LABELS } from "@/lib/format"
import { SECONDARY_REGIME_REGISTRY } from "@/lib/secondary-regimes"
import { OBJECTIVES } from "@/lib/strategyObjectives"
import { slugify } from "@/lib/strategy-form-utils"
import type { ObjectiveKey } from "@/lib/types"
import type { StrategyFormState } from "@/lib/strategy-form"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface SectionProps {
  form: StrategyFormState
  update: (patch: Partial<StrategyFormState>) => void
  knownTypes?: string[]
}

const REGIME_HINTS: Record<Regime, string> = {
  BULL: "Trending up",
  SIDEWAYS: "Ranging / choppy",
  BEAR: "Trending down",
}

// ---------------------------------------------------------------------------
// 01 — Overview
// ---------------------------------------------------------------------------

export function OverviewSection({ form, update, knownTypes = [] }: SectionProps) {
  const types = Array.from(new Set([...knownTypes, ...(form.type ? [form.type] : [])])).sort()
  const typeKnown = types.includes(form.type)

  return (
    <SectionSurface
      title="Overview"
      description="Basic identity and public-facing information for this strategy."
    >
      <div className="space-y-6">
        <Field label="Name" htmlFor="strategy-name">
          <Input
            id="strategy-name"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value
              update({
                name,
                slug: form.slugLocked ? form.slug : slugify(name),
              })
            }}
            placeholder="e.g. Accumulation LP"
            className="h-10"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Strategy type" hint="Pick an existing type or choose Custom…">
            <Select
              value={typeKnown ? form.type : "__custom"}
              onValueChange={(v) => update({ type: v === "__custom" ? "" : v })}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
                <SelectItem value="__custom">Custom…</SelectItem>
              </SelectContent>
            </Select>
            {!typeKnown && (
              <Input
                value={form.type}
                onChange={(e) => update({ type: e.target.value })}
                placeholder="Enter a custom type, e.g. Basis Trade"
                className="mt-2 h-10"
              />
            )}
          </Field>

          <Field label="Strategy ID" hint="Auto-generated when left empty.">
            <Input
              value={form.strategyId}
              onChange={(e) => update({ strategyId: e.target.value })}
              placeholder="STRATEGY_001"
              className="h-10 font-mono text-sm"
            />
          </Field>
        </div>

        <Field
          label="Objectives"
          hint="User-facing goals shown on the public Archive. Leave empty to derive them automatically from the strategy type."
        >
          <div className="flex flex-wrap gap-2 pt-1">
            {OBJECTIVES.map((objective) => {
              const selected = form.objectives.includes(objective.key)
              return (
                <button
                  key={objective.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    const next = selected
                      ? form.objectives.filter((k) => k !== objective.key)
                      : [...form.objectives, objective.key]
                    update({ objectives: next as ObjectiveKey[] })
                  }}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
                    selected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900"
                  )}
                >
                  {objective.label}
                  {selected && <Check className="h-3.5 w-3.5" />}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Slug" hint="Public URL key — auto-derived from the name until you edit it.">
          <Input
            value={form.slug}
            onChange={(e) => update({ slug: e.target.value, slugLocked: true })}
            placeholder="accumulation-lp"
            className="h-10 font-mono text-sm"
          />
        </Field>

        <Field
          label="Short summary"
          hint={`One or two sentences shown on archive cards. ${form.summary.length}/240 characters.`}
        >
          <Textarea
            value={form.summary}
            onChange={(e) => update({ summary: e.target.value.slice(0, 240) })}
            placeholder="A short explanation of what the strategy does and when it shines."
            rows={3}
            className="min-h-[96px] text-sm"
          />
        </Field>

        <Field
          label="Full description"
          hint="The main body of the detail page. Separate paragraphs with a blank line."
        >
          <Textarea
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="What the strategy is trying to accomplish, how it behaves, and what it trades off…"
            rows={6}
            className="min-h-[160px] text-sm leading-relaxed"
          />
        </Field>
      </div>
    </SectionSurface>
  )
}

// ---------------------------------------------------------------------------
// 02 — Instructions
// ---------------------------------------------------------------------------

export function InstructionsSection({ form, update }: SectionProps) {
  const setSteps = (steps: StrategyFormState["steps"]) => update({ steps })

  const moveStep = (index: number, direction: -1 | 1) => {
    const next = [...form.steps]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSteps(next)
  }

  return (
    <SectionSurface
      title="Instructions"
      description="The step-by-step execution flow shown on the strategy detail page."
    >
      <div className="space-y-3">
        {form.steps.map((step, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/60">
            <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-2">
              <span className="font-mono text-xs font-semibold text-gray-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-gray-400 hover:text-gray-900"
                  disabled={i === 0}
                  onClick={() => moveStep(i, -1)}
                  aria-label="Move step up"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-gray-400 hover:text-gray-900"
                  disabled={i === form.steps.length - 1}
                  onClick={() => moveStep(i, 1)}
                  aria-label="Move step down"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setSteps(form.steps.filter((_, j) => j !== i))}
                  aria-label="Delete step"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <Field label="Step title">
                <Input
                  value={step.title}
                  onChange={(e) =>
                    setSteps(form.steps.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)))
                  }
                  placeholder="e.g. Deposit ETH and USDC"
                  className="h-10 bg-white text-sm font-medium"
                />
              </Field>
              <Field label="Description" hint="What happens in this step and what to decide or watch.">
                <Textarea
                  value={step.description}
                  onChange={(e) =>
                    setSteps(
                      form.steps.map((s, j) => (j === i ? { ...s, description: e.target.value } : s))
                    )
                  }
                  placeholder="Details for this step…"
                  rows={3}
                  className="min-h-[80px] bg-white text-sm"
                />
              </Field>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full border-dashed text-xs text-gray-600"
          onClick={() => setSteps([...form.steps, { title: "", description: "" }])}
        >
          <Plus className="size-3.5" /> Add step
        </Button>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-7">
        <GroupHeading
          title="Entry conditions"
          description="When should someone start this strategy?"
        />
        <StringListEditor
          items={form.entryConditions}
          onChange={(items) => update({ entryConditions: items })}
          placeholder="e.g. Market regime is Bear or Sideways"
          addLabel="Add condition"
        />
      </div>

      <div className="mt-7 border-t border-gray-100 pt-7">
        <GroupHeading
          title="Exit conditions"
          description="When should someone stop or unwind it?"
        />
        <StringListEditor
          items={form.exitConditions}
          onChange={(items) => update({ exitConditions: items })}
          placeholder="e.g. Confirmed bull-regime breakout"
          addLabel="Add condition"
        />
      </div>
    </SectionSurface>
  )
}

// ---------------------------------------------------------------------------
// 03 — Market fit
// ---------------------------------------------------------------------------

export function MarketFitSection({ form, update }: SectionProps) {
  const toggleRegime = (regime: Regime) => {
    const regimes = form.marketFit.regimes.includes(regime)
      ? form.marketFit.regimes.filter((r) => r !== regime)
      : [...form.marketFit.regimes, regime]
    update({ marketFit: { ...form.marketFit, regimes } })
  }

  const toggleSecondary = (regime: SecondaryRegime) => {
    const secondaryRegimes = form.marketFit.secondaryRegimes.includes(regime)
      ? form.marketFit.secondaryRegimes.filter((r) => r !== regime)
      : [...form.marketFit.secondaryRegimes, regime]
    update({ marketFit: { ...form.marketFit, secondaryRegimes } })
  }

  const setSecondaryScore = (regime: SecondaryRegime, value: string) => {
    update({
      marketFit: {
        ...form.marketFit,
        secondaryScores: {
          ...form.marketFit.secondaryScores,
          [regime]: value.replace(/\D/g, "").slice(0, 3),
        },
      },
    })
  }

  const selectedRegimes = REGIMES.filter((r) => form.marketFit.regimes.includes(r))
  const selectedSecondary = form.marketFit.secondaryRegimes

  return (
    <SectionSurface
      title="Market Fit"
      description="Which market regimes this strategy is designed for. Optional 0–100 fit scores power future AI matching."
    >
      <GroupHeading
        title="Primary market fit"
        description="The simple public classification — required for archive discovery."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {REGIMES.map((regime) => {
          const selected = form.marketFit.regimes.includes(regime)
          return (
            <button
              key={regime}
              type="button"
              onClick={() => toggleRegime(regime)}
              aria-pressed={selected}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-400"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {REGIME_LABELS[regime]}
                </span>
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full border transition-colors",
                    selected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 text-transparent"
                  )}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{REGIME_HINTS[regime]}</p>
            </button>
          )
        })}
      </div>

      {selectedRegimes.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-900">Fit scores</div>
          <p className="mt-0.5 text-xs text-gray-500">
            0–100 — how well the strategy fits each selected regime.
          </p>
          <div className="mt-3 max-w-md space-y-3">
            {selectedRegimes.map((regime) => (
              <div key={regime} className="flex items-center gap-4">
                <span className="w-24 shrink-0 text-sm font-medium text-gray-700">
                  {REGIME_LABELS[regime]}
                </span>
                <Input
                  value={form.marketFit.scores[regime]}
                  onChange={(e) =>
                    update({
                      marketFit: {
                        ...form.marketFit,
                        scores: {
                          ...form.marketFit.scores,
                          [regime]: e.target.value.replace(/\D/g, "").slice(0, 3),
                        },
                      },
                    })
                  }
                  placeholder="0–100"
                  inputMode="numeric"
                  className="h-10 w-24 bg-white text-right font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Level-2: secondary regimes -------------------------------------- */}
      <div className="mt-8 border-t border-gray-100 pt-7">
        <div className="text-sm font-medium text-gray-900">Secondary regimes</div>
        <p className="mt-0.5 text-xs text-gray-500">
          Optional, more specific conditions inside or between the primary regimes — used
          for documentation, ranking and future AI matching. Leave empty if unsure.
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {SECONDARY_REGIME_REGISTRY.map((def) => {
            const selected = selectedSecondary.includes(def.value)
            return (
              <button
                key={def.value}
                type="button"
                onClick={() => toggleSecondary(def.value)}
                aria-pressed={selected}
                title={def.meaning}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-gray-700 bg-gray-50/60"
                    : "border-gray-200 bg-white hover:border-gray-400"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-gray-800">{def.label}</span>
                  <span
                    className={cn(
                      "flex size-3.5 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "border-gray-700 bg-gray-700 text-white"
                        : "border-gray-300 text-transparent"
                    )}
                  >
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-gray-400">
                  {def.parent ? `${def.parent} · inside` : def.transition}
                </p>
                <p className="mt-1.5 text-xs leading-snug text-gray-500 line-clamp-2">
                  {def.meaning}
                </p>
              </button>
            )
          })}
        </div>

        {selectedSecondary.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-900">Secondary fit scores</div>
            <p className="mt-0.5 text-xs text-gray-500">
              Optional 0–100 — how well the strategy fits each selected condition.
            </p>
            <div className="mt-3 max-w-md space-y-2.5">
              {selectedSecondary.map((regime) => {
                const def = SECONDARY_REGIME_REGISTRY.find((d) => d.value === regime)
                return (
                  <div key={regime} className="flex items-center gap-4">
                    <span className="w-44 shrink-0 text-sm font-medium text-gray-700">
                      {def?.label ?? regime}
                    </span>
                    <Input
                      value={form.marketFit.secondaryScores[regime] ?? ""}
                      onChange={(e) => setSecondaryScore(regime, e.target.value)}
                      placeholder="0–100"
                      inputMode="numeric"
                      className="h-10 w-24 bg-white text-right font-mono text-sm"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-gray-100 pt-7">
        <Field
          label="Why does this strategy fit these regimes?"
          hint="Shown on the detail page under Market Fit."
        >
          <Textarea
            value={form.marketFit.explanation}
            onChange={(e) =>
              update({ marketFit: { ...form.marketFit, explanation: e.target.value } })
            }
            placeholder="Explain why the strategy suits these regimes (and not the others)…"
            rows={4}
            className="min-h-[128px] text-sm leading-relaxed"
          />
        </Field>
      </div>
    </SectionSurface>
  )
}

// ---------------------------------------------------------------------------
// 04 — Assets
// ---------------------------------------------------------------------------

function AssetRoleGroup({
  label,
  hint,
  role,
  form,
  update,
  list,
}: {
  label: string
  hint: string
  role: "depositAssetIds" | "exposureAssetIds" | "rewardAssetIds"
  form: StrategyFormState
  update: (patch: Partial<StrategyFormState>) => void
  list: { id: string; symbol: string; name: string; category: string | null; iconUrl: string | null; active: boolean }[]
}) {
  const toggle = (id: string) => {
    const selected = form[role].includes(id)
    update({
      [role]: selected ? form[role].filter((x) => x !== id) : [...form[role], id],
    } as Partial<StrategyFormState>)
  }

  return (
    <div>
      <GroupHeading title={label} description={hint} />
      <SearchMultiSelect
        options={list.map((a) => ({
          id: a.id,
          label: a.symbol,
          sub: a.name,
          icon: <AssetIcon symbol={a.symbol} category={a.category} iconUrl={a.iconUrl} size={18} />,
        }))}
        selected={form[role]}
        onToggle={toggle}
        placeholder="Search assets…"
        searchPlaceholder="Search by symbol or name…"
        emptyText={list.length === 0 ? "No assets yet — create them under Assets." : "No matches."}
      />
    </div>
  )
}

export function AssetsSection({ form, update }: SectionProps) {
  const { data: assets } = useAssets()
  const list = (assets ?? []).filter((a) => a.active)

  return (
    <SectionSurface
      title="Assets"
      description="Tokens involved in this strategy, grouped by the role they play."
    >
      <div className="space-y-8">
        <AssetRoleGroup
          label="Deposit assets"
          hint="What users need to put in."
          role="depositAssetIds"
          form={form}
          update={update}
          list={list}
        />
        <div className="border-t border-gray-100 pt-7">
          <AssetRoleGroup
            label="Exposure assets"
            hint="What the position creates exposure to."
            role="exposureAssetIds"
            form={form}
            update={update}
            list={list}
          />
        </div>
        <div className="border-t border-gray-100 pt-7">
          <AssetRoleGroup
            label="Reward tokens"
            hint="Incentive tokens the strategy may earn."
            role="rewardAssetIds"
            form={form}
            update={update}
            list={list}
          />
        </div>
      </div>
    </SectionSurface>
  )
}

// ---------------------------------------------------------------------------
// 05 — Platforms
// ---------------------------------------------------------------------------

export function PlatformsSection({ form, update }: SectionProps) {
  const { data: networks } = useNetworks()
  const { data: protocols } = useProtocols()
  const activeNetworks = (networks ?? []).filter((n) => n.active)
  const activeProtocols = (protocols ?? []).filter((p) => p.active)

  const toggleNetwork = (id: string) => {
    const selected = form.networkIds.includes(id)
    update({
      networkIds: selected ? form.networkIds.filter((x) => x !== id) : [...form.networkIds, id],
    })
  }

  const toggleProtocol = (id: string) => {
    const selected = form.protocolIds.includes(id)
    update({
      protocolIds: selected ? form.protocolIds.filter((x) => x !== id) : [...form.protocolIds, id],
    })
  }

  return (
    <SectionSurface
      title="Platforms"
      description="Where this strategy runs and which protocols it uses."
    >
      <GroupHeading title="Networks" description="Chains the strategy is deployed on." />
      <SearchMultiSelect
        options={activeNetworks.map((n) => ({
          id: n.id,
          label: n.name,
          icon: <NetworkIcon name={n.name} iconUrl={n.iconUrl} size={18} />,
        }))}
        selected={form.networkIds}
        onToggle={toggleNetwork}
        placeholder="Search networks…"
        searchPlaceholder="Search networks…"
        emptyText={activeNetworks.length === 0 ? "No networks — add them under Networks." : "No matches."}
      />

      <div className="mt-8 border-t border-gray-100 pt-7">
        <GroupHeading title="Protocols" description="Applications the strategy interacts with." />
        <SearchMultiSelect
          options={activeProtocols.map((p) => ({
            id: p.id,
            label: p.name,
            icon: <ProtocolIcon name={p.name} iconUrl={p.iconUrl} size={18} />,
          }))}
          selected={form.protocolIds}
          onToggle={toggleProtocol}
          placeholder="Search protocols…"
          searchPlaceholder="Search protocols…"
          emptyText={activeProtocols.length === 0 ? "No protocols — add them under Protocols." : "No matches."}
        />
      </div>
    </SectionSurface>
  )
}

// ---------------------------------------------------------------------------
// 06 — Risk
// ---------------------------------------------------------------------------

function RiskSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: RiskLevel | ExposureLevel
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function RiskSection({ form, update }: SectionProps) {
  const risk = form.risk
  const setRisk = (patch: Partial<StrategyFormState["risk"]>) =>
    update({ risk: { ...risk, ...patch } })

  const riskOptions = RISK_LEVELS.map((v) => ({ value: v, label: RISK_LABELS[v] }))
  const exposureOptions = EXPOSURE_LEVELS.map((v) => ({ value: v, label: EXPOSURE_LABELS[v] }))

  return (
    <SectionSurface
      title="Risk"
      description="Structured risk classification — used by the public filters and future AI matching."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <RiskSelect
          label="Overall risk"
          value={risk.overallRisk}
          options={riskOptions}
          onChange={(v) => setRisk({ overallRisk: v as RiskLevel })}
        />
        <RiskSelect
          label="Liquidation exposure"
          value={risk.liquidationExposure}
          options={exposureOptions}
          onChange={(v) => setRisk({ liquidationExposure: v as ExposureLevel })}
        />
        <RiskSelect
          label="Smart contract risk"
          value={risk.smartContractRisk}
          options={riskOptions}
          onChange={(v) => setRisk({ smartContractRisk: v as RiskLevel })}
        />
        <RiskSelect
          label="Impermanent loss"
          value={risk.impermanentLoss}
          options={exposureOptions}
          onChange={(v) => setRisk({ impermanentLoss: v as ExposureLevel })}
        />
        <RiskSelect
          label="Asset volatility"
          value={risk.assetVolatility}
          options={exposureOptions}
          onChange={(v) => setRisk({ assetVolatility: v as ExposureLevel })}
        />
        <RiskSelect
          label="Incentive reliance"
          value={risk.incentiveReliance}
          options={exposureOptions}
          onChange={(v) => setRisk({ incentiveReliance: v as ExposureLevel })}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
        <div>
          <div className="text-sm font-medium text-gray-900">Leverage used</div>
          <div className="mt-0.5 text-xs text-gray-500">
            Does the strategy borrow or use leverage?
          </div>
        </div>
        <Switch
          checked={risk.leverageUsed}
          onCheckedChange={(checked) => setRisk({ leverageUsed: checked })}
          aria-label="Toggle leverage used"
        />
      </div>
      {risk.leverageUsed && (
        <div className="mt-4 max-w-sm">
          <Field label="Leverage amount" hint="e.g. 1–3x effective notional.">
            <Input
              value={risk.leverageAmount}
              onChange={(e) => setRisk({ leverageAmount: e.target.value })}
              placeholder="1–3x"
              className="h-10 font-mono text-sm"
            />
          </Field>
        </div>
      )}

      <div className="mt-8 border-t border-gray-100 pt-7">
        <Field label="Risk explanation" hint="The narrative shown under the risk table on the detail page.">
          <Textarea
            value={risk.explanation}
            onChange={(e) => setRisk({ explanation: e.target.value })}
            placeholder="Explain the dominant risks, the tail risks, and what the strategy does NOT protect against…"
            rows={5}
            className="min-h-[140px] text-sm leading-relaxed"
          />
        </Field>
      </div>

      <div className="mt-6">
        <Field label="Withdrawal restrictions" hint="How quickly capital can be withdrawn, if constrained.">
          <Input
            value={risk.withdrawalRestrictions}
            onChange={(e) => setRisk({ withdrawalRestrictions: e.target.value })}
            placeholder="e.g. Instant via swap; queue for exact value"
            className="h-10 text-sm"
          />
        </Field>
      </div>
    </SectionSurface>
  )
}

// ---------------------------------------------------------------------------
// 07 — Requirements
// ---------------------------------------------------------------------------

export function RequirementsSection({ form, update }: SectionProps) {
  const req = form.requirements
  const setReq = (patch: Partial<StrategyFormState["requirements"]>) =>
    update({ requirements: { ...req, ...patch } })
  const setRisk = (patch: Partial<StrategyFormState["risk"]>) =>
    update({ risk: { ...form.risk, ...patch } })

  return (
    <SectionSurface
      title="Requirements"
      description="What a user needs before starting this strategy."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Minimum capital" hint="e.g. $2,000">
          <Input
            value={req.minCapital}
            onChange={(e) => setReq({ minCapital: e.target.value })}
            placeholder="$2,000"
            className="h-10 font-mono text-sm"
          />
        </Field>
        <Field label="Lockup period" hint="How long capital is committed.">
          <Input
            value={form.risk.lockupPeriod}
            onChange={(e) => setRisk({ lockupPeriod: e.target.value })}
            placeholder="e.g. Until maturity (3–12 months)"
            className="h-10 text-sm"
          />
        </Field>
      </div>

      <div className="mt-7">
        <GroupHeading title="Required holdings" description="Assets the user must already own." />
        <StringListEditor
          items={req.requiredHoldings}
          onChange={(items) => setReq({ requiredHoldings: items })}
          placeholder="e.g. ETH"
          addLabel="Add required holding"
        />
      </div>

      <div className="mt-7 border-t border-gray-100 pt-7">
        <Field label="Wallet / network setup" hint="Wallet and tooling prerequisites.">
          <Input
            value={req.walletSetup}
            onChange={(e) => setReq({ walletSetup: e.target.value })}
            placeholder="Ethereum-compatible wallet with a gas buffer"
            className="h-10 text-sm"
          />
        </Field>
      </div>

      <div className="mt-6">
        <Field label="Other prerequisites" hint="Skills, monitoring cadence, platform access…">
          <Textarea
            value={req.other}
            onChange={(e) => setReq({ other: e.target.value })}
            placeholder="Must be able to interact with Uniswap V3 and monitor the position weekly…"
            rows={3}
            className="min-h-[96px] text-sm"
          />
        </Field>
      </div>
    </SectionSurface>
  )
}

// ---------------------------------------------------------------------------
// 08 — References
// ---------------------------------------------------------------------------

export function ReferencesSection({ form, update }: SectionProps) {
  const refs = form.references
  const setRefs = (references: StrategyFormState["references"]) => update({ references })

  return (
    <SectionSurface
      title="References"
      description="Primary sources and documentation that back this strategy."
    >
      <div className="space-y-3">
        {refs.map((ref, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/60">
            <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-2">
              <span className="font-mono text-xs font-semibold text-gray-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => setRefs(refs.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-3.5" /> Remove
              </Button>
            </div>
            <div className="grid gap-5 p-4 sm:grid-cols-2">
              <Field label="Title">
                <Input
                  value={ref.title}
                  onChange={(e) =>
                    setRefs(refs.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))
                  }
                  placeholder="Uniswap V3 Documentation"
                  className="h-10 bg-white text-sm"
                />
              </Field>
              <Field label="URL">
                <Input
                  value={ref.url}
                  onChange={(e) =>
                    setRefs(refs.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))
                  }
                  placeholder="https://…"
                  className="h-10 bg-white font-mono text-sm"
                />
              </Field>
              <Field label="Publisher">
                <Input
                  value={ref.publisher}
                  onChange={(e) =>
                    setRefs(refs.map((r, j) => (j === i ? { ...r, publisher: e.target.value } : r)))
                  }
                  placeholder="Uniswap Labs"
                  className="h-10 bg-white text-sm"
                />
              </Field>
              <Field label="Notes" hint="What this reference supports.">
                <Input
                  value={ref.notes}
                  onChange={(e) =>
                    setRefs(refs.map((r, j) => (j === i ? { ...r, notes: e.target.value } : r)))
                  }
                  placeholder="Optional"
                  className="h-10 bg-white text-sm"
                />
              </Field>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full border-dashed text-xs text-gray-600"
          onClick={() => setRefs([...refs, { title: "", url: "", publisher: "", notes: "" }])}
        >
          <Plus className="size-3.5" /> Add reference
        </Button>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-7">
        <Field label="Last reviewed date" hint="Shown publicly as e.g. “Sep 2026”.">
          <Input
            type="date"
            value={form.lastReviewedAt}
            onChange={(e) => update({ lastReviewedAt: e.target.value })}
            className="h-10 w-48 font-mono text-sm"
          />
        </Field>
      </div>
    </SectionSurface>
  )
}

// ---------------------------------------------------------------------------
// 09 — Status
// ---------------------------------------------------------------------------

const STATUS_EXPLANATIONS: Record<StrategyStatus, string> = {
  DRAFT: "Admin only.",
  PUBLISHED: "Visible publicly and available for future agent matching.",
  ARCHIVED: "Retained but hidden from normal browsing.",
}

export function StatusSection({
  form,
  update,
  children,
}: SectionProps & { children?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionSurface
        title="Status"
        description="Control where this strategy is visible."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {STRATEGY_STATUSES.map((status) => {
            const active = form.status === status
            const isPublished = status === "PUBLISHED"
            return (
              <button
                key={status}
                type="button"
                onClick={() => update({ status })}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  active
                    ? isPublished
                      ? "border-emerald-600 bg-emerald-50/50"
                      : "border-gray-900 bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-400"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    {STATUS_LABELS[status]}
                  </span>
                  {active && (
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        isPublished ? "text-emerald-600" : "text-gray-900"
                      )}
                      strokeWidth={3}
                    />
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  {STATUS_EXPLANATIONS[status]}
                </p>
              </button>
            )
          })}
        </div>

        <div className="mt-7 border-t border-gray-100 pt-7">
          <Field
            label="Revision note"
            hint="Optional note stored with the snapshot created by this save."
          >
            <Input
              value={form.changeNote}
              onChange={(e) => update({ changeNote: e.target.value })}
              placeholder="e.g. Tightened exit conditions after review"
              className="h-10 text-sm"
            />
          </Field>
        </div>
      </SectionSurface>

      {children}
    </div>
  )
}
