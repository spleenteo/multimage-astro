---
shaping: true
---

# Borsa — Shaping

## Context

Multimage is an association: sales are promotional only, so the site has no e-commerce, no transactions, no accounts. Ordering today is one email per book: the book page (`src/pages/libri/[slug]/index.astro:170`, `canOrderPrint = !isArchived && !isEbookFormat`) and the home hero (`src/components/HomeHero/index.astro:49`) link a `mailto:` built by `buildOrderMailto` (`src/lib/books.ts:325`) to `ordini@multimage.org`, read by Olivier. Olivier ships, the reader pays by bank transfer. `/info/ordinare` explains it.

Pages are server-rendered on Cloudflare Workers (Free plan, 10 ms CPU target) and cached in the Workers Cache by DatoCMS cache tags: the same HTML is served to every visitor.

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | A visitor collects several books and sends one order to Multimage | Core goal |
| R1 | The bag shows each title with its quantity (editable), the total copies and the total amount at cover price; single items can be removed and the whole bag emptied | Must-have |
| R2 | The bag survives navigation, reload and a later visit on the same device | Must-have |
| R3 | The order is sent from a form (name, email, shipping address, notes) to ordini@multimage.org, and the visitor receives a copy | Must-have |
| R4 | The wording is not e-commerce: a "borsa", no checkout, no payment step; the visitor is told what happens next (Olivier ships, how and when to pay by bank transfer, expected times) and that the amount excludes shipping | Must-have |
| R5 | Fits the Workers Free plan: cached pages stay shared and cacheable (no per-visitor server state on them), no added CPU on page renders | Must-have |
| R6 | The sending endpoint can't be abused: bots are stopped, and the visitor copy can't be turned into a way to mail arbitrary text to arbitrary addresses | Must-have |
| R7 | Only orderable books go in the bag (print, not archived, not ebook), from the book page and the home hero | Must-have |
| R8 | Accessible (keyboard, screen reader, WAVE baseline: 0 errors), usable on mobile; without JavaScript the current `mailto:` still works | Must-have |

---

## CURRENT: one mailto per book

| Part | Mechanism |
|------|-----------|
| CUR1 | `buildOrderMailto()` builds a `mailto:` with subject and body for one book, 1 copy |
| CUR2 | Book page "Ordina via email" button (shown when `canOrderPrint`); home hero "Ordinalo via email" |
| CUR3 | `/info/ordinare` (DatoCMS page) explains the procedure |

---

## A: Bag in the browser, order as one multi-book mailto

| Part | Mechanism | Flag |
|------|-----------|:----:|
| A1 | Bag store in `localStorage` (shared with B1) | |
| A2 | "Metti in borsa" on book page and home hero, bag drawer from the header (shared with B2, B3) | |
| A3 | Drawer CTA opens a `mailto:` with every title, quantity and the totals in the body; the visitor fills name and address in their mail client and sends | |

No server code; the visitor's copy is the sent message in their own mailbox.

## B: Bag in the browser, order page with a form sent by the Worker

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | **Bag store** | |
| B1.1 | Client module, key `multimage:bag` in `localStorage`: items `{ id, slug, title, authors, priceCents, qty }`, snapshot taken when added | |
| B1.2 | Add, set quantity, remove, empty; derived `copies` and `amount`; a `bag:change` event plus the `storage` event keep other tabs in sync | |
| **B2** | **"Metti in borsa" button** | |
| B2.1 | Book page and home hero: the primary button adds the book (data from server-rendered `data-*` attributes, so the page stays cacheable); feedback "Nella borsa · N copie" and opens the drawer | |
| B2.2 | The `mailto:` stays as the link's `href` (works without JS) and as a secondary "oppure scrivici" link | |
| **B3** | **Bag drawer (sidebar)** | |
| B3.1 | Header bag icon with copy count badge (rendered empty on the server, filled by B1 on the client) | |
| B3.2 | Side panel (`<dialog>`, focus trap, Esc closes): titles, quantity steppers, remove, "Svuota la borsa" with confirm, totals (copies, amount at cover price, "spese di spedizione escluse"), CTA to the order page | |
| **B4** | **Order page `/borsa`** | |
| B4.1 | Static, cacheable page: recap of the bag (read from B1 on the client), form (name, email, shipping address, notes, consent), "cosa succede dopo" block | |
| B4.2 | Turnstile widget on the form | |
| B4.3 | After a successful send: confirmation state, bag emptied | |
| **B5** | **Endpoint `POST /api/ordine`** | |
| B5.1 | Validates fields and lengths; verifies the Turnstile token (one fetch to siteverify) | |
| B5.2 | Rebuilds the book list from the server: fetches titles and prices by id from the CDA, so the email never carries a title or amount the browser made up | |
| B5.3 | 🟡 Builds a fixed-template plain-text email and sends it through Resend's HTTP API (free tier: 3,000/month, 100/day), one `fetch` per email, from an address on a sending subdomain (DNS records on `send.`, Google Workspace MX untouched): first to ordini@ with `Reply-To` the visitor, then the copy to the visitor with `Reply-To` ordini@; if the copy fails the order still counts. API key as a Worker secret set by the user (see `spike-email.md`) | |
| B5.4 | 🟡 Rate limit on `/api/ordine` with the one WAF rate limiting rule of the Cloudflare Free plan (dashboard, per IP), on top of Turnstile; the Resend daily cap is the last stop | |

