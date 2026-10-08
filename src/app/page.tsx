"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArchiveShell } from "@/components/archive/chrome";
import { ArchiveEntrance } from "@/components/archive/archive-entrance";
import { ExploreFlow } from "@/components/archive/explore-flow";
import { ResultsView } from "@/components/archive/results-view";
import { BrowseAllView } from "@/components/archive/browse-all";
import { StrategyRecordView } from "@/components/archive/strategy-record";
import { ProtocolBrowser } from "@/components/public/protocol-browser";
import { AdminView } from "@/components/admin/admin-view";
import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { urls, type AdminSection, ViewName } from "@/lib/nav";
import { scrollToTopImmediate } from "@/lib/smooth-scroll";
import { Learn, Tools } from "@/components/archive/foundations";
import { CompareView } from "@/components/archive/compare-view";

/**
 * Matrix Strategy Archives — single-route application shell.
 *
 * Public views are the dark Archive experience (see src/lib/nav.ts):
 *   /                          -> archive entrance
 *   /?view=explore&stage=…     -> goal-first educational filtering
 *   /?view=results&…           -> legacy results route, current catalogue
 *   /?view=all                 -> seven canonical plans with optional filters
 *   /?view=strategy&slug=…     -> strategy record
 *   /?view=protocols|assets|networks
 *
 * The admin CMS keeps its light chrome and edits the same shared records.
 */
function HomePage() {
  const params = useSearchParams();
  const router = useRouter();
  const view = (params.get("view") ?? "archive") as ViewName;
  const slug = params.get("slug");
  const section = (params.get("section") ?? "strategies") as AdminSection;
  const editId = params.get("edit");
  const isNew = params.get("new") === "1";
  useEffect(() => {
    if (view === "explore" || view === "results") {
      const next = new URLSearchParams(params.toString());
      const legacyStep = next.get("step");
      if (view === "explore" && (legacyStep === "assets" || legacyStep === "objective")) {
        next.set("view", "results");
        next.delete("step");
      }
      next.delete("assets");
      next.delete("objective");
      if (next.toString() !== params.toString()) router.replace(`/?${next}`, { scroll: false });
    }
    if (view === "assets" || view === "networks") {
      const next = new URLSearchParams(params.toString());
      next.set("view", "all");
      router.replace(`/?${next}`, { scroll: false });
    }
  }, [view, params, router]);

  // Reset scroll when switching views (client-side navigation keeps position).
  // Routed through the Lenis singleton when the public Archive is mounted so
  // the virtual scroll position and the window stay in sync.
  useEffect(() => {
    scrollToTopImmediate();
  }, [view, slug, section, editId, isNew]);

  // Legacy strategy-finder view — now the guided Archive flow.
  useEffect(() => {
    if (view === "match") {
      window.history.replaceState(null, "", urls.archive());
    }
  }, [view]);

  if (view === "admin") {
    return (
      <AdminAuthGate>
        <AdminView section={section} editId={editId} isNew={isNew} />
      </AdminAuthGate>
    );
  }

  if (view === "match") {
    return (
      <ArchiveShell view="archive">
        <div className="py-32 text-center">
          <p className="arc-mono text-arc-muted">
            REDIRECTING TO THE ARCHIVE ENTRANCE…
          </p>
        </div>
      </ArchiveShell>
    );
  }

  if (view === "strategy" && slug) {
    return (
      <ArchiveShell view="strategy">
        <StrategyRecordView slug={slug} />
      </ArchiveShell>
    );
  }

  if (view === "explore") {
    return (
      <ArchiveShell view="explore">
        <ExploreFlow />
      </ArchiveShell>
    );
  }

  if (view === "results") {
    return (
      <ArchiveShell view="results">
        <ResultsView />
      </ArchiveShell>
    );
  }

  if (view === "all") {
    return (
      <ArchiveShell view="all">
        <BrowseAllView />
      </ArchiveShell>
    );
  }

  if (view === "protocols") {
    return (
      <ArchiveShell view="protocols">
        <ProtocolBrowser />
      </ArchiveShell>
    );
  }
  if (view === "learn" || view === "tools" || view === "compare") {
    return (
      <ArchiveShell view={view}>
        {view === "learn" ? (
          <Learn />
        ) : view === "tools" ? (
          <Tools />
        ) : (
          <CompareView />
        )}
      </ArchiveShell>
    );
  }

  if (view === "assets" || view === "networks") {
    return (
      <ArchiveShell view="all">
        <BrowseAllView />
      </ArchiveShell>
    );
  }

  return (
    <ArchiveShell view="archive">
      <ArchiveEntrance />
    </ArchiveShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomePage />
    </Suspense>
  );
}
