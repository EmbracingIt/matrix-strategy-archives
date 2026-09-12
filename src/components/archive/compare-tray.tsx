"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, X } from "lucide-react"
import { useStrategies } from "@/hooks/use-strategy-data"
import { urls } from "@/lib/nav"
import { COMPARE_LIMIT, useCompare } from "@/store/ui-store"
import { ArcAssetIcon } from "@/components/archive/archive-icons"
import { cn } from "@/lib/utils"

/**
 * COMPARISON TRAY — the pull-out shelf at the bottom of the Archive. Records
 * marked "COMPARE" anywhere in the collection gather here (max 3) until the
 * reader opens the side-by-side view. Lives in the ArchiveShell so every
 * public view shares it; hides itself on the comparison view itself.
 */
export function CompareTray() {
  const params = useSearchParams()
  const view = params.get("view") ?? "archive"
  const { compareSlugs, removeCompare, clearCompare } = useCompare()
  const { data: strategies = [] } = useStrategies()

  if (compareSlugs.length === 0 || view === "compare" || view === "admin") return null

  const selected = compareSlugs
    .map((slug) => strategies.find((s) => s.slug === slug))
    .filter((s): s is (typeof strategies)[number] => Boolean(s))

  const ready = selected.length >= 2

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-arc-green/25 bg-arc-bg/95 backdrop-blur-md"
      role="region"
      aria-label="Records selected for comparison"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-[1380px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-8 sm:py-3.5">
        <span className="arc-mono hidden shrink-0 items-center gap-2 text-arc-green sm:flex">
          <span className="size-1.5 rounded-full bg-arc-green" aria-hidden />
          COMPARISON
        </span>
        <span className="arc-mono shrink-0 text-[10px] text-arc-dim sm:hidden">COMPARE</span>

        {/* Selected records as chips */}
        <ul className="arc-scroll flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {selected.map((strategy) => (
            <li key={strategy.slug} className="shrink-0">
              <span className="flex items-center gap-2 rounded-full border border-white/12 bg-arc-surface py-1 pl-1 pr-2">
                <ArcAssetIcon
                  symbol={strategy.depositAssets[0]?.symbol ?? strategy.exposureAssets[0]?.symbol ?? "?"}
                  category={strategy.depositAssets[0]?.category ?? strategy.exposureAssets[0]?.category}
                  iconUrl={strategy.depositAssets[0]?.iconUrl ?? strategy.exposureAssets[0]?.iconUrl}
                  size={22}
                />
                <span className="max-w-[150px] truncate text-[12.5px] font-medium text-arc-text">
                  {strategy.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeCompare(strategy.slug)}
                  aria-label={`Remove ${strategy.name} from comparison`}
                  className="flex size-4.5 items-center justify-center rounded-full text-arc-dim transition-colors hover:text-arc-red"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            </li>
          ))}
          {selected.length < COMPARE_LIMIT && (
            <li className="arc-mono shrink-0 pl-1 text-[10px] text-arc-dim">
              +{COMPARE_LIMIT - selected.length} MORE
            </li>
          )}
        </ul>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={clearCompare}
            className="arc-mono px-2 py-2 text-[10px] text-arc-dim transition-colors hover:text-arc-red"
          >
            CLEAR
          </button>
          {ready ? (
            <Link
              href={urls.compare(compareSlugs)}
              className="group flex h-10 items-center gap-2.5 rounded-[4px] bg-arc-green px-5 text-black transition-colors duration-200 hover:bg-[#2ad695]"
              aria-label={`Compare ${selected.length} records side by side`}
            >
              <span className="arc-mono text-[11px]">COMPARE {selected.length}</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>
          ) : (
            <span
              className={cn(
                "arc-mono flex h-10 items-center rounded-[4px] border border-white/10 px-5 text-[11px]",
                "cursor-not-allowed text-arc-dim"
              )}
              aria-disabled="true"
            >
              SELECT {2 - selected.length} MORE
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
