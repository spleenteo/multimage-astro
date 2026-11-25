---
shaping: true
---

# Diventa socio — Slices

Technical work, no frame or shaping doc: the owner's answers at opening are in `STATUS.md`. The work reuses what `/borsa` already proved (Turnstile, the D1 `ORDERS` database, a `send_email` binding, the IBAN and PayPal confirmation) through shared modules instead of a second copy.

## Context

- **Singleton** `membership` on the primary environment `home-featured-book` (backup env `bkup-2026-11-24`): live fields `slug` (`diventa-socio`), `seo`, `title`, `subtitle` (HTML text), `content` (structured text). The record `D-sTlquHR7GiqaEOpMA80w` is published. The committed `schema.ts` is stale (shows `title` + `description`): regenerate before writing queries.
- **Form fields** (owner's list): email, first name, last name, date of birth, place of birth, address line 1, address line 2, city, state/province/region, postal code, country (default Italia), fee type (one of the CMS tiers, e.g. "10€ — Studente under 25"), payment method (bonifico | PayPal), collaboration areas (checkboxes from the CMS, "altro" with free text). Plus a required privacy consent with membership-specific wording, since the form collects date of birth and address.
- **Mailbox**: info@multimage.org, through a new `send_email` binding. Added as an Email Routing destination on 2026-11-24, verified on 2026-11-24 at 22:47 UTC.
- **Record**: every request also saved in D1 (`multimage-orders`). No retention rule (owner, 2026-11-24).
- **Old page**: `/info/adesioni` (CMS `page` record, in header and footer menus) gets a 301 to `/diventa-socio` (owner, 2026-11-24).
- **Rate limit**: the zone's one Free-plan rule covers only `/api/ordine`.

## V1 — The page and the form, from the CMS

**In**

- `npm run generate-schema` first, then the schema change applied directly on the primary environment through the CMA (owner's choice, 2026-11-24: model linked to nothing, backup made; no migration script). Added to `membership`: `fees` (modular blocks of a new block `membership_fee_block`: `label` string required, `amount` float required), `collaboration_areas` (modular blocks of a new block `collaboration_area_block`: `label` string required), `payment_note` (text: transfer reason and instructions), `success_text` (text: the congratulations message). Then `npm run generate-schema` again. Nothing existing is deleted or renamed.
- The singleton record is seeded (fee tiers and collaboration areas from the owner's list, a draft `payment_note` and `success_text`) and a draft rewrite of `content` is proposed by Claude: no Mailchimp link, no IBAN block, no fees in prose. The owner approves the texts; the record is then **published** (the published read is what production and `/api/socio` see).
- `src/pages/diventa-socio/index.astro` + `_graphql.ts`: `title`, `subtitle` through `sanitizeCmsHtml`, `content` through `StructuredText` as `src/pages/info/[slug]/index.astro` does (`hasStructuredTextContent`, `value` + `links`/`blocks` if used), SEO from `_seoMetaTags` with `withFallbackSeo`, draft mode (`resolveDraftMode`, `DraftModeQueryListener`). Fixed route; the `slug` field is ignored. A null singleton or empty `fees` shows the email way out instead of the form.
- `src/lib/membership.ts`: field keys, rules, Italian messages, limits; import-free (client bundles it), like `order.ts`.
- `_membership-page.client.ts` (first part): `novalidate` form, client validation with field errors and the error summary at top, Turnstile render with action `socio`. Submit shows a "not available yet" note until V2.
- Shared form styles: the form rules of `src/pages/borsa/_borsa.css` (`.order-field`, `.order-input`, `.order-error`, `.order-form-error`, `.order-check`, `.order-fieldset` and kin) move to a shared stylesheet both pages import; the Turnstile loader and error helpers inside `initOrderPage` are exported for reuse. `/borsa` looks and works unchanged.
- Discovery: `/diventa-socio` in `src/pages/sitemap.xml.ts` `STATIC_PATHS` and `src/lib/datocms/publicUrls.ts`; `case 'membership': return '/diventa-socio'` in `src/lib/datocms/recordInfo.ts` and its line in `scripts/revalidation-map/check.ts` (`npm run check:revalidation-map` green).

**Out**: the send path (V2); retargeting links and the redirect (V3).

**Done**: `npm run dev`, `/diventa-socio` with draft mode off and on: title, subtitle and content from the singleton, the fee tiers and collaboration areas from the published record, every field with its label; an empty submit shows the field errors and the summary; query field names checked against `npx datocms schema:inspect membership`. `/borsa` unchanged. Gate green.

**Gotchas**

- Fields ending in `_private` are never queried.
- `astro check` does not validate CDA field names (result types are hand-written): a wrong name only shows as a runtime CDA error, hence the draft on/off load in the Done.
- Block naming follows the `… Block` rule (`cms-content-modelling.md`), not the `order_step` precedent.

### Deviations found while planning V1

- "Altro" is a checkbox fixed in code with its own text input, not a CMS-seeded area: the free text stays tied to it even if editors rename or remove areas.

### V1 — done on 2026-11-24

The schema change went in on the primary environment through the CMA, as the owner chose: two blocks and four fields on `membership`, nothing renamed or deleted. The record was seeded and published in one go: three fee tiers (two of them assumed, to be confirmed), seven areas, `payment_note`, `success_text` and a rewritten `content` with no Mailchimp link, no IBAN and no fees in the prose. Every text is copied into the ledger under T2 for the owner. `/diventa-socio` renders from the published singleton with draft mode wired in. Its form markup, client validation, error summary and lazy Turnstile reuse `/borsa`'s styles (`src/styles/form.css`) and helpers (`src/lib/form.client.ts`), and `/borsa` refactored onto them without a behaviour change found in review. Rulings, all read from the ledger: subagents got the packet by path, not inline. T8 also fixed five stale expectations in the revalidation-map check, left behind by the earlier catalogue-filter work, so the check is green. T5's two-commit history was accepted. T6 swapped an internal Astro import for a new `EmptyBlock.astro`. The final review's browser and docs items were deferred to the conductor. Process slips: one review caught a `~/styles` import that broke the build, because the executor committed without building, and two commits went in before prettier. Owner follow-ups: confirm the "Studente under 25" and "Disoccupato" tiers (and a paired form for "Disoccupato"), the "Provincia" label for foreign addresses, the placeholder subtitle "bla bla" and the empty `seo`. Do not deploy V1 before V2, since the form cannot send yet.

Pending at close (conductor, browser): /diventa-socio form behaviour in a browser; draft-on load in the owner's session; /borsa and /designsystem unchanged in a browser.

## V2 — Sending the request and the confirmation

**In**

- Shared modules, so `/api/ordine` and `/api/socio` use one copy:
  - a pure, import-free payment-facts module (holder, bank, IBAN, BIC, SWIFT intermediary, PayPal, `formatIban`, a PayPal URL builder taking `(causale, cents)`); `order.ts` re-exports them under the current `ORDER_*` names and `orderPaypalUrl` becomes a wrapper, so `/borsa`, `order-pdf.ts` and the order email are unchanged;
  - a server-only Turnstile module: the siteverify fetch, the dev test secret, `checkSiteverify` and the failure-reason logic, moved out of `src/pages/api/ordine/index.ts` and `order.ts`.
- `POST /api/socio` (`src/pages/api/socio/index.ts`), shaped like `/api/ordine`: 405 for other methods, size limit, JSON parse, field validation through `membership.ts` (consent checked on the server too), Turnstile action `socio`, the fee tier re-read from the published CMS by id (the client never sends an amount), then D1 insert and email. `cache-control: private, no-store`. Logs carry status, code and counts only, never personal data.
- Request code `SO-YYMMDD-XXXX`; the code-clash check takes the table as a parameter (or `membership.ts` has its own), so the retry works on `membership_requests.code`.
- D1: `d1/migrations/0004_membership_requests.sql`, table `membership_requests` in `multimage-orders` (code `UNIQUE`, created_at, the fields, fee label and amount, payment method, areas, other text, notify status and error).
- Email: binding `MEMBERSHIP_MAIL` in `wrangler.jsonc`, destination `info@multimage.org`, sender `sito@ordini.multimage.org`, reply-to the applicant; plain text with every field; a getter in `src/lib/cloudflare-bindings.ts` (header comment updated). In plain dev the email is printed to the console.
- Client script, second part: submit, server field errors mapped, and on success the form is replaced by the confirmation: `success_text`, then the chosen payment method first (bank transfer: holder, IBAN with copy button, causale from `payment_note` + the request code and name; PayPal: button prefilled with the fee amount and causale), the other method below. Code and amount come from the endpoint's answer, not from page strings (no Content Link characters in the causale). A failure shows an email way out to info@multimage.org.

**Out**: production wiring (V3).

**Done**:
- `npm run dev`: a complete submit prints the email to the console and shows the confirmation with the chosen method first, the right amount on the PayPal button and the copyable IBAN; a forged fee id and a missing consent are rejected with field errors.
- Local Cloudflare run: `npx wrangler d1 migrations apply multimage-orders --local`, a Cloudflare build served by `wrangler dev`, one submit, the row confirmed by a `wrangler d1 execute multimage-orders --local` SELECT.
- `/borsa` still sends an order the same way (dev run). Gate green.

**Gotchas**

- `src/pages/api/` is a sensitive area (level `essential`): no test runner, so the checks are the gate plus the runs above.
- A fee tier only in a draft is rejected by the published re-read: expected, editor-only.
- Worker CPU on the Free plan (10 ms): one CDA read, one insert, one send, like `/api/ordine`.

### Deviations found while planning V2

- T3 moves the `.order-bank*` rules from `_borsa.css` to `form.css` so the confirmation reuses the /borsa bank box instead of copying ~70 lines.
- T2 accepts Turnstile test secrets on `localhost`/`127.0.0.1` outside dev (affects `/api/ordine` too): the always-pass test secret answers hostname `example.com`, so the local `wrangler dev` submit would fail otherwise. Production hosts keep the strict check.
- Parse, row, email and code live in a new `src/lib/membership-request.ts`; `membership.ts` stays import-free for the browser.

### V2 — done on 2026-11-25

`/diventa-socio` now sends. `POST /api/socio` mirrors `/api/ordine` step by step: 405, fail-closed 503, an 8 KB cap, JSON and field checks with consent checked on the server, Turnstile action `socio`, one published CMS read that re-resolves the fee and the areas by id (the client never sends an amount, and a draft-only tier is rejected), then a D1 insert into the new `membership_requests` table (migration 0004, code `SO-YYMMDD-XXXX` with a clash retry on its own table) and one plain-text email to info@ through the new `MEMBERSHIP_MAIL` binding, reply-to the applicant. Logs carry codes and counts only. To share one copy, the payment facts moved to an import-free `src/lib/payment.ts` and the Turnstile check to `src/lib/turnstile.ts`; `/borsa` and `/api/ordine` were checked unchanged, apart from the planned test-secret leniency on localhost hostnames. The bank box styles moved to `form.css`. The confirmation shows the chosen method first, with the causale and amount taken from the server's answer. Rulings, all read from the ledger: subagents got the packet by path, as in V1; build tasks ran one at a time to keep `npm run build` runs apart; the final review found that `wrangler dev` rewrites the request host to the route's `www.multimage.org`, so the local Cloudflare check needs `--local-upstream localhost:8787` (a run flag, no code change). One review round: T8 first used `/borsa`-only classes the page doesn't load, and those became Tailwind utilities. Carried to V3: a WAF rule covering `/api/socio`, the docs (helpers list, security, operations, d1 README, project structure), and the owner verifying info@ before any deploy. Owner follow-ups: the Italian confirmation and error texts written by the executor. The dev, wrangler and browser Done checks are pending with the conductor.

Conductor checks at close (2026-11-25): local Cloudflare run with `build:cf` (test site key) and `wrangler dev --local-upstream localhost:8787` needed `--compatibility-date 2026-10-08` (local workerd older than the Worker's 2026-11-01). The page served 200 from the published CMS; a missing consent got 400 `fields:["consent"]`. Submits that pass validation stopped at `502 turnstile_unavailable`: every outbound fetch from local workerd was very slow (CDA 45 s, siteverify cut at its 10 s timeout), an environment limit, not code. The D1 risk was covered directly: the row built by the real `parseMembershipRequest` → `resolveMembershipChoices` → `membershipRow` was inserted into local `membership_requests` (all constraints passed, `fee_cents` 1000, `areas_other` kept), read back and deleted. The end-to-end submit (Turnstile, D1, `MEMBERSHIP_MAIL`) is first proven on production in V3. Browser checks (confirmation look, method first, IBAN copy, PayPal amount; /borsa unchanged) stay with the owner.

## V3 — Live on multimage.org

**In**

- `info@multimage.org` is verified in Email Routing (2026-11-24): nothing to wait for.
- With the owner's yes, before the deploy: widen the zone's rate limiting rule to `(http.request.uri.path in {"/api/ordine" "/api/socio"})` (or the `or` form if the Free editor refuses `in`); check with bare `{}` POSTs to `/api/socio` until one gets 429.
- Links: the Header "Diventa socio" button (`src/components/Header.astro`) and the three "Soci: 30% di sconto" links (`src/pages/distributori/index.astro`, `src/pages/autori/[slug]/index.astro`, `src/pages/libri/[slug]/index.astro`) point to `/diventa-socio`; a 301 from `/info/adesioni` to `/diventa-socio`.
- With the owner's yes: D1 migration 0004 on the remote database, then deploy with `npx dotenv -e .env.cloudflare -- npm run deploy:cf`.
- One real request on production, received in info@multimage.org and present in D1; the test row removed with the owner's yes.
- Docs: `docs/current-state.md`, `docs/list-*.md`, `d1/README.md` (new table, written only by the site), `docs/guidelines/security.md` § Order endpoint (extended to `/api/socio`, new personal data), `docs/guidelines/operations.md` (`MEMBERSHIP_MAIL`, the widened rule), `docs/guidelines/project-structure.md` (API route list), comments in `astro.config.mjs` and `wrangler.jsonc`, `docs/TODO.md` (iubenda policy for birth data with BORSA-privacy; BORSA-info-sync gains `payment_note`; BORSA-stream-log covers `/api/socio`).

**Out**: any member management beyond the email and the D1 row; the `adesioni` record itself (editors may remove it from the menus).

**Done**: on www.multimage.org a request at /diventa-socio arrives in info@multimage.org, its row is in D1, the confirmation is shown; the header button leads there, `/info/adesioni` redirects; rapid POSTs get 429; docs updated.

### Deviations found while planning V3

- T4 also updates `docs/guidelines/caching.md` (membership model, `/diventa-socio` route, block count 19 → 21), left over by V1.
- T4 changes the `/info/adesioni` link in `PRODUCT.md` to `/diventa-socio`.
- T3 removes the stale PLACEHOLDER comment in `wrangler.jsonc` next to the D1 comment it rewrites.

### V3 — done on 2026-11-25

T1–T5 ran without a stop: the header button and the three "Soci" links point to /diventa-socio, /info/adesioni is a frontmatter-only 301 page (static route beats info/[slug]; the middleware sends it private, no-store), config comments name both D1 tables and both Turnstile routes, and the docs (inventories, routes, caching, security, operations, d1/README, TODO) describe the target state. The final review found the Cloudflare bindings inventory missing getMembershipMail() and getBagEvents(), plus five wording drifts (Turnstile leniency, payment.ts as the source of the bank details, the WAF rule's two paths, the unset site key on /diventa-socio); one fix round closed them. The local dev check and the gate are green. One ruling: dispatches carried the 102 KB packet by path instead of verbatim. The production half (WAF, remote D1 0004, deploy, live checks, real request) and T6 are left to the conductor. Executor extras kept: the erasure UPDATE also NULLs areas_other (free text), and fee_* columns are documented as never erased.

Conductor sequence (2026-11-25): the WAF rule's expression became `(http.request.uri.path in {"/api/ordine" "/api/socio"})` with one PATCH, nothing else changed (404 404 429 before deploy, 400 400 429 after). Remote D1 0004 applied (23 columns, `orders` unchanged). Deployed version `2922a340-bf9b-4189-b89a-1acd49a461f4` with `MEMBERSHIP_MAIL`. Production checks green (/diventa-socio 200 with the form, /info/adesioni 301, home link, /api/ordine 400, /borsa, /info/ordinare and sitemap 200). The owner's real request `SO-261125-PE7E` was saved and notified, then deleted. A second code the owner saw, `SO-261125-5VVA`, never reached production (one 200 in the Worker logs): most likely a submit on the local dev server, which answers with a code and saves nothing. T6 recorded the facts (ab60aa3).

## V4 — From the critique: trust, a shorter form, a confirmation that leads to books

Source: `/impeccable critique` of 2026-11-25 (25/40), `.impeccable/critique/2026-11-25T00-33-35Z__src-pages-diventa-socio-index-astro.md`. Owner's answers: start from trust and clarity; move payment method and collaboration to the confirmation; address all five issues. Visual work follows the Impeccable references (`clarify`, `distill`, `bolder`, `delight`, `polish`) and `reference/craft-floor.md`; DESIGN.md stays the visual authority.

**In**

- **Clarify (P0, P1)**. CMS (CMA on the primary, additive edits of the published `membership` record and its blocks, then publish): a real `subtitle` (one line: 20 € a year, two free books, 30% off), the record `title` "Diventa socia o socio", fee labels in the paired inclusive form ("Studentessa o studente under 25", "Senza lavoro"), `success_text` without the sentence the script lede already says. Code: a fallback meta description when the subtitle is short; slate hints under "I tuoi dati" (birth date and place serve the libro soci), "Indirizzo" ("per spedirti i due libri in omaggio") and "Quota" ("vale per il 2026"); the lede "Il codice della tua richiesta è …" in the "tu" register; the header CTA label in the paired form. Nothing about proof for the reduced fee is invented: it is left to the owner (follow-up).
- **Distill (P2)**. The sign-up form drops "Come paghi" and "Come vuoi collaborare". The confirmation then offers: both payment boxes with a toggle that puts the chosen one first (client-only, no request), and an optional second step "Vuoi anche darci una mano?" with the collaboration checkboxes and "Altro", sent to a new `POST /api/socio/collabora` (or an extension of `/api/socio`) bound to the request code: Turnstile-free but limited (code must exist and be under 1 hour old, one update per code, same WAF rule path prefix), updates `areas_json` / `areas_other` on the same D1 row and sends a short second email to info@. `payment_method` becomes nullable or defaults (D1 migration 0005 if a constraint changes). The first email no longer lists method and areas.
- **Bolder (P1)**. A benefit band above the form, between hairlines (no cards): two free books · 30% off every book · support a non-profit publisher, with the fee amounts in Playfair (`.order-choice__fee`); optional covers only if a CMS selection exists (no new CMS field unless trivial). A "Membership" section in DESIGN.md describing the page.
- **Delight (P2)**. Confirmation: an "Importo" row in both payment boxes; "Cosa succede adesso" in three steps (pay, send the receipt, we write to you); print the page (as /borsa offers print/PDF; print is enough); a closing link "Sfoglia il catalogo: da socia o socio hai il 30%".
- **Polish (P3)**. "Provincia" label no longer wraps; distinct placeholders (no "Firenze" twice); `aria-current="page"` on the header CTA when on /diventa-socio; the error summary readable on phones; visual check of the IBAN box padding.

**Out**: renewal path and member records (owner decision later); cookie banner (third party); online payment.

**Done**: `/diventa-socio` on dev and then production: the subtitle and hints read right; the form has no payment or collaboration fieldsets; after a submit the confirmation shows the amount, the steps, print, the catalogue link, the payment toggle and the optional collaboration step, whose send updates the D1 row and mails info@; `/borsa` unchanged; gate green; deploy and a real test request (saved, collaboration added, then deleted). A re-run of `/impeccable critique` scores higher than 25/40.

**Gotchas**

- The collaboration endpoint must not let anyone write to another person's request: bind it to the code returned only to the submitter, accept it once, and only shortly after the request.
- CMS label changes are seen by `/api/socio` (it re-reads fees): no id changes.
- The WAF rule matches exact paths: a new path needs adding to the expression, or reuse `/api/socio` with a different body shape.

### Deviations found while planning V4

- No book covers in the benefit band: `membership` has no CMS selection of books.
- The "vale per il 2026" hint is computed from the render year (to be challenged in review: a year that rolls over before editors update the fees would state a wrong fact).
- The IBAN box padding is a visual check in the conductor sequence; no code change unless it fails.

### V4 — done on 2026-11-25

T1–T9 ran without a stop; T10 and the Conductor sequence are left to the conductor. The CMS record went live at T1 (title "Diventa socia o socio", a real subtitle, paired fee labels "Studentessa o studente under 25" and "Senza lavoro", trimmed success_text, two content sentences saying payment and collaboration come after the send), plus a new empty optional field `fee_note` that alone drives the "Quota" hint, so no year is computed; old and new texts are in the ledger under T1 for the owner. Migration 0005 rebuilds `membership_requests` with a nullable `payment_method`, `collaboration_at` and `collab_token_hash` (25 columns, all 23 old columns copied explicitly; ids restart, rows are addressed by code). The binding H1 fix shaped the work: the sign-up answer returns a 128-bit token once, only its SHA-256 is stored, and the collaboration step on the same `/api/socio` path (no Turnstile, still under the WAF rate limit) needs code and token, a production hostname, a one-hour window and a one-shot guard, with a read-only D1 match before any CMS read and one uniform 404. The form lost payment and collaboration; it gained the benefit band, hints, fee amounts and reordered address rows. The confirmation gained the steps, Importo rows, a client-only toggle, print, the catalogue link and the collaboration step. Rulings: the packet went by path, as in V1–V3; T3's commit mixing two extractions with new helpers was accepted; T6 (schema.ts, _graphql.ts) and T9 (project-structure.md) widened Files without a stop. Review rounds: T4 first stored bare area ids instead of [{id,label}] (fixed); T9 first wrote that the collaboration step is outside the WAF rule (fixed); the final review found unused PAYMENT_METHODS that the docs claimed drive the toggle (the toggle now renders from it), four DESIGN.md sentences that didn't match the code, and a stale Conductor sequence (the 404 probe needs a token; 25 columns). Low leftovers: security.md:53 still says "an empty selection is 400 invalid" where it should say an unknown area id; the fee_note editor hint in DatoCMS is in English and mentions proof (TODO SOCIO-cms-hints). The CMS copy has been live since T1 while the deployed form still shows the old fieldsets, until the V4 deploy (L15, accepted). Owner follow-ups in TODO: proof for the reduced fee, filling fee_note and the year a late sign-up covers, the "Altro: scrivi come" email label.

Conductor (2026-11-25): remote D1 0005 applied (0 rows before and after, 25 columns, `orders` 1 row unchanged); deployed Worker version c9bfe8bc-7a4b-422b-975b-ec2be0579c8c; probes green (page 200 without the payment and collaboration fieldsets, subtitle live, /api/socio {} 400, collaboration with a fake code and token 404, /api/ordine {} 400, /borsa and /libri 200, /info/adesioni 301). The owner's real request SO-261125-AQAM saved with the collaboration step (collaboration_at set, notify sent, token stored as a 64-char hash), then deleted. A second row, SO-261125-8UHV, was sent by Olivier at 08:21 with the collaboration step too: kept, the owner decides whether it is a test. Not verified by the conductor: the second-send 404 with a real token (no token outside the browser), the dev browser checks (no browser tool; the owner's production test covered the flow). The meta description still shows the DatoCMS global fallback because `_seoMetaTags` fills the empty record SEO; fixed by filling the record's SEO field (owner follow-up).

### Between V4 and V5 (Impeccable, outside a slice)

Owner-driven design passes on 2026-11-25, committed on the work branch, not deployed: two columns from 1024px with the form on a mist panel (383a9ba), the benefit band as a navy block with large Playfair figures (81b367b, f7b9c9d). DESIGN.md updated with both.

## V5 — One send: a two-step form, one save, one email

Source: owner, 2026-11-25: "il form può avere multi step per rendere il form più leggero, ma l'invio e il salvataggio deve essere unico. Il messaggio di feedback può apparire nella medesima colonna del form? c'è un parametro in url che mi permette di vedere la pagina di success o fail senza dover ricompilare?" Answers: two steps; preview only on localhost; "tutta la tabella può essere semplificata … basta avere i dati finali, sono temporanei"; payment toggle stays as now.

**In**

- **Two-step form, client-side, one submit.** Step 1 "I tuoi dati" (email, name, birth date and place, address fieldset). Step 2 "Quota" (fee radios), "Vuoi anche darci una mano? (facoltativo)" (collaboration area checkboxes + "Altro" text, back inside the form), consent, Turnstile, send. "Avanti" validates step 1 only (same rules and messages, error summary for that step) and moves focus to step 2's heading; "Indietro" returns without losing values; a "Passo 1 di 2" indicator. One POST at the end with everything. No data reaches the server before the final send.
- **Server: one branch.** `/api/socio` takes the whole request (fields + fee + areas + areasOther), validates, Turnstile, re-reads fee and areas from the CDA, saves one D1 row, sends one email to info@ (with the areas), answers once. Remove the collaboration branch, the token (`collabToken`, hash helpers, match/update SQL, hostname check), the second email, and their docs. The WAF rule stays as is.
- **D1 simplified (migration 0006, table rebuild, copy existing rows).** Keep: `id` (PK, needed by AUTOINCREMENT rebuild? decide), `code` (UNIQUE), `created_at`, `email`, `first_name`, `last_name`, `birth_date`, `birth_place`, `address1`, `address2`, `city`, `region`, `postcode`, `country`, `fee_label`, `fee_cents`, `areas` (plain text, the area labels joined by ", "), `areas_other`. Drop: `fee_id`, `payment_method`, `areas_json`, `collaboration_at`, `collab_token_hash`, `consent_at`, `notify_status`, `notify_error` (mail failures stay in the Worker logs). The existing row (Olivier's SO-261125-8UHV) is copied, its areas_json converted to the labels text. The insert no longer updates the row after the mail.
- **Feedback in the form's column.** Success: the confirmation replaces the form in the right column (as now). Failure that is not field validation (Turnstile, server unreachable, 5xx, mail-and-save both failed): a block in the same column, replacing the send area or the form, with the email way out to info@ and a "Riprova" that keeps the values. Field errors stay inline with the summary.
- **Preview on localhost only.** `/diventa-socio?anteprima=conferma` renders the confirmation with fake data (code SO-000000-PROV, the first fee, bonifico first), `?anteprima=errore` the failure block; ignored unless `import.meta.env.DEV` or the request hostname is `localhost`/`127.0.0.1`. Nothing is sent or saved.

**Out**: renewal path; CMS copy changes (the owner decides "Compila il modulo qui sotto" separately); online payment.

**Done**: on dev, both steps, Avanti/Indietro keep values, step-1 errors block Avanti, the final send makes one POST; `?anteprima=conferma|errore` work on localhost and are ignored in production; gate green; remote D1 0006 applied with the existing row preserved; deployed; a real request by the owner gives one row and one email with the areas.

**Gotchas**

- Focus management between steps (heading of the new step, `aria-live` "Passo 2 di 2") and the error summary must only list the current step's fields; on the final send a server `invalid` naming a step-1 field must bring the user back to step 1.
- Turnstile loads on first focus inside the form: keep it in step 2 so the token is fresh at send.
- 0006 must copy the existing row, keep `code` UNIQUE, keep `membership_requests_created_at` index.

### Deviations found while planning V5

- No separate live "Passo 2 di 2": focus moves to the step's h2, described by the step line.
- Step titles carry "I tuoi dati" and "Quota"; the personal fieldset legend goes and the fee legend becomes "Tipo di quota" (DESIGN.md: no label stacked above a heading).
- A Turnstile load failure stays in the top error band, not the failure block.
