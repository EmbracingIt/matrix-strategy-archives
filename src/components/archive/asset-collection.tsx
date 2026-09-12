"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, X } from "lucide-react"
import { useAssets, useStrategies } from "@/hooks/use-strategy-data"
import { urls, type ArchiveQuery } from "@/lib/nav"
import { secondaryRegimeDef } from "@/lib/secondary-regimes"
import { ArchiveError, ArchiveSkeleton } from "@/components/archive/archive-bits"
import { ArcAssetIcon } from "@/components/archive/archive-icons"
import { cn } from "@/lib/utils"
import type { AssetDTO, StrategyDTO } from "@/lib/types"

/**
 * PAGE 4 — ASSET COLLECTION (guided step 03).
 * The asset drawers of the archive: grouped, selectable catalogue tiles with
 * real strategy counts. Multiselect; empty selection = no constraint. The
 * whole tile becomes the selected state — circular logo gains a green ring,
 * the surface lifts — never a lone corner checkbox.
 */

const GROUPS = [
  { category: "native", label: "NATIVE ASSETS" },
  { category: "stablecoin", label: "STABLECOINS" },
  { category: "lst", label: "LIQUID STAKING" },
  { category: "governance", label: "GOVERNANCE" },
  { category: "other", label: "OTHER" },
] as const

