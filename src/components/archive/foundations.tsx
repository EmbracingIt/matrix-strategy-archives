"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { Wallet, ShieldCheck, Coins, Network, ArrowRight, BookOpen } from "lucide-react"

export const foundations = [
  { id: "wallets", category: "Getting started", title: "Wallets and your recovery phrase", text: "A crypto wallet lets you sign actions on a blockchain. Its recovery phrase controls access to your funds: keep it private and offline, and never enter it on a website. A wallet interface does not check whether every transaction you sign is safe." },
  { id: "networks", category: "Getting started", title: "Networks, tokens and gas", text: "Tokens live on specific networks. Having a token with the same name on another network does not make it available to an app on the network you are using. Keep some of the network’s native token for transaction fees, called gas, and check the network and destination before sending." },
  { id: "security", category: "Getting started", title: "Approvals and basic security", text: "An approval lets a contract spend a token from your wallet; it is different from transferring the token. Check the official website, contract, amount and permissions before signing. Start with a small amount, avoid links in unexpected messages, and remember that transactions can be irreversible." },
  { id: "assets", category: "Understanding your assets", title: "Price, exposure and stablecoins", text: "Exposure describes what can change the value of your holdings. A stablecoin aims to track a reference value, but its peg can fail and its issuer or backing can introduce risk. Owning more units of an asset does not necessarily mean you have made money in your spending currency." },
  { id: "defi", category: "How DeFi works", title: "What is DeFi?", text: "Decentralised finance uses blockchain contracts for activities such as trading, lending and staking. A contract follows its programmed rules, but bugs, governance decisions, unreliable price inputs and token problems can still cause losses. Using DeFi means understanding both the position and the contracts involved." },
  { id: "lending", category: "How DeFi works", title: "Lending and borrowing", text: "Lending markets connect supplied assets with borrowers who pay interest. Rates vary, and withdrawing can depend on available liquidity. Borrowing is a separate decision: debt adds interest costs, collateral requirements and the possibility of liquidation if the collateral no longer covers the loan." },
  { id: "staking", category: "How DeFi works", title: "Staking and liquid staking", text: "Staking helps secure some blockchains and may earn network rewards. Liquid staking adds a token that represents the stake, allowing it to be transferred while rewards are accounted for. That token can trade at a discount, and withdrawals may take time; penalties, validators and contracts add risk." },
  { id: "liquidity", category: "How DeFi works", title: "Trading and liquidity pools", text: "A decentralised exchange lets people trade through contracts, often using pools funded by liquidity providers. Providers may earn swap fees while the quantities of their deposited assets change. Some pools use a chosen price range; outside it, the position may become one-sided and stop earning active swap fees." },
  { id: "farming", category: "How DeFi works", title: "Farming rewards", text: "Yield farming adds incentives, often paid in another token, to a lending or liquidity position. These rewards can end or lose value, and collecting them may cost transaction fees. Learn how the underlying position works before considering its additional rewards." },
  { id: "rwa", category: "How DeFi works", title: "Real-world assets", text: "Some tokens represent claims or exposure connected to off-chain assets such as debt or property. Their value depends on the underlying product, issuer and legal rights, not only the blockchain contract. Availability, identity checks, investor eligibility and redemption rules differ between products." },
  { id: "returns", category: "Understanding risks and returns", title: "APR, APY and where returns come from", text: "APR is an annualised rate without assumed compounding; APY includes a compounding assumption. Neither guarantees what you will earn next. Ask who pays the return, in which token it is paid, what costs apply, and whether the estimate includes temporary incentives." },
  { id: "divergence", category: "Understanding risks and returns", title: "Liquidity versus simply holding", text: "Trading inside a pool changes the token mix you own. Your liquidity position can be worth less than keeping the starting assets, even if both asset prices rise. This difference is often called impermanent loss; it does not automatically disappear and fees may not cover it." },
  { id: "portfolio", category: "Understanding risks and returns", title: "A plan before you enter", text: "Write down what you want to achieve, which assets you may receive, where the return comes from and how you will leave. Check price exposure, contracts, fees, withdrawal limits and any debt. Review these conditions regularly instead of relying only on an advertised yield or a market label." },
  { id: "borrowing", category: "Understanding risks and returns", title: "Liquidation, hedges and extra obligations", text: "Liquidation can sell collateral when a loan or margin position no longer meets its requirements. A hedge aims to offset an exposure but can add funding costs, margin requirements and execution risk. These are more complex commitments, not automatic protection against losses." },
]

