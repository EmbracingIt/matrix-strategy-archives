"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, X } from "lucide-react"
import { useStrategies } from "@/hooks/use-strategy-data"
import { parseCompareSlugs, urls } from "@/lib/nav"
import { objectiveLabels } from "@/lib/strategyObjectives"
import { secondaryRegimeLabel, secondaryRegimeParentLabel } from "@/lib/secondary-regimes"
import { formatMonthYear } from "@/lib/format"
import { useCompare } from "@/store/ui-store"
import { ArcAssetIcon, ArcProtocolIcon } from "@/components/archive/archive-icons"
import { ArchiveError, ArchiveSkeleton } from "@/components/archive/archive-bits"
import { cn } from "@/lib/utils"
import type { StrategyDTO } from "@/lib/types"

/**
 * RECORD COMPARISON — up to three records laid out side by side, like
 * spreads from the same catalogue opened next to each other on a reading
 * table. The selection lives in the URL (?view=compare&slugs=a,b,c) so any
 * comparison is shareable; the label column stays pinned while the rest
 * scrolls horizontally on small screens.
 */

const REGIME_ARROWS: Record<string, string> = { BULL: "↗", SIDEWAYS: "→", BEAR: "↘" }
const REGIME_TEXT: Record<string, string> = {
  BULL: "text-arc-green",
  SIDEWAYS: "text-arc-amber",
  BEAR: "text-arc-red",
}
const RISK_TEXT: Record<string, string> = {
  LOW: "text-arc-green",
  MEDIUM: "text-arc-amber",
  HIGH: "text-arc-red",
  VERY_HIGH: "text-arc-red",
}

