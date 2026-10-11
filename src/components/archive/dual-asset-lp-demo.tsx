import { ArrowUpRight, Coins, Wallet } from "lucide-react"

const STEPS = [
  "Keep eligible BTC and ETH as collateral in a lending market you have checked. Borrow 3,000 USDC only if the collateral, repayment plan and downside risk are acceptable.",
  "Convert about 1,500 USD-equivalent to WBTC and 1,500 USD-equivalent to WETH, then add them to a verified Uniswap V3 WBTC/WETH 0.05% position. Set a range you can actively monitor.",
  "After three months, compare the LP's actual token mix and collected fees with holding the same borrowed WBTC/WETH mix. The 3,000 USDC debt and interest remain due either way.",
]

const PATHS = [
  {
    title: "If prices stay near entry",
    copy: "If prices and the WBTC/WETH ratio stay near entry and the position remains active, the $3,000 principal stays near $3,000 before fees. If the screenshot APY assumption held, estimated LP value would be about $3,245.88 versus $3,000 for holding the same borrowed mix.",
  },
  {
    title: "If their relative prices diverge",
    copy: "The LP can shift toward the asset that has underperformed relative to the other. If price leaves the chosen range, the position may become one-sided and stop earning fees until price returns. The final result depends on the range and the full WBTC/WETH price path.",
  },
]

export function DualAssetLpDemo() {
  return (
    <div className="mt-4 border-t border-white/10 pt-5">
      <header className="max-w-3xl">
        <p className="arc-mono text-[11px] text-arc-green">ILLUSTRATIVE EXAMPLE ONLY — NOT A FORECAST OR LIVE RATE</p>
        <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight text-arc-text">
          Example case: borrow $3,000 USDC for a three-month WBTC/WETH LP
        </h3>
        <p className="mt-3 text-sm text-arc-muted sm:text-base">
          The screenshot you shared shows Uniswap V3 WBTC/WETH at the 0.05% fee tier and 37.04% APY. Its capture date is not visible, so this uses that APY only as a hypothetical constant for three months.
        </p>
      </header>

      <section aria-label="Three steps" className="mt-9 grid gap-3 md:grid-cols-3">
        {STEPS.map((copy, index) => {
          const Icon = [Wallet, ArrowUpRight, Coins][index]
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
        The base LP does not require borrowing. This example adds a loan, so it also adds interest, collateral and liquidation risk. The same borrowed asset mix and same debt are used in the HODL comparison.
      </p>

      <section aria-labelledby="dual-result-heading" className="mt-8">
        <h4 id="dual-result-heading" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">
          One possible path: both tokens rise 20% over three months
        </h4>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-arc-muted">
          Assume WBTC and WETH rise by the same percentage, so their relative price stays unchanged and the selected range stays active. This isolates the fee illustration; it is not a prediction.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
          <article className="min-w-0 border border-white/10 bg-arc-surface p-4 sm:p-6">
            <p className="arc-mono text-[10px] text-arc-muted sm:text-[11px]">BORROW + HODL THE TOKEN MIX</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text sm:text-5xl">$3,600</p>
            <p className="mt-2 text-sm text-arc-muted">Value of the borrowed WBTC/WETH before repaying $3,000 principal, interest and costs. Original collateral is separate.</p>
          </article>
          <article className="min-w-0 border border-arc-green/25 bg-arc-green/[0.04] p-4 sm:p-6">
            <p className="arc-mono text-[10px] text-arc-green sm:text-[11px]">BORROW + DUAL-ASSET LP</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text sm:text-5xl">≈ $3,845.88</p>
            <p className="mt-2 text-sm text-arc-muted">About $3,600 principal value plus an estimated $245.88 in fees. Before repaying $3,000 principal, interest and costs.</p>
          </article>
        </div>
        <p className="mx-auto mt-4 w-fit max-w-full rounded-full border border-arc-green/25 bg-arc-green/10 px-4 py-3 text-center text-sm font-semibold text-arc-green">
          Estimated gross fee difference vs holding: ≈ $245.88 before LP costs
        </p>
        <p className="mt-4 text-center text-sm text-arc-muted">
          Loan interest applies to both borrowed paths. The BTC and ETH collateral is common to both and excluded; its price change, collateral ratio and liquidation risk still matter.
        </p>
      </section>

      <section aria-labelledby="dual-paths-heading" className="mt-8">
        <h4 id="dual-paths-heading" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">Other market paths</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PATHS.map((path) => (
            <article key={path.title} className="border border-white/10 bg-arc-surface p-4 sm:p-5">
              <h5 className="font-semibold leading-snug text-arc-text">{path.title}</h5>
              <p className="mt-3 text-sm leading-relaxed text-arc-muted">{path.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Assumptions and risks" className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm leading-relaxed text-arc-dim">
        <p><span className="font-medium text-arc-muted">Fee arithmetic: </span>$3,000 × ((1 + 0.3704)^(3/12) − 1) ≈ $245.88. This treats the screenshot APY as constant for the full period. Uniswap V3 fees do not automatically compound; actual fees depend on trading, active liquidity, range and the position's share. The screenshot date is unknown.</p>
        <p><span className="font-medium text-arc-muted">Borrowing and collateral: </span>The lending market, collateral amount, interest rate, loan-to-value ratio and liquidation terms are unspecified. ETH and BTC can fall together; collateral may be liquidated before a recovery. Check the lender's terms and plan for repayment or adding collateral.</p>
        <p><span className="font-medium text-arc-muted">Costs and exposure: </span>USDC-to-WBTC/WETH swaps, Ethereum gas, position minting, fee collection and withdrawal costs are excluded. A pool APY snapshot is not a forecast, and higher market volume does not guarantee the same fee income for this position.</p>
      </section>
    </div>
  )
}
