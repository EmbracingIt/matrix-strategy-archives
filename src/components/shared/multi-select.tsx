"use client"

import { useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * Searchable multi-select used by the admin editors and the public
 * Strategy Finder: selected items render as compact chips (icon + label
 * + remove), the trigger opens a searchable dropdown list.
 */

export interface MultiSelectOption {
  id: string
  label: string
  sub?: string
  icon?: React.ReactNode
}

export function SearchMultiSelect({
  options,
  selected,
  onToggle,
  placeholder,
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
}: {
  options: MultiSelectOption[]
  selected: string[]
  onToggle: (id: string) => void
  placeholder: string
  searchPlaceholder?: string
  emptyText?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedOptions = options.filter((o) => selected.includes(o.id))

  return (
    <div className="space-y-3">
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-2 pr-1 text-sm"
            >
              {o.icon}
              <span className="font-medium text-gray-800">{o.label}</span>
              <button
                type="button"
                onClick={() => onToggle(o.id)}
                aria-label={`Remove ${o.label}`}
                className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 text-left text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 focus-visible:border-gray-400 focus-visible:outline-none"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Search className="size-4 shrink-0 text-gray-400" />
              <span className="truncate">
                {selectedOptions.length > 0
                  ? `${selectedOptions.length} selected · ${placeholder}`
                  : placeholder}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const isSelected = selected.includes(o.id)
                  return (
                    <CommandItem
                      key={o.id}
                      value={`${o.label} ${o.sub ?? ""}`}
                      onSelect={() => onToggle(o.id)}
                      className="gap-2.5"
                    >
                      {o.icon}
                      <span className="font-medium">{o.label}</span>
                      {o.sub && <span className="ml-auto text-xs text-gray-400">{o.sub}</span>}
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                          o.sub ? "ml-2" : "ml-auto"
                        )}
                      />
                    </CommandItem>
                  )
                })}
                {options.length === 0 && (
                  <div className="px-3 py-6 text-center text-xs text-gray-400">{emptyText}</div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
