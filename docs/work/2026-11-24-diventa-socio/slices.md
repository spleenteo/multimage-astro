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
