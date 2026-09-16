# Matrix Strategy Archives

**DeFi strategies for different portfolios, assets, and market conditions.**

Matrix Strategy Archives is the strategy knowledge base for the **Matrix Finance** platform.
It provides:

1. **A polished public website** where users browse, search, filter and read detailed DeFi
   strategies.
2. **A private admin/editor CMS** to create, edit, publish, archive and maintain those
   strategies — on the exact same database.
3. **A clean REST API** designed so Matrix Finance and future AI agents can consume the same
   structured strategy data for portfolio-based recommendations.

```
                MATRIX STRATEGY DATABASE
                         |
          --------------------------------
          |              |               |
          v              v               v
     Public Site     Matrix Finance    AI Agents
     Browse/read     Future API        Future matching
```

---

## Tech Stack (as deployed here)

| Layer      | Original plan     | Implemented in this repo                    | Why |
|------------|-------------------|---------------------------------------------|-----|
| Frontend   | React + Vite      | **Next.js 16 (App Router) + React 19 + TypeScript** | Single deployable, same component model |
| Backend    | Node + Express    | **Next.js Route Handlers (REST, `/api/*`)** | Identical REST surface without a second process |
| Database   | MongoDB + Mongoose| **Prisma ORM + SQLite** | Same document-style data model (JSON sub-documents), zero-setup local dev |
| Styling    | Plain CSS         | **Tailwind CSS 4 + shadcn/ui** | Consistent, maintainable design system |
| State      | —                 | **Zustand** (client) + **TanStack Query** (server) | |

> The data model, API contract and folder boundaries deliberately mirror the Express/Mongo
> architecture so it can be ported later if needed: models live in `prisma/schema.prisma`,
> serialization in `src/lib/server/`, and every endpoint is a thin, framework-agnostic
> REST handler. The Strategy document uses JSON sub-documents (steps, risk, marketFit,
> requirements, references) exactly like Mongo sub-documents.

### Fonts & design language

- **Inter** for UI/content, **Fraunces** (editorial serif) for major Archive titles,
  **JetBrains Mono** for record IDs and classification metadata (`STRATEGY_001`,
  `ARCHIVE / 001`, `COLLECTION_BEAR`).
- **Public site — dark digital archive**: `#080A0D` background, `#0F1217` surfaces,
  warm off-white text, hairline white/10 borders, **Matrix green `#19C784` as the
  single accent** (bear red / muted amber only as regime semantic colors).
- **Admin CMS — light institutional theme** (unchanged): white surfaces, near-black
  text, thin borders, emerald accent only.

---

## Running locally

Requires **Node 20+** (or Bun) — PowerShell on Windows 10/11 or any POSIX shell.

```bash
# 1. Install dependencies
npm install            # or: bun install

# 2. Configure environment
cp .env.example .env   # fill in existing PostgreSQL URLs and admin settings

# 3. Create the database schema
npm run db:push        # prisma db push

# 4. Seed realistic demo data (8 strategies, 9 assets, 9 protocols, 5 networks)
npm run db:seed        # bun prisma/seed.ts

# 5. Start the dev server
npm run dev            # http://localhost:3000
```

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Start the app in dev mode (port 3000) |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply `prisma/schema.prisma` to SQLite |
| `npm run db:seed` | Reset + seed demo content |
| `npm run db:generate` | Regenerate the Prisma client |

### Admin password

Copy `.env.example` to `.env` and set `ADMIN_PASSWORD` to a strong, unique password.
Set `NEXTAUTH_SECRET` to an independently generated random secret; generate one with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Set `NEXTAUTH_URL` to the exact site origin (`http://localhost:3000` locally,
or your HTTPS URL in production), then restart the app. Never commit `.env` or
use `NEXT_PUBLIC_` for these values. No default password is provided: missing
password, session secret, or valid site URL disables sign-in and administrative writes.

