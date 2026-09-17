"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, LayoutGrid, Rows3, Search, X } from "lucide-react"
import { Command as CommandPrimitive } from "cmdk"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAssets, useNetworks, useProtocols, useStrategies } from "@/hooks/use-strategy-data"
import { strategyMatchesSearch } from "@/lib/matching"
import { OBJECTIVES, objectivesForStrategy } from "@/lib/strategyObjectives"
import { SECONDARY_REGIME_REGISTRY } from "@/lib/secondary-regimes"
import { formatMonthYear } from "@/lib/format"
import type { Regime } from "@/lib/types"
import { ArchiveError, ArchiveSkeleton } from "@/components/archive/archive-bits"
import { RecordCard } from "@/components/archive/record-card"
import { RecordIndex } from "@/components/archive/record-index"
import { cn } from "@/lib/utils"

/**
 * BROWSE ALL RECORDS — the advanced finding aid. Filters live in the URL
 * (?q=&market=&condition=&asset=&objective=&risk=&protocol=&network=&layout=),
 * so any filtered view is shareable. GRID shows catalogue cards; INDEX shows
 * the archival table. `condition` is the advanced Level-2 market-conditions
 * facet — deliberately below the primary MARKET filter, which stays the
 * default way to slice the collection.
 */

interface FilterOption {
  value: string
  label: string
  count?: number
  detail?: string
}

function parseList(value: string | null): string[] {
  if (!value) return []
  return value.split(",").map((s) => s.trim()).filter(Boolean)
}

