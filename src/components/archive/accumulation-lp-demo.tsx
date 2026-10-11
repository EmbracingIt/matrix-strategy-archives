"use client"

import { ArrowDownRight, Coins, Wallet } from "lucide-react"

const DEMO = {
  label: "Illustrative example only — possible outcomes, not a forecast or live rates.",
  title: "Example case: borrow $3,000 USDC for a $3,000–$2,600 ETH range",
  subtitle: "Assume a 1.5-month period and 30% fee APY solely to illustrate the arithmetic. Actual fees, loan rates and collateral terms vary.",
  steps: [
    { icon: "wallet", copy: "Instead of selling ETH you plan to keep, supply eligible ETH as collateral in a lending market. Borrow 3,000 USDC only if the terms and downside risk fit your plan." },
    { icon: "fall", copy: "Place the borrowed USDC in a Uniswap V3 buying range from $3,000 to $2,600. As ETH falls through the range, the USDC gradually converts into ETH; the loan keeps accruing interest." },
    { icon: "coins", copy: "After about 1.5 months, ETH is $2,600 and the range holds about 1.1127 ETH including assumed fees. Your original ETH remains pledged as collateral; the 3,000 USDC loan plus interest is still owed." },
  ],
  comparison: "HODL comparison: keep 1 ETH without borrowing. The main strategy keeps eligible ETH as collateral and adds a borrowed-USDC LP, so its full outcome also includes the collateral and loan.",
  resultTitle: "One possible path: ETH falls to $2,600 after 1.5 months",
  results: [
    { title: "HODL ETH", amount: "1.00 ETH", value: "Value: $2,600; no loan." },
    { title: "Borrow + Accumulation LP", amount: "1.1127 ETH", value: "LP assets ≈ $2,893; original ETH collateral is separate. Debt: 3,000 USDC + interest." },
  ],
  difference: "The LP assets alone do not cover the 3,000 USDC loan, before interest.",
  resultCaption: "This is not a net-return comparison. The pledged ETH collateral, loan interest, gas and other costs are excluded from the LP amount.",
  otherPathsTitle: "Other possible price paths",
  otherPaths: [
    { title: "ETH falls through the range, then returns to $3,000", text: "The LP can convert back to about 3,000 USDC as price recovers above the range, plus fees earned while liquidity was active. Under the same simplified fee assumption, about $100 in fees could remain after repaying 3,000 USDC principal. It only offsets borrowing interest and costs if realized fees are greater than those amounts. Your pledged ETH also returns to its starting price in this example." },
    { title: "ETH rises without entering the range", text: "Your pledged ETH retains its ETH price exposure while it remains collateral, so its value can rise. The LP may stay in USDC and earn little or no fees if price never trades through the range; the loan and interest still remain." },
  ],
  notes: [
    { title: "Fee assumption", text: "For illustration only, assume fees equal a steady 30% APY on the initial $3,000 value for 1.5 months. That is about $100 in USD-equivalent fees. Actual fees vary with trading, active liquidity and time in range; 30% is not promised or a live rate." },
    { title: "Borrowing risk", text: "If ETH falls, the collateral can lose value while the USDC debt and interest remain. A lending market may liquidate collateral before a recovery; waiting for price to rebound does not prevent liquidation." },
    { title: "Range trade-off", text: "If ETH recovers through the open range, LP-held ETH converts back to USDC. Your pledged collateral still has ETH exposure, but its value can fall too." },
  ],
  calculationTitle: "How is this calculated?",
  calculations: [
    "Uniswap V3 converts your USDC to ETH along a fixed curve as the price moves through your range.",
    "Average buy price = √(2,600 × 3,000) ≈ $2,793.",
    "ETH at the bottom = 3,000 ÷ $2,793 ≈ 1.0742.",
    "Illustrative fee assumption: $3,000 × (1.30^(1.5/12) − 1) ≈ $100.02; this applies the APY to the starting value for the full period.",
    "At $2,600 per ETH, about $100.02 of assumed fees buys 0.0385 ETH. Added to 1.0742 ETH principal, the total is about 1.1127 ETH (≈ $2,893).",
    "If price later recovers above $3,000, the LP converts back to about 3,000 USDC principal. After repaying the 3,000 USDC loan, fees can offset interest and costs only if actual fees exceed them.",
    "The HODL and LP cards show different parts of the outcome. A full comparison also needs the amount and value of pledged ETH, loan interest, and any collateral changes; these are not supplied here.",
    "USDC = $1. Actual fee income is not inferable from APY alone; gas and fees may differ.",
  ],
} as const

