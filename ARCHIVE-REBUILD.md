# Archive rebuild — review notes

## Latest editorial revision

Results now display **Why it matches** without the Archive Match percentage, factor numbers or bars. Market context reads “Designed for … markets” and “Best during …”, followed by applicable exposure/leverage details. This applies to featured and further retrieved records, including all-market/all-phase results. Internal ranking and API contracts remain unchanged.

Latest hedge revision: identity 018 is now **Delta-Neutral LP** (`delta-neutral-lp-hedge`), using a Uniswap V3 ETH/USDC range and a separately margined Hyperliquid ETH short. Previous `spot-perp-hedge` and original hedged-LP slugs remain aliases with revision history. The existing internal `delta-neutral-lp` slug belongs to a different legacy record and is deliberately preserved. Only this plan's editorial version changes, so migration does not reset other strategy edits.

The plan targets current LP ETH delta and rebalances as inventory changes, seeking swap-fee income with less directional exposure in uncertain/downtrending conditions. It is assigned Sideways/Bear and high-volatility chop/capitulation, with explicit stress caveats rather than automatic entry signals. Current totals are **5 Bull / 8 Sideways / 3 Bear**. Delta neutrality does not remove divergence loss, volatility costs, funding or liquidation. Three fixed-initial-hedge scenarios show inventory drift and independently verified V3 accounting; they are not dynamically neutral backtests. The contextual Hedging Calculator link goes to its **In development** state; no working engine or live sizing is claimed. Earlier descriptions below document preceding revisions.

The guided flow is now **Market → Market Phase → Results**. Asset/objective steps, progress markers, breadcrumbs and edit links are removed from this flow. Phase and all-phase selections retrieve results directly. Old asset/objective step links resolve to results, retain market/phase and discard the retired filters. Shared API filtering and catalogue controls outside this flow are unchanged. `tests/archive-flow.mjs` covers direct retrieval, back/edit navigation, old URLs and responsive layouts.

The catalogue now has **eight** public plans, including the requested **Spot–Perp Hedge**, restored under legacy identity 018. Short DeFi titles are Stablecoin Lending, Crypto Lending, Liquid Staking, Concentrated Liquidity, Accumulation LP, Distribution LP, Dual-Asset LP and Spot–Perp Hedge. Other advanced stacks remain internal; this does not introduce a second advanced catalogue.

Regime membership is editorial context, not a forecast, entry signal or safety rating. Bull has **6** plans, Sideways **8**, and Bear **3**. Subphase counts are scoped to the selected primary regime; assets/objective counts respect earlier selections, and selecting a phase returns only its assigned strategies.

| Plan | Primary contexts | Phase reasoning |
|---|---|---|
| Stablecoin Lending | Bull / Sideways / Bear | Cash optionality in late distribution, quiet ranges, volatile chop and capitulation. Lending still carries peg and withdrawal risks. |
| Crypto Lending | Bull / Sideways | Recovery, alt expansion and quiet ranges for existing ETH holders. BTC-led expansion is conditional on intending to retain ETH despite weaker relative performance. Interest does not hedge ETH. |
| Liquid Staking | Bull / Sideways | Recovery, alt expansion and quiet consolidation while retaining ETH/SOL. Rewards do not make this a defensive bear position. |
| Concentrated Liquidity | Sideways | Low-volatility compression for bounded fee-income ranges. Breakouts/chop can leave a narrow range inactive or one-sided; quiet markets can also produce fewer fees. |
| Accumulation LP | Bear / Sideways | Pullbacks during capitulation, chop and early recovery with a predefined purchase budget. Buying can continue into losses; recovery can reverse conversion while liquidity remains active. |
| Distribution LP | Bull / Sideways | Alt rallies, late-cycle distribution and upward swings in chop. A selling range is not a falling-market stop-loss. |
| Dual-Asset LP | Bull / Sideways | Recovery, broad alt participation and quiet relative-price ranges when both ETH/BTC exposures are wanted. BTC-led divergence is excluded from the default fit. |
| Spot–Perp Hedge | Bull / Sideways / Bear | Reduce existing ETH exposure during late-cycle deterioration, violent chop and capitulation. Advanced margin monitoring is essential; funding and liquidation can defeat the hedge. |

