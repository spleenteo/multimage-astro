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

`POST /api/ordine` (`src/pages/api/ordine/index.ts`) saves one book order to the D1 database `multimage-orders` and sends the shop one notification email. It accepts a JSON body with the buyer's fields, the Turnstile token and `lines` of `{id, qty}`; titles and prices are never trusted from the client, they are refetched from the published CDA and rebuilt (`rebuildOrder` in `src/lib/order.ts`), so a tampered bag cannot reach D1 or the email. Any method but POST answers 405 (`allow: POST`). It does not use `src/pages/api/utils.ts` (CORS `*` and error echo do not fit a form endpoint). The bindings (`ORDERS` for D1, `ORDER_MAIL` for `send_email`) are read only through `src/lib/cloudflare-bindings.ts`. The visitor gets no email: the success screen offers a PDF of the request, built in the browser. The discount is computed on the server from the buyer record the client names by id (DatoCMS `buyer` collection, read with the books from the published CDA: its percentage of the rebuilt books subtotal, never shipping); an unknown buyer id is an invalid `buyer` field, and a discount or total sent by the client is ignored.

Defences, in the order the endpoint answers (the first failing check wins):

1. **Config, fail closed.** Without `TURNSTILE_SECRET_KEY`, or with neither binding present, it answers `503 not_configured` outside dev. In dev, with no binding the email text goes to the console and the endpoint answers 200 with an order code that is not saved (nothing is stored or sent; the email text is printed to the console); an unset Turnstile secret falls back to Cloudflare's always-pass test secret (siteverify then checks `success` only).
2. **Size.** Body capped at 16384 bytes (`ORDER_BODY_MAX_BYTES`), checked on `content-length` and again on the read body (`400 too_large`).
3. **Shape.** Invalid JSON, at most 30 lines (`ORDER_MAX_LINES`), quantity 1-20 per line, field validation (`400` with codes `bad_request`, `empty_bag`, `too_many_lines`, `bad_lines`, `invalid`).
4. **Turnstile.** Server-side siteverify checks `success`, the hostname of the request and the action `ordine`; a failure logs which check failed (`reason=success|hostname|action`), never the token (`400 turnstile`). Siteverify unreachable: `502 turnstile_unavailable`.
5. **Catalogue refetch.** Ids are pre-filtered by format (22 base64url characters, or digits) because the CDA rejects a whole `id: { in }` query on a bad ItemId; a forged id ends as a dropped line or a safe `502 catalogue_unavailable`. If every line drops: `409 nothing_orderable`.
6. **Save, then notify.** The order is inserted into D1 (the record) with the readable code `MM-YYMMDD-XXXX`; on a UNIQUE clash on `orders.code` the code is regenerated and the insert retried once (`saveWithCodeRetry`). Then one email goes to `ordini@multimage.org` through the `send_email` binding and `notify_status` is updated (`sent`, `failed` or `skipped`). Saved but not notified is still `200` with `notified: false`; notified but not saved is `200` too (the email carries the whole order); neither is `502 save_failed`.

Every answer carries `cache-control: private, no-store`. Error bodies carry codes only. Logs are one line per answer, `[ordine] <status> <code>` (or `[ordine] 200 ok lines=<n> dropped=<n> ...`), plus `code_clash`, `save_error` and `notify_update_error`: counts only, never a name, email, address, notes or token. Orders whose notice did not go out are found with the `notify_status <> 'sent'` query in `d1/README.md`, until the staff app exists (TODO **BORSA-staff-app**). Personal data stays in D1 only for the time needed to ship, then it is anonymised (retention rule in `d1/README.md`; TODO **BORSA-privacy** for the policy side).

Outer limits, beyond the code: a Cloudflare WAF rate limiting rule on `/api/ordine` and `/api/socio` (one shared counter; set it before `TURNSTILE_SECRET_KEY`, see `docs/guidelines/operations.md` § Environment & Secrets). There is no third-party mail tier to hit: Cloudflare is the only service involved (Workers Free limits apply). The WAF rule covers only the zone hostnames: the `workers.dev` and preview URLs (`workers_dev`, `preview_urls` in `wrangler.jsonc`) bypass it. No order goes through them (the siteverify hostname check refuses it), but each request costs a siteverify call and Worker time; TODO `CF-vercel-cleanup` turns them off after go-live. Setup steps for the user: `docs/work/archive/2026-11-24-borsa/setup-borsa.md`.

