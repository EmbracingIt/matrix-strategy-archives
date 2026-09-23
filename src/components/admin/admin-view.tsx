"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Coins, Globe, Hexagon, Layers } from "lucide-react"
import { StrategyListPanel } from "@/components/admin/strategy-list-panel"
import { StrategyForm } from "@/components/admin/strategy-form"
import { AssetManager } from "@/components/admin/asset-manager"
import { ProtocolManager } from "@/components/admin/protocol-manager"
import { NetworkManager } from "@/components/admin/network-manager"
import { useMeta } from "@/hooks/use-strategy-data"
import { urls, type AdminSection } from "@/lib/nav"
import { cn } from "@/lib/utils"

/**
 * Admin CMS shell — its own chrome (independent from the public header).
 * A registry sidebar sits at the far left of the viewport; the strategy
 * editor / list / managers fill the remaining width. Reachable at /?view=admin.
 */
export function AdminView({
  section,
  editId,
  isNew,
}: {
  section: AdminSection
  editId: string | null
  isNew: boolean
}) {
  const router = useRouter()
  const { data: meta } = useMeta()

  const editing = Boolean(editId || isNew)

  const NAV: { id: AdminSection; label: string; icon: typeof Layers; count?: number }[] = [
    { id: "strategies", label: "Strategies", icon: Layers, count: meta?.counts.strategies },
    { id: "assets", label: "Assets", icon: Coins, count: meta?.counts.assets },
    { id: "protocols", label: "Protocols", icon: Hexagon, count: meta?.counts.protocols },
    { id: "networks", label: "Networks", icon: Globe, count: meta?.counts.networks },
  ]

  const goSection = (id: AdminSection) => router.push(urls.admin(id))

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Admin top bar */}
      <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center gap-3 px-4 sm:px-6">
          <Link href={urls.admin()} className="flex items-center gap-2.5">
            <img src="/matrix-mark.svg" width={24} height={24} className="size-6 object-contain" alt="" aria-hidden="true" />
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">MATRIX</span>
            <span className="mono-label hidden text-gray-400 sm:inline">/ ADMIN</span>
          </Link>

          {/* Breadcrumb context */}
          {editing && (
            <span className="mono-label hidden items-center gap-2 text-gray-300 md:inline-flex">
              <span className="text-gray-200">|</span>
              STRATEGY EDITOR
            </span>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href={urls.archive()}
              className="mono-label flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
            >
              VIEW SITE
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-stretch">
        {/* Registry sidebar — far left, spans the full editor height */}
        <aside className="sticky top-14 hidden max-h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white py-6 pl-4 pr-3 md:flex scroll-thin">
          <nav className="space-y-1" aria-label="Admin sections">
            {NAV.map((item) => {
              const active = !editing && section === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goSection(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("size-4", active ? "text-gray-900" : "text-gray-400")} />
                  {item.label}
                  <span className="ml-auto font-mono text-[10px] text-gray-300">
                    {item.count ?? ""}
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50/60 p-3.5">
            <div className="mono-label text-[8px] text-gray-400">DATABASE</div>
            <div className="mt-2 space-y-1.5">
              <StatRow label="PUBLISHED" value={meta?.counts.published} tone="text-emerald-600" />
              <StatRow label="DRAFT" value={meta?.counts.draft} />
              <StatRow label="ARCHIVED" value={meta?.counts.archived} />
            </div>
          </div>

          <div className="mt-auto pt-6">
            <p className="mono-label px-1 text-[8px] leading-relaxed text-gray-300">
              SAME DATABASE
              <br />
              PUBLIC SITE + API
            </p>
          </div>
        </aside>

        {/* Content — fills the remaining viewport width */}
        <main className="min-w-0 flex-1">
          {editing ? (
            <StrategyForm strategyId={editId ?? undefined} isNew={isNew} />
          ) : (
            <div className="mx-auto w-full max-w-[1152px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {/* Mobile section nav */}
              <div className="mb-4 flex gap-1 overflow-x-auto scroll-thin md:hidden">
                {NAV.map((item) => {
                  const active = section === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goSection(item.id)}
                      className={cn(
                        "mono-label flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] transition-colors",
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-500"
                      )}
                    >
                      <item.icon className="size-3" />
                      {item.label.toUpperCase()}
                    </button>
                  )
                })}
              </div>

              {section === "assets" ? (
                <AssetManager />
              ) : section === "protocols" ? (
                <ProtocolManager />
              ) : section === "networks" ? (
                <NetworkManager />
              ) : (
                <StrategyListPanel />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Admin footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <span className="mono-label text-gray-300">MATRIX / ADMIN CONSOLE</span>
          <span className="mono-label hidden text-gray-300 sm:inline">
            SAME DATABASE · PUBLIC SITE + API
          </span>
        </div>
      </footer>
    </div>
  )
}

function StatRow({ label, value, tone }: { label: string; value?: number; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-400">{label}</span>
      <span className={cn("font-mono text-xs font-semibold", tone ?? "text-gray-700")}>
        {value ?? "—"}
      </span>
    </div>
  )
}
