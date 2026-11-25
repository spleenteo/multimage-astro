---
scope: Living snapshot of Multimage's current implementation status. Update sections as the codebase evolves.
---

# Current State

> Last significant update: 2026-06-20 (Fast Origin Transfer reduction: surgical revalidation, 60-day ISR TTL, lean card images, paginated `/libri`, `/llms-full.txt` removed). Update sections as features ship or gaps are closed.

## Project Structure

- Astro pages live under `src/pages/**`, each with a sibling `_graphql.ts` defining queries/fragments. API routes exist under `src/pages/api/**` and power preview/draft tooling plus automations (`post-deploy`, `seo-analysis`, `preview-links`).
- Components are grouped by feature: `src/components/blocks`, `src/components/datocms/structuredText`, `src/components/ui`, and utility components like `DraftModeQueryListener`.
- Helpers live in `src/lib/**` (datocms, draftMode, seo, books/authors/suppliers). All routes are SSR (no more `prerender` flag branching), cached by Vercel ISR in production and, on branch `chore/cloudflare`, by the Workers Cache with DatoCMS cache tags (`DEPLOY_TARGET=cloudflare`).
- Layout, styles, scripts:
  - `src/layouts/BaseLayout.astro` loads site-wide data, analytics, and icon scripts.
  - `src/styles/global.css` imports fonts + Tailwind 4 and defines the design tokens in `@theme static` (no JS config).
  - `scripts/` hosts `sync-datocms.mjs` (schema generation) and `build-search-client.mjs`.
- Generated assets: `public/generated` stores the Site Search + Swiper bundles built during `npm run prebuild`.
- Known gaps: (**S1** resolved 2026-05-31 — internal routes gated in middleware. **S4** resolved 2026-06-20 — `/llms-full.txt` removed.)

## Routing

- Tutte le route pubbliche (`/`, `/libri`, `/libri/[slug]`, `/autori/[slug]`, `/magazine/[slug]`, `/collane/[slug]`, `/info/[slug]`, le index, `/sitemap.xml`, `/archived-books.json`, `/cerca`, `/distributori`) sono SSR ma servite dalla CDN Vercel via ISR (produzione oggi) — funzionalmente statiche per anonymous, on-demand SSR per editor. API routes (`/api/**`) sono escluse dall'ISR e girano sempre come function invocations. Sul branch `chore/cloudflare` (`DEPLOY_TARGET=cloudflare`, Worker di prova, switch non ancora eseguito) le stesse pagine sono nella Workers Cache per 60 giorni con cache tag DatoCMS; editor, `/api/*`, route interne e risposte non-200 non vengono mai messe in cache (policy nel middleware).
- Il catalogo `/libri` è **una sola pagina a faccette** (dal 2026-11-22). Dal 2026-11-23 il server rende le prime 40 card (novità, in catalogo) e i dati leggeri di tutti i libri per le faccette; lo script nel browser filtra (in evidenza, collana, formato, autrice/autore, periodo, tradotti, fuori catalogo, ricerca), ordina, mostra 40 card alla volta e costruisce le altre card da `/catalogue-books.json` (in cache, purge per cache tag), con un segnaposto finché il JSON non arriva. Senza JavaScript si vedono i primi 40 libri; gli altri sono nella sitemap. I filtri stanno nell'URL. `/libri/pagina/<n>` → 301 `/libri`; `/libri/ebooks` e `/libri/highlights` → 301 al catalogo con il filtro (`formato=ebook`, `evidenza=1`). Nel menu principale "Catalogo" e "Collane" sono voci di primo livello. Vedi decisions-log `2026-11-22-faceted-catalogue` e `2026-11-23-catalogue-forty-cards-plus-json` (CPU su miss: TODO **CAT-cpu**).
- `/autori` (dal 2026-11-22) è un indice A–Z a card piatte. Ogni card mostra ritratto o iniziale, nome, nome anagrafico sotto l'alias, paese e conteggio, la bio in una riga (`one_line_bio`, dal 2026-11-23) e in fondo le ultime copertine, piccole, accanto a "Vedi i libri" → `/libri?autore=<slug>`. La biografia intera non viene più letta dall'indice. Dal 2026-11-23 il server rende le lettere A–E; il browser aggiunge le altre da `/authors-index.json` (in cache, purge per cache tag) appena la pagina è ferma, o subito se si cerca o se l'URL punta a una lettera. Ogni card mostra fino a 4 copertine piccole. Le schede senza libri sono escluse. I conteggi e le copertine arrivano da una lettura paginata di tutti i libri (500 per pagina). La ricerca copre anche il nome anagrafico e annuncia il numero di risultati. - `/autori/[slug]` (dal 2026-11-22) apre con una riga di titolo (ritratto piccolo o iniziale, nome anagrafico sotto l'alias, "25 libri · 6 fuori catalogo", "Firma anche come …"). Seguono:
  - l'ultimo libro in catalogo su un campo dal colore della copertina;
  - la biografia a 68ch, con il resto in `<details>` oltre i tre paragrafi;
  - "Tutti i libri" nella griglia catalogo, con i fuori catalogo in un sottogruppo, una riga sull'ordine e la chiusura per chi vuole pubblicare.
  Le identità collegate in `pseudonyms` sono unite: i libri di Gandalf il Viola compaiono anche su Olivier Turquet e viceversa. Il limite è di 100 libri, con link al catalogo oltre.
