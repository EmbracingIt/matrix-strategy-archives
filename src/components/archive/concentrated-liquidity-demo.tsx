import Link from "next/link"

const LOWER = 2400
const UPPER = 3600
const ENTRY = 3000
const LIQUIDITY = 3000 / (Math.sqrt(UPPER) - Math.sqrt(LOWER))
const startingAmounts = {
  eth: LIQUIDITY * (1 / Math.sqrt(ENTRY) - 1 / Math.sqrt(UPPER)),
  usdc: LIQUIDITY * (Math.sqrt(ENTRY) - Math.sqrt(LOWER)),
}
const STARTING_VALUE = startingAmounts.eth * ENTRY + startingAmounts.usdc
const HODL_ETH = STARTING_VALUE / ENTRY
const format = (value: number, digits = 2) => value.toLocaleString("en-US", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
})

function positionAt(price: number) {
  const bounded = Math.max(LOWER, Math.min(UPPER, price))
  const eth = LIQUIDITY * (1 / Math.sqrt(bounded) - 1 / Math.sqrt(UPPER))
  const usdc = LIQUIDITY * (Math.sqrt(bounded) - Math.sqrt(LOWER))
  return { eth, usdc, value: eth * price + usdc }
}

const scenarios = [
  { price: UPPER, label: "ETH rises to $3,600" },
  { price: 2000, label: "ETH falls below range to $2,000" },
  { price: ENTRY, label: "ETH stays at $3,000" },
].map(({ price, label }) => {
  const position = positionAt(price)
  const hodlValue = HODL_ETH * price
  const gap = hodlValue - position.value
  return {
    price,
    label,
    position,
    hodlValue,
    gap,
    comparison: gap > 0
      ? `LP is $${format(gap)} below ETH-only HODL`
      : gap < 0
        ? `LP is $${format(-gap)} above ETH-only HODL`
        : "Same value as ETH-only HODL",
  }
})

const upside = scenarios[0]
const feeRates = [30, 45, 60].map((apy) => ({
  apy,
  days: Math.ceil(upside.gap / (STARTING_VALUE * (apy / 100) / 365)),
}))

export function ConcentratedLiquidityDemo() {
  return (
    <div className="mt-4 border-t border-white/10 pt-5">
      <header className="max-w-3xl">
        <p className="arc-mono text-[11px] text-arc-green">ILLUSTRATIVE EXAMPLE ONLY — NOT A FORECAST OR LIVE FEE RATE</p>
        <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight text-arc-text">
          Example case: ETH/USDC liquidity from $2,400 to $3,600
        </h3>
        <p className="mt-3 text-sm text-arc-muted sm:text-base">
          At ETH = $3,000, this range holds about {format(startingAmounts.eth, 4)} ETH and ${format(startingAmounts.usdc)} USDC, worth ${format(STARTING_VALUE)} in total. The comparison holds that same starting value entirely in ETH ({format(HODL_ETH, 4)} ETH) to show the cost of changing exposure as price moves.
        </p>
      </header>

      <section aria-labelledby="cl-outcomes" className="mt-8">
        <h4 id="cl-outcomes" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">Position value compared with holding ETH</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {scenarios.map((scenario) => (
            <article key={scenario.price} className="min-w-0 border border-white/10 bg-arc-surface p-4 sm:p-5">
              <h5 className="font-semibold leading-snug text-arc-text">{scenario.label}</h5>
              <p className="mt-4 text-sm text-arc-muted">LP: {scenario.position.eth.toFixed(4)} ETH + ${format(scenario.position.usdc)} USDC</p>
              <p className="mt-2 text-sm text-arc-muted">LP value: <span className="text-arc-text">${format(scenario.position.value)}</span></p>
              <p className="mt-2 text-sm text-arc-muted">ETH-only HODL: <span className="text-arc-text">${format(scenario.hodlValue)}</span></p>
              <p className={`mt-4 border-t border-white/10 pt-3 text-sm font-medium ${scenario.gap > 0 ? "text-arc-amber" : "text-arc-green"}`}>{scenario.comparison}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="cl-breakeven" className="mt-8">
        <h4 id="cl-breakeven" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">Illustrative fee time to cover the $3,600 HODL gap</h4>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-arc-muted">
          At $3,600, the LP is about ${format(upside.gap)} behind the same starting capital held as ETH, before fees and costs. If fees accrued at a steady rate on the initial ${format(STARTING_VALUE)} LP value, this is the approximate time needed for gross fees to equal that gap:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {feeRates.map(({ apy, days }) => (
            <article key={apy} className="border border-white/10 bg-arc-surface p-4 sm:p-5">
              <p className="arc-mono text-[11px] text-arc-green">{apy}% ILLUSTRATIVE APY</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text">≈ {days} days</p>
              <p className="mt-2 text-sm text-arc-muted">to generate about ${format(upside.gap)} in gross fees at a constant rate</p>
            </article>
          ))}
        </div>
        <p className="mt-4 border-l-2 border-arc-amber px-4 py-2 text-sm leading-relaxed text-arc-muted">
          These are fee-equivalent estimates, not forecasts or net break-even dates. They assume the APY stays constant and fees keep accruing while the position is active. If price leaves the range sooner, fee accrual may slow or stop; gas, swaps and other costs extend the time. At $2,000, this example's LP is already about ${format(Math.abs(scenarios[1].gap))} ahead of the same-value ETH-only HODL before fees, because it began with USDC as well as ETH.
        </p>
      </section>

      <p className="mt-5 text-sm leading-relaxed text-arc-muted">
        Actual fee income depends on pool volume, fee tier, your share of active liquidity, price path and time in range. A position simulator is in development and is not ready yet; use a verified calculation to compare a specific range, price path, fees and costs before acting.
      </p>
      <Link href="/?view=tools#simulator" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-arc-green hover:text-arc-text">
        Position Simulator — in development →
      </Link>

      <details className="mt-6 border-t border-white/10 pt-4">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm text-arc-muted hover:text-arc-text">Calculation assumptions</summary>
        <ul className="space-y-2 pb-3 text-sm leading-relaxed text-arc-dim">
          <li>Illustrative continuous Uniswap V3 range math from $2,400 to $3,600, entered at $3,000; no tick rounding.</li>
          <li>The ETH-only HODL benchmark holds the same ${format(STARTING_VALUE)} starting value as {format(HODL_ETH, 4)} ETH.</li>
          <li>Break-even days = HODL shortfall ÷ (initial LP value × assumed APY ÷ 365), rounded up. Fees are modeled as simple daily accrual without compounding.</li>
          <li>Pool fees are not inferable from range math. The example excludes fees from endpoint position values, gas, swaps, taxes and other costs. ETH = USDC prices in USD; USDC = $1.</li>
        </ul>
      </details>
    </div>
  )
}
