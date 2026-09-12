"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ArchiveShell } from "@/components/archive/chrome"
import { ArchiveEntrance } from "@/components/archive/archive-entrance"
import { ExploreFlow } from "@/components/archive/explore-flow"
import { ResultsView } from "@/components/archive/results-view"
import { BrowseAllView } from "@/components/archive/browse-all"
import { StrategyRecordView } from "@/components/archive/strategy-record"
import { ProtocolBrowser } from "@/components/public/protocol-browser"
import { AssetBrowser } from "@/components/public/asset-browser"
import { NetworkBrowser } from "@/components/public/network-browser"
import { AdminView } from "@/components/admin/admin-view"
import { urls, type AdminSection, ViewName } from "@/lib/nav"
import { scrollToTopImmediate } from "@/lib/smooth-scroll"

/**
 * Matrix Strategy Archives — single-route application shell.
 *
 * Public views are the dark Archive experience (see src/lib/nav.ts):
 *   /                          -> archive entrance
 *   /?view=explore&step=…      -> guided discovery flow (market / assets / objective)
 *   /?view=results&…           -> retrieved records + archive match scores
 *   /?view=all                 -> browse all records (grid / index)
 *   /?view=strategy&slug=…     -> strategy record
 *   /?view=protocols|assets|networks
 *
 * The admin CMS keeps its own light chrome and is intentionally untouched.
 */
function HomePage() {
  const params = useSearchParams()
  const view = (params.get("view") ?? "archive") as ViewName
  const slug = params.get("slug")
  const section = (params.get("section") ?? "strategies") as AdminSection
  const editId = params.get("edit")
  const isNew = params.get("new") === "1"

  // Reset scroll when switching views (client-side navigation keeps position).
  // Routed through the Lenis singleton when the public Archive is mounted so
  // the virtual scroll position and the window stay in sync.
  useEffect(() => {
    scrollToTopImmediate()
  }, [view, slug, section, editId, isNew])

  // Legacy strategy-finder view — now the guided Archive flow.
  useEffect(() => {
    if (view === "match") {
      window.history.replaceState(null, "", urls.archive())
    }
  }, [view])

  if (view === "admin") {
    return <AdminView section={section} editId={editId} isNew={isNew} />
  }

  if (view === "match") {
    return (
      <ArchiveShell view="archive">
        <div className="py-32 text-center">
          <p className="arc-mono text-arc-muted">REDIRECTING TO THE ARCHIVE ENTRANCE…</p>
        </div>
      </ArchiveShell>
    )
  }

  if (view === "strategy" && slug) {
    return (
      <ArchiveShell view="strategy">
        <StrategyRecordView slug={slug} />
      </ArchiveShell>
    )
  }

  if (view === "explore") {
    return (
      <ArchiveShell view="explore">
        <ExploreFlow />
      </ArchiveShell>
    )
  }

  if (view === "results") {
    return (
      <ArchiveShell view="results">
        <ResultsView />
      </ArchiveShell>
    )
  }

  if (view === "all") {
    return (
      <ArchiveShell view="all">
        <BrowseAllView />
      </ArchiveShell>
    )
  }

  if (view === "protocols") {
    return (
      <ArchiveShell view="protocols">
        <ProtocolBrowser />
      </ArchiveShell>
    )
  }

  if (view === "assets") {
    return (
      <ArchiveShell view="assets">
        <AssetBrowser />
      </ArchiveShell>
    )
  }

  if (view === "networks") {
    return (
      <ArchiveShell view="networks">
        <NetworkBrowser />
      </ArchiveShell>
    )
  }

  return (
    <ArchiveShell view="archive">
      <ArchiveEntrance />
    </ArchiveShell>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomePage />
    </Suspense>
  )
}
