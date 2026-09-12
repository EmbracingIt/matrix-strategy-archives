"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Eye, History, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RegimeChip, RiskBadge, StatusBadge } from "@/components/shared/badges"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionSurface } from "@/components/admin/form-controls"
import { useRevisions } from "@/hooks/use-strategy-data"
import { api } from "@/lib/api-client"
import type { RevisionDTO } from "@/lib/types"
import { formatDate } from "@/lib/format"

/**
 * Revision history — lists snapshots, lets the admin inspect any previous
 * state and restore it (the restore itself auto-snapshots the live state).
 */
export function RevisionHistory({ strategyId }: { strategyId: string }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: revisions, isLoading } = useRevisions(strategyId)
  const [viewing, setViewing] = useState<RevisionDTO | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<RevisionDTO | null>(null)
  const [restoring, setRestoring] = useState(false)

  const restore = async (revision: RevisionDTO) => {
    setConfirmRestore(null)
    setRestoring(true)
    try {
      await api.restoreRevision(strategyId, revision.id)
      await queryClient.invalidateQueries({ queryKey: ["strategies"] })
      await queryClient.invalidateQueries({ queryKey: ["strategy"] })
      await queryClient.invalidateQueries({ queryKey: ["revisions"] })
      toast.success(`Restored revision ${revision.revisionNumber}. The previous live state was snapshotted first.`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed")
    } finally {
      setRestoring(false)
    }
  }

  if (isLoading) {
    return (
      <SectionSurface title="History" description="Automatic snapshots taken before material edits.">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </SectionSurface>
    )
  }

  const list = revisions ?? []

  return (
    <SectionSurface
      title="History"
      description="Snapshots are created automatically before material edits. Restoring is safe — the current state is snapshotted first."
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="mono-label text-[10px] text-gray-400">
          {list.length} {list.length === 1 ? "REVISION" : "REVISIONS"}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white px-6 py-12 text-center">
          <History className="mx-auto size-5 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No revisions yet</p>
          <p className="mt-1 text-xs text-gray-400">
            The first material edit will snapshot the current state here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map((rev) => (
            <div
              key={rev.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 font-mono text-[10px] font-semibold text-gray-600">
                R{String(rev.revisionNumber).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-gray-900">
                    {rev.snapshot.name}
                  </span>
                  <StatusBadge status={rev.snapshot.status} />
                </div>
                <div className="mono-label mt-1 text-[9px] text-gray-400">
                  {formatDate(rev.createdAt)}
                  {rev.changeNote ? ` · ${rev.changeNote.toUpperCase()}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs"
                  onClick={() => setViewing(rev)}
                >
                  <Eye className="size-3" /> Inspect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-gray-900 px-2.5 text-xs text-gray-900 hover:bg-gray-900 hover:text-white"
                  onClick={() => setConfirmRestore(rev)}
                >
                  <RotateCcw className="size-3" /> Restore
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Snapshot inspector */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="border-b border-gray-100 px-5 py-4 text-left">
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
              <span className="font-mono text-[10px] font-medium text-emerald-600">
                R{String(viewing?.revisionNumber ?? 0).padStart(2, "0")}
              </span>
              {viewing?.snapshot.name}
            </DialogTitle>
            <p className="mono-label mt-1 text-[9px] text-gray-400">
              SNAPSHOT · {formatDate(viewing?.createdAt)}{" "}
              {viewing?.changeNote ? `· ${viewing.changeNote.toUpperCase()}` : ""}
            </p>
          </DialogHeader>
          {viewing && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-5 px-5 py-4">
                <SnapshotSection label="IDENTITY">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <SnapshotRow k="ID" v={viewing.snapshot.strategyId} mono />
                    <SnapshotRow k="TYPE" v={viewing.snapshot.type} />
                    <SnapshotRow k="STATUS" v={viewing.snapshot.status} />
                    <SnapshotRow k="SLUG" v={viewing.snapshot.slug} mono />
                  </div>
                </SnapshotSection>

                {viewing.snapshot.summary && (
                  <SnapshotSection label="SUMMARY">
                    <p className="text-sm leading-relaxed text-gray-600">{viewing.snapshot.summary}</p>
                  </SnapshotSection>
                )}

                <SnapshotSection label="MARKET FIT">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {viewing.snapshot.marketFit.regimes.map((r) => (
                      <RegimeChip key={r} regime={r} compact />
                    ))}
                    {viewing.snapshot.marketFit.regimes.length === 0 && (
                      <span className="text-xs text-gray-400">None recorded</span>
                    )}
                  </div>
                </SnapshotSection>

                <SnapshotSection label="RISK">
                  <div className="flex items-center gap-3">
                    <RiskBadge risk={viewing.snapshot.risk.overallRisk} compact />
                    <span className="font-mono text-xs text-gray-500">
                      LEV {viewing.snapshot.risk.leverageUsed ? "YES" : "NONE"} · LIQ{" "}
                      {viewing.snapshot.risk.liquidationExposure}
                    </span>
                  </div>
                </SnapshotSection>

                <SnapshotSection label={`STEPS · ${viewing.snapshot.steps.length}`}>
                  <ol className="space-y-1.5">
                    {viewing.snapshot.steps.map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="font-mono text-[10px] pt-1 text-gray-300">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-gray-700">{step.title}</span>
                      </li>
                    ))}
                  </ol>
                </SnapshotSection>

                <SnapshotSection label="COMPOSITION">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <SnapshotRow
                      k="DEPOSIT"
                      v={viewing.snapshot.depositAssets.map((a) => a.symbol).join(", ") || "—"}
                      mono
                    />
                    <SnapshotRow
                      k="REWARDS"
                      v={viewing.snapshot.rewardAssets.map((a) => a.symbol).join(", ") || "—"}
                      mono
                    />
                    <SnapshotRow
                      k="PROTOCOLS"
                      v={viewing.snapshot.protocols.map((p) => p.name).join(", ") || "—"}
                    />
                    <SnapshotRow
                      k="NETWORKS"
                      v={viewing.snapshot.networks.map((n) => n.name).join(", ") || "—"}
                    />
                  </div>
                </SnapshotSection>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore confirmation */}
      {confirmRestore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold tracking-tight text-gray-900">
              Restore revision {confirmRestore.revisionNumber}?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              The strategy definition will be rolled back to this snapshot. The current live state
              is automatically saved as a new revision first — so this action is reversible.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8" onClick={() => setConfirmRestore(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 bg-gray-900 hover:bg-gray-800"
                onClick={() => restore(confirmRestore)}
                disabled={restoring}
              >
                {restoring ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                Restore revision
              </Button>
            </div>
          </div>
        </div>
      )}
    </SectionSurface>
  )
}

function SnapshotSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono-label mb-2.5 text-[9px] text-gray-400">{label}</div>
      {children}
    </div>
  )
}

function SnapshotRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-gray-50 pb-1.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-300">{k}</span>
      <span className={`text-right text-[13px] text-gray-700 ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  )
}
