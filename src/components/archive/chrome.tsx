"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { urls, type ViewName } from "@/lib/nav"
import { useArchiveUI } from "@/store/ui-store"
import { ArchiveSearch } from "@/components/archive/archive-search"
import { SmoothScroll } from "@/components/archive/smooth-scroll"
import { cn } from "@/lib/utils"

const NAV_ITEMS: { label: string; view: ViewName; href: string; match: ViewName[] }[] = [
  {
    label: "Strategies",
    view: "all",
    href: urls.allRecords(),
    match: ["all", "strategy", "results", "explore"],
  },
  { label: "Protocols", view: "protocols", href: urls.protocols(), match: ["protocols"] },
  { label: "Assets", view: "assets", href: urls.assets(), match: ["assets"] },
  { label: "Networks", view: "networks", href: urls.networks(), match: ["networks"] },
]

/**
 * Public archive chrome — dark catalogue identity, deliberately different
 * from the light admin CMS. Header, sticky footer and the global Archive
 * search overlay live here so every public view shares them.
 */
export function ArchiveShell({ view, children }: { view: ViewName; children: React.ReactNode }) {
  return (
    <div
      className="arc-scope flex min-h-screen flex-col bg-arc-bg text-arc-text"
      style={{ colorScheme: "dark" }}
    >
      <SmoothScroll />
      <ArchiveHeader view={view} />
      <main className="flex-1">{children}</main>
      <ArchiveFooter />
      <ArchiveSearch />
    </div>
  )
}

function ArchiveHeader({ view }: { view: ViewName }) {
  const openSearch = useArchiveUI((s) => s.openSearch)

  // "/" opens the archive search, like a research terminal.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      if (typing) return
      if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault()
        openSearch()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openSearch])

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-arc-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1380px] items-center gap-6 px-4 sm:px-8">
        <Link href={urls.archive()} className="group flex items-center gap-3" aria-label="Matrix Archives entrance">
          <span className="flex size-7 items-center justify-center rounded-[6px] border border-white/20 font-mono text-[13px] font-bold text-arc-text transition-colors duration-200 group-hover:border-arc-green group-hover:text-arc-green">
            M
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-arc-text">MATRIX</span>
            <span className="arc-mono mt-1 hidden text-[9px] text-arc-dim sm:block">ARCHIVES</span>
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-1 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = item.match.includes(view)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "arc-mono rounded-sm px-3 py-2 transition-colors",
                  active
                    ? "text-arc-text"
                    : "text-arc-muted hover:text-arc-text"
                )}
              >
                {item.label}
                {active && <span className="ml-2 inline-block size-1 rounded-full bg-arc-green align-middle" />}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search the Archive"
            className="group hidden h-9 items-center gap-2.5 rounded-[5px] border border-white/10 bg-arc-surface px-3 text-left text-arc-muted transition-colors hover:border-white/25 hover:text-arc-text lg:flex"
          >
            <Search className="size-3.5" />
            <span className="text-[13px]">Search the Archive</span>
            <kbd className="ml-2 rounded-[3px] border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-arc-dim">/</kbd>
          </button>
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search the Archive"
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-arc-surface text-arc-muted transition-colors hover:border-white/25 hover:text-arc-text lg:hidden"
          >
            <Search className="size-4" />
          </button>
          <Link
            href={urls.explore({ step: "market" })}
            className="arc-mono hidden h-9 items-center rounded-[4px] bg-arc-green px-4 text-black transition-all duration-200 hover:bg-[#2ad695] sm:flex"
          >
            OPEN MATRIX →
          </Link>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav
        className="arc-scroll flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden"
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.match.includes(view)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "arc-mono shrink-0 px-2.5 py-1.5 text-[10px] transition-colors",
                active ? "text-arc-text" : "text-arc-muted hover:text-arc-text"
              )}
            >
              {item.label}
              {active && <span className="ml-1.5 inline-block size-1 rounded-full bg-arc-green align-middle" />}
            </Link>
          )
        })}
        <Link
          href={urls.explore({ step: "market" })}
          className="arc-mono ml-auto shrink-0 rounded-[3px] bg-arc-green px-3 py-1.5 text-[10px] text-black"
        >
          OPEN MATRIX →
        </Link>
      </nav>
    </header>
  )
}

function ArchiveFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-arc-bg">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-5 px-4 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="arc-barcode h-4 w-16 opacity-60" aria-hidden />
            <span className="arc-mono text-arc-muted">MATRIX / STRATEGY ARCHIVES</span>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-arc-dim">
            A digital library of DeFi strategy records — organized by market, assets and
            objective, curated and reviewed by Matrix Finance.
          </p>
        </div>

        <nav className="arc-mono flex flex-wrap items-center gap-x-5 gap-y-2 text-arc-muted" aria-label="Footer">
          <Link href={urls.allRecords()} className="transition-colors hover:text-arc-text">
            ALL RECORDS
          </Link>
          <Link href={urls.protocols()} className="transition-colors hover:text-arc-text">
            PROTOCOLS
          </Link>
          <Link href={urls.assets()} className="transition-colors hover:text-arc-text">
            ASSETS
          </Link>
          <Link href={urls.networks()} className="transition-colors hover:text-arc-text">
            NETWORKS
          </Link>
          <a
            href="/api/strategies"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-arc-text"
          >
            REST API
          </a>
          <Link href={urls.admin()} className="text-arc-dim transition-colors hover:text-arc-text">
            ADMIN
          </Link>
        </nav>

        <span className="arc-mono text-arc-dim">© 2026 MATRIX FINANCE</span>
      </div>
    </footer>
  )
}
