"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Archive, ArrowLeft, Check, ExternalLink, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/badges"
import { Skeleton } from "@/components/ui/skeleton"
import {
  OverviewSection,
  InstructionsSection,
  MarketFitSection,
  AssetsSection,
  PlatformsSection,
  RiskSection,
  RequirementsSection,
  ReferencesSection,
  StatusSection,
} from "@/components/admin/form-sections"
import { SectionSurface } from "@/components/admin/form-controls"
import { RevisionHistory } from "@/components/admin/revision-history"
import { useMeta, useStrategy } from "@/hooks/use-strategy-data"
import { api } from "@/lib/api-client"
import { urls } from "@/lib/nav"
import {
  dtoToFormState,
  emptyFormState,
  formSignature,
  formStateToInput,
  type StrategyFormState,
} from "@/lib/strategy-form"
import type { StrategyStatus } from "@/lib/types"
import { STATUS_LABELS } from "@/lib/format"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "overview", label: "Overview", num: "01" },
  { id: "instructions", label: "Instructions", num: "02" },
  { id: "market-fit", label: "Market Fit", num: "03" },
  { id: "assets", label: "Assets", num: "04" },
  { id: "platforms", label: "Platforms", num: "05" },
  { id: "risk", label: "Risk", num: "06" },
  { id: "requirements", label: "Requirements", num: "07" },
  { id: "references", label: "References", num: "08" },
  { id: "status", label: "Status", num: "09" },
] as const

const HISTORY_TAB = { id: "history", label: "History", num: "10" } as const

type TabId = (typeof TABS)[number]["id"] | "history"

/** Editor chrome offsets: admin bar (h-14) + editor header (h-[76px]). */
const HEADER_TOTAL = "top-[132px]"

/**
 * Admin strategy editor — a document-style surface with its own sticky header
 * (back link, title, save/publish actions) and a two-column layout:
 * sticky section navigation on the left, one focused form section on the right.
 */
