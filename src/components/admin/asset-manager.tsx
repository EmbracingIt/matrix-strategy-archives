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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AssetIcon } from "@/components/shared/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { useAssets } from "@/hooks/use-strategy-data"
import { api } from "@/lib/api-client"
import { ASSET_CATEGORIES } from "@/lib/format"
import type { AssetDTO } from "@/lib/types"

interface AssetForm {
  symbol: string
  name: string
  coingeckoId: string
  category: string
  iconUrl: string
  active: boolean
}

const EMPTY: AssetForm = { symbol: "", name: "", coingeckoId: "", category: "", iconUrl: "", active: true }

/** Admin asset registry — the reusable token reference used by strategies. */
export function AssetManager() {
  const queryClient = useQueryClient()
  const { data: assets, isLoading } = useAssets()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AssetDTO | null>(null)
  const [form, setForm] = useState<AssetForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (assets ?? []).filter(
      (a) =>
        !q ||
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.coingeckoId ?? "").toLowerCase().includes(q)
    )
  }, [assets, search])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  const openEdit = (asset: AssetDTO) => {
    setEditing(asset)
    setForm({
      symbol: asset.symbol,
      name: asset.name,
      coingeckoId: asset.coingeckoId ?? "",
      category: asset.category ?? "",
      iconUrl: asset.iconUrl ?? "",
      active: asset.active,
    })
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.symbol.trim() || !form.name.trim()) {
      toast.error("Symbol and name are required.")
      return
    }
    setSaving(true)
    const payload = {
      symbol: form.symbol.trim(),
      name: form.name.trim(),
      coingeckoId: form.coingeckoId.trim() || null,
      category: form.category || null,
      iconUrl: form.iconUrl.trim() || null,
      active: form.active,
    }
    try {
      if (editing) {
        await api.updateAsset(editing.id, payload)
        toast.success(`${payload.symbol} updated.`)
      } else {
        await api.createAsset(payload)
        toast.success(`${payload.symbol} added to the registry.`)
      }
      await queryClient.invalidateQueries({ queryKey: ["assets"] })
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (asset: AssetDTO) => {
    try {
      await api.updateAsset(asset.id, {
        symbol: asset.symbol,
        name: asset.name,
        coingeckoId: asset.coingeckoId,
        category: asset.category,
        iconUrl: asset.iconUrl,
        active: !asset.active,
      })
      await queryClient.invalidateQueries({ queryKey: ["assets"] })
      toast.success(`${asset.symbol} ${asset.active ? "deactivated" : "activated"}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Assets</h1>
          <p className="mono-label mt-1.5 text-gray-400">
            <span className="text-gray-900">{assets?.length ?? "—"}</span> TOKENS · REUSED ACROSS
            STRATEGIES
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets…"
              className="h-9 w-52 rounded-md pl-9 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="h-9 rounded-md bg-gray-900 px-4 hover:bg-gray-800"
            onClick={openCreate}
          >
            <Plus className="size-3.5" /> Create Asset
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ASSET</TableHead>
                  <TableHead className="hidden md:table-cell">COINGECKO ID</TableHead>
                  <TableHead className="hidden sm:table-cell">CATEGORY</TableHead>
                  <TableHead>STRATEGIES</TableHead>
                  <TableHead>ACTIVE</TableHead>
                  <TableHead className="w-10 text-right" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <AssetIcon symbol={a.symbol} category={a.category} iconUrl={a.iconUrl} size={26} />
                        <div>
                          <div className="font-mono text-sm font-semibold text-gray-900">{a.symbol}</div>
                          <div className="text-[11px] text-gray-400">{a.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-xs text-gray-500">{a.coingeckoId ?? "—"}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-[13px] capitalize text-gray-600">
                        {(a.category ?? "—").replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-500">{a.strategyCount ?? 0}</span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={a.active}
                        onCheckedChange={() => toggleActive(a)}
                        aria-label={`Toggle ${a.symbol} active`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-gray-400 hover:text-gray-900"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-400">
                      No assets match.
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
            <DialogTitle>{editing ? `Edit ${editing.symbol}` : "Create asset"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  SYMBOL
                </Label>
                <Input
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                  placeholder="ETH"
                  className="h-9 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  CATEGORY
                </Label>
                <Select
                  value={form.category || "other"}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                NAME
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ethereum"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                COINGECKO ID <span className="text-gray-300">(reserved for future sync)</span>
              </Label>
              <Input
                value={form.coingeckoId}
                onChange={(e) => setForm({ ...form, coingeckoId: e.target.value })}
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
                <div className="text-xs text-gray-400">Inactive assets are hidden from new selections.</div>
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
              {editing ? "Save changes" : "Create asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
