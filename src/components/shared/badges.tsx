import { cn } from "@/lib/utils"
import type { ExposureLevel, Regime, RiskLevel, StrategyStatus } from "@/lib/types"
import { EXPOSURE_LABELS, RISK_LABELS, REGIME_LABELS, STATUS_LABELS } from "@/lib/format"

// Risk / regime / status chips — small bordered pills, restrained colors,
// emerald reserved for the genuinely safe end of each scale.

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  VERY_HIGH: "border-red-200 bg-red-50 text-red-700",
}

const RISK_DOTS: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-orange-500",
  VERY_HIGH: "bg-red-500",
}

export function RiskBadge({
  risk,
  className,
  compact = false,
}: {
  risk: RiskLevel
  className?: string
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        compact ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]",
        RISK_STYLES[risk],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", RISK_DOTS[risk])} />
      {RISK_LABELS[risk]} risk
    </span>
  )
}

const REGIME_STYLES: Record<Regime, string> = {
  BULL: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
  SIDEWAYS: "border-gray-200 bg-gray-50 text-gray-600",
  BEAR: "border-red-200 bg-red-50/70 text-red-700",
}

const REGIME_ARROWS: Record<Regime, string> = {
  BULL: "↗",
  SIDEWAYS: "→",
  BEAR: "↘",
}

export function RegimeChip({
  regime,
  className,
  compact = false,
}: {
  regime: Regime
  className?: string
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium uppercase tracking-wide",
        compact ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]",
        REGIME_STYLES[regime],
        className
      )}
    >
      <span className="font-mono leading-none">{REGIME_ARROWS[regime]}</span>
      {REGIME_LABELS[regime]}
    </span>
  )
}

const STATUS_STYLES: Record<StrategyStatus, string> = {
  DRAFT: "border-gray-200 bg-gray-50 text-gray-600",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ARCHIVED: "border-gray-200 bg-white text-gray-400",
}

const STATUS_DOTS: Record<StrategyStatus, string> = {
  DRAFT: "bg-gray-400",
  PUBLISHED: "bg-emerald-500",
  ARCHIVED: "bg-gray-300",
}

export function StatusBadge({
  status,
  className,
}: {
  status: StrategyStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOTS[status])} />
      {STATUS_LABELS[status]}
    </span>
  )
}

/** Neutral small chip for types, assets, tags. */
export function TagChip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600",
        className
      )}
    >
      {children}
    </span>
  )
}

/** Exposure level renderer for the risk tables ("None / Low / Medium / High"). */
export function ExposureValue({ level }: { level: ExposureLevel }) {
  const tone: Record<ExposureLevel, string> = {
    NONE: "text-emerald-700",
    LOW: "text-emerald-700",
    MEDIUM: "text-amber-600",
    HIGH: "text-red-600",
  }
  return (
    <span className={cn("text-sm font-medium", tone[level])}>{EXPOSURE_LABELS[level]}</span>
  )
}

export function RiskValue({ risk }: { risk: RiskLevel }) {
  return (
    <span className={cn("text-sm font-medium", RISK_TEXT[risk])}>{RISK_LABELS[risk]}</span>
  )
}

const RISK_TEXT: Record<RiskLevel, string> = {
  LOW: "text-emerald-700",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  VERY_HIGH: "text-red-600",
}