Each strategy exposes this reasoning in its existing market-context section. No invented phase percentages or live yields were introduced. The new hedge uses a separate USDC-margined ETH short and retains spot ETH, with independently checked three-outcome arithmetic and explicit isolated-margin/funding/exit rules. Hyperliquid was added to the shared reviewed directory (nine public entries, 26 total), using official [onboarding](https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-start-trading), [margin](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining), [funding](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding) and liquidation documentation. Eligibility and contract availability must still be checked before entry.

Learn remains general beginner education without strategy links. It now uses an interactive asset/return flow, chapter navigation, expandable lessons and a knowledge check, replacing the filled grid that created empty gray cells. Original homepage, cards, discovery layouts and global styles remain unchanged.

Latest checks: focused TypeScript and changed-file ESLint passed; API/admin/legacy-route tests passed with eight public records and all 1,710 observations retained; browser checks passed across 75 routes/viewports at 320, 375, 390, 430 and 1440px, including phase counts/filtering and Learn interactions. Local consolidation was rerun successfully with a version guard that preserves subsequent edits. This revision remains local and has not been pushed or deployed.

## Current frontend direction

Following the user's review, the replacement frontend was removed. The homepage, catalogue, cards, discovery flow and global stylesheet are restored exactly from the committed live-site version. Strategy detail and comparison retain their original layouts, with consolidated content and compatibility handling. Assets and Networks are removed as public pages; their old URLs lead to the catalogue, and their underlying data/filter/admin support remains available. Learn and Tools use the original archive typography, spacing and surfaces. Protocols reuse the asset registry's grouped tile format, grouped by use. Learn contains only general beginner crypto/DeFi foundations and no specific strategy links. Nothing has been pushed or deployed.

## Outcome and audit

The existing Next.js archive has been rebuilt in place. It uses Prisma/PostgreSQL (not the SQLite described in the old README), a shared authenticated editor, query-string page routes and the public `/api/match` integration boundary. GitHub `main` → the existing Vercel project is the production workflow. No separate Matrix app checkout is present here, so external app UI changes cannot be verified in this repository.

The starting database contained **22 records, 18 published**, 10 revisions and 1,710 observations. An ignored, read-only snapshot was imported into a separate local PostgreSQL database. Production data, environment files, domain configuration and deployments were not modified. The local catalogue now contains **eight canonical public plans**, preserving all 22 original identities, original descriptions in revision snapshots/private research, and every observation. Tests create additional local revisions.

## Catalogue consolidation

| Existing identity | Public destination / treatment |
|---|---|
| 001 Accumulation LP | Accumulation LP — unleveraged Ethereum/Uniswap V3 |
| 002 DCA | Existing archived record; contextual portfolio Learn |
| 003 Yield-funded accumulation | Stablecoin Lending; optional use of earned income |
| 004 Crypto lending | Crypto Lending |
| 005 BTC borrowing | Internal debt education; borrowing Learn |
| 006 Hold and yield | Short portfolio Learn |
| 007 ETH staking | Liquid Staking, with ETH/Lido and SOL/Jito implementations |
| 008 SOL staking | Alias of 007 |
| 009 Distribution LP | Distribution LP |
| 010 Covered calls | Existing archived research; advanced context |
| 011 Stablecoin rotation | Stablecoin Lending, including rotation management notes |
| 012 Deleveraging | Internal debt education |
| 013 Stablecoin reserve | Alias of 011 |
| 014 Preservation portfolio | Short portfolio Learn |
| 015 Range-bound LP | Alias of 016 |
| 016 Concentrated LP | Concentrated Liquidity |
| 017 / 019 Hedging / neutral stacks | Internal advanced research; borrowing Learn |
| 018 Hedged liquidity | Spot–Perp Hedge; old slug remains an alias |
| 020 Pendle PT | Existing archived research; eligibility context, **not** an RWA implementation |
| 021 Farming | Internal record; farming foundation, no verified active programme |
| 022 Dual-asset LP | Dual-Asset LP — Uniswap V2, distinct from V3 ranges |

