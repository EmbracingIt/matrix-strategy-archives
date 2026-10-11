"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { urls } from "@/lib/nav"
import { objectiveLabels } from "@/lib/strategyObjectives"
import { ArcNetworkIcon, ArcProtocolIcon } from "@/components/archive/archive-icons"
import { RegimeIndicator } from "@/components/archive/regime-indicator"
import { cn } from "@/lib/utils"
import type { StrategyDTO } from "@/lib/types"

/**
 * INDEX — the archival table presentation of the collection: a finding-aid
 * listing rather than cards. Rows are records; classification is compact.
 */

const RISK_TEXT: Record<string, string> = {
  LOW: "text-arc-green",
  MEDIUM: "text-arc-amber",
  HIGH: "text-arc-red",
  VERY_HIGH: "text-arc-red",
}

export function RecordIndex({ strategies }: { strategies: StrategyDTO[] }) {
  const router = useRouter()
  return (
    <div className="arc-scroll overflow-x-auto rounded-[6px] border border-white/10" role="region" aria-label="Record index">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10 bg-arc-surface/60">
            <th className="arc-mono px-4 py-3.5 font-medium text-arc-dim">NO.</th>
            <th className="arc-mono px-4 py-3.5 font-medium text-arc-dim">RECORD</th>
            <th className="arc-mono hidden px-4 py-3.5 font-medium text-arc-dim lg:table-cell">
              CLASSIFICATION
            </th>
            <th className="arc-mono hidden px-4 py-3.5 font-medium text-arc-dim md:table-cell">PROTOCOL / CHAIN</th>
            <th className="arc-mono hidden px-4 py-3.5 font-medium text-arc-dim sm:table-cell">REGIMES</th>
            <th className="arc-mono px-4 py-3.5 font-medium text-arc-dim">RISK</th>
            <th className="arc-mono hidden px-4 py-3.5 font-medium text-arc-dim xl:table-cell">APY</th>
            <th className="arc-mono px-4 py-3.5 font-medium text-arc-dim" aria-label="Open record" />
          </tr>
        </thead>
        <tbody>
          {strategies.map((strategy) => (
              <tr
                key={strategy.id}
                className="group cursor-pointer border-b border-white/[0.07] transition-colors last:border-b-0 hover:bg-arc-surface/70"
                onClick={() => router.push(urls.strategy(strategy.slug))}
              >
                <td className="px-4 py-4 align-middle font-mono text-[12px] tabular-nums text-arc-dim">
                  {strategy.strategyId.replace("STRATEGY_", "")}
                </td>
                <td className="min-w-0 px-4 py-4 align-middle">
                  <span className="block truncate text-[14px] font-semibold text-arc-text">
                    {strategy.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-arc-dim">
                    {strategy.type}
                  </span>
                </td>
                <td className="hidden max-w-[220px] px-4 py-4 align-middle lg:table-cell">
                  <span className="block truncate text-[12.5px] text-arc-muted">
                    {objectiveLabels(strategy).join(" / ") || "—"}
                  </span>
                </td>
                <td className="hidden px-4 py-4 align-middle text-[12.5px] text-arc-muted md:table-cell">
                  <span className="flex flex-col gap-1.5">
                    {strategy.protocols.length > 0 && <span className="flex items-center gap-1.5"><ArcProtocolIcon name={strategy.protocols[0].name} iconUrl={strategy.protocols[0].iconUrl} size={15} />{strategy.protocols.map((p) => p.name).join(", ")}</span>}
                    {strategy.networks.length > 0 && <span className="flex items-center gap-1.5"><ArcNetworkIcon name={strategy.networks[0].name} iconUrl={strategy.networks[0].iconUrl} size={15} />{strategy.networks.map((n) => n.name).join(", ")}</span>}
                  </span>
                </td>
                <td className="hidden px-4 py-4 align-middle sm:table-cell">
                  <span className="flex gap-3">
                    {strategy.marketFit?.regimes?.map((regime) => (
                      <RegimeIndicator key={regime} regime={regime} iconOnly />
                    ))}
                  </span>
                </td>
                <td className="px-4 py-4 align-middle">
                  <span
                    className={cn(
                      "arc-mono text-[10px]",
                      RISK_TEXT[strategy.risk?.overallRisk ?? ""] ?? "text-arc-muted"
                    )}
                  >
                    {strategy.risk?.overallRisk?.replace("_", " ")}
                  </span>
                </td>
                <td className="hidden px-4 py-4 align-middle xl:table-cell">
                  {strategy.latestObservation ? (
                    <span className="font-mono text-[12px] tabular-nums text-arc-green">
                      {strategy.latestObservation.apy.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="font-mono text-[12px] text-arc-dim">—</span>
                  )}
                </td>
                <td className="px-4 py-4 align-middle">
                  <Link
                    href={urls.strategy(strategy.slug)}
                    className="arc-mono flex items-center gap-1.5 text-arc-muted transition-colors group-hover:text-arc-green"
                    onClick={(event) => event.stopPropagation()}
                  >
                    OPEN
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