export function RegistryHeading({ label, title, description }: { label: string; title: string; description: string }) {
  return <header className="border-b border-white/10 py-10 sm:py-12">
    <p className="arc-mono text-arc-green">{label}</p>
    <h1 className="mt-4 font-sans text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.01em] text-arc-text">{title}<span className="text-arc-green">.</span></h1>
    <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-arc-muted">{description}</p>
  </header>
}

export function Learn() {
  const lesson = useSearchParams().get("lesson")
  const selected = foundations.find(f => f.id === lesson)
  const entries = selected ? [selected] : foundations
  const categories = [...new Set(entries.map(f => f.category))]
  const [mechanism, setMechanism] = useState("lending")
  const flows = {
    lending: { nodes:["Your supplied tokens", "Borrowers use the market", "Borrowers pay interest"], detail:"Interest comes from borrowers. The rate and withdrawal liquidity change with demand; your supplied asset still has its own risks." },
    staking: { nodes:["Your staked assets", "Validators secure the network", "Network rewards / penalties"], detail:"Rewards come from helping secure a network. You keep asset price exposure, and penalties or delayed exits can affect what you recover." },
    liquidity: { nodes:["Your two-token deposit", "Traders swap through the pool", "Fees + a changing token mix"], detail:"Fees come from traders. Your token quantities change with trading, so the position can underperform simply holding the original assets." },
  }
  const flow = flows[mechanism as keyof typeof flows]
  return <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
    <RegistryHeading label="LEARN / FOUNDATIONS" title="Learn the basics" description="A simple introduction to crypto and DeFi. Understand the words, mechanics and risks before deciding what to do with your assets." />
    {selected && <Link className="arc-mono mt-6 inline-flex min-h-11 items-center text-arc-green" href="/?view=learn">← ALL FOUNDATIONS</Link>}
    {!selected && <section aria-label="Explore how DeFi works" className="mt-10 grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_1.5fr]">
      <div><p className="arc-mono text-arc-green">FOLLOW THE ASSETS</p><h2 className="mt-4 text-[clamp(1.7rem,3vw,2.5rem)] font-semibold leading-tight text-arc-text">Where does the return come from?</h2><p className="mt-4 text-[15px] leading-relaxed text-arc-muted">Tap a mechanism to see who uses your assets, who pays you, and what changes along the way.</p><div className="mt-5 flex flex-wrap gap-2">{Object.keys(flows).map(key=><button key={key} aria-pressed={mechanism===key} onClick={()=>setMechanism(key)} className={`arc-mono min-h-11 rounded-[4px] border px-4 ${mechanism===key ? 'border-arc-green/50 bg-arc-green/10 text-arc-green' : 'border-white/15 text-arc-muted hover:text-arc-text'}`}>{key.toUpperCase()}</button>)}</div></div>
      <div className="min-w-0 rounded-[6px] border border-arc-green/20 p-5 sm:p-7" style={{background:"radial-gradient(ellipse at 30% 0%,rgba(47,229,140,.09),transparent 75%)"}}><div className="flex flex-col gap-3 sm:flex-row sm:items-center">{flow.nodes.map((node,index)=><div key={node} className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1 border-l-2 border-arc-green/70 pl-3 py-3"><span className="arc-mono text-arc-green">0{index+1}</span><p className="mt-3 text-[15px] font-semibold text-arc-text">{node}</p></div>{index<2&&<ArrowRight className="size-4 shrink-0 rotate-90 text-arc-dim sm:rotate-0" aria-hidden />}</div>)}</div><p className="mt-6 border-t border-white/10 pt-5 text-[14px] leading-relaxed text-arc-muted" aria-live="polite">{flow.detail}</p></div>
    </section>}
    {!selected && <nav aria-label="Learning chapters" className="mt-8 flex flex-wrap gap-x-6 gap-y-3">{categories.map((category,index)=><a key={category} className="arc-mono inline-flex min-h-11 items-center gap-2 text-arc-muted hover:text-arc-green" href={`#chapter-${index}`}><span className="text-arc-green">0{index+1}</span>{category}</a>)}</nav>}
    <div className="space-y-10 py-10">{categories.map((category,index) => <section id={`chapter-${index}`} className="scroll-mt-32" key={category}>
      <div className="mb-4 flex items-center gap-4"><h2 className="arc-mono text-arc-muted">{category.toUpperCase()}</h2><span className="h-px flex-1 bg-white/10" aria-hidden /></div>
      <div className="grid items-start gap-x-8 sm:grid-cols-2">{entries.filter(f => f.category === category).map(f => {const Icon = f.id==='wallets'?Wallet:f.id==='networks'?Network:f.id==='security'?ShieldCheck:['assets','returns'].includes(f.id)?Coins:BookOpen;return <article id={f.id} key={f.id} className="min-w-0 scroll-mt-32 border-b border-white/10 py-2"><details open={!!selected}><summary className="flex min-h-20 cursor-pointer items-center gap-4 py-4 text-arc-text"><Icon className="size-5 shrink-0 text-arc-green" aria-hidden/><h3 className="flex-1 text-[17px] font-semibold">{f.title}</h3><span className="text-arc-dim" aria-hidden>+</span></summary><p className="pb-6 pl-9 text-[14px] leading-[1.75] text-arc-muted">{f.text}</p></details></article>})}</div>
    </section>)}</div>
  </div>
}

export function Tools() {
  const tools = [
    { title: "Simulator", lesson: "liquidity", text: "Explore how a position’s asset balances might change under stated price scenarios." },
    { title: "Correlation Tool", lesson: "portfolio", text: "Understand how two assets move together and why historical relationships can change." },
    { title: "Impermanent Loss Calculator", lesson: "divergence", text: "Compare providing liquidity with holding the same starting assets." },
    { title: "Hedging Calculator", lesson: "borrowing", text: "Understand offsetting exposures alongside funding costs, debt and liquidation risks." },
  ]
  return <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
    <RegistryHeading label="TOOLS / IN DEVELOPMENT" title="Tools" description="These tools are in development and are not ready to use. The descriptions explain their intended purpose; no calculations or release dates are available yet." />
    <div className="grid gap-3 py-10 sm:grid-cols-2">{tools.map((tool, index) => <article id={tool.title.toLowerCase().replaceAll(" ", "-")} key={tool.title} className="min-w-0 rounded-[6px] border border-white/10 bg-arc-surface/50 p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><span className="arc-mono text-arc-dim">0{index + 1}</span><span className="arc-mono border border-white/15 px-2 py-1 text-arc-muted">IN DEVELOPMENT</span></div><h2 className="mt-5 text-[22px] font-semibold text-arc-text">{tool.title}</h2><p className="mt-4 text-[14px] leading-relaxed text-arc-muted">{tool.text}</p><div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled aria-describedby={`${tool.title.toLowerCase().replaceAll(" ", "-")}-availability`} className="arc-mono inline-flex min-h-11 cursor-not-allowed items-center rounded-[4px] border border-arc-green/40 bg-arc-green/10 px-5 text-arc-green">USE TOOL →</button><span id={`${tool.title.toLowerCase().replaceAll(" ", "-")}-availability`} className="text-[13px] text-arc-muted">Not available yet</span></div></article>)}</div>
  </div>
}
