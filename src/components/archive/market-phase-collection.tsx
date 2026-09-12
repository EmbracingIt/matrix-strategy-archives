"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { useStrategies } from "@/hooks/use-strategy-data"
import { urls, type ArchiveQuery } from "@/lib/nav"
import {
  allPhasesLabel,
  secondaryRegimesForMarket,
  type SecondaryRegimeDef,
} from "@/lib/secondary-regimes"
import { ArchiveError, ArchiveSkeleton } from "@/components/archive/archive-bits"
import { cn } from "@/lib/utils"

/**
 * PAGE — MARKET PHASE (guided step 02).
 *
 * After choosing a wing of the Archive (Bull / Sideways / Bear / All), the
 * visitor walks one level deeper: the sub-collections inside that wing. Each
 * Market Phase is an archival subsection — a shelf with its own code, subject
 * line and record count — never a dropdown or a radio form. Selection is
 * single: one phase, or all phases of the current collection.
 */

const MARKET_LABEL: Record<string, string> = {
  bull: "Bull",
  sideways: "Sideways",
  bear: "Bear",
  all: "All Markets",
}

const MARKET_TEXT: Record<string, string> = {
  bull: "text-arc-green",
  sideways: "text-arc-amber",
  bear: "text-arc-red",
  all: "text-arc-text",
}

export function MarketPhaseCollection({ query }: { query: ArchiveQuery }) {
  const router = useRouter()
  const { data: strategies = [], isLoading, isError, refetch } = useStrategies()

  const market = query.market
  const phases = useMemo(() => secondaryRegimesForMarket(market), [market])

  const phaseCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const strategy of strategies) {
      for (const value of strategy.marketFit?.secondaryRegimes ?? []) {
        counts.set(value, (counts.get(value) ?? 0) + 1)
      }
    }
    return counts
  }, [strategies])

  /** Walk deeper into a specific phase — single selection, straight to assets. */
  const enterPhase = (slug: string) => {
    router.push(
      urls.explore({
        step: "assets",
        market,
        phase: slug,
        assets: query.assets,
        objective: query.objective,
      })
    )
  }

  /** Keep the whole collection — no phase constraint. */
  const enterAllPhases = () => {
    router.push(
      urls.explore({
        step: "assets",
        market,
        assets: query.assets,
        objective: query.objective,
      })
    )
  }

  if (isError) {
    return <ArchiveError onRetry={() => refetch()} />
  }

  return (
    <div>
      {/* Where the visitor stands — the collection they just entered */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/10 py-4">
        <span className="arc-mono text-arc-dim">COLLECTION:</span>
        <span className={cn("arc-mono text-[11px]", MARKET_TEXT[market] ?? "text-arc-text")}>
          {MARKET_LABEL[market] ?? market}
        </span>
        <button
          type="button"
          onClick={() => router.push(urls.explore({ step: "market", market, phase: query.secondaryRegime }))}
          className="arc-mono ml-auto text-arc-dim transition-colors duration-200 hover:text-arc-text"
        >
          CHANGE MARKET →
        </button>
      </div>

      {isLoading ? (
        <ArchiveSkeleton rows={4} />
      ) : (
        <div className="pt-8 sm:pt-10">
          {market === "all" && (
            <p className="arc-mono mb-6 text-arc-dim">
              THE FULL CYCLE — EVERY PHASE SHELVED IN THE ARCHIVE
            </p>
          )}
          {/* Sub-collection rail — phases hang off the wing's spine */}
          <div className="relative border-l border-white/10 pl-6 sm:pl-10">
            {phases.map((phase) => (
              <PhaseShelf
                key={phase.value}
                phase={phase}
                count={phaseCounts.get(phase.value) ?? 0}
                showParent={market === "all"}
                onEnter={() => enterPhase(phase.slug)}
              />
            ))}

            {/* All phases of this collection — the unconstrained shelf */}
            <button
              type="button"
              onClick={enterAllPhases}
              className="group relative -ml-6 flex w-[calc(100%+1.5rem)] items-center gap-5 border-t border-dashed border-white/10 px-0 py-6 text-left transition-colors duration-200 hover:bg-arc-surface/50 sm:-ml-10 sm:w-[calc(100%+2.5rem)] sm:px-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[clamp(1.3rem,2.4vw,1.8rem)] font-light leading-none text-arc-muted transition-colors duration-200 group-hover:text-arc-text">
                  {allPhasesLabel(market)}
                </span>
                <span className="mt-2 block text-[13px] text-arc-dim">
                  Do not constrain results by market phase.
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-6">
                <span className="arc-mono text-arc-dim">{strategies.length} RECORDS</span>
                <ArrowRight
                  className="size-5 -translate-x-1 text-arc-dim opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-arc-text group-hover:opacity-100"
                  aria-hidden
                />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PhaseShelf({
  phase,
  count,
  showParent,
  onEnter,
}: {
  phase: SecondaryRegimeDef
  count: number
  showParent: boolean
  onEnter: () => void
}) {
  return (
    <button
      type="button"
      onClick={onEnter}
      aria-label={`Explore the ${phase.label} phase`}
      className="group relative block w-full border-b border-white/[0.07] py-6 pl-6 text-left transition-colors duration-200 last:border-b-0 hover:bg-arc-surface/40 sm:pl-8 sm:py-7"
    >
      {/* Accent spine — advances on hover */}
      <span
        className="absolute left-0 top-1/2 h-5 w-[2px] -translate-x-px -translate-y-1/2 bg-arc-green/70 transition-all duration-300 ease-out group-hover:top-3 group-hover:h-[calc(100%-1.5rem)] group-hover:translate-y-0"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-5 sm:gap-10">
        <div className="min-w-0 flex-1">
          <span className="arc-mono text-arc-dim">
            PHASE / {phase.code}
            {showParent && (
              <span className="ml-3 text-arc-dim/70">
                {phase.parent ?? phase.transition}
              </span>
            )}
          </span>
          <span className="mt-2.5 block font-serif text-[clamp(1.55rem,3vw,2.3rem)] font-light leading-none tracking-[-0.01em] text-arc-text transition-colors duration-200 group-hover:text-white">
            {phase.label}
          </span>
          <span className="arc-mono mt-3 block text-[10px] text-arc-dim opacity-70 transition-opacity duration-300 group-hover:text-arc-muted group-hover:opacity-100">
            {phase.keywords}
          </span>
          <span className="mt-2.5 block max-w-xl text-[13.5px] leading-relaxed text-arc-muted">
            {phase.meaning}
          </span>
        </div>
        <span className="flex shrink-0 flex-col items-end gap-1.5 pt-1 sm:flex-row sm:items-center sm:gap-8">
          <span className={cn("arc-mono", count > 0 ? "text-arc-muted" : "text-arc-dim/60")}>
            {count} RECORD{count === 1 ? "" : "S"}
          </span>
          <ArrowRight
            className="size-5 -translate-x-1 text-arc-dim opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-arc-green group-hover:opacity-100"
            aria-hidden
          />
        </span>
      </div>
    </button>
  )
}
