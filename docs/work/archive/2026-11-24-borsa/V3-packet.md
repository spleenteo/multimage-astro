# Slice packet — borsa V3

READ THIS WHOLE FILE.

No frame (product work, problem clear; no criterion block).

## Project constraints
No push, no deploy. Never touch credentials or .env* files (the key names go in docs and in the setup note, never values). Italian copy, English docs and comments. Commit with explicit paths, imperative messages, with the trailer lines: 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' and 'Claude-Session: https://claude.ai/code/session_01RKnBua6f6ZuWphGxaTmX5B'. Shell: rm is intercepted, use /bin/rm. Dev servers only on free ports, never 4321/4329/5198 (the user's); stop them after; restore schema.ts if regenerated. Never edit schema.ts; Workers Free plan only. CLAUDE.md 'After a feature is confirmed complete': update docs/guidelines/ if conventions changed, docs/list-*.md, docs/current-state.md, docs/TODO.md (format in CLAUDE.md §3).

## Slice section (slices.md)
## V3 — Hardening, docs and handover

**In**

- Impeccable detector and an a11y pass on drawer, `/borsa`, success state; WAVE-level checks on a local render (0 errors, baseline of `project-a11y-baseline`).
- `/info/ordinare` stays as is (CMS content); the book page's "Come funziona l'ordine" link stays.
- Docs: `docs/guidelines/` (security: the order endpoint and its abuse defences; operations: the secrets and the WAF rule to set), `docs/list-components.md`, `docs/list-helpers.md`, `docs/current-state.md`, `docs/TODO.md` (follow-ups: SPF/DKIM/DMARC for multimage.org, Resend setup, WAF rate limit rule), DESIGN.md (Bag drawer and order page components, and the book page's primary action now "Metti in borsa").
- A setup note for the user: the exact steps for Resend (account, sending subdomain DNS on Cloudflare), `wrangler secret put` for the two secrets, the Turnstile widget, the WAF rule.

**Out**: deploying; setting secrets.

**Done**

1. Detector and a11y checks with no errors on the three surfaces at 390px and 1280px.
2. Docs updated; `npm run docs:inventory` passes.
3. Setup note present and complete.
4. Gate green.

**Impact corrections (2026-11-24)**

- `PUBLIC_TURNSTILE_SITE_KEY` is inlined at build: the setup note says to add it to `.env.cloudflare` before `deploy:cf`; `wrangler secret put` only for `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY`. Update the env matrix in `docs/guidelines/security.md` and the Worker secrets list in `docs/guidelines/operations.md`.
- `docs/current-state.md:38` ("non c'è carrello") and `docs/list-helpers.md:83` (`buildOrderMailto`) become false: update them.
- TODO follow-up: keep the IBAN and PayPal details of `/info/ordinare` (CMS) in step with `src/lib/order.ts`.

## Earlier slices (narratives)
**V1 — done on 2026-11-24**

V1 shipped the bag end to end on the client: `src/lib/order.ts` (no imports) holds ordini@, the 1–20 cap, the storage key, the two order rules and the money helpers; `bag.client.ts` keeps `{"v":1,"items":[]}` in localStorage with cross-tab sync; `BagDrawer` (native modal dialog in BaseLayout, static markup) renders it and drives the header buttons; `BagAdd` swaps a mailto fallback for "Metti in borsa" on the book page and the home hero. Reviews caught what the plan didn't foresee: the header row overflowed at 390px once the bag button joined it (Menu text now sr-only below sm); the drawer clipped its footer on short screens and announced nothing to screen readers (panel scrolls under 36rem, a persistent live region); the browser walk measured the stepper at 44×42 because the group's border ate 2px (fixed); the BagAdd second-init guard used an empty-string flag that never stopped anything. T2 had to edit T1's order.ts to export the euro formatter the plan said it exported (ruling). Executors sign commits with their own model name in the trailer (ruling). Packets were passed by reference to a file, not inline (ruling). The browser walk ran in headless Chromium from a cached Playwright; Done 1–7 pass, Done 9 has no live example in the catalogue. Pending, accepted: Done 9 (no unpriced print book in the catalogue to try; covered by T1's check and the T7/T8 reviews).
--
**V2 — done on 2026-11-24**

V2 shipped /borsa and POST /api/ordine as planned: order facts and pure functions in order.ts, three optional env fields, an endpoint that fails closed (503 without keys outside dev), verifies Turnstile, refetches titles and prices from the CDA and mails through Resend or, in dev, the console; the page drives empty, filled, mailto, error and success states from one script. Execution showed that the CDA rejects the whole `id: { in }` query on an id that isn't a valid ItemId, so the endpoint pre-filters ids (22-char or numeric) and a forged id ends in a safe 502; the dev-only email print was moved under import.meta.env.DEV itself, not left behind the config check; the final review added the email way out when the Turnstile widget errors, focus for the not_configured and missing-check paths, and a reason on refused siteverify logs. Rulings: packet by reference as in V1; T2's report-only medium closed after the runner ran the grep; ITEM_ID widened to numeric ids. The production-mode check runs with wrangler dev --local on dist/server/wrangler.json with an older compatibility date, since astro preview exits. Pending: a screen-reader pass. For the closing report: set the public site key last (after RESEND_API_KEY and TURNSTILE_SECRET_KEY), the WAF rate-limit rule before the Resend key, and the env matrix in security.md and operations.md. Pending, accepted: Done 6 screen-reader pass (VoiceOver) — attributes and focus verified; listed for the user.

