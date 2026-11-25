---
work: 2026-11-24-diventa-socio
slice: V3
level: essential
---

# V3 plan — Live on multimage.org

**Mandate**: [slices.md § V3](./slices.md#v3--live-on-multimageorg) · **Guidelines**: [docs/development-guidelines.md](../../../development-guidelines.md) · **Lessons**: [lessons.md](./lessons.md) · **Execution rules**: Flow `agents/executor.md` (Test policy, Commit rules, Server rule)

**Summary**
1. T1 points the Header "Diventa socio" button and the three "Soci: 30% di sconto" links to `/diventa-socio`; T2 adds the 301 from `/info/adesioni`, as a page like `/libri/ebooks`.
2. T3 updates the Turnstile comments in `astro.config.mjs` and the D1 comment in `wrangler.jsonc`.
3. T4 syncs the inventories and route docs (V1 and V2 carry-overs included); T5 the security and operations guidelines, `d1/README.md` and `docs/TODO.md`.
4. The conductor runs a dev check and the gate, then the Conductor sequence: WAF rule, remote D1 0004, deploy, production checks, one real request (row checked, then deleted).
5. T6 writes the production facts into the docs. No `git push`.

**Files**: src/components/Header.astro, src/pages/distributori/index.astro, src/pages/autori/[slug]/index.astro, src/pages/libri/[slug]/index.astro, src/pages/info/adesioni/index.astro, astro.config.mjs, wrangler.jsonc, docs/list-helpers.md, docs/list-components.md, docs/list-models.md, docs/current-state.md, docs/guidelines/project-structure.md, docs/guidelines/caching.md, PRODUCT.md, docs/guidelines/security.md, docs/guidelines/operations.md, d1/README.md, docs/TODO.md

## The slice, decided here

- The 301 follows the repo's pattern (`src/pages/libri/ebooks/index.astro`: `return Astro.redirect(..., 301)`), not `astro.config` redirects or the middleware. A static `src/pages/info/adesioni/` route wins over `src/pages/info/[slug]/`, and the middleware keeps a 301 private, so nothing is cached.
- The CMS `adesioni` record stays (mandate Out). The menus and the sitemap keep listing `/info/adesioni`, which now redirects, until editors unpublish the record. This is a note for the owner, not code.
- The WAF rule keeps its one counter per IP and colo, now shared by `/api/ordine` and `/api/socio`: an order and a membership request from one IP within 10 s count together. That is acceptable at 2 requests per 10 s.
- Docs are written before the deploy to describe the target state; T6 then writes in what was observed (the expression as applied, the dates, the done entry).
- The production test request goes through a browser, because it needs a real Turnstile token. Use obvious test data and a mailbox the submitter controls.

## Tasks

### T1 — Membership links
**What**: `href: '/diventa-socio'` for the "Diventa socio" entry of `TOP_LINKS` in `Header.astro`. `href="/diventa-socio"` replaces `/info/adesioni` in `distributori/index.astro` (line ~102), `autori/[slug]/index.astro` (~259) and `libri/[slug]/index.astro` (~557). The link texts stay as they are.
**Files**: src/components/Header.astro, src/pages/distributori/index.astro, src/pages/autori/[slug]/index.astro, src/pages/libri/[slug]/index.astro
**Verified**: `grep -rn "info/adesioni" src/components src/pages/distributori src/pages/autori src/pages/libri` prints nothing; `grep -c 'href="/diventa-socio"'` prints 1 on each of the three pages, and `grep -c "'/diventa-socio'" src/components/Header.astro` prints 1; `npx prettier --write` on the four files before the commit; `npm run build` passes.
**Done**: committed.

### T2 — 301 from /info/adesioni · depends on: T1
**What**: new `src/pages/info/adesioni/index.astro`, containing only frontmatter: a one-line comment (the membership page moved to `/diventa-socio` on 2026-11-25; this keeps old links and the CMS menu entry working) and `return Astro.redirect('/diventa-socio', 301);`.
**Files**: src/pages/info/adesioni/index.astro
**Verified**: `grep -c "Astro.redirect('/diventa-socio', 301)" src/pages/info/adesioni/index.astro` prints 1; prettier check; `npm run build` passes (the run itself is the conductor's dev check).
**Done**: committed.

### T3 — Config comments · critical · depends on: T2
**What**: comments only. `astro.config.mjs`: the `TURNSTILE_SECRET_KEY` comment says it is verified on `/api/ordine` and `/api/socio`; the `PUBLIC_TURNSTILE_SITE_KEY` comment names the widget on `/borsa` and `/diventa-socio`. `wrangler.jsonc`: the D1 comment names both tables, `orders` (shared with the staff app, contract in `d1/README.md`) and `membership_requests` (written only by the site); drop the stale `PLACEHOLDER` line, since the real id is in place.
**Files**: astro.config.mjs, wrangler.jsonc
**Verified**: `git diff -U0 -- astro.config.mjs wrangler.jsonc | grep -E '^[+-][^+-]' | grep -vE '^[+-]\s*//'` prints nothing; `npx wrangler d1 migrations list multimage-orders --local` exits 0 with no config warning; prettier check; `npm run build` passes.
**Done**: committed.

### T4 — Inventories and route docs · depends on: T1, T2
**What**: `list-helpers.md`: entries for `src/lib/payment.ts`, `src/lib/turnstile.ts`, `src/lib/membership.ts`, `src/lib/membership-request.ts` and `src/lib/form.client.ts` (purpose, used in, from the V2 ledger Interfaces). The `order.ts` entry drops `checkSiteverify` and adds `requestCode` and the `table` parameter of `isCodeClash` / `saveWithCodeRetry`. `list-components.md`: `EmptyBlock` (`src/components/datocms/structuredText/blocks/EmptyBlock.astro`). `list-models.md`: `MembershipRecord` (singleton `membership`: `slug`, `seo`, `title`, `subtitle`, `content`, `fees`, `collaborationAreas`, `paymentNote`, `successText`; read by `src/pages/diventa-socio/_graphql.ts` and `src/pages/api/socio/_graphql.ts`), plus `membership_fee_block` (`label`, `amount`) and `collaboration_area_block` (`label`); read the field names from both `_graphql.ts` files. `current-state.md`: a `/diventa-socio` routing bullet (form, Turnstile, confirmation, header button, 301 from `/info/adesioni`); `/api/socio` in the API list, under Security and under Operations (`MEMBERSHIP_MAIL`). `project-structure.md`: `/diventa-socio` in the route map, `src/styles/form.css`, `/api/socio` under API & preview routes. `caching.md`: a `membership` row in the model table (singleton, `/diventa-socio`, not mapped in the Vercel URL map, purged by tags on Cloudflare), a `/diventa-socio` row in the route table, block models 19 → 21 (`membership_fee_block`, `collaboration_area_block`). `PRODUCT.md`: `/info/adesioni` → `/diventa-socio`.
**Files**: docs/list-helpers.md, docs/list-components.md, docs/list-models.md, docs/current-state.md, docs/guidelines/project-structure.md, docs/guidelines/caching.md, PRODUCT.md
**Verified**: `npm run docs:inventory` exits 0; `grep -n checkSiteverify docs/list-helpers.md` matches only inside the `turnstile.ts` entry; `grep -c "/api/socio" docs/current-state.md docs/guidelines/project-structure.md` prints at least 1 for each; `grep -c "21 of them" docs/guidelines/caching.md` prints 1; `grep -c "info/adesioni" PRODUCT.md` prints 0; `npx prettier --check PRODUCT.md`.
**Done**: committed as docs.

### T5 — Security, operations, D1 and TODO
**What**: `security.md`: a `### Membership endpoint (/api/socio)` under § Order endpoint, covering what differs: an 8192-byte cap; consent checked on the server; Turnstile action `socio`; fee and areas re-read from the published `membership` by id, so the client never sends an amount; table `membership_requests` with code `SO-YYMMDD-XXXX`; `MEMBERSHIP_MAIL` to info@ with reply-to the applicant; new personal data (date and place of birth, full address) and no retention rule (owner, 2026-11-24); logs `[socio] …`, counts only. It also notes that the test-secret leniency on `localhost`/`127.0.0.1` applies to both endpoints, and that the WAF rule covers both. In the matrix, `TURNSTILE_SECRET_KEY` adds `/api/socio` and `PUBLIC_TURNSTILE_SITE_KEY` adds `/diventa-socio`. `operations.md`: the order keys bullet gains `MEMBERSHIP_MAIL` (`send_email`, info@); the WAF bullet carries the expression `(http.request.uri.path in {"/api/ordine" "/api/socio"})` and the shared counter; Monitoring gains the `[socio]` lines and the membership unsent query. `d1/README.md`: a `## Membership requests` section: site writes only (INSERT, then UPDATE of `notify_status`/`notify_error` by `code`, one retry on a clash on `membership_requests.code`), the columns read from `d1/migrations/0004_membership_requests.sql`, the erasure UPDATE that sets every personal column to NULL by `code`, no retention rule, and the `notify_status <> 'sent'` query on `membership_requests`, forwarded to info@ by hand. `TODO.md`: **BORSA-privacy** adds the membership form's birth data and address, and iubenda; **BORSA-info-sync** adds the CMS `membership.payment_note` and points at `src/lib/payment.ts`; **BORSA-stream-log** names `/api/socio` too.
**Files**: docs/guidelines/security.md, docs/guidelines/operations.md, d1/README.md, docs/TODO.md
**Verified**: `grep -c "membership_requests" d1/README.md` ≥ 3; `grep -c "/api/socio" docs/guidelines/security.md docs/guidelines/operations.md` ≥ 2 each; `grep -c "MEMBERSHIP_MAIL" docs/guidelines/operations.md` ≥ 1; `grep -n "payment_note" docs/TODO.md` matches the BORSA-info-sync line.
**Done**: committed as docs.

### T6 — Production facts · depends on: T4, T5, Conductor steps 1–5
**What**: using the conductor's notes, write the applied expression into `operations.md` (the `or` form if `in` was refused) with the date. `d1/README.md` gets "0004 applied remotely on <date>". `current-state.md` gets `/diventa-socio` live since <date>. `TODO.md` gets a completed entry `[<date>] - [Features] **Diventa socio (work diventa-socio V1–V3)**: …`, listing the owner follow-ups still open (fee tiers, "Provincia" label, placeholder subtitle, empty `seo`, Italian texts).
**Files**: docs/guidelines/operations.md, d1/README.md, docs/current-state.md, docs/TODO.md
**Verified**: `grep -cF '<expression read back in step 1>' docs/guidelines/operations.md` prints 1; `grep -c "Diventa socio (work diventa-socio" docs/TODO.md` prints 1.
**Done**: committed as docs.

## Order

- T1 → T2 → T3, one at a time (each runs `npm run build` in the same checkout). T5 runs beside them (docs only). T4 runs after T2.
- Conductor dev check (before the gate): pick a free port (`lsof -nP -iTCP:4333 -sTCP:LISTEN` prints nothing), run `npx astro dev --ignore-lock --port 4333`, then `curl -sI localhost:4333/info/adesioni` (expect 301, `location: /diventa-socio`), `curl -s localhost:4333/ | grep -c 'href="/diventa-socio"'` (at least 1) and `curl -s -o /dev/null -w '%{http_code}' localhost:4333/info/ordinare` (expect 200). Stop the server. Gate: `npm run lint`, `npm run build`.
- Then the Conductor sequence, then T6, then the close.

## Conductor sequence

All on production, in this order; stop at the first check that fails. Never `git push`; never read or print `.env.cloudflare`.

1. **WAF rule.**
   - Read the ruleset: `export CLOUDFLARE_ACCOUNT_ID=59fd5121a90b86d19e5a982e6fc41696; cf rulesets account-rulesets phases get http_ratelimit -z multimage.org > /tmp/v3-rl-before.json`, then `jq '(.result // .) | {id, rules: [.rules[] | {id, description, expression, action, enabled, ratelimit}]}' /tmp/v3-rl-before.json`. Expect exactly one rule, "Limit orders calls", with `(http.request.uri.path eq "/api/ordine")`, `block`, 2 requests per 10 s, a 10 s timeout and `ip.src` + `cf.colo.id`.
   - Build the body: `jq --arg e '(http.request.uri.path in {"/api/ordine" "/api/socio"})' '(.result // .).rules[0] | del(.id, .version, .last_updated) | .expression = $e' /tmp/v3-rl-before.json > /tmp/v3-rl-body.json`.
   - Validate, then apply: `cf rulesets account-rulesets rules update <rule id> --ruleset-id <ruleset id> -z multimage.org --validate-only --body "$(cat /tmp/v3-rl-body.json)"`, then the same command without `--validate-only`. If validation refuses `in`, rebuild the body with `(http.request.uri.path eq "/api/ordine") or (http.request.uri.path eq "/api/socio")` and validate again.
   - Check that nothing else changed: read the ruleset again into `/tmp/v3-rl-after.json`; `diff <(jq -S '(.result // .).rules[0] | del(.version, .last_updated, .expression)' /tmp/v3-rl-before.json) <(jq -S '(.result // .).rules[0] | del(.version, .last_updated, .expression)' /tmp/v3-rl-after.json)` prints nothing, and the new expression reads back. Note it down for T6.
   - Check the rule: `for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.multimage.org/api/socio -H 'content-type: application/json' --data '{}'; done` gives 404 (route not deployed yet), then a 429 by the third or fourth request.
2. **Remote D1.** `npx dotenv -e .env.cloudflare -- npx wrangler d1 migrations list multimage-orders --remote` lists only `0004_membership_requests.sql` as pending. Apply it with `... migrations apply multimage-orders --remote`. Check with `... d1 execute multimage-orders --remote --command "SELECT count(*) AS n FROM pragma_table_info('membership_requests')"`: expect `n` = 23. Run `SELECT count(*) FROM orders` before and after: the two counts are equal.
3. **Deploy.** `npx dotenv -e .env.cloudflare -- npm run deploy:cf` ends with a Version ID; note it. The new version starts with an empty cache.
4. **Production checks.** Wait at least 20 s after step 1's 429. Each `curl -s -o /dev/null -w '%{http_code}'` on `https://www.multimage.org/diventa-socio` answers 200. `curl -s https://www.multimage.org/diventa-socio | grep -o 'data-sitekey="0x4'` finds a match (production key built in, form shown). `curl -sI https://www.multimage.org/info/adesioni | grep -iE '^(HTTP|location)'` shows 301 and `/diventa-socio`. `curl -s https://www.multimage.org/ | grep -c 'href="/diventa-socio"'` prints at least 1. The step 1 POST loop now gives 400, 400, then 429. Wait 20 s; one bare `{}` POST to `/api/ordine` answers 400. `/borsa` and `/info/ordinare` answer 200.
5. **One real request.** In a browser at https://www.multimage.org/diventa-socio, the conductor or the owner fills the form with first name "Prova", last name "Test", an email they read and consent, then sends it. The confirmation shows a code `SO-…`. The owner confirms that the email reached info@. `npx dotenv -e .env.cloudflare -- npx wrangler d1 execute multimage-orders --remote --command "SELECT code, created_at, fee_label, fee_cents, payment_method, notify_status FROM membership_requests ORDER BY id DESC LIMIT 1"` shows that code with `notify_status` = `sent`. Then, with the owner's yes (given for this slice), `... --command "DELETE FROM membership_requests WHERE code='<code>'"`, and `SELECT count(*) FROM membership_requests WHERE code='<code>'` prints 0. The owner deletes the test email by hand.
6. **Docs facts.** Dispatch T6 with the expression, the dates, the Version ID and the test code.

## Deviations from the mandate

- T4 also updates `docs/guidelines/caching.md` (the `membership` model, the `/diventa-socio` route, 21 block models): this is a V1 docs carry-over that the V3 list does not name.
- T4 retargets the `/info/adesioni` link in `PRODUCT.md`, not named in the mandate, so the product brief does not point at a redirect.
- T3 drops the stale `PLACEHOLDER` comment in `wrangler.jsonc`, next to the D1 comment it rewrites.

## Review fixes (binding; they amend the tasks and steps named)

- **Step 1 (M1)**: no `--validate-only` call (not in the API schema for this PATCH). Send one PATCH; a failed PATCH leaves the rule as it was. Switch to the `or` form only if the error names the `in` operator or the expression; record the error text for T6.
- **T2, T3, T4 (`PRODUCT.md`), T5 (`d1/README.md`), T6 (`d1/README.md`) (M2)**: `npx prettier --write <touched files>` before the commit (files under `docs/` are exempt: `.prettierignore`).
- **Steps 1 and 4 (L3)**: prefix every `cf` command with `CLOUDFLARE_ACCOUNT_ID=59fd5121a90b86d19e5a982e6fc41696`.
- **Step 1 (L4)**: after the PATCH, `jq '(.result // .).rules | length'` on the after file prints 1.
- **T6 (L5)**: replace the expression in the existing operations.md WAF bullet written by T5 and add the date there; Verified: the applied expression appears exactly once and the unused form 0 times.
- **T4 (L6)**: caching.md model total 36 → 38 (or re-read with `schema:inspect`).
- **T6 (L7)**: the TODO done entry lists the owner follow-up "unpublish or unlink the `adesioni` page record (menus, sitemap still point at the redirect)".
- **Step 2 (L8)**: the first `SELECT count(*) FROM orders` runs before `migrations apply`; if the counts differ, compare `max(id)` and `created_at` before calling it a failure.
