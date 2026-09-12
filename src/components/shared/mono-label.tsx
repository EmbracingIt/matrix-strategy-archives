import { cn } from "@/lib/utils"

/** Tiny uppercase monospace metadata label — the Matrix signature element. */
export function MonoLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <span className={cn("mono-label text-muted-foreground", className)}>{children}</span>
}

/** "MATRIX / STRATEGIES"-style breadcrumb label with a green slash. */
export function SlashLabel({ items, className }: { items: string[]; className?: string }) {
  return (
    <span className={cn("mono-label text-muted-foreground", className)}>
      {items.map((item, i) => (
        <span key={item + i}>
          {i > 0 && <span className="text-emerald-600/80 mx-1.5">/</span>}
          <span>{item}</span>
        </span>
      ))}
    </span>
  )
}
