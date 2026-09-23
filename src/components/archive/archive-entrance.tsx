"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useMeta, useStrategies } from "@/hooks/use-strategy-data"
import { urls } from "@/lib/nav"
import { formatMonthYear } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * PAGE 1 — ARCHIVE ENTRANCE.
 *
 * The front door of the digital library: near-full-viewport catalogue
 * cover with the collection spines (Bull / Sideways / Bear) standing to the
 * right like the wings of the archive. Nothing is dumped on the user —
 * they choose how to enter.
 */

const COLLECTIONS = [
  { market: "bull", collection: "01", label: "BULL", accent: "bg-arc-green", text: "text-arc-green" },
  { market: "sideways", collection: "02", label: "SIDEWAYS", accent: "bg-arc-amber", text: "text-arc-amber" },
  { market: "bear", collection: "03", label: "BEAR", accent: "bg-arc-red", text: "text-arc-red" },
] as const

export function ArchiveEntrance() {
  const { data: meta } = useMeta()
  const { data: strategies = [] } = useStrategies()

  const regimeCounts = {
    bull: strategies.filter((s) => s.marketFit?.regimes?.includes("BULL")).length,
    sideways: strategies.filter((s) => s.marketFit?.regimes?.includes("SIDEWAYS")).length,
    bear: strategies.filter((s) => s.marketFit?.regimes?.includes("BEAR")).length,
  }
  const lastReviewed = strategies
    .map((s) => s.lastReviewedAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1)

  const stats = [
    { label: "RECORDS", value: String(meta?.counts.published ?? strategies.length) },
    { label: "ASSETS", value: String(meta?.counts.assets ?? "—") },
    { label: "PROTOCOLS", value: String(meta?.counts.protocols ?? "—") },
    { label: "NETWORKS", value: String(meta?.counts.networks ?? "—") },
  ]

  return (
    <section className="relative overflow-hidden" aria-label="Archive entrance">
      {/* Catalogue grid backdrop */}
      <div className="arc-grid arc-grid-fade pointer-events-none absolute inset-0" aria-hidden />

      {/* Blueprint crosshairs */}
      <span className="pointer-events-none absolute left-[8%] top-[22%] hidden font-mono text-sm text-white/15 lg:block" aria-hidden>+</span>
      <span className="pointer-events-none absolute right-[26%] top-[14%] hidden font-mono text-sm text-white/15 lg:block" aria-hidden>+</span>
      <span className="pointer-events-none absolute bottom-[30%] left-[38%] hidden font-mono text-sm text-white/15 lg:block" aria-hidden>+</span>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] min-w-0 max-w-[1380px] flex-col px-4 sm:px-8">
        {/* Meta header row */}
        <div className="arc-rise flex items-center justify-between gap-4 border-b border-white/10 py-5">
          <span className="arc-mono text-arc-muted">ARCHIVE / 001</span>
          <span className="arc-mono hidden text-arc-dim sm:block">
            INDEXED BY MARKET · ASSET · OBJECTIVE
          </span>
          <span className="arc-mono text-arc-muted">
            {meta?.counts.published ?? "—"} RECORDS / EST. 2026
          </span>
        </div>

        {/* Cover */}
        <div className="grid min-w-0 flex-1 items-center gap-10 py-10 sm:gap-14 sm:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20 lg:py-8">
          <div className="min-w-0">
            <h1 className="font-sans font-semibold leading-[0.98] tracking-[-0.02em] text-arc-text">
              <span className="arc-rise block text-[clamp(2.5rem,14vw,7.25rem)]" style={{ animationDelay: "40ms" }}>
                Matrix
              </span>
              <span className="arc-rise block text-[clamp(2.5rem,14vw,7.25rem)]" style={{ animationDelay: "100ms" }}>
                Strategy Archives<span className="text-arc-green">.</span>
              </span>
            </h1>

            <p
              className="arc-rise mt-8 font-sans text-[clamp(1.35rem,2.4vw,1.9rem)] font-semibold italic text-arc-text/85"
              style={{ animationDelay: "170ms" }}
            >
              Knowledge compounds<span className="arc-cursor" aria-hidden />
            </p>

            <p
              className="arc-rise mt-5 max-w-xl text-[15px] leading-relaxed text-arc-muted"
              style={{ animationDelay: "220ms" }}
            >
              A structured collection of DeFi strategies organized by market conditions,
              assets, risk and objective. Walk deeper into the archive and retrieve the
              records that fit how you invest.
            </p>

            <div className="arc-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: "280ms" }}>
              <Link
                href={urls.explore({ step: "market" })}
                className="group flex h-[52px] items-center justify-center gap-3 rounded-[4px] bg-arc-green px-8 text-black transition-colors duration-200 hover:bg-[#2ad695]"
              >
                <span className="arc-mono">ENTER THE ARCHIVE</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link
                href={urls.allRecords()}
                className="arc-mono flex h-[52px] items-center justify-center rounded-[4px] border border-white/15 px-8 text-arc-text transition-colors duration-200 hover:border-white/40"
              >
                BROWSE ALL RECORDS
              </Link>
            </div>

            <p className="arc-mono arc-rise mt-6 text-arc-dim" style={{ animationDelay: "330ms" }}>
              GUIDED RETRIEVAL — MARKET → MARKET PHASE → ASSETS → OBJECTIVE
            </p>
          </div>

          {/* Collection spines — the wings of the archive */}
          <div
            className="arc-rise grid min-w-0 grid-cols-3 gap-2 lg:flex lg:w-auto lg:gap-0"
            style={{ animationDelay: "240ms" }}
            aria-label="Archive collections"
          >
            {COLLECTIONS.map((collection, index) => {
              const count =
                collection.market === "bull"
                  ? regimeCounts.bull
                  : collection.market === "sideways"
                    ? regimeCounts.sideways
                    : regimeCounts.bear
              return (
                <Link
                  key={collection.market}
                  href={urls.explore({ step: "phase", market: collection.market })}
                  className={cn(
                    "group relative flex min-w-0 flex-col items-start justify-between gap-2 rounded-[5px] border border-white/10 bg-arc-surface/70 px-3 py-3 transition-all duration-200 hover:border-white/30 hover:bg-arc-surface sm:px-5 sm:py-4",
                    "lg:h-[420px] lg:w-[120px] lg:flex-col lg:justify-between lg:gap-0 lg:px-0 lg:py-0 lg:rounded-none",
                    index > 0 && "lg:-mt-px"
                  )}
                  aria-label={`Enter the ${collection.label} collection`}
                >
                  <span className={cn("absolute left-0 top-0 hidden h-12 w-px lg:block", collection.accent)} aria-hidden />
                  <span className="arc-mono text-arc-muted lg:pt-7 lg:pl-5">{collection.collection}</span>
                  <span
                    className={cn(
                      "text-[12px] font-semibold tracking-[0.16em] text-arc-text transition-colors group-hover:text-white sm:text-[15px] sm:tracking-[0.28em]",
                      "lg:[writing-mode:vertical-rl]"
                    )}
                  >
                    {collection.label}
                  </span>
                  <span className="flex items-center gap-3 lg:w-full lg:justify-between lg:px-5 lg:pb-6">
                    <span className="arc-mono text-[9px] text-arc-muted sm:text-[10px]">{count} REC</span>
                    <span className="arc-barcode hidden h-3.5 w-8 opacity-50 lg:block" aria-hidden />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Stats strip */}
        <div className="arc-rise border-t border-white/10" style={{ animationDelay: "380ms" }}>
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label} className="border-r border-white/10 py-5 pr-4 last:border-r-0 sm:pl-6 sm:first:pl-0">
                <dt className="arc-mono text-arc-dim">{stat.label}</dt>
                <dd className="mt-1.5 font-mono text-[22px] font-medium tabular-nums text-arc-text">
                  {stat.value}
                </dd>
              </div>
            ))}
            <div className="col-span-2 py-5 sm:col-span-1 sm:pl-6">
              <dt className="arc-mono text-arc-dim">LAST REVIEWED</dt>
              <dd className="mt-1.5 font-mono text-[22px] font-medium uppercase text-arc-text">
                {lastReviewed ? formatMonthYear(lastReviewed) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
