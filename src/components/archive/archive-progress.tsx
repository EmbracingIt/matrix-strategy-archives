"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { urls } from "@/lib/nav"
import type { ArchiveQuery } from "@/lib/matching"
import { cn } from "@/lib/utils"

/**
 * Archive retrieval progress — MARKET → MARKET PHASE → ASSETS → OBJECTIVE →
 * RESULTS. Completed stages link back into the flow (edit search) and carry a
 * subtle completion mark; the current stage carries the catalogue cursor.
 * This is the "walking deeper" cue. Horizontally scrollable on mobile.
 */

const STAGES = [
  { key: "market", label: "MARKET", step: "market" },
  { key: "phase", label: "MARKET PHASE", step: "phase" },
  { key: "assets", label: "ASSETS", step: "assets" },
  { key: "objective", label: "OBJECTIVE", step: "objective" },
  { key: "results", label: "RESULTS", step: null },
] as const

type StageKey = (typeof STAGES)[number]["key"]

const STAGE_ORDER: Record<StageKey, number> = {
  market: 0,
  phase: 1,
  assets: 2,
  objective: 3,
  results: 4,
}

export function ArchiveProgress({
  current,
  query,
}: {
  current: StageKey
  query: ArchiveQuery
}) {
  return (
    <nav aria-label="Archive retrieval progress" className="border-b border-white/10">
      <ol className="arc-scroll mx-auto flex max-w-[1380px] items-stretch overflow-x-auto px-4 sm:px-8">
        {STAGES.map((stage, index) => {
          const position = STAGE_ORDER[stage.key]
          const done = position < STAGE_ORDER[current]
          const active = stage.key === current

          const href =
            stage.step === null
              ? urls.results({
                  market: query.market,
                  phase: query.secondaryRegime,
                  assets: query.assets,
                  objective: query.objective,
                })
              : urls.explore({
                  step: stage.step,
                  market: query.market,
                  phase: query.secondaryRegime,
                  assets: query.assets,
                  objective: query.objective,
                })

          return (
            <li key={stage.key} className="flex min-w-fit items-stretch">
              <Link
                href={href}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 border-b-2 px-3 py-4 transition-colors duration-200 sm:px-4",
                  active
                    ? "border-arc-green text-arc-text"
                    : done
                      ? "border-transparent text-arc-muted hover:text-arc-text"
                      : "border-transparent text-arc-dim"
                )}
              >
                <span className="font-mono text-[10px] tabular-nums opacity-70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="arc-mono whitespace-nowrap">{stage.label}</span>
                {done && <Check className="size-3 text-arc-green/80" aria-hidden />}
                {active && <span className="arc-cursor !h-[2px] !w-2 !transform-none" aria-hidden />}
              </Link>
              {index < STAGES.length - 1 && (
                <span className="flex items-center font-mono text-[10px] text-arc-dim" aria-hidden>
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
