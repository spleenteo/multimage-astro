# Slice packet — borsa V6

READ THIS WHOLE FILE.

## Project constraints
No push, no deploy, no remote wrangler commands (the conductor applies 0002 remotely afterwards). Never touch credentials or .env* files. Italian copy, English code comments and docs. Inclusive paired forms with the feminine first (Autrice/Autore, socia o socio). Commit with explicit paths, imperative messages, with the trailer lines: 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' and 'Claude-Session: https://claude.ai/code/session_01RKnBua6f6ZuWphGxaTmX5B'. Shell: rm is intercepted, use /bin/rm. Dev servers only on free ports, never 4321/4329/5198; stop by PID; restore schema.ts if regenerated; local D1 only.

## Slice section
## V6 — Member discount (soci 30%)

User's request (2026-11-24): a checkbox "sono socio" on the form; when ticked, 30% off the total. Soci get 30% off every publication (PRODUCT.md, `/info/adesioni`). Also from the same message: anonymising keeps city and province (they are not personal once name and address are gone).

**In**

- `src/lib/order.ts`: `MEMBER_DISCOUNT_PERCENT = 30`; totals gain `discount` (cents, 30% of the books subtotal, rounded to the cent) applied to the books only, never to shipping; the fast-shipping +5 € stays whole. Field `member: boolean` in `OrderFields` and the request parsing.
- Form: a checkbox row (DESIGN.md checkbox rows, 44px) "Sono socia o socio di Multimage" with a note "Sconto del 30% sul prezzo di copertina: lo staff verifica l'iscrizione." (feminine first, as the site's paired forms). The recap aside and its totals show the "Sconto soci −30%" line live when ticked.
- Endpoint: recomputes the discount on the server (never trusts the client), stores it; D1 migration `d1/migrations/0002_member_discount.sql`, additive: `member INTEGER NOT NULL DEFAULT 0 CHECK (member IN (0,1))`, `discount_cents INTEGER NOT NULL DEFAULT 0`; `total_cents` is after discount; `d1/README.md` contract updated.
- Shop email, success screen and PDF: a "Socia/socio: sì" line and the discount line, total after discount.
- Docs: d1/README retention paragraph says city and province stay after anonymising (user's call); setup note gets the remote apply of 0002; current-state, DESIGN.md order page.

**Out**: checking membership (the staff does it).

**Done**

1. Ticking the box shows "Sconto soci" and a total 30% lower on the books; with fast shipping the 5 € is not discounted.
2. A submit with `member: true` stores `member=1`, `discount_cents` and the discounted `total_cents` in local D1; the email, success screen and PDF show the discount.
3. Unticked: no discount line anywhere, totals as before.
4. Gate green (lint, build, docs:inventory, build:cf).


## What exists (V1–V5)
**V4 — done on 2026-11-24**

V4 moved the order record to Cloudflare: d1/migrations/0001_orders.sql creates `orders` (20 columns, CHECKs, AUTOINCREMENT id, nullable personal fields for anonymising) with its staff-app contract in d1/README.md; wrangler.jsonc gained top-level ORDERS (placeholder id) and ORDER_MAIL (send_email to ordini@, sender allowlisted to sito@ordini.multimage.org); one wrapper, src/lib/cloudflare-bindings.ts, reads the bindings, aliased to an empty stub outside the Cloudflare build; order.ts gained the MM-YYMMDD-XXXX code, ORDER_COLUMNS/orderRow and a shop-only email; the endpoint inserts, sends, then updates notify_status, and Resend, the visitor copy, RESEND_API_KEY and copySent are gone. The walk ran Cloudflare dev with local D1 (one row at server prices, notify_status sent, the simulated send_email logged), plain dev (200 with a dev code), and a production-mode Worker with the bindings stripped (503 not_configured) and kept (400 empty_bag), with the older-workerd compatibility date again. The final review found that a saved but unnotified order (200 notified:false) still told the visitor it had reached Olivier while nobody reads D1 yet; the success lede now says the notice did not go out and offers a mailto with the code (4f7a4e1). It also traced the workerd "Can't read from request stream" log on early returns to the gateway forwarding an unread body (not V4), and noted that a code clash would hand the visitor another order's code (no retry, accepted odds). Rulings: packet by reference; T4 dropped the unused send_failed from order.ts; T4's executor-run dev server stands. For V5: an ops check on rows with notify_status <> 'sent' until the staff app ships; whether to cancel unread bodies in Backend.fetch. Pending: Done 6, the real D1 id before the merge. Pending: Done 6 (real `database_id` before the merge, needs the user's ok for `d1 create`).
--
**V5 — done on 2026-11-24**

V5 finished the Cloudflare-only order flow. The endpoint retries the insert once with a fresh code on a UNIQUE clash on orders.code (saveWithCodeRetry/isCodeClash in order.ts; the local D1 error text "UNIQUE constraint failed: orders.code" was confirmed in T6), and builds the shop email after the save so it carries the saved code. The success screen gained "Non riceverai un'email: scarica il PDF della tua richiesta.", a "Scarica il PDF" button that lazy-loads jsPDF 4.2.1 (exact pin; a separate ~400 KB chunk, none of it in /borsa's entry closure) and saves ordine-<code>.pdf built from a pure model (order-pdf.ts, WinAnsi-safe text, line breaks kept as spaces), the print button beside it, and a print sheet scoped to the success state (the first version blanked any print of /borsa before sending). The causale now carries the code; every visitor-email promise is gone; the consent carries the staff-retention line. Mid-slice the user asked for "lo staff" instead of "Olivier" in all visitor text (T3b). setup-borsa.md was rewritten for Cloudflare only (SPF first … rollback, WAF before the Turnstile secret, unsent-notice query and anonymising UPDATE), d1/README.md got retention and unsent notices, and guidelines, inventories (docs:inventory green again), current state, TODO (BORSA-staff-app, BORSA-privacy, BORSA-stream-log; MAIL-auth to H) and DESIGN.md were brought in line. The final review caught a PDF step that contradicted the page ("i libri partono" after the receipt) and five doc statements wrong against the code; its fix round first dropped the user's binding wording and was sent back. Rulings: the packet was read from file rather than pasted; "Non riceverai un'email" kept as the user's wording; anonymising keeps city/province (privacy call for the user). Mobile Safari download is pending for the user. Pending: PDF on mobile Safari (user, on a phone).
Files: src/lib/order.ts (no imports; shared with browser: totals, fields, validation, email text, ORDER_COLUMNS/orderRow), src/lib/order-pdf.ts, src/pages/api/ordine/index.ts, src/pages/borsa/index.astro, src/pages/borsa/_order-page.client.ts, src/pages/borsa/_order-pdf.client.ts, src/pages/borsa/_borsa.css, d1/migrations/0001_orders.sql, d1/README.md, docs/work/2026-11-24-borsa/setup-borsa.md. The remote D1 already has 0001 applied (database id in wrangler.jsonc is real now).

## lessons.md
# Lessons — borsa

- A Verified grep that expects two attributes on one line fails after prettier splits attributes; write it with -A/-B context or grep each attribute separately.
- When a new control joins a fixed-width row, the plan sums the row at 390px before execution: logo, gaps and every button, against the container minus its padding.
- A fixed-height group with a border shrinks its stretched children by the border width; give the controls the 44px height, not the group.
- A data-* ready flag must be set to a non-empty value ('true') and compared with ===; an empty string is falsy and the guard never fires.
- A plan that says module A "exports" a helper for task B checks that A's own task text lists the export; otherwise B is blocked outside its Files.
- Executors read the packet whole; two read only to line 557 of 766 and missed the project constraints.
- A dev-only branch (console output of personal data) is gated on import.meta.env.DEV itself, never only on an earlier check that returns first in production.
- The CDA rejects a whole `filter: { id: { in } }` query when one id is not a valid ItemId: pre-filter ids by format and treat a CDA error as a safe failure.
- A production-mode check of the Cloudflare build runs with `npx wrangler dev --local -c dist/server/wrangler.json`, adding `--compatibility-date` when the bundled workerd is older; `astro preview` and `.wrangler/deploy/config.json` do not start it.
- An executor that skips a step of its Verified line lists it under Concerns, not only under Tests.
- A DOM dump for a static detector is taken before injecting test scripts (axe) and without the dev toolbar; otherwise the detector scans the tool's own source.
- Impeccable detector 4.8.2 matches ignoreValues by value only for overused-font; other rules take `value: "*"` with `files` globs, and file-scoped ignores never apply to rendered-DOM scans: triage those by hand.
- A rollback or fallback check in a user note states what the visitor sees at each step from the client code (which state shows before and after a submit), not from the endpoint's answer alone.
- A plan rule on docs language ("new and rewritten text in English") is checked on every new line of the diff, not only on the lines a finding names.
- A task that changes a shared type updates its consumers in the same commit, or the plan orders tasks so every commit type-checks.
- When a response gains a degraded-success flag (e.g. notified:false), the same slice makes the client read it; never leave a success screen that claims more than the flag says.
- A plan's absence grep anchors on the code form (`\.innerHTML`, not `innerHTML`) so a comment naming the rule doesn't trip it, and a grep's context window is counted against the real file.
- Dev-server checks go to the runner/conductor, not the executor's Verified line (executor.md forbids executors starting servers).
- In the gateway/Backend Worker, an endpoint that answers before reading the body logs "Can't read from request stream after response has been sent" in workerd; the client's answer is correct, so judge it as gateway noise, not an endpoint failure.
- A print stylesheet that hides everything but one section must be scoped to the state where that section shows (e.g. body:has(.x:not([hidden]))), or printing the page in any other state gives a blank sheet.
- A sanitiser that drops control characters must first turn \n, \r and \t into spaces, or multi-line user text runs its words together.
- A document the visitor keeps (PDF, email) must say the same sequence as the page: check each step against the page's own list, and never add a clause the plan did not write.
- A fix round must not reword text the user dictated: name the binding strings in the fix instruction, and the reviewer checks them verbatim.
- Docs describing endpoint behaviour (503 conditions, dev path) are checked line by line against the endpoint's condition order, not paraphrased from the plan.

## Test level
essential. Totals/discount as pure functions in order.ts tested with npx tsx; endpoint with curl on DEPLOY_TARGET=cloudflare npx astro dev and local D1 (apply 0001 and 0002 locally). Gate = npm run lint + npm run build + npm run docs:inventory + npm run build:cf.

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

## Order endpoint (/api/ordine)

`POST /api/ordine` (`src/pages/api/ordine/index.ts`) saves one book order to the D1 database `multimage-orders` and sends the shop one notification email. It accepts a JSON body with the buyer's fields, the Turnstile token and `lines` of `{id, qty}`; titles and prices are never trusted from the client, they are refetched from the published CDA and rebuilt (`rebuildOrder` in `src/lib/order.ts`), so a tampered bag cannot reach D1 or the email. Any method but POST answers 405 (`allow: POST`). It does not use `src/pages/api/utils.ts` (CORS `*` and error echo do not fit a form endpoint). The bindings (`ORDERS` for D1, `ORDER_MAIL` for `send_email`) are read only through `src/lib/cloudflare-bindings.ts`. The visitor gets no email: the success screen offers a PDF of the request, built in the browser.

Defences, in the order the endpoint answers (the first failing check wins):

1. **Config, fail closed.** Without `TURNSTILE_SECRET_KEY`, or with neither binding present, it answers `503 not_configured` outside dev. In dev, with no binding the email text goes to the console and the endpoint answers 200 with an order code that is not saved (nothing is stored or sent; the email text is printed to the console); an unset Turnstile secret falls back to Cloudflare's always-pass test secret (siteverify then checks `success` only).
2. **Size.** Body capped at 16384 bytes (`ORDER_BODY_MAX_BYTES`), checked on `content-length` and again on the read body (`400 too_large`).
3. **Shape.** Invalid JSON, at most 30 lines (`ORDER_MAX_LINES`), quantity 1-20 per line, field validation (`400` with codes `bad_request`, `empty_bag`, `too_many_lines`, `bad_lines`, `invalid`).
4. **Turnstile.** Server-side siteverify checks `success`, the hostname of the request and the action `ordine`; a failure logs which check failed (`reason=success|hostname|action`), never the token (`400 turnstile`). Siteverify unreachable: `502 turnstile_unavailable`.
5. **Catalogue refetch.** Ids are pre-filtered by format (22 base64url characters, or digits) because the CDA rejects a whole `id: { in }` query on a bad ItemId; a forged id ends as a dropped line or a safe `502 catalogue_unavailable`. If every line drops: `409 nothing_orderable`.
6. **Save, then notify.** The order is inserted into D1 (the record) with the readable code `MM-YYMMDD-XXXX`; on a UNIQUE clash on `orders.code` the code is regenerated and the insert retried once (`saveWithCodeRetry`). Then one email goes to `ordini@multimage.org` through the `send_email` binding and `notify_status` is updated (`sent`, `failed` or `skipped`). Saved but not notified is still `200` with `notified: false`; notified but not saved is `200` too (the email carries the whole order); neither is `502 save_failed`.

Every answer carries `cache-control: private, no-store`. Error bodies carry codes only. Logs are one line per answer, `[ordine] <status> <code>` (or `[ordine] 200 ok lines=<n> dropped=<n> ...`), plus `code_clash`, `save_error` and `notify_update_error`: counts only, never a name, email, address, notes or token. Orders whose notice did not go out are found with the `notify_status <> 'sent'` query in `d1/README.md`, until the staff app exists (TODO **BORSA-staff-app**). Personal data stays in D1 only for the time needed to ship, then it is anonymised (retention rule in `d1/README.md`; TODO **BORSA-privacy** for the policy side).

Outer limits, beyond the code: a Cloudflare WAF rate limiting rule on `/api/ordine` (set it before `TURNSTILE_SECRET_KEY`, see `docs/guidelines/operations.md` § Environment & Secrets). There is no third-party mail tier to hit: Cloudflare is the only service involved (Workers Free limits apply). The WAF rule covers only the zone hostnames: the `workers.dev` and preview URLs (`workers_dev`, `preview_urls` in `wrangler.jsonc`) bypass it. No order goes through them (the siteverify hostname check refuses it), but each request costs a siteverify call and Worker time; TODO `CF-vercel-cleanup` turns them off after go-live. Setup steps for the user: `docs/work/2026-11-24-borsa/setup-borsa.md`.

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
| `TURNSTILE_SECRET_KEY` | server | secret | yes | no | `src/pages/api/ordine/index.ts` | Worker secret only (unset = `/api/ordine` answers 503) |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | client | public | no | **YES** | `src/pages/cerca/index.astro` (via `import.meta.env`), search bundle | yes |
| `PUBLIC_SITE_URL` | client | public | no | **YES** | BaseLayout canonical, sitemap, `post-deploy` | yes |
| `PUBLIC_TURNSTILE_SITE_KEY` | client | public | yes | **YES** | `src/pages/borsa/index.astro` (widget) | build env file (`.env.cloudflare`), inlined at build; unset = `/borsa` shows the email box |
| `DATOCMS_API_TOKEN` | — (not declared) | — | — | no | only `scripts/sync-datocms.mjs` (local dev) | **NO — dead weight on Vercel** |

### Findings

1. **`DATOCMS_API_TOKEN` su Vercel non viene letto a runtime.** Lo script `sync-datocms.mjs` gira solo da `npm run dev`/`start` (locale), non da `npm run build`. Tenerlo su Vercel è solo superficie d'attacco senza utilità. → **Action**: rimuovere da tutti gli env Vercel.
2. **6 secret su Vercel sono "Needs Attention"** (non cifrati at-rest nel dashboard team): `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DATOCMS_API_TOKEN` (verrà eliminato), `DATOCMS_CMA_TOKEN` (se presente). → **Action**: migrare a tipo *Sensitive*.
3. **`PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` scope da verificare.** Il token finisce nel bundle JS del browser (`src/pages/cerca/index.astro:11` via `import.meta.env`) ed è quindi leggibile da chiunque. Deve essere un token DatoCMS con **solo il ruolo "Site Search"** (read-only sull'endpoint `/search-results`). Se ha permessi più ampi (CDA published, CDA draft, CMA) è una **leak severa**.
4. **`PUBLIC_SITE_URL` è safe** — è solo `https://www.multimage.org`, nessun problema a esporlo al browser.

### Cloudflare Worker secrets

On the Cloudflare target the variables above are Worker secrets, not Vercel env vars (switch procedure: `docs/guidelines/cloudflare-switch.md`):

- Set with `npx wrangler secret put <NAME>` (or `wrangler secret bulk`), through the env-file wrapper described in `docs/guidelines/operations.md`; list the names with `npx wrangler secret list` (it never prints values). Never commit a secret file or print a value.
- The Worker starts with the secrets listed in `docs/guidelines/operations.md` (Environment & Secrets) and `cloudflare-switch.md` (Starting point), plus the two of switch day (`DATOCMS_CMA_TOKEN`, `SITE_SEARCH_BUILD_TRIGGER_ID`) and the order secret (`TURNSTILE_SECRET_KEY`, set with `wrangler secret put`, value at the prompt). `BYPASS_TOKEN` is Vercel-only and must not be created there. `PUBLIC_TURNSTILE_SITE_KEY` is not a Worker secret: it is public and inlined at build from `.env.cloudflare`.
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
- `PUBLIC_TURNSTILE_SITE_KEY` — safe by design: the Turnstile site key is public and bound to the widget's hostnames; the secret key stays a Worker secret
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` — safe **solo se scope verificato come Site Search-only** (vedi sopra)

Nessun secret è accidentalmente prefissato `PUBLIC_*` in `astro.config.mjs`. ✅

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
