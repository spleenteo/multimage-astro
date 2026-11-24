# Slice packet — borsa V2

READ THIS WHOLE FILE (lessons: two executors stopped at line 557 and missed the project constraints at the end).

No frame (product work, problem clear; no criterion block).

## Project constraints
No push. Never touch credentials or .env* files (adding optional envField declarations in astro.config.mjs is in scope for V2, setting values is not). Italian copy, English code comments and docs. Commit with explicit paths, imperative messages, with the trailer lines: 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' and 'Claude-Session: https://claude.ai/code/session_01RKnBua6f6ZuWphGxaTmX5B'. Shell: rm is intercepted, use /bin/rm. Do not start a dev server unless a check needs one; stop it afterwards; the user's own servers on 4321, 4329, 5198 must not be touched. Never edit schema.ts; never _private GraphQL fields; Workers Free plan only.

## Slice section (slices.md)
## V2 — The order page and the sending endpoint

**In**

- `/borsa` page (`src/pages/borsa/index.astro`): static, cacheable, `noindex`. Title row "La tua borsa" with the serif size line filled by the script. Two columns from 768px: form (7fr) and recap aside (5fr, mist) holding the bag lines, totals (copies, shipping, total), "Modifica la borsa" (opens the drawer), "Cosa succede dopo" (four steps) and the bank box (IBAN grouped by four, BIC, PayPal, "Copia l'IBAN"). One column on phones with the recap first. Empty bag: the page says so and links to the catalogue, no form.
- Form: nome e cognome, email, telefono (optional), indirizzo, CAP e città, provincia, spedizione (radio rows: piego di libri gratuito ~1 settimana, rapida e tracciabile +5 €), ordini come (privato, scuola, associazione, libreria; segmented radios), note (optional, max 1000 chars), privacy consent (required, linking the site's privacy page if one exists, else the consent sentence alone). Client validation with messages under fields that name the problem and the fix; server repeats it.
- Turnstile widget (explicit render, site key from a public env var; when unset in dev, use Cloudflare's always-pass test key).
- `POST /api/ordine` (`src/pages/api/ordine.ts`, `prerender = false`): JSON body; validates fields and lengths, quantities 1–20, at most 30 lines; verifies Turnstile (siteverify); refetches the books by id from the CDA (published content only) and rebuilds titles and prices, dropping lines whose book is not orderable; computes totals with the shipping fee; builds one plain-text email (fixed template, Italian) via a pure function in `src/lib/order.ts`; sends through a mail transport: Resend HTTP API when the key is set (first to ordini@ with `Reply-To` the visitor, then the copy to the visitor with `Reply-To` ordini@); in dev with no key, logs the email text to the server console. Answers `{ ok, copySent }`, or an error code the page turns into a message. No personal data in logs in production.
- Success state on the page: "Ordine inviato, grazie", the lines and total, the next steps with IBAN, "Torna al catalogo"; the bag is emptied. If `copySent` is false, the page says the order reached Olivier but the copy didn't, and suggests printing the page.
- Env schema: three optional fields in `astro.config.mjs` (`RESEND_API_KEY` secret, `TURNSTILE_SECRET_KEY` secret, `PUBLIC_TURNSTILE_SITE_KEY` public) plus the sender address constant in `src/lib/order.ts`. No values are set anywhere by this work.

**Out**: setting the real keys, the Resend account, the DNS records, the WAF rule (user's setup, listed in the closing report).

**Done**

1. With books in the bag, `/borsa` shows the recap and totals that match the drawer; switching to rapid shipping adds 5,00 € to the total.
2. Submitting with an incomplete email shows the message under the field and focuses it; nothing is sent.
3. Local dev, no Resend key, Turnstile test key: a valid submit shows the success state, empties the bag, and the server console prints the email with the server's titles and prices (a tampered price in `localStorage` doesn't reach the email).
4. The endpoint rejects: a missing or failed Turnstile token (400), a body over limits (400), an empty bag (400), a non-POST (405).
5. Empty bag on `/borsa`: message and link to the catalogue, no form.
6. Keyboard and screen reader: labels, errors linked with `aria-describedby`, the success heading takes focus.
7. Gate green.

**Gotchas**

- Sensitive area (`src/pages/api/`): tests required by the `essential` level, but the project has no test runner. The endpoint's logic lives in pure functions in `src/lib/order.ts` (validation, rebuild, email text) so they can be exercised by a small `tsx` script; the gate stays build + lint.
- The endpoint must not be cached by the Gateway or the Workers Cache: check `src/worker.ts` for how `/api/*` routes are treated.
- CPU: the endpoint runs once per order; the fetches (siteverify, CDA, two Resend calls) are I/O, not CPU.

**Impact corrections (2026-11-24)**

- `/borsa` is server-rendered and cached like every page (no `prerender` export, layout cache tags as usual); no per-request data. `noindex` through the `seo` prop as `src/pages/404.astro:10` does; no robots.txt line; not added to `src/pages/sitemap.xml.ts`.
- Missing keys fail closed outside dev. Test keys (Turnstile site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`) and console logging of the email only when `import.meta.env.DEV`. In a production build with no `PUBLIC_TURNSTILE_SITE_KEY`, `/borsa` shows the bag and the `mailto:` fallback (built from all bag lines) instead of the form. The endpoint answers 503 with an error code when `RESEND_API_KEY` or `TURNSTILE_SECRET_KEY` is unset, and the page then offers the `mailto:`. Nothing personal is logged in production, ever.
- siteverify checks `success`, `hostname` and `action` (`ordine`).
- Refetch: `allBooks(first: 30, filter: { id: { in: [...] } })`, each id checked against `^[A-Za-z0-9_-]{1,40}$` first, selecting `id title slug price format archive authors { name }`; through `executeQuery` with `includeDrafts: false` (environment from `DATOCMS_ENVIRONMENT`). Lines whose book is missing or fails `isOrderablePrint` are dropped.
- The endpoint answers `{ ok, copySent, lines, copies, shipping, total, dropped }`; the success state renders the server's values and names dropped or repriced lines.
- The endpoint lives at `src/pages/api/ordine/index.ts` (folder style, like the other API routes); exports `POST` and `ALL` returning 405; does not use `src/pages/api/utils.ts` helpers (no CORS `*`, no error echo); error bodies carry codes only; must not import `cloudflare:workers` (the Vercel build in the gate).
- Caching is already handled: `src/worker.ts:48-56` gives `/api` no cache key, `src/middleware.ts:120-139` sets `cache.set(false)` and `private, no-store` on `/api` and non-GET. Replace the caching gotcha with a Done check.
- Privacy: the consent links the iubenda privacy page used in `src/components/Footer.astro:80`.
- Done, added: 8. Production build (no keys, `astro preview` or a local Cloudflare build): `/borsa` shows the mailto fallback; a direct POST answers 503 with a code; nothing personal in the log. 9. A stale price in `localStorage` shows the server's price on the success state. 10. The POST response carries `cache-control: private, no-store`.


Cross-cutting rules for every slice:

- Pages stay cacheable and identical for every visitor: no cookie, no per-visitor HTML. All bag state is client-side.
- Client code is small vanilla TypeScript in `<script>` tags processed by Astro (as the catalogue and search do), no framework island.
- Copy is Italian, the product's own words: "borsa", "Metti in borsa", "Completa l'ordine", "Invia l'ordine". Never "carrello", "checkout", "acquista", "paga".
- Order facts (ordini@, IBAN, BIC, intermediary SWIFT, PayPal, shipping kinds and fee, quantity cap 20) live in one module, `src/lib/order.ts`, used by page, drawer and email.


## Context from shaping and spike
Shape B parts B4 and B5 in docs/work/2026-11-24-borsa/shaping.md; sending via Resend HTTP API (docs/work/2026-11-24-borsa/spike-email.md: endpoint https://api.resend.com/emails, Bearer key, JSON {from,to,reply_to,subject,text}). Order facts from /info/ordinare: Banca Etica IBAN IT50T0501802800000011361524, BIC ETICIT22XXX, intermediary SWIFT POSOIT22XXX, intestato Associazione Multimage, PayPal info@multimage.org, causale 'Ordine libri', send the receipt to ordini@multimage.org; shipping: piego di libri free (~1 week) or fast tracked +5 €; special conditions for schools, associations, bookshops. Sender address constant: ordini@send.multimage.org is NOT decided; use a named constant ORDER_FROM = 'Multimage <ordini@send.multimage.org>' with a comment that the user confirms it at Resend setup.

## What V1 built (read the code)
src/lib/order.ts (no imports; facts, isPrintInCatalogue, isOrderablePrint, toCents, clampQty, formatCents, bagTotals, copiesLabel, booksLabel, toBagItem, bagBookFor), src/lib/bag.client.ts (readBag, addBook, setQty, removeItem, emptyBag, onBagChange, openBag), src/components/BagDrawer/ (dialog, drawer.client.ts initBagDrawer, CTA to /borsa), src/components/BagAdd/, header buttons in src/components/Header.astro. V1 narrative is in slices.md above.

## Visual reference
docs/design/borsa/borsa-mock.html, states '/borsa' and 'Ordine inviato' (comp; reuse the site's components, Button, tokens and DESIGN.md: Inputs/Fields, checkbox/radio rows, segmented flat cells like /cerca toggles, mist panel, Playfair figures, one orange action 'Invia l'ordine').

## lessons.md
# Lessons — borsa

- A Verified grep that expects two attributes on one line fails after prettier splits attributes; write it with -A/-B context or grep each attribute separately.
- When a new control joins a fixed-width row, the plan sums the row at 390px before execution: logo, gaps and every button, against the container minus its padding.
- A fixed-height group with a border shrinks its stretched children by the border width; give the controls the 44px height, not the group.
- A data-* ready flag must be set to a non-empty value ('true') and compared with ===; an empty string is falsy and the guard never fires.
- A plan that says module A "exports" a helper for task B checks that A's own task text lists the export; otherwise B is blocked outside its Files.
- Executors read the packet whole; two read only to line 557 of 766 and missed the project constraints.

## Test level
essential. The endpoint is in a sensitive area (src/pages/api/). No test runner: the endpoint's logic lives in pure functions in src/lib/order.ts (validation, rebuild from CDA records, totals with shipping, email text) and is exercised by throwaway 'npx tsx' assertion scripts under $TMPDIR; the endpoint itself is checked with curl against a dev server (and a production-mode check for the fail-closed paths). Gate = npm run lint + npm run build.

## Development guidelines
# Development guidelines

Read whole by `/flow:dev` in every plan, review, execution and close. Prose guidance per concern lives in `docs/guidelines/`.

## References

- Astro docs (docs.astro.build) for directives and APIs.
- DatoCMS skills, when in session: `datocms-cli` (CLI, migrations, environments, schema), `datocms-cda` (queries, cache tags, type generation), `datocms-frontend-integrations` (draft mode, Content Link, components), `datocms-structured-text`, `datocms-content-modeling`. Otherwise `datocms cma:docs` and datocms.com — never memory.
- Project conventions: `CLAUDE.md` and `docs/guidelines/`.

## Tests

Level: essential
Sensitive areas: `src/pages/api/` (revalidate, draft-mode, post-deploy), `src/middleware.ts`, draft mode and editor session, `src/lib/datocms/` (queries, fragments, revalidation map), `scripts/`

No test runner is configured: `npm test` runs format + lint + build, so it rewrites files. Verification is the gate below plus a working deploy.

## Gate

- `npm run lint` (prettier check)
- `npm run build` (runs `astro check` then `astro build`; needs the local `.env`)

## Guidelines

### docs/guidelines/security.md
---
description: Track security risks, mitigations, and review checkpoints for Multimage.
---

# Security Overview

## Critical Findings

- **Rich-text XSS (CWE-79)** — `toRichTextHtml` returns raw CMS HTML and multiple templates bind the result with `set:html`, so any editor-provided `<script>` executes for visitors. Harden `src/lib/text.ts:65-95`, audit `src/pages/index.astro:345-355`, `src/components/SupplierCard/index.astro:71-139`, and `src/pages/autori/[slug]/index.astro:138-158` to use Structured Text renderers or sanitize output.
- **Catalog data exposure (CWE-200)** — _Resolved 2026-05-31 (S1)._ Internal routes (`/staff`, `/staff/archivio-catalogo`, `/libri/schede/*`) are gated centrally in `src/middleware.ts`: a request without the editor session (the signed draft-mode JWT cookie) gets a flat `404` before any render, so the public never learns the paths exist nor receives inventory/CSV data. Enforcement is single-point — pages no longer guard themselves. The bearer-token model fits the sensitivity (stock/circulation business data, not PII); see `docs/decisions-log/2026-05-31-editor-session-gating.md`.

## High-Priority Gaps

- **Preview tokens rotation** — `/api/preview` and `/api/draft-mode/*` now enforce `SECRET_API_TOKEN` and drop signed cookies before toggling Draft Mode. Keep the CDA draft token and secrets rotated across Vercel environments so a leaked URL cannot grant long-term preview access.
- **Unbounded CSV export** — The staff CSV button currently serializes the full catalogue on the client (`src/pages/staff/archivio-catalogo/index.astro:200-317`). Even after the page is secured, validate user roles and strip fields that should never leave the CMS.

## Additional Observations

- **Third-party scripts** — Google Analytics and Iubenda are injected inline in `src/layouts/BaseLayout.astro:132-210` with no integrity hints. Load them with `async`/`defer`, monitor outages, and keep the snippet list minimal.
- **LLM export** — the `/llms-full.txt` route was removed (2026-06-20), closing **S4**: the full catalogue + long-form bios/emails are no longer published in plaintext to anonymous visitors.
- **DatoCMS client errors (S5 still open)** — since V5 the CMA `authorization` header is redacted in a CMA `ApiError` and a CDA error's options no longer serialize, but `handleUnexpectedError` (`src/pages/api/utils.ts`) still returns a CMA error's `request.body` to the caller, so a `/api/post-deploy` 500 can carry `SECRET_API_TOKEN` (in `previewWebhook`/`htmlGeneratorUrl`).
- **Environment documentation** — `.env.example` only mentions the published CDA token; document draft/CMA tokens separately so engineers do not reuse privileged keys accidentally.
- **Search token scoping** — Ensure `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` is created with a Site Search–only role. Admin/CMA tokens must never be exposed because the value ships to the browser (`src/pages/cerca/index.astro:6-78`).

---

## Environment Variables Audit (2026-05-16)

### Matrix

| Variable | Astro context | Astro access | Optional? | Ships to client? | Used in | Vercel must have |
|---|---|---|---|---|---|---|
| `SERVER` | server | public | yes | no | `src/lib/draftPreview.ts`, `src/lib/prerender.ts` (build-time selector "static"/"preview") | yes — set per env |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | server | secret | no | no | `src/lib/datocms/executeQuery.ts` | yes |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | server | secret | no | no | `executeQuery.ts`, `DraftModeQueryListener` | yes (preview env) |
| `DATOCMS_CMA_TOKEN` | server | secret | yes | no | `src/pages/api/seo-analysis/index.ts` (runtime), `src/lib/datocms/siteSearch.ts` (via `/api/revalidate` and `/api/invalidate-cache`) | SEO analysis and Site Search reindex |
| `SECRET_API_TOKEN` | server | secret | no | no | `post-deploy`, `preview`, `preview-links`, `seo-analysis`, `draft-mode/enable` | yes |
| `SIGNED_COOKIE_JWT_SECRET` | server | secret | no | no | `src/lib/draftMode.ts` | yes |
| `SITE_SEARCH_BUILD_TRIGGER_ID` | server | secret | yes | no | `src/lib/datocms/siteSearch.ts` (reindex after a publish, with `DATOCMS_CMA_TOKEN`) | Site Search reindex (id `37696`; Secret type on Vercel, unreadable) |
| `BYPASS_TOKEN` | build / server | secret | yes | no | `astro.config.mjs` (ISR `bypassToken`), `src/lib/draftMode.ts`, `/api/revalidate` | Vercel only (not on the Worker) |
| `DRAFT_MODE_COOKIE_NAME` | server | secret | yes | no | `src/lib/draftMode.ts` | optional |
| `CACHE_INVALIDATION_WEBHOOK_SECRET` | server | secret | yes | no | `src/pages/api/invalidate-cache/index.ts` (Bearer) | no (Cloudflare Worker secret only) |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | client | public | no | **YES** | `src/pages/cerca/index.astro` (via `import.meta.env`), search bundle | yes |
| `PUBLIC_SITE_URL` | client | public | no | **YES** | BaseLayout canonical, sitemap, `post-deploy` | yes |
| `DATOCMS_API_TOKEN` | — (not declared) | — | — | no | only `scripts/sync-datocms.mjs` (local dev) | **NO — dead weight on Vercel** |

### Findings

1. **`DATOCMS_API_TOKEN` su Vercel non viene letto a runtime.** Lo script `sync-datocms.mjs` gira solo da `npm run dev`/`start` (locale), non da `npm run build`. Tenerlo su Vercel è solo superficie d'attacco senza utilità. → **Action**: rimuovere da tutti gli env Vercel.
2. **6 secret su Vercel sono "Needs Attention"** (non cifrati at-rest nel dashboard team): `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DATOCMS_API_TOKEN` (verrà eliminato), `DATOCMS_CMA_TOKEN` (se presente). → **Action**: migrare a tipo *Sensitive*.
3. **`PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` scope da verificare.** Il token finisce nel bundle JS del browser (`src/pages/cerca/index.astro:11` via `import.meta.env`) ed è quindi leggibile da chiunque. Deve essere un token DatoCMS con **solo il ruolo "Site Search"** (read-only sull'endpoint `/search-results`). Se ha permessi più ampi (CDA published, CDA draft, CMA) è una **leak severa**.
4. **`PUBLIC_SITE_URL` è safe** — è solo `https://www.multimage.org`, nessun problema a esporlo al browser.

### Cloudflare Worker secrets

On the Cloudflare target the variables above are Worker secrets, not Vercel env vars (switch procedure: `docs/guidelines/cloudflare-switch.md`):

- Set with `npx wrangler secret put <NAME>` (or `wrangler secret bulk`), through the env-file wrapper described in `docs/guidelines/operations.md`; list the names with `npx wrangler secret list` (it never prints values). Never commit a secret file or print a value.
- The Worker has the nine secrets listed in `docs/guidelines/operations.md` (Environment & Secrets) and `cloudflare-switch.md` (Starting point); `BYPASS_TOKEN` is Vercel-only and must not be created there. `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID` are added on switch day.
- `CACHE_INVALIDATION_WEBHOOK_SECRET` exists only on the Worker, in the Authorization header of the DatoCMS `cda_cache_tags` webhook and in the build env file outside the repo (runbook step 0); it can be regenerated and re-put if lost, as long as the two match. `/api/invalidate-cache` rejects any other bearer.
- `SIGNED_COOKIE_JWT_SECRET` on the Worker must equal the Vercel value, otherwise editors' 30-day sessions end at the switch.
- Draft HTML is never stored: it carries the draft CDA token, so the gateway sends draft requests `no-store` and the middleware sets `Cache-Control: private, no-store` (`docs/guidelines/preview-mode.md` § 1).

### Vercel: migrazione a "Sensitive"

Per ogni secret marcato "Needs Attention", da fare via dashboard (richiede manual action — non automatizzabile via API senza CLI auth):

1. Apri Project Settings → Environment Variables
2. Clicca la variabile → "Edit"
3. Cambia il tipo da "Plain text" a **"Sensitive"** (encrypted at-rest)
4. Salva — il valore resta lo stesso, non serve rotazione
5. Conferma che il badge "Needs Attention" sparisce

**Ordine consigliato** (più sensibili prima):
1. `SIGNED_COOKIE_JWT_SECRET` (controlla draft mode auth)
2. `SECRET_API_TOKEN` (gatekeeper API routes)
3. `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (legge contenuti draft)
4. `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` (legge contenuti pubblicati)
5. `DATOCMS_CMA_TOKEN` (se presente — accesso CMA full)
6. **Elimina** `DATOCMS_API_TOKEN` da Vercel (non serve)

**Rotazione**: non necessaria salvo sospetto compromissione. Migrare a Sensitive **conserva lo stesso valore** — la cifratura at-rest è la sola differenza.

### Verifica `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`

Da fare su DatoCMS:

1. Vai su Project settings → API tokens
2. Trova il token usato come `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`
3. Verifica:
   - Role: **"Site Search"** (built-in role)
   - Permissions: solo `Use the Site Search API`
   - NON deve avere accesso a CDA, CMA, o altri endpoint
4. Se il token ha permessi più ampi → creare un nuovo token "Site Search" only, sostituire su Vercel, eliminare quello vecchio

### Public env vars: review

Le sole variabili che finiscono nel bundle browser (per dichiarazione `context: 'client'` o uso via `import.meta.env`):

- `PUBLIC_SITE_URL` — safe (URL pubblico)
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` — safe **solo se scope verificato come Site Search-only** (vedi sopra)

Nessun secret è accidentalmente prefissato `PUBLIC_*` in `astro.config.mjs`. ✅

### docs/guidelines/routing.md
---
description: The setup is enhanced with i18n routing, API routing, nested page routing and helpers to resolve routes.
---

# Routing

## I18n routes

Fastro supports multi-language websites with localised routing (`/:locale/page/to/page/`). See [i18n configuration and routing](./i18n.md).

The main locale (usually `ìt`) runs at domain level, while optional others run `/domain/:locale/...`

## Nested routes

Fastro supports nested pages, so editors can create page URLs like `/en/overview-page/category-page/detail-page/`. This is achieved using a `parentPage` field\* in Page models in the CMS, combined with a catch all route `src/pages/[locale]/[...path]/` using [Astro rest parameters](https://docs.astro.build/en/core-concepts/routing/#rest-parameters). This setup can be copied for new page models added to your project.

To make nested routes more useful for website visitors and easier to manage for developers, Fastro provides a [Breadcrumbs component](../src/components/Breadcrumbs/) and [`getHref()` helpers for all linkable models](../src/lib/routing/index.ts).

## Internal links to records

Content editors can link to other models (like Home or generic Page) within Structured Text fields. To create nodes for these links, Fastro provides a reusable [Item Link](../src/blocks/TextBlock/nodes/ItemLink.astro).

When you want to make a new content model available for linking:

1. Add the model to the references option of all relevant Structured Text fields in the CMS.
2. Add the links to the GraphQL fragments of the related blocks (like [`TextBlock.fragment.graphql`](../src/blocks/TextBlock/TextBlock.fragment.graphql)).
3. Extend the generic [`getHref()` helper](../src/lib/routing/index.ts) to resolve the URL for the new model.

## 404 routes

Fastro leverages [Astro's Custom 404 Error page](https://docs.astro.build/en/basics/astro-pages/#custom-404-error-page) (located in [`src/pages/404.astro`](../src/pages/404.astro)), connected to the Not Found model in DatoCMS.

## API routes

Astro supports [API routes](https://docs.astro.build/en/core-concepts/endpoints/#server-endpoints-api-routes) (server endpoints), which can be any route in `src/pages/`. Fastro uses a convention to place all API routes in `src/pages/api/`. This way it's clear where all API routes live, they have a logical URL prefix in the browser (`/api/`) and [API routes not found](../src/pages/api/[...notFound].ts) can be caught and respond with a 404 JSON response, rather than an HTML response.

## Partial page routes

Astro supports [Page Partials](https://docs.astro.build/en/basics/astro-pages/#page-partials) to fetch and use in conjuction with client-side scripts. As a convention Fastro uses a `.partial.astro` for these routes. An example is the [`search/results.partial.astro` route](../src/pages/[locale]/search/results.partial.astro).

## Redirects

Fastro supports redirect rules which are editable and [sortable](https://www.datocms.com/docs/content-modelling/record-ordering) in the CMS. Fastro uses [`regexparam`](https://github.com/lukeed/regexparam) to handle redirect rules with static paths, (optional) parameters and (optional) wildcards. Examples:

- from `/redirect/static-path/` to `/new-static-path/`
- from `/path-with-param/:name/` to `/new-path-with-param/:name/more-slug`
- from `/path-with-wildcard/*` to `/new-path-with-wildcard/*` (or `/new-path-with-wildcard/:splat`)

### docs/guidelines/cms-data-loading.md
---
description: GraphQL data loading conventions and patterns for Multimage.
---

# CMS Data Loading

## Core helper: `executeQuery`

All GraphQL calls go through `src/lib/datocms/executeQuery.ts`. It wraps `@datocms/cda-client` and selects the correct token automatically:

```ts
import { executeQuery } from '~/lib/datocms/executeQuery';

const result = await executeQuery<MyQueryType>(MY_QUERY, {
  variables: { slug: 'my-slug' },
  includeDrafts: false,     // default false; true in preview mode
  excludeInvalid: true,     // default true
  environment: 'sandbox',   // optional; omit for default environment
});
```

Token selection:
- `includeDrafts: false` → `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`
- `includeDrafts: true` → `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (required in preview deployments)

## Query colocation

Every page or component that fetches data keeps a sibling `_graphql.ts` that exports the query string and TypeScript helpers:

```
src/pages/libri/[slug]/
├── index.astro        ← consumes the query
└── _graphql.ts        ← exports query string, fragments, and typed helpers
```

Shared fragments (e.g. `ResponsiveImageFragment`, `BANNER_SECTION_FRAGMENT`) are defined once and re-exported from the component's `index.ts` to keep import sites tidy.

## Draft mode integration

In `.astro` files that support preview, resolve draft mode before executing queries:

```ts
import { resolveDraftMode } from '~/lib/draftPreview';

const { isEnabled: includeDrafts } = resolveDraftMode(Astro);
const data = await executeQuery(QUERY, { includeDrafts });
```

Draft mode is active per request, when the signed draft-mode cookie is present. On Vercel the ISR copy is skipped through `__prerender_bypass`; on Cloudflare the gateway sends the request with `cache: 'no-store'` and the middleware makes the response private. Without the cookie, requests use published content.

## Pagination

There is currently no paginated loader. Routes like `/libri`, `/autori`, and `/sitemap.xml` use `first: 500` as a workaround. This is a known gap tracked as **CD2** in `docs/TODO.md`.

Until a paginated helper ships: keep `first: 500` and annotate it with `// TODO CD2`.

## Fragment conventions

- Name fragments after their owning component: `BookCardFragment`, `AuthorCardFragment`
- Place fragments in the component's `_graphql.ts` or `index.ts`
- Compose fragments at the page-level `_graphql.ts`
- Never duplicate field selections — always reference the fragment
- Never include fields ending in `_private`

## Error handling

`executeQuery` propagates errors from `@datocms/cda-client`. Failures fail the request during the per-request render (desired — fail fast), surfacing as Astro error pages. Nothing is rendered at build time (ISR).

## Type generation

Types come from `schema.ts`, managed by `npm run generate-schema`. Import CMS types from `~/lib/datocms/types`. Never write CMS types by hand.

## Cache tags (Cloudflare only)

Cache tags drive the Workers Cache on the Cloudflare target (branch `chore/cloudflare`). Vercel production does not use them: it revalidates by URL, see `docs/guidelines/caching.md`.

- `executeQuery` feeds a per-request store. On Cloudflare the middleware opens it for GET requests outside `/api`; a published query then runs through `rawExecuteQuery` with `returnCacheTags` and adds the response's `x-cache-tags` to the store. On Vercel there is no store and the query runs as before.
- A draft query (`includeDrafts: true`) marks the store disabled: the page becomes `private, no-store`, never cached.
- `BaseLayout` passes `cacheTagScope: 'layout'` on its site query. That flag tells the middleware the page carries the layout's tags (menus, favicon), so a page publish purges it. Pass it only from the layout.
- Queries never call `cache.set` or `cache.invalidate`: the middleware makes the one cache decision after the response, and `POST /api/invalidate-cache` purges. A new query needs nothing: its tags are collected automatically.
- Code: `src/lib/datocms/cacheTags.ts`, `executeQuery.ts`, `cacheInvalidation.ts`. Check with `npm run check:cache-tags`. Policy, limits and purge answers are in `caching.md`.

### docs/guidelines/caching.md
---
description: How page caching and revalidation work on both targets (Vercel ISR with a URL-based webhook in production, Cloudflare Workers Cache with DatoCMS cache tags on the branch), what each route depends on, and the known gaps
---

# Caching and revalidation

Audited 2026-11-04 (work `upgrade-2026-11`, slice V1), updated 2026-11-05 for slice V2 (revalidation map fixes), and 2026-11-21 (V3) with the Cloudflare section. This file describes the caching as it is, not as it should be.

## Status

**Two targets, one codebase.** The target is chosen at build time (`DEPLOY_TARGET=cloudflare` selects `@astrojs/cloudflare`, otherwise `@astrojs/vercel`).

- **Vercel (production today)**: ISR, URL-based revalidation. A DatoCMS webhook calls `/api/revalidate`, which maps the changed record to a list of public URLs and refetches each one with the Vercel bypass header so the ISR copy is regenerated. Cache tags are not used. `## Configuration (Vercel)`, `## DatoCMS side`, the route table, the Gaps and the Verification procedure describe this path.
- **Cloudflare (branch `chore/cloudflare`, trial Worker, not yet switched)**: Workers Cache with DatoCMS cache tags, purged by `POST /api/invalidate-cache`. See `## Cloudflare Workers (branch chore/cloudflare)` below. On Vercel there is no cache provider (`context.cache.enabled` is false), so none of that code runs there.

The switch procedure is `docs/guidelines/cloudflare-switch.md`. Cache tags are the shape `docs/shapes/2026-03-05-cache-tags.md`.

## Configuration (Vercel)

- **ISR** (`astro.config.mjs`, `@astrojs/vercel`): `output: 'server'`, nothing is prerendered; every page is an ISR function.
  - `bypassToken: process.env.BYPASS_TOKEN` is read at **build time** from the process environment, so `BYPASS_TOKEN` must be exported when building locally (the build output differs without it).
  - `expiration: 5184000` (60 days) is only a safety net for a missed webhook. Short TTLs re-render about 670 URLs and burn Fast Origin Transfer on the Hobby plan (decision `2026-06-20-fot-reduction`).
  - `exclude: [/^\/api\//]`: API routes are never cached.
  - Since `@astrojs/vercel` 11, `allowQuery` is `x_astro_path` plus `x_astro_path_token`, and the ISR routes rewrite to `/_isr?x_astro_path=$1&x_astro_path_token=<per-build token>` (the token is a `crypto.randomUUID()` per build, never stored; the option names in `astro.config.mjs` are unchanged).
- **Dual cookies** (`src/lib/draftMode.ts`): entering draft mode sets two cookies for 30 days, `multimage_draft_mode` (name overridable with `DRAFT_MODE_COOKIE_NAME`; signed JWT, app-level: unlocks drafts, `/staff`, editor affordances) and `__prerender_bypass` (value `BYPASS_TOKEN`, infra-level: the Vercel CDN skips the ISR copy and renders fresh). `__prerender_bypass` is only set when `BYPASS_TOKEN` exists. Both are `SameSite=None; Secure; Partitioned`.
- **`POST /api/revalidate?token=<SECRET_API_TOKEN>`** (`src/pages/api/revalidate/index.ts`, helpers in `src/lib/datocms/`):
  - **Surgical mode** (default): `parseWebhookPayload` extracts `event_type`, the record `id` (used by `license`), the record `slug` and the model `api_key` (looked up through `entity.relationships.item_type` in `related_entities`); `getRevalidationUrls` maps `api_key` + `slug` to URLs. No `api_key`, or a model not in the map, is a 200 no-op (`noop: true`), so DatoCMS sees success.
  - **Book enrichment**: a `book` change runs one published-token query (`BookRevalidationContext`) to add the catalogue pages (`/libri`, `/libri/pagina/N`), the book's authors and its collection. On failure it falls back to `/libri` only. On unpublish/delete the book no longer resolves, so authors and collection are skipped.
  - **`?mode=full`**: revalidates every public URL (`getAllPublicUrls`, about 670). Manual maintenance only; **never run it against production by hand**.
  - Each URL is fetched with `x-prerender-revalidate: <BYPASS_TOKEN>` against `PUBLIC_SITE_URL`, in chunks of 20 with a 250 ms pause. Locally `PUBLIC_SITE_URL` is the production site.
  - **Site Search reindex**: after every non-no-op call, `reindexSiteSearch` triggers the build trigger `SITE_SEARCH_BUILD_TRIGGER_ID` through the CMA (needs `DATOCMS_CMA_TOKEN`; best-effort, errors swallowed). Locally it hits the production search index unless the trigger id is emptied.
  - **The `success` count lies**: `index.ts:55` counts every settled fetch as success, including 401 and 404 responses; only a rejected fetch is a failure. Judge by `x-vercel-cache` and `age` headers on the affected URLs, never by the JSON counts.
- `/archived-books.json` sets its own `Cache-Control: public, max-age=3600, immutable` (`src/pages/archived-books.json.ts:27`), independent of ISR.
- `/search-books.json` (book details for `/cerca`) sets `Cache-Control: public, max-age=3600` and is in the middleware's `CACHED_NON_HTML_PATHS`, so the Workers Cache keeps it with its `book` tags and a book publish purges it.
- `recordToWebsiteRoute` in `recordInfo.ts` is the sibling map used by the Web Previews / SEO plugins; `revalidationUrls.ts` says to keep the two in sync. Since V2 both read the index paths from one export, `INDEX_PAGE_PATHS` (slug → path, `recordInfo.ts`, no imports), and the 7 phantom api_keys are gone from both. `recordInfo.ts` maps `index_page` by slug and `supplier` → `/distributori`; it maps no route for `license` or `app` (no page of their own).
- `getRevalidationUrls(input, query?)` takes an injectable `query`; the default is a lazy import of `executeQuery`, so the map loads under plain `tsx` (the endpoint passes none and behaves as before).

## DatoCMS side

Read-only, through the `datocms` CLI (`cma:call webhooks find 33942`, `schema:inspect`).

**Webhook 33942**, "Revalidate site cache (ISR)": enabled; payload API version 3; `auto_retry` true; `nested_items_in_payload` false; no custom payload, no filter; one event rule, `entity_type: item`, `event_types: publish, unpublish, delete`; URL `https://www.multimage.org/api/revalidate?token=<redacted>`. There are **no upload (asset) events** and no `update` event: saving a draft does nothing, an asset replaced in place does not revalidate anything.

**Models** (`schema:inspect`, 36 total). Mapped in `getRevalidationUrls`: `book`, `author`, `collection`, `blog_post`, `page`, `home`, `index_page`, `supplier`, `license`, and `app` as a deliberate no-op. `index_page` is the real model behind every index page (one record per page, read by `slug`: `libri`, `archivio`, `collane`, `autori`, `magazine`, `distributori`); the `libri` slug maps to `/libri` only (the catalogue is one faceted page since 2026-11-22; `/libri/ebooks` and `/libri/highlights` are 301s to its filters), and an unknown slug, `ebooks` and `highlights` included, is a no-op. `supplier` revalidates `/distributori`. `license` has no slug: the payload's record id finds the books that link it (`allBooks(filter: { license: … })`), and only those books' `/libri/<slug>` pages are revalidated. `app` returns no URL on purpose: its only reader, `/libri/schede/[slug]`, is staff-gated, so a revalidation fetch would only re-cache the anonymous 404. The 7 api_keys V1 found mapped but absent from the project (`books_index`, `archive_index`, …) were removed in V2.

| api_key           | Kind      | Read by                                                                                              | Mapped                               |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `home`            | singleton | `/`                                                                                                  | yes                                  |
| `book`            | record    | book pages, catalogue, home blocks, author/collection, sitemap, staff pages                          | yes                                  |
| `author`          | record    | author pages, book cards, structured-text links, book detail and staff pages                         | yes                                  |
| `collection`      | record    | collection pages, book detail, home featured book, staff pages                                       | yes                                  |
| `page`            | record    | `/info/[slug]`, header/footer menu on every page                                                     | yes                                  |
| `blog_post`       | record    | `/magazine`, `/magazine/[slug]`, book detail (`reviews`)                                             | yes                                  |
| `index_page`      | record    | every index page (by slug)                                                                           | yes                                  |
| `supplier`        | record    | `/distributori`                                                                                      | yes                                  |
| `license`         | record    | `/libri/[slug]` and `/libri/schede/[slug]` (rendered); the card fragments fetch it, no card shows it | yes (its books' pages, by record id) |
| `app`             | singleton | `/libri/schede/[slug]` (`pdfFooter`)                                                                 | no-op by design (staff-only reader)  |
| `cover_size`      | record    | `/libri/[slug]`, `/libri/schede/[slug]`, `/staff/archivio-catalogo` (`dimension`)                    | no                                   |
| `blog_category`   | record    | `/magazine`, `/magazine/[slug]`                                                                      | no                                   |
| `blog_author`     | record    | `/magazine`, `/magazine/[slug]` (post `author`), `/libri/[slug]` (review `author`)                   | no                                   |
| `keyword`         | record    | `/staff/archivio-catalogo` (`book.keywords`)                                                         | no                                   |
| `blog_tag`        | record    | no route query                                                                                       | no                                   |
| `blog_post_old`   | record    | no route query (legacy)                                                                              | no                                   |
| `project_comment` | record    | no route query (editor comments)                                                                     | no                                   |

Block models (`modular_block: true`, 19 of them: `reprint`, `image_block`, `video`, `banner`, `question`, `single_book`, `book_carousel`, `pills_block`, `menu_item`, `newsletter_subscription`, `menu_dropdown`, `single_info_block`, `button`, `faq_section`, `footer_menu_block`, `social_link`, `single_author`, `menu_external_item`, `cta_button_with_image`) have no webhook events of their own: they live inside a parent record, and publishing the parent fires the event for the parent's model. They are excluded from the route audit below.

## Route → models → revalidated?

Layout dependency for every HTML route: `BaseLayout.astro` `SITE_QUERY` reads `_site` (favicon tags) and `allPages` filtered by `menu` / `menuFooter` (header and footer menus). Only the `page` model feeds it, and a `page` publish revalidates just `/info/[slug]`, `/info` and the sitemap, so **the menus of every other page stay stale** until their ISR copy expires (60 days) or another event touches them. Cell "partial" says which event is missing.

| Route                       | Models read (besides layout `page`)                                                                                                                        | Revalidated?                                                                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                         | `home`, `book` (carousel/single book), `author` (card names), `collection` (featured book), `license` (fetched by the card fragments, not rendered)        | partial: `home`, `book` yes; `author`, `collection` no; page menus no                                                                                                                       |
| `/libri`                    | `index_page`, `book`, `author` (card names), `license` (fetched by the card fragments, not rendered)                                                       | partial: `book`, `index_page` yes; `author` no; page menus no                                                                                                                               |
| `/libri/pagina/[page]`      | `index_page`, `book`, `author`, `license` (fetched by the card fragments, not rendered)                                                                    | partial: `book` yes while the page exists (count from published books), `index_page` yes; `author` no; page menus no                                                                        |
| `/libri/[slug]`             | `book`, `author`, `collection`, `license`, `cover_size`, `blog_post` (`reviews`), `blog_author` (review author); sibling books by authors/collection/title | partial: the book's own save and `license` (by record id) yes; `author`, `collection` rename, `cover_size`, `blog_post`, `blog_author`, sibling-book changes no; old slug no; page menus no |
| `/libri/archivio`           | `index_page`, `book`, `license` (fetched by the card fragments, not rendered)                                                                              | partial: `book`, `index_page` yes; page menus no                                                                                                                                            |
| `/libri/schede/[slug]`      | `book`, `author`, `collection`, `license`, `cover_size`, `app` (internal, staff-gated, editor-only)                                                        | no: not in any list (editor cookie bypasses the cache); `app` is a no-op by design, `license` maps only the public book pages                                                               |
| `/autori`                   | `index_page`, `author`, `book`                                                                                                                             | partial: `author`, `index_page` yes; `book` no (book count on cards); page menus no                                                                                                         |
| `/autori/[slug]`            | `author`, `book` (author's books), `license` (fetched by the card fragments, not rendered)                                                                 | partial: `author` yes; `book` add yes on publish, removal from the old author no (enrichment reads current relations), unpublish/delete no; old slug no; page menus no                      |
| `/collane`                  | `index_page`, `collection`, `book`                                                                                                                         | partial: `collection`, `index_page` yes; `book` no; page menus no                                                                                                                           |
| `/collane/[slug]`           | `collection`, `book`, `license` (fetched by the card fragments, not rendered)                                                                              | partial: `collection` yes; `book` add yes on publish, removal from the old collection no (enrichment reads current relations), unpublish/delete no; old slug no; page menus no              |
| `/magazine`                 | `index_page`, `blog_post`, `blog_category`, `blog_author`                                                                                                  | partial: `blog_post`, `index_page` yes; the others no; page menus no                                                                                                                        |
| `/magazine/[slug]`          | `blog_post`, `blog_category`, `blog_author`, linked `author`/`page`/`book`, `license` (fetched by the card fragments, not rendered)                        | partial: `blog_post` yes; the others no; old slug no; page menus no                                                                                                                         |
| `/info`                     | no CMS data (static "coming soon" page)                                                                                                                    | yes (layout `page` menus, via `page` events)                                                                                                                                                |
| `/info/[slug]`              | `page`, linked `author`/`book`/`blog_post`, `license` (fetched by the card fragments of linked books, not rendered)                                        | partial: `page` yes; linked records no; old slug no; page menus no (other pages)                                                                                                            |
| `/distributori`             | `index_page`, `supplier`                                                                                                                                   | yes: `index_page`, `supplier`; page menus no                                                                                                                                                |
| `/cerca`                    | no CMS data (Site Search runs client-side); layout `page` menus only                                                                                       | no: layout `page` menus not revalidated                                                                                                                                                     |
| `/cerca/search-page.client` | not a page: client bundle source, no handler                                                                                                               | n/a                                                                                                                                                                                         |
| `/staff`                    | `book` (counts); internal, gated by middleware                                                                                                             | no: not in any list (editor cookie bypasses the cache)                                                                                                                                      |
| `/staff/archivio-catalogo`  | `book`, `author`, `collection`, `cover_size`, `keyword`; internal, gated by middleware                                                                     | no: not in any list (editor cookie bypasses the cache)                                                                                                                                      |
| `/archived-books.json`      | `book` (archived slugs)                                                                                                                                    | no: `book` events do not include it; the response itself is `Cache-Control: public, max-age=3600, immutable` (`archived-books.json.ts:27`)                                                  |
| `/sitemap.xml`              | `book`, `page`, `collection`, `author`, `blog_post` (slug, `updatedAt`)                                                                                    | yes for every mapped model (all add the sitemap); catalogue pages via `book` enrichment                                                                                                     |

## Cloudflare Workers (branch `chore/cloudflare`)

Described from the code (`src/worker.ts`, `src/middleware.ts`, `src/lib/datocms/{executeQuery,cacheTags,cacheInvalidation}.ts`, `src/pages/api/invalidate-cache/index.ts`, `wrangler.jsonc`). Decision and measurements: `docs/decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md`. Switch-day steps: `docs/guidelines/cloudflare-switch.md`.

### Gateway and Backend

`wrangler.jsonc` turns Workers Cache on for the Worker and defines two entrypoints (`exports`):

- **Gateway** (`default`, `src/worker.ts`, cache off): runs on every request. If the draft cookie is present (name `DRAFT_MODE_COOKIE_NAME` trimmed, else `multimage_draft_mode`; the rule is copied from `src/lib/draftMode.ts`, keep them in sync) it forwards with `cache: 'no-store'`, so an editor never reads or fills the shared copy. Outside `/api` it sets `cf.cacheKey` to the path only, so `?utm_*`, `?fbclid` and other query strings share one entry. Every request, POST included, goes to `Backend`.
- **Backend** (cache on): wraps the Astro handler. Every render and every purge runs here, because a purge only reaches the cache of the entrypoint that calls it. A cache hit uses no CPU; each page view bills two requests (gateway plus Backend).

The middleware makes the one cache decision per request, after `next()` (queries never call `cache.set`). Anything not listed is private.

| Route                                                                                                           | Policy                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Public GET page, `text/html`, status 200, no draft                                                              | cached, `maxAge` 60 days, DatoCMS tags                                                                        |
| `/sitemap.xml`, `/archived-books.json`, `/search-books.json` (GET 200, no draft)                                                      | cached, `maxAge` 60 days, tags (they run CDA queries, so a purge keeps them fresh)                            |
| Endpoints with no CDA query (none today: `robots.txt` is a static asset)                                        | `cache.set(false)`                                                                                            |
| Internal paths (`/staff`, `/libri/schede`), `/api/*`, non-GET, non-200, any draft request, any draft CDA query | `cache.set(false)` plus `Cache-Control: private, no-store` (draft requests answer `cf-cache-status: DYNAMIC`) |

The draft bypass is double (gateway `no-store`, middleware `set(false)`): draft HTML carries the draft CDA token, so a stored draft render would leak it. For cacheable rows the middleware buffers the body first, because the tags are collected while the page streams and a draft query during the stream turns the row private. Internal paths without a session answer a flat 404, private.

### Tags

- `executeQuery` runs published queries through `rawExecuteQuery` with `returnCacheTags` and pushes the response's `x-cache-tags` into a per-request AsyncLocalStorage store (`cacheTags.ts`), opened by the middleware only on Cloudflare GET requests outside `/api`. A draft query marks the store `disabled`. See `cms-data-loading.md`.
- `BaseLayout` marks its site query `cacheTagScope: 'layout'`; an HTML page with no layout tags is treated as unpurgeable (below). `/sitemap.xml` and `/archived-books.json` have no layout, so the check there is a tag count above 0.
- **Coarse fallback**: when there are no tags, more than 990 (`MAX_PAGE_TAGS`; Cloudflare keeps the first 1000 and appends its own path tag), an invalid tag (comma, characters outside `0x21-0x7E`, over 1024 chars), or an HTML page with no layout tags, the page is stored with the single tag `site` and a `maxAge` of 1 day (`COARSE_MAX_AGE`) instead of 60 days. Every purge adds `site`, so a coarse page is purged by any publish and expires in a day at most.
- Measured on the trial Worker (V2): 27 to 515 tags per page (`/` 66, `/libri` 156, `/autori` 515, `/sitemap.xml` 500, `/archived-books.json` 27), none coarse.
- The middleware logs one JSON line per cached page: `{"event":"cache-tags","path","tagCount","hasLayoutTags","coarse","reason"}` (`console.warn` when coarse).

### `POST /api/invalidate-cache`

DatoCMS `cda_cache_tags` / `invalidate` webhook receiver, `Authorization: Bearer <CACHE_INVALIDATION_WEBHOOK_SECRET>`. It purges through `locals.cfContext.cache.purge` (not `context.cache.invalidate`, which ignores the purge result, and not an import of `cloudflare:workers`, which breaks the Vercel build) and never calls `cache.set`. Order of answers:

| Status | When                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 401    | secret unset or bearer mismatch (constant-time compare)                                                                           |
| 400    | body is not JSON, or has no valid `entity.attributes.tags` (array of non-empty strings)                                           |
| 503    | no cache provider or no `cfContext` (Vercel)                                                                                      |
| 200    | `{ purged: 0, batches: 0, noop: true }` for an empty tags array; otherwise `{ purged, batches, reindexed }` after a good purge     |
| 502    | a purge batch failed; the run stops at the first failure so DatoCMS retries                                                       |

Invalid tags are dropped and counted in the log; `site` is added to every non-empty purge. Tags go in batches of 100 (Free limit), in sequence. The Free plan allows 5 purge requests per minute with a burst of 25: 30 calls in a row gave 25 times 200 then 502 with Cloudflare code 1134 ("rate limit reached"), and the DatoCMS retry is the recovery. Logs carry counts only, never the bearer or the tags. After a good purge it triggers the Site Search reindex (`reindexSiteSearch`, needs `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID`). The old `/api/revalidate` webhook must be disabled at the switch: on the Worker it answers 500 `BYPASS_TOKEN not configured` (before any reindex) and DatoCMS would retry every publish.

### Things that empty or skip the cache

- A deploy or `wrangler secret put` creates a new Worker version, and the cache is partitioned by version: it starts empty. There is no purge-everything endpoint, so a full purge is a redeploy (`npm run deploy:cf`).
- Files under `public/` (`robots.txt`, bundles in `public/generated/`) are served by Workers Assets before the Worker runs: the middleware policy never applies to them and they leave no `wrangler tail` event. Control them with a `_headers` file.
- Every deploy, purge, draft view and `/api` call is a render (a miss): this is why the Free plan's 10 ms CPU limit is the constraint, see the runbook.

### Checks

```bash
npm run check:cache-tags                       # pure checks of tag decisions and payload parsing, no network
curl -sI https://<host>/libri | grep -i cf-cache-status     # MISS, then HIT
npx wrangler tail multimage-astro --format json # the cache-tags lines, per page
```

`wrangler tail` drops events under a burst: for rate-limit checks count the HTTP answers, not the log lines. Check the status line with `-w '%{http_code}'` (curl prints `HTTP/2 200` with no colon).

## Gaps and fate

These gaps and the route table above are the Vercel URL map; on Cloudflare the tags replace the map (a publish purges every page that read the record, layout menus included). Fate `fixed in V2` / `closed in V2`: done in slice V2 (caching behaviour); `TODO` goes to `docs/TODO.md`.

| #   | Gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Fate         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | 7 mapped api_keys did not exist (`books_index`, `archive_index`, `highlights_index`, `ebooks_index`, `collections_index`, `authors_index`, `magazine_index`) while `index_page` (by slug) was unmapped. Fixed in V2: `index_page` is mapped by slug in `revalidationUrls.ts` and `recordInfo.ts`, the phantom keys are removed                                                                                                                                                         | fixed in V2  |
| 2   | `supplier` was unmapped. Fixed in V2: it revalidates `/distributori`                                                                                                                                                                                                                                                                                                                                                                                                                   | fixed in V2  |
| 3   | `license` unmapped: every page that shows a book card or the featured book (`/`, `/libri*`, `/autori/[slug]`, `/collane/[slug]`, `/info/[slug]`, `/magazine/[slug]`) and the book sheets shows a stale license. Fixed in V2: the license is rendered only on `/libri/[slug]` (`buildEditionDetails`); the card fragments fetch it but no card shows it, so `license` revalidates only its books' pages                                                                                 | fixed in V2  |
| 4   | `app` (singleton; `pdfFooter` on the staff book sheet) is a no-op by design: its only reader `/libri/schede/[slug]` is staff-gated, so revalidating it would only re-cache the anonymous 404. Closed in V2                                                                                                                                                                                                                                                                             | closed in V2 |
| 5   | `page` menus: header/footer menus on every page are fed by `page` (`menu`, `menuFooter`, `label`, `position`) but a page event only revalidates `/info/[slug]`, `/info` and the sitemap                                                                                                                                                                                                                                                                                                | TODO         |
| 6   | Book unpublish/delete: the enrichment query returns no book, so author and collection pages (and the old catalogue count) are skipped; on a relation change the old author or collection page is never refreshed (enrichment reads current relations)                                                                                                                                                                                                                                  | TODO         |
| 7   | Slug change: the event carries only the new slug, the old URL stays cached                                                                                                                                                                                                                                                                                                                                                                                                             | TODO         |
| 8   | No upload events on the webhook: replacing or editing an asset revalidates nothing                                                                                                                                                                                                                                                                                                                                                                                                     | TODO         |
| 9   | Referenced records: `author` or `collection` rename does not refresh book cards, book detail, catalogue or home; a book change does not refresh sibling books (same author/collection/title)                                                                                                                                                                                                                                                                                           | TODO         |
| 10  | `cover_size`, `blog_category`, `blog_author`, `keyword` unmapped (read by book detail, book sheets, magazine pages and the staff catalogue)                                                                                                                                                                                                                                                                                                                                            | TODO         |
| 11  | `/archived-books.json` is not in the `book` URL list                                                                                                                                                                                                                                                                                                                                                                                                                                   | TODO         |
| 12  | Unmapped model or payload without `api_key` returns 200 `noop`, and `success` counts 401/404 as ok (`index.ts:55`): DatoCMS and the JSON never show a failed revalidation                                                                                                                                                                                                                                                                                                              | TODO         |
| 13  | `revalidationUrls.ts` and `recordInfo.ts` are two hand-synced maps with no check between them. Narrowed in V2: the index paths now live once (`INDEX_PAGE_PATHS`); the rest of the two maps is still synced by hand                                                                                                                                                                                                                                                                    | TODO         |
| 14  | `blog_post` or `blog_author` change does not refresh the books that link it as a review (`book.reviews`, shown on `/libri/[slug]`)                                                                                                                                                                                                                                                                                                                                                     | TODO         |
| 15  | `/staff` without session: the middleware 404 is cached by Vercel (`x-vercel-cache: HIT`, run (c)). Verify an editor session reaches `/staff` and `/libri/schede` on production despite the cached anonymous 404; depends on `__prerender_bypass`, i.e. `BYPASS_TOKEN` set in the Vercel production env. V4 preview (2026-11-05, Astro 7): anonymous `/staff` 404, then 200 with the draft session (`__prerender_bypass`), then 404 again in a clean session; production still to check | TODO         |

## Verification procedure

Three checks, from the cheapest to the most real. None of them may call the production endpoint: locally `PUBLIC_SITE_URL` is the production URL, so `/api/revalidate` would fetch production pages with `x-prerender-revalidate` and trigger the production Site Search reindex.

### (a) URL map, no network

```bash
npm run check:revalidation-map
```

It runs `parseWebhookPayload` and `getRevalidationUrls` on the sample payloads in `scripts/revalidation-map/payloads/` (one per model, plus `malformed`), with the query function replaced by a stub passed in directly. It then checks `recordToWebsiteRoute` on a table of routes. It opens no connection and needs no token.

- Any Node that supports `--import` (>= 20.6) runs it: no loader hooks, the repo runs on Node 24 (`.nvmrc`). A preload (`sentinel.mjs`) sets the failing exit code and blocks `fetch`.
- `tsx` is not a devDependency: the script uses the copy hoisted by the `datocms` CLI.
- Output, one line per payload: `file event api_key slug n STATUS`, where `n` is the number of URLs. Then one line per route: `route api_key slug result STATUS`. Then `N payloads, R routes, M mismatches, fetch calls: K`. Exit code 1 if `M` or `K` is above 0, or if an entry never ran (sentinel), or if a payload file is missing.
- `OK`: the result matches what the script expects. `GAP`: the model is known to be under-served (see "Gaps and fate"). After V2 only `page` (gap 5, menus) and `book-unpublish` (gap 6) print `GAP`. A `GAP` is not a failure: it is the recorded state of the code. `MISMATCH` is a failure: the code changed and the expectation did not.
- The expectations describe the code **after V2**. When a later slice closes gap 5 or 6, the `GAP` lines must turn `OK` and the expectations in `scripts/revalidation-map/check.ts` change with them.

### (b) Local `astro dev`, with overrides

Pick a free port at run time. Never use 4321 (the user's own `astro dev`, which has the production `PUBLIC_SITE_URL`) or 4329 (another project).

```bash
export PORT=4331
lsof -nP -iTCP:$PORT -sTCP:LISTEN   # must print nothing; otherwise pick another port
```

Overrides, for the shell session only (process env wins over `.env`):

- `PUBLIC_SITE_URL=http://localhost:$PORT`: the same port the server listens on, otherwise the endpoint fetches production URLs or the wrong server.
- `SITE_SEARCH_BUILD_TRIGGER_ID=` (empty): otherwise the endpoint triggers the production Site Search reindex.
- `BYPASS_TOKEN`: a throwaway value, because the ISR config reads it from the environment.
- `--ignore-lock` (on the command below): Astro 7 `astro dev` takes a project lock in `.astro/`; `--ignore-lock` runs a one-off foreground server that neither takes nor checks it, so it does not interfere with the user's own server on 4321.

```bash
PUBLIC_SITE_URL=http://localhost:$PORT SITE_SEARCH_BUILD_TRIGGER_ID= \
  BYPASS_TOKEN="$(openssl rand -hex 16)" npx astro dev --ignore-lock --port $PORT
```

Then POST the sample payloads, one request each: `book-publish`, `index_page-libri-publish`, `supplier-publish`, `app-publish` (a no-op), `license-publish` (with `entity.id` set to a real license id) and one with a wrong token.

```bash
curl -s -X POST "http://localhost:$PORT/api/revalidate?token=<SECRET_API_TOKEN>" \
  -H "content-type: application/json" \
  --data @scripts/revalidation-map/payloads/book-publish.json
```

Shell form, so the real token is never echoed or stored in history: wrap the call in single quotes and let `dotenv` expand the variable inside the child shell, for example `npx dotenv -e .env -- sh -c 'curl -s -X POST "http://localhost:'"$PORT"'/api/revalidate?token=$SECRET_API_TOKEN" -H "content-type: application/json" --data @scripts/revalidation-map/payloads/<file>.json'`. For the wrong-token case use `?token=wrong` and `-o /dev/null -w '%{http_code}'`.

Rules:

- **Never `?mode=full`**, locally or anywhere: it revalidates every route and reindexes.
- **Judge by `urls`, `mode`, `reindexed` and the dev log** (one `[status] /path` line per URL), **not by `success`**: the count includes 401 and 404 as fulfilled (`index.ts:55`). A log line containing `enrichment failed` means a count or license query fell back.
- Expected after V2: `book-publish` returns `"mode":"surgical"` and `"reindexed":false`; `index_page-libri-publish` returns `/libri` plus `/libri/pagina/2..N`; `supplier-publish` returns `["/distributori"]`; `app-publish` returns `"noop":true`; `license-publish` returns only `/libri/<slug>` URLs; the wrong token returns `401`. With the fixture slug, `book-publish` gives no status line for `/libri/libro-pubblicato` (the page throws), yet the endpoint counts it ok.
- Afterwards: stop the server (`lsof -nP -iTCP:$PORT -sTCP:LISTEN`, then kill the PID) and restore the schema that `sync-datocms` may have rewritten: `git diff --quiet -- schema.ts || git checkout -- schema.ts`.
- `astro preview` does not work with `@astrojs/vercel`: use `astro dev`.

### (c) Deployed, passive only

After a real editorial publish, read what DatoCMS sent and what the CDN holds. No POST to the endpoint, no resend of a webhook call, no `?mode=full`.

```bash
npx dotenv -e .env -- npx --no-install datocms cma:call webhookCalls list \
  --params '{filter:{fields:{webhook_id:{eq:"33942"},status:{eq:"success"}}},order_by:"last_sent_at_desc",page:{limit:5}}' \
  2>/dev/null | node -e 'const s=require("fs").readFileSync(0,"utf8"); for (const a of JSON.parse(s.slice(s.search(/^[\[{]/m)))) { let p={}; try{p=JSON.parse(a.response_payload)}catch(e){} console.log(a.last_sent_at,a.event_type,a.status,a.response_status,p.mode,p.total,JSON.stringify(p.urls)) }'
```

Do not add `--json`: it prints nothing here. Each call's `request_url` carries `?token=` and the headers hold secrets: the raw output goes straight into the filter and never reaches the terminal or the disk. Never print it, `head` included.

Print only `last_sent_at`, `event_type`, `status`, `response_status`, and from `response_payload` the `mode`, `total` and `urls` (never the request URL, which carries the token). Then, on 3 to 5 of those URLs plus `/` and `/distributori`:

```bash
curl -sI https://www.multimage.org<path> | grep -iE '^(x-vercel-cache|age|date):'
```

Read: `x-vercel-cache: HIT` with `age` smaller than the seconds since `last_sent_at` is consistent with a refresh by that publish. It shows the publish caused it only if a URL outside the list (e.g. `/distributori`) has a larger `age`, or no deploy came between the publish and the check. `MISS` right after a deploy is normal: a fresh deployment starts with an empty ISR cache. Webhook calls expire, so an old publish may no longer be listed.

### Runs — 2026-11-05 (V2)

Run on 2026-11-05, Node v24.18.0.

#### (a) `npm run check:revalidation-map`

```text
app-publish publish app null 0 OK
author-publish publish author autore-uno 3 OK
blog_post-publish publish blog_post articolo-uno 3 OK
book-publish publish book libro-pubblicato 12 OK
book-unpublish unpublish book libro-non-pubblicato 9 GAP
books_index-publish publish books_index null 0 OK
collection-publish publish collection collana-uno 3 OK
home-publish publish home null 2 OK
index_page-libri-publish publish index_page libri 3 OK
index_page-publish publish index_page autori 1 OK
index_page-unknown-publish publish index_page sconosciuta 0 OK
license-publish publish license null 2 OK
malformed publish null senza-modello skipped OK
page-publish publish page chi-siamo 3 GAP
supplier-publish publish supplier null 1 OK
route index_page libri /libri OK
route index_page ebooks /libri/ebooks OK
route index_page highlights /libri/highlights OK
route index_page archivio /libri/archivio OK
route index_page collane /collane OK
route index_page autori /autori OK
route index_page magazine /magazine OK
route index_page distributori /distributori OK
route index_page sconosciuta null OK
route supplier - /distributori OK
route books_index - null OK
15 payloads, 11 routes, 0 mismatches, fetch calls: 0
```

Exit 0. The two `GAP` lines match the open gaps: `book-unpublish` (6) and `page` (5). `app`, `index_page`, `license` and `supplier` are `OK`; `books_index` now yields no URL because the phantom key is gone.

After the final review the route table gained an `index_page` `constructor` row (inherited-property slug must yield no URL); re-run, same Node: `15 payloads, 12 routes, 0 mismatches, fetch calls: 0`.

#### (b) Local `astro dev`

`astro` v6.3.3 on `localhost:4331` (port free before; 4321 and 4329 untouched), with the overrides above. Requests went through the `dotenv` form, so the token was never echoed. License ids came from one read-only `cma:call items list` filtered to id and code: 7 licenses (`c`, `by`, `by-sa`, `by-nd`, `by-nc`, `by-nc-sa`, `by-nc-nd`); `by-nc-nd` and `by-nd` were used. Each payload was rewritten and piped into `curl --data @-`, with no file.

1. `index_page-libri-publish`: HTTP 200, `"mode":"surgical"`, `"total":9`, `"failures":0`, `"reindexed":false`, 1084 ms. URLs: `/libri`, `/libri/pagina/2` to `/libri/pagina/9` (real count, N = 9).
2. `supplier-publish`: `"total":1`, `"reindexed":false`, `urls` = `["/distributori"]`, 348 ms. Gap 2 is closed.
3. `app-publish`: `{"mode":"surgical","eventType":"publish","apiKey":"app","revalidated":0,"urls":[],"noop":true}`. This is the intended no-op: `app` is mapped to no URL.
4. `license-publish`, `by-nc-nd`: `"total":42`, `"failures":0`, `"reindexed":false`, 2962 ms. All 42 URLs are `/libri/<slug>` (for example `/libri/un-giorno-solo`, `/libri/sedna`, `/libri/sedna-ebook`); no `/`, no listing.
5. `license-publish`, `by-nd`: `"total":2`, `urls` = `["/libri/volti-dal-futuro","/libri/se-vuoi-la-pace-prepara-la-pace"]`, 505 ms.
6. `POST /api/preview-links` with a published `index_page` `libri` item: 1 link, label `Published version`, url `http://localhost:4331/api/draft-mode/disable?url=/libri` (published, so no token in the link). The Web Previews route for an index page resolves.

Dev log: 4 `[revalidate] Done (surgical). ... (search reindex: false)` lines (9, 1, 42 and 2 URLs, 0 failed); 0 lines with `enrichment failed`; 0 `ERROR` lines; no 4xx or 5xx status lines. So the lazy default `executeQuery`, the catalogue count query and the license filter work against the real CDA.

`book-publish` and the wrong-token case were not repeated in this run (covered by the 2026-11-04 run).

After the stop: port 4331 free, `schema.ts` unchanged (`git status --porcelain schema.ts` empty), the user's 4321 server still running. Every page fetch went to localhost; the only outbound calls were CDA reads (plus the one CLI read). Still open: the Done item "a real publish of an index page shows the index URL revalidated" goes through (c) after the production deploy.

### Runs — 2026-11-04

Run on 2026-11-05, Node v24.18.0.

#### (a) `npm run check:revalidation-map`

```text
app-publish publish app null 0 GAP
author-publish publish author autore-uno 3 OK
blog_post-publish publish blog_post articolo-uno 3 OK
book-publish publish book libro-pubblicato 12 OK
book-unpublish unpublish book libro-non-pubblicato 9 GAP
books_index-publish publish books_index null 2 OK
collection-publish publish collection collana-uno 3 OK
home-publish publish home null 2 OK
index_page-publish publish index_page autori 0 GAP
license-publish publish license null 0 GAP
malformed publish null senza-modello skipped OK
page-publish publish page chi-siamo 3 GAP
supplier-publish publish supplier null 0 GAP
13 payloads, 0 mismatches, fetch calls: 0
```

Exit 0. The six `GAP` lines match the recorded gaps: `app` (4), `book-unpublish` (6), `index_page` (1), `license` (3), `page` (5), `supplier` (2). `books_index` still yields URLs because the stale api_key is mapped (gap 1).

#### (b) Local `astro dev`

`astro` v6.3.3 on `localhost:4321`, with the three overrides above (port 4321 free before). Three requests, one each.

1. `book-publish`: HTTP 200, `"mode":"surgical"`, `"total":15`, `"failures":0`, `"reindexed":false`, `"elapsedMs":3309`.

   ```text
   /libri/libro-pubblicato /libri/ebooks /libri/highlights /libri/archivio
   / /sitemap.xml /libri /libri/pagina/2 ... /libri/pagina/9
   ```

   Dev log: a `[200]` line for 14 of the 15 URLs (88 to 602 ms); `/libri/libro-pubblicato` logged two `[ERROR] Book not found` lines and no status line (see below). Then `[revalidate] Done (surgical). 15 ok, 0 failed, total 15 URLs in 3309ms (search reindex: false)`.
   - 15 URLs, not the 12 of (a): the real CDA catalogue gives `/libri/pagina/2` to `/libri/pagina/9`, while the (a) stub (81 books) gives pages 2 and 3.
   - No `/autori/*` or `/collane/*`: the fixture slug is unknown to the CDA, so there are no related authors or collection.
   - `/libri/libro-pubblicato` has no `[200]` line: the page logged `Book not found for slug: libro-pubblicato`, yet the endpoint counted it among the 15 ok. This is the `success` gap (`index.ts:55`) seen live: any HTTP response counts as ok, 4xx/5xx included; here the status code was not logged.
   - The search reindex was skipped (empty `SITE_SEARCH_BUILD_TRIGGER_ID`).

2. `supplier-publish`: `{"mode":"surgical","eventType":"publish","apiKey":"supplier","revalidated":0,"urls":[],"noop":true}`. Log: `Model "supplier" is not mapped to any URL; nothing to do.` This confirms gap 2.
3. `?token=wrong`: HTTP `401`.

After the stop: port 4321 free, `schema.ts` unchanged (`astro dev` was used, not `npm run dev`). No token value in the log. Every page fetch went to localhost; the only outbound calls were CDA reads.

#### (c) Production, passive

Run on 2026-11-04 at 23:15 UTC (00:15 CET on 2026-11-05). Read-only: one `webhookCalls list` through the CLI (output filtered to the fields below, never the request URL or headers) and `curl -I` on `https://www.multimage.org`. No POST, no resend, no `?mode=full`.

The CLI printed nothing with `--json` (only the update warning), so the call ran without it and the JSON was parsed from a file under `$TMPDIR`.

Webhook 33942, last 5 successful calls (all `publish`, `status` success, `response_status` 200, `mode` surgical):

| `last_sent_at` (UTC)                              | `total` | URLs                                                                                                                                                                                                            |
| ------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-03 14:30:18                               | 17      | book `/libri/dal-militare-al-sociale-invece-di-armarci-potremmo`, `/libri/ebooks`, `/libri/highlights`, `/libri/archivio`, `/`, `/sitemap.xml`, `/libri`, `/libri/pagina/2` to `/9`, one author, one collection |
| 2026-11-03 14:29:53, 14:28:42, 14:27:59, 14:27:40 | none    | event on a `keyword` record: no URL (unmapped model, noop)                                                                                                                                                      |

Headers for the latest call with URLs (now is 117930 s after 14:30:18):

| Path                                                        | `x-vercel-cache` | `age` (s) | `date` (response generation) |
| ----------------------------------------------------------- | ---------------- | --------- | ---------------------------- |
| `/libri/dal-militare-al-sociale-invece-di-armarci-potremmo` | HIT              | 117300    | 2026-11-03 14:40:48          |
| `/libri/ebooks`                                             | HIT              | 117298    | 2026-11-03 14:40:50          |
| `/libri`                                                    | HIT              | 117304    | 2026-11-03 14:40:44          |
| `/libri/pagina/2`                                           | HIT              | 117281    | 2026-11-03 14:41:07          |
| `/autori/centro-nuovo-modello-di-sviluppo`                  | HIT              | 117294    | 2026-11-03 14:40:55          |
| `/`                                                         | HIT              | 117253    | 2026-11-03 14:41:35          |
| `/distributori` (not in the list)                           | HIT              | 117306    | 2026-11-03 14:40:43          |

- Every URL of the list: HIT, and `age` (about 117300) is smaller than the 117930 s since `last_sent_at`, so each page was regenerated after that publish. The cached copy dates from 14:40 (10 to 11 minutes after the call), not from the 14:30 call; whether that call refreshed it before a later reset cannot be told from headers.
- `/distributori` is not in the list yet has the same age (117306, generated 14:40:43): its regeneration is not caused by this publish. Either a production deploy at about 14:40 reset the ISR cache for all routes (a deploy resets `age`), or something else refreshed it. So this run cannot tell "refreshed by the publish" from "refreshed by a deploy"; for that, run (c) right after a publish with no deploy in between.
- `/staff` without session: HTTP 404, `x-vercel-cache: HIT`, `cache-control: public, max-age=0, must-revalidate`, `age` 52780 (the 404 was cached at 2026-11-04 08:36 UTC). Vercel does cache the middleware 404 for `/staff`. Whether a request with a valid session cookie is served from that cache was not tested (headers only, no cookie).

### docs/guidelines/operations.md
---
description: Describe how Multimage is built, deployed, and configured across environments.
---

# Operations Runbook

## Deployments

- **Two targets, one codebase.** Vercel is production today; Cloudflare Workers is the target on branch `chore/cloudflare`, chosen at build time by `DEPLOY_TARGET` (`astro.config.mjs` picks `@astrojs/vercel` or `@astrojs/cloudflare`; unset means Vercel). The switch is a one-off procedure: `docs/guidelines/cloudflare-switch.md`.
- **Vercel**: link the repo, sync environment variables, and run `npm run build`. The site is one deployment running `output: 'server'` with ISR (`@astrojs/vercel`): every route is rendered per request and cached by the Vercel CDN, nothing is prerendered at build time. Draft Mode (the signed JWT cookie plus Vercel's `__prerender_bypass` cookie) bypasses the cache on the same deployment, so there is no separate static/preview split.
- **Cloudflare** (`DEPLOY_TARGET=cloudflare`): a Worker `multimage-astro` in the Cloudflare account "Multimage" (`account_id` in `wrangler.jsonc`), trial URL `https://multimage-astro.matteo-59f.workers.dev` (`workers_dev` and `preview_urls` are on). Entry `src/worker.ts` is a gateway that forwards every request to the `Backend` entrypoint, which runs the Astro handler behind Workers Cache (see `preview-mode.md` § 1 and `caching.md`).
  - Build and deploy with the env file (the build validates the secrets, `validateSecrets`): `npx dotenv -e <ENV_FILE> -- npm run build:cf` to build only, `npx dotenv -e <ENV_FILE> -- npm run deploy:cf` to build and deploy. The env file holds production secrets: keep it outside the repo and never print it.
  - Every Cloudflare build rewrites `.wrangler/deploy/config.json`; `.wrangler/` is in `.prettierignore` so `npm run lint` stays green.
  - Logs: `npx wrangler tail multimage-astro --format json`; useful fields are `cpuTime`, `wallTime`, `entrypoint` and `event.request.url`. The tail drops events under a burst: count outcomes from HTTP answers, use the tail for per-page fields.
  - Files under `public/` are served by Workers Assets before the Worker runs: the middleware cache policy never applies to them and they leave no tail event. Set their headers with `_headers`.
- Vercel builds on Node 24.x with the Vercel project Node setting kept on 24.x to match `engines.node` (`24.x`) in `package.json` and `.nvmrc` (local work). `.vercelignore` keeps `.env*` (plus `dist/`, `.astro/`, `.claude/`) out of CLI uploads (`vercel deploy`).
- `npm run dev` chains `npm run sync-datocms` before `astro dev`, ensuring `schema.ts` and `docs/DATOCMS.md` stay in sync when `DATOCMS_API_TOKEN` is available.
- `npm run prebuild` currently rebuilds the Site Search client before `npm run build` invokes `astro check` and the production build.
- Local checks use `astro dev` (`npm run dev`). `astro preview` does not work with `@astrojs/vercel`, so no preview script is provided. ISR caching is a Vercel CDN feature and Workers Cache runs only on a deployed Worker, so neither is active locally; see `docs/guidelines/caching.md` for the revalidation checks. Under an AI agent, Astro 7 `astro dev` starts in the background (stop it with `npx astro dev stop`), and `--ignore-lock` keeps a one-off foreground server.
- `tmp-sample/` is a read-only Astro starter kept in the repo for reference. It is excluded via `tsconfig.json` so `astro check`/`npm run build` ignore its missing React dependencies.

## Environment & Secrets

- Required env vars on Vercel: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, and `NODE_ENV=production`. `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID` are runtime variables on Vercel too (Site Search reindex in `/api/revalidate`, `/api/seo-analysis`): without them the reindex is off and SEO analysis returns 500. The CLI-only `DATOCMS_API_TOKEN` can remain local unless schema generation runs in CI. `BYPASS_TOKEN` is Vercel-only (ISR bypass and revalidation header).
- Worker secrets on Cloudflare (set with `wrangler secret put <NAME>`, see `security.md`): `CACHE_INVALIDATION_WEBHOOK_SECRET`, `DATOCMS_BASE_EDITING_URL`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DRAFT_MODE_COOKIE_NAME`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`. There is no `BYPASS_TOKEN` on the Worker. `DATOCMS_CMA_TOKEN` (SEO analysis, Site Search reindex) and `SITE_SEARCH_BUILD_TRIGGER_ID` are set on switch day, not on the trial Worker.
- `datocms.json` enumerates the CDA/CMA tokens used during automation; keep it updated when tokens rotate so `vercel env pull` stays in sync.
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` ships to the browser; provision it from a role limited to **Perform Site Search API calls** to prevent privileged access. See `docs/guidelines/security.md` for scoping details.
- Runtime also reads standard flags (`NODE_ENV`, `CI`, `CONTINUOUS_INTEGRATION`, `VERCEL`). Only set what the deploy target actually needs to keep the surface minimal.
- `PUBLIC_SITE_URL` powers sitemap generation and absolute links; missing values break `/src/pages/sitemap.xml.ts`. It is inlined at build time, so the Cloudflare build must run with the production value in the env file.

## Preview & Drafts

- `/api/preview` ora gestisce l’ingresso in Draft Mode firmando il cookie e reindirizzando alla rotta desiderata. `/api/draft-mode/enable|disable` vengono usate dal plugin DatoCMS Web Previews per generare i link “Draft/Published”.
- `executeQuery` accetta `{ includeDrafts: true }` e grazie a `resolveDraftMode(Astro)` (vedi `~/lib/draftPreview`) legge i cookie su ogni richiesta: il cookie di Draft Mode fa saltare la cache ISR sulla stessa deployment.
- `/api/post-deploy` è invocato automaticamente da Vercel (via `datocms.json`) ed è **solo Vercel**: su Cloudflare non esiste un hook di deploy equivalente, quindi plugin e URL di anteprima si controllano a mano nel passo 9 di `docs/guidelines/cloudflare-switch.md`. Si occupa di installare/aggiornare plug-in ufficiali DatoCMS:
  - **Web Previews** → aggiunge due frontends (Production + Preview) che puntano a `/api/preview-links?token=...`.
  - **SEO/Readability Analysis** → punta `htmlGeneratorUrl` al `/api/seo-analysis` dell’ambiente corrente.
  Se il post-deploy fallisce (es. perché il plug-in è già installato con permessi diversi) puoi rilanciarlo manualmente con `curl -X POST <deploy-url>/api/post-deploy -H 'Content-Type: application/json' -d '{"datocmsApiToken":"<CMA>","frontendUrl":"<deploy-url>"}'` (usa un CMA token “Admin”).

## Monitoring & Logging

- Client monitoring uses Google Analytics (legacy UA) only; Vercel Analytics and Speed Insights were removed on 2026-11-22, on both targets.
- Server side: on Vercel there is no logging or alerting beyond `vercel logs`. On Cloudflare, Workers observability is on (`observability.enabled` in `wrangler.jsonc`: logs in the dashboard, `wrangler tail` live).
- The `/llms-full.txt` export route was removed (2026-06-20); no exporter to maintain.

## Testing & Automation

- No CI workflow runs `astro check`, linting, or builds. Add GitHub Actions (or Vercel checks) to execute at least `npm run lint` and `npm run build` on pull requests.
- `npm run test` chains `npm run format` → `npm run lint` (Prettier `--check`) → `npm run build`. This covers formatting and build health but not unit coverage.
- Utilities like `src/pages/cerca/search-page.client.ts` and the staff CSV helpers have zero unit tests; start with Vitest for pure helpers and DOM tests for CSV/search scripts.
- GraphQL queries rely on build-time validation. Consider lightweight contract tests that mock `executeQuery` responses so schema drift is caught earlier.

### docs/guidelines/accessibility.md
---
description: aims to provide an accessible baseline, by providing helper classes and components
---

# Accessibility (a11y)

## Best practices

aims to stay close to the web standards. Here's a few tips to help keep it accessible:

- Use semantic HTML as a baseline.
- Use [media queries for a11y](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries_for_accessibility) like `prefers-reduced-motion` and `prefers-contrast`.
- Use native elements for interaction like `<form>`s, `<label>`led `<input>`s, `<output>`s, `<dialog>`, `<details>` with `<summary>` and native API's like the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).
- Add relevant ARIA roles and attributes on custom interactive components.
- Require `alt` texts on assets in the CMS and use their value in templates.

### docs/guidelines/seo.md
---
description: provide SEO guidance for the single-locale Multimage site
---

# Search Engine Optimisation (SEO)

## Meta, OG & Twitter tags
Multimage is mono-locale (Italian-only) and fully powered by DatoCMS SEO fields. Configure the global defaults under **SEO Preferences** (`/editor/settings`) and extend every routable model with its own SEO field so editors can override title/description/canonical tags per page.

To render those tags, query `_seoMetaTags`, wrap them with `withFallbackSeo`, and pass the result to `BaseLayout`, which hydrates `@datocms/astro`'s `<Seo />` component. `withFallbackSeo` adds Italian defaults for `<title>`/`<meta name="description">` when editors forget to populate them.

```graphql
query Page($slug: String!) {
  page(filter: { slug: { eq: $slug } }) {
    _seoMetaTags {
      attributes
      content
      tag
    }
  }
}
```

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import { withFallbackSeo } from '~/lib/seo';
const { page } = await executeQuery(PAGE_QUERY, { slug });
const seo = withFallbackSeo(page?._seoMetaTags, {
  title: page?.title ? `${page.title} | Multimage` : 'Multimage Editrice',
  description: page?.subtitle ?? undefined,
});
---
<BaseLayout seo={seo}>
  <!-- page content -->
</BaseLayout>
```

Dato automatically emits OG/Twitter tags (image, description, locale) whenever `_seoMetaTags` is rendered, so no extra layout logic is required. Avoid overriding those tags manually unless a route needs additional `meta` entries (e.g., `robots`, `article:published_time`).

## Canonicals, robots & sitemap
- Because the site is permanently Italian-only, there is a single canonical URL per page and no alternate/hreflang variants. `BaseLayout` now adds a `<link rel="canonical">` built from `PUBLIC_SITE_URL` + the current slug/path whenever `_seoMetaTags` does not already include one, so keep that env var aligned with the public origin.
- `src/pages/sitemap.xml.ts` builds the sitemap manually: it reads `PUBLIC_SITE_URL`, fetches all published pages/books/collections/authors/blog posts via `SITEMAP_QUERY`, and emits `/sitemap.xml` with one `<url>` per slug. Update `src/pages/sitemap.xml/_graphql.ts` whenever you introduce a new routable model.
- Set `PUBLIC_SITE_URL` for every environment so URLs never fall back to `http://localhost:4321` (see docs/TODO.md task **SEO1**). `astro.config.mjs` already sets `site`, but Vercel preview deploys still rely on the env var.
- `public/robots.txt` only blocks `/staff/` today. Keep it in sync with any other sensitive routes and leave the `Sitemap: /sitemap.xml` line in place so crawlers discover the XML automatically.

## Structured data & rich results
No JSON-LD is emitted today. Book, article, and organization pages rely solely on the default meta tags, so search engines cannot generate rich cards for catalog items or magazine posts. Track the addition of Book/Article/Organization schemas under docs/TODO.md SEO task **SEO2** and render them via `<script type="application/ld+json">` inside `BaseLayout` or the relevant page once requirements are finalized.

## Preview plugins & automation
- `/api/post-deploy` installs/configures the Dato “Web Previews” and “SEO/Readability Analysis” plugins. It should be disabled after the initial run because it reuses `SECRET_API_TOKEN` when minting preview URLs.
- `/api/preview-links` maps Dato records to site URLs and generates draft/published links that hop through `/api/draft-mode/*` so editors can switch contexts safely.
- `/api/seo-analysis` validates the same secret, fetches the target record through `@datocms/cma-client`, then uses `draftModeHeaders()` + `jsdom` to parse the Italian HTML before returning it to the plugin. Keep this endpoint fast—Dato times out after a few seconds.

## Core Web Vitals & analytics levers
- `BaseLayout` injects Iconify, Google Analytics (legacy UA) and Iubenda. Audit these scripts when defining a CSP (docs/TODO.md Security task **S3**).
- `BookCarouselSection` and `/cerca` load their JS bundles from `public/generated`. Missed prebuilds surface as `<script>` 404s, so ensure CI runs `npm run prebuild` (docs/TODO.md Project Structure task **PS1**).
- No Core Web Vitals dashboard is wired since Vercel Analytics and Speed Insights were removed (2026-11-22); coordinate any future perf work with `docs/guidelines/performance.md`.

## Known gaps
- `PUBLIC_SITE_URL` is not enforced during builds, so sitemap/canonical URLs silently fall back to `http://localhost:4321`. Fix this in docs/TODO.md SEO task **SEO1**.
- No structured data is emitted for books, authors, or magazine posts. Add JSON-LD per docs/TODO.md SEO task **SEO2** once schemas are approved.
- `/api/post-deploy` is still deployed despite being a one-off bootstrap endpoint. Track its retirement under docs/TODO.md Security task **S5** so the preview secret stays private.

### docs/guidelines/performance.md
---
description: Document performance-sensitive code paths and tactics to keep Multimage fast.
---

# Performance Notes

## Hot Paths

- The staff catalogue table in `src/pages/staff/archivio-catalogo/index.astro` renders hundreds of rows plus CSV logic at build time, inflating static HTML for an internal-only view. Gate it behind auth or an API before shipping to production.

## Client Bundles

- `BookCarouselSection` currently imports `swiper/css/bundle` and the complete `swiper/element` runtime. Consider lazy-loading the carousel or switching to the minimal modules if the carousel stays limited to a few sections.
- Inline global scripts (legacy Google Analytics, Iubenda) in `src/layouts/BaseLayout.astro:132-210` execute immediately. Mark them `async`/`defer` and audit whether each script is still required.

## Data Fetching & HTML Size

- Many GraphQL queries request `first: 500` items (books, authors, sitemap, staff). Introduce pagination helpers or incremental routes so responses and generated HTML scale beyond 500 records.
- `_site` navigation data is fetched by `BaseLayout` for every page render; investigate lifting this query into `astro:config` hooks or a global loader so it can be cached instead of re-fetched per page.

## Build Costs

- `/libri` is paginated (40/page) to keep listing HTML — and Vercel Fast Origin Transfer — small; card grids use lean responsive images (no base64/srcSet). The heavy `/llms-full.txt` export was removed (2026-06-20). See decisions-log `2026-06-20-fot-reduction`.

## Matching decisions (descriptions)
- docs/decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md — Workers Cache behind a cache-off gateway, DatoCMS cache tags purged by webhook; no Vary: Cookie.
- docs/decisions-log/2026-05-31-editor-session-gating.md — internal routes gated in src/middleware.ts; never throw new Response() from a page frontmatter (Astro 6+ gotcha), return it.

## Preset rules
astro: output 'server', no prerender exports; env via astro:env envField (server secret; only PUBLIC_ to client; PUBLIC_ vars are inlined at build); no ClientRouter (scripts init when the module runs); Workers Free CPU.
datocms: tokens server-side; nullable fields; environment via executeQuery (DATOCMS_ENVIRONMENT); includeDrafts:false for the endpoint; no schema change; generated types (gql.tada/graphql setup used by the repo's _graphql.ts files).
