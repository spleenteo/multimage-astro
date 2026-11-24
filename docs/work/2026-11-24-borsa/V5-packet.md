# Slice packet — borsa V5

READ THIS WHOLE FILE.

No frame (product work, problem clear; no criterion block).

## Project constraints
No push, no deploy. No account, DNS, Email Routing or D1 remote commands. Never touch credentials or .env* files. Italian copy, English code comments and docs. Commit with explicit paths, imperative messages, with the trailer lines: 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' and 'Claude-Session: https://claude.ai/code/session_01RKnBua6f6ZuWphGxaTmX5B'. Shell: rm is intercepted, use /bin/rm. Dev servers only on free ports, never 4321/4329/5198; stop them by PID after; restore schema.ts if regenerated. Never edit schema.ts. New npm dependency (jsPDF) allowed: pin the exact version, record it in docs/guidelines/dependencies.md. CLAUDE.md 'After a feature is confirmed complete': update guidelines, list-*.md, current-state.md, TODO.md (format CLAUDE.md §3: areas Refactoring|Security|Performance|Features|Documentation; '- [ ] [Area] [Impact: H|M|L] [Effort: H|M|L] [Owner: @handle] [Status: todo|wip|done] — description'; completed '- [YYYY-MM-DD] - [Area] **Name**: text').

## Shaping revision
## Revision 2026-11-24 (after V3): Cloudflare only, no Resend

User's call: no new external service to manage; orders stored in a Cloudflare database; the visitor gets no email but a PDF of the request on the confirmation screen; order management (read, fulfil, delete or anonymise) lives in a separate staff app on another Worker, not in the editorial site. Privacy line: "I tuoi dati restano allo staff solo per il tempo necessario alla spedizione." Facts in `spike-cloudflare-only.md`.

| Req | Requirement | Status |
|----|-------------|--------|
| R3 | 🟡 The order is sent from a form (name, email, shipping address, notes) to Multimage: stored in a Cloudflare database and notified to ordini@multimage.org; the visitor gets no email and can download a PDF of the request | Must-have |
| R10 | 🟡 No external service besides Cloudflare (Workers Free) | Must-have |
| R11 | 🟡 The order store is shared with a separate staff app (another Worker) through a stable table contract; the site only writes | Must-have |

**Shape B′ = B with B5.3 and B4.3 replaced**

| Part | Mechanism | Flag |
|------|-----------|:----:|
| B5.3′ | 🟡 Endpoint saves the order to D1 (`multimage-orders`, jurisdiction eu; table `orders` with a readable `code`, server-rebuilt lines, cents, `consent_at`, `notify_status`), then sends one notification through the Workers `send_email` binding to the verified ordini@ from an address on an Email Routing subdomain; D1 is the record, the email a notification; saved + email failed → 200 flagged; email only → 200; both fail or no binding → error and mailto | |
| B5.5 | 🟡 Binding access through one wrapper module over `cloudflare:workers`, aliased to a stub outside the Cloudflare build so the Vercel build and plain `npm run dev` compile | |
| B4.3′ | 🟡 Confirmation screen: order code, "Non riceverai un'email: scarica il PDF della tua richiesta", PDF generated in the browser with jsPDF loaded on tap; print stylesheet as desktop fallback | |
| B5.6 | 🟡 Resend code, `RESEND_API_KEY` and the visitor copy removed | |

User setup (not code): SPF on the apex first (`v=spf1 include:_spf.google.com ~all`), Email Routing enabled on a subdomain through the API (not `wrangler email routing enable`), ordini@ verified as a destination, D1 database created and migrated.

Fit: B′ passes R0–R11 once the spike's first-send check (structured `send()` from a routing-only subdomain) holds; fallback `EmailMessage` with a hand-built MIME.


## Slice section (slices.md, V5 and what V4 carried)
## V5 — The PDF of the request, copy and docs

**In**

