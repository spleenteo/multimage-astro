---
shaping: true
---

# Borsa — Slices

Shape B of `shaping.md`. Visual reference: `docs/design/borsa/borsa-mock.html` (published as a Claude artifact; states: book page, bag open, bag empty, `/borsa`, order sent). The mock is a comp: implementation reuses the site's components (`Button`, header, tokens in the Tailwind theme) and DESIGN.md rules, not the mock's CSS.

Cross-cutting rules for every slice:

- Pages stay cacheable and identical for every visitor: no cookie, no per-visitor HTML. All bag state is client-side.
- Client code is small vanilla TypeScript in `<script>` tags processed by Astro (as the catalogue and search do), no framework island.
- Copy is Italian, the product's own words: "borsa", "Metti in borsa", "Completa l'ordine", "Invia l'ordine". Never "carrello", "checkout", "acquista", "paga".
- Order facts (ordini@, IBAN, BIC, intermediary SWIFT, PayPal, shipping kinds and fee, quantity cap 20) live in one module, `src/lib/order.ts`, used by page, drawer and email.

## V1 — The bag: add, see, change, empty

**In**

- `src/lib/order.ts` with the order facts and pure helpers: price parsing into cents, totals (copies, amount), euro formatting (reuse `formatBookPrice` style), quantity clamp 1–20.
- Client bag store (`src/lib/bag/` or `src/scripts/bag.ts`): `localStorage` key `multimage:bag`, items `{ id, slug, title, authors, priceCents, cover, tint, qty }`, add (adding an existing book increments by one, capped), set quantity, remove, empty; emits `bag:change`; listens to `storage` for other tabs; survives a corrupt or old value by resetting to empty.
- "Metti in borsa" on the book page where `canOrderPrint` holds (orange-deep primary), replacing "Ordina via email" as the primary; the book data travels in `data-*` attributes rendered on the server. The `mailto:` remains: as the button's no-JS fallback (an `<a href=mailto>` enhanced into a button by the script, or a `<noscript>` link) and as a navy link "oppure scrivici un'email". After adding: "Nella borsa · N copie" line under the button, and the drawer opens.
- Home hero: same "Metti in borsa" as its secondary action in place of "Ordinalo via email", when the hero book is orderable.
- Header: bag button with copy count, in the logo band (desktop) and reachable on mobile; the count is empty in the server HTML and filled by the script; hidden count when 0 (button stays: it opens the empty state).
- Bag drawer (`BagDrawer` component, included once in `BaseLayout`): native `<dialog>` from the right, scrim, Esc and scrim close, focus to the heading on open and back to the opener on close, reduced motion respected. List with cover thumb on its tint, title link, authors, quantity stepper (− disabled at 1, + disabled at 20), line amount, "Togli dalla borsa"; footer with copies, total at cover price, the fine line ("Con il piego di libri la spedizione è gratuita. Non paghi adesso…"), CTA "Completa l'ordine" → `/borsa`, "Svuota la borsa" with inline confirm. Empty state with "Sfoglia il catalogo".
- Until V2 ships, `/borsa` doesn't exist: the CTA points to `/borsa` anyway (V1 and V2 merge together; V1 alone is not deployed).

**Out**: the `/borsa` page, the endpoint, email, Turnstile.

**Done**

1. On a book page, "Metti in borsa" adds the book; the drawer opens with title, cover, authors, 1 copy, price; the header shows 1.
2. Adding a second book and raising the first to 3: copies 4, total = sum of line amounts, formatted `63,00 €`.
3. Reload, navigate to another page, open a second tab: the bag is the same; a change in one tab shows in the other's header count.
4. "Togli dalla borsa" removes one line; "Svuota la borsa" asks, then empties; the empty state shows.
5. Keyboard only: open from the header, Tab cycles inside the drawer, Esc closes and focus returns to the opener.
6. JavaScript off: the book page shows a working "Ordina via email" `mailto:`; no bag button is left dead.
7. An ebook or archived book has no "Metti in borsa".
8. Gate green.

**Gotchas**

- Header and BaseLayout render on every page: the drawer markup must be cheap (no data, no query) to keep the Free plan CPU budget.
- `<dialog>` + `showModal()` gives focus trap and inert background; style `::backdrop` with the navy backdrop of DESIGN.md (sheet lift turned sideways).
- Price strings come formatted from the server (`16,00 €`); store cents parsed from the raw number, not from the label.

**Impact corrections (2026-11-24)**

