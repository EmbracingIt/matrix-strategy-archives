"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowUpRight, Pencil, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
import { ProtocolIcon } from "@/components/shared/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { useProtocols } from "@/hooks/use-strategy-data"
import { api } from "@/lib/api-client"
import { slugify } from "@/lib/strategy-form-utils"
import type { ProtocolDTO } from "@/lib/types"

interface ProtocolForm {
  name: string
  slug: string
  website: string
  description: string
  iconUrl: string
  active: boolean
}

const EMPTY: ProtocolForm = { name: "", slug: "", website: "", description: "", iconUrl: "", active: true }

/** Admin protocol registry. */
export function ProtocolManager() {
  const queryClient = useQueryClient()
  const { data: protocols, isLoading } = useProtocols()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProtocolDTO | null>(null)
  const [form, setForm] = useState<ProtocolForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (protocols ?? []).filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.slug.includes(q)
    )
  }, [protocols, search])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  const openEdit = (protocol: ProtocolDTO) => {
    setEditing(protocol)
    setForm({
      name: protocol.name,
      slug: protocol.slug,
      website: protocol.website ?? "",
      description: protocol.description ?? "",
      iconUrl: protocol.iconUrl ?? "",
      active: protocol.active,
    })
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.")
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      iconUrl: form.iconUrl.trim() || null,
      active: form.active,
    }
    try {
      if (editing) {
        await api.updateProtocol(editing.id, payload)
        toast.success(`${payload.name} updated.`)
      } else {
        await api.createProtocol(payload)
        toast.success(`${payload.name} added.`)
      }
      await queryClient.invalidateQueries({ queryKey: ["protocols"] })
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (protocol: ProtocolDTO) => {
    try {
      await api.updateProtocol(protocol.id, {
        name: protocol.name,
        slug: protocol.slug,
        website: protocol.website,
        description: protocol.description,
        iconUrl: protocol.iconUrl,
        active: !protocol.active,
      })
      await queryClient.invalidateQueries({ queryKey: ["protocols"] })
      toast.success(`${protocol.name} ${protocol.active ? "deactivated" : "activated"}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Protocols</h1>
          <p className="mono-label mt-1.5 text-gray-400">
            <span className="text-gray-900">{protocols?.length ?? "—"}</span> PROTOCOLS INDEXED
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search protocols…"
              className="h-9 w-52 rounded-md pl-9 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="h-9 rounded-md bg-gray-900 px-4 hover:bg-gray-800"
            onClick={openCreate}
          >
            <Plus className="size-3.5" /> Create Protocol
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
                  <TableHead>PROTOCOL</TableHead>
                  <TableHead className="hidden lg:table-cell">DESCRIPTION</TableHead>
                  <TableHead className="hidden md:table-cell">WEBSITE</TableHead>
                  <TableHead>STRATEGIES</TableHead>
                  <TableHead>ACTIVE</TableHead>
                  <TableHead className="w-10 text-right" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ProtocolIcon name={p.name} iconUrl={p.iconUrl} size={26} />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                          <div className="font-mono text-[11px] text-gray-400">/{p.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[280px] lg:table-cell">
                      <span className="block truncate text-[13px] text-gray-500">
                        {p.description ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.website ? (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs text-gray-500 hover:text-gray-900"
                        >
                          {new URL(p.website).hostname.replace("www.", "")}
                          <ArrowUpRight className="size-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-500">{p.strategyCount ?? 0}</span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={p.active}
                        onCheckedChange={() => toggleActive(p)}
                        aria-label={`Toggle ${p.name} active`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-gray-400 hover:text-gray-900"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-400">
                      No protocols match.
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
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Create protocol"}</DialogTitle>
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
                  placeholder="Uniswap"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  SLUG
                </Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="uniswap"
                  className="h-9 font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                WEBSITE
              </Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://uniswap.org"
                className="h-9 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                DESCRIPTION
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description shown on protocol cards…"
                rows={3}
                className="text-sm"
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
                <div className="text-xs text-gray-400">Inactive protocols are hidden from new selections.</div>
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
              {editing ? "Save changes" : "Create protocol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
