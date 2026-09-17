"use client"

import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { useStrategies } from "@/hooks/use-strategy-data"
import { urls, type ArchiveQuery } from "@/lib/nav"
import { ArchiveError, ArchiveSkeleton } from "@/components/archive/archive-bits"
import { cn } from "@/lib/utils"
import type { Regime } from "@/lib/types"

/**
 * PAGE 2 — MARKET COLLECTION.
 * The wings of the archive. Each market is a large catalogue entry —
 * not a filter chip — with its record count and character. Choosing one
 * walks the visitor to the sub-collections (market phases) of that wing.
 */

const MARKETS = [
  {
    market: "bull",
    label: "Bull",
    collection: "01",
    keywords: "EXPANSION · MOMENTUM · GROWTH",
    accent: "bg-arc-green",
    text: "text-arc-green",
  },
  {
    market: "sideways",
    label: "Sideways",
    collection: "02",
    keywords: "YIELD · RANGE · MARKET NEUTRAL",
    accent: "bg-arc-amber",
    text: "text-arc-amber",
  },
  {
    market: "bear",
    label: "Bear",
    collection: "03",
    keywords: "DEFENSE · ACCUMULATION · HEDGING",
    accent: "bg-arc-red",
    text: "text-arc-red",
  },
] as const

export function MarketCollection({
  query,
}: {
  query: ArchiveQuery
}) {
  const router = useRouter()
  const { data: strategies = [], isLoading, isError, refetch } = useStrategies()

  if (isError) {
    return <ArchiveError onRetry={() => refetch()} />
  }

  const countFor = (market: string) =>
    strategies.filter((s) => s.marketFit?.regimes?.includes(market.toUpperCase() as Regime)).length

  const enter = (market: string) => {
    // Entering a wing first reveals its market phases (step 02).
    router.push(
      urls.explore({
        step: "phase",
        market,
        assets: query.assets,
        objective: query.objective,
      })
    )
  }

  return (
    <div>
      {isLoading ? (
        <ArchiveSkeleton rows={4} />
      ) : (
        <div className="border-t border-white/10">
          {MARKETS.map((market) => {
            const count = countFor(market.market)
            return (
              <button
                key={market.market}
                type="button"
                onClick={() => enter(market.market)}
                className="group relative flex w-full items-center gap-5 border-b border-white/10 px-4 py-7 text-left transition-colors duration-200 hover:bg-arc-surface sm:gap-10 sm:px-8 sm:py-9"
              >
                <span className={cn("absolute left-0 top-0 h-full w-[3px] scale-y-0 origin-top transition-transform duration-300 group-hover:scale-y-100", market.accent)} aria-hidden />
                <span className="arc-mono hidden w-24 shrink-0 text-arc-dim transition-transform duration-200 group-hover:translate-x-1 sm:block">
                  COLLECTION
                  <br />
                  {market.collection}
                </span>
                <span className="min-w-0 flex-1 transition-transform duration-200 group-hover:translate-x-1.5">
                  <span className={cn("block font-sans text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-none tracking-[-0.01em] text-arc-text transition-colors group-hover:text-white")}>
                    {market.label}
                  </span>
                  <span className="arc-mono mt-3 block hidden text-arc-dim transition-opacity duration-200 group-hover:text-arc-muted sm:block">{market.keywords}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-8">
                  <span className="arc-mono text-arc-muted">{count} RECORDS</span>
                  <ArrowRight
                    className="size-5 -translate-x-1 text-arc-dim opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-arc-text group-hover:opacity-100"
                    aria-hidden
                  />
                </span>
              </button>
            )
          })}

          {/* All markets — the unconstrained wing */}
          <button
            type="button"
            onClick={() => enter("all")}
            className="group flex w-full items-center gap-5 border-b border-dashed border-white/10 px-4 py-6 text-left transition-colors duration-200 hover:bg-arc-surface/60 sm:gap-10 sm:px-8"
          >
            <span className="arc-mono hidden w-24 shrink-0 text-arc-dim sm:block">
              COLLECTION
              <br />
              04
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-sans text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold leading-none text-arc-muted transition-colors group-hover:text-arc-text">
                All markets
              </span>
              <span className="arc-mono mt-3 block hidden text-arc-dim sm:block">
                EVERY REGIME · UNCONSTRAINED RETRIEVAL
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-8">
              <span className="arc-mono text-arc-dim">{strategies.length} RECORDS</span>
              <ArrowRight
                className="size-5 -translate-x-1 text-arc-dim opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-arc-text group-hover:opacity-100"
                aria-hidden
              />
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