- Orderable rule once: `isOrderablePrint({ archive, format, price })` in `src/lib/order.ts` (not archived, format not "ebook" trimmed case-insensitive, price is a number); used by the book page (replaces the inline `canOrderPrint` at `src/pages/libri/[slug]/index.astro:170`), the home hero and, in V2, the endpoint. A print book with no price gets no "Metti in borsa" (it keeps the mailto).
- Order email address once: move `ORDER_EMAIL` (`src/lib/books.ts:311`) and `ORDERS_EMAIL` (`src/pages/distributori/index.astro:18`) to `src/lib/order.ts` and import it.
- `Button` (`src/components/ui/Button/index.astro`) drops extra attributes: put the bag `data-*` on a wrapper element (or the enhanced `<a>`), do not change `Button`'s API.
- Home hero: extend `toHighlightData` (`src/pages/index.astro:126-160`) and `HomeHero` props with `id`, `slug`, raw `price`, `isArchived`, `format`, cover thumb and `tint`; the hero uses `isOrderablePrint` (today it shows the mailto even for an ebook) and the same no-JS mailto fallback as the book page.
- Tint: `coverFieldPalette(colors).field` (`src/lib/colors.ts:98`), the same value as the catalogue's `bg`.
- No ClientRouter in the repo: the bag script initialises when the module runs (as `Header.astro:868-870` calls `enhanceHeader()` directly), not only on `astro:page-load`.
- Header bag button: rendered `hidden` in the server HTML and revealed by the script, so it is never a dead control without JS.
- Update the stale code comments at `src/lib/books.ts:321` and `src/pages/libri/[slug]/index.astro:169` ("there is no cart").
- Done, added: 9. A print book with no price has no "Metti in borsa".

**Deviations found while planning V1**

- `order.ts` holds only the facts V1 uses (email, cap 20, storage key); IBAN, BIC, SWIFT, PayPal and shipping arrive in V2 with their first use.
- `isPrintInCatalogue` sits next to `isOrderablePrint`, so a print book with no price keeps the mailto (`isOrderablePrint` alone can't say that).
- The navy "oppure scrivici un'email" link is on the book page only; the home hero keeps its "Altri modi per averlo" list.

**V1 — done on 2026-11-24**

V1 shipped the bag end to end on the client: `src/lib/order.ts` (no imports) holds ordini@, the 1–20 cap, the storage key, the two order rules and the money helpers; `bag.client.ts` keeps `{"v":1,"items":[]}` in localStorage with cross-tab sync; `BagDrawer` (native modal dialog in BaseLayout, static markup) renders it and drives the header buttons; `BagAdd` swaps a mailto fallback for "Metti in borsa" on the book page and the home hero. Reviews caught what the plan didn't foresee: the header row overflowed at 390px once the bag button joined it (Menu text now sr-only below sm); the drawer clipped its footer on short screens and announced nothing to screen readers (panel scrolls under 36rem, a persistent live region); the browser walk measured the stepper at 44×42 because the group's border ate 2px (fixed); the BagAdd second-init guard used an empty-string flag that never stopped anything. T2 had to edit T1's order.ts to export the euro formatter the plan said it exported (ruling). Executors sign commits with their own model name in the trailer (ruling). Packets were passed by reference to a file, not inline (ruling). The browser walk ran in headless Chromium from a cached Playwright; Done 1–7 pass, Done 9 has no live example in the catalogue. Pending, accepted: Done 9 (no unpriced print book in the catalogue to try; covered by T1's check and the T7/T8 reviews).

## V2 — The order page and the sending endpoint

**In**

