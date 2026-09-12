"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// The searchable multi-select lives in components/shared so the public
// Strategy Finder can use the same component as the admin editors.
export {
  SearchMultiSelect,
  type MultiSelectOption,
} from "@/components/shared/multi-select"

/**
 * Admin editor form primitives — premium-CMS style:
 * readable Inter labels, helper text under the label (never beside it),
 * generous input heights, single content surfaces per section.
 */

/** Label + optional hint (below the label) + control. */
export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {hint && <p className="-mt-1 text-xs leading-relaxed text-gray-500">{hint}</p>}
      {children}
    </div>
  )
}

/**
 * The single clean content surface used by each editor section:
 * section heading, small explanatory subtitle, then the fields.
 */
export function SectionSurface({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-lg border border-gray-200 bg-white p-6 md:p-8", className)}>
      <header className="mb-7">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
        )}
      </header>
      {children}
    </section>
  )
}

/** Sub-group heading inside a section surface (e.g. "Entry conditions"). */
export function GroupHeading({
  title,
  description,
  className,
}: {
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("mb-4", className)}>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
    </div>
  )
}

/** Dynamic list of free-text rows with remove controls + add button. */
export function StringListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  addLabel: string
}) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => onChange(items.map((it, j) => (j === i ? e.target.value : it)))}
            placeholder={placeholder}
            className="h-10 flex-1 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label="Remove item"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 border-dashed text-xs text-gray-600"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="size-3.5" /> {addLabel}
      </Button>
    </div>
  )
}
