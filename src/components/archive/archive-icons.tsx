"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Circular monogram + logo icons for the public Archive.
 *
 * Every asset, network and protocol mark renders as a CIRCLE — never a
 * square — across the whole public frontend (selection, results, featured
 * record, strategy cards, registries, metadata rows). iconUrl is rendered
 * inside a circular mask when present; failures fall back to a tasteful
 * circular monogram so no broken-image glyph is ever shown. The admin CMS
 * keeps its own light icons in shared/icons.tsx.
 */

const ARC_CATEGORY_TONES: Record<string, string> = {
  native: "bg-white/10 text-arc-text border-white/20",
  stablecoin: "bg-arc-green/12 text-arc-green border-arc-green/35",
  lst: "bg-arc-amber/12 text-arc-amber border-arc-amber/35",
  governance: "bg-white/[0.07] text-arc-muted border-white/15",
}

const ARC_FALLBACK_TONES = [
  "bg-white/10 text-arc-text border-white/20",
  "bg-arc-green/12 text-arc-green border-arc-green/35",
  "bg-arc-amber/12 text-arc-amber border-arc-amber/35",
  "bg-arc-red/12 text-arc-red border-arc-red/35",
  "bg-white/[0.07] text-arc-muted border-white/15",
]

function hashTone(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return ARC_FALLBACK_TONES[h % ARC_FALLBACK_TONES.length]
}

function initialsOf(name: string): string {
  return (
    name
      .split(/[\s-]+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2) ?? "?"
  )
}

/** Circular monogram — the house style for records without a logo. */
function ArcMonogram({
  label,
  size,
  tone,
  className,
}: {
  label: string
  size: number
  tone: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.34) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border font-mono font-semibold uppercase leading-none tracking-tight select-none",
        tone,
        className
      )}
    >
      {label.slice(0, 3)}
    </span>
  )
}

/**
 * Circular logo image with graceful fallback: if the remote icon fails to
 * load, the monogram underneath shows instead — never a broken-image glyph.
 */
function ArcLogoImage({
  src,
  alt,
  size,
  className,
  fallback,
}: {
  src: string
  alt: string
  size: number
  className?: string
  fallback: ReactNode
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return fallback
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={cn(
        "inline-block shrink-0 rounded-full border border-white/10 bg-arc-raised object-cover",
        className
      )}
    />
  )
}

export function ArcAssetIcon({
  symbol,
  category,
  iconUrl,
  size = 20,
  className,
}: {
  symbol: string
  category?: string | null
  iconUrl?: string | null
  size?: number
  className?: string
}) {
  const tone = (category && ARC_CATEGORY_TONES[category.toLowerCase()]) || hashTone(symbol)
  const monogram = (
    <ArcMonogram
      label={symbol.replace(/[^A-Za-z0-9]/g, "")}
      size={size}
      tone={tone}
      className={className}
    />
  )
  if (iconUrl) {
    return (
      <ArcLogoImage
        src={iconUrl}
        alt={symbol}
        size={size}
        className={className}
        fallback={monogram}
      />
    )
  }
  return monogram
}

export function ArcProtocolIcon({
  name,
  iconUrl,
  size = 20,
  className,
}: {
  name: string
  iconUrl?: string | null
  size?: number
  className?: string
}) {
  const monogram = (
    <ArcMonogram label={initialsOf(name)} size={size} tone={hashTone(name)} className={className} />
  )
  if (iconUrl) {
    return (
      <ArcLogoImage
        src={iconUrl}
        alt={name}
        size={size}
        className={className}
        fallback={monogram}
      />
    )
  }
  return monogram
}

export function ArcNetworkIcon({
  name,
  iconUrl,
  size = 20,
  className,
}: {
  name: string
  iconUrl?: string | null
  size?: number
  className?: string
}) {
  const monogram = (
    <ArcMonogram
      label={initialsOf(name)}
      size={size}
      tone="bg-white/[0.07] text-arc-muted border-white/15"
      className={className}
    />
  )
  if (iconUrl) {
    return (
      <ArcLogoImage
        src={iconUrl}
        alt={name}
        size={size}
        className={className}
        fallback={monogram}
      />
    )
  }
  return monogram
}

/**
 * Overlapping circular icon stack for compositions ("ETH + USDC"). Rings in
 * the surrounding surface color keep each circle legible where they overlap.
 */
export function ArcIconStack({
  children,
  ringClass = "ring-arc-bg",
  overlap = "-ml-2",
  className,
}: {
  children: ReactNode[]
  ringClass?: string
  overlap?: string
  className?: string
}) {
  const items = children.filter(Boolean)
  if (items.length === 0) return null
  return (
    <span className={cn("inline-flex items-center", className)} aria-hidden>
      {items.map((child, index) => (
        <span
           
          key={index}
          className={cn(
            "inline-flex rounded-full ring-2",
            ringClass,
            index > 0 && overlap
          )}
          style={{ zIndex: items.length - index }}
        >
          {child}
        </span>
      ))}
    </span>
  )
}