Open `/?view=admin` and enter the password. Logout is above the admin header.
Sessions use NextAuth's encrypted, HttpOnly, SameSite cookies, with Secure cookies
in production and a hard eight-hour lifetime. Changing the password or session
secret and restarting invalidates existing sessions. Logout clears this browser's
cookie; copied session tokens remain valid until expiry or secret/password rotation.

All administrative writes (including observation creation/simulation and revision
restore), revision history, and non-published strategy access require login.
Published browsing and `POST /api/match` remain public. Cookie-authenticated writes
also require an Origin header matching `NEXTAUTH_URL`. Deploy behind HTTPS.

Login attempts are limited to ten per minute across each server process. This is
a shared-password setup, without individual accounts or audit attribution; for
multiple server replicas, add shared rate limiting at the hosting proxy. The local
limit resets on restart and can temporarily block all administrators after failed
attempts. Existing automation that writes to the API now needs an authenticated
session and matching Origin; it has no unauthenticated bypass.

Run `node tests/admin-auth.mjs` and `node tests/admin-auth.mjs --unconfigured`
for authentication integration checks (temporary server on port 3107; no database writes).

### Where things are

```
prisma/
  schema.prisma            # Strategy, Asset, Network, Protocol, Revision + join tables
  seed.ts                  # realistic demo data
db/
  custom.db                # SQLite database file (created by db:push)
src/
  app/
    page.tsx               # single-route app shell (views via query params — see nav.ts)
    layout.tsx             # fonts + providers
    globals.css            # design tokens + Matrix identity utilities
    api/                   # REST API (strategies, assets, protocols, networks, meta)
  components/
    app/                   # public chrome (header, footer, shell)
    public/                # archive, strategy detail, protocol/asset browsers
    admin/                 # strategy list, strategy form, taxonomy managers, revisions
    shared/                # badges, monogram icons, section headings, states
  hooks/use-strategy-data.ts   # TanStack Query hooks (single source for all data)
  lib/
    types.ts               # shared domain types (the API contract)
    api-client.ts          # typed REST client
    validation.ts          # zod schemas
    strategy-form.ts       # admin form state + DTO/input conversions
    server/strategy-serializer.ts  # Prisma <-> DTO, slugs, revision snapshots
    nav.ts                 # view URL builders (swap to real routes later)
  store/ui-store.ts        # Zustand: archive filters (survive navigation)
```

### Views (single route, shareable URLs)

| URL | View |
|---|---|
| `/` | **Archive entrance** — guided retrieval: MARKET → MARKET PHASE → ASSETS → OBJECTIVE → RESULTS → record |
| `/?view=explore&step=market` | Guided flow steps (market / phase / assets / objective) |
| `/?view=results&market=bear&phase=early-recovery&assets=eth&objective=accumulation` | Retrieved records + ARCHIVE MATCH scores |
| `/?view=all` | Browse all records — search, facet filters, GRID / INDEX layouts |
| `/?view=strategy&slug=accumulation-lp` | Strategy record (editorial detail page, sticky 01–09 index) |
| `/?view=protocols` / `/?view=assets` / `/?view=networks` | Taxonomy registries (dark archive theme) |
| `/?view=match` | Legacy — redirects to the archive entrance (API stays) |
| `/?view=admin` | Admin CMS (Strategies / Assets / Protocols / Networks) |
| `/?view=admin&new=1` / `/?view=admin&edit=<id>` | Strategy editor |

### Smooth scrolling (public frontend)