export function BrowseAllView() {
  const router = useRouter()
  const params = useSearchParams()

  const { data: strategies = [], isLoading, isError, refetch } = useStrategies()
  const { data: assets = [] } = useAssets()
  const { data: protocols = [] } = useProtocols()
  const { data: networks = [] } = useNetworks()

  // --- Filter state mirrors the URL ------------------------------------------
  const q = params.get("q") ?? ""
  const markets = parseList(params.get("market"))
  const conditions = parseList(params.get("condition"))
  const assetIds = parseList(params.get("asset"))
  const objectives = parseList(params.get("objective"))
  const risks = parseList(params.get("risk"))
  const protocolIds = parseList(params.get("protocol"))
  const networkIds = parseList(params.get("network"))
  const layout = params.get("layout") === "index" ? "index" : "grid"

  const [searchDraft, setSearchDraft] = useState(q)

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value === null || value === "") next.delete(key)
    else next.set(key, value)
    const queryString = next.toString()
    router.replace(queryString ? `/?${queryString}` : "/?view=all", { scroll: false })
  }

  const toggleListParam = (key: string, value: string) => {
    const list = parseList(params.get(key))
    const next = list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value]
    updateParam(key, next.length ? next.join(",") : null)
  }

  const clearAll = () => {
    router.replace("/?view=all", { scroll: false })
    setSearchDraft("")
  }

  // Keep the input in sync when the URL changes out from under it (back button).
  useEffect(() => {
    setSearchDraft(q)
  }, [q])

  // Debounce the search input into the URL.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== q) updateParam("q", searchDraft.trim() || null)
    }, 250)
    return () => clearTimeout(handle)
     
  }, [searchDraft])

  // --- Filtering (client-side over the full published collection) ------------
  const filtered = useMemo(() => {
    return strategies.filter((strategy) => {
      if (!strategyMatchesSearch(strategy, q)) return false
      if (markets.length > 0) {
        const regime = strategy.marketFit?.regimes ?? []
        if (!markets.some((m) => regime.includes(m.toUpperCase() as Regime))) return false
      }
      if (conditions.length > 0) {
        const secondary = strategy.marketFit?.secondaryRegimes ?? []
        if (!conditions.some((c) => secondary.includes(c as never))) return false
      }
      if (assetIds.length > 0) {
        const supported = new Set([
          ...strategy.depositAssets.map((a) => a.id),
          ...strategy.exposureAssets.map((a) => a.id),
          ...strategy.rewardAssets.map((a) => a.id),
        ])
        if (!assetIds.some((id) => supported.has(id))) return false
      }
      if (objectives.length > 0) {
        const keys = objectivesForStrategy(strategy)
        if (!objectives.some((objective) => keys.includes(objective as never))) return false
      }
      if (risks.length > 0 && !risks.includes(strategy.risk?.overallRisk ?? "")) return false
      if (protocolIds.length > 0) {
        const ids = new Set(strategy.protocols.map((p) => p.id))
        if (!protocolIds.some((id) => ids.has(id))) return false
      }
      if (networkIds.length > 0) {
        const ids = new Set(strategy.networks.map((n) => n.id))
        if (!networkIds.some((id) => ids.has(id))) return false
      }
      return true
    })
  }, [strategies, q, markets, conditions, assetIds, objectives, risks, protocolIds, networkIds])

  // --- Facet counts (over the search-filtered set, like a finding aid) -------
  const facetBase = useMemo(
    () => strategies.filter((s) => strategyMatchesSearch(s, q)),
    [strategies, q]
  )

  const marketOptions: FilterOption[] = [
    { value: "bull", label: "Bull" },
    { value: "sideways", label: "Sideways" },
    { value: "bear", label: "Bear" },
  ].map((option) => ({
    ...option,
    count: facetBase.filter((s) => s.marketFit?.regimes?.includes(option.value.toUpperCase() as Regime)).length,
  }))

  // Advanced market phases (Level-2) — below the primary facet.
  const conditionOptions: FilterOption[] = SECONDARY_REGIME_REGISTRY.map((def) => ({
    value: def.value,
    label: def.label,
    detail: def.parent ? `inside ${def.parent.toLowerCase()}` : def.transition,
    count: facetBase.filter((s) => (s.marketFit?.secondaryRegimes ?? []).includes(def.value)).length,
  }))

  const assetOptions: FilterOption[] = assets
    .filter((a) => a.active)
    .map((a) => ({
      value: a.id,
      label: a.symbol,
      detail: a.name,
      count: facetBase.filter((s) =>
        [...s.depositAssets, ...s.exposureAssets, ...s.rewardAssets].some((x) => x.id === a.id)
      ).length,
    }))

  const objectiveOptions: FilterOption[] = OBJECTIVES.map((objective) => ({
    value: objective.key,
    label: objective.label,
    count: facetBase.filter((s) => objectivesForStrategy(s).includes(objective.key)).length,
  }))

  const riskOptions: FilterOption[] = ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"].map((risk) => ({
    value: risk,
    label: risk.replace("_", " "),
    count: facetBase.filter((s) => s.risk?.overallRisk === risk).length,
  }))

  const protocolOptions: FilterOption[] = protocols
    .filter((p) => p.active)
    .map((p) => ({
      value: p.id,
      label: p.name,
      count: facetBase.filter((s) => s.protocols.some((x) => x.id === p.id)).length,
    }))

  const networkOptions: FilterOption[] = networks
    .filter((n) => n.active)
    .map((n) => ({
      value: n.id,
      label: n.name,
      count: facetBase.filter((s) => s.networks.some((x) => x.id === n.id)).length,
    }))

  const activeChips: { key: string; value: string; label: string }[] = [
    ...markets.map((m) => ({ key: "market", value: m, label: m.toUpperCase() })),
    ...conditions.map((c) => ({
      key: "condition",
      value: c,
      label: SECONDARY_REGIME_REGISTRY.find((d) => d.value === c)?.label ?? c,
    })),
    ...assetIds.map((id) => ({
      key: "asset",
      value: id,
      label: assets.find((a) => a.id === id)?.symbol ?? id,
    })),
    ...objectives.map((o) => ({
      key: "objective",
      value: o,
      label: OBJECTIVES.find((x) => x.key === o)?.label ?? o,
    })),
    ...risks.map((r) => ({ key: "risk", value: r, label: r.replace("_", " ") })),
    ...protocolIds.map((id) => ({
      key: "protocol",
      value: id,
      label: protocols.find((p) => p.id === id)?.name ?? id,
    })),
    ...networkIds.map((id) => ({
      key: "network",
      value: id,
      label: networks.find((n) => n.id === id)?.name ?? id,
    })),
  ]

  const lastReviewed = strategies
    .map((s) => s.lastReviewedAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1)

  if (isError) {
    return (
      <div className="mx-auto max-w-[1380px] px-4 py-16 sm:px-8">
        <ArchiveError onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
      {/* Finding-aid header */}
      <header className="border-b border-white/10 py-10 sm:py-12">
        <p className="arc-mono text-arc-green">ALL RECORDS</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-sans text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.01em] text-arc-text">
            The complete collection<span className="text-arc-green">.</span>
          </h1>
          <p className="arc-mono text-arc-dim">
            {isLoading ? "RETRIEVING…" : `${filtered.length} OF ${strategies.length} RECORDS`}
            {lastReviewed && ` · REVIEWED ${formatMonthYear(lastReviewed).toUpperCase()}`}
          </p>
        </div>
      </header>

      {/* Search + layout toggle */}
      <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center">
        <div className="flex h-12 flex-1 items-center gap-3.5 rounded-[6px] border border-white/10 bg-arc-surface px-4 transition-colors focus-within:border-white/30">
          <Search className="size-4 shrink-0 text-arc-muted" aria-hidden />
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search the Archive… name, asset, protocol, network, type"
            aria-label="Search the Archive"
            className="h-full w-full bg-transparent text-[14px] text-arc-text outline-none placeholder:text-arc-dim"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("")
                updateParam("q", null)
              }}
              className="arc-mono shrink-0 text-arc-dim transition-colors hover:text-arc-red"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex h-12 items-center rounded-[6px] border border-white/10 bg-arc-surface p-1" role="group" aria-label="Layout">
          <button
            type="button"
            onClick={() => updateParam("layout", null)}
            className={cn(
              "flex h-full items-center gap-2 px-4 transition-colors",
              layout === "grid" ? "bg-arc-raised text-arc-text" : "text-arc-muted hover:text-arc-text"
            )}
            aria-pressed={layout === "grid"}
          >
            <LayoutGrid className="size-4" aria-hidden />
            <span className="arc-mono">GRID</span>
          </button>
          <button
            type="button"
            onClick={() => updateParam("layout", "index")}
            className={cn(
              "flex h-full items-center gap-2 px-4 transition-colors",
              layout === "index" ? "bg-arc-raised text-arc-text" : "text-arc-muted hover:text-arc-text"
            )}
            aria-pressed={layout === "index"}
          >
            <Rows3 className="size-4" aria-hidden />
            <span className="arc-mono">INDEX</span>
          </button>
        </div>
      </div>

      {/* Compact filter controls */}
      <div className="arc-scroll flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-6">
        <FilterMenu label="MARKET" options={marketOptions} selected={markets} onToggle={(v) => toggleListParam("market", v)} />
        <FilterMenu label="MARKET PHASE" options={conditionOptions} selected={conditions} onToggle={(v) => toggleListParam("condition", v)} searchable />
        <FilterMenu label="ASSET" options={assetOptions} selected={assetIds} onToggle={(v) => toggleListParam("asset", v)} searchable />
        <FilterMenu label="OBJECTIVE" options={objectiveOptions} selected={objectives} onToggle={(v) => toggleListParam("objective", v)} />
        <FilterMenu label="RISK" options={riskOptions} selected={risks} onToggle={(v) => toggleListParam("risk", v)} />
        <FilterMenu label="PROTOCOL" options={protocolOptions} selected={protocolIds} onToggle={(v) => toggleListParam("protocol", v)} searchable />
        <FilterMenu label="NETWORK" options={networkOptions} selected={networkIds} onToggle={(v) => toggleListParam("network", v)} />

        {activeChips.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="arc-mono ml-auto shrink-0 px-3 py-2 text-arc-muted transition-colors hover:text-arc-red"
          >
            CLEAR ALL ({activeChips.length})
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-5">
          {activeChips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() => toggleListParam(chip.key, chip.value)}
              className="arc-mono group flex items-center gap-2 rounded-full border border-white/15 bg-arc-surface px-3.5 py-1.5 text-arc-text transition-colors hover:border-arc-red/50"
            >
              {chip.label.toUpperCase()}
              <X className="size-3 text-arc-muted transition-colors group-hover:text-arc-red" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {/* Records */}
      <div className="py-10">
        {isLoading ? (
          <ArchiveSkeleton rows={3} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center border border-dashed border-white/15 bg-arc-surface/40 px-6 py-20 text-center">
            <p className="arc-mono text-arc-muted">0 RECORDS RETRIEVED</p>
            <p className="mt-3 max-w-md text-[14px] text-arc-muted">
              No records match the current filters. Adjust the selection or clear it to
              see the whole collection.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="arc-mono mt-8 flex h-11 items-center rounded-[4px] bg-arc-green px-6 text-black transition-colors hover:bg-[#2ad695]"
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : layout === "index" ? (
          <RecordIndex strategies={filtered} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((strategy) => (
              <RecordCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Compact archive filter dropdown — a catalogue constraint menu, not a
 * sidebar. Searchable variants use cmdk for keyboard retrieval.
 */
function FilterMenu({
  label,
  options,
  selected,
  onToggle,
  searchable = false,
}: {
  label: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  searchable?: boolean
}) {
  const [term, setTerm] = useState("")
  const visible = term.trim()
    ? options.filter((option) =>
        `${option.label} ${option.detail ?? ""}`.toLowerCase().includes(term.trim().toLowerCase())
      )
    : options

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "arc-mono flex h-10 shrink-0 items-center gap-2 rounded-[5px] border px-3.5 transition-colors",
          selected.length > 0
            ? "border-arc-green/40 bg-arc-green/[0.06] text-arc-text"
            : "border-white/10 bg-arc-surface text-arc-muted hover:border-white/30 hover:text-arc-text",
          "data-[state=open]:border-white/40 data-[state=open]:text-arc-text"
        )}
      >
        {label}
        {selected.length > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-arc-green text-[9px] font-bold text-black">
            {selected.length}
          </span>
        )}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 rounded-[6px] border-white/15 bg-arc-raised p-0 text-arc-text shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]"
      >
        {searchable && (
          <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2.5">
            <Search className="size-3.5 text-arc-muted" aria-hidden />
            <input
              type="text"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Filter…"
              className="h-6 w-full bg-transparent text-[13px] text-arc-text outline-none placeholder:text-arc-dim"
            />
          </div>
        )}
        <CommandPrimitive shouldFilter={false} className="flex flex-col">
          <CommandPrimitive.List
            data-lenis-prevent
            className="arc-scroll max-h-64 overflow-y-auto p-1.5"
          >
            {visible.length === 0 && (
              <CommandPrimitive.Empty className="px-3 py-4 text-[12px] text-arc-dim">
                No matches in this facet.
              </CommandPrimitive.Empty>
            )}
            {visible.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.value}
                  onSelect={() => onToggle(option.value)}
                  className="flex cursor-pointer items-center gap-3 px-2.5 py-2 text-[13px] text-arc-muted outline-none data-[selected=true]:bg-arc-surface/70 data-[selected=true]:text-arc-text"
                >
                  <span
                    className={cn(
                      "flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected ? "border-arc-green bg-arc-green" : "border-white/25"
                    )}
                  >
                    {isSelected && <Check className="size-3 text-black" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-arc-text">{option.label}</span>
                  {typeof option.count === "number" && (
                    <span className="font-mono text-[10px] tabular-nums text-arc-dim">
                      {option.count}
                    </span>
                  )}
                </CommandPrimitive.Item>
              )
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  )
}
