"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { useStrategy } from "@/hooks/use-strategy-data"
import { formatDate, formatMonthYear } from "@/lib/format"
import { urls } from "@/lib/nav"
import { objectiveLabels } from "@/lib/strategyObjectives"
import { secondaryRegimeDef } from "@/lib/secondary-regimes"
import { ArcAssetIcon, ArcIconStack, ArcNetworkIcon, ArcProtocolIcon } from "@/components/archive/archive-icons"
import { cn } from "@/lib/utils"
import type { ExposureLevel, Regime, RiskLevel, StrategyDTO } from "@/lib/types"

/**
 * STRATEGY RECORD — opening a complete archived record. Editorial layout:
 * a sticky section index (01–09), big readable text, thin rules, numbered
 * methodology and research provenance. The index tracks scroll position.
 */

const SECTIONS = [
  { id: "overview", code: "01", label: "OVERVIEW" },
  { id: "instructions", code: "02", label: "INSTRUCTIONS" },
  { id: "entry-exit", code: "03", label: "ENTRY / EXIT" },
  { id: "market-fit", code: "04", label: "MARKET FIT" },
  { id: "risk", code: "05", label: "RISK" },
  { id: "assets", code: "06", label: "ASSETS" },
  { id: "platforms", code: "07", label: "PLATFORMS" },
  { id: "requirements", code: "08", label: "REQUIREMENTS" },
  { id: "references", code: "09", label: "REFERENCES" },
] as const

const REGIME_ARROWS: Record<Regime, string> = { BULL: "↗", SIDEWAYS: "→", BEAR: "↘" }
const REGIME_TEXT: Record<Regime, string> = {
  BULL: "text-arc-green",
  SIDEWAYS: "text-arc-amber",
  BEAR: "text-arc-red",
}
const RISK_TEXT: Record<RiskLevel, string> = {
  LOW: "text-arc-green",
  MEDIUM: "text-arc-amber",
  HIGH: "text-arc-red",
  VERY_HIGH: "text-arc-red",
}
const EXPOSURE_TEXT: Record<ExposureLevel, string> = {
  NONE: "text-arc-green",
  LOW: "text-arc-green",
  MEDIUM: "text-arc-amber",
  HIGH: "text-arc-red",
}

