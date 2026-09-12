/**
 * Market simulation — pure functions, no database imports.
 *
 * Used by BOTH prisma/seed.ts (history generation) and the
 * POST /api/observations/simulate route (live-feed demo), so the seeded
 * series and runtime-simulated observations follow the same dynamics:
 * mean-reverting APY around a strategy baseline + slow TVL drift.
 */

/** Deterministic PRNG (mulberry32) — same seed, same series. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface WalkState {
  apy: number
  tvl: number
}

export interface SeriesPoint extends WalkState {
  /** Days before the series end (0 == most recent). */
  daysAgo: number
}

const round2 = (v: number) => Math.round(v * 100) / 100

/**
 * One mean-reverting random-walk step:
 * - APY pulls toward its baseline (12% pull) + noise scaled to the baseline
 * - TVL drifts with a mild upward bias and occasional drawdowns
 */
export function stepObservation(
  current: WalkState,
  baselineApy: number,
  rand: () => number
): WalkState {
  const apyDrift = (baselineApy - current.apy) * 0.12
  const apyNoise = (rand() - 0.5) * baselineApy * 0.3
  const apy = Math.max(0.1, round2(current.apy + apyDrift + apyNoise))

  const growth = rand()
  // 60% mild growth, 40% drawdown — slow net-positive drift, realistic shape.
  const tvlChange = growth < 0.6 ? current.tvl * (0.002 + rand() * 0.01) : -current.tvl * (0.003 + rand() * 0.012)
  const tvl = Math.max(1_000, Math.round(current.tvl + tvlChange))

  return { apy, tvl }
}

/**
 * Generates a full history series ending "now".
 * @param days      number of daily observations (e.g. 90)
 * @param startApy  APY the series starts from (further from baseline = more visible reversion)
 * @param baseline  APY the walk reverts toward (the strategy's typical yield)
 * @param startTvl  TVL at the start of the series
 * @param seed      PRNG seed (stable per strategy)
 */
export function generateObservationSeries(
  days: number,
  startApy: number,
  baseline: number,
  startTvl: number,
  seed: number
): SeriesPoint[] {
  const rand = mulberry32(seed)
  let state: WalkState = { apy: startApy, tvl: startTvl }
  const points: SeriesPoint[] = []
  for (let i = 0; i < days; i++) {
    state = stepObservation(state, baseline, rand)
    points.push({ ...state, daysAgo: days - 1 - i })
  }
  return points
}

/** Derives a walk baseline from recent observations (mean of the tail). */
export function deriveBaseline(points: WalkState[], window = 30): number {
  const tail = points.slice(-window)
  if (!tail.length) return 10
  return round2(tail.reduce((sum, p) => sum + p.apy, 0) / tail.length)
}