### Membership endpoint (/api/socio)

`POST /api/socio` (`src/pages/api/socio/index.ts`, helpers in `src/lib/membership-request.ts`) follows the order endpoint step by step (405, fail-closed 503, size, shape, Turnstile, one published CDA read, save then notify, `cache-control: private, no-store`, error bodies with codes only). What differs:

- **Size.** Body capped at 8192 bytes (`MEMBERSHIP_BODY_MAX_BYTES`), on `content-length` and again on the read body.
- **Consent on the server.** The privacy consent is checked in `parseMembershipRequest`, not only in the browser: a missing consent is `400` with `fields: ["consent"]`.
- **Turnstile action `socio`.** The check is the shared one in `src/lib/turnstile.ts` (success, hostname, action). The always-pass test secret is accepted in dev and also on the hostnames `localhost` and `127.0.0.1`, for both `/api/socio` and `/api/ordine`.
- **No amount from the client.** The fee comes from the published `membership` singleton, re-read on every request and resolved by id (`resolveMembershipChoices`); the client sends the tier id only, a draft-only or unknown tier is rejected, and the amount and the bank causale in the answer are the server's. The sign-up carries no payment method and no areas: both belong to the confirmation page.
- **Save, then notify.** The row goes into the D1 table `membership_requests` with the code `SO-YYMMDD-XXXX` (one retry on a clash on `membership_requests.code`). One plain-text email goes to `info@multimage.org` through the `MEMBERSHIP_MAIL` `send_email` binding, with reply-to the applicant, and `notify_status` is updated. The visitor gets no email.
- **New personal data.** The form collects date and place of birth and the full address, which `/borsa` does not. There is **no retention rule** for these rows (owner, 2026-11-24): they stay until someone erases them with the UPDATE by `code` in `d1/README.md`. TODO **BORSA-privacy** covers the policy side (birth data, address, iubenda).
- **Sign-up answer.** The 200 carries `collabToken`, a random 128-bit secret (base64url, `newCollabToken`), returned once and kept in the browser's memory only. D1 stores only its SHA-256 hex (`collab_token_hash`, `hashCollabToken`); the token never goes into an email, the causale, a URL, a log or a print.
- **Collaboration step (same route).** A body with a string `code` is the optional second step `{ code, token, areas, areasOther }` of the confirmation page (`parseCollaborationUpdate`). It has no Turnstile; what authorises it is the per-request secret token, not the WAF. The WAF rate limit still counts it, because it posts to the same `/api/socio` path. Order of checks: the body is parsed first (a malformed code or token is `400 bad_request`, an empty selection or "Altro" without text is `400 invalid`); then the request hostname must be `www.multimage.org` or `multimage.org` (localhost only in dev); a read-only D1 match on `code` and the token's hash with `collaboration_at IS NULL`, `created_at` within `COLLABORATION_WINDOW_MS` (one hour) and `email IS NOT NULL` (so an erased row never matches); only then the CMS read and the validation of the area ids (an unknown area id is `400 invalid` with `fields: ["areas"]`); then one atomic UPDATE with the same WHERE (`COLLABORATION_MATCH_SQL`, `COLLABORATION_UPDATE_SQL`) that sets `areas_json` (`[{id,label}]`), `areas_other` and `collaboration_at`, so a request is accepted once. Every failed match (wrong code, wrong token, second send, late, erased, wrong host) gets the same `404 not_found`, so nothing reveals whether a code exists. Then a second plain-text email goes to `info@` (subject "Collaborazione socio <code> · <name>", reply-to the applicant); a send failure is still `200` with `notified: false`.
- **Logs.** `[socio] <status> <code>` (or `[socio] 200 ok saved=<bool> notified=<bool>`, `[socio] 200 collabora areas=<n> notified=<bool>`, `[socio] 404 not_found`), plus `code_clash`, `save_error`, `notify_update_error` and `[socio] collaboration_notify_error no_binding|<E_CODE>`: counts only, never a name, email, birth data, address or token.