- `/borsa` page (`src/pages/borsa/index.astro`): static, cacheable, `noindex`. Title row "La tua borsa" with the serif size line filled by the script. Two columns from 768px: form (7fr) and recap aside (5fr, mist) holding the bag lines, totals (copies, shipping, total), "Modifica la borsa" (opens the drawer), "Cosa succede dopo" (four steps) and the bank box (IBAN grouped by four, BIC, PayPal, "Copia l'IBAN"). One column on phones with the recap first. Empty bag: the page says so and links to the catalogue, no form.
- Form: nome e cognome, email, telefono (optional), indirizzo, CAP e città, provincia, spedizione (radio rows: piego di libri gratuito ~1 settimana, rapida e tracciabile +5 €), ordini come (privato, scuola, associazione, libreria; segmented radios), note (optional, max 1000 chars), privacy consent (required, linking the site's privacy page if one exists, else the consent sentence alone). Client validation with messages under fields that name the problem and the fix; server repeats it.
- Turnstile widget (explicit render, site key from a public env var; when unset in dev, use Cloudflare's always-pass test key).
- `POST /api/ordine` (`src/pages/api/ordine.ts`, `prerender = false`): JSON body; validates fields and lengths, quantities 1–20, at most 30 lines; verifies Turnstile (siteverify); refetches the books by id from the CDA (published content only) and rebuilds titles and prices, dropping lines whose book is not orderable; computes totals with the shipping fee; builds one plain-text email (fixed template, Italian) via a pure function in `src/lib/order.ts`; sends through a mail transport: Resend HTTP API when the key is set (first to ordini@ with `Reply-To` the visitor, then the copy to the visitor with `Reply-To` ordini@); in dev with no key, logs the email text to the server console. Answers `{ ok, copySent }`, or an error code the page turns into a message. No personal data in logs in production.
- Success state on the page: "Ordine inviato, grazie", the lines and total, the next steps with IBAN, "Torna al catalogo"; the bag is emptied. If `copySent` is false, the page says the order reached Olivier but the copy didn't, and suggests printing the page.
- Env schema: three optional fields in `astro.config.mjs` (`RESEND_API_KEY` secret, `TURNSTILE_SECRET_KEY` secret, `PUBLIC_TURNSTILE_SITE_KEY` public) plus the sender address constant in `src/lib/order.ts`. No values are set anywhere by this work.

**Out**: setting the real keys, the Resend account, the DNS records, the WAF rule (user's setup, listed in the closing report).

**Done**

1. With books in the bag, `/borsa` shows the recap and totals that match the drawer; switching to rapid shipping adds 5,00 € to the total.
2. Submitting with an incomplete email shows the message under the field and focuses it; nothing is sent.
3. Local dev, no Resend key, Turnstile test key: a valid submit shows the success state, empties the bag, and the server console prints the email with the server's titles and prices (a tampered price in `localStorage` doesn't reach the email).
4. The endpoint rejects: a missing or failed Turnstile token (400), a body over limits (400), an empty bag (400), a non-POST (405).
5. Empty bag on `/borsa`: message and link to the catalogue, no form.
6. Keyboard and screen reader: labels, errors linked with `aria-describedby`, the success heading takes focus.
7. Gate green.

**Gotchas**

- Sensitive area (`src/pages/api/`): tests required by the `essential` level, but the project has no test runner. The endpoint's logic lives in pure functions in `src/lib/order.ts` (validation, rebuild, email text) so they can be exercised by a small `tsx` script; the gate stays build + lint.
- The endpoint must not be cached by the Gateway or the Workers Cache: check `src/worker.ts` for how `/api/*` routes are treated.
- CPU: the endpoint runs once per order; the fetches (siteverify, CDA, two Resend calls) are I/O, not CPU.

**Impact corrections (2026-11-24)**

- `/borsa` is server-rendered and cached like every page (no `prerender` export, layout cache tags as usual); no per-request data. `noindex` through the `seo` prop as `src/pages/404.astro:10` does; no robots.txt line; not added to `src/pages/sitemap.xml.ts`.
- Missing keys fail closed outside dev. Test keys (Turnstile site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`) and console logging of the email only when `import.meta.env.DEV`. In a production build with no `PUBLIC_TURNSTILE_SITE_KEY`, `/borsa` shows the bag and the `mailto:` fallback (built from all bag lines) instead of the form. The endpoint answers 503 with an error code when `RESEND_API_KEY` or `TURNSTILE_SECRET_KEY` is unset, and the page then offers the `mailto:`. Nothing personal is logged in production, ever.
- siteverify checks `success`, `hostname` and `action` (`ordine`).
- Refetch: `allBooks(first: 30, filter: { id: { in: [...] } })`, each id checked against `^[A-Za-z0-9_-]{1,40}$` first, selecting `id title slug price format archive authors { name }`; through `executeQuery` with `includeDrafts: false` (environment from `DATOCMS_ENVIRONMENT`). Lines whose book is missing or fails `isOrderablePrint` are dropped.
- The endpoint answers `{ ok, copySent, lines, copies, shipping, total, dropped }`; the success state renders the server's values and names dropped or repriced lines.
- The endpoint lives at `src/pages/api/ordine/index.ts` (folder style, like the other API routes); exports `POST` and `ALL` returning 405; does not use `src/pages/api/utils.ts` helpers (no CORS `*`, no error echo); error bodies carry codes only; must not import `cloudflare:workers` (the Vercel build in the gate).
- Caching is already handled: `src/worker.ts:48-56` gives `/api` no cache key, `src/middleware.ts:120-139` sets `cache.set(false)` and `private, no-store` on `/api` and non-GET. Replace the caching gotcha with a Done check.
- Privacy: the consent links the iubenda privacy page used in `src/components/Footer.astro:80`.
- Done, added: 8. Production build (no keys, `astro preview` or a local Cloudflare build): `/borsa` shows the mailto fallback; a direct POST answers 503 with a code; nothing personal in the log. 9. A stale price in `localStorage` shows the server's price on the success state. 10. The POST response carries `cache-control: private, no-store`.

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

**Deviations found while planning V3**

- `docs:inventory` already fails on an old line of `docs/list-components.md` (165, `fill.client.ts`); T2 rewords it so the gate passes.
- WAVE runs only as a browser extension: the local check is axe-core (WCAG 2.2 A/AA); WAVE on the deployed pages goes in the setup note's checklist.
- Detector false positives are recorded and ignored in `.impeccable/config.json`, not fixed.
- TODO.md also gets BORSA-voiceover and a Completed line.
- WAF rule suggested at 2 requests per 10 s per IP (planner's choice, the user can change it).
