"use client"

import { useState } from "react"
import Link from "next/link"
import { useProtocols, useStrategies } from "@/hooks/use-strategy-data"
import { ArcProtocolIcon } from "@/components/archive/archive-icons"
import { ArchiveSkeleton } from "@/components/archive/archive-bits"
import { RegistryHeading } from "@/components/archive/foundations"
import { urls } from "@/lib/nav"

export function ProtocolBrowser() {
  const [open, setOpen] = useState("")
  const { data: protocols = [], isLoading, isError, refetch } = useProtocols()
  const { data: strategies = [] } = useStrategies()
  const list = protocols.filter(p => p.active && p.review?.status === "reviewed")
  const categories = [...new Set(list.flatMap(p => p.review!.categories))]
  return <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
    <RegistryHeading label="PROTOCOL REGISTRY" title="Protocols" description="Explore protocols by what they do. Open an entry for its products, supported networks, requirements and review scope. Inclusion is not a guarantee of safety." />
    <div className="space-y-10 py-10">
      {isLoading && <ArchiveSkeleton rows={2} />}
      {isError && <div role="alert" className="border border-white/10 p-5 text-arc-muted"><p>The protocol directory could not load.</p><button className="arc-mono mt-4 min-h-11 text-arc-green" onClick={() => refetch()}>TRY AGAIN →</button></div>}
      {categories.map(category => {
        const entries = list.filter(p => p.review!.categories.includes(category))
        const selected = entries.find(p => open === `${category}:${p.id}`)
        return <section key={category} aria-label={category}>
          <div className="mb-4 flex items-center gap-4"><h2 className="arc-mono text-arc-muted">{category.toUpperCase()}</h2><span className="h-px flex-1 bg-white/10" aria-hidden /><span className="arc-mono text-arc-dim">{entries.length}</span></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{entries.map(protocol => {
            const key = `${category}:${protocol.id}`
            return <button key={protocol.id} type="button" aria-expanded={open === key} aria-controls={open === key ? `protocol-${protocol.id}` : undefined} onClick={() => setOpen(open === key ? "" : key)} className={`group relative flex min-h-20 min-w-0 items-center gap-3.5 rounded-[6px] border bg-arc-surface/50 px-4 py-4 text-left transition-colors hover:border-white/25 hover:bg-arc-surface ${open === key ? "border-arc-green/50" : "border-white/[0.08]"}`}>
              <span className="flex size-10 shrink-0 items-center justify-center"><ArcProtocolIcon name={protocol.name} iconUrl={protocol.iconUrl} size={32} /></span>
              <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-arc-text">{protocol.name}</span><span className="mt-1 block text-[11px] leading-relaxed text-arc-dim">{protocol.description}</span></span>
              <span className="shrink-0 text-arc-muted" aria-hidden>{open === key ? "−" : "+"}</span>
            </button>
          })}</div>
          {selected && <div id={`protocol-${selected.id}`} className="mt-3 rounded-[6px] border border-white/10 bg-arc-surface/50 p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5"><h3 className="text-[22px] font-semibold text-arc-text">{selected.name}</h3>{selected.website && <a className="arc-mono inline-flex min-h-11 items-center text-arc-green" href={selected.website} target="_blank" rel="noreferrer">OFFICIAL WEBSITE ↗</a>}</div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div><h4 className="arc-mono text-arc-green">PRODUCTS / NETWORKS</h4><ul className="mt-4 space-y-4">{selected.review!.products.map(product => <li key={product.name}><p className="text-[14px] font-semibold text-arc-text">{product.name} · {product.networks.join(", ")}</p><p className="mt-2 text-[14px] leading-relaxed text-arc-muted">{product.purpose}</p></li>)}</ul></div>
              <div className="space-y-4">{[["REQUIREMENTS", selected.review!.prerequisites], ["EXIT", selected.review!.exit], ["RISKS", selected.review!.risks]].map(([label, text]) => <div key={label}><h4 className="arc-mono text-arc-dim">{label}</h4><p className="mt-2 text-[14px] leading-relaxed text-arc-muted">{text}</p></div>)}</div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-5"><p className="arc-mono text-arc-dim">REVIEWED {selected.review!.reviewedAt}</p><p className="mt-3 text-[13px] leading-relaxed text-arc-muted">{selected.review!.unresolved}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{selected.review!.docs.map((url, index) => <a className="arc-mono inline-flex min-h-11 items-center text-arc-green" href={url} target="_blank" rel="noreferrer" key={url}>OFFICIAL DOCUMENTATION {index + 1} ↗</a>)}</div></div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">{strategies.filter(s => s.education?.implementations.some(i => i.protocol === selected.slug)).map(s => <Link className="inline-flex min-h-11 items-center text-[14px] text-arc-green" key={s.id} href={urls.strategy(s.slug)}>{s.name} →</Link>)}</div>
          </div>}
        </section>
      })}
      {!isLoading && !isError && !list.length && <p className="py-16 text-center text-[14px] text-arc-muted">No reviewed protocols indexed yet.</p>}
    </div>
  </div>
}