- `/collane` (dal 2026-11-22) è uno scaffale. Per ogni collana mostra le ultime copertine su un campo tinto dalla più recente, il conteggio, l'ultima uscita e il link al catalogo filtrato (`/libri?collana=<slug>`). L'ordine è per numero di libri in catalogo, con "Fuori Collana" in fondo. I dati arrivano da due query: le collane (`first: 100`), poi una query generata dagli id con alias per collana (6 libri recenti, totale, fuori catalogo). La pagina di una collana mostra fino a 100 libri, ordinati per anno di stampa; oltre quel numero compare il link al catalogo.
- `/distributori` (dal 2026-11-22) risponde a "come lo trovo".
  - Riga di titolo con il conteggio, poi tre strade: qualsiasi libreria con l'ISBN tramite Libri Diffusi/Fastbook e Terminal, i luoghi amici, l'ordine via email con l'unico pulsante arancio.
  - Sopra l'elenco c'è una mappa interattiva (MapLibre + tessere OpenFreeMap), caricata solo quando si avvicina allo schermo. I punti sono raggruppati e ogni punto apre una scheda con "Vedi nell'elenco" e "Indicazioni". Le coordinate vengono dal campo `map` del modello `supplier`: il 2026-11-22 sono state ricavate dagli indirizzi (Nominatim) per le 24 voci che non le avevano, verificate e pubblicate.
  - L'elenco per regione ha una striscia piatta, fissa solo da 768px, e voci piatte.
  - I telefoni sono normalizzati e chiamabili; le descrizioni lunghe sono dietro "Continua".
  - In fondo, la sezione "Sei una libreria?".
  - Il sottotitolo CMS della pagina indice serve solo come meta description.
