"use client"

import { useSearchParams } from "next/navigation"
import { parseArchiveQuery, parseExploreStep, urls } from "@/lib/nav"
import { ArchiveProgress } from "@/components/archive/archive-progress"
import { SectionHead } from "@/components/archive/archive-bits"
import { MarketCollection } from "@/components/archive/market-collection"
import { MarketPhaseCollection } from "@/components/archive/market-phase-collection"
import { AssetCollection } from "@/components/archive/asset-collection"
import { ObjectiveCollection } from "@/components/archive/objective-collection"

/**
 * Guided retrieval flow — MARKET → MARKET PHASE → ASSETS → OBJECTIVE.
 * State lives in the URL (?step=&market=&phase=&assets=&objective=) so
 * selections survive refresh, the back button and shared links. Panels shift
 * deeper into the catalogue with a fast translate transition.
 */

const STEP_META = {
  market: {
    code: "01 / MARKET",
    title: "Which market are you exploring?",
    description:
      "The archive is organized into collections by market regime. Choose the wing you want to walk into — every record inside is curated for those conditions.",
  },
  phase: {
    code: "02 / MARKET PHASE",
    title: "Where are we inside the market?",
    description:
      "The primary regime describes the broader direction. Market phases describe the conditions developing inside it.",
  },
  assets: {
    code: "03 / ASSETS",
    title: "Which assets belong in your search?",
    description:
      "Select the assets your search should reference. Records are matched against what they deposit, expose or reward. Select none to keep the whole collection.",
  },
  objective: {
    code: "04 / OBJECTIVE",
    title: "What are you looking for?",
    description:
      "Objectives translate your intent into the archive’s classification. Choose the section of the collection that matches why you invest.",
  },
} as const

export function ExploreFlow() {
  const params = useSearchParams()
  const step = parseExploreStep(params.get("step"))
  const query = parseArchiveQuery(params)

  const meta = STEP_META[step]

  return (
    <div>
      <ArchiveProgress current={step} query={query} />

      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        <div className="py-10 sm:py-12">
          <SectionHead code={meta.code} title={meta.title} description={meta.description} />
        </div>

        {/* Panel shifts deeper into the archive on step change */}
        <div key={step} className="arc-panel-in pb-16">
          {step === "market" && <MarketCollection query={query} />}
          {step === "phase" && <MarketPhaseCollection query={query} />}
          {step === "assets" && <AssetCollection query={query} />}
          {step === "objective" && <ObjectiveCollection query={query} />}
        </div>

        {/* Exit the guided flow */}
        <div className="flex flex-col items-start gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="arc-mono text-arc-dim">
            MATRIX ARCHIVE — GUIDED RETRIEVAL
          </p>
          <a
            href={urls.allRecords()}
            className="arc-mono text-arc-muted transition-colors hover:text-arc-text"
          >
            SKIP — BROWSE ALL RECORDS →
          </a>
        </div>
      </div>
    </div>
  )
}
