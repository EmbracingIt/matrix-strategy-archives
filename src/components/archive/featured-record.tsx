"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { urls } from "@/lib/nav"
import { objectiveLabels } from "@/lib/strategyObjectives"
import { ArcAssetIcon, ArcIconStack, ArcNetworkIcon, ArcProtocolIcon } from "@/components/archive/archive-icons"
import { WhyItMatches } from "@/components/archive/archive-match"
import { cn } from "@/lib/utils"
import type { MatchedRecord } from "@/lib/matching"

/**
 * BEST MATCH — the strongest retrieval rendered as a dominant catalogue
 * abstract. Editorial rather than boxy: the record identity breathes on the
 * left (large serif title, circular composition marks, no internal borders),
 * while the compatibility score and its factor provenance sit in a quieter
 * right column separated by a single hairline instead of a bolted-on panel.
 */

const REGIME_ARROWS: Record<string, string> = { BULL: "↗", SIDEWAYS: "→", BEAR: "↘" }
const REGIME_TEXT: Record<string, string> = {
  BULL: "text-arc-green",
  SIDEWAYS: "text-arc-amber",
  BEAR: "text-arc-red",
}

export function FeaturedRecord({ record }: { record: MatchedRecord }) {
  const strategy = record.strategy
  const assets = [
    ...new Map(
      [...strategy.depositAssets, ...strategy.exposureAssets].map((a) => [a.symbol, a])
    ).values(),
  ]

  return (
    <article className="relative rounded-[6px] border border-arc-green/25 bg-arc-surface">
      {/* Best match label */}
      <div className="flex items-center justify-between gap-3 px-6 pt-5 sm:px-9 sm:pt-6">
        <span className="arc-mono flex items-center gap-2.5 text-arc-green">
          <span className="size-1.5 rounded-full bg-arc-green" aria-hidden />
          BEST MATCH
        </span>
        <span className="arc-mono text-arc-dim">{strategy.strategyId}</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        {/* Identity — editorial, let it breathe */}
        <div className="px-6 pb-8 pt-6 sm:px-9 sm:pb-10">
          <h3 className="max-w-2xl font-serif text-[clamp(1.8rem,3.2vw,2.7rem)] font-light leading-[1.04] tracking-[-0.015em] text-arc-text">
            {strategy.name}
          </h3>

          <p className="arc-mono mt-3.5 text-[10px] text-arc-dim">
            {(objectiveLabels(strategy).join(" / ") || strategy.type).toUpperCase()}
          </p>

          {/* Composition — circular marks, separated by hairlines not boxes */}
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
            {assets.length > 0 && (
              <span className="flex items-center gap-3">
                <ArcIconStack ringClass="ring-arc-surface" className="mr-0.5">
                  {assets.slice(0, 4).map((asset) => (
                    <ArcAssetIcon
                      key={asset.id}
                      symbol={asset.symbol}
                      category={asset.category}
                      iconUrl={asset.iconUrl}
                      size={26}
                    />
                  ))}
                </ArcIconStack>
                <span className="text-[13.5px] font-medium text-arc-text">
                  {assets.map((a) => a.symbol).join(" / ")}
                </span>
              </span>
            )}
            {strategy.protocols.length > 0 && (
              <span className="flex items-center gap-2.5 text-[13.5px] text-arc-muted">
                <ArcProtocolIcon
                  name={strategy.protocols[0]?.name ?? ""}
                  iconUrl={strategy.protocols[0]?.iconUrl}
                  size={22}
                />
                {strategy.protocols.map((p) => p.name).join(", ")}
              </span>
            )}
            {strategy.networks.length > 0 && (
              <span className="flex items-center gap-2.5 text-[13.5px] text-arc-muted">
                <ArcNetworkIcon
                  name={strategy.networks[0]?.name ?? ""}
                  iconUrl={strategy.networks[0]?.iconUrl}
                  size={22}
                />
                {strategy.networks.map((n) => n.name).join(", ")}
              </span>
            )}
          </div>

          <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-arc-muted">
            {strategy.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2.5">
            {strategy.marketFit?.regimes?.map((regime) => (
              <span
                key={regime}
                className={cn("arc-mono text-[11px]", REGIME_TEXT[regime] ?? "text-arc-muted")}
              >
                {REGIME_ARROWS[regime]} {regime}
              </span>
            ))}
            <span className="arc-mono text-[11px] text-arc-muted">
              {strategy.risk?.overallRisk?.replace("_", " ")} RISK
            </span>
            {strategy.latestObservation && (
              <span className="arc-mono text-[11px] text-arc-green">
                APY {strategy.latestObservation.apy.toFixed(1)}%
              </span>
            )}
          </div>

          <Link
            href={urls.strategy(strategy.slug)}
            className="group mt-8 inline-flex h-12 items-center gap-3 rounded-[4px] bg-arc-green px-7 text-black transition-colors duration-200 hover:bg-[#2ad695]"
          >
            <span className="arc-mono">OPEN RECORD</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        {/* Score provenance — integrated, single hairline separation */}
        <div className="rounded-br-[6px] bg-arc-raised/50 px-6 py-7 sm:px-7 lg:border-l lg:border-white/[0.07]">
          <p className="arc-mono text-arc-dim">ARCHIVE MATCH</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-mono text-[52px] font-medium leading-none tabular-nums tracking-tight",
                record.score >= 75 ? "text-arc-green" : "text-arc-text"
              )}
            >
              {record.score}
            </span>
            <span className="font-mono text-[18px] text-arc-muted">%</span>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
            <span
              className={cn("block h-full rounded-full", record.score >= 50 ? "bg-arc-green" : "bg-arc-amber")}
              style={{ width: `${record.score}%` }}
            />
          </div>

          <div className="mt-7 space-y-3.5">
            {record.factors.map((factor) => (
              <div key={factor.label}>
                <div className="flex items-center justify-between gap-3">
                  <span className="arc-mono text-[10px] text-arc-muted">{factor.label.toUpperCase()}</span>
                  <span className="font-mono text-[11px] tabular-nums text-arc-text/80">
                    {factor.score}
                  </span>
                </div>
                <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
                  <span
                    className={cn(
                      "block h-full rounded-full transition-all duration-500",
                      factor.score >= 60 ? "bg-arc-green" : "bg-arc-amber"
                    )}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <WhyItMatches record={record} className="mt-7 border-t border-white/[0.07] pt-5" />
        </div>
      </div>
    </article>
  )
}