## C: Bag in the browser, form posted to a third-party form service

| Part | Mechanism | Flag |
|------|-----------|:----:|
| C1 | B1, B2, B3, B4 as above | |
| C2 | The form posts from the browser to a hosted form service (Formspree, Basin or similar), which emails ordini@ and sends the visitor an autoresponse | ⚠️ |

No Worker code; free tiers are small and the autoresponse copy is often a paid feature. The service sees the visitors' personal data.

---

## Fit Check

| Req | Requirement | Status | A | B | C |
|-----|-------------|--------|---|---|---|
| R0 | A visitor collects several books and sends one order to Multimage | Core goal | ✅ | ✅ | ✅ |
| R1 | The bag shows each title with its quantity (editable), the total copies and the total amount at cover price; single items can be removed and the whole bag emptied | Must-have | ✅ | ✅ | ✅ |
| R2 | The bag survives navigation, reload and a later visit on the same device | Must-have | ✅ | ✅ | ✅ |
| R3 | The order is sent from a form (name, email, shipping address, notes) to ordini@multimage.org, and the visitor receives a copy | Must-have | ❌ | ✅ | ❌ |
| R4 | The wording is not e-commerce: a "borsa", no checkout, no payment step; the visitor is told what happens next (Olivier ships, how and when to pay by bank transfer, expected times) and that the amount excludes shipping | Must-have | ❌ | ✅ | ✅ |
| R5 | Fits the Workers Free plan: cached pages stay shared and cacheable (no per-visitor server state on them), no added CPU on page renders | Must-have | ✅ | ✅ | ✅ |
| R6 | The sending endpoint can't be abused: bots are stopped, and the visitor copy can't be turned into a way to mail arbitrary text to arbitrary addresses | Must-have | ✅ | ✅ | ❌ |
| R7 | Only orderable books go in the bag (print, not archived, not ebook), from the book page and the home hero | Must-have | ✅ | ✅ | ✅ |
| R8 | Accessible (keyboard, screen reader, WAVE baseline: 0 errors), usable on mobile; without JavaScript the current `mailto:` still works | Must-have | ✅ | ✅ | ✅ |

**Notes:**
- A fails R3: no form; the order depends on the visitor's mail client, which many phones and webmail users don't have set up for `mailto:`.
- A fails R4: there is no page where "what happens next" is said at the moment of ordering, only the drawer.
- 🟡 B passes R3 and R6 after the spike (`spike-email.md`): Cloudflare Email Routing reaches only verified addresses and Email Service needs Workers Paid, so B5.3 uses Resend; B5.4 uses the Free plan's WAF rule. Separate, not in this work: SPF/DKIM/DMARC for multimage.org (none today) to agree with whoever runs Google Workspace.
- C fails R3 and R6: whether a free tier sends the visitor copy, and what it does against abuse, is unknown.

## Open questions for the user

1. **"Cosa succede dopo" text** (R4): written in the code, or a DatoCMS field editable by the editors (e.g. on the `/info/ordinare` page or a global record)? Leaning DatoCMS: times and bank details change, and Olivier can change them without a deploy.
2. **Bank details in the copy**: should the visitor's copy include the IBAN, or say "you'll receive the details with the books"?
3. **Quantity cap** per title (e.g. 1–20), to keep promotional orders promotional and the email sane?
