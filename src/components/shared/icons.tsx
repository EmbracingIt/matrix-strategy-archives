import { cn } from "@/lib/utils"

/**
 * Monogram icons for assets / protocols / networks.
 * Local-first by design: no CoinGecko dependency. When an entity carries an
 * iconUrl it is rendered directly; otherwise we fall back to a deterministic,
 * category-tinted monogram that keeps the archive visually consistent.
 */

const CATEGORY_TONES: Record<string, string> = {
  native: "bg-gray-900 text-white border-gray-900",
  stablecoin: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lst: "bg-amber-50 text-amber-700 border-amber-200",
  governance: "bg-gray-100 text-gray-600 border-gray-200",
}

const FALLBACK_TONES = [
  "bg-gray-100 text-gray-600 border-gray-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-red-50 text-red-600 border-red-200",
  "bg-stone-100 text-stone-600 border-stone-200",
]

function hashTone(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return FALLBACK_TONES[h % FALLBACK_TONES.length]
}

function Monogram({
  label,
  size,
  tone,
  rounded,
  className,
}: {
  label: string
  size: number
  tone: string
  rounded: "full" | "md"
  className?: string
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.38) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center border font-mono font-semibold uppercase leading-none tracking-tight select-none",
        rounded === "full" ? "rounded-full" : "rounded-md",
        tone,
        className
      )}
    >
      {label.slice(0, 3)}
    </span>
  )
}

export function AssetIcon({
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
  if (iconUrl) {
    return (
       
      <img
        src={iconUrl}
        alt={symbol}
        style={{ width: size, height: size }}
        className={cn("inline-block shrink-0 rounded-full", className)}
      />
    )
  }
  const tone = (category && CATEGORY_TONES[category]) || hashTone(symbol)
  return <Monogram label={symbol.replace(/[^A-Za-z0-9]/g, "")} size={size} tone={tone} rounded="full" className={className} />
}

export function ProtocolIcon({
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
  if (iconUrl) {
    return (
       
      <img
        src={iconUrl}
        alt={name}
        style={{ width: size, height: size }}
        className={cn("inline-block shrink-0 rounded-md", className)}
      />
    )
  }
  const initials = name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
  return (
    <Monogram label={initials} size={size} tone={hashTone(name)} rounded="md" className={className} />
  )
}

export function NetworkIcon({
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
  if (iconUrl) {
    return (
       
      <img
        src={iconUrl}
        alt={name}
        style={{ width: size, height: size }}
        className={cn("inline-block shrink-0 rounded-md", className)}
      />
    )
  }
  const initials = name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
  return (
    <Monogram
      label={initials}
      size={size}
      tone="bg-white text-gray-700 border-gray-300"
      rounded="md"
      className={className}
    />
  )
}