- Confirmation screen: the order code, "Non riceverai un'email: scarica il PDF della tua richiesta.", a "Scarica il PDF" button that lazy-loads jsPDF and saves `ordine-<code>.pdf` (Multimage header, date, code, contact, lines, copies, shipping, total, next steps with IBAN, PayPal, causale with the code); print stylesheet for desktop.
- Copy: consent text "I tuoi dati restano allo staff solo per il tempo necessario alla spedizione." plus the iubenda link; page lede and drawer fine line no longer promise an email copy.
- Docs: rewrite `setup-borsa.md` (SPF first, Email Routing on a subdomain through the API, verify ordini@, D1 create with `--jurisdiction eu` and migrations apply, Turnstile, WAF, deploy order, rollback); `security.md`, `operations.md`, `current-state.md`, `list-helpers.md`, `TODO.md` (remove Resend items; add the staff app and MAIL-auth), DESIGN.md order page lines.

**Done**

1. Success state downloads a readable PDF on desktop Chrome and mobile Safari (or the conductor records it as pending for the user on a phone).
2. No text on the site promises an email to the visitor.
3. Setup note complete; `docs:inventory`, lint and build green.

**Impact corrections (2026-11-24)**

- The visitor-email promises to rewrite are in `src/pages/borsa/index.astro` (~50 lede, ~304 "Ti arriva una copia dell'ordine"), `src/lib/order.ts` (`EMAIL_EMPTY_MESSAGE` ~276) and `src/pages/borsa/_order-page.client.ts` (success lede ~323-334); the drawer fine line promises nothing. The print button (~348, today shown only after a failed copy) becomes the desktop fallback beside "Scarica il PDF".
- Docs also false after the work: `docs/guidelines/project-structure.md:93`, `DESIGN.md:347`, `docs/guidelines/security.md:31-38,79`, `docs/guidelines/operations.md:26,46`, `docs/current-state.md:113,145`, `docs/TODO.md:3` (BORSA-waf) and `:67` (BORSA-setup) reworded; MAIL-auth (`TODO.md:34`) updated (apex SPF is now a prerequisite) with higher impact; jsPDF added to `docs/guidelines/dependencies.md`.
- Setup note order: apex SPF → Email Routing on `ordini.multimage.org` (API) → verify ordini@ → D1 create and migrate → first deploy carrying the bindings; first check: one real order with `notify_status = sent`.
- User items (outside the repo): `/info/ordinare` (CMS) and the iubenda privacy policy should name Cloudflare as processor and the retention ("solo per il tempo necessario alla spedizione").
- jsPDF: pinned version; `/borsa`'s entry script contains no jsPDF (lazy chunk only); the build passes with its optional dynamic imports (html2canvas, dompurify, canvg) as installed.

**Carried from V4 into V5**

- A way for staff to spot orders whose notice did not go out (`notify_status <> 'sent'`) until the staff app exists: at least documented in the setup note and `d1/README.md` (a `wrangler d1 execute --remote` query).
- Order code clash: on a UNIQUE conflict at insert, regenerate the code and retry once.
- workerd logs "Can't read from request stream" on early answers (gateway, not this work): note in TODO if reproducible.

## What V4 built
**V4 — done on 2026-11-24**

