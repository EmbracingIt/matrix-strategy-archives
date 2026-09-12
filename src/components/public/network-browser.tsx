"use client"

import { useRouter } from "next/navigation"
import { useNetworks } from "@/hooks/use-strategy-data"
import { ArcNetworkIcon } from "@/components/archive/archive-icons"
import { ArchiveSkeleton } from "@/components/archive/archive-bits"

/**
 * NETWORKS — the network registry of the archive. Selecting an entry
 * retrieves every record deployed on that chain.
 */
export function NetworkBrowser() {
  const router = useRouter()
  const { data: networks = [], isLoading } = useNetworks()
  const list = networks.filter((n) => n.active)

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
      <header className="border-b border-white/10 py-10 sm:py-12">
        <p className="arc-mono text-arc-green">NETWORK REGISTRY</p>
        <h1 className="mt-4 font-serif text-[clamp(2.1rem,4.5vw,3.4rem)] font-light leading-[1.04] tracking-[-0.01em] text-arc-text">
          Networks<span className="text-arc-green">.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-arc-muted">
          The chains the archive operates across. Select an entry to retrieve the
          records deployed on it.
        </p>
        <p className="arc-mono mt-6 text-arc-dim">{list.length} NETWORKS INDEXED</p>
      </header>

      <div className="py-10">
        {isLoading ? (
          <ArchiveSkeleton rows={2} />
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-arc-muted">No networks indexed yet.</p>
        ) : (
          <div className="border-t border-white/10">
            {list.map((network) => (
              <button
                key={network.id}
                type="button"
                onClick={() => router.push(`/?view=all&network=${network.id}`)}
                className="group relative flex w-full items-center gap-5 border-b border-white/10 px-2 py-6 text-left transition-colors duration-200 hover:bg-arc-surface sm:gap-10 sm:px-6"
              >
                <span
                  className="absolute left-0 top-1/2 h-9 w-[2px] -translate-y-1/2 rounded-r-full bg-arc-green/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  aria-hidden
                />
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105">
                  <ArcNetworkIcon name={network.name} iconUrl={network.iconUrl} size={32} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold tracking-tight text-arc-text">
                    {network.name}
                  </span>
                  <span className="arc-mono mt-1 block text-[9px] text-arc-dim">
                    {network.slug.toUpperCase()}
                    {network.chainId != null && ` · CHAIN ${network.chainId}`}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-8">
                  <span className="arc-mono text-arc-muted">
                    {network.strategyCount ?? 0} RECORD{(network.strategyCount ?? 0) === 1 ? "" : "S"}
                  </span>
                  <span className="arc-mono hidden text-arc-dim transition-colors group-hover:text-arc-green sm:block">
                    RETRIEVE →
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
