"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ObservationDTO } from "@/lib/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * OBSERVED PERFORMANCE — the live-data layer of a strategy record, rendered
 * as an archival instrument chart: a Matrix-green APY line over a quiet TVL
 * line, hairline grid, monospace scales and a crosshair for inspection.
 * Hand-built SVG (no chart library) so the look stays editorial — thin
 * strokes, no boxes, calibrated spacing.
 */

const GREEN = "#19c784"
const MUTED = "#8c929c"

type RangeKey = 30 | 90 | 0 // 0 = full series

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 30, label: "30D" },
  { key: 90, label: "90D" },
  { key: 0, label: "ALL" },
]

/** Measures the chart container so the SVG renders at exact pixel width. */
function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

function compactUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Expands [min, max] with 8% headroom; degenerate ranges get ±1 breathing room. */
function paddedDomain(min: number, max: number): [number, number] {
  if (min === max) return [min - 1, max + 1]
  const pad = (max - min) * 0.08
  return [min - pad, max + pad]
}

function linePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
}

// --- Section -------------------------------------------------------------------

export function ObservedPerformanceSection({
  observations,
}: {
  observations: ObservationDTO[]
}) {
  const [range, setRange] = useState<RangeKey>(90)

  const data = useMemo(
    () => (range === 0 ? observations : observations.slice(-range)),
    [observations, range]
  )

  const stats = useMemo(() => {
    if (!data.length) return null
    const apys = data.map((d) => d.apy)
    const latest = data[data.length - 1]
    const first = data[0]
    const mean = apys.reduce((sum, v) => sum + v, 0) / apys.length
    const tvlDelta = first.tvl > 0 ? ((latest.tvl - first.tvl) / first.tvl) * 100 : 0
    return {
      latestApy: latest.apy,
      mean,
      min: Math.min(...apys),
      max: Math.max(...apys),
      tvlNow: latest.tvl,
      tvlDelta,
      firstAt: first.recordedAt,
      lastAt: latest.recordedAt,
      source: latest.source,
      count: data.length,
    }
  }, [data])

  return (
    <section id="performance" aria-label="Observed performance">
      <div className="border-t border-white/10 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <div className="flex items-baseline gap-4">
            <span className="arc-mono text-arc-green">05</span>
            <h2 className="font-serif text-[1.55rem] font-light tracking-[-0.01em] text-arc-text">
              Observed Performance
            </h2>
          </div>
          {/* Range tabs — archival instrument calibration */}
          <div className="flex items-center gap-1" role="group" aria-label="Chart range">
            {RANGES.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                aria-pressed={range === option.key}
                className={cn(
                  "arc-mono border-b-2 px-2.5 pb-1 pt-0.5 text-[10px] transition-colors",
                  range === option.key
                    ? "border-arc-green text-arc-green"
                    : "border-transparent text-arc-dim hover:text-arc-muted"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-arc-muted">
          Daily readings from the live observation feed — observed APY and capital at work.
          Not a forecast: the record documents behaviour, the feed confirms it.
        </p>
      </div>

      {stats && (
        <>
          {/* Stats strip */}
          <dl className="mt-7 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
            <div className="bg-arc-surface px-4 py-3.5">
              <dt className="arc-mono text-[9px] text-arc-dim">OBSERVED APY</dt>
              <dd className="mt-1 font-mono text-[19px] font-medium tabular-nums text-arc-green">
                {stats.latestApy.toFixed(2)}%
              </dd>
            </div>
            <div className="bg-arc-surface px-4 py-3.5">
              <dt className="arc-mono text-[9px] text-arc-dim">
                MEAN · {range === 0 ? "ALL" : `${range}D`}
              </dt>
              <dd className="mt-1 font-mono text-[19px] font-medium tabular-nums text-arc-text">
                {stats.mean.toFixed(2)}%
              </dd>
            </div>
            <div className="bg-arc-surface px-4 py-3.5">
              <dt className="arc-mono text-[9px] text-arc-dim">RANGE</dt>
              <dd className="mt-1 font-mono text-[19px] font-medium tabular-nums text-arc-text">
                {stats.min.toFixed(1)}–{stats.max.toFixed(1)}%
              </dd>
            </div>
            <div className="bg-arc-surface px-4 py-3.5">
              <dt className="arc-mono text-[9px] text-arc-dim">TVL NOW</dt>
              <dd className="mt-1 font-mono text-[19px] font-medium tabular-nums text-arc-text">
                {compactUsd(stats.tvlNow)}
              </dd>
            </div>
            <div className="bg-arc-surface px-4 py-3.5">
              <dt className="arc-mono text-[9px] text-arc-dim">
                TVL · {range === 0 ? "ALL" : `${range}D`}
              </dt>
              <dd
                className={cn(
                  "mt-1 flex items-baseline gap-1.5 font-mono text-[19px] font-medium tabular-nums",
                  stats.tvlDelta >= 0 ? "text-arc-green" : "text-arc-red"
                )}
              >
                {stats.tvlDelta >= 0 ? "▲" : "▼"}
                {Math.abs(stats.tvlDelta).toFixed(1)}%
              </dd>
            </div>
          </dl>

          <InstrumentChart data={data} />

          {/* Provenance */}
          <p className="arc-mono mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9.5px] text-arc-dim">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-arc-green" aria-hidden />
              SOURCE · {stats.source.toUpperCase()} FEED
            </span>
            <span>
              {stats.count} DAILY READINGS · {shortDate(stats.firstAt)} → {shortDate(stats.lastAt)}
            </span>
            <span>LAST RECORDED {formatDate(stats.lastAt).toUpperCase()}</span>
          </p>
        </>
      )}
    </section>
  )
}

// --- The instrument chart --------------------------------------------------------

function InstrumentChart({ data }: { data: ObservationDTO[] }) {
  const [containerRef, width] = useContainerWidth<HTMLDivElement>()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const height = 250
  const padL = 46
  const padR = 60
  const padT = 14
  const padB = 28

  const geometry = useMemo(() => {
    if (!width || data.length < 2) return null
    const innerW = Math.max(width - padL - padR, 10)
    const innerH = height - padT - padB
    const [apyMin, apyMax] = paddedDomain(
      Math.min(...data.map((d) => d.apy)),
      Math.max(...data.map((d) => d.apy))
    )
    const [tvlMin, tvlMax] = paddedDomain(
      Math.min(...data.map((d) => d.tvl)),
      Math.max(...data.map((d) => d.tvl))
    )
    const step = data.length > 1 ? innerW / (data.length - 1) : innerW
    const x = (i: number) => padL + i * step
    const yApy = (v: number) => padT + (1 - (v - apyMin) / (apyMax - apyMin)) * innerH
    const yTvl = (v: number) => padT + (1 - (v - tvlMin) / (tvlMax - tvlMin)) * innerH

    const apyPoints = data.map((d, i) => ({ x: x(i), y: yApy(d.apy) }))
    const tvlPoints = data.map((d, i) => ({ x: x(i), y: yTvl(d.tvl) }))
    const baseline = padT + innerH
    const apyArea = `${linePath(apyPoints)} L${x(data.length - 1).toFixed(1)} ${baseline} L${padL} ${baseline} Z`

    // 4 APY gridlines/ticks + 3 TVL ticks + ~5 date ticks.
    const apyTicks = Array.from({ length: 4 }, (_, k) => {
      const v = apyMin + ((apyMax - apyMin) * k) / 3
      return { v, y: yApy(v) }
    })
    const tvlTicks = Array.from({ length: 3 }, (_, k) => {
      const v = tvlMin + ((tvlMax - tvlMin) * (k + 0.5)) / 3
      return { v, y: yTvl(v) }
    })
    const dateTickCount = Math.min(5, data.length)
    const dateTicks = Array.from({ length: dateTickCount }, (_, k) => {
      const i = Math.round(((data.length - 1) * k) / (dateTickCount - 1))
      return { i, x: x(i), label: shortDate(data[i].recordedAt) }
    })

    return {
      innerW, innerH, step, x, yApy, yTvl, baseline,
      apyPoints, tvlPoints, apyArea, apyTicks, tvlTicks, dateTicks,
    }
  }, [width, data])

  const hover = hoverIndex != null && geometry ? data[hoverIndex] : null
  const hoverPos =
    hoverIndex != null && geometry
      ? {
          x: geometry.apyPoints[hoverIndex].x,
          apyY: geometry.apyPoints[hoverIndex].y,
          tvlY: geometry.tvlPoints[hoverIndex].y,
        }
      : null

  const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!geometry) return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    const i = Math.round((px - padL) / geometry.step)
    setHoverIndex(Math.max(0, Math.min(data.length - 1, i)))
  }

  if (!geometry) {
    return (
      <div
        ref={containerRef}
        className="mt-6 flex h-[250px] items-center justify-center border border-white/10 bg-arc-surface/40"
        aria-label="Performance chart"
      >
        <p className="arc-mono text-[10px] text-arc-dim">INSUFFICIENT READINGS</p>
      </div>
    )
  }

  const tooltipLeft = hoverPos ? (hoverPos.x > width - 190 ? hoverPos.x - 178 : hoverPos.x + 14) : 0
  const tooltipTop = hoverPos ? Math.max(8, Math.min(hoverPos.apyY, hoverPos.tvlY) - 14) : 0

  return (
    <div ref={containerRef} className="relative mt-6">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Observed APY and TVL chart across ${data.length} daily readings`}
        className="block touch-pan-y select-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="arc-apy-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity="0.16" />
            <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Hairline grid */}
        {geometry.apyTicks.map((tick) => (
          <line
            key={`grid-${tick.y}`}
            x1={padL}
            x2={width - padR}
            y1={tick.y}
            y2={tick.y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        ))}

        {/* APY axis (left, green-dim) */}
        {geometry.apyTicks.map((tick) => (
          <text
            key={`apy-${tick.v}`}
            x={padL - 8}
            y={tick.y + 3}
            textAnchor="end"
            className="fill-arc-green/60 font-mono text-[9px] tabular-nums"
          >
            {tick.v.toFixed(1)}
          </text>
        ))}

        {/* TVL axis (right, dim) */}
        {geometry.tvlTicks.map((tick) => (
          <text
            key={`tvl-${tick.v}`}
            x={width - padR + 8}
            y={tick.y + 3}
            textAnchor="start"
            className="fill-arc-dim font-mono text-[9px] tabular-nums"
          >
            {compactUsd(tick.v)}
          </text>
        ))}

        {/* Date ticks */}
        {geometry.dateTicks.map((tick) => (
          <text
            key={`date-${tick.i}`}
            x={tick.x}
            y={height - 8}
            textAnchor={tick.i === 0 ? "start" : tick.i === data.length - 1 ? "end" : "middle"}
            className="fill-arc-dim font-mono text-[9px]"
          >
            {tick.label}
          </text>
        ))}

        {/* TVL — the quiet line */}
        <path
          d={linePath(geometry.tvlPoints)}
          fill="none"
          stroke={MUTED}
          strokeOpacity={0.55}
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* APY — the instrument line */}
        <path d={geometry.apyArea} fill="url(#arc-apy-fill)" />
        <path d={linePath(geometry.apyPoints)} fill="none" stroke={GREEN} strokeWidth={1.5} />

        {/* Crosshair */}
        {hoverPos && (
          <>
            <line
              x1={hoverPos.x}
              x2={hoverPos.x}
              y1={padT}
              y2={geometry.baseline}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1}
            />
            <circle cx={hoverPos.x} cy={hoverPos.tvlY} r={3} fill={MUTED} stroke="#080a0d" strokeWidth={1.5} />
            <circle cx={hoverPos.x} cy={hoverPos.apyY} r={4} fill={GREEN} stroke="#080a0d" strokeWidth={1.5} />
          </>
        )}
      </svg>

      {/* Inspection tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 min-w-[148px] border border-white/15 bg-arc-raised/95 px-3 py-2.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)]"
          style={{ left: tooltipLeft, top: tooltipTop }}
          role="status"
        >
          <p className="arc-mono text-[9px] text-arc-dim">
            {formatDate(hover.recordedAt).toUpperCase()}
          </p>
          <p className="arc-mono mt-1.5 flex items-center justify-between gap-4 text-[11px]">
            <span className="text-arc-muted">APY</span>
            <span className="tabular-nums text-arc-green">{hover.apy.toFixed(2)}%</span>
          </p>
          <p className="arc-mono mt-1 flex items-center justify-between gap-4 text-[11px]">
            <span className="text-arc-muted">TVL</span>
            <span className="tabular-nums text-arc-text">{compactUsd(hover.tvl)}</span>
          </p>
        </div>
      )}
    </div>
  )
}

// --- Header sparkline -------------------------------------------------------------

/** Compact 90-day APY sparkline — a quiet pulse next to the header snapshot. */
export function ApySparkline({
  observations,
  width = 88,
  height = 26,
}: {
  observations: ObservationDTO[]
  width?: number
  height?: number
}) {
  const points = observations.slice(-90)
  if (points.length < 2) return null

  const apys = points.map((p) => p.apy)
  const min = Math.min(...apys)
  const max = Math.max(...apys)
  const span = max === min ? 1 : max - min
  const step = width / (points.length - 1)
  const coords = points.map((p, i) => ({
    x: i * step,
    y: 2 + (1 - (p.apy - min) / span) * (height - 4),
  }))
  const path = linePath(coords)
  const area = `${path} L${width} ${height} L0 ${height} Z`
  const trendUp = apys[apys.length - 1] >= apys[0]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className="shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient id="arc-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0.25" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#arc-spark-fill)" />
      <path
        d={path}
        fill="none"
        stroke={trendUp ? GREEN : "#ef5b62"}
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
