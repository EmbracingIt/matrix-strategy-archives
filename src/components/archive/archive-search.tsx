"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { ArrowRight, FileText, Search } from "lucide-react"
import { useStrategies } from "@/hooks/use-strategy-data"
import { strategyMatchesSearch } from "@/lib/matching"
import { urls } from "@/lib/nav"
import { useArchiveUI } from "@/store/ui-store"
import { cn } from "@/lib/utils"

/**
 * Global Archive search overlay (⌘K / "/"). A research-terminal catalogue
 * lookup across record name, description, type, assets, protocols and
 * networks — driven by the same published-strategies API as every view.
 */
export function ArchiveSearch() {
  const open = useArchiveUI((s) => s.searchOpen)
  const closeSearch = useArchiveUI((s) => s.closeSearch)
  const router = useRouter()
  const [term, setTerm] = useState("")

  const { data: strategies = [], isLoading } = useStrategies()

  const results = useMemo(() => {
    if (!strategies.length) return []
    const matched = strategies.filter((s) => strategyMatchesSearch(s, term))
    return [...matched].sort((a, b) => a.strategyId.localeCompare(b.strategyId))
  }, [strategies, term])

  const openRecord = (slug: string) => {
    closeSearch()
    router.push(urls.strategy(slug))
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setTerm("")
          closeSearch()
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[2px] duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[16vh] z-50 w-[calc(100vw-2rem)] max-w-[660px] -translate-x-1/2 border border-white/12 bg-arc-surface shadow-[0_32px_80px_-24px_rgba(0,0,0,0.8)] duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">Search the Archive</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search strategy records by name, description, asset, protocol, network or type.
          </DialogPrimitive.Description>

          <CommandPrimitive shouldFilter={false} loop className="flex flex-col">
            {/* Search input */}
            <div className="flex items-center gap-4 border-b border-white/10 px-5 py-4">
              <Search className="size-4 shrink-0 text-arc-muted" aria-hidden />
              <CommandPrimitive.Input
                autoFocus
                value={term}
                onValueChange={setTerm}
                placeholder="Search the Archive…"
                className="h-7 w-full bg-transparent text-[15px] text-arc-text outline-none placeholder:text-arc-dim"
              />
              <DialogPrimitive.Close className="arc-mono shrink-0 border border-white/15 px-1.5 py-0.5 text-[10px] text-arc-dim transition-colors hover:text-arc-text">
                ESC
              </DialogPrimitive.Close>
            </div>

            {/* Results — data-lenis-prevent keeps the smooth-scroll layer from
                scrolling the page behind the dialog while this list scrolls. */}
            <CommandPrimitive.List
              data-lenis-prevent
              className="arc-scroll max-h-[52vh] overflow-y-auto px-2 py-2"
            >
              {isLoading && (
                <div className="space-y-2 p-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 animate-pulse bg-white/5" />
                  ))}
                </div>
              )}

              {!isLoading && term.trim().length > 0 && results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="arc-mono text-arc-muted">NO RECORDS FOUND</p>
                  <p className="mt-2 text-[13px] text-arc-dim">
                    The Archive contains no records matching “{term.trim()}”.
                  </p>
                </div>
              )}

              {!isLoading && term.trim().length === 0 && (
                <div className="px-4 pb-2 pt-3">
                  <p className="arc-mono mb-3 text-arc-dim">RETRIEVAL INDEX — {strategies.length} RECORDS</p>
                  <p className="text-[13px] leading-relaxed text-arc-muted">
                    Search across record names, descriptions, assets, protocols, networks and
                    strategy types.
                  </p>
                </div>
              )}

              {results.map((strategy) => (
                <CommandPrimitive.Item
                  key={strategy.id}
                  value={strategy.slug}
                  onSelect={() => openRecord(strategy.slug)}
                  className="group flex cursor-pointer items-center gap-4 border border-transparent px-3 py-3 outline-none data-[selected=true]:border-white/10 data-[selected=true]:bg-arc-raised"
                >
                  <span className="arc-mono w-24 shrink-0 text-arc-dim">
                    {strategy.strategyId.replace("STRATEGY_", "REC_")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-arc-text">
                      {strategy.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-arc-muted">
                      {strategy.type} ·{" "}
                      {[...new Set([...strategy.depositAssets, ...strategy.exposureAssets].map((a) => a.symbol))].join(" / ")}{" "}
                      · {strategy.protocols.map((p) => p.name).join(", ")}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-arc-dim opacity-0 transition-opacity data-[selected=true]:opacity-100 group-data-[selected=true]:text-arc-green"
                    aria-hidden
                  />
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.List>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
              <div className="arc-mono flex items-center gap-4 text-arc-dim">
                <span className="flex items-center gap-1.5">
                  <FileText className="size-3" aria-hidden /> {results.length} FOUND
                </span>
                <span className="hidden sm:inline">↑↓ NAVIGATE</span>
                <span className="hidden sm:inline">↵ OPEN RECORD</span>
              </div>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  onClick={() => {
                    closeSearch()
                    router.push(urls.allRecords())
                  }}
                  className={cn("arc-mono text-arc-muted transition-colors hover:text-arc-green")}
                >
                  BROWSE ALL RECORDS →
                </button>
              </DialogPrimitive.Close>
            </div>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