Old slugs and internal IDs resolve to the canonical record. Retired topics return HTTP 410 with a Learn destination; the browser explains the transition. Aliases preserve other query parameters when resolving a strategy URL. Public listing, search, taxonomy counts and matching share the canonical-public gate; comparison deduplicates aliases. `SIDEWAYS` remains compatible with existing clients; `NEUTRAL` is accepted by filtering/matching, and `marketFit.appRegimes` provides Matrix vocabulary. Historical phase tags are not translated into invented probabilities or app states.

## Implementation

- The original live design, catalogue filters, cards, discovery flow and comparison are retained. Navigation adds general Learn foundations and honest tool states in place of public Assets/Networks pages.
- Each canonical page retains the original editorial layout with consolidated explanations, return source, exposure, trade-off, expandable three-outcome worked examples, six practical steps, monitoring/exit rules and an implementation selector in Requirements. The replacement frontend's temporary notes/checklists are no longer used.
- Accumulation uses no debt, simulated APY or mismatched Solana prerequisites. The worked V3 example shows why a recovery can sell acquired ETH back if liquidity remains active. Staking distinguishes rebasing stETH from JitoSOL exchange-rate accounting. V2 two-asset liquidity has its own mechanics.
- Additive Prisma fields and SQL, schema validation, serializer, shared editor payload, revision restoration and API compatibility. The admin has a validated beginner-content panel and protocol-review metadata. Legacy research remains editable. Restoring pre-consolidation research on a canonical record updates private research rather than replacing its beginner page.
- Nine public protocol entries have documented identity/product scope, networks, requirements, exit mechanics, connected plans and review limits: Aave, Uniswap, Lido, Jito, Morpho, Orca, Suilend, Aerodrome and Hyperliquid. All supplied candidates remain in the shared registry (26 total entries). Unverified candidates stay internal; fallback icons are used where no verified logo exists. Unverified X handles, audits, safety scores and rates are omitted.
- Simulator, Correlation Tool, Impermanent Loss Calculator and Hedging Calculator all say **In development** and link to explanations. No calculator engine or transaction interface is presented. Existing private development/simulation code remains intact; unproven historical observations are not presented as live financial quotes.
- The build's static-copy step now works on Windows as well as Vercel/Linux. Prisma generation runs before production compilation. No domain or hosting changes.

## Primary evidence

