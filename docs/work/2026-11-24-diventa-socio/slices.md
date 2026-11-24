---
shaping: true
---

# Diventa socio — Slices

Technical work, no frame or shaping doc: the owner's answers at opening are in `STATUS.md`. The work reuses what `/borsa` already proved (Turnstile, the D1 `ORDERS` database, a `send_email` binding, the IBAN and PayPal confirmation) instead of building a second copy of it.

## Context

- **Singleton**: `membership` already exists in DatoCMS (`title`, `description`), on the primary environment `home-featured-book`; `schema.ts` was regenerated with it.
- **Form fields** (owner's list): email, first name, last name, date of birth, place of birth, address line 1, address line 2, city, state/province/region, postal code, country (default Italia), fee type (one of the CMS tiers, e.g. "10€ — Studente under 25"), payment method (bonifico | PayPal), collaboration areas (checkboxes from the CMS, "altro" with free text). Plus a required privacy consent: the form collects date of birth and address.
- **Mailbox**: info@multimage.org.
- **Record**: every request also saved in D1.

## V1 — The page and the form, from the CMS

**In**

- DatoCMS migration (script in `migrations/`, run on the primary environment) adding to `membership`: `fees` (modular blocks of a new block `membership_fee`: `label` string required, `amount` float required), `collaboration_areas` (modular blocks of a new block `collaboration_area`: `label` string required), `payment_note` (text: transfer reason and instructions), `success_text` (text: the congratulations message). Then `npm run generate-schema`.
- Editors fill the new fields (seed values from the owner's list in the migration, so the page has content at once).
- `src/pages/diventa-socio/index.astro` + `_graphql.ts`: title and description (rich text sanitized through `sanitizeCmsHtml`, as `/borsa` does), the fee tiers, and the form with every field above, labels and errors in Italian, native validation plus the same field-level error pattern as `/borsa` (error summary at top). The Turnstile widget is rendered. SEO meta and draft mode (`resolveDraftMode`, `DraftModeQueryListener`) like the other CMS pages.
- Form styling reuses the `/borsa` form classes and design tokens; no new design.

**Out**: the send path (the submit button is there, and on submit it shows a "not available yet" message in dev only); the menu link (editors).

**Done**: `npm run dev`, open `/diventa-socio`: title and description from the singleton, the fee tiers and the collaboration areas from the CMS, every field present with its label; an empty submit shows the errors on the required fields. An edit to the singleton in draft mode shows up live. Gate green.

**Gotchas**

- Adding fields and block models is not destructive, but it is a schema change on the primary environment: the migration runs only after the owner's yes (stop in the runner).
- Fields ending in `_private` are never queried.
- The page is cached by the Workers Cache with the CDA cache tags: check that the singleton's tags reach the page like `/borsa`'s `shop` does.

## V2 — Sending the request and the confirmation

**In**

- `POST /api/socio` (`src/pages/api/socio/index.ts`), shaped like `/api/ordine`: 405 for other methods, size limit, JSON parse, field validation (a `src/lib/membership.ts` with the field rules, messages and parser, shared by the client and the endpoint), Turnstile with its own action `socio`, the fee tier re-read from the CMS by id (the client never sends an amount), then D1 insert and email. `cache-control: private, no-store`. Logs carry status, code and counts only, never personal data.
- Shared code instead of copies: Turnstile siteverify and its check, the payment constants (account holder, bank, IBAN, BIC, PayPal, `formatIban`, the PayPal URL builder) move out of `order.ts` into shared modules that both `/api/ordine` and `/api/socio` import; `/borsa` keeps working unchanged.
- D1: migration `d1/migrations/0004_membership_requests.sql`, a `membership_requests` table in the same `ORDERS` database (code, created_at, the fields, fee label and amount, payment method, areas, notify status).
- Email: a new `send_email` binding `MEMBERSHIP_MAIL` in `wrangler.jsonc`, destination `info@multimage.org`, sender `sito@ordini.multimage.org`, reply-to the applicant; plain text with every field. A getter in `src/lib/cloudflare-bindings.ts`. In plain dev the email is printed to the console, as `/api/ordine` does.
- Client script `_membership-page.client.ts`: submits, maps field errors, and on success replaces the form with the confirmation: `success_text` from the CMS (you will be contacted soon), then the chosen payment method first (bank transfer: holder, IBAN with copy button, causale from `payment_note` with the request code and name; PayPal: button prefilled with the fee amount and causale), the other method below. A failure shows an email way out to info@multimage.org.

**Out**: production wiring (V3).

**Done**: in `npm run dev`, a complete submit prints the email to the console and shows the confirmation with the chosen method first, the right fee amount on the PayPal button and the copyable IBAN; a forged fee id is rejected with a field error; `/borsa` still sends an order the same way. Gate green.

**Gotchas**

- `src/pages/api/` is a sensitive area (test level `essential`): no test runner exists, so the checks are the gate plus the dev run above, with the forged-fee and missing-field cases tried by hand.
- The privacy consent is checked on the server too.
- A `send_email` binding only sends to its `destination_address`, and that address must be a verified destination of Email Routing on the account: check `info@multimage.org` before V3.
- Worker CPU on the Free plan (10 ms): the endpoint does one CDA read, one insert, one send, like `/api/ordine`.

## V3 — Live on multimage.org

**In**

- Check (or ask the owner to add) `info@multimage.org` as a verified Email Routing destination.
- Apply D1 migration 0004 to the remote database, then deploy with `npx dotenv -e .env.cloudflare -- npm run deploy:cf`: each only after the owner's yes.
- One real request on production, received in info@multimage.org and present in D1; then the test row removed with the owner's yes.
- Docs: `docs/current-state.md`, `docs/list-*.md` (page, endpoint, helpers, models), the order endpoint contract doc extended or a sibling for `/api/socio`, `docs/guidelines/security.md` (new personal data collected), `docs/TODO.md`.

**Out**: the menu link (editors); any member management beyond the email and the D1 row.

**Done**: on www.multimage.org/diventa-socio a request arrives in info@multimage.org, its row is in D1, the confirmation is shown; docs updated.
