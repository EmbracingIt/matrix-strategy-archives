"use client"

import { useRouter } from "next/navigation"
import { useAssets } from "@/hooks/use-strategy-data"
import { ArcAssetIcon } from "@/components/archive/archive-icons"
import { ArchiveSkeleton } from "@/components/archive/archive-bits"
import { ASSET_CATEGORIES } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * ASSETS — the asset registry of the archive, grouped by family. Selecting
 * an entry retrieves every record that deposits, exposes or rewards it.
 */

const GROUPS = ASSET_CATEGORIES

export function AssetBrowser() {
  const router = useRouter()
  const { data: assets = [], isLoading } = useAssets()
  const list = assets.filter((a) => a.active)

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
      <header className="border-b border-white/10 py-10 sm:py-12">
        <p className="arc-mono text-arc-green">ASSET REGISTRY</p>
        <h1 className="mt-4 font-sans text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.01em] text-arc-text">
          Assets<span className="text-arc-green">.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-arc-muted">
          The assets referenced across the archive — deposits, exposures and reward
          tokens. Select an entry to retrieve the records built around it.
        </p>
        <p className="arc-mono mt-6 text-arc-dim">{list.length} ASSETS INDEXED</p>
      </header>

      <div className="space-y-10 py-10">
        {isLoading && <ArchiveSkeleton rows={2} />}
        {GROUPS.map((group) => {
          const groupAssets = list.filter((a) => (a.category ?? "other") === group.value)
          if (groupAssets.length === 0) return null
          return (
            <section key={group.value} aria-label={group.label}>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="arc-mono text-arc-muted">{group.label.toUpperCase()}</h2>
                <span className="h-px flex-1 bg-white/10" aria-hidden />
                <span className="arc-mono text-arc-dim">{groupAssets.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {groupAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => router.push(`/?view=all&asset=${asset.id}`)}
                    className={cn(
                      "group relative flex items-center gap-3.5 overflow-hidden rounded-[6px] border border-white/[0.08] bg-arc-surface/50 px-4 py-4 text-left transition-all duration-200",
                      "hover:border-white/25 hover:bg-arc-surface"
                    )}
                  >
                    <span
                      className="absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-r-full bg-arc-green/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      aria-hidden
                    />
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105">
                      <ArcAssetIcon
                        symbol={asset.symbol}
                        category={asset.category}
                        iconUrl={asset.iconUrl}
                        size={32}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-arc-text">
                        {asset.symbol}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-arc-dim">
                        {asset.name}
                      </span>
                    </span>
                    <span className="flex flex-col items-end">
                      <span className={cn("arc-mono", (asset.strategyCount ?? 0) > 0 ? "text-arc-muted" : "text-arc-dim/60")}>
                        {asset.strategyCount ?? 0} REC
                      </span>
                      <span className="arc-mono mt-1 text-[9px] text-arc-dim transition-colors group-hover:text-arc-green">
                        RETRIEVE →
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )
        })}
        {!isLoading && list.length === 0 && (
          <p className="py-16 text-center text-[14px] text-arc-muted">No assets indexed yet.</p>
        )}
      </div>
    </div>
  )
}