V4 moved the order record to Cloudflare: d1/migrations/0001_orders.sql creates `orders` (20 columns, CHECKs, AUTOINCREMENT id, nullable personal fields for anonymising) with its staff-app contract in d1/README.md; wrangler.jsonc gained top-level ORDERS (placeholder id) and ORDER_MAIL (send_email to ordini@, sender allowlisted to sito@ordini.multimage.org); one wrapper, src/lib/cloudflare-bindings.ts, reads the bindings, aliased to an empty stub outside the Cloudflare build; order.ts gained the MM-YYMMDD-XXXX code, ORDER_COLUMNS/orderRow and a shop-only email; the endpoint inserts, sends, then updates notify_status, and Resend, the visitor copy, RESEND_API_KEY and copySent are gone. The walk ran Cloudflare dev with local D1 (one row at server prices, notify_status sent, the simulated send_email logged), plain dev (200 with a dev code), and a production-mode Worker with the bindings stripped (503 not_configured) and kept (400 empty_bag), with the older-workerd compatibility date again. The final review found that a saved but unnotified order (200 notified:false) still told the visitor it had reached Olivier while nobody reads D1 yet; the success lede now says the notice did not go out and offers a mailto with the code (4f7a4e1). It also traced the workerd "Can't read from request stream" log on early returns to the gateway forwarding an unread body (not V4), and noted that a code clash would hand the visitor another order's code (no retry, accepted odds). Rulings: packet by reference; T4 dropped the unused send_failed from order.ts; T4's executor-run dev server stands. For V5: an ops check on rows with notify_status <> 'sent' until the staff app ships; whether to cancel unread bodies in Backend.fetch. Pending: Done 6, the real D1 id before the merge. Pending: Done 6 (real `database_id` before the merge, needs the user's ok for `d1 create`).
Files: d1/migrations/0001_orders.sql, d1/README.md (table contract), wrangler.jsonc (ORDERS placeholder id, ORDER_MAIL), src/lib/cloudflare-bindings.ts, src/lib/order.ts, src/pages/api/ordine/index.ts, src/pages/borsa/index.astro, src/pages/borsa/_order-page.client.ts, docs/work/2026-11-24-borsa/setup-borsa.md (written for Resend in V3: rewrite it).

## Setup facts for the rewrite (spike: docs/work/2026-11-24-borsa/spike-cloudflare-only.md, read it)
Order: 1) apex SPF 'v=spf1 include:_spf.google.com ~all' first (Cloudflare adds its own apex SPF otherwise, Google mail softfails); 2) Email Routing on ordini.multimage.org via the API (not wrangler email routing enable, which acts on the whole zone), compare DNS before/after, apex MX untouched; 3) verify ordini@multimage.org as destination (click in Gmail); 4) wrangler d1 create multimage-orders --jurisdiction eu, put the id in wrangler.jsonc, wrangler d1 migrations apply multimage-orders --remote; 5) Turnstile widget, TURNSTILE_SECRET_KEY via wrangler secret put, PUBLIC_TURNSTILE_SITE_KEY in .env.cloudflare; 6) WAF rate limiting rule on /api/ordine (path only, confirm Free plan fields); 7) deploy:cf; first check: one real order with notify_status = sent and dkim=pass in the headers; 8) DMARC p=none and a Gmail never-spam filter on ordini@; rollback. The conductor will run DNS/Email Routing/D1 steps with the user's ok via cf/wrangler: the note still documents them.

## Visitor copy texts (user's words)
Success screen: 'Non riceverai un'email: scarica il PDF della tua richiesta.' Consent: 'I tuoi dati restano allo staff solo per il tempo necessario alla spedizione.' plus the iubenda link.

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

## Test level
essential. PDF builder logic as a pure function (lines -> document model) testable with npx tsx; the jsPDF call itself checked in a browser (headless Chromium download). Gate = npm run lint + npm run build + npm run docs:inventory; also npm run build:cf compiles.

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

`POST /api/ordine` (`src/pages/api/ordine/index.ts`) sends one book order by email. It accepts a JSON body with the buyer's fields, the Turnstile token and `lines` of `{id, qty}`; titles and prices are never trusted from the client, they are refetched from the published CDA and rebuilt (`rebuildOrder` in `src/lib/order.ts`), so a tampered bag cannot reach the email. Any method but POST answers 405 (`allow: POST`). It does not use `src/pages/api/utils.ts` (CORS `*` and error echo do not fit a form endpoint).

Defences, in the order the endpoint answers (the first failing check wins):

1. **Config, fail closed.** Without `RESEND_API_KEY` or `TURNSTILE_SECRET_KEY` it answers `503 not_configured` outside dev. In dev, with no Resend key the email text goes to the console instead of the network, and an unset Turnstile secret falls back to Cloudflare's always-pass test secret (siteverify then checks `success` only).
2. **Size.** Body capped at 16384 bytes (`ORDER_BODY_MAX_BYTES`), checked on `content-length` and again on the read body (`400 too_large`).
3. **Shape.** Invalid JSON, at most 30 lines (`ORDER_MAX_LINES`), quantity 1-20 per line, field validation (`400` with codes `bad_request`, `empty_bag`, `too_many_lines`, `bad_lines`, `invalid`).
4. **Turnstile.** Server-side siteverify checks `success`, the hostname of the request and the action `ordine`; a failure logs which check failed (`reason=success|hostname|action`), never the token (`400 turnstile`). Siteverify unreachable: `502 turnstile_unavailable`.
5. **Catalogue refetch.** Ids are pre-filtered by format (22 base64url characters, or digits) because the CDA rejects a whole `id: { in }` query on a bad ItemId; a forged id ends as a dropped line or a safe `502 catalogue_unavailable`. If every line drops: `409 nothing_orderable`.
6. **Send.** Resend to `ordini@multimage.org` first (a failure is `502 send_failed`), then the visitor copy, which omits the notes. A failed copy does not fail the order (`copySent: false`).