The public Archive mounts a [Lenis](https://lenis.darkroom.engineering) instance inside
`ArchiveShell` (`src/components/archive/smooth-scroll.tsx`) for a subtle, weighted scroll
feel — `lerp 0.12`, no input hijacking beyond the wheel, native touch scrolling preserved.
Reduced-motion users never get the instance (all helpers degrade to native scrolling),
sticky headers and the scroll-spy record index work unchanged, and the global search
overlay pauses the virtual scroll. In-page anchors (`#section`) — the Record Index —
scroll smoothly through the shared helpers in `src/lib/smooth-scroll.ts`, which any future
feature can reuse. The admin CMS keeps native scrolling.

---

## Data model highlights

- **Strategy** — the *permanent, structured definition*: identity (name, slug,
  `STRATEGY_XXX`, type, status), instructions (ordered steps, entry/exit condition lists),
  market fit (two-layer classification, see below), risk profile
  (overall + leverage/liquidation/IL/contract/volatility as structured enums), requirements,
  references, review dates.
- **Asset / Protocol / Network** — reusable taxonomy collections; strategies reference them
  through three asset roles (deposit / exposure / reward) and platform relations.
  Assets carry `coingeckoId` + icon slots so CoinGecko metadata can be attached later without
  schema changes.
- **Revision** — immutable snapshot created automatically before every material edit
  (`PUT`), with optional change notes. Admin can inspect and **restore** any revision
  (restore itself auto-snapshots the live state first, so it's reversible).
- **Status lifecycle** — `DRAFT` (admin-only) → `PUBLISHED` (public + future AI matching)
  → `ARCHIVED` (hidden, retained). Only `PUBLISHED` strategies are returned by the public
  API by default.

### Two-layer market classification

Every strategy's `marketFit` carries two levels of market context (the canonical registry
lives in `src/lib/secondary-regimes.ts`):

| Layer | Values | Required | Used for |
|---|---|---|---|
| **Level 1 — primary regimes** | `BULL` · `SIDEWAYS` · `BEAR` | yes | the simple public classification, archive discovery, the strongest match signal |
| **Level 2 — secondary regimes** | `EARLY_RECOVERY` · `BTC_LED_EXPANSION` · `ALT_EXPANSION` · `LATE_BULL_DISTRIBUTION` · `CAPITULATION_DELEVERAGING` · `LOW_VOL_COMPRESSION` · `HIGH_VOLATILITY_CHOP` | optional (zero or more) | strategy documentation ("Best during"), ranking inside a primary regime, future AI agents |

```json
"marketFit": {
  "regimes": ["BEAR", "SIDEWAYS"],
  "scores": { "BEAR": 90, "SIDEWAYS": 80 },
  "secondaryRegimes": ["EARLY_RECOVERY", "LOW_VOL_COMPRESSION"],
  "secondaryScores": { "EARLY_RECOVERY": 90, "LOW_VOL_COMPRESSION": 85 },
  "explanation": "…"
}
```

Both layers are optional-safe: older records without Level-2 data deserialize to an empty
array and keep ranking on the classic factors — nothing breaks, nothing is rejected.
The public discovery flow stays three-regime simple; secondary regimes appear as the guided
**MARKET PHASE** step (02) in the retrieval flow, the **MARKET PHASE** facet in Browse All
and as a "BEST DURING" block on record pages.
When a future Matrix Finance regime detector supplies
`{ regime: "BEAR", secondaryRegime: "CAPITULATION_DELEVERAGING" }`, both matching engines
use it to rank strategies without ever filtering records out for lacking it.

### Curated objectives

Strategies carry an optional curated `objectives` list (the seven user-facing goals of the
public Archive — `yield`, `accumulation`, `liquidity`, `capital-preservation`, `growth`,
`hedging`, `advanced`; definitions in `src/lib/strategyObjectives.ts`). Resolution order:
the curated list wins; records without one derive objectives deterministically from the
mechanical strategy type. The official collection ships with curated objectives on all 19
records; legacy/admin-created records fall back to the derived mapping automatically.

### Initial official collection

The Archive is seeded with **19 published strategy archetypes** (STRATEGY_001–019) written
to a research-grade documentation standard, plus two preserved legacy records (a DRAFT and
an ARCHIVED one) that demonstrate the non-published lifecycle. Every one of the seven market
phases has at least three suitable strategies (validated at the end of `prisma/seed.ts`).
Seed content lives in `prisma/seed-data/` (split into three record files + a shared contract)
so it can be reviewed and extended independently of the seeding logic.

### Data separation (important architectural rule)

Live market data — APY, TVL, prices, current regime, incentives — is **never** stored inside
the strategy definition. The strategy describes *how it works*; changing market observations
will be attached later by Matrix Finance/AI services via separate tables keyed by strategy id.
The current schema is already structured for this.

---

## REST API

Base URL: `/api`

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/strategies` | Public list (PUBLISHED only). Filters: `q, regime, secondaryRegime, risk, type, network, protocol, asset, leverage, liquidation, status=ALL\|DRAFT\|…` |
| GET | `/strategies/:idOrSlug` | Full strategy document |
| POST | `/strategies` | Create (admin). Generates `STRATEGY_XXX` + unique slug when omitted |
| PUT | `/strategies/:id` | Update (admin). Auto-creates a revision snapshot on material edits; optional `changeNote` |
| DELETE | `/strategies/:id` | Hard delete (admin) — prefer archiving |
| GET | `/strategies/:id/revisions` | Revision list with parsed snapshots |
| POST | `/strategies/:id/revisions/:revId/restore` | Restore a revision (safe — snapshots current state first) |
| GET / POST | `/assets` · PUT `/assets/:id` | Asset registry |
| GET / POST | `/protocols` · PUT `/protocols/:id` | Protocol registry |
| GET / POST | `/networks` · PUT `/networks/:id` | Network registry |
| GET | `/meta` | Distinct strategy types + database counters |
| POST | `/match` | **Strategy matching** — rank PUBLISHED strategies against a profile |

Example — the AI/agent matching call (the guided Archive flow uses the client-side
`lib/matching.ts` sibling with the same explainable philosophy):

```json
POST /api/match
{
  "assetIds": ["ETH", "USDC"],      // asset ids OR symbols
  "regime": "BEAR",                  // BULL | SIDEWAYS | BEAR
  "secondaryRegime": "CAPITULATION_DELEVERAGING",  // optional Level-2 condition
  "riskTolerance": "MEDIUM",         // LOW | MEDIUM | HIGH | VERY_HIGH
  "capital": 10000                   // optional, USD
}
```

Every result carries the full strategy DTO, a weighted composite score
(regime fit 50% · risk alignment 25% · asset overlap 15% · capital eligibility 10%;
with an optional `secondaryRegime` supplied, a fifth "market condition" factor joins at
15% and regime fit moves to 35% — the primary regime stays the strongest signal),
a factor breakdown with notes, matched/missing deposit assets, and a
human-readable `reason` — so rankings are deterministic and auditable end-to-end.
Strategies without secondary-regime metadata are never rejected for lacking it.

Filtering example:

```
GET /api/strategies?regime=BEAR&secondaryRegime=CAPITULATION_DELEVERAGING
```

---

## Extending the system

- **New strategy types** — free-form by design; the admin form offers known types plus a
  custom input. No schema change needed.
- **New regimes / risk levels** — edit the union types + label maps in `src/lib/types.ts`
  and `src/lib/format.ts`. Secondary (Level-2) regimes live in the canonical registry
  `src/lib/secondary-regimes.ts` — one file drives the admin form, record pages, filters,
  matching engines and seed data.
- **CoinGecko icons** — populate `Asset.iconUrl` (or a future sync job using `coingeckoId`);
  the UI renders icons when present and falls back to category-tinted monograms.
- **Authentication for admin** — shared-password NextAuth login gates `/?view=admin`;
  server guards protect administrative endpoints. Configuration is described above.
- **Matrix Finance / AI agents** — consume the same REST API. `POST /api/match` already
  ranks strategies against a profile (holdings, regime, optional Level-2 condition, risk
  tolerance, capital) with an auditable factor breakdown; agents can also query structured
  fields directly: `marketFit.regimes`, `marketFit.scores`, `marketFit.secondaryRegimes`,
  `marketFit.secondaryScores`, `risk`, `requirements.minCapital`,
  `depositAssets`, `networks`, `protocols`, `type`. A future regime detector only needs to
  supply `regime` + `secondaryRegime` — the matching infrastructure is already in place.
