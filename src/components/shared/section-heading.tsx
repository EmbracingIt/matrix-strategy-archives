import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** Numbered section heading for the strategy detail page (01 / OVERVIEW …). */
export function SectionHeading({
  number,
  title,
  hint,
  className,
}: {
  number: string
  title: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn("mb-5", className)}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-emerald-600">
          {number}
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
        {hint && (
          <span className="ml-auto hidden font-mono text-[10px] tracking-[0.14em] text-gray-400 sm:block">
            {hint}
          </span>
        )}
      </div>
      <div className="mt-3 h-px w-full bg-gray-100" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-3.5 w-1/2" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-6 h-4 w-2/3" />
    </div>
  )
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 py-16 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">
        NO RESULTS
      </div>
      <p className="mt-3 text-base font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-red-500">
        ERROR
      </p>
      <p className="mt-2 text-sm font-medium text-red-700">{message}</p>
    </div>
  )
}

/** Definition row: mono label on the left, value on the right. */
export function DefRow({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className
      )}
    >
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
        {label}
      </span>
      <div className="text-sm text-gray-700 sm:text-right">{children}</div>
    </div>
  )
}
