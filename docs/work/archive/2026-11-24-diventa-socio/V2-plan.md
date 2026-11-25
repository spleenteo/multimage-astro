---
work: 2026-11-24-diventa-socio
slice: V2
level: essential
---

# V2 plan — Sending the request and the confirmation

**Mandate**: [slices.md § V2](./slices.md#v2--sending-the-request-and-the-confirmation) · **Guidelines**: [docs/development-guidelines.md](../../../development-guidelines.md) · **Lessons**: [lessons.md](./lessons.md) · **Execution rules**: Flow `agents/executor.md` (Test policy, Commit rules, Server rule)

**Summary**
1. T1 moves the payment facts to an import-free `src/lib/payment.ts` and generalises the request code and the code-clash check in `order.ts`; T2 moves Turnstile out of `order.ts` and `/api/ordine` into `src/lib/turnstile.ts`. `/borsa` unchanged.
2. T3 moves the `.order-bank*` rules to `src/styles/form.css`; T4 adds D1 migration 0004 (`membership_requests`); T5 adds the `MEMBERSHIP_MAIL` binding and its getter.
3. T6 writes the shared response types and the server-side request helpers (parse, code, causale, CMS choices, row, email).
4. T7 builds `POST /api/socio`; T8 adds the confirmation markup to `/diventa-socio`; T9 sends the form and shows the confirmation or the email way out.
5. The conductor runs the dev checks, `/borsa`, the local Cloudflare run and the gate. No remote D1, no deploy, no push.

**Files**: src/lib/payment.ts, src/lib/order.ts, src/lib/turnstile.ts, src/pages/api/ordine/index.ts, src/styles/form.css, src/pages/borsa/_borsa.css, d1/migrations/0004_membership_requests.sql, wrangler.jsonc, src/lib/cloudflare-bindings.ts, src/lib/membership.ts, src/lib/membership-request.ts, src/pages/api/socio/_graphql.ts, src/pages/api/socio/index.ts, src/pages/diventa-socio/_graphql.ts, src/pages/diventa-socio/index.astro, src/pages/diventa-socio/_membership-page.client.ts

## The slice, decided here

- Same database, same D1 binding: `/api/socio` writes `membership_requests` through `getOrderDb()` (`ORDERS` is `multimage-orders`). Only the mail binding is new.
- The server reads the published `membership` once (`paymentNote`, `fees`, `collaborationAreas`), without id filters: an unknown fee id is an invalid `fee`, an unknown area id an invalid `areas`, so a draft-only tier is rejected (expected, editor-only).
- The causale is built on the server and returned: first non-empty line of `paymentNote` (fallback "Quota associativa Multimage") + code + first and last name, cut to 120 characters (bank remittance and PayPal `item_name` limits). The answer also carries the fee label and `amountCents`; the page never builds the causale or the amount from its own strings.
- `success_text` and the instruction lines of `payment_note` (line 2 on) are display text: the page renders them hidden, from its own query.
- Personal columns are nullable (as in `orders`), so an erasure request can be served by an UPDATE; there is still no retention rule.
- Turnstile test secrets (`/^\dx0+AA$/`) are lenient in dev **and** on `localhost`/`127.0.0.1` hosts: the always-pass test secret answers hostname `example.com`, so without this the local `wrangler dev` run cannot pass. A production host keeps the strict check.
- `d1/README.md` and the guidelines are V3 (docs step), not touched here.

## Tasks

### T1 — Payment facts and request codes · critical
**What**: new `src/lib/payment.ts`, no imports: `PAYMENT_ACCOUNT_HOLDER`, `PAYMENT_BANK`, `PAYMENT_IBAN`, `PAYMENT_BIC`, `PAYMENT_SWIFT_INTERMEDIARY`, `PAYMENT_PAYPAL` (values of today's `ORDER_*`), `formatIban(s)`, `paypalUrl(causale, cents)` (today's `_xclick` params). `order.ts` imports `./payment` (relative, so `tsx` loads it; header comment updated), keeps `ORDER_ACCOUNT_HOLDER`…`ORDER_PAYPAL` as re-exported constants and `formatIban`, and `orderPaypalUrl(code, cents)` becomes `paypalUrl(orderCausale(code), cents)`. Add `requestCode(prefix, at, random)` (`orderCode` wraps it with `'MM'`), and an optional `table = 'orders'` parameter on `isCodeClash(err, table)` and `saveWithCodeRetry(insert, first, next, table)`.
**Files**: src/lib/payment.ts, src/lib/order.ts
**Verified**: a throwaway `/tmp/v2-t1.ts`, run with `node --import tsx /tmp/v2-t1.ts` from the repo root, prints `true` for: `orderPaypalUrl('MM-261124-ABCD', 3500) === 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=info%40multimage.org&amount=35.00&currency_code=EUR&item_name=Ordine+libri+MM-261124-ABCD&no_shipping=1'`; `formatIban(ORDER_IBAN) === 'IT50 T050 1802 8000 0001 1361 524'`; `orderCode(new Date('2026-11-24T10:00:00Z'), new Uint8Array([0,1,2,3])) === 'MM-261124-2345'` and `requestCode('SO', …same) === 'SO-261124-2345'`; `isCodeClash({message:'UNIQUE constraint failed: membership_requests.code'}, 'membership_requests')` true, without the table false, `isCodeClash({cause:{message:'UNIQUE constraint failed: orders.code'}})` true. `npm run build` passes; `git diff --stat` touches only the two files.
**Done**: committed as a refactor.
**Interfaces**: produces `PAYMENT_*`, `formatIban`, `paypalUrl` (T8, T9), `requestCode`, `saveWithCodeRetry(…, table)` (T6, T7).
### T2 — Shared Turnstile check · critical · depends on: T1
**What**: new `src/lib/turnstile.ts`, server-only and free of `astro:env`: `DEV_TURNSTILE_SECRET`, `turnstileSecret(configured, isDev)`, `checkSiteverify` (moved from `order.ts`, removed there), `verifyTurnstile({ secret, token, request, action, isDev })` returning `{ ok: true } | { ok: false; status: 400 | 502; error: 'turnstile' | 'turnstile_unavailable'; reason?: 'success' | 'hostname' | 'action' }` (siteverify POST with `remoteip` from `cf-connecting-ip`, 10 s timeout). `/api/ordine` steps 1 and 5 call it, same answers and log lines. Commit 1 (refactor): leniency exactly as today (`isDev` and a test secret). Commit 2 (behaviour): also lenient when the secret is a test secret and the request hostname is `localhost` or `127.0.0.1`.
**Files**: src/lib/turnstile.ts, src/lib/order.ts, src/pages/api/ordine/index.ts
**Verified**: `grep -c checkSiteverify src/lib/order.ts` prints 0; `/tmp/v2-t2.ts` (run like T1) stubs `globalThis.fetch` and prints `true` for: fetch throwing → `{ok:false,status:502,error:'turnstile_unavailable'}`; `{success:true,hostname:'www.multimage.org',action:'ordine'}` with action `socio` → `reason:'action'`; test secret, `isDev:false`, request `http://localhost:8787/api/socio`, verdict hostname `example.com` → `{ok:true}` (after commit 2); same on `https://www.multimage.org/api/socio` → `reason:'hostname'`. `npm run build` passes after each commit.
**Done**: two commits, refactor first.
**Interfaces**: produces `turnstileSecret`, `verifyTurnstile` for T7.
### T3 — Shared bank box styles · critical
**What**: move from `src/pages/borsa/_borsa.css` the block from the comment `/* The payment details, shown only after sending…` to the end of the `@media (min-width: 640px)` rule before `.order-mailto-box`, unchanged, to the end of `src/styles/form.css` (already imported before `_borsa.css` by `/borsa` and `/designsystem`).
**Files**: src/styles/form.css, src/pages/borsa/_borsa.css
**Verified**: `grep -c 'order-bank' src/styles/form.css` equals `git show HEAD:src/pages/borsa/_borsa.css | grep -c 'order-bank'`, and `grep -c 'order-bank' src/pages/borsa/_borsa.css` prints 0; prettier check on both files; `npm run build` passes.
**Done**: committed as a refactor.
### T4 — D1 migration 0004
**What**: `d1/migrations/0004_membership_requests.sql`, header comment (site writes only; contract to document in `d1/README.md` in V3): `id INTEGER PRIMARY KEY AUTOINCREMENT`, `code TEXT NOT NULL UNIQUE`, `created_at TEXT NOT NULL`, nullable `email first_name last_name birth_date birth_place address1 address2 city region postcode country`, `fee_id TEXT NOT NULL`, `fee_label TEXT NOT NULL`, `fee_cents INTEGER NOT NULL`, `payment_method TEXT NOT NULL CHECK (payment_method IN ('bonifico','paypal'))`, `areas_json TEXT NOT NULL CHECK (json_valid(areas_json))`, `areas_other TEXT`, `consent_at TEXT NOT NULL`, `notify_status` and `notify_error` as in `orders`; index `membership_requests_created_at`.
**Files**: d1/migrations/0004_membership_requests.sql
**Verified**: `npx wrangler d1 migrations apply multimage-orders --local` applies `0004_membership_requests.sql`; `npx wrangler d1 execute multimage-orders --local --command "SELECT name FROM pragma_table_info('membership_requests')"` lists the 23 columns. Local only: never `--remote`.
**Done**: committed.
**Interfaces**: produces the column names for T6.
### T5 — Mail binding · critical
**What**: in `wrangler.jsonc` a second `send_email` entry `MEMBERSHIP_MAIL`, `destination_address` `info@multimage.org`, `allowed_sender_addresses` `["sito@ordini.multimage.org"]`, with a one-line comment; in `cloudflare-bindings.ts` `getMembershipMail(): OrderMail | null` like `getOrderMail`, header comment naming `/api/socio`.
**Files**: wrangler.jsonc, src/lib/cloudflare-bindings.ts
**Verified**: `npx wrangler d1 migrations list multimage-orders --local` exits 0 with no config warning; prettier check; `npx astro check` 0 errors.
**Done**: committed.
**Interfaces**: produces `getMembershipMail` for T7.
### T6 — Request helpers · depends on: T1, T4
**What**: in `membership.ts` (still import-free) `PaymentMethod`, `MembershipErrorCode` (`method_not_allowed bad_request too_large invalid turnstile turnstile_unavailable cms_unavailable save_failed not_configured`) and `MembershipResponse` = `{ ok: true; code; notified; fee: { label; amountCents }; payment; causale }` | `{ ok: false; error; fields? }`. New `src/lib/membership-request.ts` (relative imports of `./membership` and `./order` only): `MEMBERSHIP_BODY_MAX_BYTES = 8192`, `MEMBERSHIP_TABLE`, `MEMBERSHIP_COLUMNS` (T4 order, without `id`, `notify_error`), `parseMembershipRequest(body)` (trimmed strings, `areas` string array, `consent === true`, `validateMembershipFields`, token 1–2048 chars), `membershipCode(at, random)`, `membershipCausale(paymentNote, code, firstName, lastName)`, `resolveMembershipChoices(request, { fees, areas })`, `membershipRow(...)` (empty optional fields NULL, `areas_json` of `{id,label}` incl. `altro`), `membershipEmail(...)` → `{ subject: 'Richiesta socio <code> · <nome> <cognome>', text }` with every field (labels from `MEMBERSHIP_LABELS`, "non indicato" for empty optionals), fee via `membershipFeeLabel`, method label, areas, causale, consent time.
**Files**: src/lib/membership.ts, src/lib/membership-request.ts
**Verified**: `/tmp/v2-t6.ts` prints `true` for: a valid body parses; `consent:false` → `fields` includes `consent`; `membershipCode` of T1's date and bytes is `SO-261124-2345`; `membershipCausale('Quota associativa Multimage\nDopo…','SO-261124-2345','Ada','Neri') === 'Quota associativa Multimage SO-261124-2345 Ada Neri'`; a forged fee id → `fields:['fee']`, a forged area id → `['areas']`; `membershipRow(...).length === MEMBERSHIP_COLUMNS.length`; the email text holds all 16 values. `npm run build` passes.
**Done**: committed.
**Interfaces**: produces the types for T9 and the helpers for T7.
### T7 — `POST /api/socio` · critical · depends on: T2, T5, T6
**What**: `_graphql.ts`: `MEMBERSHIP_REQUEST_QUERY` (`membership { paymentNote fees {… on MembershipFeeBlockRecord { id label amount }} collaborationAreas {… on CollaborationAreaBlockRecord { id label }} }`) and its type. `index.ts`, shaped like `/api/ordine` with a header comment listing its answers: `ALL` 405 (`allow: POST`); 503 `not_configured` (no secret, or no `ORDERS` and no `MEMBERSHIP_MAIL` outside dev); size on header and bytes; JSON; parse; `verifyTurnstile` action `MEMBERSHIP_ACTION`; published read (`includeDrafts: false`; failure 502 `cms_unavailable`); choices (400 `invalid` with `fields`); code, `saveWithCodeRetry(…, MEMBERSHIP_TABLE)`, send from `ORDER_FROM_ADDRESS` to `MEMBERSHIP_EMAIL`, `replyTo` the applicant, notify UPDATE; dev without bindings prints the email to the console. `cache-control: private, no-store` on every answer; logs `[socio] <status> <code>` and `[socio] 200 ok areas=<n> saved=… notified=…`, never personal data.
**Files**: src/pages/api/socio/_graphql.ts, src/pages/api/socio/index.ts
**Verified**: `npm run build` passes; prettier check on both; every `console.` line in `index.ts` prints only constants, status, codes or counts (`grep -n console src/pages/api/socio/index.ts`).
**Done**: committed.
**Interfaces**: produces the `MembershipResponse` contract on `/api/socio` for T9.
### T8 — Confirmation markup · depends on: T1, T3
**What**: add `paymentNote successText` to `MEMBERSHIP_PAGE_QUERY` and its type. In `index.astro`, when `showForm`, after the form: `section[data-socio-done][hidden]` with `h2[data-socio-done-heading][tabindex=-1]` "Richiesta inviata, grazie", `successText` as one `<p>` per non-empty line, `p[data-socio-done-lede]`, `p[data-socio-done-fee]`, `div[data-socio-methods]` holding `div[data-socio-method="bonifico"]` (`.order-bank` box: IBAN `formatIban(PAYMENT_IBAN)`, `button[data-socio-copy-iban][hidden]` with `[data-socio-copy-label]`, holder, bank, BIC, SWIFT, causale `[data-socio-causale]`) and `div[data-socio-method="paypal"]` (`PAYMENT_PAYPAL`, `a.order-bank__paypal-btn[data-socio-paypal-link][hidden]` with `[data-socio-paypal-label]`, causale), the `paymentNote` lines from 2 on as `<p>`s, `p.sr-only[aria-live=polite][data-socio-announce]`. Header comment lists the new contract.
**Files**: src/pages/diventa-socio/_graphql.ts, src/pages/diventa-socio/index.astro
**Verified**: `npm run build` passes; prettier check on both.
**Done**: committed.
**Interfaces**: produces the confirmation markup contract for T9.
### T9 — Client script, second part · depends on: T6, T7, T8
**What**: `onSubmit` posts `{ ...readFields(), turnstileToken }` to `/api/socio` (one at a time, submit disabled, "Invio in corso…"). `invalid` → `setError` with `MEMBERSHIP_FIELD_MESSAGES` and the summary; `turnstile` → message and widget `reset()`; anything else or no answer → `showFormError` with the mailto to `MEMBERSHIP_EMAIL`. Success: form hidden, done shown and its heading focused; lede with the code (if `notified` is false: write to info@ with the code); fee line from `res.fee`; chosen method moved first in `[data-socio-methods]`; causale from `res.causale`; PayPal `href` = `paypalUrl(res.causale, res.fee.amountCents)`, label "Paga <formatCents> con PayPal"; copy-IBAN button shown when `navigator.clipboard` exists, announces in `[data-socio-announce]`. Remove the "non ancora attivo" note. No `innerHTML`.
**Files**: src/pages/diventa-socio/_membership-page.client.ts
**Verified**: `npm run build` passes; prettier check; `grep -c innerHTML src/pages/diventa-socio/_membership-page.client.ts` prints 0, `grep -c notActive` prints 0.
**Done**: committed.

## Order

- Side by side first (separate files): T1, T3, T4, T5. Then T2 and T6 after T1 (T2 also after T1 because both edit `order.ts`; T6 after T4). T8 after T1, T3. T7 after T2, T5, T6. T9 last.
- Slice Done, **conductor checks** (a server, and the env files the build and wrangler read themselves; no agent opens a `.env`):
  - `npm run dev` (own server, prod port left alone): a complete submit prints the `[socio] (dev)` email and shows the confirmation, method chosen first, PayPal label with the fee, IBAN copy; then `curl -s -X POST localhost:<port>/api/socio -H 'content-type: application/json'` with a valid body, `turnstileToken` `XXXX.DUMMY.TOKEN.XXXX` and `fee` `forgedfee0000000000000` → 400 `"fields":["fee"]`; with `consent:false` → `"fields":["consent"]`. `/borsa` with a book: one order prints the `[ordine] (dev)` email and shows its success screen.
  - Local Cloudflare: `npx wrangler d1 migrations apply multimage-orders --local`; `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build:cf`; `npx wrangler dev --port 8787 --var TURNSTILE_SECRET_KEY:1x0000000000000000000000000000000AA`; one submit on `http://localhost:8787/diventa-socio`; `npx wrangler d1 execute multimage-orders --local --command "SELECT code, fee_label, fee_cents, payment_method, notify_status FROM membership_requests ORDER BY id DESC LIMIT 1"` shows the row. Never `--remote`, no deploy, no push.
  - Gate: `npm run lint`, `npm run build`.

## Deviations from the mandate

- T3 moves the `.order-bank*` rules to `form.css`, not named in the mandate: the confirmation reuses `/borsa`'s bank box instead of copying 70 lines of CSS.
- T2 makes test-secret leniency also apply on localhost hosts outside dev (touches `/api/ordine` too): without it the mandated local `wrangler dev` submit fails the hostname check.
- Parsing, row, email and code live in a new `src/lib/membership-request.ts`, not `membership.ts`: validation stays `validateMembershipFields`, and `membership.ts` stays the import-free file the browser bundles.

## Review fixes (binding; they amend the tasks named)

- **T2 (M1)**: implement exactly `lenient = TEST_SECRET.test(secret) && (isDev || ['localhost', '127.0.0.1'].includes(new URL(request.url).hostname))`; the hostname comes only from `new URL(request.url).hostname`, exact match, never from `Host` / `X-Forwarded-Host` headers, never `startsWith`/`includes` on the string. Code comment: setting `security.allowedDomains` in Astro would let `X-Forwarded-Host` rewrite `request.url` and must re-examine this. Extra Verified case: non-test secret (`0x4AAAA…`), `isDev:false`, request `http://localhost:8787/api/socio`, verdict hostname `example.com` → `reason:'hostname'`.
- **T9 (M2)**: reset the Turnstile widget and clear the token on every non-ok answer and on network failure, as `/borsa` does (`_order-page.client.ts:426-427`), not only on `turnstile`.
- **T6 (M3)**: `areasOther` becomes `''` (stored NULL, not emailed) whenever `AREA_OTHER` is not in `areas`. Extra Verified case: body with `areasOther:'x'.repeat(500)` and no `altro` → row `areas_other` null.
- **T7 (L1)**: the one dev-only email print (inside `import.meta.env.DEV`, no binding) is exempt from the logging check; every other `console.` line prints only status, codes or counts.
- **T6 (L2)**: the causale never loses the request code: cap the `payment_note` base at ~60 characters, keep the code whole, fill the rest with the names, total ≤120. Extra Verified case: 150-character first line → the code is present.
- **T1, T2, T5, T6 (L3)**: lessons apply to every task: `npx prettier --write` on the touched files before the commit, and `npm run build` before committing (T5 included, not only `astro check`).
- **T3 (L4)**: move `.order-iban` and the `[data-order-done-causale]` nowrap rule to `form.css` with the `.order-bank*` rules.
- **T6 (L5)**: euro → cents through `toCents` (`Math.round`) from `order.ts` (or `payment.ts` after T1), never `amount * 100`.
