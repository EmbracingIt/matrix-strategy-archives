import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import type { Regime } from "@/lib/types"
import { cn } from "@/lib/utils"

const REGIME_STYLE: Record<Regime, { color: string; Icon: typeof ArrowUp }> = {
  BULL: { color: "text-arc-green", Icon: ArrowUp },
  SIDEWAYS: { color: "text-arc-amber", Icon: ArrowRight },
  BEAR: { color: "text-arc-red", Icon: ArrowDown },
}

export function RegimeIndicator({
  regime,
  iconOnly = false,
  muted = false,
  className,
}: {
  regime: Regime
  iconOnly?: boolean
  muted?: boolean
  className?: string
}) {
  const { color, Icon } = REGIME_STYLE[regime]

  return (
    <span
      className={cn("inline-flex items-center gap-1", muted ? "text-arc-dim" : color, className)}
      aria-label={iconOnly ? `${regime.toLowerCase()} market` : undefined}
      role={iconOnly ? "img" : undefined}
      title={iconOnly ? regime : undefined}
    >
      <Icon className="size-3.5 shrink-0 stroke-[2.5]" aria-hidden />
      {!iconOnly && regime}
    </span>
  )
}
