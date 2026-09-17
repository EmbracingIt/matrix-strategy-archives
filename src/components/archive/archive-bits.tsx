"use client"

import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Shared building blocks for archive views: section headers (catalogue
 * numbering + serif titles) and the archive loading / error states.
 */

export function SectionHead({
  code,
  title,
  description,
  className,
}: {
  /** Monospace catalogue code, e.g. "01 / MARKET". */
  code: string
  /** Serif display heading. */
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <p className="arc-mono text-arc-green">{code}</p>
      <h2 className="mt-4 font-sans text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold leading-[1.08] tracking-[-0.01em] text-arc-text">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[15px] leading-relaxed text-arc-muted">{description}</p>
      )}
    </div>
  )
}

export function ArchiveSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Retrieving records">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse border border-white/5 bg-white/[0.03]" />
      ))}
    </div>
  )
}

export function ArchiveError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center border border-white/10 bg-arc-surface px-6 py-20 text-center">
      <p className="arc-mono text-arc-red">ARCHIVE UNAVAILABLE</p>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-arc-muted">
        The records could not be retrieved.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="arc-mono mt-8 flex h-11 items-center gap-2.5 border border-white/15 px-6 text-arc-text transition-colors hover:border-white/40"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          TRY AGAIN
        </button>
      )}
    </div>
  )
}

/** Thin numbered rule used between catalogue sections. */
export function Rule({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4" aria-hidden>
      <span className="h-px flex-1 bg-white/10" />
      {label && <span className="arc-mono text-arc-dim">{label}</span>}
      <span className="h-px w-8 bg-white/10" />
    </div>
  )
}
