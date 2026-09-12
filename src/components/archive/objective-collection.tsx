"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { useStrategies } from "@/hooks/use-strategy-data"
import { urls, type ArchiveQuery } from "@/lib/nav"
import { objectivesForStrategy, OBJECTIVES, type ObjectiveKey } from "@/lib/strategyObjectives"
import { ArchiveError, ArchiveSkeleton } from "@/components/archive/archive-bits"
import { cn } from "@/lib/utils"

/**
 * PAGE 4 — OBJECTIVE.
 * Human goals, not mechanical strategy types. Each objective is a section
 * of the archive — counts come from the centralized objective mapping
 * (lib/strategyObjectives.ts), never from hardcoded data.
 */

export function ObjectiveCollection({ query }: { query: ArchiveQuery }) {
  const router = useRouter()
  const { data: strategies = [], isLoading, isError, refetch } = useStrategies()

  const counts = useMemo(() => {
    const map = new Map<ObjectiveKey, number>()
    for (const objective of OBJECTIVES) map.set(objective.key, 0)
    for (const strategy of strategies) {
      for (const key of objectivesForStrategy(strategy)) {
        map.set(key, (map.get(key) ?? 0) + 1)
      }
    }
    return map
  }, [strategies])

  const retrieve = (objective: ObjectiveKey | "all") => {
    router.push(
      urls.results({
        market: query.market,
        phase: query.secondaryRegime,
        assets: query.assets,
        objective,
      })
    )
  }

  if (isError) {
    return <ArchiveError onRetry={() => refetch()} />
  }

  return (
    <div>
      {isLoading ? (
        <ArchiveSkeleton rows={4} />
      ) : (
        <div className="border-t border-white/10">
          {OBJECTIVES.map((objective, index) => {
            const count = counts.get(objective.key) ?? 0
            return (
              <button
                key={objective.key}
                type="button"
                onClick={() => retrieve(objective.key)}
                className="group relative flex w-full items-center gap-5 border-b border-white/10 px-4 py-6 text-left transition-colors duration-200 hover:bg-arc-surface sm:gap-10 sm:px-8 sm:py-7"
              >
                <span className="arc-mono hidden w-24 shrink-0 text-arc-dim sm:block">
                  {objective.code.replace("OBJ_", "SEC_")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[clamp(1.25rem,2.4vw,1.7rem)] font-semibold leading-tight tracking-tight text-arc-text transition-colors group-hover:text-white">
                    {objective.label}
                  </span>
                  <span className="mt-1.5 block text-[13.5px] text-arc-muted">{objective.description}</span>
                  <span className="arc-mono mt-2.5 block hidden text-arc-dim sm:block">{objective.keywords}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-8">
                  <span className={cn("arc-mono", count > 0 ? "text-arc-muted" : "text-arc-dim/60")}>
                    {count} RECORD{count === 1 ? "" : "S"}
                  </span>
                  <ArrowRight
                    className="size-5 -translate-x-1 text-arc-dim opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-arc-text group-hover:opacity-100"
                    aria-hidden
                  />
                </span>
                {index === 0 && null}
              </button>
            )
          })}

          {/* Show everything — unconstrained retrieval */}
          <button
            type="button"
            onClick={() => retrieve("all")}
            className="group flex w-full items-center gap-5 border-b border-dashed border-white/10 px-4 py-6 text-left transition-colors duration-200 hover:bg-arc-surface/60 sm:gap-10 sm:px-8"
          >
            <span className="arc-mono hidden w-24 shrink-0 text-arc-dim sm:block">SEC_ALL</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[clamp(1.25rem,2.4vw,1.7rem)] font-semibold leading-tight tracking-tight text-arc-muted transition-colors group-hover:text-arc-text">
                Show everything
              </span>
              <span className="mt-1.5 block text-[13.5px] text-arc-muted">
                Retrieve records for every objective in this part of the archive.
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
