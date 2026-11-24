# Slice packet — borsa V4

READ THIS WHOLE FILE.

No frame (product work, problem clear; no criterion block).

## Project constraints
No push, no deploy. No account, DNS, Email Routing or D1 creation (the conductor does those later with the user's ok; until then the D1 database_id in wrangler.jsonc is a placeholder on the branch only). Never touch credentials or .env* files. Italian copy, English code comments and docs. Commit with explicit paths, imperative messages, with the trailer lines: 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' and 'Claude-Session: https://claude.ai/code/session_01RKnBua6f6ZuWphGxaTmX5B'. Shell: rm is intercepted, use /bin/rm. Dev servers only on free ports, never 4321/4329/5198 (the user's); stop them by PID after; restore schema.ts if regenerated. Never edit schema.ts; Workers Free plan only. Global user rule: for Cloudflare use the cf CLI unless the project has a Wrangler config — this project has wrangler.jsonc, so use wrangler.

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


## Slice section (slices.md)
## V4 — Orders in D1, notification through Cloudflare, no Resend

Revision of 2026-11-24 (shaping § Revision). V1–V3 stay closed; this slice changes what V2 built.

**In**

- D1: migration folder (`migrations/` is DatoCMS's: use `d1/migrations/` or `drizzle`-free plain SQL under a distinct path), `0001_orders.sql` creating `orders` (id, code unique, created_at, name, email, phone, address, city, province, shipping_kind, buyer_kind, notes, lines_json, copies, subtotal_cents, shipping_cents, total_cents, consent_at, notify_status, notify_error). The table is the contract with the future staff app: document it next to the migration.
- `wrangler.jsonc`: `d1_databases` binding `ORDERS` (database id placeholder the user fills after `wrangler d1 create`, or created by the conductor only with the user's ok) and `send_email` binding `ORDER_MAIL` with `destination_address: ordini@multimage.org`. Bindings live on the Backend entrypoint path that runs the endpoint.
- Bindings wrapper `src/lib/cloudflare-bindings.ts` over `cloudflare:workers`, with a Vite alias to a stub when `DEPLOY_TARGET` is not `cloudflare`; returns `null` bindings outside Cloudflare.
- Endpoint: after validation, Turnstile and the CDA rebuild, insert into D1, then `ORDER_MAIL.send({ from, to, replyTo: visitor, subject: 'Ordine <code> …', text })`; update `notify_status`. Outcomes as in shaping B5.3′. Response carries `code`. Remove Resend, the visitor copy, `RESEND_API_KEY` (env schema) and `copySent`. Missing Turnstile secret outside dev still fails closed.
- Sender constant `ORDER_FROM` on the Email Routing subdomain (placeholder `sito@ordini.multimage.org`, confirmed by the user).

**Out**: the staff app; the PDF (V5); creating the D1 database or touching DNS/Email Routing without the user's ok.

**Done**

1. Local Cloudflare run (`DEPLOY_TARGET=cloudflare` dev or `wrangler dev --local` with a local D1): a valid order inserts one row with server prices and a code; the email send is attempted (local `send_email` is simulated/logged) and `notify_status` reflects it.
2. With no `ORDERS` and no `ORDER_MAIL` (Vercel build, plain dev): the endpoint answers the error and the page offers the mailto.
3. No Resend left: `grep -ri resend src astro.config.mjs` → nothing.
4. Gate green (Vercel build included).

**Impact corrections (2026-11-24)**

- D1 `database_id`: a placeholder only on the branch; the conductor creates the database (`wrangler d1 create multimage-orders --jurisdiction eu`, with the user's ok) and commits the real id **before the merge**. Never leave `database_id` empty (wrangler auto-provisions outside the EU). Merge blocked while a placeholder remains.
- D1 migrations in `d1/migrations/` with `"migrations_dir": "d1/migrations"` on the binding (DatoCMS owns `migrations/`); D1 commands address the database by `database_name`.
- Bindings are top-level in `wrangler.jsonc` (Worker-wide; the adapter's handler imports `env` from `cloudflare:workers`); no change to `src/worker.ts` (`/api` is already off the cache key).
- Wrapper: the Vite alias for `cloudflare:workers` applies only when not building for Cloudflare, pointing at an absolute stub path; the module declaration sits in a `.d.ts`; only the endpoint imports the wrapper (`order.ts` stays import-free, it is bundled into the browser).
- Sender: one subdomain, `ordini.multimage.org`; `ORDER_FROM = 'Multimage <sito@ordini.multimage.org>'`.
- `OrderResponse` loses `copySent` and gains `code` and the notify outcome; V4 updates the client's success branch (`src/pages/borsa/_order-page.client.ts` ~323-338) and the error-code switch (~409) so `astro check` stays green; new codes (e.g. `save_failed`) join `OrderErrorCode`. V5 rewrites the wording. The `orderEmail` 'visitor' branch is removed.
- The order code goes into the causale only on the success screen, the PDF and the email (none exists before submit).
- Done 1 runs `DEPLOY_TARGET=cloudflare npx astro dev` (DEV on, bindings from `wrangler.jsonc`), with local migrations applied using the same `--persist-to` state dev reads; if Cloudflare dev doesn't start, STOP and ask.
- Done 2 becomes: Vercel production build with no bindings → 503 `not_configured` and the mailto; plain `npm run dev` → console output and 200 with a dev code (so the success screen and V5's PDF can be exercised).
- Done, added: 5. `cloudflare:workers` is absent from the Vercel output and from client chunks. 6. No placeholder `database_id` at merge time (checked at the work's close).


## Spike (read it): docs/work/2026-11-24-borsa/spike-cloudflare-only.md

## What V1–V3 built
**V1 — done on 2026-11-24**

V1 shipped the bag end to end on the client: `src/lib/order.ts` (no imports) holds ordini@, the 1–20 cap, the storage key, the two order rules and the money helpers; `bag.client.ts` keeps `{"v":1,"items":[]}` in localStorage with cross-tab sync; `BagDrawer` (native modal dialog in BaseLayout, static markup) renders it and drives the header buttons; `BagAdd` swaps a mailto fallback for "Metti in borsa" on the book page and the home hero. Reviews caught what the plan didn't foresee: the header row overflowed at 390px once the bag button joined it (Menu text now sr-only below sm); the drawer clipped its footer on short screens and announced nothing to screen readers (panel scrolls under 36rem, a persistent live region); the browser walk measured the stepper at 44×42 because the group's border ate 2px (fixed); the BagAdd second-init guard used an empty-string flag that never stopped anything. T2 had to edit T1's order.ts to export the euro formatter the plan said it exported (ruling). Executors sign commits with their own model name in the trailer (ruling). Packets were passed by reference to a file, not inline (ruling). The browser walk ran in headless Chromium from a cached Playwright; Done 1–7 pass, Done 9 has no live example in the catalogue. Pending, accepted: Done 9 (no unpriced print book in the catalogue to try; covered by T1's check and the T7/T8 reviews).
--
**V2 — done on 2026-11-24**

V2 shipped /borsa and POST /api/ordine as planned: order facts and pure functions in order.ts, three optional env fields, an endpoint that fails closed (503 without keys outside dev), verifies Turnstile, refetches titles and prices from the CDA and mails through Resend or, in dev, the console; the page drives empty, filled, mailto, error and success states from one script. Execution showed that the CDA rejects the whole `id: { in }` query on an id that isn't a valid ItemId, so the endpoint pre-filters ids (22-char or numeric) and a forged id ends in a safe 502; the dev-only email print was moved under import.meta.env.DEV itself, not left behind the config check; the final review added the email way out when the Turnstile widget errors, focus for the not_configured and missing-check paths, and a reason on refused siteverify logs. Rulings: packet by reference as in V1; T2's report-only medium closed after the runner ran the grep; ITEM_ID widened to numeric ids. The production-mode check runs with wrangler dev --local on dist/server/wrangler.json with an older compatibility date, since astro preview exits. Pending: a screen-reader pass. For the closing report: set the public site key last (after RESEND_API_KEY and TURNSTILE_SECRET_KEY), the WAF rate-limit rule before the Resend key, and the env matrix in security.md and operations.md. Pending, accepted: Done 6 screen-reader pass (VoiceOver) — attributes and focus verified; listed for the user.
--
**V3 — done on 2026-11-24**

V3 hardened and handed over the borsa without touching its behaviour beyond one line. The runner's walk ran axe-core (WCAG 2.2 A/AA) in headless Chromium on the drawer, /borsa empty and filled and the success state at 390 and 1280: 0 violations and no overflow in all eight. The Impeccable detector gave 206 hits, one real (the next-steps list at 0.9375rem, off DESIGN.md's ramp, moved to text-sm, a5608a5; ruling: text-sm over text-base); the rest were false positives: the detector's DOM engine reads Tailwind v4 spacing as 0 (cramped-padding), blends text-white into contrast (white measures ≥5.05:1), flags the template img and Book3D's paper edges, and a first dump even caught axe's own source as a <marquee>. Detector 4.8.2 can match only overused-font by value, so T3 ignored the others with file-scoped wildcards, which also don't apply to rendered-DOM scans; their reasons say colour and spacing changes in Header and Button need a manual axe check. Docs: security.md gained the order endpoint section and env rows, operations.md the keys and WAF rule, project-structure and PRODUCT updated; inventories, current-state and TODO (five follow-ups, a Features section) and DESIGN.md (Bag drawer, Order page, Book Page action) followed T5; the setup note leads from a keyless deploy to go-live and rollback. Reviews caught: the rollback check (deleting the Resend key leaves the form up; the email box shows only after a submit, the full rollback removes the site key and redeploys), Italian text where the plan said English, a TODO sort slip, the error-summary focus claim (focus goes to the first invalid field), and that the WAF rule doesn't cover workers.dev and preview URLs (no mail goes out: siteverify hostname check; CF-vercel-cleanup turns them off). Rulings: packet by reference; text-sm for the off-ramp size. Open for the user: whether .env or .env.local hold PUBLIC_TURNSTILE_SITE_KEY (they would defeat the keyless deploy and the rollback; not read, by rule); a5608a5 carries a Sonnet 5.5 trailer. Pending, for the user: WAVE on the deployed pages and the VoiceOver pass. Pending, for the user after deploy: WAVE on the live drawer, /borsa and success state; VoiceOver pass (TODO BORSA-voiceover).
Key files: src/lib/order.ts (no imports; shared with the browser), src/pages/api/ordine/index.ts, src/pages/borsa/index.astro, src/pages/borsa/_order-page.client.ts, astro.config.mjs (env schema incl. RESEND_API_KEY, TURNSTILE_SECRET_KEY, PUBLIC_TURNSTILE_SITE_KEY), wrangler.jsonc, src/worker.ts.

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

## Test level
essential; the endpoint is in a sensitive area. Pure logic in src/lib/order.ts exercised by throwaway npx tsx scripts under $TMPDIR; the endpoint checked with curl against DEPLOY_TARGET=cloudflare npx astro dev (local D1 + simulated send_email) and plain npm run dev. Gate = npm run lint + npm run build (Vercel adapter) ; also run npm run build:cf to check the Cloudflare build compiles (no deploy).

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

### docs/guidelines/project-structure.md
---
description: Fastro is based on and extends the [Astro project structure](https://docs.astro.build/en/core-concepts/project-structure/)
---

# Project Structure & Module Organization

## Directory overview
- **`src/pages/**`**
  - Route directories (`index`, `libri`, `collane`, `autori`, `distributori`, `magazine`, `info`, `staff`, `cerca`, `sitemap.xml`) each ship an `index.astro`, optional `_style.module.css`, and a sibling `_graphql.ts` describing their queries. API/utility routes live as `.ts` files (e.g., `sitemap.xml.ts`).
- **`src/components/**`**
  - Feature components bundle `index.astro`, optional `index.ts` (for fragment exports), and CSS modules. Subdirectories cover Dato blocks (`components/blocks`), Structured Text renderers (`components/datocms/structuredText`), and design primitives (`components/ui`).
- **`src/layouts`**
  - Hosts `BaseLayout.astro`, which fetches `_site`, header/footer menus, analytics scripts, and wraps every page.
- **`src/lib`**
  - Framework-agnostic helpers such as Dato tooling (`datocms/*`), view-model mappers (`books.ts`, `authors.ts`, `suppliers.ts`), formatting utilities (`text.ts`, `colors.ts`, `currency.ts`), and SEO fallbacks (`seo.ts`).
- **`src/styles`**
  - `global.css`: the Tailwind import, `@theme static` (tokens and font stacks), `@utility container`, the Tailwind 3 compat rules and the base and components layers; CSS modules `@reference` it to stay lean.
- **`scripts`**
  - `build-search-client.mjs` emits the browser bundles in `public/generated`; `sync-datocms.mjs` loads `.env` and regenerates `schema.ts`.
- **`public/generated`**
  - Build artefacts from `npm run prebuild`. Missing files here break `/cerca` and `BookCarouselSection` because `<script src="/generated/...">` references them directly.
- **`docs/**`**
  - Canonical documentation (assets, search, inventories, etc.). Keep these files aligned with the code or log drift in `docs/TODO.md`.

## Runtime configuration & tooling
- `astro.config.mjs` now reads the `SERVER` env var. `SERVER=static` (default) emits `output: 'static'` so every public route prerenders to `dist/`; `SERVER=preview` flips the build to `output: 'server'` so the preview Vercel project can render Draft Mode requests on demand. The config only wires the Vercel adapter when SSR is enabled and still validates every CDA/CMA/search env so builds fail fast when a token is missing.
- The same config exposes `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` and `PUBLIC_SITE_URL` to the client. `/cerca` throws during rendering if the search token is absent and the sitemap falls back to `http://localhost:4321` whenever `PUBLIC_SITE_URL` is unset (see docs/TODO.md SEO task **SEO1**).
- `tsconfig.json` defines the `~/*` path aliases used throughout the repo and enables `allowImportingTsExtensions` because `_graphql.ts` files are imported with their extension. Keep helpers inside `src/lib/**` so cross-layer imports stay obvious.
- `~/lib/prerender` centralises the shared `export { prerender }` flag so Astro pages are prerendered only when `SERVER=static` but remain SSR when `SERVER=preview`.
- `npm run sync-datocms` (called by `npm run dev`/`start`) loads `.env` and regenerates `schema.ts`.
- `npm run prebuild`/`npm run bundle-search-client` builds the browser bundles under `public/generated`. Run it before `astro dev`/`astro build` locally and wire it into CI (tracked by docs/TODO.md Project Structure task **PS1**).

## Co-location & layering rules
- **Queries next to consumers.** Every page/component that needs data keeps an adjacent `_graphql.ts` exporting both the document and TypeScript helpers. Shared fragments (`BookCardFragment`, `BANNER_SECTION_FRAGMENT`, etc.) are re-exported from `index.ts` to keep import sites tidy.
- **CSS modules per component.** Styles live beside the component they affect. Global typography/colors stay in `src/styles/global.css` and Tailwind theme tokens.
- **Map data in `src/lib`.** Only `src/lib` should know how to massage GraphQL payloads (`mapBooksToCards`, `mapAuthorsToCards`, `groupSuppliersByRegion`, `withFallbackSeo`, `toRichTextHtml`). Pages should stick to view-model orchestration.
- **Generated JS under `public/generated`.** Do not scatter ad-hoc bundles. `BookCarouselSection` and `/cerca` expect their modules there, so always run `npm run prebuild` locally and in CI.

## Route map & data flow
- **`/`**
  - Data: `src/pages/index/_graphql.ts` (`home`, modular `banners`).
  - Primary components: `BaseLayout`, `FeaturedBookHighlight`, `BannerSection`, `BookCarouselSection`, `blocks/PillsBlock`, Structured Text blocks.
  - Notes: Hero copy (`home.claim`) flows through `toRichTextHtml`; sanitize per docs/guidelines/assets.md#html-fragments--sanitization.
- **`/libri`** (and **`/libri/pagina/[page]`**, now a 301 to `/libri`)
  - Data: `src/pages/libri/index/_graphql.ts` (`booksIndexPage`, `allCollections`, every published book incl. archive, read in pages of 500).
  - Primary components: `BooksCatalogue` (faceted catalogue, `BookCard` catalogue variant).
  - Notes: single faceted page since 2026-11-22 (decisions-log `2026-11-22-faceted-catalogue`); filters run in the browser and live in the URL. `buildBooksCataloguePaths` returns `['/libri']`.
- **`/libri/[slug]`**
  - Data: `src/pages/libri/[slug]/_graphql.ts` plus related `authors`, `alternate formats`, and `collection` queries.
  - Primary components: `BookCarouselSection`, `AuthorsSection`, `AlternateFormatsList`, `DetailList`.
  - Notes: Heavy view-model mapping—reuse helpers from `src/lib/books.ts` and `src/lib/authors.ts`.
- **`/collane` & `/collane/[slug]`**
  - Data: Listing (`src/pages/collane/index/_graphql.ts`) and detail (`src/pages/collane/[slug]/_graphql.ts`).
  - Primary components: `SectionIntro`, `CollectionCard`, `CollectionDetailHero`, `BookCard`.
  - Notes: Detail route queries `BookCollectionBooks` to populate related carousels.
- **`/autori` & `/autori/[slug]`**
  - Data: `src/pages/autori/index/_graphql.ts`, `src/pages/autori/[slug]/_graphql.ts`.
  - Primary components: `SectionIntro`, `BookCard`, `AuthorsSection`.
  - Notes: Detail route issues separate calls for the author record and related books.
- **`/distributori`**
  - Data: `src/pages/distributori/_graphql.ts`.
  - Primary components: `SectionIntro`, `SupplierCard`.
  - Notes: `SupplierCard` renders HTML descriptions; sanitize per Security task **S2**.
- **`/magazine` & `/magazine/[slug]`**
  - Data: `src/pages/magazine/index/_graphql.ts`, `src/pages/magazine/[slug]/_graphql.ts`.
  - Primary components: `MagazinePostCard`, Structured Text blocks, `BookCarouselSection`.
  - Notes: `LinkToRecord.astro` still targets `/blog/...`; fix via Project Structure task **PS2**.
- **`/info` & `/info/[slug]`**
  - Data: Static placeholder (`src/pages/info/index.astro`) plus `src/pages/info/[slug]/_graphql.ts` for CMS-driven pages.
  - Primary components: `InfoSection`, Structured Text renderer.
  - Notes: `BaseLayout` maps `allPages` into header/footer menus used here.
- **`/staff` & `/staff/archivio-catalogo`**
  - Data: `src/pages/staff/index/_graphql.ts`, `src/pages/staff/archivio-catalogo/_graphql.ts`.
  - Primary components: bespoke markup + CSV export script.
  - Notes: Entire toolset is publicly prerendered; see Security task **S1**.
- **`/cerca`**
  - Data: `src/pages/cerca/index.astro` (no GraphQL) plus the Site Search bundle.
  - Primary components: Search form + `public/generated/search-page.client.js`.
  - Notes: Reads config from `data-*` attributes and talks to Site Search directly; see docs/guidelines/search.md for operational notes.
- **`/sitemap.xml`**
  - Data: `src/pages/sitemap.xml/_graphql.ts`.
  - Primary components: none (pure XML response).
  - Notes: Falls back to `http://localhost:4321` when `PUBLIC_SITE_URL` is missing; enforce env per SEO task **SEO1**. Includes the paginated catalogue pages (`/libri/pagina/2..N`) via `buildBooksCataloguePaths`.

> `/llms-full.txt` was removed 2026-06-20 (closed Security task **S4** + reduced Fast Origin Transfer — see decisions-log `2026-06-20-fot-reduction`).

## API & preview routes
(Deployed only when `SERVER=preview`; static builds omit all runtime endpoints.)
- **`/api/preview`** (GET/POST) requires `SECRET_API_TOKEN`, validates relative redirects, sets the signed draft-mode cookie via `enableDraftMode`, and returns 401 otherwise.
- **`/api/draft-mode/enable`** mirrors the preview secret guard before redirecting to a relative URL; **`/api/draft-mode/disable`** only clears the cookie but still rejects absolute redirects.
- **`/api/preview-links`** powers the Dato “Web Previews” plugin: it maps records to website routes via `recordToWebsiteRoute`, generates draft/published URLs (enabling or disabling draft mode on the way), and responds with permissive CORS headers.
- **`/api/seo-analysis`** is called by the “SEO/Readability Analysis” plugin. It validates the secret, fetches the record via `@datocms/cma-client`, hits the frontend with `draftModeHeaders()` to capture unpublished content, and returns metadata + rendered HTML via `jsdom`.
- **`/api/ordine`** (POST only) sends a book order by email through Resend after a Turnstile check and a CDA refetch of titles and prices; it is not part of the preview plumbing and fails closed without its keys. Defences and keys: `docs/guidelines/security.md` § Order endpoint.
- **`/api/post-deploy`** installs/configures both plugins right after the initial deploy. Because it accepts an arbitrary CMA token and writes preview URLs containing our `SECRET_API_TOKEN`, retire it (or require an extra server-side secret) once staging/production are configured (docs/TODO.md Security task **S5**).

## Known gaps & violations
- Structured Text links for blog posts still point to `/blog/...` although the published route is `/magazine/...`. Fix `LinkToRecord.astro` and add regression coverage (docs/TODO.md Project Structure task **PS2**).
- GraphQL queries rely on `first: 500` almost everywhere (`/libri`, `/autori`, `/sitemap`, staff exports), which hammers the CDA and bloats build artifacts. Tackle pagination + cache tags under docs/TODO.md CMS task **CD2**.
- `/staff/*` route gating is resolved (**S1**, middleware). `/llms-full.txt` was removed (**S4** closed 2026-06-20).
- `public/generated` assets are not fingerprinted or validated; missing `npm run prebuild` results in broken `<script>` imports. Add integrity checks per docs/TODO.md Project Structure task **PS1**.
- Cache tags/revalidation hooks are still absent even though the project relies on query listeners. Capture incremental cache invalidation in docs/TODO.md CMS task **CD3** and update data loaders accordingly.
- The one-off `/api/post-deploy` endpoint remains deployed and can leak the preview secret if an attacker points it at their Dato project. Remove or protect it per docs/TODO.md Security task **S5**.
***Resolved 2025-11-16*** — Builds default to `SERVER=static`, which prerenders every route to `dist/`. Deployments that need live drafts set `SERVER=preview`, which runs every page as SSR while keeping the codebase identical and reusing the same repo for both Vercel projects.

## Preset rules
astro: output 'server'; env via astro:env; only PUBLIC_ to client; no ClientRouter; Workers Free CPU.
datocms: tokens server-side; nullable fields; environment via executeQuery; includeDrafts:false for the endpoint; no schema change.