Every answer carries `cache-control: private, no-store`. Error bodies carry codes only. Logs are one line per answer, `[ordine] <status> <code>` (or `[ordine] 200 ok lines=<n> dropped=<n> copySent=<bool>`): counts only, never a name, email, address, notes or token.

Outer limits, beyond the code: a Cloudflare WAF rate limiting rule on `/api/ordine` (set it before `RESEND_API_KEY`, see `docs/guidelines/operations.md` § Environment & Secrets) and Resend's free tier hard stop (100 emails/day, 3,000/month; two emails per order, so about 50 orders a day). The WAF rule covers only the zone hostnames: the `workers.dev` and preview URLs (`workers_dev`, `preview_urls` in `wrangler.jsonc`) bypass it. No mail goes out from them (the siteverify hostname check refuses it), but each request costs a siteverify call and Worker time; TODO `CF-vercel-cleanup` turns them off after go-live. Setup steps for the user: `docs/work/2026-11-24-borsa/setup-borsa.md`.

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
| `RESEND_API_KEY` | server | secret | yes | no | `src/pages/api/ordine/index.ts` | Worker secret only (unset = `/api/ordine` answers 503) |
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
- The Worker starts with the secrets listed in `docs/guidelines/operations.md` (Environment & Secrets) and `cloudflare-switch.md` (Starting point), plus the two of switch day (`DATOCMS_CMA_TOKEN`, `SITE_SEARCH_BUILD_TRIGGER_ID`) and the two order secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, set with `wrangler secret put`, values at the prompt). `BYPASS_TOKEN` is Vercel-only and must not be created there. `PUBLIC_TURNSTILE_SITE_KEY` is not a Worker secret: it is public and inlined at build from `.env.cloudflare`.
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
- Order endpoint keys (`/api/ordine`, see `security.md` § Order endpoint): `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` are Worker secrets (`wrangler secret put`, optional: unset means `/api/ordine` answers 503). `PUBLIC_TURNSTILE_SITE_KEY` is public and inlined at build like `PUBLIC_SITE_URL`, so it lives in `.env.cloudflare` and needs a `deploy:cf` to take effect; set it last, after the two secrets (until it is built in, `/borsa` shows the email box). Neither is needed on Vercel (no traffic).
- WAF rule, a prerequisite before setting `RESEND_API_KEY`: one Cloudflare rate limiting rule (Free plan: one rule, 10 s period, 10 s block) on expression `(http.request.uri.path eq "/api/ordine")`, counted per IP, 2 requests per 10 s, action Block. The Free plan likely offers only Path and Verified Bot fields, so no Method condition (GETs count too, harmless); confirm field and period options in the dashboard. Check with bare `{}` POSTs, which answer 503 before any key exists and send no mail. Steps: `docs/work/2026-11-24-borsa/setup-borsa.md`.
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
- Order endpoint: `npx wrangler tail multimage-astro --format json` shows the `[ordine] <status> <code>` lines (counts only, no personal data); delivery of the shop email and the visitor copy is checked in the Resend dashboard (Emails).
- The `/llms-full.txt` export route was removed (2026-06-20); no exporter to maintain.

## Testing & Automation

- No CI workflow runs `astro check`, linting, or builds. Add GitHub Actions (or Vercel checks) to execute at least `npm run lint` and `npm run build` on pull requests.
- `npm run test` chains `npm run format` → `npm run lint` (Prettier `--check`) → `npm run build`. This covers formatting and build health but not unit coverage.
- Utilities like `src/pages/cerca/search-page.client.ts` and the staff CSV helpers have zero unit tests; start with Vitest for pure helpers and DOM tests for CSV/search scripts.
- GraphQL queries rely on build-time validation. Consider lightweight contract tests that mock `executeQuery` responses so schema drift is caught earlier.

### docs/guidelines/dependencies.md
---
description: Summarise runtime, CMS, and tooling dependencies used by Multimage.
---

