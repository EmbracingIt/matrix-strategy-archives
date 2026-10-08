"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { useStrategies } from "@/hooks/use-strategy-data"
import { matchStrategies } from "@/lib/matching"
import { archiveQueryToParams, parseArchiveQuery, urls } from "@/lib/nav"
import { secondaryRegimeDef } from "@/lib/secondary-regimes"
import { ArchiveError, ArchiveSkeleton } from "@/components/archive/archive-bits"
import { ArchiveProgress } from "@/components/archive/archive-progress"
import { FeaturedRecord } from "@/components/archive/featured-record"
import { RecordCard } from "@/components/archive/record-card"
import { cn } from "@/lib/utils"

/**
 * PAGE — RESULTS (guided step 03).
 * "You have reached this section of the Archive." The retrieval path is an
 * elegant archival breadcrumb (MARKET / PHASE) where
 * every crumb can be edited (click) or removed (×) — state lives in the URL
 * so refresh and back navigation always preserve the real selections.
 */
export function ResultsView() {
  const router = useRouter()
  const params = useSearchParams()
  const query = parseArchiveQuery(params)
  const { data: strategies = [], isLoading, isError, refetch } = useStrategies()

  // Primitive keys so downstream comparisons stay simple across renders.
  const market = query.market
  const phase = query.secondaryRegime

  // Deterministic retrieval — the engine lives in lib/matching.ts. The
  // collection is small and TanStack Query caches the strategies reference,
  // so the React Compiler's automatic memoization is sufficient here.
  const results = strategies.length
    ? matchStrategies(strategies, {
        market,
        assets: [],
        objective: "all",
        secondaryRegime: phase,
      })
    : []

  const updateQuery = (next: {
    market?: string
    removePhase?: boolean
  }) => {
    const nextMarket = next.market ?? query.market
    const nextPhase = next.removePhase ? undefined : query.secondaryRegime
    const search = new URLSearchParams({ view: "results" })
    const p = archiveQueryToParams({
      market: nextMarket as typeof query.market,
      assets: [],
      objective: "all",
      secondaryRegime: nextPhase,
    })
    for (const [key, value] of Object.entries(p)) search.set(key, value)
    router.replace(`/?${search.toString()}`)
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[1380px] px-4 py-16 sm:px-8">
        <ArchiveError onRetry={() => refetch()} />
      </div>
    )
  }

  const featured = results[0]
  const rest = results.slice(1)
  const phaseDefinition = phase ? secondaryRegimeDef(phase) : undefined
  const flow = queryToFlow(query)

  /** Edit links for each stage of the retrieval path. */
  const editLinks = [
    { label: "EDIT MARKET", href: urls.explore({ step: "market", ...flow }) },
    { label: "EDIT PHASE", href: urls.explore({ step: "phase", ...flow }) },
  ]

  return (
    <div>
      <ArchiveProgress current="results" query={query} />

      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        {/* Retrieval header */}
        <div className="border-b border-white/10 py-10 sm:py-12">
          <p className="arc-mono text-arc-green">ARCHIVE / SEARCH RESULT</p>

          {/* The retrieval path — elegant archival breadcrumbs */}
          <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2.5">
            <PathCrumb
              label={query.market === "all" ? "ALL MARKETS" : query.market.toUpperCase()}
              href={urls.explore({ step: "market", ...flow })}
              onRemove={query.market === "all" ? undefined : () => updateQuery({ market: "all" })}
            />
            <CrumbDivider />
            <PathCrumb
              label={phaseDefinition ? phaseDefinition.label.toUpperCase() : "ALL PHASES"}
              href={urls.explore({ step: "phase", ...flow })}
              onRemove={phase ? () => updateQuery({ removePhase: true }) : undefined}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-sans text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-arc-text">
              {isLoading ? (
                <span className="arc-mono text-[16px] text-arc-muted">RETRIEVING…</span>
              ) : (
                <>
                  {results.length} record{results.length === 1 ? "" : "s"} retrieved.
                </>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {editLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="arc-mono text-arc-muted underline decoration-white/20 underline-offset-8 transition-colors duration-200 hover:text-arc-text hover:decoration-arc-green"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={urls.explore({ step: "market" })}
                className="arc-mono text-arc-text underline decoration-arc-green/60 underline-offset-8 transition-colors duration-200 hover:decoration-arc-green"
              >
                NEW SEARCH
              </Link>
            </div>
          </div>
        </div>

        {/* Retrieved records */}
        <div className="py-12 sm:py-14">
          {isLoading ? (
            <ArchiveSkeleton rows={3} />
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center rounded-[6px] border border-dashed border-white/15 bg-arc-surface/40 px-6 py-24 text-center">
              <p className="arc-mono text-arc-muted">0 RECORDS RETRIEVED</p>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-arc-muted">
                The archive contains no records matching this classification. Loosen a
                selection above or start a new retrieval.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={urls.explore({ step: "market", ...flow })}
                  className="arc-mono flex h-11 items-center justify-center rounded-[4px] border border-white/15 px-6 text-arc-text transition-colors duration-200 hover:border-white/40"
                >
                  EDIT SEARCH
                </Link>
                <Link
                  href={urls.explore({ step: "market" })}
                  className="arc-mono flex h-11 items-center justify-center rounded-[4px] bg-arc-green px-6 text-black transition-colors duration-200 hover:bg-[#2ad695]"
                >
                  NEW SEARCH
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-16">
              {featured && <FeaturedRecord record={featured} />}

              {rest.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <p className="arc-mono text-arc-dim">
                      FURTHER RECORDS — {rest.length}
                    </p>
                    <span className="h-px flex-1 bg-white/[0.08]" aria-hidden />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {rest.map((record) => (
                      <RecordCard key={record.strategy.id} strategy={record.strategy} matched={record} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** ArchiveQuery → guided-flow params (phase as its enum value). */
function queryToFlow(query: ReturnType<typeof parseArchiveQuery>) {
  return {
    market: query.market,
    phase: query.secondaryRegime,
  }
}

function CrumbDivider() {
  return (
    <span className="arc-mono px-0.5 text-arc-dim/70" aria-hidden>
      /
    </span>
  )
}

function PathCrumb({
  label,
  href,
  onRemove,
}: {
  label: string
  href: string
  onRemove?: () => void
}) {
  return (
    <span className="group/crumb inline-flex items-center">
      <Link
        href={href}
        title={`Edit ${label.toLowerCase()}`}
        className={cn(
          "arc-mono rounded-[3px] border px-3 py-1.5 transition-colors duration-200",
          onRemove
            ? "border-white/15 bg-arc-surface/70 text-arc-text hover:border-white/40 hover:bg-arc-surface"
            : "border-white/[0.08] text-arc-muted hover:border-white/25 hover:text-arc-text"
        )}
      >
        {label}
      </Link>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="ml-1.5 text-arc-dim opacity-0 transition-all duration-200 group-hover/crumb:opacity-100 hover:text-arc-red focus-visible:opacity-100"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </span>
  )
}
