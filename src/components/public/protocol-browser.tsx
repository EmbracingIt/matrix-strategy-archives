"use client"

import { useRouter } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { useProtocols } from "@/hooks/use-strategy-data"
import { ArcProtocolIcon } from "@/components/archive/archive-icons"
import { ArchiveSkeleton } from "@/components/archive/archive-bits"
import { urls } from "@/lib/nav"

/**
 * PROTOCOLS — the protocol registry of the archive. Selecting an entry
 * retrieves every record that references it (deep link into Browse All).
 */
export function ProtocolBrowser() {
  const router = useRouter()
  const { data: protocols = [], isLoading } = useProtocols()
  const list = protocols.filter((p) => p.active)

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
      <header className="border-b border-white/10 py-10 sm:py-12">
        <p className="arc-mono text-arc-green">PROTOCOL REGISTRY</p>
        <h1 className="mt-4 font-serif text-[clamp(2.1rem,4.5vw,3.4rem)] font-light leading-[1.04] tracking-[-0.01em] text-arc-text">
          Protocols<span className="text-arc-green">.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-arc-muted">
          The DeFi protocols referenced across the archive. Select an entry to retrieve
          the records built on it.
        </p>
        <p className="arc-mono mt-6 text-arc-dim">{list.length} PROTOCOLS INDEXED</p>
      </header>

      <div className="py-10">
        {isLoading ? (
          <ArchiveSkeleton rows={3} />
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-arc-muted">No protocols indexed yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((protocol) => (
              <button
                key={protocol.id}
                type="button"
                onClick={() => router.push(`/?view=all&protocol=${protocol.id}`)}
                className="group relative flex flex-col overflow-hidden rounded-[6px] border border-white/[0.08] bg-arc-surface/50 p-5 text-left transition-all duration-200 hover:border-white/25 hover:bg-arc-surface sm:p-6"
              >
                <span
                  className="absolute left-0 top-1/2 h-10 w-[2px] -translate-y-1/2 rounded-r-full bg-arc-green/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  aria-hidden
                />
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105">
                    <ArcProtocolIcon name={protocol.name} iconUrl={protocol.iconUrl} size={36} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[16px] font-semibold tracking-tight text-arc-text">
                      {protocol.name}
                    </h3>
                    <p className="arc-mono mt-1 text-[9px] text-arc-dim">
                      {protocol.slug.toUpperCase()}
                    </p>
                  </div>
                  {protocol.website && (
                    <a
                      href={protocol.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="flex size-8 items-center justify-center rounded-full border border-white/10 text-arc-dim transition-colors hover:border-arc-green/50 hover:text-arc-green"
                      aria-label={`${protocol.name} website`}
                    >
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </a>
                  )}
                </div>

                {protocol.description && (
                  <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-arc-muted">
                    {protocol.description}
                  </p>
                )}

                <div className="arc-mono mt-auto flex items-center gap-1.5 border-t border-white/[0.07] pt-4 text-arc-muted">
                  <span className="tabular-nums text-arc-text">{protocol.strategyCount ?? 0}</span>
                  RECORD{(protocol.strategyCount ?? 0) === 1 ? "" : "S"}
                  <span className="ml-auto text-arc-dim transition-colors group-hover:text-arc-green">
                    RETRIEVE →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