function strategyCountsByAsset(strategies: StrategyDTO[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const strategy of strategies) {
    const ids = new Set([
      ...strategy.depositAssets.map((a) => a.id),
      ...strategy.exposureAssets.map((a) => a.id),
      ...strategy.rewardAssets.map((a) => a.id),
    ])
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

export function AssetCollection({ query }: { query: ArchiveQuery }) {
  const router = useRouter()
  const { data: assets = [], isLoading: assetsLoading, isError, refetch } = useAssets()
  const { data: strategies = [] } = useStrategies()

  const [selected, setSelected] = useState<string[]>(() =>
    query.assets.map((s) => s.toUpperCase())
  )

  const counts = useMemo(() => strategyCountsByAsset(strategies), [strategies])
  const activeAssets = useMemo(() => assets.filter((a) => a.active), [assets])
  const phaseDef = secondaryRegimeDef(query.secondaryRegime ?? "")

  const toggle = (symbol: string) => {
    const key = symbol.toUpperCase()
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  const continueToObjective = () => {
    router.push(
      urls.explore({
        step: "objective",
        market: query.market,
        phase: query.secondaryRegime,
        assets: selected.map((s) => s.toLowerCase()),
        objective: query.objective,
      })
    )
  }

  if (isError) {
    return <ArchiveError onRetry={() => refetch()} />
  }

  return (
    <div className="pb-2">
      {/* Retrieval path so far — collection, then phase, both revisitable */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-white/10 py-4">
        <span className="arc-mono text-arc-dim">COLLECTION:</span>
        <button
          type="button"
          onClick={() => router.push(urls.explore({ step: "market", market: query.market, phase: query.secondaryRegime, assets: query.assets, objective: query.objective }))}
          className="arc-mono flex items-center gap-2 rounded-[3px] border border-white/15 bg-arc-surface/70 px-3 py-1.5 uppercase text-arc-text transition-colors duration-200 hover:border-white/40"
        >
          {query.market === "all" ? "ALL MARKETS" : query.market}
        </button>
        {phaseDef && (
          <>
            <span className="arc-mono text-arc-dim">/ PHASE:</span>
            <button
              type="button"
              onClick={() => router.push(urls.explore({ step: "phase", market: query.market, phase: query.secondaryRegime, assets: query.assets, objective: query.objective }))}
              className="arc-mono flex items-center gap-2 rounded-[3px] border border-white/15 bg-arc-surface/70 px-3 py-1.5 text-arc-text transition-colors duration-200 hover:border-white/40"
            >
              {phaseDef.label.toUpperCase()}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => router.push(urls.explore({ step: "phase", market: query.market, phase: query.secondaryRegime, assets: query.assets, objective: query.objective }))}
          className="arc-mono ml-auto text-arc-dim transition-colors duration-200 hover:text-arc-text"
        >
          {phaseDef ? "CHANGE PHASE →" : "CHOOSE PHASE →"}
        </button>
      </div>

      {assetsLoading ? (
        <ArchiveSkeleton rows={2} />
      ) : (
        <div className="space-y-10 py-8">
          {GROUPS.map((group) => {
            const groupAssets = activeAssets.filter(
              (a) => (a.category ?? "other").toLowerCase() === group.category
            )
            if (groupAssets.length === 0) return null
            return (
              <section key={group.category} aria-label={group.label}>
                <div className="mb-4 flex items-center gap-4">
                  <h3 className="arc-mono text-arc-muted">{group.label}</h3>
                  <span className="h-px flex-1 bg-white/[0.08]" aria-hidden />
                  <span className="arc-mono text-arc-dim">{groupAssets.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {groupAssets.map((asset) => (
                    <AssetTile
                      key={asset.id}
                      asset={asset}
                      count={counts.get(asset.id) ?? 0}
                      selected={selected.includes(asset.symbol.toUpperCase())}
                      onToggle={() => toggle(asset.symbol)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {activeAssets.length === 0 && (
            <p className="py-8 text-center text-[14px] text-arc-muted">
              The asset registry is empty.
            </p>
          )}
        </div>
      )}

      {/* ALL ASSETS — clears the constraint */}
      <button
        type="button"
        onClick={() => setSelected([])}
        aria-pressed={selected.length === 0}
        className={cn(
          "mb-4 flex w-full items-center justify-between rounded-[6px] border border-dashed px-5 py-4 text-left transition-all duration-200",
          selected.length === 0
            ? "border-arc-green/40 bg-arc-green/[0.05]"
            : "border-white/10 hover:border-white/30"
        )}
      >
        <span className="flex items-center gap-4">
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full border transition-colors duration-200",
              selected.length === 0 ? "border-arc-green bg-arc-green" : "border-white/25"
            )}
          >
            {selected.length === 0 && <Check className="size-3 text-black" aria-hidden />}
          </span>
          <span>
            <span className="block text-[14px] font-medium text-arc-text">All assets</span>
            <span className="mt-0.5 block text-[12px] text-arc-muted">
              Retrieve records across the whole collection
            </span>
          </span>
        </span>
        <span className="arc-mono text-arc-dim">{activeAssets.length} INDEXED</span>
      </button>

      {/* Sticky selection bar */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/10 bg-arc-bg/95 px-4 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="arc-scroll flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {selected.length === 0 ? (
              <span className="arc-mono whitespace-nowrap text-arc-muted">
                NO CONSTRAINT — ALL ASSETS
              </span>
            ) : (
              selected.map((symbol) => (
                <span
                  key={symbol}
                  className="arc-mono flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-arc-surface px-3 py-1.5 text-arc-text"
                >
                  {symbol}
                  <button
                    type="button"
                    onClick={() => toggle(symbol)}
                    aria-label={`Remove ${symbol}`}
                    className="text-arc-muted transition-colors hover:text-arc-red"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))
            )}
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="arc-mono ml-2 shrink-0 text-arc-dim transition-colors hover:text-arc-text"
              >
                CLEAR
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={continueToObjective}
            className="group flex h-12 shrink-0 items-center justify-center gap-3 rounded-[4px] bg-arc-green px-7 text-black transition-colors duration-200 hover:bg-[#2ad695]"
          >
            <span className="arc-mono">
              {selected.length === 0 ? "CONTINUE" : `CONTINUE · ${selected.length} ASSET${selected.length === 1 ? "" : "S"}`}
            </span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

function AssetTile({
  asset,
  count,
  selected,
  onToggle,
}: {
  asset: AssetDTO
  count: number
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-[76px] items-center gap-3.5 rounded-[6px] border px-4 py-3.5 text-left transition-all duration-200",
        selected
          ? "border-arc-green/55 bg-arc-green/[0.07]"
          : "border-white/[0.08] bg-arc-surface/40 hover:border-white/25 hover:bg-arc-surface"
      )}
    >
      {/* Left accent appears when selected */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-r-full bg-arc-green transition-opacity duration-200",
          selected ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200",
          !selected && "group-hover:scale-105"
        )}
      >
        <ArcAssetIcon
          symbol={asset.symbol}
          category={asset.category}
          iconUrl={asset.iconUrl}
          size={34}
          className={selected ? "ring-2 ring-arc-green" : undefined}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-arc-text">
          {asset.symbol}
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-arc-dim">
          {asset.name}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1.5">
        <span className={cn("arc-mono text-[10px]", count > 0 ? "text-arc-muted" : "text-arc-dim/60")}>
          {count} REC
        </span>
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-full border transition-all duration-200",
            selected
              ? "border-arc-green bg-arc-green"
              : "border-white/20 opacity-0 group-hover:opacity-100"
          )}
        >
          {selected && <Check className="size-3 text-black" aria-hidden />}
        </span>
      </span>
    </button>
  )
}