- The book page `/libri/[slug]` (since 2026-11-22) opens with a field coloured from the cover (Book Cover Field); the cover is a 3D book (`Book3D`) that turns on hover to show the spine or the page edge, as in the catalogue cards. The primary action is "Metti in borsa", which adds the book to the bag (side drawer, see below); without JavaScript, or for a book the bag cannot take, it stays a `mailto:ordini@multimage.org` prefilled with title, authors, ISBN and price. An ebook has a single button to Bookrepublic. Below the order sit the shipping/members line and the links to `/distributori` and `/info/ordinare`. Out-of-catalogue editions point to the most recent print edition still in the catalogue. Under the hero is a flat reading column: description, back cover, authors, details, reviews, the series carousel.
- `/borsa` (since 2026-11-24, `noindex`; the head and the "Cosa succede dopo" steps come from the `shop` singleton, whose WYSIWYG descriptions render through the allowlist `sanitizeCmsHtml` in `src/lib/text.ts`, all order state lives in the browser) is the order page. Empty, it points to the catalogue ("Guarda le novità"); with books it shows the recap (books at cover price, buyer discount, shipping, "Totale da pagare"), the next steps with no bank details yet and a link to `/info/ordinare`, the form (separate CAP, Città and Provincia, joined into the D1 `city` column; "Nome e cognome o ragione sociale"; "Chi ordina" built from the DatoCMS `buyer` collection in its order (Socio, Privato, Scuola, Associazione, Libreria, each with a percentage off the books, never shipping, recomputed by the server from the buyer record and checked by the staff; the first of the collection, Socio, is preselected: members come first)) and Turnstile; invalid fields are listed in a focused error summary with links to each; without a site key (or if the widget fails) it offers the email box; after sending it shows when the staff will write, the order code, the recap, the same three steps with the bank transfer details and "Copia l'IBAN", a prefilled PayPal link (amount and causale, to use after the staff's confirmation; also in the PDF), and a "Scarica il PDF" button (the request as a PDF made in the browser by a lazy jsPDF chunk, with a print fallback); the visitor gets no email. Book cards with an orderable print book (catalogue, carousels, author and collection pages) carry a bag button in the bottom right corner, level with the price, that adds one copy, with a hover tooltip. Bag counters (adds per book and per button, bags started, emptied and ordered) go to Workers Analytics Engine through `/api/evento` with no visitor identifier; `npm run stats:bag` reads them. The bag is `localStorage` (`multimage:bag`), with the `BagDrawer` on every page (on `/borsa` its primary is "Torna al modulo") and a button with the copy count in the header.
- Pagina 404 del sito (`src/pages/404.astro`): gli slug sconosciuti delle pagine di dettaglio fanno `Astro.rewrite('/404')`.
- Route interne (`/staff/*`, `/libri/schede/*`) sono gated in `src/middleware.ts`: senza la sessione editor (cookie JWT draft mode) rispondono **404** prima del render — vedi decisions-log `2026-05-31-editor-session-gating` (**S1**).
- `/diventa-socio` (the membership page; head, text, fee tiers, collaboration areas, `paymentNote` and `successText` come from the `membership` singleton): a benefit band (two free books, 30% off, a non-profit publisher), then a form (email, name, date and place of birth, address, fee tier with its amount, a required privacy consent; no payment method and no areas) with the `/borsa` styles (`src/styles/form.css`), client validation with a focused error summary, and lazy Turnstile (action `socio`). Two steps: the sign-up, then the confirmation, which shows the code `SO-YYMMDD-XXXX`, "Cosa succede adesso" in three steps, a client-only payment toggle (bank transfer with "Copia l'IBAN", or a prefilled PayPal link; the "Importo" row, causale and amount from the server's answer), a print button, a link to the catalogue, and an optional step "Vuoi anche darci una mano?" (collaboration areas with "altro") sent to the same `/api/socio`, bound to a one-time token, which updates the D1 row once and mails info@. The header button "Diventa socia o socio" (with `aria-current` on the page) and the "Soci: 30% di sconto" links lead here; `/info/adesioni` answers a 301 to it.
- `/designsystem` (since 2026-11-24, public, `noindex`, not in the sitemap, no page query): the design-system reference. It reads `DESIGN.md` at build time (`_tokens.ts`: front-matter tokens, colour roles, named rules, Do's and Don'ts) and renders colours (with the Cover Tint computed by `src/lib/colors.ts`), typography, spacing, shadows, buttons, chips and fields, `BookCard` (both variants), `Book3D`, the Book Cover Field, the bag button and the `/borsa` recap, `HomeDoors`, `AuthorCard` and `SupplierCard` with the site's own components and classes and sample data (covers in `public/design-samples/`). Linked from the `/staff` index.
- API routes: `/api/preview`, `/api/draft-mode/enable|disable`, `/api/preview-links`, `/api/seo-analysis`, `/api/post-deploy`, `/api/revalidate` (Vercel), `/api/ordine` (POST, the order: Turnstile, titles and prices re-read from the CDA, saved to D1, notice through `send_email`), `/api/socio` (POST, a membership request: Turnstile, fee and areas re-resolved from the CDA, saved to D1 `membership_requests`, notice to info@ through `send_email`), `/api/invalidate-cache` (Cloudflare: webhook `cda_cache_tags`, purge dei tag + reindex Site Search), `/api/utils` remain SSR-only endpoints even during static builds.
- Route helpers: `recordToWebsiteRoute` is used by `/api/preview-links` and `/api/seo-analysis` to resolve URLs from Dato records; the surgical revalidation map (`revalidationUrls.ts`) mirrors the api_key → route table by hand (index paths shared via `INDEX_PAGE_PATHS`).
- Known issues: (**S1** resolved — internal routes gated in middleware. **S4** resolved 2026-06-20 — `/llms-full.txt` removed.)

## CMS Data Loading
- Optional `DATOCMS_ENVIRONMENT` (`astro:env`, server): when set, `executeQuery` and `DraftModeQueryListener` read from that DatoCMS environment (e.g. a sandbox); unset = primary. The CDA tokens' role must allow sandbox access (Editor role opened to all environments on 2026-11-22), otherwise every page fails with `ApiError`.

- All GraphQL calls go through `src/lib/datocms/executeQuery.ts`, which swaps CDA tokens based on `includeDrafts`.
- Pages and layouts access data via collocated `_graphql.ts` modules that export both the query string and typed helpers; there is no global query registry.
- Draft Mode detection happens through `resolveDraftMode(Astro)` → `draftModeEnabledFromAstro`. `executeQuery` opts into `contentLink: 'v1'` + `baseEditingUrl` for Visual Editing when `includeDrafts` is true **and** `DATOCMS_BASE_EDITING_URL` is set; without the env (e.g. local dev) it serves drafts but skips Content Link to avoid the CDA 422.
- Editors enter draft mode through the DatoCMS Web Previews plugin (or `/api/preview?secret=...`). `enableDraftMode` sets a dual-cookie: the JWT app-level cookie + the Vercel-native `__prerender_bypass` cookie that bypasses CDN cache for the editor's requests (Vercel only). On Cloudflare the gateway entrypoint (`src/worker.ts`) forwards requests carrying the draft-mode cookie to the `Backend` entrypoint with `cache: "no-store"`, and the middleware never caches a draft request.
- Webhook `/api/revalidate` is called by DatoCMS on publish/unpublish/delete (webhook 33942). It now does **surgical** revalidation: `webhookPayload.ts` parses the payload (event_type, slug, model api_key from `related_entities`), and `revalidationUrls.ts` maps `api_key + slug` → the small set of affected URLs (~12–20 for a book, incl. its catalogue pages, sub-indexes, and its authors'/collection's detail pages; `home` → the home page; `index_page` → its index URL by slug; `supplier` → `/distributori`; `license` → its books' pages; `app` no-op). Unknown/unmapped models no-op. `?mode=full` still runs the whole-surface sweep via `getAllPublicUrls()`. After revalidating it re-spiders Site Search via `buildTriggers.reindex` (no rebuild). The ineffective in-memory debounce was removed (each call is cheap + idempotent). See decisions-log `2026-06-20-fot-reduction`.
- On Cloudflare, `executeQuery` asks the CDA for cache tags (`returnCacheTags`) and the middleware attaches them to the cached response; `POST /api/invalidate-cache` (DatoCMS `cda_cache_tags` webhook, Bearer `CACHE_INVALIDATION_WEBHOOK_SECRET`) purges them (`src/lib/datocms/cacheTags.ts`, `cacheInvalidation.ts`), falling back to the coarse `site` tag. Site Search is re-spidered once a day by the Worker's Cron Trigger (`scheduled` in `src/worker.ts`, 02:00 UTC), not on publish, and `robots.txt` disallows `/libri?` (2026-11-24, after the 2026-11-23 CPU limit hits). Decision: `docs/decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md`; switch-day runbook: `docs/guidelines/cloudflare-switch.md`.
- ISR `expiration` is **60 days** (safety net only; freshness is on-demand via the webhook — see `docs/guidelines/preview-mode.md`).
- Card grids use `RESPONSIVE_IMAGE_CARD_FIELDS` (no `base64`, no `srcSet`; `<Image srcSetCandidates={[1,2]}>` rebuilds a 2-candidate srcset client-side) to keep listing HTML — and thus FOT — small. `RESPONSIVE_IMAGE_FRAGMENT` (with base64 + srcSet) stays for hero/detail images.
- Partial pagination — `/libri` reads the catalogue in pages of 500 (faceted single page since 2026-11-22); `/autori`, staff exports and other `first: 500` reads remain (**CD2**).
- Caching audit and verification procedure: `docs/guidelines/caching.md`; ISR config and route baseline snapshot (reference for the V4 diff): `docs/work/archive/2026-11-04-upgrade-2026-11/baseline/`. On Vercel (production today) cache tags are not used and revalidation is URL-based; on the Cloudflare branch they are (V1–V3 of shape `cache-tags`). Open gaps are tracked as `Cache gap #n` in `docs/TODO.md`.
- Production runs on Cloudflare Workers since 2026-11-22 (`www.multimage.org` and apex as custom domains of the Worker `multimage-astro`, account Multimage, Workers Free). Pages are cached in the Workers Cache and purged by DatoCMS cache tags (**CD3**) through the webhook "Cloudflare cache tags" → `/api/invalidate-cache`; the ISR webhook 33942 is disabled. The Vercel deployment still exists but receives no traffic until **CF-vercel-cleanup**.

## Blocks & Components
- Home (`src/pages/index.astro`, rebuilt 2026-11-22): fixed top = `HomeHero` (book of the moment from `home.featured_book`, fallback first SingleBook block, then latest non-archived book) → `HomeDoors` → first `BookCarouselRecord`; then the other `home.banners` blocks in editor order (a pills block that only links to the three doors is skipped); `HomeAbout` closes the page. `featured_book` is queried separately (`HOME_FEATURED_BOOK_QUERY`) and fails soft on environments where migration `1795348395_addFeaturedBookToHome` has not run.

- CMS-driven blocks map to files under `src/components/blocks/**`. Each block pairs with a `_graphql.ts` fragment collocated with its consumer page.
- Structured Text renders through `src/components/datocms/structuredText/*`.
  - Record links and inline records resolve through `recordPath` (`src/lib/recordUrls.ts`); articles go to `/magazine/<slug>`.
  - The magazine passes inline records as `inlineRecordComponents`, plus a `link` node override that makes multimage.org URLs relative.
  - The magazine body field does not allow collection links: the query must not spread `CollectionRecord` in `links`, or the CDA rejects it and the page answers 500.
- `/magazine` (2026-11-22):
  - A slim title row, a category strip with a server filter (`?categoria=`) and flat entries.
  - 12 entries shown at first, then "Mostra altri".
  - All posts are read in pages of 100 (no 60 cap), sorted by `_firstPublishedAt`.
  - The Cloudflare worker keeps `?categoria=` in the cache key for `/magazine` only.
- `/magazine/[slug]`:
  - A left-aligned title row; the image whole; a 68ch column with headings shifted to h2.
  - Redesigned book and author blocks.
  - "Altre <categoria>" (`MAGAZINE_RELATED_QUERY`) and "Torna al magazine".
- UI primitives such as `Button`, `Card`, `SectionIntro`, and `BookCarouselSection` live under `src/components/ui` and expect Tailwind utility classes.
- Draft-mode specific UI (`DraftModeQueryListener`) sits under `src/components` and is conditionally rendered based on the cookie helper in `~/lib/draftPreview`.

## Assets

- Fonts: `src/styles/global.css` imports Inter + Playfair Display from Google Fonts; defined once in `@theme` (`--font-sans`/`--font-serif`). No local font files.
- Icons: `iconify-icon.min.js` loaded from CDN via `BaseLayout`. No tree-shaking or local sprite.
- Third-party scripts: BaseLayout injects Google Analytics and Iubenda (Vercel Analytics and Speed Insights removed on 2026-11-22); CSP/SRI hardening is open (**S3**).
- Images: every CMS-driven image goes through `@datocms/astro/Image`. Hero/detail images use the full `RESPONSIVE_IMAGE_FRAGMENT` (with `base64` blur-up + DatoCMS `srcSet`). Card/thumbnail grids use the lean `RESPONSIVE_IMAGE_CARD_FIELDS` (no `base64`/`srcSet`; flat `bgColor` placeholder + `srcSetCandidates={[1,2]}`) to keep listing HTML small (Fast Origin Transfer). Header/footer logos are still remote PNGs without intrinsic dimensions.
- Videos: `VideoBlock.astro` handles YouTube/Vimeo/native MP4 from Structured Text blocks.
- Generated bundles: `npm run prebuild` emits `public/generated/search-page.client.js` and `public/generated/swiper-element.js`. Missing bundles break `/cerca` and `BookCarouselSection` (**PS1**).
- HTML sanitization: home hero copy, Banner sections, supplier bios, and staff notices call `toRichTextHtml`/`set:html` without render-time sanitization (**S2**, partial). Input-side mitigation relies on restricted WYSIWYG toolbars. As of 2026-05-31 **no WYSIWYG field carries the `sanitized_html` validator** (removed from all 16 fields after it re-surfaced on 7 and blocked saves / caused dirty-form loops — see decisions-log §4); anti-spurious-HTML protection lives exclusively at the editor/toolbar layer.

## SEO

- Canonical base URL: `astro.config.mjs` sets `site = 'https://www.multimage.org'`; `PUBLIC_SITE_URL` must also be present (**SEO1**).
- Meta defaults come from `src/lib/seo.ts`, which merges page-specific SEO fields from Dato with fallback copy; Structured Data is not yet implemented (**SEO2**).
- `sitemap.xml.ts` pulls data via GraphQL and prerenders during builds; limited to single-locale `it` URLs.
- Open Graph/Twitter tags reuse the SEO helper and Dato fields; no image fallback beyond Dato-provided ones.

## Search

- Uses DatoCMS Site Search. `/cerca/index.astro` renders an accessible form and lazy-loads `public/generated/search-page.client.js`.
- The bundled client applies debounced queries and type filters (Libri, Autrici/Autori, Magazine, Collane e pagine), and expects configuration via `data-*` attributes. Missing config fails silently (**CH2**).
- Since 2026-11-22 the results are flat rows: clean title, a type or book meta line, the excerpt.
  - Books show their cover, authors, year, format and price from `/search-books.json`, with print and ebook merged into one row.
  - The real total is shown and "Mostra altri risultati" loads the next page.
  - The empty and no-result states offer ways on.
  - Header, footer and newsletter band carry `data-datocms-noindex`, which takes effect after the next crawl (TODO **SEARCH-rescan**).
- Search results rely on highlight snippets; client-side code escapes `[h]...[/h]` markers into `<mark>` elements before injecting HTML.

## Security

- Preview endpoints rely on JWT-signed cookies (`SIGNED_COOKIE_JWT_SECRET`) plus `SECRET_API_TOKEN`. Cookies are `secure`, `sameSite='none'`, and partitioned.
- Internal routes (`/staff`, `/staff/archivio-catalogo`, `/libri/schede/*`) are gated in `src/middleware.ts`: a request without the editor session (signed draft-mode JWT cookie) gets a flat 404 before render. The cookie doubles as the editor session (drafts + staff access + affordances), expires after 30 days, and is activated via the existing magic link. (**S1** resolved 2026-05-31 — see decisions-log.)
- `/api/ordine` fails closed (503 without keys outside dev), verifies Turnstile, re-reads titles and prices from the CDA, saves the order to D1 (code retried once on a clash), notifies `ordini@` through `send_email` and is rate limited by a Cloudflare WAF rule: see `docs/guidelines/security.md` § Order endpoint.
- `/api/socio` mirrors `/api/ordine` (fail closed 503, 8 KB cap, Turnstile action `socio`, fee and areas re-resolved server-side, D1 insert with a code retry, one email to info@; it also takes the optional collaboration step, see `security.md`) and collects more personal data (date and place of birth, address): the same WAF rate limit covers it; see `docs/guidelines/security.md` and TODO **BORSA-privacy**.
- `/llms-full.txt` (full catalogue + biographies in plaintext) was **removed** 2026-06-20, closing **S4**.
- `/api/post-deploy` accepts arbitrary requests and can leak preview secrets; needs retirement or auth (**S5**).
- Inline HTML renderers (`toRichTextHtml`, `set:html`) lack render-time sanitization, leaving XSS exposure (**S2**, now partial). Mitigated at input across WYSIWYG fields via restricted toolbars that strip paste-from-Word at source. The `sanitized_html` save/validation-time validator was removed from **all** WYSIWYG fields (2026-05-31) — it either looped (sanitize-on-save) or blocked saves (validate-only) and never coexisted with a WYSIWYG cleanly. Legacy values and other surfaces still unsanitized at render — see `docs/decisions-log/2026-05-30-isr-cutover-fixes.md` §4.
- CSP/SRI headers are not enforced (**S3**).
- Secrets live outside the repo; `astro.config.mjs` validates required env fields at build time.

## Performance

- Production ships pure static HTML + assets; preview runs SSR from the same codebase.
- Images use Imgix transformations with AVIF/WebP fallbacks; hero/detail keep base64 placeholders, card grids dropped them (flat `bgColor` only) to shrink listing HTML. Hero sections still request large crops.
- Search bundle loads only on `/cerca`; Swiper's custom element can be heavy on first interaction.
- No Core Web Vitals monitoring since Vercel Analytics and Speed Insights were removed (2026-11-22); no custom RUM instrumentation.

## Testing

- Commands: `npm run format` (Prettier write), `npm run lint` (Prettier check), `npm run build` (`astro check` + build single output), `npm run test` (format → lint → build).
- No automated unit, integration, E2E, or accessibility tests. Manual QA happens locally or via Vercel preview URLs.
- Pending: **CH2** (search config assertions), **TC1** (CI workflow), **TC2** (search client tests).
- DatoCMS mocking strategy not defined; recommendation is to use real CDA in preview environments only.

## Code Health

- Formatting: Prettier + `prettier-plugin-astro`; no ESLint config.
- `npm run test` chains format → lint → dual build (no jest/playwright suites).
- Known refactors: **CH1** (extract CSV exporter to helper), **CH2** (search config assertions).
- `tsconfig.json` uses path aliases (`./`-relative, no base directory option); `allowImportingTsExtensions` enabled for `_graphql.ts`.

## Operations

- Hosting: **un solo progetto Vercel** con `output: 'server'` + ISR. Anonymous → CDN cache. Editor con draft cookie → CDN bypass + SSR + Visual Editing. Sul branch `chore/cloudflare`: Worker `multimage-astro` nell'account Cloudflare Multimage (`npm run build:cf` / `deploy:cf`, URL di prova `multimage-astro.matteo-59f.workers.dev`), Workers Cache + cache tag; il passaggio del dominio segue `docs/guidelines/cloudflare-switch.md` (non ancora eseguito).
- Required env vars: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `BYPASS_TOKEN`, `DATOCMS_BASE_EDITING_URL`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`; solo Cloudflare: `CACHE_INVALIDATION_WEBHOOK_SECRET`; `SITE_SEARCH_BUILD_TRIGGER_ID` e `DATOCMS_CMA_TOKEN` sono anche variabili runtime su Vercel e arrivano sul Worker il giorno del passaggio. (`SERVER` rimossa.)
- Order keys (all optional; a missing Turnstile secret, or neither binding, means `/api/ordine` answers 503 and `/borsa` shows the email box after a submit; a missing site key shows the email box at once): `TURNSTILE_SECRET_KEY` (Worker secret), `PUBLIC_TURNSTILE_SITE_KEY` (public, inlined at build, set last); bindings in `wrangler.jsonc`: `ORDERS` (D1 `multimage-orders`) and `ORDER_MAIL` (`send_email`). Going live: `docs/work/archive/2026-11-24-borsa/setup-borsa.md`.
- Membership endpoint (`/api/socio`): the `MEMBERSHIP_MAIL` `send_email` binding (mailbox info@multimage.org, verified in Email Routing) and the D1 table `membership_requests` (migrations 0004 and 0005) beside the order ones; it shares `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY` and the WAF rate limit rule. Details: `docs/guidelines/operations.md`.
- `npm run dev`/`start` auto-runs `npm run sync-datocms` (schema generation).
- Preview workflow: editors hit `/api/preview` or the Web Preview plugin to enable draft cookies, then browse the preview deployment for live drafts.

## Dependencies

- Core: Node 24.x (`.nvmrc`, `engines`), Astro 7.4.7 (`compressHTML: true` pinned), Tailwind 4.3.5 (via `@tailwindcss/vite`, no PostCSS), TypeScript 6.0.3, `@astrojs/vercel` 11.0.20 con ISR, `@astrojs/cloudflare` 14.4.9, `wrangler` 4.147.0, `@datocms/astro` 0.6.16, `@datocms/cda-client` 0.3.2, `@datocms/cma-client` 6.8.0, `@datocms/content-link` 0.3.23 (Visual Editing), `datocms` (CLI) 4.2.0.
- Tooling: Prettier 3.9 + `prettier-plugin-astro` 1.1, esbuild 0.28, dotenv-cli 11.1.
- Client bundles: Swiper 14.4.0 (pinned exact), Iconify CDN.
- Known debt: still shipping GA UA snippet; no automated dependency audit; `experimental.svgo` not yet evaluated (**P1**); `path-to-regexp` ReDoS (GHSA-9wv6-86v2-598j) ancora aperto (`npm audit --omit=dev` lo elenca) come transitive di `@vercel/routing-utils@6.6.1` (`path-to-regexp@6.1.0`) — upstream issue, attende patch da Vercel; TypeScript 7 deferred (decisions-log/2026-11-04-defer-typescript-7.md).

## Accessibility

- Pages use semantic landmarks through `BaseLayout.astro`, with a "Vai al contenuto" skip link to `<main id="contenuto">`.
- Keyboard focus: one global `:focus-visible` outline (navy, white on the header and footer via `--focus-ring`); see `docs/guidelines/blocks-and-components.md` § Focus and colour contrast.
- `BookCarouselSection`: pagination bullets are display-only (`pagination-clickable="false"`, out of the tab order), no extra `aria-live` on the container; Swiper's a11y module brings a focused slide into view.
- Interactive blocks (search form, `BookCarouselSection`, staff tables) expose ARIA labels but have not been validated with screen readers (**A11Y1**).
- Color contrast: home-page actions fixed on 2026-11-22 (orange CTA → `brand-orange-deep`, newsletter green #2e7d32, footer links `brand-mist`, placeholders `brand-slate`). Banner colours come from CMS images and can still fall below AA (**HOME-banners**). Last critique snapshot: `.impeccable/critique/`.
- Bag drawer, `/borsa` (empty, filled, field errors, member with rapid shipping (before the buyer collection), drawer open) and the success state: axe-core (WCAG 2.2 A/AA plus best practices) found no violations from `/borsa` code at 390px and 1280px on 2026-11-24 (only the site-wide Footer `link-in-text-block` and NewsletterCta `region` findings), with no horizontal overflow. The drawer is a native modal `<dialog>` with a persistent live region; on a failed check the form focuses its `role="alert"` error summary, which lists each invalid field as a link that focuses it. VoiceOver pass pending (**BORSA-voiceover**).
- No Playwright/Cypress suite to prevent regressions.

## i18n

- Site is permanently Italian-only. No alternate locales, language switchers, or translated slugs.
- All URLs canonicalized to `https://www.multimage.org`. No `hreflang` tags beyond default `it-IT` meta.
- Future localization work is paused indefinitely.
