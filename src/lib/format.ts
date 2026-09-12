import type { ExposureLevel, Regime, RiskLevel, StrategyStatus } from "@/lib/types"

/** Human-readable labels for the structured enum values. */
export const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  VERY_HIGH: "Very High",
}

export const REGIME_LABELS: Record<Regime, string> = {
  BULL: "Bull",
  SIDEWAYS: "Sideways",
  BEAR: "Bear",
}

export const EXPOSURE_LABELS: Record<ExposureLevel, string> = {
  NONE: "None",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
}

export const STATUS_LABELS: Record<StrategyStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
}

export const ASSET_CATEGORIES = [
  { value: "native", label: "Native" },
  { value: "stablecoin", label: "Stablecoin" },
  { value: "lst", label: "Liquid Staking" },
  { value: "governance", label: "Governance" },
  { value: "other", label: "Other" },
]

/** "Sep 2026" style — used for last-reviewed dates. */
export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

/** "Sep 14, 2026" style — used in admin tables. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** ISO date (YYYY-MM-DD) for <input type="date"> values. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

/** Relative-ish short label: "today", "3d ago", "2mo ago". */
export function timeAgo(value: string | null | undefined): string {
  if (!value) return "—"
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