# Dependencies

## Runtime & UI

- Node 24.x (`.nvmrc` for local, `engines.node` in `package.json` for Vercel) and TypeScript 6 (`typescript@^6`; TypeScript 7 is deferred, see `docs/decisions-log/2026-11-04-defer-typescript-7.md`).
- `astro@^7` (Rust compiler, Vite 8, `compressHTML: true` pinned) with `output: 'server'` and `@astrojs/vercel@^11` ISR (no prerendered routes), deployed to Vercel as a single project.
- Styling uses `tailwindcss` 4 through `@tailwindcss/vite` in `astro.config.mjs`; there is no PostCSS config, no autoprefixer and no `@astrojs/tailwind` integration. The theme (brand tokens, fonts, Tailwind 3 line heights) sits in `@theme static` in `src/styles/global.css`, imported with `theme(static)` so tokens used only through `@apply` in CSS modules are still defined. Tailwind CSS modules start with `@reference` to `global.css` and use no `@layer`. Site browser baseline: Safari 16.4+, Chrome/Edge 111+, Firefox 128+ (Tailwind 4; Swiper 14 alone needs 110+). See `docs/decisions-log/2026-11-07-tailwind-4.md`.
- `swiper` 14 (exact pin) provides the carousel web component; `BookCarouselSection` imports `swiper/element/bundle` so no asset-copy step is required. Swiper 14 raises the browser baseline to Chrome/Edge 110+, Safari 16.4+, Firefox 110+.

- `maplibre-gl` 6.17.0 (exact pin) draws the `/distributori` map (`SuppliersMap`) with OpenFreeMap vector tiles (`tiles.openfreemap.org`, no key, no cookies). It is loaded on demand when the map nears the viewport: about 295 KB gzip, plus a 148 KB worker and 10 KB CSS, on that page only. The worker URL is set explicitly via `maplibre-gl/dist/maplibre-gl-worker.mjs?url` + `setWorkerUrl`, because Vite's dependency pre-bundling moves the module away from its worker.

## CMS & Data

- `@datocms/astro`, `@datocms/cda-client`, and the `datocms` CLI package (not `@datocms/cli`) handle rendering helpers, GraphQL fetching, and schema generation. `@datocms/cma-client` is a runtime dependency: `/api/revalidate` (Site Search reindex), `/api/post-deploy` and `/api/seo-analysis` call `buildClient`.
- `@datocms/cma-client` 6 and the `datocms` CLI 4.2 family share one `@datocms/rest-client-utils` 6 copy (no `overrides` in `package.json`); both clients redact tokens in their `ApiError` (`@datocms/cda-client` ≥ 0.3.1, `@datocms/rest-client-utils` ≥ 6.1.1).
- `jsdom` 30 (with `@types/jsdom` 30) is used only by `/api/seo-analysis` and needs Node `^22.22.2 || ^24.15.0 || >=26`; `engines.node` is `24.x`, so ≥ 24.15 is the floor to keep in mind on Vercel.
- `tsx` is not a direct dependency: `npm run check:revalidation-map` uses the copy hoisted from the `datocms` CLI (also pulled by `vite`).
- DatoCMS data primarily flows through `@datocms/cda-client`; `dotenv-cli` is only needed for scripts like `npm run sync-datocms`.

## Monitoring & Analytics

- Inline Google Analytics and Iubenda snippets live inside `BaseLayout` (Vercel Analytics and Speed Insights were removed on 2026-11-22).

## Tooling

- Formatting is enforced via `prettier` + `prettier-plugin-astro` 1.x (Astro Rust compiler). `.prettierrc` sets `astroCompressHTML: "html"`, mirroring `compressHTML: true` in `astro.config.mjs`; change both together. No ESLint is configured, so lint coverage stops at formatting.

## Risk Notes

- `maplibre-gl` is pinned at exactly 6.17.0; check the worker loading (dev and build) on upgrade. Tiles come from a third-party server that sees the visitor's IP: keep OpenFreeMap named in the privacy policy.
- `swiper` is pinned at exactly 14.4.0 in `package.json`; keep it pinned to avoid sudden bundle regressions introduced by caret releases.
- Track `datocms` CLI updates, especially when schema generation APIs change.

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
