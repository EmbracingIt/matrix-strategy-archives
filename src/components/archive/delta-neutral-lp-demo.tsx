import { ArrowUpRight, Coins, RotateCw } from "lucide-react"

const FEE_ESTIMATE = 6000 * (Math.pow(1.45, 3 / 12) - 1)
const LIQUIDITY = 1 / (1 / Math.sqrt(3000) - 1 / Math.sqrt(4500))
const LOWER_ETH = LIQUIDITY * (1 / Math.sqrt(2000) - 1 / Math.sqrt(4500))
const UPPER_USDC = LIQUIDITY * (Math.sqrt(4500) - Math.sqrt(2000))
const STARTING_TOTAL = 9000
const NO_HEDGE_LP_VALUE = LOWER_ETH * 2000
const NO_HEDGE_TOTAL = NO_HEDGE_LP_VALUE + 3000 + FEE_ESTIMATE
const NO_HEDGE_CHANGE = STARTING_TOTAL - NO_HEDGE_TOTAL
const usd = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const STEPS = [
  "Provide 1 ETH and 3,000 USDC to an ETH/USDC range from $2,000 to $4,500. At the $3,000 entry price, that is about $6,000 of LP principal; keep separate USDC for short margin.",
  "The LP initially holds 1 ETH, so open an isolated 1 ETH short with separate $3,000 USDC margin. Recalculate the LP's current ETH inventory, including ETH fees, and resize the short as that amount changes.",
  `For fee arithmetic only, assume 45% APY on the initial $6,000 LP value for three months while liquidity stays active: about $${usd(FEE_ESTIMATE)} gross fees. The same LP can earn those fees without a hedge; funding and hedge trades affect the net result.`,
]

const PATHS = [
  {
    title: "ETH falls to $2,000",
    text: `At the lower boundary, the LP inventory is about ${LOWER_ETH.toFixed(6)} ETH. A delta-matched hedge would target a short of similar ETH size, subject to available margin and execution. Below the range, LP fees stop; a short can lose if ETH rebounds.`,
  },
  {
    title: "ETH rises to $4,500",
    text: `At the upper boundary, the LP holds about $${usd(UPPER_USDC)} USDC and 0 ETH. The short target falls toward zero too. Reduce-only close or resize it as LP ETH inventory falls; an unadjusted short leaves net short exposure. Fees stop above the range.`,
  },
]

export function DeltaNeutralLpDemo() {
  return (
    <div className="mt-4 border-t border-white/10 pt-5">
      <header className="max-w-3xl">
        <p className="arc-mono text-[11px] text-arc-green">ILLUSTRATIVE EXAMPLE ONLY — NOT A LIVE RATE OR TOTAL-RETURN FORECAST</p>
        <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight text-arc-text">
          Example case: match an ETH short to a $6,000 liquidity position
        </h3>
        <p className="mt-3 text-sm text-arc-muted sm:text-base">
          A perpetual short is adjusted to offset the LP's current ETH amount. The aim is less directional exposure while collecting variable swap fees—not to increase fees or remove every risk.
        </p>
      </header>

      <section aria-label="Three steps" className="mt-9 grid gap-3 md:grid-cols-3">
        {STEPS.map((copy, index) => {
          const Icon = [Coins, ArrowUpRight, RotateCw][index]
          return (
            <div key={copy} className="flex gap-4 border border-white/10 bg-arc-surface p-5 sm:min-h-[150px]">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-arc-green/25 bg-arc-green/10 text-arc-green">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="arc-mono text-[10px] text-arc-dim">STEP 0{index + 1}</p>
                <p className="mt-2 text-sm leading-relaxed text-arc-text">{copy}</p>
              </div>
            </div>
          )
        })}
      </section>

      <p className="mt-4 border-l-2 border-arc-amber px-4 py-2 text-sm text-arc-muted">
        Keep the LP and derivative margin separate. An isolated short can be liquidated on its own margin even if the LP has value. Check funding: it can be paid or received, and changes over time.
      </p>

      <section aria-labelledby="delta-neutral-comparison" className="mt-8">
        <h4 id="delta-neutral-comparison" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">
          More ETH, but lower total capital without a hedge
        </h4>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-arc-muted">
          The objective is to pursue fee returns while reducing directional exposure, not to bet on ETH&apos;s direction. Without a hedge, the LP can accumulate ETH while its dollar value falls.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
          <article className="min-w-0 border border-white/10 bg-arc-surface p-4 sm:p-6">
            <p className="arc-mono text-[10px] text-arc-muted sm:text-[11px]">STARTING TOTAL CAPITAL</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text sm:text-5xl">$9,000</p>
            <p className="mt-2 text-sm text-arc-muted">$6,000 LP (1 ETH + $3,000 USDC) and $3,000 USDC held separately as a reserve for margin in the hedged version.</p>
          </article>
          <article className="min-w-0 border border-arc-amber/25 bg-arc-amber/[0.035] p-4 sm:p-6">
            <p className="arc-mono text-[10px] text-arc-amber sm:text-[11px]">NO HEDGE · ETH FALLS TO $2,000</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text sm:text-5xl">≈ ${usd(NO_HEDGE_TOTAL)}</p>
            <p className="mt-2 text-sm text-arc-muted">Total includes 2.224745 ETH worth ≈ ${usd(NO_HEDGE_LP_VALUE)}, the $3,000 cash reserve and ≈ ${usd(FEE_ESTIMATE)} assumed gross fees. Down ≈ ${usd(NO_HEDGE_CHANGE)} before costs.</p>
          </article>
        </div>
        <p className="mt-4 border-l-2 border-arc-green/50 px-4 py-2 text-sm text-arc-muted">
          The LP accumulated about 1.224745 more ETH, but total capital still fell. A matched hedge would target a short of about {LOWER_ETH.toFixed(6)} ETH at this boundary to offset the LP's ETH exposure. Its full result depends on each rebalance, funding and costs, so no hedged total is claimed here.
        </p>
        <p className="mt-4 text-center text-sm text-arc-muted">
          The 45% APY is a hypothetical constant-rate assumption for three active months, not a live rate or forecast. Fees may be lower, and may not cover the capital decline or costs.
        </p>
      </section>

      <section aria-labelledby="delta-neutral-paths" className="mt-8">
        <h4 id="delta-neutral-paths" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">How the hedge target changes</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PATHS.map((path) => (
            <article key={path.title} className="border border-white/10 bg-arc-surface p-4 sm:p-5">
              <h5 className="font-semibold leading-snug text-arc-text">{path.title}</h5>
              <p className="mt-3 text-sm leading-relaxed text-arc-muted">{path.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Assumptions and risks" className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm leading-relaxed text-arc-dim">
        <p><span className="font-medium text-arc-muted">Fee arithmetic: </span>$6,000 × (1.45^(3/12) − 1) ≈ ${usd(FEE_ESTIMATE)}. This applies a hypothetical constant 45% APY to the initial LP value for three months. Realized fees depend on volume, active liquidity and time in range; fees are paid separately and do not auto-compound.</p>
        <p><span className="font-medium text-arc-muted">What is excluded: </span>The example does not calculate full portfolio value or profit. Perpetual P&amp;L depends on each hedge adjustment and its execution price; funding, slippage, fees, gas and liquidation can materially change the result.</p>
        <p><span className="font-medium text-arc-muted">Costs and liquidation: </span>A short may pay or receive funding as the rate changes. Maintain margin and monitor the exchange's mark price and liquidation rules. LP assets do not automatically protect isolated margin.</p>
      </section>
    </div>
  )
}