export function StrategyRecordView({ slug }: { slug: string }) {
  const { data: strategy, isLoading, isError, refetch } = useStrategy(slug)
  const router = useRouter()
  const params = useSearchParams()
  useEffect(() => {
    if (strategy && strategy.slug !== slug) {
      const next = new URLSearchParams(params.toString())
      next.set("slug", strategy.slug)
      router.replace(`/?${next}`, { scroll: false })
    }
  }, [strategy, slug, params, router])

  const [activeSection, setActiveSection] = useState<string>("overview")

  // Scrollspy for the record index.
  useEffect(() => {
    if (!strategy) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    )
    for (const section of SECTIONS) {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [strategy])

  const uniqueAssets = useMemo(() => {
    if (!strategy) return []
    return [
      ...new Map(
        [...strategy.depositAssets, ...strategy.exposureAssets].map((a) => [a.symbol, a])
      ).values(),
    ]
  }, [strategy])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1380px] animate-pulse px-4 py-16 sm:px-8">
        <div className="h-4 w-40 bg-white/5" />
        <div className="mt-8 h-14 w-2/3 bg-white/5" />
        <div className="mt-10 h-64 bg-white/[0.03]" />
      </div>
    )
  }

  if (isError || !strategy) {
    return (
      <div className="mx-auto max-w-[1380px] px-4 py-16 sm:px-8">
        <div className="flex flex-col items-center border border-white/10 bg-arc-surface px-6 py-24 text-center">
          <p className="arc-mono text-arc-red">RECORD NOT FOUND</p>
          <p className="mt-3 max-w-md text-[14px] text-arc-muted">
            This record does not exist in the archive, or it has been withdrawn.
          </p>
          <Link
            href={urls.allRecords()}
            className="arc-mono mt-8 flex h-11 items-center border border-white/15 px-6 text-arc-text transition-colors hover:border-white/40"
          >
            ← BACK TO ALL RECORDS
          </Link>
          <Link href={urls.learn()} className="arc-mono mt-4 min-h-11 content-center text-arc-muted">LEARN THE BASICS →</Link>
        </div>
      </div>
    )
  }

  return (
    <article>
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        {/* Non-published banner */}
        {strategy.status !== "PUBLISHED" && (
          <div
            className={cn(
              "mt-6 flex items-center gap-3 border px-4 py-3",
              strategy.status === "DRAFT"
                ? "border-arc-amber/40 bg-arc-amber/10 text-arc-amber"
                : "border-white/15 bg-white/5 text-arc-muted"
            )}
          >
            <span className="arc-mono">
              {strategy.status === "DRAFT" ? "DRAFT RECORD — NOT YET PUBLISHED" : "ARCHIVED RECORD — RETAINED FOR REFERENCE"}
            </span>
          </div>
        )}

        {/* Record header */}
        <header className="border-b border-white/10 py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={urls.allRecords()}
              className="arc-mono flex items-center gap-2 text-arc-muted transition-colors hover:text-arc-text"
            >
              <ArrowLeft className="size-3.5" aria-hidden /> ALL RECORDS
            </Link>
            <span className="arc-mono text-arc-dim">ARCHIVE RECORD / {strategy.strategyId}</span>
          </div>

          <h1 className="mt-6 max-w-4xl font-sans text-[clamp(2.4rem,5.5vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-arc-text">
            {strategy.name}
          </h1>

          <p className="arc-mono mt-5 text-[11px] text-arc-dim">
            {(objectiveLabels(strategy).join(" / ") || strategy.type).toUpperCase()} ·{" "}
            {strategy.type.toUpperCase()}
          </p>

          {/* Composition */}
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 border-y border-white/[0.07] py-5">
            {uniqueAssets.length > 0 && (
              <span className="flex items-center gap-3">
                <ArcIconStack ringClass="ring-arc-bg">
                  {uniqueAssets.slice(0, 4).map((asset) => (
                    <ArcAssetIcon
                      key={asset.id}
                      symbol={asset.symbol}
                      category={asset.category}
                      iconUrl={asset.iconUrl}
                      size={24}
                    />
                  ))}
                </ArcIconStack>
                <span className="text-[13px] font-medium text-arc-text">
                  {uniqueAssets.map((a) => a.symbol).join(" / ")}
                </span>
              </span>
            )}
            {strategy.protocols.length > 0 && (
              <span className="flex items-center gap-2.5 text-[13px] text-arc-muted">
                <ArcProtocolIcon
                  name={strategy.protocols[0].name}
                  iconUrl={strategy.protocols[0].iconUrl}
                  size={22}
                />
                {strategy.protocols.map((p) => p.name).join(", ")}
              </span>
            )}
            {strategy.networks.length > 0 && (
              <span className="flex items-center gap-2.5 text-[13px] text-arc-muted">
                <ArcNetworkIcon
                  name={strategy.networks[0].name}
                  iconUrl={strategy.networks[0].iconUrl}
                  size={22}
                />
                {strategy.networks.map((n) => n.name).join(", ")}
              </span>
            )}
            {strategy.latestObservation && (
              <span className="arc-mono ml-auto text-[11px] text-arc-green">
                APY {strategy.latestObservation.apy.toFixed(1)}% · TVL{" "}
                {(strategy.latestObservation.tvl / 1_000_000).toFixed(1)}M
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {strategy.marketFit?.regimes?.map((regime) => (
              <span
                key={regime}
                className={cn("arc-mono text-[12px]", REGIME_TEXT[regime] ?? "text-arc-muted")}
              >
                {REGIME_ARROWS[regime]} {regime}
              </span>
            ))}
            <span className={cn("arc-mono text-[12px]", RISK_TEXT[strategy.risk?.overallRisk ?? "MEDIUM"])}>
              {strategy.risk?.overallRisk?.replace("_", " ")} RISK
            </span>
            <span className="arc-mono text-[12px] text-arc-muted">
              LAST REVIEWED {formatMonthYear(strategy.lastReviewedAt).toUpperCase()}
            </span>
          </div>
        </header>

        {/* Body: sticky index + editorial sections */}
        <div className="grid gap-10 py-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <RecordIndex active={activeSection} />

          <div className="min-w-0 space-y-16">
            <OverviewSection strategy={strategy} />
            <InstructionsSection strategy={strategy} />
            <EntryExitSection strategy={strategy} />
            <MarketFitSection strategy={strategy} />
            <RiskSection strategy={strategy} />
            <AssetsSection strategy={strategy} />
            <PlatformsSection strategy={strategy} />
            <RequirementsSection strategy={strategy} />
            <ReferencesSection strategy={strategy} />
          </div>
        </div>

        {/* Record footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-8">
          <p className="arc-mono text-arc-dim">
            END OF RECORD — {strategy.strategyId}
          </p>
          <div className="flex items-center gap-6">
            <Link href={urls.explore({ step: "market" })} className="arc-mono text-arc-muted transition-colors hover:text-arc-text">
              NEW RETRIEVAL →
            </Link>
            <Link href={urls.allRecords()} className="arc-mono text-arc-muted transition-colors hover:text-arc-text">
              ALL RECORDS →
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function RecordIndex({ active }: { active: string }) {
  return (
    <>
      {/* Desktop sticky index */}
      <nav aria-label="Record sections" className="hidden lg:block">
        <div className="sticky top-24">
          <p className="arc-mono mb-4 text-arc-dim">RECORD INDEX</p>
          <ol className="space-y-0.5 border-l border-white/10">
            {SECTIONS.map((section) => {
              const isActive = section.id === active
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={cn(
                      "-ml-px flex items-center gap-3 border-l-2 py-2 pl-4 transition-colors",
                      isActive
                        ? "border-arc-green text-arc-text"
                        : "border-transparent text-arc-muted hover:text-arc-text"
                    )}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-arc-dim">{section.code}</span>
                    <span className="arc-mono text-[10px]">{section.label}</span>
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
      </nav>

      {/* Mobile horizontal index */}
      <nav
        aria-label="Record sections"
        className="arc-scroll -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden"
      >
        {SECTIONS.map((section) => {
          const isActive = section.id === active
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={cn(
                "arc-mono shrink-0 border px-3 py-2 text-[10px] transition-colors",
                isActive
                  ? "border-arc-green/50 bg-arc-green/10 text-arc-green"
                  : "border-white/10 text-arc-muted"
              )}
            >
              {section.code} {section.label}
            </a>
          )
        })}
      </nav>
    </>
  )
}

function SectionRule({ code, title }: { code: string; title: string }) {
  return (
    <div className="border-t border-white/10 pt-6">
      <div className="flex items-baseline gap-4">
        <span className="arc-mono text-arc-green">{code}</span>
        <h2 className="font-sans text-[1.55rem] font-semibold tracking-[-0.01em] text-arc-text">
          {title}
        </h2>
      </div>
    </div>
  )
}

function OverviewSection({ strategy }: { strategy: StrategyDTO }) {
  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "TYPE", value: strategy.type },
    {
      label: "OBJECTIVES",
      value: objectiveLabels(strategy).join(" / ") || "—",
    },
    {
      label: "REGIMES",
      value: strategy.marketFit?.regimes?.join(" · ") ?? "—",
    },
    {
      label: "OVERALL RISK",
      value: (
        <span className={RISK_TEXT[strategy.risk?.overallRisk ?? "MEDIUM"]}>
          {strategy.risk?.overallRisk?.replace("_", " ")}
        </span>
      ),
    },
    { label: "MIN CAPITAL", value: strategy.requirements?.minCapital || "—" },
    { label: "RECORD OPENED", value: formatDate(strategy.createdAt) },
    { label: "LAST REVIEWED", value: formatDate(strategy.lastReviewedAt) },
  ]

  return (
    <section id="overview" aria-label="Overview">
      <SectionRule code="01" title="Overview" />
      {strategy.summary && (
        <p className="mt-6 max-w-3xl font-sans text-[clamp(1.2rem,2vw,1.5rem)] font-semibold leading-[1.5] text-arc-text/90">
          {strategy.summary}
        </p>
      )}
      {strategy.description && (
        <p className="mt-6 max-w-3xl whitespace-pre-line text-[15px] leading-[1.75] text-arc-muted">
          {strategy.description}
        </p>
      )}
      {strategy.education && <div className="mt-8 space-y-5 text-[14px] leading-[1.75] text-arc-muted">
        {strategy.education.tools.includes("hedging") && <div className="border border-arc-green/20 bg-arc-green/5 p-4"><Link href="/?view=tools#hedging-calculator" className="inline-flex min-h-11 items-center text-arc-green">Hedging Calculator — In development →</Link><p>Not ready to use. Planned to help size LP delta hedges; verify current inventory and sizing independently before entry.</p></div>}
        {[["RETURN SOURCE", strategy.education.returnSource], ["EXPOSURE", strategy.education.exposure], ["MAIN TRADE-OFF", strategy.education.tradeOff]].map(([title, text]) => <div key={title}><p className="arc-mono text-arc-green">{title}</p><p className="mt-2">{text}</p></div>)}
        <details className="border-t border-white/10 pt-5"><summary className="arc-mono min-h-11 cursor-pointer text-arc-text">WORKED EXAMPLE / ILLUSTRATIVE, NOT LIVE RATES</summary>
          <h3 className="mt-4 text-[20px] font-semibold text-arc-text">{strategy.education.example.title}</h3>
          <p className="mt-4">{strategy.education.example.starting}</p><p className="mt-3">{strategy.education.example.action}</p><p className="mt-3">Assumptions: {strategy.education.example.assumptions}</p><p className="mt-3">Benchmark: {strategy.education.example.benchmark}</p>
          <div className="mt-6 grid gap-px border border-white/10 bg-white/10 xl:grid-cols-3">{strategy.education.example.scenarios.map(scenario => <div key={scenario.label} className="min-w-0 bg-arc-surface p-5"><h4 className="font-semibold text-arc-text">{scenario.label}</h4><p className="mt-3">{scenario.condition}</p><p className="mt-3">Position assets: {scenario.assets}</p><p className="mt-3">{scenario.value}</p><p className="mt-3">{scenario.next}</p></div>)}</div>
        </details>
      </div>}

      <dl className="mt-10 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-3 xl:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-arc-surface px-4 py-4">
            <dt className="arc-mono text-[10px] text-arc-dim">{fact.label}</dt>
            <dd className="mt-1.5 text-[13.5px] font-medium text-arc-text">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function InstructionsSection({ strategy }: { strategy: StrategyDTO }) {
  const steps = strategy.steps ?? []
  return (
    <section id="instructions" aria-label="Instructions">
      <SectionRule code="02" title="Methodology" />
      {steps.length === 0 ? (
        <p className="mt-6 text-[14px] text-arc-muted">No methodology documented for this record.</p>
      ) : (
        <ol className="mt-8 space-y-0">
          {steps.map((step, index) => (
            <li
              key={index}
              className="relative grid gap-3 border-l border-white/10 pb-10 pl-10 last:pb-0 sm:grid-cols-[1fr_2fr] sm:gap-8"
            >
              <span
                className="absolute left-0 top-1.5 size-[7px] -translate-x-[4px] bg-arc-green"
                aria-hidden
              />
              <div>
                <span className="font-mono text-[26px] font-light tabular-nums leading-none text-arc-green/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-arc-text">
                  {step.title}
                </h3>
              </div>
              {step.description && (
                <p className="max-w-2xl text-[14px] leading-[1.7] text-arc-muted">{step.description}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function EntryExitSection({ strategy }: { strategy: StrategyDTO }) {
  const entry = strategy.entryConditions ?? []
  const exit = strategy.exitConditions ?? []
  return (
    <section id="entry-exit" aria-label="Entry and exit conditions">
      <SectionRule code="03" title="Entry / Exit" />
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ConditionColumn
          title="ENTRY"
          tone="text-arc-green"
          marker="bg-arc-green"
          conditions={entry}
        />
        <ConditionColumn
          title="EXIT"
          tone="text-arc-red"
          marker="bg-arc-red"
          conditions={exit}
        />
      </div>
      {strategy.education && <div className="mt-8 border-t border-white/10 pt-6"><ConditionColumn title="MONITOR" tone="text-arc-muted" marker="bg-arc-green" conditions={strategy.education.monitor} /><p className="mt-5 text-[14px] leading-relaxed text-arc-muted">Exit plan: {strategy.education.exit}</p></div>}
    </section>
  )
}

function ConditionColumn({
  title,
  tone,
  marker,
  conditions,
}: {
  title: string
  tone: string
  marker: string
  conditions: string[]
}) {
  return (
    <div>
      <p className={cn("arc-mono border-b border-white/10 pb-3", tone)}>{title} CONDITIONS</p>
      {conditions.length === 0 ? (
        <p className="mt-5 text-[13.5px] text-arc-dim">None documented.</p>
      ) : (
        <ol className="mt-5 space-y-4">
          {conditions.map((condition, index) => (
            <li key={index} className="flex gap-4">
              <span className={cn("mt-[7px] size-1.5 shrink-0", marker)} aria-hidden />
              <span className="text-[14px] leading-[1.65] text-arc-muted">{condition}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function MarketFitSection({ strategy }: { strategy: StrategyDTO }) {
  const regimes: Regime[] = ["BULL", "SIDEWAYS", "BEAR"]
  const scores = strategy.marketFit?.scores ?? {}
  const declared = strategy.marketFit?.regimes ?? []
  const secondary = strategy.marketFit?.secondaryRegimes ?? []
  const secondaryScores = strategy.marketFit?.secondaryScores ?? {}

  return (
    <section id="market-fit" aria-label="Market fit">
      <SectionRule code="04" title="Market Fit" />
      <div className="mt-8 max-w-2xl space-y-5">
        {regimes.map((regime) => {
          const score = scores[regime]
          const active = declared.includes(regime)
          return (
            <div key={regime}>
              <div className="flex items-baseline justify-between gap-4">
                <span
                  className={cn(
                    "arc-mono text-[11px]",
                    active ? REGIME_TEXT[regime] : "text-arc-dim"
                  )}
                >
                  {REGIME_ARROWS[regime]} {regime}
                  {!active && <span className="ml-2 text-arc-dim/70">NOT DESIGNED</span>}
                </span>
                <span className="arc-mono text-[10px] text-arc-dim">
                  {typeof score === "number" ? score : active ? "DESIGNED FOR" : "NOT SCORED"}
                </span>
              </div>
              {typeof score === "number" && <div className="mt-2 h-[3px] w-full bg-white/10" aria-hidden>
                <span className={cn("block h-full transition-all", active ? regime === "BULL" ? "bg-arc-green" : regime === "SIDEWAYS" ? "bg-arc-amber" : "bg-arc-red" : "bg-white/15")} style={{ width: `${score}%` }} />
              </div>}
            </div>
          )
        })}
      </div>
      {strategy.marketFit?.explanation && (
        <p className="mt-8 max-w-2xl text-[14px] leading-[1.75] text-arc-muted">
          {strategy.marketFit.explanation}
        </p>
      )}

      {/* Level-2: only the market phases this record actually declares. */}
      {secondary.length > 0 && (
        <div className="mt-10 max-w-2xl border-t border-white/10 pt-6">
          <p className="arc-mono text-[11px] text-arc-muted">
            <span className="mr-2 inline-block size-1.5 rounded-full bg-arc-green align-middle" aria-hidden />
            BEST DURING — MARKET PHASES
          </p>
          <div className="mt-5 space-y-6">
            {secondary.map((value) => {
              const def = secondaryRegimeDef(value)
              const score = secondaryScores[value]
              return (
                <div key={value}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="arc-mono text-[11px] text-arc-text">
                      {def?.label.toUpperCase() ?? value}
                      <span className="ml-2.5 text-arc-dim">
                        {def?.parent
                          ? `INSIDE ${def.parent}`
                          : def?.transition
                            ? def.transition.toUpperCase()
                            : null}
                      </span>
                    </span>
                    {typeof score === "number" ? (
                      <span className="font-mono text-[13px] tabular-nums text-arc-green">
                        {score}
                      </span>
                    ) : (
                      <span className="arc-mono text-[10px] text-arc-dim">DECLARED</span>
                    )}
                  </div>
                  {def?.meaning && (
                    <p className="mt-1.5 max-w-xl text-[13px] leading-[1.6] text-arc-muted">
                      {def.meaning}
                    </p>
                  )}
                  {typeof score === "number" && (
                    <div className="mt-2 h-[3px] w-full bg-white/10" aria-hidden>
                      <span
                        className="block h-full bg-arc-green transition-all"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function RiskSection({ strategy }: { strategy: StrategyDTO }) {
  const risk = strategy.risk
  if (!risk) return null

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Overall",
      value: <span className={RISK_TEXT[risk.overallRisk]}>{risk.overallRisk?.replace("_", " ")}</span>,
    },
    {
      label: "Leverage",
      value: risk.leverageUsed ? (
        <span className="text-arc-red">Yes{risk.leverageAmount ? ` — ${risk.leverageAmount}` : ""}</span>
      ) : (
        <span className="text-arc-green">None</span>
      ),
    },
    {
      label: "Liquidation exposure",
      value: <span className={EXPOSURE_TEXT[risk.liquidationExposure]}>{risk.liquidationExposure}</span>,
    },
    ...(risk.conversionReversalRisk
      ? [{
          label: "Conversion / reversal risk",
          value: <span className={EXPOSURE_TEXT[risk.conversionReversalRisk]}>{risk.conversionReversalRisk}</span>,
        }]
      : [{
          label: "Impermanent loss",
          value: <span className={EXPOSURE_TEXT[risk.impermanentLoss]}>{risk.impermanentLoss}</span>,
        }]),
    {
      label: "Smart contract risk",
      value: <span className={RISK_TEXT[risk.smartContractRisk]}>{risk.smartContractRisk?.replace("_", " ")}</span>,
    },
    {
      label: "Asset volatility",
      value: <span className={EXPOSURE_TEXT[risk.assetVolatility]}>{risk.assetVolatility}</span>,
    },
    {
      label: "Incentive reliance",
      value: <span className={EXPOSURE_TEXT[risk.incentiveReliance]}>{risk.incentiveReliance}</span>,
    },
    {
      label: "Withdrawal restrictions",
      value: risk.withdrawalRestrictions || <span className="text-arc-green">None</span>,
    },
    {
      label: "Lockup period",
      value: risk.lockupPeriod || "—",
    },
  ]

  return (
    <section id="risk" aria-label="Risk">
      <SectionRule code="05" title="Risk" />
      <dl className="mt-8 max-w-2xl">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-6 border-b border-white/[0.07] py-3.5"
          >
            <dt className="text-[13.5px] text-arc-muted">{row.label}</dt>
            <dd className="text-right text-[13.5px] font-medium text-arc-text">{row.value}</dd>
          </div>
        ))}
      </dl>
      {risk.explanation && (
        <div className="mt-8 max-w-2xl border-l-2 border-arc-amber/60 pl-5">
          <p className="arc-mono mb-3 text-[10px] text-arc-amber">RISK EXPLANATION</p>
          <p className="text-[14px] leading-[1.75] text-arc-muted">{risk.explanation}</p>
        </div>
      )}
      {risk.conversionReversalExplanation && (
        <p className="mt-5 max-w-2xl text-[14px] leading-[1.75] text-arc-muted">
          {risk.conversionReversalExplanation}
        </p>
      )}
    </section>
  )
}

function AssetsSection({ strategy }: { strategy: StrategyDTO }) {
  const groups = [
    { label: "DEPOSIT ASSETS", assets: strategy.depositAssets, note: "What you put in" },
    { label: "EXPOSURE ASSETS", assets: strategy.exposureAssets, note: "What you are exposed to" },
    { label: "REWARD ASSETS", assets: strategy.rewardAssets, note: "What you earn" },
  ]

  return (
    <section id="assets" aria-label="Assets">
      <SectionRule code="06" title="Assets" />
      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-4">
              <p className="arc-mono text-arc-muted">{group.label}</p>
              <span className="arc-mono text-arc-dim/70">— {group.note}</span>
            </div>
            {group.assets.length === 0 ? (
              <p className="mt-3 text-[13px] text-arc-dim">None</p>
            ) : (
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                {group.assets.map((asset) => (
                  <span
                    key={`${group.label}-${asset.id}`}
                    className="flex items-center gap-3 rounded-full border border-white/10 bg-arc-surface px-3.5 py-2"
                  >
                    <ArcAssetIcon
                      symbol={asset.symbol}
                      category={asset.category}
                      iconUrl={asset.iconUrl}
                      size={20}
                    />
                    <span className="text-[13px] font-medium text-arc-text">{asset.symbol}</span>
                    <span className="text-[11px] text-arc-dim">{asset.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function PlatformsSection({ strategy }: { strategy: StrategyDTO }) {
  return (
    <section id="platforms" aria-label="Platforms">
      <SectionRule code="07" title="Platforms" />

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="arc-mono border-b border-white/10 pb-3 text-arc-muted">NETWORKS</p>
          <div className="mt-4 space-y-3">
            {strategy.networks.map((network) => (
              <span key={network.id} className="flex items-center gap-3 text-[14px] text-arc-text">
                <ArcNetworkIcon name={network.name} iconUrl={network.iconUrl} size={20} />
                {network.name}
                {network.chainId != null && (
                  <span className="font-mono text-[11px] text-arc-dim">CHAIN {network.chainId}</span>
                )}
              </span>
            ))}
            {strategy.networks.length === 0 && <p className="text-[13px] text-arc-dim">None</p>}
          </div>
        </div>

        <div>
          <p className="arc-mono border-b border-white/10 pb-3 text-arc-muted">PROTOCOLS</p>
          <div className="mt-4 space-y-3">
            {strategy.protocols.map((protocol) => (
              <span key={protocol.id} className="flex items-center gap-3 text-[14px] text-arc-text">
                <ArcProtocolIcon name={protocol.name} iconUrl={protocol.iconUrl} size={20} />
                {protocol.name}
                {protocol.website && (
                  <a
                    href={protocol.website}
                    target="_blank"
                    rel="noreferrer"
                    className="arc-mono flex items-center gap-1 text-[10px] text-arc-dim transition-colors hover:text-arc-green"
                  >
                    SOURCE <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                )}
              </span>
            ))}
            {strategy.protocols.length === 0 && <p className="text-[13px] text-arc-dim">None</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

function RequirementsSection({ strategy }: { strategy: StrategyDTO }) {
  const [implementation, setImplementation] = useState(0)
  const req = strategy.requirements
  const implementations = strategy.education?.implementations
  const selected = implementations?.[implementation] ?? implementations?.[0]
  if (selected && implementations) return <section id="requirements" aria-label="Requirements">
    <SectionRule code="08" title="Requirements" />
    <label className="arc-mono mt-8 block text-arc-dim">ASSET / PRODUCT / NETWORK
      <select aria-label="Asset, product and network" value={implementation} onChange={event=>setImplementation(Number(event.target.value))} className="mt-3 block min-h-11 w-full min-w-0 rounded-[4px] border border-white/15 bg-arc-surface px-3 text-[14px] text-arc-text">{implementations.map((item,index)=><option key={item.key} value={index}>{item.label}</option>)}</select>
    </label>
    <ul className="mt-6 space-y-3 text-[14px] leading-relaxed text-arc-muted">{selected.requirements.map(text=><li key={text}>{text}</li>)}</ul>
    {strategy.slug === "accumulation-lp" && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px]"><Link className="inline-flex min-h-11 items-center text-arc-green" href="/?view=learn&lesson=wallets">Learn about wallets →</Link><Link className="inline-flex min-h-11 items-center text-arc-green" href="/?view=learn&lesson=security">Learn about approvals →</Link><Link className="inline-flex min-h-11 items-center text-arc-green" href="/?view=learn&lesson=networks">Learn about gas →</Link></div>}
    {strategy.slug === "accumulation-lp" && <p className="mt-2 text-[13px] text-arc-muted">Already in range at entry? That is a different two-sided LP: <Link className="text-arc-green underline underline-offset-4" href="/?view=strategy&slug=dual-asset-growth-lp">see Dual-Asset LP</Link>.</p>}
    <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-2">{[["ENTER",selected.enter],["RECEIVED POSITION",selected.accounting],["EXIT",selected.exit],["RISKS",selected.risks]].map(([title,text])=><div key={title}><p className="arc-mono text-arc-dim">{title}</p><p className="mt-3 text-[14px] leading-relaxed text-arc-muted">{text}</p></div>)}</div>
  </section>
  return (
    <section id="requirements" aria-label="Requirements">
      <SectionRule code="08" title="Requirements" />
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="arc-mono text-arc-dim">MINIMUM CAPITAL</p>
          <p className="mt-2 font-mono text-[22px] font-medium tabular-nums text-arc-text">
            {req?.minCapital || "—"}
          </p>
        </div>
        <div>
          <p className="arc-mono text-arc-dim">REQUIRED HOLDINGS</p>
          {req?.requiredHoldings?.length ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {req.requiredHoldings.map((holding) => (
                <span
                  key={holding}
                  className="arc-mono border border-white/15 bg-arc-surface px-2.5 py-1 text-arc-text"
                >
                  {holding}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2.5 text-[13.5px] text-arc-muted">None specified</p>
          )}
        </div>
        <div>
          <p className="arc-mono text-arc-dim">LOCKUP</p>
          <p className="mt-2 text-[14px] text-arc-text">
            {strategy.risk?.lockupPeriod || "No lockup"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 border-t border-white/[0.07] pt-8 sm:grid-cols-2">
        <div>
          <p className="arc-mono text-arc-dim">WALLET / NETWORK SETUP</p>
          <p className="mt-2.5 max-w-md text-[14px] leading-relaxed text-arc-muted">
            {req?.walletSetup || "Standard EVM wallet setup."}
          </p>
          {strategy.slug === "accumulation-lp" && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px]"><Link className="inline-flex min-h-11 items-center text-arc-green" href="/?view=learn&lesson=wallets">Learn about wallets →</Link><Link className="inline-flex min-h-11 items-center text-arc-green" href="/?view=learn&lesson=security">Learn about approvals →</Link><Link className="inline-flex min-h-11 items-center text-arc-green" href="/?view=learn&lesson=networks">Learn about gas →</Link></div>}
          {strategy.slug === "accumulation-lp" && <p className="mt-2 text-[13px] text-arc-muted">Already in range at entry? That is a different two-sided LP: <Link className="text-arc-green underline underline-offset-4" href="/?view=strategy&slug=dual-asset-growth-lp">see Dual-Asset LP</Link>.</p>}
        </div>
        <div>
          <p className="arc-mono text-arc-dim">OTHER PREREQUISITES</p>
          <p className="mt-2.5 max-w-md text-[14px] leading-relaxed text-arc-muted">
            {req?.other || "None."}
          </p>
        </div>
      </div>
    </section>
  )
}

function ReferencesSection({ strategy }: { strategy: StrategyDTO }) {
  const references = strategy.references ?? []
  return (
    <section id="references" aria-label="References">
      <SectionRule code="09" title="References" />
      {references.length === 0 ? (
        <p className="mt-6 text-[14px] text-arc-muted">No references documented.</p>
      ) : (
        <ol className="mt-8">
          {references.map((reference, index) => (
            <li
              key={`${reference.url}-${index}`}
              className="grid gap-2 border-t border-white/[0.07] py-6 last:border-b sm:grid-cols-[auto_1fr_auto] sm:gap-8"
            >
              <span className="font-mono text-[13px] tabular-nums text-arc-dim">
                {String(index + 1).padStart(3, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-arc-text">{reference.title}</p>
                {reference.publisher && (
                  <p className="arc-mono mt-1.5 text-[10px] text-arc-dim">
                    {reference.publisher.toUpperCase()}
                  </p>
                )}
                {reference.notes && (
                  <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-arc-muted">
                    {reference.notes}
                  </p>
                )}
              </div>
              {reference.url && (
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="arc-mono flex h-9 items-center gap-2 self-start border border-white/15 px-4 text-arc-muted transition-colors hover:border-arc-green/50 hover:text-arc-green"
                >
                  VIEW SOURCE <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-4 border border-dashed border-white/15 bg-arc-surface/50 px-5 py-4">
        <span className="arc-barcode h-5 w-14 opacity-50" aria-hidden />
        <div>
          <p className="arc-mono text-arc-dim">LAST REVIEWED</p>
          <p className="mt-1 font-mono text-[15px] font-medium uppercase text-arc-text">
            {strategy.lastReviewedAt
              ? new Date(strategy.lastReviewedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "NOT YET REVIEWED"}
          </p>
        </div>
        <p className="arc-mono ml-auto hidden text-arc-dim sm:block">
          RESEARCH PROVENANCE — MATRIX FINANCE
        </p>
      </div>
    </section>
  )
}
