"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowUpDown,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RegimeChip, RiskBadge, StatusBadge } from "@/components/shared/badges"
import { Skeleton } from "@/components/ui/skeleton"
import { useStrategies } from "@/hooks/use-strategy-data"
import { api } from "@/lib/api-client"
import { urls } from "@/lib/nav"
import { dtoToInput } from "@/lib/strategy-form"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { StrategyDTO, StrategyStatus } from "@/lib/types"

type StatusTab = "ALL" | StrategyStatus

/** Admin strategies table with status tabs, search and row actions. */
export function StrategyListPanel() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading } = useStrategies({ status: "ALL" })
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL")
  const [search, setSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<StrategyDTO | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const strategies = data ?? []

  const counts = useMemo(
    () => ({
      ALL: strategies.length,
      DRAFT: strategies.filter((s) => s.status === "DRAFT").length,
      PUBLISHED: strategies.filter((s) => s.status === "PUBLISHED").length,
      ARCHIVED: strategies.filter((s) => s.status === "ARCHIVED").length,
    }),
    [strategies]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return strategies.filter((s) => {
      if (statusTab !== "ALL" && s.status !== statusTab) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.strategyId.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.protocols.some((p) => p.name.toLowerCase().includes(q)) ||
        s.networks.some((n) => n.name.toLowerCase().includes(q)) ||
        [...s.depositAssets, ...s.exposureAssets, ...s.rewardAssets].some((a) =>
          a.symbol.toLowerCase().includes(q)
        )
      )
    })
  }, [strategies, statusTab, search])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["strategies"] })
    await queryClient.invalidateQueries({ queryKey: ["strategy"] })
    await queryClient.invalidateQueries({ queryKey: ["revisions"] })
    await queryClient.invalidateQueries({ queryKey: ["meta"] })
  }

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id)
    try {
      await fn()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed")
    } finally {
      setBusyId(null)
    }
  }

  const duplicate = (s: StrategyDTO) =>
    withBusy(s.id, async () => {
      const copy = await api.createStrategy(
        dtoToInput(s, { name: `${s.name} (Copy)`, status: "DRAFT", strategyId: undefined, slug: undefined })
      )
      await invalidate()
      toast.success(`Duplicated as ${copy.strategyId} (draft).`)
    })

  const setArchived = (s: StrategyDTO, archived: boolean) =>
    withBusy(s.id, async () => {
      await api.updateStrategy(s.id, dtoToInput(s, { status: archived ? "ARCHIVED" : "DRAFT" }))
      await invalidate()
      toast.success(
        archived
          ? `${s.strategyId} archived — retained in the database.`
          : `${s.strategyId} restored as draft.`
      )
    })

  const deleteStrategy = (s: StrategyDTO) =>
    withBusy(s.id, async () => {
      await api.deleteStrategy(s.id)
      await invalidate()
      toast.success(`${s.strategyId} permanently deleted.`)
    })

  const TABS: { id: StatusTab; label: string }[] = [
    { id: "ALL", label: "All" },
    { id: "DRAFT", label: "Draft" },
    { id: "PUBLISHED", label: "Published" },
    { id: "ARCHIVED", label: "Archived" },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Strategies</h1>
          <p className="mono-label mt-1.5 text-gray-400">
            <span className="text-gray-900">{counts.ALL}</span> TOTAL ·{" "}
            <span className="text-emerald-600">{counts.PUBLISHED}</span> LIVE
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 rounded-md bg-gray-900 px-4 hover:bg-gray-800"
          onClick={() => router.push(urls.adminNew())}
        >
          <Plus className="size-3.5" /> Create Strategy
        </Button>
      </div>

      {/* Tabs + search */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto scroll-thin rounded-lg border border-gray-200 bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={cn(
                "mono-label shrink-0 rounded-md px-3 py-1.5 text-[10px] transition-colors",
                statusTab === tab.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {tab.label.toUpperCase()}
              <span className={cn("ml-1.5", statusTab === tab.id ? "text-gray-400" : "text-gray-300")}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search strategies…"
            className="h-9 w-full rounded-md pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-900">No strategies match.</p>
            <p className="mt-1 text-xs text-gray-400">
              {search ? "Try a different search term." : "Create your first strategy to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[220px]">STRATEGY</TableHead>
                  <TableHead className="hidden md:table-cell">TYPE</TableHead>
                  <TableHead className="hidden lg:table-cell">MARKET FIT</TableHead>
                  <TableHead className="hidden sm:table-cell">RISK</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="hidden md:table-cell">UPDATED</TableHead>
                  <TableHead className="w-10 text-right" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(urls.adminEdit(s.id))}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="mono-label text-[9px] text-gray-300">{s.strategyId}</span>
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-gray-900">{s.name}</div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-gray-400">
                        /{s.slug}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-[13px] text-gray-600">{s.type}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {s.marketFit.regimes.map((r) => (
                          <RegimeChip key={r} regime={r} compact />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <RiskBadge risk={s.risk.overallRisk} compact />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-[11px] text-gray-400">{timeAgo(s.updatedAt)}</span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                            disabled={busyId === s.id}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(urls.adminEdit(s.id))}>
                            <Pencil className="size-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={urls.strategy(s.slug)} target="_blank">
                              <Eye className="size-3.5" /> View public page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicate(s)}>
                            <Copy className="size-3.5" /> Duplicate
                          </DropdownMenuItem>
                          {s.status === "ARCHIVED" ? (
                            <DropdownMenuItem onClick={() => setArchived(s, false)}>
                              <ArchiveRestore className="size-3.5" /> Unarchive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setArchived(s, true)}>
                              <Archive className="size-3.5" /> Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => setConfirmDelete(s)}
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <p className="mono-label mt-4 flex items-center gap-1.5 text-[9px] text-gray-300">
        <ArrowUpDown className="size-3" /> SORTED BY LAST UPDATE · CLICK A ROW TO EDIT
      </p>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold tracking-tight text-gray-900">
              Delete “{confirmDelete.name}” permanently?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              This removes the strategy and its entire revision history from the database. This
              cannot be undone. Archiving keeps it for future reference.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  const target = confirmDelete
                  setConfirmDelete(null)
                  await deleteStrategy(target)
                }}
              >
                <Trash2 className="size-3.5" /> Delete forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