The WAF rate limiting rule covers both endpoints (`/api/ordine` and `/api/socio`, one shared counter per IP); see `docs/guidelines/operations.md`.

---

## Bag event endpoint (/api/evento)

`POST /api/evento` (`src/pages/api/evento/index.ts`) writes one aggregate counter to Workers Analytics Engine. It accepts only `add` and `start` (with a book slug matching `^[a-z0-9][a-z0-9-]{0,119}$` and a place among `card`, `book`, `hero`) and `emptied`; `order` is written only by `/api/ordine`, so the browser cannot inflate orders. Bodies over 512 bytes and foreign `Origin` headers are refused (400, 403); any other method gets 405. It answers 204 with no body, reads and sets nothing on the visitor and stores no identifier or IP, so it needs no consent. Spam can still inflate the add counters; the figures are indicative, not accounting.

## Environment Variables Audit (2026-05-16)

### Matrix

| Variable | Astro context | Astro access | Optional? | Ships to client? | Used in | Vercel must have |
|---|---|---|---|---|---|---|
| `SERVER` | server | public | yes | no | `src/lib/draftPreview.ts`, `src/lib/prerender.ts` (build-time selector "static"/"preview") | yes — set per env |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | server | secret | no | no | `src/lib/datocms/executeQuery.ts` | yes |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | server | secret | no | no | `executeQuery.ts`, `DraftModeQueryListener` | yes (preview env) |
| `DATOCMS_CMA_TOKEN` | server | secret | yes | no | `src/pages/api/seo-analysis/index.ts` (runtime), `src/lib/datocms/siteSearch.ts` (via `/api/revalidate`), `src/worker.ts` (daily Cron Trigger) | SEO analysis and Site Search reindex |
| `SECRET_API_TOKEN` | server | secret | no | no | `post-deploy`, `preview`, `preview-links`, `seo-analysis`, `draft-mode/enable` | yes |
| `SIGNED_COOKIE_JWT_SECRET` | server | secret | no | no | `src/lib/draftMode.ts` | yes |
| `SITE_SEARCH_BUILD_TRIGGER_ID` | server | secret | yes | no | `src/lib/datocms/siteSearch.ts` (Vercel, reindex after a publish), `src/worker.ts` (Cloudflare, daily reindex), with `DATOCMS_CMA_TOKEN` | Site Search reindex (id `37696`; Secret type on Vercel, unreadable) |
| `BYPASS_TOKEN` | build / server | secret | yes | no | `astro.config.mjs` (ISR `bypassToken`), `src/lib/draftMode.ts`, `/api/revalidate` | Vercel only (not on the Worker) |
| `DRAFT_MODE_COOKIE_NAME` | server | secret | yes | no | `src/lib/draftMode.ts` | optional |
| `CACHE_INVALIDATION_WEBHOOK_SECRET` | server | secret | yes | no | `src/pages/api/invalidate-cache/index.ts` (Bearer) | no (Cloudflare Worker secret only) |
| `TURNSTILE_SECRET_KEY` | server | secret | yes | no | `src/pages/api/ordine/index.ts`, `src/pages/api/socio/index.ts` | Worker secret only (unset = `/api/ordine` and `/api/socio` answer 503) |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | client | public | no | **YES** | `src/pages/cerca/index.astro` (via `import.meta.env`), search bundle | yes |
| `PUBLIC_SITE_URL` | client | public | no | **YES** | BaseLayout canonical, sitemap, `post-deploy` | yes |
| `PUBLIC_TURNSTILE_SITE_KEY` | client | public | yes | **YES** | `src/pages/borsa/index.astro`, `src/pages/diventa-socio/index.astro` (widget) | build env file (`.env.cloudflare`), inlined at build; unset = `/borsa` shows the email box and `/diventa-socio` swaps the form for a "Scrivi a info@multimage.org" mailto button |
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
