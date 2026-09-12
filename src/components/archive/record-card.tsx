"use client"

import Link from "next/link"
import { ArrowRight, Check, Plus } from "lucide-react"
import { urls } from "@/lib/nav"
import { objectiveLabels } from "@/lib/strategyObjectives"
import { ArcAssetIcon, ArcIconStack, ArcNetworkIcon, ArcProtocolIcon } from "@/components/archive/archive-icons"
import { useCompare } from "@/store/ui-store"
import { cn } from "@/lib/utils"
import type { MatchedRecord } from "@/lib/matching"
import type { StrategyDTO } from "@/lib/types"

/**
 * A strategy rendered as an archive record — digital catalogue entry, not
 * an ecommerce card. Clear hierarchy: the strategy NAME dominates (serif),
 * a single classification line supports it, circular composition marks sit
 * in one quiet row, and the match score reads as text rather than a boxy
 * chip. Used in retrieval results and the Browse All grid.
 *
 * The whole card opens the record via a stretched link; the COMPARE control
 * sits above it (relative z-20) so marking a record never navigates.
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

export function RecordCard({
  strategy,
  matched,
  className,
}: {
  strategy: StrategyDTO
  matched?: MatchedRecord
  className?: string
}) {
  const { compareSlugs, toggleCompare } = useCompare()
  const selected = compareSlugs.includes(strategy.slug)

  const assets = [
    ...new Map(
      [...strategy.depositAssets, ...strategy.exposureAssets].map((a) => [a.symbol, a])
    ).values(),
  ]

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[6px] border bg-arc-surface/60 p-5 transition-all duration-200 sm:p-6",
        selected
          ? "border-arc-green/40 bg-arc-surface"
          : "border-white/[0.08] hover:border-white/25 hover:bg-arc-surface",
        className
      )}
    >
      {/* Stretched record link — the whole card opens the record */}
      <Link
        href={urls.strategy(strategy.slug)}
        className="absolute inset-0 z-10 rounded-[5px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-arc-green/70"
        aria-label={`Open record: ${strategy.name}`}
      />

      {/* Accent spine — advances on hover */}
      <span
        className="pointer-events-none absolute left-0 top-1/2 h-10 w-[2px] -translate-y-1/2 rounded-r-full bg-arc-green/80 opacity-0 transition-all duration-300 group-hover:top-4 group-hover:h-[calc(100%-2rem)] group-hover:translate-y-0 group-hover:opacity-100"
        aria-hidden
      />

      {/* Record header */}
      <div className="flex items-start justify-between gap-3">
        <span className="arc-mono text-arc-dim">{strategy.strategyId}</span>
        {matched && (
          <span className="flex items-baseline gap-1.5">
            <span className="arc-mono text-arc-dim">ARCHIVE MATCH</span>
            <span
              className={cn(
                "font-mono text-[15px] font-medium tabular-nums",
                matched.score >= 75 ? "text-arc-green" : "text-arc-text"
              )}
            >
              {matched.score}%
            </span>
          </span>
        )}
      </div>

      <h3 className="mt-3 font-serif text-[21px] font-normal leading-snug tracking-[-0.01em] text-arc-text transition-colors duration-200 group-hover:text-white">
        {strategy.name}
      </h3>

      <p className="arc-mono mt-2 text-[10px] text-arc-dim">
        {(objectiveLabels(strategy).slice(0, 2).join(" / ") || strategy.type).toUpperCase()}
      </p>

      {/* Composition — circular marks in one quiet row */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {assets.length > 0 && (
          <span className="flex items-center gap-2">
            <ArcIconStack ringClass="ring-arc-surface/60">
              {assets.slice(0, 3).map((asset) => (
                <ArcAssetIcon
                  key={asset.id}
                  symbol={asset.symbol}
                  category={asset.category}
                  iconUrl={asset.iconUrl}
                  size={20}
                />
              ))}
            </ArcIconStack>
            <span className="text-[12px] font-medium text-arc-muted">
              {assets.map((a) => a.symbol).join(" / ")}
            </span>
          </span>
        )}
        {strategy.protocols.length > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-arc-muted">
            <ArcProtocolIcon name={strategy.protocols[0].name} iconUrl={strategy.protocols[0].iconUrl} size={16} />
            {strategy.protocols.map((p) => p.name).join(", ")}
          </span>
        )}
        {strategy.networks.length > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-arc-muted">
            <ArcNetworkIcon name={strategy.networks[0].name} iconUrl={strategy.networks[0].iconUrl} size={16} />
            {strategy.networks.map((n) => n.name).join(", ")}
          </span>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-[13.5px] leading-relaxed text-arc-muted">
        {strategy.summary}
      </p>

      {/* Classification footer */}
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
            {strategy.marketFit?.regimes?.map((regime) => (
              <span
                key={regime}
                className={cn("arc-mono text-[10px]", REGIME_TEXT[regime] ?? "text-arc-muted")}
              >
                {REGIME_ARROWS[regime]} {regime}
              </span>
            ))}
            <span className={cn("arc-mono text-[10px]", RISK_TEXT[strategy.risk?.overallRisk ?? ""] ?? "text-arc-muted")}>
              {strategy.risk?.overallRisk?.replace("_", " ")} RISK
            </span>
            {strategy.latestObservation && (
              <span className="arc-mono text-[10px] text-arc-green">
                APY {strategy.latestObservation.apy.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {/* Mark for comparison — sits above the stretched link */}
            <button
              type="button"
              onClick={() => toggleCompare(strategy.slug)}
              aria-pressed={selected}
              className={cn(
                "arc-mono relative z-20 flex items-center gap-1.5 text-[10px] transition-colors duration-200",
                selected
                  ? "text-arc-green"
                  : "text-arc-dim hover:text-arc-text"
              )}
              aria-label={
                selected
                  ? `Remove ${strategy.name} from comparison`
                  : `Mark ${strategy.name} for comparison`
              }
            >
              {selected ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
              <span className="hidden sm:inline">{selected ? "SELECTED" : "COMPARE"}</span>
            </button>
            <span className="arc-mono flex items-center gap-1.5 text-arc-muted transition-colors duration-200 group-hover:text-arc-green">
              OPEN
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