export function StrategyForm({
  strategyId,
  isNew,
}: {
  strategyId?: string
  isNew: boolean
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: meta } = useMeta()
  const { data: existing, isLoading } = useStrategy(isNew ? null : (strategyId ?? null))

  const [form, setForm] = useState<StrategyFormState>(emptyFormState())
  const [initialSignature, setInitialSignature] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [saving, setSaving] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Hydrate form state from the loaded strategy (or start empty for new).
  useEffect(() => {
    if (isNew && !hydrated) {
      const fresh = emptyFormState()
      setForm(fresh)
      setInitialSignature(formSignature(fresh))
      setHydrated(true)
    } else if (!isNew && existing && !hydrated) {
      const fs = dtoToFormState(existing)
      setForm(fs)
      setInitialSignature(formSignature(fs))
      setHydrated(true)
    }
  }, [isNew, existing, hydrated])

  const update = useCallback((patch: Partial<StrategyFormState>) => {
    setForm((f) => ({ ...f, ...patch }))
  }, [])

  const dirty = hydrated && formSignature(form) !== initialSignature

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["strategies"] })
    await queryClient.invalidateQueries({ queryKey: ["strategy"] })
    await queryClient.invalidateQueries({ queryKey: ["revisions"] })
    await queryClient.invalidateQueries({ queryKey: ["meta"] })
  }

  const save = useCallback(
    async (statusOverride?: StrategyStatus) => {
      if (!form.name.trim()) {
        toast.error("Strategy name is required.")
        setActiveTab("overview")
        return
      }
      if (!form.type.trim()) {
        toast.error("Strategy type is required.")
        setActiveTab("overview")
        return
      }
      const input = formStateToInput({ ...form, status: statusOverride ?? form.status })
      setSaving(true)
      try {
        if (isNew) {
          const created = await api.createStrategy(input)
          await invalidateAll()
          toast.success(`${created.strategyId} created as ${STATUS_LABELS[created.status].toLowerCase()}`)
          router.push(urls.adminEdit(created.id))
        } else if (strategyId) {
          const updated = await api.updateStrategy(strategyId, input)
          await invalidateAll()
          const fs = dtoToFormState(updated)
          setForm(fs)
          setInitialSignature(formSignature(fs))
          toast.success(`${updated.strategyId} saved`)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed")
      } finally {
        setSaving(false)
      }
    },
    [form, isNew, strategyId]
  )

  // Cmd/Ctrl+S saves.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const archive = async () => {
    setConfirmArchive(false)
    try {
      await save("ARCHIVED")
      toast.success("Strategy archived. It is retained in the database but hidden publicly.")
    } catch {
      /* save already toasts errors */
    }
  }

  const deleteStrategy = async () => {
    if (!strategyId) return
    setConfirmDelete(false)
    try {
      await api.deleteStrategy(strategyId)
      await invalidateAll()
      toast.success("Strategy permanently deleted.")
      router.push(urls.admin("strategies"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    }
  }

  if (!isNew && isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1152px] px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 pt-8">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </div>
      </div>
    )
  }
  if (!isNew && !existing) {
    return (
      <div className="mx-auto w-full max-w-[1152px] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">Strategy not found.</p>
          <Link href={urls.admin("strategies")} className="mt-3 inline-block text-sm text-red-600 underline">
            Back to strategies
          </Link>
        </div>
      </div>
    )
  }

  const sectionProps = { form, update, knownTypes: meta?.types.map((t) => t.name) ?? [] }

  // Header action cluster, context-sensitive.
  const primaryAction = () => {
    if (isNew) {
      return (
        <Button
          size="sm"
          className="h-9 rounded-md bg-gray-900 px-4 font-medium hover:bg-gray-800"
          onClick={() => save()}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          <span className="hidden sm:inline">Create strategy</span>
          <span className="sm:hidden">Create</span>
        </Button>
      )
    }
    if (form.status === "DRAFT") {
      return (
        <Button
          size="sm"
          className="h-9 rounded-md bg-gray-900 px-4 font-medium hover:bg-gray-800"
          onClick={() => save("PUBLISHED")}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Publish
        </Button>
      )
    }
    return (
      <Button
        size="sm"
        className="h-9 rounded-md bg-gray-900 px-4 font-medium hover:bg-gray-800"
        onClick={() => save()}
        disabled={saving}
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        <span className="hidden sm:inline">Save changes</span>
        <span className="sm:hidden">Save</span>
      </Button>
    )
  }

  const secondaryAction = () => {
    if (isNew || form.status === "DRAFT") {
      return (
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-md px-4 font-medium"
          onClick={() => (isNew ? save("DRAFT") : save())}
          disabled={saving}
        >
          Save draft
        </Button>
      )
    }
    if (form.status === "PUBLISHED" && form.slug) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 rounded-md px-4 font-medium"
          asChild
        >
          <Link href={urls.strategy(form.slug)} target="_blank">
            View <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      )
    }
    if (form.status === "ARCHIVED") {
      return (
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-md px-4 font-medium"
          onClick={() => save("DRAFT")}
          disabled={saving}
        >
          Unarchive
        </Button>
      )
    }
    return null
  }

  return (
    <div className="pb-20">
      {/* Editor header */}
      <div className="sticky top-14 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[76px] w-full max-w-[1152px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href={urls.admin("strategies")}
            className="mono-label flex shrink-0 items-center gap-1.5 text-gray-400 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden lg:inline">STRATEGIES</span>
          </Link>
          <span className="hidden h-6 w-px shrink-0 bg-gray-200 lg:block" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="mono-label truncate text-[10px] text-gray-400">
              {isNew ? "NEW STRATEGY" : form.strategyId || "EDIT STRATEGY"}
            </div>
            <h1 className="truncate text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
              {form.name || "Untitled strategy"}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {/* Saved state */}
            <span className="hidden items-center gap-1.5 text-xs lg:inline-flex" aria-live="polite">
              {dirty ? (
                <>
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span className="text-amber-600">Unsaved changes</span>
                </>
              ) : hydrated && !isNew ? (
                <>
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-400">Saved</span>
                </>
              ) : null}
            </span>
            {!isNew && form.status && (
              <StatusBadge status={form.status} className="hidden xl:inline-flex" />
            )}
            {secondaryAction()}
            {primaryAction()}
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className="mx-auto w-full max-w-[1152px] px-4 pb-4 pt-8 sm:px-6 lg:px-8">
        {/* Mobile: horizontal scrollable section tabs */}
        <div
          className={`sticky ${HEADER_TOTAL} z-20 -mx-4 border-b border-gray-200/70 bg-[#F9FAFB]/95 px-4 py-2.5 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:hidden`}
        >
          <div className="flex gap-1.5 overflow-x-auto scroll-thin">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 ring-1 ring-gray-200 hover:text-gray-900"
                )}
              >
                {tab.label}
              </button>
            ))}
            {!isNew && (
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "history"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 ring-1 ring-gray-200 hover:text-gray-900"
                )}
              >
                History
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
          {/* Desktop: sticky section navigation */}
          <nav
            className={`hidden self-start lg:sticky lg:block ${HEADER_TOTAL}`}
            aria-label="Form sections"
          >
            <div className="space-y-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      activeTab === tab.id ? "text-gray-500" : "text-gray-300"
                    )}
                  >
                    {tab.num}
                  </span>
                  {tab.label}
                  {tab.id === "status" && dirty && (
                    <span className="ml-auto size-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              ))}
            </div>

            {!isNew && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors",
                    activeTab === "history"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      activeTab === "history" ? "text-gray-500" : "text-gray-300"
                    )}
                  >
                    {HISTORY_TAB.num}
                  </span>
                  {HISTORY_TAB.label}
                </button>
              </div>
            )}

            <p className="mono-label mt-5 px-3 text-[8px] leading-relaxed text-gray-300">
              CMD/CTRL + S TO SAVE
            </p>
          </nav>

          {/* Active section — single focused panel */}
          <div className="min-w-0 max-w-[800px]">
            {activeTab === "overview" && <OverviewSection {...sectionProps} />}
            {activeTab === "instructions" && <InstructionsSection {...sectionProps} />}
            {activeTab === "market-fit" && <MarketFitSection {...sectionProps} />}
            {activeTab === "assets" && <AssetsSection {...sectionProps} />}
            {activeTab === "platforms" && <PlatformsSection {...sectionProps} />}
            {activeTab === "risk" && <RiskSection {...sectionProps} />}
            {activeTab === "requirements" && <RequirementsSection {...sectionProps} />}
            {activeTab === "references" && <ReferencesSection {...sectionProps} />}
            {activeTab === "status" && (
              <StatusSection {...sectionProps}>
                <SectionSurface
                  title="Actions"
                  description="Shortcuts for the most common transitions."
                >
                  <div className="flex flex-wrap gap-2">
                    {form.status !== "DRAFT" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => save("DRAFT")}
                        disabled={saving}
                      >
                        Save as Draft
                      </Button>
                    )}
                    {form.status !== "PUBLISHED" && (
                      <Button
                        size="sm"
                        className="h-9 bg-gray-900 hover:bg-gray-800"
                        onClick={() => save("PUBLISHED")}
                        disabled={saving}
                      >
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => save()}
                      disabled={saving}
                    >
                      Save changes
                    </Button>
                  </div>

                  <div className="mt-7 border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900">Danger zone</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      Archiving hides the strategy but keeps it and its history. Deleting removes
                      it permanently, including revisions.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.status !== "ARCHIVED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setConfirmArchive(true)}
                        >
                          <Archive className="size-3.5" /> Archive strategy
                        </Button>
                      )}
                      {!isNew && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setConfirmDelete(true)}
                        >
                          <Trash2 className="size-3.5" /> Delete permanently
                        </Button>
                      )}
                    </div>
                  </div>
                </SectionSurface>
              </StatusSection>
            )}
            {activeTab === "history" && !isNew && strategyId && (
              <RevisionHistory strategyId={strategyId} />
            )}
          </div>
        </div>
      </div>

      {/* Archive confirmation */}
      {confirmArchive && (
        <ConfirmOverlay
          title="Archive this strategy?"
          description={`“${form.name}” will be removed from public browsing but stays in the database with all revisions. You can unarchive it later from the strategies table.`}
          confirmLabel="Archive"
          onCancel={() => setConfirmArchive(false)}
          onConfirm={archive}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmOverlay
          title={`Delete “${form.name}” permanently?`}
          description="This removes the strategy AND its revision history from the database. This cannot be undone. Consider archiving instead."
          confirmLabel="Delete forever"
          destructive
          onCancel={() => setConfirmDelete(false)}
          onConfirm={deleteStrategy}
        />
      )}
    </div>
  )
}

/** Lightweight modal-style confirmation overlay. */
function ConfirmOverlay({
  title,
  description,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold tracking-tight text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className={cn(
              "h-9",
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
