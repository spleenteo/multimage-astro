---
work: 2026-11-24-diventa-socio
slice: V4
level: essential
---

# V4 plan — Trust, a shorter form, a confirmation that leads to books

**Mandate**: [slices.md § V4](./slices.md#v4--from-the-critique-trust-a-shorter-form-a-confirmation-that-leads-to-books) · **Guidelines**: [docs/development-guidelines.md](../../development-guidelines.md) · **Lessons**: [lessons.md](./lessons.md) · **Execution rules**: Flow `agents/executor.md` (Test policy, Commit rules, Server rule)

**Summary**
1. T1 edits the published `membership` record through the CMA (title, subtitle, two fee labels, `success_text`; ids unchanged) and publishes it.
2. T2 adds D1 migration 0005 (`payment_method` nullable, new `collaboration_at`); T3 adds the collaboration-update helpers; T4 teaches `POST /api/socio` the body `{ code, areas, areasOther }`, bound to a code under one hour old and accepted once.
3. T5 removes payment and areas from the sign-up end to end; T6 reworks the form (band, hints, polish); T7 the confirmation (steps, amount, toggle, print, catalogue link, collaboration step); T8 the header CTA.
4. T9 syncs DESIGN.md and the docs; the conductor runs the gate and the Conductor sequence; T10 writes the production facts. No `git push`.

**Files**: d1/migrations/0005_membership_collaboration.sql, src/lib/membership.ts, src/lib/membership-request.ts, src/lib/cloudflare-bindings.ts, src/pages/api/socio/index.ts, src/pages/diventa-socio/index.astro, src/pages/diventa-socio/_membership-page.client.ts, src/pages/diventa-socio/_socio.css, src/components/Header.astro, DESIGN.md, docs/guidelines/security.md, docs/guidelines/operations.md, d1/README.md, docs/list-helpers.md, docs/current-state.md, docs/TODO.md

## The slice, decided here

- **Endpoint**: reuse `POST /api/socio`. A JSON body with a string `code` key is a collaboration update `{ code, areas, areasOther }`; anything else is a sign-up. The WAF rule already covers the path, so the WAF stays as it is. The update has no Turnstile: the code is the proof.
- **Abuse limits**: one atomic `UPDATE membership_requests SET areas_json=?1, areas_other=?2, collaboration_at=?3 WHERE code=?4 AND collaboration_at IS NULL AND created_at >= ?5 AND email IS NOT NULL RETURNING email, first_name, last_name` (`?5` = now − 1 h, ISO). An unknown, expired, already-sent or erased code gets the same `404 not_found`, so the answer says nothing about which. Codes are 4 characters from a 32-letter alphabet (about 1M a day), and the WAF allows 2 requests per 10 s. At least one area is required, and ids are checked against the published CMS, as in V2.
- **D1 0005**: SQLite cannot relax `NOT NULL`, so 0005 rebuilds `membership_requests` (create, copy, drop, rename, re-index) with `payment_method` nullable (CHECK still allows only the two values) and a new `collaboration_at TEXT`, the one-shot guard. The toggle stays client-only (mandate), so `payment_method` is written NULL. `areas_json` stays NOT NULL and is `'[]'` until the second step. The production table holds no rows: V3's test row was deleted. Apply before the deploy, because the old code also fits the new table.
- **Second email**: to info@ through `MEMBERSHIP_MAIL`, reply-to the applicant, subject `Collaborazione socio <code> · <Nome Cognome>`, with the email, the areas and "Altro". A failed send still answers `200 { ok: true, notified: false }`, because the row is the record. `notify_status` stays the first email's.
- **No covers**: `membership` has no book selection, and the mandate allows covers only then. **Quota year**: rendered from `new Date().getFullYear()`, so the hint never reads 2026 in 2027. A page cached across New Year keeps the old year until the next purge: accepted.
- **Tests**: level `essential`, no runner. The sensitive code (T3–T5) is checked with `npx tsx -e` runs and local D1 commands, with no test files.
- **Italian texts** (paired forms, feminine first; nothing invented about proof for the reduced fee or response times):
  - CMS: `title` "Diventa socia o socio"; `subtitle` `<p>Con la quota di 20 € l'anno ricevi due libri in omaggio e il 30% di sconto su tutti i nostri libri.</p>`; fees "Studentessa o studente under 25" (`LY2eNn_KSG20yyYZwhD_PA`), "Senza lavoro" (`DuCMDkmySmCrbey2VIbAPg`), "Ordinaria" unchanged; `success_text` "Benvenuta, benvenuto in Multimage!" / "Grazie per la tua adesione. L'iscrizione sarà completa quando arriverà la quota associativa. Pace, forza e allegria!".
  - Meta fallback (plain subtitle under 50 characters): "Diventa socia o socio dell'Associazione Multimage: con la quota annuale ricevi due libri in omaggio e il 30% di sconto su tutti i nostri libri." Header CTA, fallback h1, mailto subject: "Diventa socia o socio".
  - Band: "2 libri" / "in omaggio con la quota"; "−30%" / "su tutti i nostri libri"; "Sostieni" / "un'editrice non profit che pubblica libri sulla nonviolenza e i diritti umani". Hints: "I tuoi dati": "Data e luogo di nascita ci servono per iscriverti nel libro soci."; "Indirizzo": "Ci serve per spedirti i due libri in omaggio."; "Quota": "La quota vale per il <anno>." Birth place placeholder and error example: "Bologna" (city keeps "Firenze").
  - Lede: "Il codice della tua richiesta è <code>." If not notified: "Il codice della tua richiesta è <code>, ma l'avviso alla segreteria non è partito: scrivi a info@multimage.org indicando il codice."
  - "Cosa succede adesso": 1 "Paghi la quota con bonifico o PayPal: trovi qui sotto i dati e la causale già pronta." 2 "Mandi la ricevuta a info@multimage.org, con il codice della richiesta." (a mailto with the subject "Ricevuta quota <code>") 3 "Ricevuta la quota, ti scriviamo al più presto." Toggle: "Come preferisci pagare?" (Bonifico bancario, checked / PayPal). Row "Importo". "Stampa questa pagina". Closing link: "Sfoglia il catalogo: da socia o socio hai il 30%" → `/libri`.
  - Collaboration: legend "Vuoi anche darci una mano?"; hint "È facoltativo: scegli come ti piacerebbe collaborare e ti scriviamo al più presto."; button "Invia le tue preferenze"; empty "Scegli almeno un modo per collaborare, oppure Altro."; sent "Grazie, abbiamo aggiunto le tue preferenze alla richiesta <code>."; 404 "Non possiamo più aggiungere le preferenze a questa richiesta: scrivile a info@multimage.org indicando il codice <code>."; other "Invio non riuscito. Riprova tra poco, oppure scrivi a info@multimage.org indicando il codice <code>."

## Tasks
### T1 — CMS labels and texts · critical
**What**: run `npx datocms cma:call` (OAuth) on env `home-featured-book`. Read record `D-sTlquHR7GiqaEOpMA80w` (nested). Make one update: `title`, `subtitle` and `success_text` as decided, and the `fees` blocks each sent with their existing id, only `label` changed. Then publish the record. Copy the old and new values into the ledger.
**Files**: none (DatoCMS record only)
**Verified**: a fresh nested `items find` shows the new values; fee ids `WrjeoCkCQoq2KQGUhsCrcg`, `LY2eNn_KSG20yyYZwhD_PA` and `DuCMDkmySmCrbey2VIbAPg` are unchanged, with amounts 20/10/10; `meta.status` is `published`.
**Done**: published, ledger updated, no commit.
### T2 — D1 migration 0005 · critical
**What**: create `d1/migrations/0005_membership_collaboration.sql`. It opens with a header comment giving the reason. It then creates `membership_requests_new`: 0004's columns, with `payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('bonifico', 'paypal'))` and `collaboration_at TEXT` after `areas_other`. It runs `INSERT INTO membership_requests_new (<0004 columns>) SELECT <same> FROM membership_requests`, `DROP TABLE membership_requests` and `ALTER TABLE membership_requests_new RENAME TO membership_requests`, and recreates `membership_requests_created_at`. No `BEGIN` or `COMMIT`.
**Files**: d1/migrations/0005_membership_collaboration.sql
**Interfaces**: produces `collaboration_at` and a nullable `payment_method` for T3–T5.
**Verified**: `npx wrangler d1 migrations apply multimage-orders --local` applies 0005. `npx wrangler d1 execute multimage-orders --local --command "PRAGMA table_info(membership_requests)"` lists 24 columns, with `payment_method` notnull 0 and `collaboration_at` present. An INSERT with `payment_method` NULL and `areas_json` `'[]'` passes; one with `'x'` fails. The test row is deleted, and `PRAGMA table_info(orders)` is unchanged.
**Done**: committed.
### T3 — Collaboration-update helpers · critical · depends on: T2
**What**: additive only, so the build stays green. In `membership.ts`: `CollaborationFields { areas; areasOther }`; `validateCollaborationFields` (at least one area, else the empty text; the id and "Altro" rules as today); `not_found` in `MembershipErrorCode`; `CollaborationResponse = { ok: true; notified: boolean } | { ok: false; error; fields? }`; `COLLABORATION_WINDOW_MS = 3600000`; `membershipFeeAmount(amount)` ("20 €"), extracted from `membershipFeeLabel`. In `membership-request.ts`: `parseCollaborationUpdate(body)` (code `^SO-\d{6}-[2-9A-HJ-NP-Z]{4}$`, else `bad_request`), `resolveMembershipAreas(ids, cmsAreas)` (which `resolveMembershipChoices` then reuses), `COLLABORATION_UPDATE_SQL` (as decided) and `collaborationEmail({ code, applicant, areas, areasOther })`. In `cloudflare-bindings.ts`: `OrderDb`'s bound statement gains `first<T>(): Promise<T | null>`.
**Files**: src/lib/membership.ts, src/lib/membership-request.ts, src/lib/cloudflare-bindings.ts
**Interfaces**: produces the exports above for T4, T6 and T7.
**Verified**: an `npx tsx -e` run on `./src/lib/membership-request.ts` shows that `parseCollaborationUpdate` rejects `MM-261125-ABCD`, `SO-261125-AB1D` and empty areas, and accepts a valid body. `COLLABORATION_UPDATE_SQL`, run with literals on local D1 against a fresh test row, returns one row and then none; the row is deleted. Prettier on the files; `npm run build` passes.
**Done**: committed.
### T4 — Collaboration branch in /api/socio · critical · depends on: T3
**What**: after the JSON parse, a body with a string `code` takes the new branch. It runs `parseCollaborationUpdate` (400), one published CMS read (502 `cms_unavailable`) and `resolveMembershipAreas` (400 `invalid` with `areas`). Without D1, dev prints the email and answers 200, and production answers 503. With D1, `COLLABORATION_UPDATE_SQL` runs via `.first()` with the cutoff `now − COLLABORATION_WINDOW_MS`. A null result answers 404 `not_found`. Otherwise it sends `collaborationEmail` with reply-to the returned email and answers `{ ok: true, notified }`. Log lines are `[socio] 200 collabora areas=<n> notified=<bool>` and `[socio] 404 not_found`. Update the header comment.
**Files**: src/pages/api/socio/index.ts
**Verified**: `grep -c "COLLABORATION_UPDATE_SQL\|not_found" src/pages/api/socio/index.ts` ≥ 2; prettier; `npm run build` passes.
**Done**: committed.
### T5 — Sign-up without payment and areas · critical · depends on: T4
**What**: one change across every consumer. `membership.ts`: `MembershipFields`, `validateMembershipFields`, labels and messages drop `payment`, `areas` and `areasOther` (the key type keeps `areas`/`areasOther` for T3; `payment` goes); the success answer drops `payment`; the birthPlace example becomes "Bologna". `membership-request.ts`: the parse ignores payment and areas; `resolveMembershipChoices` resolves the fee only; `membershipRow` writes `payment_method` NULL, `areas_json` `'[]'` and `areas_other` NULL; `membershipEmail` drops the method and area lines. `api/socio/index.ts`: no `payment` in the answer. `index.astro`: remove the "Come paghi" and "Come vuoi collaborare" fieldsets. Client: field order, `groupKeys` and `readFields` without them; `showDone` keeps bonifico first.
**Files**: src/lib/membership.ts, src/lib/membership-request.ts, src/pages/api/socio/index.ts, src/pages/diventa-socio/index.astro, src/pages/diventa-socio/_membership-page.client.ts
**Verified**: `npx tsx -e`: a sign-up body with no payment parses ok, `membershipRow` has `null` at the `payment_method` index, and the email has no "Come paghi". `grep -c 'name="payment"\|name="areas"' src/pages/diventa-socio/index.astro` prints 0. Prettier; `npm run build` passes.
**Done**: committed.
### T6 — Form: band, hints, polish · depends on: T5
**What**: first read DESIGN.md whole, then Impeccable `reference/craft-floor.md`, `clarify.md`, `bolder.md` and `polish.md`. In `index.astro`: the fallback title and mailto subject; the meta fallback; the band (a `<ul>` of three items between navy-at-15% hairlines, under the head, figures in Playfair); slate `order-hint-line` hints after the three legends, each tied to its fieldset with `aria-describedby`; fee rows with `<b>` label and `.order-choice__fee` amount (`membershipFeeAmount`); address rows `[address1] [address2] [postcode, city] [region, country]`, so "Provincia (facoltativo)" never wraps; the "Bologna" placeholder. A new `_socio.css`, imported by relative path after `form.css`, holds the band and a two-column error list on phones.
**Files**: src/pages/diventa-socio/index.astro, src/pages/diventa-socio/_socio.css
**Verified**: `grep -c "order-choice__fee\|order-hint-line" src/pages/diventa-socio/index.astro` ≥ 4; every class is defined in `form.css`, `_socio.css` or Tailwind (lesson); prettier; `npm run build` passes.
**Done**: committed.
### T7 — Confirmation · depends on: T6
**What**: also read `delight.md` and `distill.md`. In `[data-socio-done]`, in order: heading, CMS lines, lede, fee line, h3 "Cosa succede adesso" with the `<ol>` (`data-socio-receipt-link`), the toggle (`data-socio-pay-toggle`, radios `bonifico|paypal`), the boxes each with an "Importo" row (`data-socio-amount`) above "Causale", the payment note, the collaboration form (`data-socio-collab`: CMS areas + "Altro" + `socio-areasOther`, error slots, `data-socio-collab-status`), then the actions (`data-socio-print`, the `/libri` link). `_socio.css` gets the text button and a `@media print` that shows only the done block and hides the toggle, collaboration, actions and copy button (model: `src/pages/borsa/_borsa.css` § print). The script fills the lede, amounts and mailto from the answer. The toggle moves the chosen box first, with no request. Print calls `window.print()`. The collaboration form validates through a second `createFieldErrors` on its root, POSTs `{ code, areas, areasOther }` and shows the decided texts. Update the markup contract comment.
**Files**: src/pages/diventa-socio/index.astro, src/pages/diventa-socio/_membership-page.client.ts, src/pages/diventa-socio/_socio.css
**Verified**: `grep -c "data-socio-collab\|data-socio-pay-toggle\|data-socio-amount\|data-socio-print" src/pages/diventa-socio/index.astro` ≥ 5; `grep -c "Il suo codice" src/pages/diventa-socio/_membership-page.client.ts` prints 0; prettier; `npm run build` passes.
**Done**: committed.
### T8 — Header CTA
**What**: the `TOP_LINKS` label becomes "Diventa socia o socio"; both `TOP_LINKS` maps add `aria-current={href === normalizedPath ? 'page' : undefined}`.
**Files**: src/components/Header.astro
**Verified**: `grep -c "Diventa socia o socio" src/components/Header.astro` prints 1; `grep -c "aria-current={href === normalizedPath" src/components/Header.astro` prints 2; prettier; `npm run build` passes.
**Done**: committed.
### T9 — DESIGN.md and docs · depends on: T7, T8
**What**: DESIGN.md gets `### Membership page (/diventa-socio)` after "Order page" (head, band, form, confirmation, print). `security.md` § Membership endpoint: the collaboration branch, its limits and the shared 404. `operations.md`: the `collabora` log line. `d1/README.md`: 0005, `collaboration_at`, the nullable `payment_method`, `areas_json` `'[]'`. `list-helpers.md`: the new exports and `OrderDb.first`. `current-state.md`: the two-step flow. `TODO.md`: an owner follow-up on proof for the reduced fee. No live dates (lesson).
**Files**: DESIGN.md, docs/guidelines/security.md, docs/guidelines/operations.md, d1/README.md, docs/list-helpers.md, docs/current-state.md, docs/TODO.md
**Verified**: `npm run docs:inventory` exits 0; `grep -c "collaboration_at" d1/README.md docs/guidelines/security.md` ≥ 1 each; `grep -c "Membership page" DESIGN.md` ≥ 1; `npx prettier --check` on the files.
**Done**: committed as docs.
### T10 — Production facts · depends on: T9, Conductor steps 1–7
**What**: `d1/README.md` gets "Migration 0005 was applied remotely on <date>"; `current-state.md` gets the deployed version id.
**Files**: d1/README.md, docs/current-state.md
**Verified**: `grep -c "0005 was applied remotely" d1/README.md` prints 1.
**Done**: committed as docs.

## Order

T1, T2 and T8 run side by side. T3 follows T2, then T4, T5, T6 and T7 run one after another (shared files, one build at a time). T9 follows T7 and T8. Before the gate, the conductor runs a dev check: the form, both steps (dev prints both emails), and `/borsa` and `/designsystem` unchanged. T10 comes last.

**Conductor sequence** (after the gate): 1. Run `npx dotenv -e .env.cloudflare -- npx wrangler d1 migrations apply multimage-orders --remote`, before the deploy. Check that `membership_requests` has 24 columns and `orders` is unchanged. 2. WAF: no change (same path). 3. Run `npx dotenv -e .env.cloudflare -- npm run deploy:cf`. 4. On www.multimage.org: `/diventa-socio` answers 200 with no "Come paghi". POST `/api/socio` `{}` → 400, and `{"code":"SO-000000-2222","areas":["altro"],"areasOther":"prova"}` → 404. `/borsa` and `/libri` → 200, and POST `/api/ordine` `{}` → 400. 5. The owner sends a real request in a browser on www.multimage.org, with obvious test data. The confirmation shows the amount, the steps, the toggle, print and the catalogue link. The owner sends the collaboration step: two mails reach info@, and a second send shows the 404 text. Check the IBAN box padding here. 6. Match the code in the Worker logs (lesson), then `SELECT code, payment_method, areas_json, areas_other, collaboration_at, notify_status FROM membership_requests WHERE code='<code>'`. 7. `DELETE FROM membership_requests WHERE code='<code>'`. Re-running `/impeccable critique` (target above 25/40) is the conductor's. Never push.

## Deviations from the mandate

- No book covers in the band: no CMS selection exists, and the mandate allows covers only then.
- "Vale per il 2026" becomes the render year, so the hint does not go stale.
- IBAN box padding is a visual check in the Conductor sequence, with no code change unless it fails.

## Review fixes (binding; they amend the tasks and steps named)

- **H1 — collaboration token (T2, T3, T4, T5, T7, T9)**: 0005 adds `collab_token_hash TEXT`. The sign-up 200 answer returns a random 128-bit token (`crypto.getRandomValues`, base64url) as `collabToken`; the row stores only its SHA-256 hex (`crypto.subtle.digest`). The collaboration body is `{ code, token, areas, areasOther }`; the update matches `code` AND `collab_token_hash = sha256(token)` plus the existing guards (`collaboration_at IS NULL`, `created_at >= cutoff`, `email IS NOT NULL`), `RETURNING`. The token never appears in emails, causale, PayPal URL, mailto, logs, print or D1 in clear; the client keeps it in memory only. In the collaboration branch: answer the uniform 404 when `new URL(request.url).hostname` is not `www.multimage.org` or `multimage.org` (dev and localhost allowed only under `import.meta.env.DEV`); do the D1 match before any CMS read (the CMS read of areas happens only after a valid token, or validate area ids after the match). T9: security.md states the step is bound to a per-request secret token, not to the WAF.
- **M2 (T1)**: T1 also rewrites the two `content` sentences that mention choosing the payment method and the collaboration activities inside the form ("…i tuoi dati e la quota che ti corrisponde; come pagare lo scegli dopo l'invio" / "…dopo l'invio puoi indicare le attività…"); old and new text into the ledger for the owner.
- **M3 (T5)**: T5 removes only `payment` from `MembershipFieldKey`, labels and messages. `areas` / `areasOther` labels and messages stay (used by the collaboration step); only `MembershipFields`, `validateMembershipFields`, the client's `ERROR_KEYS` / `groupKeys` / `readFields` drop them.
- **M4 (T1, T6)**: no computed year. T1 adds an optional text field `fee_note` (single-line string, not required) to `membership`, additive on the primary, left EMPTY (no invented fact). T6 renders the "Quota" hint from `feeNote` only when filled. Owner follow-up: fill `fee_note` and decide which year a late-year sign-up covers. Drop the "Quota year" decision from the plan.
- **M5 (T2, Conductor 1)**: 0005's `INSERT … SELECT` lists all 23 columns of 0004 explicitly, `id` and `notify_error` included. T2 Verified: on a local DB with a row inserted before 0005, the row survives with the same `id` and `notify_error`. Conductor step 1: `SELECT count(*) FROM membership_requests` before and after.
- **L6 (Order)**: one build and one commit at a time: T8 runs before T3 starts; no two tasks build or commit concurrently.
- **L7 (T7, Conductor 5)**: after a successful collaboration send the form is hidden and replaced by a thank-you line; `data-socio-collab-status` is `role="status"` / `aria-live="polite"`. The second-send 404 is tested by the conductor with curl using the real code and token captured from DevTools.
- **L8 (T6)**: the error summary stays one column on phones (DESIGN.md:349).
- **L9 (T6)**: band hairlines at navy 10% (DESIGN.md:219).
- **L10 (T8, conductor dev check)**: T8 reads DESIGN.md and craft-floor; conductor checks the header top bar and mobile menu at 360–390 px for wrapping of "Diventa socia o socio".
- **L11 (Conductor 4)**: space the three probe POSTs at least 10 s apart.
- **L12 (Conductor 6)**: match the test request in the Worker logs by time and the `200 ok … saved=true` line, not by code.
- **L13**: T7 Verified adds "every class is defined in a stylesheet the page loads"; T9 and T10 run `npx prettier --write` on non-docs files before the commit.
- **L14 (T3, T4)**: in dev without D1 the collaboration branch prints the email with the areas and the code only (no applicant data) and answers 200; an empty `areas` answers `400 invalid` with `fields: ["areas"]`.
- **L15 (Conductor)**: expect T1's publish to go live before the deploy (cache-tag purge); run T1 close to the deploy or accept the short window.