## Deviations recorded for V2 (relevant to docs)
**Deviations found while planning V2**

- The CDA query selects `authors { fullName alias }` (the author model has no `name`), display name through `getAuthorDisplayName`.
- With Cloudflare's test secret in dev, siteverify checks `success` only (test keys answer dummy hostname and action); real keys get all three checks.
- The recap column is not sticky: with steps and bank box it is taller than a laptop screen.
- The bank box and the email also carry the intermediary SWIFT.
- A failed visitor copy adds a "Stampa questa pagina" button.
- The visitor copy omits the notes (anti-abuse, plan review); the WAF rule is a prerequisite before setting `RESEND_API_KEY`.
- Docs (current-state, list-*, env tables in security.md and operations.md) are left to V3; `.env.example` is not touched (no `.env*` edits): the key names go in the closing report.

**V2 — done on 2026-11-24**

V2 shipped /borsa and POST /api/ordine as planned: order facts and pure functions in order.ts, three optional env fields, an endpoint that fails closed (503 without keys outside dev), verifies Turnstile, refetches titles and prices from the CDA and mails through Resend or, in dev, the console; the page drives empty, filled, mailto, error and success states from one script. Execution showed that the CDA rejects the whole `id: { in }` query on an id that isn't a valid ItemId, so the endpoint pre-filters ids (22-char or numeric) and a forged id ends in a safe 502; the dev-only email print was moved under import.meta.env.DEV itself, not left behind the config check; the final review added the email way out when the Turnstile widget errors, focus for the not_configured and missing-check paths, and a reason on refused siteverify logs. Rulings: packet by reference as in V1; T2's report-only medium closed after the runner ran the grep; ITEM_ID widened to numeric ids. The production-mode check runs with wrangler dev --local on dist/server/wrangler.json with an older compatibility date, since astro preview exits. Pending: a screen-reader pass. For the closing report: set the public site key last (after RESEND_API_KEY and TURNSTILE_SECRET_KEY), the WAF rate-limit rule before the Resend key, and the env matrix in security.md and operations.md. Pending, accepted: Done 6 screen-reader pass (VoiceOver) — attributes and focus verified; listed for the user.


## Closing notes from V2's runner
- Set the public Turnstile site key last, after the two secret keys. Add the WAF rate-limit rule before the Resend key. Add the three keys to the env lists in security.md and operations.md.
- Production-mode check of the Cloudflare build: npx wrangler dev --local -c dist/server/wrangler.json (with --compatibility-date if needed).
- Done 6 of V2 (VoiceOver pass on the form) is pending for the user: list it in the setup note's checklist.

## Context
Spike: docs/work/2026-11-24-borsa/spike-email.md (Resend free tier, sending subdomain DNS on Cloudflare, Google Workspace MX untouched, SPF/DKIM/DMARC missing on multimage.org). Shaping: docs/work/2026-11-24-borsa/shaping.md. Mock: docs/design/borsa/borsa-mock.html (artifact https://claude.ai/artifact/HCDpvQfMtVnqefTtB1NNeq). Impeccable detector: /Users/spleenteo/.claude/plugins/cache/impeccable/impeccable/4.8.2/skills/impeccable/scripts/impeccable detect --json <files>. .impeccable/config.json (untracked) holds the detector ignore overused-font=inter (Inter is DESIGN.md's body font): commit it in this slice. DESIGN.md at repo root: add Bag drawer and Order page (/borsa) components and change the Book Page primary action text.

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

## Test level
essential; this slice changes docs and possibly small a11y fixes. Gate = npm run lint + npm run build; npm run docs:inventory must pass.

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

### docs/guidelines/code-health.md
---
description: Track maintainability issues, duplication, and refactors needed across the codebase.
---

# Code Health Checklist

## Key Issues

- Preview plumbing now swaps CDA tokens correctly, but there are no regression tests for the `/api/preview` flow or `DraftModeQueryListener`. Add unit/integration coverage so future refactors do not break drafts silently.
- Rich-text rendering mixes Structured Text serializers with manual `set:html` calls (home page hero, supplier cards, author pages). Consolidate on Structured Text renderers or sanitize HTML to keep escaping rules consistent.

## Duplication & Dead Code

- GraphQL queries repeatedly declare `first: 500` across pages (`src/pages/libri/[slug]/_graphql.ts`, `src/pages/autori/index/_graphql.ts`, `src/pages/sitemap.xml/_graphql.ts`). Extract pagination helpers or re-usable fragments so record limits live in one place.

## Maintainability Gaps

- Draft-mode tooling now exists; the remaining gap is observability. Add smoke tests (or at least a Playwright script) that calls `/api/preview` and asserts the toggler swaps state so regressions surface before deploys.
- Staff tooling still lives under `src/pages/staff/` alongside public content. Once auth is added, consider moving exports into a protected admin bundle or API endpoint to avoid accidental deployment.
