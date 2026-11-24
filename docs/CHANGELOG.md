# Changelog

All notable changes to the Multimage site, newest first.

## v1.3.0 — 2026-11-24 — Buyer kinds from the CMS, a bag button on every book card, bag counters

After a review with the product owner, the order form takes its buyer kinds and discounts from DatoCMS, book cards gain a quick "add to bag" button, and the site counts how the bag is used without tracking anyone.

- **Who orders**: "Chi ordina" lists the records of the new DatoCMS `buyer` collection in their order (Socio, Privato, Scuola, Associazione, Libreria), each with its own discount on the books, never on shipping; the first is preselected and the server recomputes the discount. The member checkbox is gone.
- **Order data**: D1 migration 0003 lets `buyer_kind` hold any buyer name and stores the discount percentage of each order.
- **Order form**: the name field reads "Nome e cognome o ragione sociale"; the optional phone explains that the courier uses it; the error summary sits at the top of the form.
- **Page texts**: the `/borsa` head and next steps come from the DatoCMS `Shop` singleton, with formatting rendered through an allowlist sanitizer.
- **Payment**: the confirmation leads with the IBAN and a visible copy button, and offers a PayPal button prefilled with the amount and the order code.
- **Book cards**: every orderable print book card has a bag button level with the price, with a tooltip, that adds one copy.
- **Bag counters**: adds per book and per button, bags started, emptied and ordered go to Workers Analytics Engine with no visitor identifier; `npm run stats:bag` shows the books added most and the bags left behind.
- **Design system**: a public, noindex `/designsystem` page renders the components described in `DESIGN.md`.
- **Work**: `borsa`

---

## v1.2.0 — 2026-11-24 — Order your books through a bag and an order form

Visitors can now put books in a bag, review quantities and totals, and send an order request to the association from a new order page. Payment stays a bank transfer after shipping: there is no checkout and no account.

- **Bag**: an "add to bag" button on book pages and the home hero, and a drawer in the header, where visitors change quantities, see total copies and the total at cover price, and empty the bag.
- **Order page**: `/borsa` collects name, email, shipping address and notes, protected by Turnstile, with guidance on how and when the books arrive and how to pay. If the form cannot send, an email way out is shown instead.
- **Orders**: each order gets a code, is saved in a Cloudflare D1 database and notified to the association's order mailbox; no third-party email service is used.
- **PDF**: after sending, the confirmation screen offers a PDF of the request to download or print, since the visitor receives no email copy.
- **Member discount**: members get 30% off the cover price, computed on the server; the order form, confirmation and PDF show it, and a forged discount is ignored.
- **Documentation**: a setup note, the order endpoint contract and the design docs describe the bag, the form and the D1 data.
- **Work**: `borsa`

---

## v1.1.0 — 2026-11-23 — Lighter /libri and /autori pages, with richer author cards

The two heaviest pages now do much less work on the server: an uncached render of `/autori` costs about a quarter of the CPU it did, `/libri` about half. Neither is reliably under the 10 ms of the Workers Free plan yet. Readers get the same catalogues, and author cards have a new look.

- **Books catalogue**: `/libri` renders the first 40 cards on the server and builds the rest in the browser from a JSON file, keeping search and filters.
- **Authors index**: `/autori` renders the first letters on the server and loads the others from a JSON file.
- **Author cards**: each card shows the author's country, a one-line bio and up to four small covers.
- **CMS**: authors have a `one_line_bio` field, and `country` is a list of Italian country names to pick from.
- **Book covers**: the 3D book cover uses far fewer elements, which lightens every page that shows books.
- **Cache refresh**: the two JSON files are purged on publish like the pages.
- **Work**: `workers-cpu`
- **Decision**: [catalogue-forty-cards-plus-json](decisions-log/2026-11-23-catalogue-forty-cards-plus-json.md)

---

## v1.0.1 — 2026-11-23 — The site now runs on Cloudflare Workers with instant cache refresh

The public site moved from Vercel to Cloudflare Workers, and pages are now cached and refreshed by DatoCMS content changes instead of Vercel's ISR. Visitors see the same site; editors see their changes within seconds.

- **Hosting**: www.multimage.org and the apex domain are served by a Cloudflare Worker, with Vercel kept only as an idle fallback until cleanup.
- **Page cache**: public pages are served from the Workers Cache; editors in draft mode always bypass it and see drafts.
- **Cache refresh**: publishing in DatoCMS purges only the pages tagged with the changed content, through a webhook and a dedicated invalidation endpoint.
- **Analytics**: Vercel Analytics and Speed Insights were removed along with the move.
- **Documentation**: a switch-day runbook and updated caching, operations, preview and security guidelines describe the Cloudflare setup.
- **Work**: `cloudflare-workers`
- **Decision**: [cloudflare-workers-cache-gateway-and-tag-purge](decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md)

---
