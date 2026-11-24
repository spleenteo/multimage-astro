# V2 packet — work diventa-socio

Repo: /Users/spleenteo/Sites/multimage/multimage-astro, branch work/diventa-socio. Effective test level: essential (no test runner; checks = gate + the Done runs). Owner: run all slices without stopping unless something is really serious.

## Context and slice section (slices.md)

## Context

- **Singleton** `membership` on the primary environment `home-featured-book` (backup env `bkup-2026-11-24`): live fields `slug` (`diventa-socio`), `seo`, `title`, `subtitle` (HTML text), `content` (structured text). The record `D-sTlquHR7GiqaEOpMA80w` is published. The committed `schema.ts` is stale (shows `title` + `description`): regenerate before writing queries.
- **Form fields** (owner's list): email, first name, last name, date of birth, place of birth, address line 1, address line 2, city, state/province/region, postal code, country (default Italia), fee type (one of the CMS tiers, e.g. "10€ — Studente under 25"), payment method (bonifico | PayPal), collaboration areas (checkboxes from the CMS, "altro" with free text). Plus a required privacy consent with membership-specific wording, since the form collects date of birth and address.
- **Mailbox**: info@multimage.org, through a new `send_email` binding. Added as an Email Routing destination on 2026-11-24, **unverified** until the owner clicks the link sent to info@.
- **Record**: every request also saved in D1 (`multimage-orders`). No retention rule (owner, 2026-11-24).
- **Old page**: `/info/adesioni` (CMS `page` record, in header and footer menus) gets a 301 to `/diventa-socio` (owner, 2026-11-24).
- **Rate limit**: the zone's one Free-plan rule covers only `/api/ordine`.

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


## V1 outcome (for interfaces)
### V1 — done on 2026-11-24

The schema change went in on the primary environment through the CMA, as the owner chose: two blocks and four fields on `membership`, nothing renamed or deleted. The record was seeded and published in one go: three fee tiers (two of them assumed, to be confirmed), seven areas, `payment_note`, `success_text` and a rewritten `content` with no Mailchimp link, no IBAN and no fees in the prose. Every text is copied into the ledger under T2 for the owner. `/diventa-socio` renders from the published singleton with draft mode wired in. Its form markup, client validation, error summary and lazy Turnstile reuse `/borsa`'s styles (`src/styles/form.css`) and helpers (`src/lib/form.client.ts`), and `/borsa` refactored onto them without a behaviour change found in review. Rulings, all read from the ledger: subagents got the packet by path, not inline. T8 also fixed five stale expectations in the revalidation-map check, left behind by the earlier catalogue-filter work, so the check is green. T5's two-commit history was accepted. T6 swapped an internal Astro import for a new `EmptyBlock.astro`. The final review's browser and docs items were deferred to the conductor. Process slips: one review caught a `~/styles` import that broke the build, because the executor committed without building, and two commits went in before prettier. Owner follow-ups: confirm the "Studente under 25" and "Disoccupato" tiers (and a paired form for "Disoccupato"), the "Provincia" label for foreign addresses, the placeholder subtitle "bla bla" and the empty `seo`. Do not deploy V1 before V2, since the form cannot send yet.

Pending at close (conductor, browser): /diventa-socio form behaviour in a browser; draft-on load in the owner's session; /borsa and /designsystem unchanged in a browser.


Live record ids (published): fees Ordinaria 20 WrjeoCkCQoq2KQGUhsCrcg; Studente under 25 10 LY2eNn_KSG20yyYZwhD_PA; Disoccupato 10 DuCMDkmySmCrbey2VIbAPg. payment_note line 1 = causale base ("Quota associativa Multimage"), following lines = instructions. V1 plan: docs/work/2026-11-24-diventa-socio/V1-plan.md (markup contract in T6 Interfaces); V1 ledger: docs/work/2026-11-24-diventa-socio/V1-ledger.md (T7 review notes: send areasOther '' unless altro is checked).

## lessons.md
# Lessons — diventa-socio

- Before committing, run `npm run build` (not only prettier or a selector count): a `~/` alias exists only for the folders in tsconfig `paths` (components, layouts, lib, pages, schema), so `src/styles` is imported by relative path.
- Run `npx prettier --write` on the touched files before the commit, not after, so the formatting lands in the same commit instead of a second "Format …" commit.
- When a check script fails on cases the task didn't touch, find the commit that changed the behaviour and confirm the intent in the guidelines before you align the expectations, and align them in a separate commit.
- Never import from `astro/runtime/...` to build a component inline: add a real `.astro` file, even an empty one, and ask to widen Files.
- Executors cannot run `dotenv -e .env` (auto mode denies it): plan live CDA checks as conductor checks against the running dev server, GET only.

## Matching decisions (descriptions)
- docs/decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md — On Cloudflare, Workers Cache behind a cache-off gateway entrypoint, with DatoCMS cache tags purged by webhook; no Vary: Cookie, no site-wide purge.
- docs/decisions-log/2026-05-31-editor-session-gating.md — The draft-mode cookie becomes a single "editor session" and the one authorization boundary for all internal routes (S1, CWE-200).

## Project lenses
none (docs/impact-lenses.md absent)

## Preset rules

### stack-astro

1. Pages are static by default; opt a route out with `export const prerender = false` only when its data is per request (session, query string, preview), because static output is the cheapest and most cacheable.
2. Set `output` once in `astro.config.*` and keep it; do not mix per-route overrides in both directions, because two defaults make the rendering mode of a route impossible to read.
3. Components are `.astro` unless they need client state or events; a framework component gets a `client:*` directive only for that interactivity, because every island ships JavaScript.
4. Prefer `client:idle` over `client:load`, and `client:visible` for below-the-fold parts only, and never `client:only` without a reason written in a comment, because eager hydration costs the first paint.
5. Content comes through typed queries (content collections with a schema, or generated types for a CMS), never untyped `fetch` in a page, because a renamed field must fail the build, not the page.
6. Declare environment variables with `astro:env` (`envField`, context `server`, access `secret`) in Astro 5; `import.meta.env` is replaced at build, so it cannot supply runtime secrets on SSR routes. Only public client variables (`PUBLIC_`) may reach client code, because anything else leaks into the bundle.
7. Local images go through `astro:assets` (`<Image />`, `<Picture />`) with explicit `alt` and dimensions; CMS assets go through the CMS preset's component; remote images through `astro:assets` need `image.domains` or `remotePatterns`; fonts are self-hosted, because remote assets add requests and layout shift.
8. Set `lang` and `dir` on the root element from the route's locale, and use logical CSS properties (`margin-inline-start`) over physical ones, because right-to-left locales break otherwise.
9. Client scripts that must survive navigation re-attach on `astro:page-load` when the site uses `<ClientRouter />`, because the router replaces the DOM and loses listeners.
10. Generate the sitemap and `robots.txt` from the config (`@astrojs/sitemap`, an endpoint), with `site` set, because hand-kept lists drift from the routes.
11. Keep dynamic routes explicit: `getStaticPaths` returns every locale and slug, and unknown paths hit a real 404 page, because a silent empty page returns 200.
12. Take adapters and hosting limits (bundle size, build time, route count) into account before adding a route-generating feature, because the host fails the deploy, not the build.


### stack-datocms

**CLI**

1. Work on the project through the DatoCMS CLI (`datocms`), linked once per repo (`datocms link`, which writes `datocms.config.json`), because schema, environments and migrations then run the same way for everyone and in CI.
2. Before planning a schema change, read the live schema with `datocms schema:inspect` instead of guessing it from the code, because the code shows only the fields it queries.
3. For API details and examples, use the DatoCMS skills when the session has them (References), else `datocms cma:docs` and the docs at datocms.com, never memory, because the API changes and remembered option names drift.

**Environments**

4. Change the schema in a sandbox, never by hand on the primary environment: `datocms migrations:run` forks the primary into a sandbox (`--destination`) and runs the pending migrations there; `datocms environments:promote` makes it primary once reviewed, because the primary serves production.
5. Run migrations in place on the primary (`--in-place --allow-primary`) only for strictly additive changes, because a run that fails halfway has no rollback.
6. Pass the environment to every client explicitly, from a variable the app reads, and keep production reads on the primary, because a sandbox returns different content without any error.
7. Keep the CMA token and the draft read token server-side and out of git, because one writes and the other reads unpublished content.

**Schema**

8. Every schema change is a migration script (`datocms migrations:new <name>`, or `--autogenerate=<sandbox>` to diff a sandbox built in the dashboard) committed with the code that uses it, because a migration is reviewable and replayable.
9. Query types come from the schema (`datocms schema:generate`, `gql.tada` or GraphQL Code Generator) and are checked in CI, because a field renamed in the CMS must fail the build, not the page.
10. Treat optional and localized fields as nullable in the code, because an untranslated or half-filled record returns `null`, not a fallback.

**Naming**

11. Name models for what they hold, not for how a page shows them, because the same content is reused by other pages and other apps.
12. Pages are regular models named `… Page` (`Home Page`, `Product Page`); reusable blocks are named `… Block` (`Text Block`, `Newsletter Signup Block`); the API key is the snake_case of the name (`newsletter_signup_block`) and matches the component's name in the code, because one name then finds the model, the block and its renderer.
13. Name fields by data type first (`slug`, `image`, `color`), then by function (`title`, `autoplay`), and by appearance only through `layout` and `style`, because names tied to a design break when the design changes.
14. Use the standard field names: `title` (not `heading`), `subtitle`, `slug` (built from `title`), `text` for structured text (not `body` or `content`), `blocks` for a modular content field, `items` for a list of the same block, `image` / `images`, `video`, `page` / `pages` for links to page models. A second field of the same type is named by its function (`background_image`). A boolean is named by its function (`autoplay`, `loop`), never by its look (`is_gray`), because a boolean means nothing without context.
15. Control appearance with two fields: `layout` (position, size, direction: `full-width`, `image-text`, `text-image`) and `style` (visual variant: `default`, `highlighted`), each a string with only allowed values, or `style` a link to a Style model when variants are shared across models, because a new variant is then a new value, not a new field or block.


## docs/development-guidelines.md
# Development guidelines

Read whole by `/flow:dev` in every plan, review, execution and close. Prose guidance per concern lives in `docs/guidelines/`.

## References

- Astro docs (docs.astro.build) for directives and APIs.
- DatoCMS skills, when in session: `datocms-cli` (CLI, migrations, environments, schema), `datocms-cda` (queries, cache tags, type generation), `datocms-frontend-integrations` (draft mode, Content Link, components), `datocms-structured-text`, `datocms-content-modeling`. Otherwise `datocms cma:docs` and datocms.com — never memory.
- Project conventions: `CLAUDE.md` and `docs/guidelines/`.

## Tests

Level: essential
Sensitive areas: `src/pages/api/` (revalidate, draft-mode, post-deploy), `src/middleware.ts`, draft mode and editor session, `src/lib/datocms/` (queries, fragments, revalidation map), `scripts/`

No test runner is configured: `npm test` runs format + lint + build, so it rewrites files. Verification is the gate below plus a working deploy.

## Gate

- `npm run lint` (prettier check)
- `npm run build` (runs `astro check` then `astro build`; needs the local `.env`)

## Guidelines

### docs/guidelines/accessibility.md
---
description: aims to provide an accessible baseline, by providing helper classes and components
---

# Accessibility (a11y)

## Best practices

aims to stay close to the web standards. Here's a few tips to help keep it accessible:

- Use semantic HTML as a baseline.
- Use [media queries for a11y](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries_for_accessibility) like `prefers-reduced-motion` and `prefers-contrast`.
- Use native elements for interaction like `<form>`s, `<label>`led `<input>`s, `<output>`s, `<dialog>`, `<details>` with `<summary>` and native API's like the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).
- Add relevant ARIA roles and attributes on custom interactive components.
- Require `alt` texts on assets in the CMS and use their value in templates.

### docs/guidelines/cms-data-loading.md
---
description: GraphQL data loading conventions and patterns for Multimage.
---

# CMS Data Loading

## Core helper: `executeQuery`

All GraphQL calls go through `src/lib/datocms/executeQuery.ts`. It wraps `@datocms/cda-client` and selects the correct token automatically:

```ts
import { executeQuery } from '~/lib/datocms/executeQuery';

const result = await executeQuery<MyQueryType>(MY_QUERY, {
  variables: { slug: 'my-slug' },
  includeDrafts: false,     // default false; true in preview mode
  excludeInvalid: true,     // default true
  environment: 'sandbox',   // optional; omit for default environment
});
```

Token selection:
- `includeDrafts: false` → `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`
- `includeDrafts: true` → `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (required in preview deployments)

## Query colocation

Every page or component that fetches data keeps a sibling `_graphql.ts` that exports the query string and TypeScript helpers:

```
src/pages/libri/[slug]/
├── index.astro        ← consumes the query
└── _graphql.ts        ← exports query string, fragments, and typed helpers
```

Shared fragments (e.g. `ResponsiveImageFragment`, `BANNER_SECTION_FRAGMENT`) are defined once and re-exported from the component's `index.ts` to keep import sites tidy.

## Draft mode integration

In `.astro` files that support preview, resolve draft mode before executing queries:

```ts
import { resolveDraftMode } from '~/lib/draftPreview';

const { isEnabled: includeDrafts } = resolveDraftMode(Astro);
const data = await executeQuery(QUERY, { includeDrafts });
```

Draft mode is active per request, when the signed draft-mode cookie is present. On Vercel the ISR copy is skipped through `__prerender_bypass`; on Cloudflare the gateway sends the request with `cache: 'no-store'` and the middleware makes the response private. Without the cookie, requests use published content.

## Pagination

There is currently no paginated loader. Routes like `/libri`, `/autori`, and `/sitemap.xml` use `first: 500` as a workaround. This is a known gap tracked as **CD2** in `docs/TODO.md`.

Until a paginated helper ships: keep `first: 500` and annotate it with `// TODO CD2`.

## Fragment conventions

- Name fragments after their owning component: `BookCardFragment`, `AuthorCardFragment`
- Place fragments in the component's `_graphql.ts` or `index.ts`
- Compose fragments at the page-level `_graphql.ts`
- Never duplicate field selections — always reference the fragment
- Never include fields ending in `_private`

## Error handling

`executeQuery` propagates errors from `@datocms/cda-client`. Failures fail the request during the per-request render (desired — fail fast), surfacing as Astro error pages. Nothing is rendered at build time (ISR).

## Type generation

Types come from `schema.ts`, managed by `npm run generate-schema`. Import CMS types from `~/lib/datocms/types`. Never write CMS types by hand.

## Cache tags (Cloudflare only)

Cache tags drive the Workers Cache on the Cloudflare target (branch `chore/cloudflare`). Vercel production does not use them: it revalidates by URL, see `docs/guidelines/caching.md`.

- `executeQuery` feeds a per-request store. On Cloudflare the middleware opens it for GET requests outside `/api`; a published query then runs through `rawExecuteQuery` with `returnCacheTags` and adds the response's `x-cache-tags` to the store. On Vercel there is no store and the query runs as before.
- A draft query (`includeDrafts: true`) marks the store disabled: the page becomes `private, no-store`, never cached.
- `BaseLayout` passes `cacheTagScope: 'layout'` on its site query. That flag tells the middleware the page carries the layout's tags (menus, favicon), so a page publish purges it. Pass it only from the layout.
- Queries never call `cache.set` or `cache.invalidate`: the middleware makes the one cache decision after the response, and `POST /api/invalidate-cache` purges. A new query needs nothing: its tags are collected automatically.
- Code: `src/lib/datocms/cacheTags.ts`, `executeQuery.ts`, `cacheInvalidation.ts`. Check with `npm run check:cache-tags`. Policy, limits and purge answers are in `caching.md`.

### docs/guidelines/operations.md
---
description: Describe how Multimage is built, deployed, and configured across environments.
---

# Operations Runbook

## Deployments

- **Two targets, one codebase.** Vercel is production today; Cloudflare Workers is the target on branch `chore/cloudflare`, chosen at build time by `DEPLOY_TARGET` (`astro.config.mjs` picks `@astrojs/vercel` or `@astrojs/cloudflare`; unset means Vercel). The switch is a one-off procedure: `docs/guidelines/cloudflare-switch.md`.
- **Vercel**: link the repo, sync environment variables, and run `npm run build`. The site is one deployment running `output: 'server'` with ISR (`@astrojs/vercel`): every route is rendered per request and cached by the Vercel CDN, nothing is prerendered at build time. Draft Mode (the signed JWT cookie plus Vercel's `__prerender_bypass` cookie) bypasses the cache on the same deployment, so there is no separate static/preview split.
- **Cloudflare** (`DEPLOY_TARGET=cloudflare`): a Worker `multimage-astro` in the Cloudflare account "Multimage" (`account_id` in `wrangler.jsonc`), trial URL `https://multimage-astro.matteo-59f.workers.dev` (`workers_dev` and `preview_urls` are on). Entry `src/worker.ts` is a gateway that forwards every request to the `Backend` entrypoint, which runs the Astro handler behind Workers Cache (see `preview-mode.md` § 1 and `caching.md`).
  - Build and deploy with the env file (the build validates the secrets, `validateSecrets`): `npx dotenv -e <ENV_FILE> -- npm run build:cf` to build only, `npx dotenv -e <ENV_FILE> -- npm run deploy:cf` to build and deploy. The env file holds production secrets: keep it outside the repo and never print it.
  - Every Cloudflare build rewrites `.wrangler/deploy/config.json`; `.wrangler/` is in `.prettierignore` so `npm run lint` stays green.
  - Logs: `npx wrangler tail multimage-astro --format json`; useful fields are `cpuTime`, `wallTime`, `entrypoint` and `event.request.url`. The tail drops events under a burst: count outcomes from HTTP answers, use the tail for per-page fields.
  - Files under `public/` are served by Workers Assets before the Worker runs: the middleware cache policy never applies to them and they leave no tail event. Set their headers with `_headers`.
- Vercel builds on Node 24.x with the Vercel project Node setting kept on 24.x to match `engines.node` (`24.x`) in `package.json` and `.nvmrc` (local work). `.vercelignore` keeps `.env*` (plus `dist/`, `.astro/`, `.claude/`) out of CLI uploads (`vercel deploy`).
- `npm run dev` chains `npm run sync-datocms` before `astro dev`, ensuring `schema.ts` and `docs/DATOCMS.md` stay in sync when `DATOCMS_API_TOKEN` is available.
- `npm run prebuild` currently rebuilds the Site Search client before `npm run build` invokes `astro check` and the production build.
- Local checks use `astro dev` (`npm run dev`). `astro preview` does not work with `@astrojs/vercel`, so no preview script is provided. ISR caching is a Vercel CDN feature and Workers Cache runs only on a deployed Worker, so neither is active locally; see `docs/guidelines/caching.md` for the revalidation checks. Under an AI agent, Astro 7 `astro dev` starts in the background (stop it with `npx astro dev stop`), and `--ignore-lock` keeps a one-off foreground server.
- `tmp-sample/` is a read-only Astro starter kept in the repo for reference. It is excluded via `tsconfig.json` so `astro check`/`npm run build` ignore its missing React dependencies.

## Environment & Secrets

- Required env vars on Vercel: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, and `NODE_ENV=production`. `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID` are runtime variables on Vercel too (Site Search reindex in `/api/revalidate`, `/api/seo-analysis`): without them the reindex is off and SEO analysis returns 500. The CLI-only `DATOCMS_API_TOKEN` can remain local unless schema generation runs in CI. `BYPASS_TOKEN` is Vercel-only (ISR bypass and revalidation header).
- Worker secrets on Cloudflare (set with `wrangler secret put <NAME>`, see `security.md`): `CACHE_INVALIDATION_WEBHOOK_SECRET`, `DATOCMS_BASE_EDITING_URL`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DRAFT_MODE_COOKIE_NAME`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`. There is no `BYPASS_TOKEN` on the Worker. `DATOCMS_CMA_TOKEN` (SEO analysis, Site Search reindex) and `SITE_SEARCH_BUILD_TRIGGER_ID` are set on switch day, not on the trial Worker.
- Order endpoint keys and bindings (`/api/ordine`, see `security.md` § Order endpoint): `TURNSTILE_SECRET_KEY` is a Worker secret (`wrangler secret put`, optional: unset means `/api/ordine` answers 503). Orders go to the D1 binding `ORDERS` (database `multimage-orders`, jurisdiction eu) and the notice through the `ORDER_MAIL` `send_email` binding, both declared in `wrangler.jsonc` (setup: `docs/work/archive/2026-11-24-borsa/setup-borsa.md`). `PUBLIC_TURNSTILE_SITE_KEY` is public and inlined at build like `PUBLIC_SITE_URL`, so it lives in `.env.cloudflare` and needs a `deploy:cf` to take effect; set it last, after the secret (until it is built in, `/borsa` shows the email box). Neither is needed on Vercel (no traffic).
- WAF rule, a prerequisite before setting `TURNSTILE_SECRET_KEY`: one Cloudflare rate limiting rule (Free plan: one rule, 10 s period, 10 s block) on expression `(http.request.uri.path eq "/api/ordine")`, counted per IP, 2 requests per 10 s, action Block. The Free plan likely offers only Path and Verified Bot fields, so no Method condition (GETs count too, harmless); confirm field and period options in the dashboard. Check with bare `{}` POSTs, which answer 404 until the order code is deployed and 400 after it, and save nothing; the 429 proves the rule. Steps: `docs/work/archive/2026-11-24-borsa/setup-borsa.md`.
- `datocms.json` enumerates the CDA/CMA tokens used during automation; keep it updated when tokens rotate so `vercel env pull` stays in sync.
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` ships to the browser; provision it from a role limited to **Perform Site Search API calls** to prevent privileged access. See `docs/guidelines/security.md` for scoping details.
- Runtime also reads standard flags (`NODE_ENV`, `CI`, `CONTINUOUS_INTEGRATION`, `VERCEL`). Only set what the deploy target actually needs to keep the surface minimal.
- `PUBLIC_SITE_URL` powers sitemap generation and absolute links; missing values break `/src/pages/sitemap.xml.ts`. It is inlined at build time, so the Cloudflare build must run with the production value in the env file.

## Preview & Drafts

- `/api/preview` ora gestisce l’ingresso in Draft Mode firmando il cookie e reindirizzando alla rotta desiderata. `/api/draft-mode/enable|disable` vengono usate dal plugin DatoCMS Web Previews per generare i link “Draft/Published”.
- `executeQuery` accetta `{ includeDrafts: true }` e grazie a `resolveDraftMode(Astro)` (vedi `~/lib/draftPreview`) legge i cookie su ogni richiesta: il cookie di Draft Mode fa saltare la cache ISR sulla stessa deployment.
- `/api/post-deploy` è invocato automaticamente da Vercel (via `datocms.json`) ed è **solo Vercel**: su Cloudflare non esiste un hook di deploy equivalente, quindi plugin e URL di anteprima si controllano a mano nel passo 9 di `docs/guidelines/cloudflare-switch.md`. Si occupa di installare/aggiornare plug-in ufficiali DatoCMS:
  - **Web Previews** → aggiunge due frontends (Production + Preview) che puntano a `/api/preview-links?token=...`.
  - **SEO/Readability Analysis** → punta `htmlGeneratorUrl` al `/api/seo-analysis` dell’ambiente corrente.
  Se il post-deploy fallisce (es. perché il plug-in è già installato con permessi diversi) puoi rilanciarlo manualmente con `curl -X POST <deploy-url>/api/post-deploy -H 'Content-Type: application/json' -d '{"datocmsApiToken":"<CMA>","frontendUrl":"<deploy-url>"}'` (usa un CMA token “Admin”).

## Monitoring & Logging

- Client monitoring uses Google Analytics (legacy UA) only; Vercel Analytics and Speed Insights were removed on 2026-11-22, on both targets.
- Server side: on Vercel there is no logging or alerting beyond `vercel logs`. On Cloudflare, Workers observability is on (`observability.enabled` in `wrangler.jsonc`: logs in the dashboard, `wrangler tail` live).
- Order endpoint: `npx wrangler tail multimage-astro --format json` shows the `[ordine] <status> <code>` lines (counts only, no personal data). Notices that did not go out are found in D1, not in a mail dashboard: run the `notify_status <> 'sent'` query of `d1/README.md` (`wrangler d1 execute multimage-orders --remote`) at least weekly.
- Site Search reindex (since 2026-11-24): a Cron Trigger on the Worker, daily at 02:00 UTC, logs `[site-search] cron: reindex triggered 200` (or `failed <status>`, or `skipped` when the token or the trigger id is unset). Workers Observability also shows the `DatoCmsSearchBot` crawl that follows. To find CPU limit hits, query Workers Observability with `cf observability telemetry query --body @file`, grouping by `$workers.outcome` (`exceededCpu`) and `$workers.event.request.url`.
- Bag counters (since 2026-11-24): every add to the bag, every first book in an empty bag, every bag emptied by hand and every saved order is one data point in Workers Analytics Engine (dataset `multimage_bag_events`, binding `BAG_EVENTS`; Free plan: 100,000 writes and 10,000 queries a day, kept three months). Aggregate only: no visitor identifier, no cookie, no IP. `POST /api/evento` takes the browser events, `/api/ordine` writes `order`. Read them with `npx dotenv -e .env.cloudflare -- npm run stats:bag [days]` (the token needs Account Analytics: Read): the books added most, adds per place, and bags left (started − ordered − emptied, an estimate over the period).
- The `/llms-full.txt` export route was removed (2026-06-20); no exporter to maintain.

## Testing & Automation

- No CI workflow runs `astro check`, linting, or builds. Add GitHub Actions (or Vercel checks) to execute at least `npm run lint` and `npm run build` on pull requests.
- `npm run test` chains `npm run format` → `npm run lint` (Prettier `--check`) → `npm run build`. This covers formatting and build health but not unit coverage.
- Utilities like `src/pages/cerca/search-page.client.ts` and the staff CSV helpers have zero unit tests; start with Vitest for pure helpers and DOM tests for CSV/search scripts.
- GraphQL queries rely on build-time validation. Consider lightweight contract tests that mock `executeQuery` responses so schema drift is caught earlier.

### docs/guidelines/project-structure.md
---
description: Fastro is based on and extends the [Astro project structure](https://docs.astro.build/en/core-concepts/project-structure/)
---

# Project Structure & Module Organization

## Directory overview
- **`src/pages/**`**
  - Route directories (`index`, `libri`, `collane`, `autori`, `distributori`, `magazine`, `info`, `staff`, `cerca`, `sitemap.xml`) each ship an `index.astro`, optional `_style.module.css`, and a sibling `_graphql.ts` describing their queries. API/utility routes live as `.ts` files (e.g., `sitemap.xml.ts`).
- **`src/components/**`**
  - Feature components bundle `index.astro`, optional `index.ts` (for fragment exports), and CSS modules. Subdirectories cover Dato blocks (`components/blocks`), Structured Text renderers (`components/datocms/structuredText`), and design primitives (`components/ui`).
- **`src/layouts`**
  - Hosts `BaseLayout.astro`, which fetches `_site`, header/footer menus, analytics scripts, and wraps every page.
- **`src/lib`**
  - Framework-agnostic helpers such as Dato tooling (`datocms/*`), view-model mappers (`books.ts`, `authors.ts`, `suppliers.ts`), formatting utilities (`text.ts`, `colors.ts`, `currency.ts`), and SEO fallbacks (`seo.ts`).
- **`src/styles`**
  - `global.css`: the Tailwind import, `@theme static` (tokens and font stacks), `@utility container`, the Tailwind 3 compat rules and the base and components layers; CSS modules `@reference` it to stay lean.
- **`scripts`**
  - `build-search-client.mjs` emits the browser bundles in `public/generated`; `sync-datocms.mjs` loads `.env` and regenerates `schema.ts`.
- **`public/generated`**
  - Build artefacts from `npm run prebuild`. Missing files here break `/cerca` and `BookCarouselSection` because `<script src="/generated/...">` references them directly.
- **`docs/**`**
  - Canonical documentation (assets, search, inventories, etc.). Keep these files aligned with the code or log drift in `docs/TODO.md`.

## Runtime configuration & tooling
- `astro.config.mjs` now reads the `SERVER` env var. `SERVER=static` (default) emits `output: 'static'` so every public route prerenders to `dist/`; `SERVER=preview` flips the build to `output: 'server'` so the preview Vercel project can render Draft Mode requests on demand. The config only wires the Vercel adapter when SSR is enabled and still validates every CDA/CMA/search env so builds fail fast when a token is missing.
- The same config exposes `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` and `PUBLIC_SITE_URL` to the client. `/cerca` throws during rendering if the search token is absent and the sitemap falls back to `http://localhost:4321` whenever `PUBLIC_SITE_URL` is unset (see docs/TODO.md SEO task **SEO1**).
- `tsconfig.json` defines the `~/*` path aliases used throughout the repo and enables `allowImportingTsExtensions` because `_graphql.ts` files are imported with their extension. Keep helpers inside `src/lib/**` so cross-layer imports stay obvious.
- `~/lib/prerender` centralises the shared `export { prerender }` flag so Astro pages are prerendered only when `SERVER=static` but remain SSR when `SERVER=preview`.
- `npm run sync-datocms` (called by `npm run dev`/`start`) loads `.env` and regenerates `schema.ts`.
- `npm run prebuild`/`npm run bundle-search-client` builds the browser bundles under `public/generated`. Run it before `astro dev`/`astro build` locally and wire it into CI (tracked by docs/TODO.md Project Structure task **PS1**).

## Co-location & layering rules
- **Queries next to consumers.** Every page/component that needs data keeps an adjacent `_graphql.ts` exporting both the document and TypeScript helpers. Shared fragments (`BookCardFragment`, `BANNER_SECTION_FRAGMENT`, etc.) are re-exported from `index.ts` to keep import sites tidy.
- **CSS modules per component.** Styles live beside the component they affect. Global typography/colors stay in `src/styles/global.css` and Tailwind theme tokens.
- **Map data in `src/lib`.** Only `src/lib` should know how to massage GraphQL payloads (`mapBooksToCards`, `mapAuthorsToCards`, `groupSuppliersByRegion`, `withFallbackSeo`, `toRichTextHtml`). Pages should stick to view-model orchestration.
- **Generated JS under `public/generated`.** Do not scatter ad-hoc bundles. `BookCarouselSection` and `/cerca` expect their modules there, so always run `npm run prebuild` locally and in CI.

## Route map & data flow
- **`/`**
  - Data: `src/pages/index/_graphql.ts` (`home`, modular `banners`).
  - Primary components: `BaseLayout`, `FeaturedBookHighlight`, `BannerSection`, `BookCarouselSection`, `blocks/PillsBlock`, Structured Text blocks.
  - Notes: Hero copy (`home.claim`) flows through `toRichTextHtml`; sanitize per docs/guidelines/assets.md#html-fragments--sanitization.
- **`/libri`** (and **`/libri/pagina/[page]`**, now a 301 to `/libri`)
  - Data: `src/pages/libri/index/_graphql.ts` (`booksIndexPage`, `allCollections`, every published book incl. archive, read in pages of 500).
  - Primary components: `BooksCatalogue` (faceted catalogue, `BookCard` catalogue variant).
  - Notes: single faceted page since 2026-11-22 (decisions-log `2026-11-22-faceted-catalogue`); filters run in the browser and live in the URL. `buildBooksCataloguePaths` returns `['/libri']`.
- **`/libri/[slug]`**
  - Data: `src/pages/libri/[slug]/_graphql.ts` plus related `authors`, `alternate formats`, and `collection` queries.
  - Primary components: `BookCarouselSection`, `AuthorsSection`, `AlternateFormatsList`, `DetailList`.
  - Notes: Heavy view-model mapping—reuse helpers from `src/lib/books.ts` and `src/lib/authors.ts`.
- **`/collane` & `/collane/[slug]`**
  - Data: Listing (`src/pages/collane/index/_graphql.ts`) and detail (`src/pages/collane/[slug]/_graphql.ts`).
  - Primary components: `SectionIntro`, `CollectionCard`, `CollectionDetailHero`, `BookCard`.
  - Notes: Detail route queries `BookCollectionBooks` to populate related carousels.
- **`/autori` & `/autori/[slug]`**
  - Data: `src/pages/autori/index/_graphql.ts`, `src/pages/autori/[slug]/_graphql.ts`.
  - Primary components: `SectionIntro`, `BookCard`, `AuthorsSection`.
  - Notes: Detail route issues separate calls for the author record and related books.
- **`/distributori`**
  - Data: `src/pages/distributori/_graphql.ts`.
  - Primary components: `SectionIntro`, `SupplierCard`.
  - Notes: `SupplierCard` renders HTML descriptions; sanitize per Security task **S2**.
- **`/magazine` & `/magazine/[slug]`**
  - Data: `src/pages/magazine/index/_graphql.ts`, `src/pages/magazine/[slug]/_graphql.ts`.
  - Primary components: `MagazinePostCard`, Structured Text blocks, `BookCarouselSection`.
  - Notes: `LinkToRecord.astro` still targets `/blog/...`; fix via Project Structure task **PS2**.
- **`/info` & `/info/[slug]`**
  - Data: Static placeholder (`src/pages/info/index.astro`) plus `src/pages/info/[slug]/_graphql.ts` for CMS-driven pages.
  - Primary components: `InfoSection`, Structured Text renderer.
  - Notes: `BaseLayout` maps `allPages` into header/footer menus used here.
- **`/staff` & `/staff/archivio-catalogo`**
  - Data: `src/pages/staff/index/_graphql.ts`, `src/pages/staff/archivio-catalogo/_graphql.ts`.
  - Primary components: bespoke markup + CSV export script.
  - Notes: gated by the editor session in `src/middleware.ts` (Security task **S1**, resolved).
- **`/designsystem`**
  - Data: no query; reads `DESIGN.md` at build time (`src/pages/designsystem/_tokens.ts`).
  - Primary components: renders `Button`, `BookCard`, `Book3D`, `HomeDoors`, `AuthorCard`, `SupplierCard` and the `BooksCatalogue` / `/borsa` classes with sample data (covers in `public/design-samples/`).
  - Notes: public and `noindex`, not listed in the sitemap.
- **`/cerca`**
  - Data: `src/pages/cerca/index.astro` (no GraphQL) plus the Site Search bundle.
  - Primary components: Search form + `public/generated/search-page.client.js`.
  - Notes: Reads config from `data-*` attributes and talks to Site Search directly; see docs/guidelines/search.md for operational notes.
- **`/sitemap.xml`**
  - Data: `src/pages/sitemap.xml/_graphql.ts`.
  - Primary components: none (pure XML response).
  - Notes: Falls back to `http://localhost:4321` when `PUBLIC_SITE_URL` is missing; enforce env per SEO task **SEO1**. Includes the paginated catalogue pages (`/libri/pagina/2..N`) via `buildBooksCataloguePaths`.

> `/llms-full.txt` was removed 2026-06-20 (closed Security task **S4** + reduced Fast Origin Transfer — see decisions-log `2026-06-20-fot-reduction`).

## API & preview routes
(Deployed only when `SERVER=preview`; static builds omit all runtime endpoints.)
- **`/api/preview`** (GET/POST) requires `SECRET_API_TOKEN`, validates relative redirects, sets the signed draft-mode cookie via `enableDraftMode`, and returns 401 otherwise.
- **`/api/draft-mode/enable`** mirrors the preview secret guard before redirecting to a relative URL; **`/api/draft-mode/disable`** only clears the cookie but still rejects absolute redirects.
- **`/api/preview-links`** powers the Dato “Web Previews” plugin: it maps records to website routes via `recordToWebsiteRoute`, generates draft/published URLs (enabling or disabling draft mode on the way), and responds with permissive CORS headers.
- **`/api/seo-analysis`** is called by the “SEO/Readability Analysis” plugin. It validates the secret, fetches the record via `@datocms/cma-client`, hits the frontend with `draftModeHeaders()` to capture unpublished content, and returns metadata + rendered HTML via `jsdom`.
- **`/api/ordine`** (POST only) saves a book order to D1 and notifies the shop through the Workers `send_email` binding, after a Turnstile check and a CDA refetch of titles and prices; it is not part of the preview plumbing and fails closed without its secret and bindings. Defences and keys: `docs/guidelines/security.md` § Order endpoint.
- **`/api/post-deploy`** installs/configures both plugins right after the initial deploy. Because it accepts an arbitrary CMA token and writes preview URLs containing our `SECRET_API_TOKEN`, retire it (or require an extra server-side secret) once staging/production are configured (docs/TODO.md Security task **S5**).

## Known gaps & violations
- Structured Text links for blog posts still point to `/blog/...` although the published route is `/magazine/...`. Fix `LinkToRecord.astro` and add regression coverage (docs/TODO.md Project Structure task **PS2**).
- GraphQL queries rely on `first: 500` almost everywhere (`/libri`, `/autori`, `/sitemap`, staff exports), which hammers the CDA and bloats build artifacts. Tackle pagination + cache tags under docs/TODO.md CMS task **CD2**.
- `/staff/*` route gating is resolved (**S1**, middleware). `/llms-full.txt` was removed (**S4** closed 2026-06-20).
- `public/generated` assets are not fingerprinted or validated; missing `npm run prebuild` results in broken `<script>` imports. Add integrity checks per docs/TODO.md Project Structure task **PS1**.
- Cache tags/revalidation hooks are still absent even though the project relies on query listeners. Capture incremental cache invalidation in docs/TODO.md CMS task **CD3** and update data loaders accordingly.
- The one-off `/api/post-deploy` endpoint remains deployed and can leak the preview secret if an attacker points it at their Dato project. Remove or protect it per docs/TODO.md Security task **S5**.
***Resolved 2025-11-16*** — Builds default to `SERVER=static`, which prerenders every route to `dist/`. Deployments that need live drafts set `SERVER=preview`, which runs every page as SSR while keeping the codebase identical and reusing the same repo for both Vercel projects.

### docs/guidelines/security.md
---
description: Track security risks, mitigations, and review checkpoints for Multimage.
---

# Security Overview

## Critical Findings

- **Rich-text XSS (CWE-79)** — `toRichTextHtml` returns raw CMS HTML and multiple templates bind the result with `set:html`, so any editor-provided `<script>` executes for visitors. Harden `src/lib/text.ts:65-95`, audit `src/pages/index.astro:345-355`, `src/components/SupplierCard/index.astro:71-139`, and `src/pages/autori/[slug]/index.astro:138-158` to use Structured Text renderers or sanitize output.
- **Catalog data exposure (CWE-200)** — _Resolved 2026-05-31 (S1)._ Internal routes (`/staff`, `/staff/archivio-catalogo`, `/libri/schede/*`) are gated centrally in `src/middleware.ts`: a request without the editor session (the signed draft-mode JWT cookie) gets a flat `404` before any render, so the public never learns the paths exist nor receives inventory/CSV data. Enforcement is single-point — pages no longer guard themselves. The bearer-token model fits the sensitivity (stock/circulation business data, not PII); see `docs/decisions-log/2026-05-31-editor-session-gating.md`.

## High-Priority Gaps

- **Preview tokens rotation** — `/api/preview` and `/api/draft-mode/*` now enforce `SECRET_API_TOKEN` and drop signed cookies before toggling Draft Mode. Keep the CDA draft token and secrets rotated across Vercel environments so a leaked URL cannot grant long-term preview access.
- **Unbounded CSV export** — The staff CSV button currently serializes the full catalogue on the client (`src/pages/staff/archivio-catalogo/index.astro:200-317`). Even after the page is secured, validate user roles and strip fields that should never leave the CMS.

## Additional Observations

- **Third-party scripts** — Google Analytics and Iubenda are injected inline in `src/layouts/BaseLayout.astro:132-210` with no integrity hints. Load them with `async`/`defer`, monitor outages, and keep the snippet list minimal.
- **LLM export** — the `/llms-full.txt` route was removed (2026-06-20), closing **S4**: the full catalogue + long-form bios/emails are no longer published in plaintext to anonymous visitors.
- **DatoCMS client errors (S5 still open)** — since V5 the CMA `authorization` header is redacted in a CMA `ApiError` and a CDA error's options no longer serialize, but `handleUnexpectedError` (`src/pages/api/utils.ts`) still returns a CMA error's `request.body` to the caller, so a `/api/post-deploy` 500 can carry `SECRET_API_TOKEN` (in `previewWebhook`/`htmlGeneratorUrl`).
- **Environment documentation** — `.env.example` only mentions the published CDA token; document draft/CMA tokens separately so engineers do not reuse privileged keys accidentally.
- **Search token scoping** — Ensure `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` is created with a Site Search–only role. Admin/CMA tokens must never be exposed because the value ships to the browser (`src/pages/cerca/index.astro:6-78`).

## Order endpoint (/api/ordine)

`POST /api/ordine` (`src/pages/api/ordine/index.ts`) saves one book order to the D1 database `multimage-orders` and sends the shop one notification email. It accepts a JSON body with the buyer's fields, the Turnstile token and `lines` of `{id, qty}`; titles and prices are never trusted from the client, they are refetched from the published CDA and rebuilt (`rebuildOrder` in `src/lib/order.ts`), so a tampered bag cannot reach D1 or the email. Any method but POST answers 405 (`allow: POST`). It does not use `src/pages/api/utils.ts` (CORS `*` and error echo do not fit a form endpoint). The bindings (`ORDERS` for D1, `ORDER_MAIL` for `send_email`) are read only through `src/lib/cloudflare-bindings.ts`. The visitor gets no email: the success screen offers a PDF of the request, built in the browser. The discount is computed on the server from the buyer record the client names by id (DatoCMS `buyer` collection, read with the books from the published CDA: its percentage of the rebuilt books subtotal, never shipping); an unknown buyer id is an invalid `buyer` field, and a discount or total sent by the client is ignored.

Defences, in the order the endpoint answers (the first failing check wins):

1. **Config, fail closed.** Without `TURNSTILE_SECRET_KEY`, or with neither binding present, it answers `503 not_configured` outside dev. In dev, with no binding the email text goes to the console and the endpoint answers 200 with an order code that is not saved (nothing is stored or sent; the email text is printed to the console); an unset Turnstile secret falls back to Cloudflare's always-pass test secret (siteverify then checks `success` only).
2. **Size.** Body capped at 16384 bytes (`ORDER_BODY_MAX_BYTES`), checked on `content-length` and again on the read body (`400 too_large`).
3. **Shape.** Invalid JSON, at most 30 lines (`ORDER_MAX_LINES`), quantity 1-20 per line, field validation (`400` with codes `bad_request`, `empty_bag`, `too_many_lines`, `bad_lines`, `invalid`).
4. **Turnstile.** Server-side siteverify checks `success`, the hostname of the request and the action `ordine`; a failure logs which check failed (`reason=success|hostname|action`), never the token (`400 turnstile`). Siteverify unreachable: `502 turnstile_unavailable`.
5. **Catalogue refetch.** Ids are pre-filtered by format (22 base64url characters, or digits) because the CDA rejects a whole `id: { in }` query on a bad ItemId; a forged id ends as a dropped line or a safe `502 catalogue_unavailable`. If every line drops: `409 nothing_orderable`.
6. **Save, then notify.** The order is inserted into D1 (the record) with the readable code `MM-YYMMDD-XXXX`; on a UNIQUE clash on `orders.code` the code is regenerated and the insert retried once (`saveWithCodeRetry`). Then one email goes to `ordini@multimage.org` through the `send_email` binding and `notify_status` is updated (`sent`, `failed` or `skipped`). Saved but not notified is still `200` with `notified: false`; notified but not saved is `200` too (the email carries the whole order); neither is `502 save_failed`.

Every answer carries `cache-control: private, no-store`. Error bodies carry codes only. Logs are one line per answer, `[ordine] <status> <code>` (or `[ordine] 200 ok lines=<n> dropped=<n> ...`), plus `code_clash`, `save_error` and `notify_update_error`: counts only, never a name, email, address, notes or token. Orders whose notice did not go out are found with the `notify_status <> 'sent'` query in `d1/README.md`, until the staff app exists (TODO **BORSA-staff-app**). Personal data stays in D1 only for the time needed to ship, then it is anonymised (retention rule in `d1/README.md`; TODO **BORSA-privacy** for the policy side).

Outer limits, beyond the code: a Cloudflare WAF rate limiting rule on `/api/ordine` (set it before `TURNSTILE_SECRET_KEY`, see `docs/guidelines/operations.md` § Environment & Secrets). There is no third-party mail tier to hit: Cloudflare is the only service involved (Workers Free limits apply). The WAF rule covers only the zone hostnames: the `workers.dev` and preview URLs (`workers_dev`, `preview_urls` in `wrangler.jsonc`) bypass it. No order goes through them (the siteverify hostname check refuses it), but each request costs a siteverify call and Worker time; TODO `CF-vercel-cleanup` turns them off after go-live. Setup steps for the user: `docs/work/archive/2026-11-24-borsa/setup-borsa.md`.

---

## Bag event endpoint (/api/evento)

`POST /api/evento` (`src/pages/api/evento/index.ts`) writes one aggregate counter to Workers Analytics Engine. It accepts only `add` and `start` (with a book slug matching `^[a-z0-9][a-z0-9-]{0,119}$` and a place among `card`, `book`, `hero`) and `emptied`; `order` is written only by `/api/ordine`, so the browser cannot inflate orders. Bodies over 512 bytes and foreign `Origin` headers are refused (400, 403); any other method gets 405. It answers 204 with no body, reads and sets nothing on the visitor and stores no identifier or IP, so it needs no consent. Spam can still inflate the add counters; the figures are indicative, not accounting.

## Environment Variables Audit (2026-05-16)

### Matrix

| Variable | Astro context | Astro access | Optional? | Ships to client? | Used in | Vercel must have |
|---|---|---|---|---|---|---|
| `SERVER` | server | public | yes | no | `src/lib/draftPreview.ts`, `src/lib/prerender.ts` (build-time selector "static"/"preview") | yes — set per env |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | server | secret | no | no | `src/lib/datocms/executeQuery.ts` | yes |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | server | secret | no | no | `executeQuery.ts`, `DraftModeQueryListener` | yes (preview env) |
| `DATOCMS_CMA_TOKEN` | server | secret | yes | no | `src/pages/api/seo-analysis/index.ts` (runtime), `src/lib/datocms/siteSearch.ts` (via `/api/revalidate`), `src/worker.ts` (daily Cron Trigger) | SEO analysis and Site Search reindex |
| `SECRET_API_TOKEN` | server | secret | no | no | `post-deploy`, `preview`, `preview-links`, `seo-analysis`, `draft-mode/enable` | yes |
| `SIGNED_COOKIE_JWT_SECRET` | server | secret | no | no | `src/lib/draftMode.ts` | yes |
| `SITE_SEARCH_BUILD_TRIGGER_ID` | server | secret | yes | no | `src/lib/datocms/siteSearch.ts` (Vercel, reindex after a publish), `src/worker.ts` (Cloudflare, daily reindex), with `DATOCMS_CMA_TOKEN` | Site Search reindex (id `37696`; Secret type on Vercel, unreadable) |
| `BYPASS_TOKEN` | build / server | secret | yes | no | `astro.config.mjs` (ISR `bypassToken`), `src/lib/draftMode.ts`, `/api/revalidate` | Vercel only (not on the Worker) |
| `DRAFT_MODE_COOKIE_NAME` | server | secret | yes | no | `src/lib/draftMode.ts` | optional |
| `CACHE_INVALIDATION_WEBHOOK_SECRET` | server | secret | yes | no | `src/pages/api/invalidate-cache/index.ts` (Bearer) | no (Cloudflare Worker secret only) |
| `TURNSTILE_SECRET_KEY` | server | secret | yes | no | `src/pages/api/ordine/index.ts` | Worker secret only (unset = `/api/ordine` answers 503) |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | client | public | no | **YES** | `src/pages/cerca/index.astro` (via `import.meta.env`), search bundle | yes |
| `PUBLIC_SITE_URL` | client | public | no | **YES** | BaseLayout canonical, sitemap, `post-deploy` | yes |
| `PUBLIC_TURNSTILE_SITE_KEY` | client | public | yes | **YES** | `src/pages/borsa/index.astro` (widget) | build env file (`.env.cloudflare`), inlined at build; unset = `/borsa` shows the email box |
| `DATOCMS_API_TOKEN` | — (not declared) | — | — | no | only `scripts/sync-datocms.mjs` (local dev) | **NO — dead weight on Vercel** |

### Findings

1. **`DATOCMS_API_TOKEN` su Vercel non viene letto a runtime.** Lo script `sync-datocms.mjs` gira solo da `npm run dev`/`start` (locale), non da `npm run build`. Tenerlo su Vercel è solo superficie d'attacco senza utilità. → **Action**: rimuovere da tutti gli env Vercel.
2. **6 secret su Vercel sono "Needs Attention"** (non cifrati at-rest nel dashboard team): `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DATOCMS_API_TOKEN` (verrà eliminato), `DATOCMS_CMA_TOKEN` (se presente). → **Action**: migrare a tipo *Sensitive*.
3. **`PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` scope da verificare.** Il token finisce nel bundle JS del browser (`src/pages/cerca/index.astro:11` via `import.meta.env`) ed è quindi leggibile da chiunque. Deve essere un token DatoCMS con **solo il ruolo "Site Search"** (read-only sull'endpoint `/search-results`). Se ha permessi più ampi (CDA published, CDA draft, CMA) è una **leak severa**.
4. **`PUBLIC_SITE_URL` è safe** — è solo `https://www.multimage.org`, nessun problema a esporlo al browser.

### Cloudflare Worker secrets

On the Cloudflare target the variables above are Worker secrets, not Vercel env vars (switch procedure: `docs/guidelines/cloudflare-switch.md`):

- Set with `npx wrangler secret put <NAME>` (or `wrangler secret bulk`), through the env-file wrapper described in `docs/guidelines/operations.md`; list the names with `npx wrangler secret list` (it never prints values). Never commit a secret file or print a value.
- The Worker starts with the secrets listed in `docs/guidelines/operations.md` (Environment & Secrets) and `cloudflare-switch.md` (Starting point), plus the two of switch day (`DATOCMS_CMA_TOKEN`, `SITE_SEARCH_BUILD_TRIGGER_ID`) and the order secret (`TURNSTILE_SECRET_KEY`, set with `wrangler secret put`, value at the prompt). `BYPASS_TOKEN` is Vercel-only and must not be created there. `PUBLIC_TURNSTILE_SITE_KEY` is not a Worker secret: it is public and inlined at build from `.env.cloudflare`.
- `CACHE_INVALIDATION_WEBHOOK_SECRET` exists only on the Worker, in the Authorization header of the DatoCMS `cda_cache_tags` webhook and in the build env file outside the repo (runbook step 0); it can be regenerated and re-put if lost, as long as the two match. `/api/invalidate-cache` rejects any other bearer.
- `SIGNED_COOKIE_JWT_SECRET` on the Worker must equal the Vercel value, otherwise editors' 30-day sessions end at the switch.
- Draft HTML is never stored: it carries the draft CDA token, so the gateway sends draft requests `no-store` and the middleware sets `Cache-Control: private, no-store` (`docs/guidelines/preview-mode.md` § 1).

### Vercel: migrazione a "Sensitive"

Per ogni secret marcato "Needs Attention", da fare via dashboard (richiede manual action — non automatizzabile via API senza CLI auth):

1. Apri Project Settings → Environment Variables
2. Clicca la variabile → "Edit"
3. Cambia il tipo da "Plain text" a **"Sensitive"** (encrypted at-rest)
4. Salva — il valore resta lo stesso, non serve rotazione
5. Conferma che il badge "Needs Attention" sparisce

**Ordine consigliato** (più sensibili prima):
1. `SIGNED_COOKIE_JWT_SECRET` (controlla draft mode auth)
2. `SECRET_API_TOKEN` (gatekeeper API routes)
3. `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (legge contenuti draft)
4. `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` (legge contenuti pubblicati)
5. `DATOCMS_CMA_TOKEN` (se presente — accesso CMA full)
6. **Elimina** `DATOCMS_API_TOKEN` da Vercel (non serve)

**Rotazione**: non necessaria salvo sospetto compromissione. Migrare a Sensitive **conserva lo stesso valore** — la cifratura at-rest è la sola differenza.

### Verifica `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`

Da fare su DatoCMS:

1. Vai su Project settings → API tokens
2. Trova il token usato come `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`
3. Verifica:
   - Role: **"Site Search"** (built-in role)
   - Permissions: solo `Use the Site Search API`
   - NON deve avere accesso a CDA, CMA, o altri endpoint
4. Se il token ha permessi più ampi → creare un nuovo token "Site Search" only, sostituire su Vercel, eliminare quello vecchio

### Public env vars: review

Le sole variabili che finiscono nel bundle browser (per dichiarazione `context: 'client'` o uso via `import.meta.env`):

- `PUBLIC_SITE_URL` — safe (URL pubblico)
- `PUBLIC_TURNSTILE_SITE_KEY` — safe by design: the Turnstile site key is public and bound to the widget's hostnames; the secret key stays a Worker secret
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` — safe **solo se scope verificato come Site Search-only** (vedi sopra)

Nessun secret è accidentalmente prefissato `PUBLIC_*` in `astro.config.mjs`. ✅
