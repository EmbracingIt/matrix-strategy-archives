import { ArrowUpRight, Coins, Wallet } from "lucide-react"

const FEE_ESTIMATE = 3000 * (Math.pow(1.45, 1.5 / 12) - 1)
const LIQUIDITY = 1 / (1 / Math.sqrt(3000) - 1 / Math.sqrt(4000))
const MID_ETH = LIQUIDITY * (1 / Math.sqrt(3500) - 1 / Math.sqrt(4000))
const MID_USDC = LIQUIDITY * (Math.sqrt(3500) - Math.sqrt(3000))
const MID_VALUE_WITH_FEES = MID_ETH * 3500 + MID_USDC + FEE_ESTIMATE
const formatUsd = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const FULL_SALE_USDC = Math.sqrt(3000 * 4000)

const STEPS = [
  "Start with 1 ETH worth $3,000. Choose a lower price where you are willing to begin selling and an upper price where you would be comfortable finishing; this example uses $3,000–$4,000.",
  "Supply the ETH to a one-sided Uniswap V3 range. As ETH trades upward through the range, the position gradually converts ETH to USDC instead of waiting for one exact top price.",
    `At $3,500, the range holds about ${MID_ETH.toFixed(4)} ETH and $${formatUsd(MID_USDC)} USDC in principal. Fees are separate; this example assumes about $${formatUsd(FEE_ESTIMATE)} collected over 1.5 months only to show the arithmetic.`,
]

const PATHS = [
  {
    title: "Price reaches the $4,000 target",
    copy: `The principal fully converts to about $${formatUsd(FULL_SALE_USDC)} USDC, an average conversion price near $3,464 per ETH. With the illustrative $${formatUsd(FEE_ESTIMATE)} in separately collected fees, the total is about $${formatUsd(FULL_SALE_USDC + FEE_ESTIMATE)} before gas and other costs. Holding 1 ETH would be worth $4,000.`,
  },
  {
    title: "Price reverses below the range",
    copy: `If the open position moves back down through the full range to $2,800, its principal shifts back to about 1 ETH. If the illustrative fees had already been collected and converted to USDC, the position plus those fees is about $${formatUsd(2800 + FEE_ESTIMATE)}; holding 1 ETH is $2,800. Actual fees depend on time in range and trading activity.`,
  },
]

export function DistributionLpDemo() {
  return (
    <div className="mt-4 border-t border-white/10 pt-5">
      <header className="max-w-3xl">
        <p className="arc-mono text-[11px] text-arc-green">ILLUSTRATIVE EXAMPLE ONLY — POSSIBLE OUTCOMES, NOT A FORECAST OR LIVE RATE</p>
        <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight text-arc-text">
          Example case: gradually sell 1 ETH from $3,000 toward $4,000
        </h3>
        <p className="mt-3 text-sm text-arc-muted sm:text-base">
          The chosen upper price is a target for completing the sale, not a prediction of the market top. A range can begin selling before that level, while fees vary and are earned only while liquidity is active in range.
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
        Comparison: hold the same 1 ETH without an LP. The example does not borrow or use collateral. The range trades some potential ETH upside for a planned gradual conversion; it can also shift back toward ETH if price falls while it remains open.
      </p>

      <section aria-labelledby="distribution-result-heading" className="mt-8">
        <h4 id="distribution-result-heading" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">
          One possible path: ETH rises partway to $3,500
        </h4>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-arc-muted">
          Assume the position stays active in the range for 1.5 months and, solely for illustration, fees equal a constant 45% APY on the initial $3,000 value. The fees are shown as collected USDC; Uniswap V3 fees accrue separately and are not automatically compounded.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
          <article className="min-w-0 border border-white/10 bg-arc-surface p-4 sm:p-6">
            <p className="arc-mono text-[10px] text-arc-muted sm:text-[11px]">HOLD 1 ETH</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text sm:text-5xl">$3,500</p>
            <p className="mt-2 text-sm text-arc-muted">Value at $3,500 per ETH. No sale and no LP fees.</p>
          </article>
          <article className="min-w-0 border border-arc-green/25 bg-arc-green/[0.04] p-4 sm:p-6">
            <p className="arc-mono text-[10px] text-arc-green sm:text-[11px]">DISTRIBUTION LP + ASSUMED FEES</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text sm:text-5xl">≈ ${formatUsd(MID_VALUE_WITH_FEES)}</p>
            <p className="mt-2 text-sm text-arc-muted">About {MID_ETH.toFixed(4)} ETH + ${formatUsd(MID_USDC)} USDC principal, plus ${formatUsd(FEE_ESTIMATE)} assumed collected fees. Before gas and costs.</p>
          </article>
        </div>
        <p className="mt-4 text-center text-sm text-arc-muted">
          In this path, the LP has converted part of the ETH before the $4,000 target. The assumed fees do not guarantee that it beats holding ETH.
        </p>
      </section>

      <section aria-labelledby="distribution-paths-heading" className="mt-8">
        <h4 id="distribution-paths-heading" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">Other possible price paths</h4>
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
        <p><span className="font-medium text-arc-muted">Fee arithmetic: </span>$3,000 × (1.45^(1.5/12) − 1) ≈ ${FEE_ESTIMATE.toFixed(2)}. This treats 45% APY as constant for the entire period and applies it to the starting value. It is an illustration only, not a current pool rate or expected result. Real fees depend on trading, active liquidity and time in range; an out-of-range position earns no fees.</p>
        <p><span className="font-medium text-arc-muted">Conversion and reversal: </span>Continuous Uniswap V3 range math gives an average conversion price near √($3,000 × $4,000) = $3,464 per ETH if the whole range fills. Arbitrageurs trade against liquidity at market-aligned prices; fees do not ensure a better sale price. If the open range reverses, ETH exposure can return. Removing liquidity and keeping USDC proceeds makes the conversion final, with associated costs.</p>
        <p><span className="font-medium text-arc-muted">Costs: </span>Minting, collecting and removing an Ethereum mainnet position costs gas. Fee collection and any conversion are separate actions; costs and taxes are excluded from these illustrations.</p>
      </section>
    </div>
  )
}