export function CompareView() {
  const router = useRouter()
  const params = useSearchParams()
  const slugs = parseCompareSlugs(params.get("slugs"))
  const { data: strategies = [], isLoading, isError, refetch } = useStrategies()
  const { setCompare, removeCompare, clearCompare } = useCompare()

  // Records in URL order; unknown slugs are silently dropped.
  const records = slugs
    .map((slug) => strategies.find((s) => s.slug === slug))
    .filter((s): s is StrategyDTO => Boolean(s))

  // Keep the tray and the URL in agreement when arriving via a shared link.
  useEffect(() => {
    if (records.length > 0) setCompare(slugs.slice(0, records.length))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join(",")])

  const removeRecord = (slug: string) => {
    removeCompare(slug)
    const next = slugs.filter((s) => s !== slug)
    router.replace(next.length > 0 ? urls.compare(next) : urls.allRecords())
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[1380px] px-4 py-16 sm:px-8">
        <ArchiveError onRetry={() => refetch()} />
      </div>
    )
  }

  const highestApy = records.reduce(
    (best, s) => Math.max(best, s.latestObservation?.apy ?? -Infinity),
    -Infinity
  )

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
      {/* Reading-table header */}
      <header className="border-b border-white/10 py-10 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="arc-mono text-arc-green">ARCHIVE / RECORD COMPARISON</p>
            <h1 className="mt-4 font-sans text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.01em] text-arc-text">
              Side by side<span className="text-arc-green">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-5">
            <p className="arc-mono text-arc-dim">
              {records.length} RECORD{records.length === 1 ? "" : "S"} SELECTED
            </p>
            <Link
              href={urls.allRecords()}
              className="arc-mono flex items-center gap-1.5 text-arc-muted transition-colors hover:text-arc-text"
            >
              <Plus className="size-3.5" aria-hidden />
              ADD RECORDS
            </Link>
          </div>
        </div>
      </header>

      <div className="py-10">
        {isLoading ? (
          <ArchiveSkeleton rows={4} />
        ) : records.length < 2 ? (
          <div className="flex flex-col items-center border border-dashed border-white/15 bg-arc-surface/40 px-6 py-20 text-center">
            <p className="arc-mono text-arc-muted">A COMPARISON NEEDS AT LEAST TWO RECORDS</p>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-arc-muted">
              Mark records with COMPARE while browsing the collection — they gather in the
              tray at the bottom of the archive until you lay them out here.
            </p>
            <Link
              href={urls.allRecords()}
              className="arc-mono mt-8 flex h-11 items-center rounded-[4px] bg-arc-green px-6 text-black transition-colors hover:bg-[#2ad695]"
            >
              BROWSE THE COLLECTION
            </Link>
          </div>
        ) : (
          <>
            {/* The reading table */}
            <div className="arc-scroll overflow-x-auto" data-lenis-prevent>
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Side-by-side comparison of {records.length} strategy records
                </caption>
                <colgroup>
                  <col style={{ width: 148 }} />
                  {records.map((record) => (
                    <col key={record.slug} style={{ width: 320 }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-white/10">
                    <th scope="col" className="sticky left-0 z-10 bg-arc-bg py-5 pr-4 align-bottom">
                      <span className="arc-mono text-[10px] text-arc-dim">RECORD</span>
                    </th>
                    {records.map((record) => (
                      <th key={record.slug} scope="col" className="py-5 pr-6 align-bottom">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="arc-mono text-[10px] text-arc-dim">
                              {record.strategyId}
                            </span>
                            <h2 className="mt-1 font-sans text-[20px] font-semibold leading-tight text-arc-text">
                              {record.name}
                            </h2>
                            <Link
                              href={urls.strategy(record.slug)}
                              className="arc-mono mt-2 inline-flex items-center gap-1.5 text-[10px] text-arc-green transition-colors hover:text-[#2ad695]"
                            >
                              OPEN RECORD →
                            </Link>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRecord(record.slug)}
                            aria-label={`Remove ${record.name} from comparison`}
                            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-arc-dim transition-colors hover:border-arc-red/50 hover:text-arc-red"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[13.5px]">
                  <CompareRow label="OBJECTIVES">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        {objectiveLabels(record).join(" / ") || record.type}
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="REGIMES">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        <span className="flex flex-wrap gap-x-3 gap-y-1">
                          {(record.marketFit?.regimes ?? []).map((regime) => (
                            <span
                              key={regime}
                              className={cn(
                                "arc-mono text-[11px]",
                                REGIME_TEXT[regime] ?? "text-arc-muted"
                              )}
                            >
                              {REGIME_ARROWS[regime]} {regime}
                            </span>
                          ))}
                        </span>
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="BEST DURING">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        <span className="flex flex-col gap-1">
                          {(record.marketFit?.secondaryRegimes ?? []).map((phase) => (
                            <span key={phase} className="text-[12.5px] text-arc-text">
                              {secondaryRegimeLabel(phase)}
                              <span className="ml-2 text-[10.5px] text-arc-dim">
                                {secondaryRegimeParentLabel(phase)}
                              </span>
                            </span>
                          ))}
                          {(record.marketFit?.secondaryRegimes ?? []).length === 0 && (
                            <span className="text-arc-dim">Not documented</span>
                          )}
                        </span>
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="OVERALL RISK">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        <span
                          className={cn(
                            "arc-mono text-[12px]",
                            RISK_TEXT[record.risk?.overallRisk ?? "MEDIUM"]
                          )}
                        >
                          {record.risk?.overallRisk?.replace("_", " ")}
                        </span>
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="KEY EXPOSURES">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        <span className="flex flex-col gap-1.5">
                          <ExposureLine
                            label="Smart contract"
                            value={record.risk?.smartContractRisk}
                          />
                          <ExposureLine label="Impermanent loss" value={record.risk?.impermanentLoss} />
                          <ExposureLine
                            label="Liquidation"
                            value={record.risk?.liquidationExposure}
                          />
                        </span>
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="COMPOSITION">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        <div className="flex flex-col gap-2">
                          <span className="flex items-center gap-2">
                            <ArcAssetIcon
                              symbol={record.depositAssets[0]?.symbol ?? "?"}
                              category={record.depositAssets[0]?.category}
                              iconUrl={record.depositAssets[0]?.iconUrl}
                              size={18}
                            />
                            <span className="text-[12.5px] text-arc-text">
                              {[
                                ...new Map(
                                  [...record.depositAssets, ...record.exposureAssets].map((a) => [
                                    a.symbol,
                                    a,
                                  ])
                                ).values(),
                              ]
                                .map((a) => a.symbol)
                                .join(" / ") || "—"}
                            </span>
                          </span>
                          {record.protocols.length > 0 && (
                            <span className="flex items-center gap-2">
                              <ArcProtocolIcon
                                name={record.protocols[0].name}
                                iconUrl={record.protocols[0].iconUrl}
                                size={16}
                              />
                              <span className="text-[12.5px] text-arc-muted">
                                {record.protocols.map((p) => p.name).join(", ")}
                              </span>
                            </span>
                          )}
                          <span className="arc-mono text-[10px] text-arc-dim">
                            {record.networks.map((n) => n.name).join(" / ") || "—"}
                          </span>
                        </div>
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="MIN CAPITAL">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        {record.requirements?.minCapital || "—"}
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="OBSERVED">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        {record.latestObservation ? (
                          <span className="arc-mono flex items-baseline gap-3 text-[12px]">
                            <span
                              className={cn(
                                "tabular-nums",
                                record.latestObservation.apy === highestApy
                                  ? "text-arc-green"
                                  : "text-arc-text"
                              )}
                            >
                              APY {record.latestObservation.apy.toFixed(2)}%
                            </span>
                            <span className="tabular-nums text-arc-muted">
                              TVL ${(record.latestObservation.tvl / 1_000_000).toFixed(1)}M
                            </span>
                          </span>
                        ) : (
                          <span className="text-arc-dim">No live feed</span>
                        )}
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="LAST REVIEWED">
                    {records.map((record) => (
                      <CompareCell key={record.slug}>
                        <span className="arc-mono text-[11px] text-arc-muted">
                          {formatMonthYear(record.lastReviewedAt).toUpperCase()}
                        </span>
                      </CompareCell>
                    ))}
                  </CompareRow>

                  <CompareRow label="SUMMARY" last>
                    {records.map((record) => (
                      <CompareCell key={record.slug} last>
                        <p className="line-clamp-4 text-[13px] leading-[1.65] text-arc-muted">
                          {record.summary}
                        </p>
                      </CompareCell>
                    ))}
                  </CompareRow>
                </tbody>
              </table>
            </div>

            {/* Reading-table footer */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <p className="arc-mono text-arc-dim">
                {records.length} RECORDS LAID OUT — COMPARISONS HOLD UP TO 3
              </p>
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => {
                    clearCompare()
                    router.replace(urls.allRecords())
                  }}
                  className="arc-mono text-arc-muted transition-colors hover:text-arc-red"
                >
                  CLEAR COMPARISON
                </button>
                <Link
                  href={urls.allRecords()}
                  className="arc-mono text-arc-muted transition-colors hover:text-arc-text"
                >
                  ADD MORE RECORDS →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CompareRow({
  label,
  children,
  last = false,
}: {
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <tr className={cn("border-b border-white/[0.07]", last && "border-b-0")}>
      <th
        scope="row"
        className={cn(
          "sticky left-0 z-10 bg-arc-bg py-4 pr-5 align-top text-[10px] font-normal uppercase tracking-wide text-arc-dim",
          last && "py-5"
        )}
      >
        <span className="arc-mono">{label}</span>
      </th>
      {children}
    </tr>
  )
}

function CompareCell({
  children,
  last = false,
}: {
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <td className={cn("py-4 pr-6 align-top text-arc-text", last && "py-5")}>{children}</td>
  )
}

function ExposureLine({ label, value }: { label: string; value?: string }) {
  return (
    <span className="flex items-baseline justify-between gap-4 text-[12px]">
      <span className="text-arc-muted">{label}</span>
      <span
        className={cn(
          "arc-mono text-[10.5px]",
          RISK_TEXT[value ?? ""] ?? "text-arc-dim"
        )}
      >
        {value?.replace("_", " ") ?? "—"}
      </span>
    </span>
  )
}