const icons = [<Wallet key="wallet" aria-hidden="true" className="size-5" />, <ArrowDownRight key="fall" aria-hidden="true" className="size-5" />, <Coins key="coins" aria-hidden="true" className="size-5" />]

export function AccumulationLpDemo() {
  return <div className="mt-4 border-t border-white/10 pt-5">
    <header className="max-w-3xl">
      <p className="arc-mono text-[11px] text-arc-green">{DEMO.label}</p>
      <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight tracking-tight text-arc-text">{DEMO.title}</h3>
      <p className="mt-3 text-sm text-arc-muted sm:text-base">{DEMO.subtitle}</p>
    </header>

    <section aria-label="Three steps" className="mt-9 grid gap-3 md:grid-cols-3">
      {DEMO.steps.map((step, index) => <div key={step.icon} className="flex gap-4 border border-white/10 bg-arc-surface p-5 sm:min-h-[150px]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-arc-green/25 bg-arc-green/10 text-arc-green">{icons[index]}</span>
        <div><p className="arc-mono text-[10px] text-arc-dim">STEP 0{index + 1}</p><p className="mt-2 text-sm leading-relaxed text-arc-text">{step.copy}</p></div>
      </div>)}
    </section>

    <p className="mt-4 border-l-2 border-arc-amber px-4 py-2 text-sm text-arc-muted">{DEMO.comparison}</p>

    <section aria-labelledby="result-heading" className="mt-8">
      <h2 id="result-heading" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">{DEMO.resultTitle}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0 border border-white/10 bg-arc-surface p-4 sm:p-6"><p className="arc-mono text-[10px] text-arc-muted sm:text-[11px]">{DEMO.results[0].title}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text sm:text-5xl">{DEMO.results[0].amount}</p><p className="mt-2 text-sm text-arc-muted">{DEMO.results[0].value}</p></div>
        <div className="min-w-0 border border-arc-green/25 bg-arc-green/[0.04] p-4 sm:p-6"><p className="arc-mono text-[10px] text-arc-green sm:text-[11px]">{DEMO.results[1].title}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-arc-text sm:text-5xl">{DEMO.results[1].amount}</p><p className="mt-2 text-sm text-arc-muted">{DEMO.results[1].value}</p></div>
      </div>
      <p className="mx-auto mt-4 w-fit max-w-full rounded-full border border-arc-green/25 bg-arc-green/10 px-4 py-3 text-center text-sm font-semibold text-arc-green">{DEMO.difference}</p>
      <p className="mt-4 text-center text-sm text-arc-muted">{DEMO.resultCaption}</p>
    </section>

    <section aria-labelledby="other-paths-heading" className="mt-8">
      <h2 id="other-paths-heading" className="font-display text-xl font-semibold text-arc-text sm:text-2xl">{DEMO.otherPathsTitle}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {DEMO.otherPaths.map((path) => <article key={path.title} className="border border-white/10 bg-arc-surface p-4 sm:p-5"><h3 className="font-semibold leading-snug text-arc-text">{path.title}</h3><p className="mt-3 text-sm leading-relaxed text-arc-muted">{path.text}</p></article>)}
      </div>
    </section>

    <p className="mt-6 border border-arc-amber/25 bg-arc-amber/[0.035] p-4 text-sm leading-relaxed text-arc-muted"><span className="font-semibold text-arc-text">Collateral is not a free hedge:</span> the route preserves ETH exposure, but a fall in ETH can weaken collateral health while the USDC debt remains. The archive has not selected or reviewed a lending market, so borrowing capacity, rates and liquidation terms must be checked with the chosen market.</p>

    <section aria-label="Notes" className="mt-8 space-y-3 border-t border-white/10 pt-5">
      {DEMO.notes.map(note => <p key={note.title} className="text-sm leading-relaxed text-arc-dim"><span className="font-medium text-arc-muted">{note.title}: </span>{note.text}</p>)}
    </section>

    <details className="mt-8 border-t border-white/10 pt-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm text-arc-muted hover:text-arc-text">{DEMO.calculationTitle}</summary>
      <ul className="space-y-2 pb-3 text-sm leading-relaxed text-arc-dim">{DEMO.calculations.map(line => <li key={line}>{line}</li>)}</ul>
    </details>
  </div>
}
