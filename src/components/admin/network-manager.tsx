"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pencil, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NetworkIcon } from "@/components/shared/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { useNetworks } from "@/hooks/use-strategy-data"
import { api } from "@/lib/api-client"
import { slugify } from "@/lib/strategy-form-utils"
import type { NetworkDTO } from "@/lib/types"

interface NetworkForm {
  name: string
  slug: string
  chainId: string
  iconUrl: string
  active: boolean
}

const EMPTY: NetworkForm = { name: "", slug: "", chainId: "", iconUrl: "", active: true }

/** Admin network registry. */
export function NetworkManager() {
  const queryClient = useQueryClient()
  const { data: networks, isLoading } = useNetworks()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NetworkDTO | null>(null)
  const [form, setForm] = useState<NetworkForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (networks ?? []).filter(
      (n) => !q || n.name.toLowerCase().includes(q) || n.slug.includes(q)
    )
  }, [networks, search])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  const openEdit = (network: NetworkDTO) => {
    setEditing(network)
    setForm({
      name: network.name,
      slug: network.slug,
      chainId: network.chainId?.toString() ?? "",
      iconUrl: network.iconUrl ?? "",
      active: network.active,
    })
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.")
      return
    }
    const chainId = form.chainId.trim() ? Number.parseInt(form.chainId.trim(), 10) : null
    if (chainId !== null && Number.isNaN(chainId)) {
      toast.error("Chain ID must be a number.")
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      chainId,
      iconUrl: form.iconUrl.trim() || null,
      active: form.active,
    }
    try {
      if (editing) {
        await api.updateNetwork(editing.id, payload)
        toast.success(`${payload.name} updated.`)
      } else {
        await api.createNetwork(payload)
        toast.success(`${payload.name} added.`)
      }
      await queryClient.invalidateQueries({ queryKey: ["networks"] })
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (network: NetworkDTO) => {
    try {
      await api.updateNetwork(network.id, {
        name: network.name,
        slug: network.slug,
        chainId: network.chainId,
        iconUrl: network.iconUrl,
        active: !network.active,
      })
      await queryClient.invalidateQueries({ queryKey: ["networks"] })
      toast.success(`${network.name} ${network.active ? "deactivated" : "activated"}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Networks</h1>
          <p className="mono-label mt-1.5 text-gray-400">
            <span className="text-gray-900">{networks?.length ?? "—"}</span> NETWORKS INDEXED
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search networks…"
              className="h-9 w-52 rounded-md pl-9 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="h-9 rounded-md bg-gray-900 px-4 hover:bg-gray-800"
            onClick={openCreate}
          >
            <Plus className="size-3.5" /> Create Network
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>NETWORK</TableHead>
                  <TableHead>CHAIN ID</TableHead>
                  <TableHead>STRATEGIES</TableHead>
                  <TableHead>ACTIVE</TableHead>
                  <TableHead className="w-10 text-right" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <NetworkIcon name={n.name} iconUrl={n.iconUrl} size={26} />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{n.name}</div>
                          <div className="font-mono text-[11px] text-gray-400">/{n.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-500">
                        {n.chainId ?? "non-EVM"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-500">{n.strategyCount ?? 0}</span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={n.active}
                        onCheckedChange={() => toggleActive(n)}
                        aria-label={`Toggle ${n.name} active`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-gray-400 hover:text-gray-900"
                        onClick={() => openEdit(n)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-gray-400">
                      No networks match.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Create network"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  NAME
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: editing ? form.slug : slugify(e.target.value),
                    })
                  }
                  placeholder="Ethereum"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  CHAIN ID <span className="text-gray-300">(EVM only)</span>
                </Label>
                <Input
                  value={form.chainId}
                  onChange={(e) => setForm({ ...form, chainId: e.target.value.replace(/\D/g, "") })}
                  placeholder="1"
                  className="h-9 font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                SLUG
              </Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="ethereum"
                className="h-9 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                ICON URL <span className="text-gray-300">(optional — monogram fallback)</span>
              </Label>
              <Input
                value={form.iconUrl}
                onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
                placeholder="https://…"
                className="h-9 font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-gray-900">Active</div>
                <div className="text-xs text-gray-400">Inactive networks are hidden from new selections.</div>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 bg-gray-900 hover:bg-gray-800"
              onClick={submit}
              disabled={saving}
            >
              {editing ? "Save changes" : "Create network"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