Implementation mechanics were checked against [Aave supply](https://aave.com/help/supplying/supply-tokens) and [withdrawal](https://aave.com/help/supplying/withdraw-tokens), [Lido token integration](https://docs.lido.fi/guides/lido-tokens-integration-guide/) and [withdrawal queue](https://docs.lido.fi/contracts/withdrawal-queue-erc721/), [Jito staking](https://www.jito.network/docs/jitosol/get-started/stake-sol-for-jitosol-flow/overview/) and [unstaking](https://www.jito.network/docs/jitosol/get-started/unstaking-jitosol-flow/unstaking-overview/), [Uniswap concentrated liquidity](https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity), the [V3 whitepaper](https://app.uniswap.org/whitepaper-v3.pdf) and [V2 pools](https://docs.uniswap.org/contracts/v2/concepts/core-concepts/pools). Directory review additionally used [Morpho documentation](https://docs.morpho.org/learn/), [Orca's official Whirlpools repository](https://github.com/orca-so/whirlpools), [Suilend documentation](https://docs.suilend.fi/) and [Aerodrome's official liquidity documentation](https://github.com/aerodrome-finance/docs/blob/main/content/liquidity.mdx). These are bounded mechanics reviews, not safety endorsements or certifications of current pool liquidity or eligibility.

## Checks and preview

Run from the project directory. The current local database is populated; no production credentials are needed:

```powershell
# Terminal 1 — persistent, loopback-only local PostgreSQL
npm run preview:database
# Terminal 2 — local archive and isolated preview admin credentials
npm run preview:dev
```

Open **http://localhost:3010**. Local-only admin password: `local-preview-only`. Never use the preview credentials in production. The preview launcher overrides the database/auth environment; it does not edit `.env` files.

For an empty local cluster, use the existing ignored snapshot, not the destructive old seed:

```powershell
$env:STORAGE_DATABASE_URL='postgresql://matrix:local-preview-only@127.0.0.1:55432/matrix_rebuild'
$env:STORAGE_DATABASE_URL_UNPOOLED=$env:STORAGE_DATABASE_URL
npx prisma db push
node scripts/import-local-snapshot.cjs
npm run archive:consolidate
```

The snapshot is deliberately excluded from Git. Import refuses a nonempty target; consolidation refuses unknown IDs, missing expected records or non-local databases without a separate explicit migration flag. Consolidation was rerun to verify it does not overwrite later editorial changes. Do not run `db:reset` or `db:seed` on the live archive.

Verification performed:

- Targeted TypeScript: `npm run check:archive` passed, including application, migration and tests. Full-repository checking includes pre-existing websocket examples with missing Socket.IO dependencies.
- Production compilation and standalone static asset copy: `npm run build` passed. The existing Next config skips build-time type checking, so the separate TypeScript check is required.
- Changed/new-file ESLint passed except the existing strategy-form synchronous hydration effect. Full-repository lint also fails in pre-existing media recipes, bundled video JavaScript, UI hooks and old utility scripts; no unrelated files were refactored to remove those failures.
- `tests/archive-rebuild.ts`: canonical count, 44 legacy ID/slug resolutions, protected admin listing, public search/filtering, Neutral matching, protocol schema/public visibility, independent V3 boundary conversion math, authenticated shared-content editing, both legacy/canonical revision restore behaviour, and retention of all observations.
- `tests/archive-browser.mjs`: original UI source parity, desktop 1440px and mobile 320/375/390/430px across home, discovery, catalogue, all eight details, Learn, Tools, protocols and comparison; no horizontal page overflow. Checks cover Assets/Networks redirects, Learn without strategy links, honest tool states, protocol expansion, staking implementation switching, worked-example expansion, legacy alias navigation and search dialog. Screenshots were visually inspected. Authenticated editor validation was checked during the preceding data-model rebuild; that editor is retained.

API test command (with the local environment above and preview running): `npx tsx tests/archive-rebuild.ts`. Browser tests require Playwright and a Chromium/Chrome executable; use `PLAYWRIGHT_MODULE` for an existing external installation and optionally `CHROME_EXECUTABLE` for its browser path. Then run `node tests/archive-browser.mjs`.

## Remaining release items

No farming page or RWA page was published: an active incentive programme and an eligible concrete RWA product remain unverified. Seventeen registry entries still need bounded product/deployment/link review before public inclusion. No verified live-observation feed has been connected. External app UI adoption is outside this checkout; the shared API migration is implemented and tested here.

**Not deployed.** Changes are on `codex/archive-beginner-rebuild` for review. Earlier production authorisations concerned specific completed changes, not this catalogue overhaul. A later authorised release must back up production, apply `prisma/rebuild/schema.sql`, regenerate the Prisma client, run the reviewed consolidation transaction against the existing data and deploy the matching application through GitHub/Vercel. Schema and application changes must be coordinated; do not push this branch to production before that migration plan is approved.


## Production release — 8 October 2026

The user authorised production deployment. Production was backed up privately before the additive schema and transactional catalogue migration. The release preserves 22 identities and 1,710 observations, with eight public strategies. Historical sections above describe intermediate local revisions.

Release checks: targeted TypeScript, production build, authenticated API editing/revision restoration and actual browser admin login, editing, validation, draft publishing and protocol review persistence passed. The editor now resets when changing records and refreshes its form after restoring a revision. The user updated production NEXTAUTH_URL to https://strategies.matrix.finance. Deployment follows the existing GitHub main → Vercel workflow; final deployment verification is recorded in the task report.
