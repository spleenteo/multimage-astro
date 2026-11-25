# V4 packet — work diventa-socio

Repo: /Users/spleenteo/Sites/multimage/multimage-astro, branch work/diventa-socio. Effective test level: essential. Owner: run without stopping unless something is really serious; CMS edits on the primary (additive, publish after), D1 migration, WAF change, deploy and a real test request are authorised as in V3 (conductor steps).

Design authority: /Users/spleenteo/Sites/multimage/multimage-astro/DESIGN.md (read whole before any UI task) and PRODUCT.md. Before any UI edit read /Users/spleenteo/.claude/plugins/cache/impeccable/impeccable/4.8.2/skills/impeccable/reference/craft-floor.md, and the relevant Impeccable reference: /Users/spleenteo/.claude/plugins/cache/impeccable/impeccable/4.8.2/skills/impeccable/reference/clarify.md, distill.md, bolder.md, delight.md, polish.md. Critique snapshot: /Users/spleenteo/Sites/multimage/multimage-astro/.impeccable/critique/2026-11-25T00-33-35Z__src-pages-diventa-socio-index-astro.md. Inclusive wording: paired forms, feminine first (Autrice/Autore, Benvenuta/benvenuto) are deliberate. Site copy in Italian; code/docs in English.

## Context and slice section (slices.md)

## Context

- **Singleton** `membership` on the primary environment `home-featured-book` (backup env `bkup-2026-11-24`): live fields `slug` (`diventa-socio`), `seo`, `title`, `subtitle` (HTML text), `content` (structured text). The record `D-sTlquHR7GiqaEOpMA80w` is published. The committed `schema.ts` is stale (shows `title` + `description`): regenerate before writing queries.
- **Form fields** (owner's list): email, first name, last name, date of birth, place of birth, address line 1, address line 2, city, state/province/region, postal code, country (default Italia), fee type (one of the CMS tiers, e.g. "10€ — Studente under 25"), payment method (bonifico | PayPal), collaboration areas (checkboxes from the CMS, "altro" with free text). Plus a required privacy consent with membership-specific wording, since the form collects date of birth and address.
- **Mailbox**: info@multimage.org, through a new `send_email` binding. Added as an Email Routing destination on 2026-11-24, verified on 2026-11-24 at 22:47 UTC.
- **Record**: every request also saved in D1 (`multimage-orders`). No retention rule (owner, 2026-11-24).
- **Old page**: `/info/adesioni` (CMS `page` record, in header and footer menus) gets a 301 to `/diventa-socio` (owner, 2026-11-24).
- **Rate limit**: the zone's one Free-plan rule covers only `/api/ordine`.

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

## Earlier slices (outcomes, for interfaces)
### V1 — done on 2026-11-24

The schema change went in on the primary environment through the CMA, as the owner chose: two blocks and four fields on `membership`, nothing renamed or deleted. The record was seeded and published in one go: three fee tiers (two of them assumed, to be confirmed), seven areas, `payment_note`, `success_text` and a rewritten `content` with no Mailchimp link, no IBAN and no fees in the prose. Every text is copied into the ledger under T2 for the owner. `/diventa-socio` renders from the published singleton with draft mode wired in. Its form markup, client validation, error summary and lazy Turnstile reuse `/borsa`'s styles (`src/styles/form.css`) and helpers (`src/lib/form.client.ts`), and `/borsa` refactored onto them without a behaviour change found in review. Rulings, all read from the ledger: subagents got the packet by path, not inline. T8 also fixed five stale expectations in the revalidation-map check, left behind by the earlier catalogue-filter work, so the check is green. T5's two-commit history was accepted. T6 swapped an internal Astro import for a new `EmptyBlock.astro`. The final review's browser and docs items were deferred to the conductor. Process slips: one review caught a `~/styles` import that broke the build, because the executor committed without building, and two commits went in before prettier. Owner follow-ups: confirm the "Studente under 25" and "Disoccupato" tiers (and a paired form for "Disoccupato"), the "Provincia" label for foreign addresses, the placeholder subtitle "bla bla" and the empty `seo`. Do not deploy V1 before V2, since the form cannot send yet.

Pending at close (conductor, browser): /diventa-socio form behaviour in a browser; draft-on load in the owner's session; /borsa and /designsystem unchanged in a browser.

### V2 — done on 2026-11-25

`/diventa-socio` now sends. `POST /api/socio` mirrors `/api/ordine` step by step: 405, fail-closed 503, an 8 KB cap, JSON and field checks with consent checked on the server, Turnstile action `socio`, one published CMS read that re-resolves the fee and the areas by id (the client never sends an amount, and a draft-only tier is rejected), then a D1 insert into the new `membership_requests` table (migration 0004, code `SO-YYMMDD-XXXX` with a clash retry on its own table) and one plain-text email to info@ through the new `MEMBERSHIP_MAIL` binding, reply-to the applicant. Logs carry codes and counts only. To share one copy, the payment facts moved to an import-free `src/lib/payment.ts` and the Turnstile check to `src/lib/turnstile.ts`; `/borsa` and `/api/ordine` were checked unchanged, apart from the planned test-secret leniency on localhost hostnames. The bank box styles moved to `form.css`. The confirmation shows the chosen method first, with the causale and amount taken from the server's answer. Rulings, all read from the ledger: subagents got the packet by path, as in V1; build tasks ran one at a time to keep `npm run build` runs apart; the final review found that `wrangler dev` rewrites the request host to the route's `www.multimage.org`, so the local Cloudflare check needs `--local-upstream localhost:8787` (a run flag, no code change). One review round: T8 first used `/borsa`-only classes the page doesn't load, and those became Tailwind utilities. Carried to V3: a WAF rule covering `/api/socio`, the docs (helpers list, security, operations, d1 README, project structure), and the owner verifying info@ before any deploy. Owner follow-ups: the Italian confirmation and error texts written by the executor. The dev, wrangler and browser Done checks are pending with the conductor.

Conductor checks at close (2026-11-25): local Cloudflare run with `build:cf` (test site key) and `wrangler dev --local-upstream localhost:8787` needed `--compatibility-date 2026-10-08` (local workerd older than the Worker's 2026-11-01). The page served 200 from the published CMS; a missing consent got 400 `fields:["consent"]`. Submits that pass validation stopped at `502 turnstile_unavailable`: every outbound fetch from local workerd was very slow (CDA 45 s, siteverify cut at its 10 s timeout), an environment limit, not code. The D1 risk was covered directly: the row built by the real `parseMembershipRequest` → `resolveMembershipChoices` → `membershipRow` was inserted into local `membership_requests` (all constraints passed, `fee_cents` 1000, `areas_other` kept), read back and deleted. The end-to-end submit (Turnstile, D1, `MEMBERSHIP_MAIL`) is first proven on production in V3. Browser checks (confirmation look, method first, IBAN copy, PayPal amount; /borsa unchanged) stay with the owner.

### V3 — done on 2026-11-25

T1–T5 ran without a stop: the header button and the three "Soci" links point to /diventa-socio, /info/adesioni is a frontmatter-only 301 page (static route beats info/[slug]; the middleware sends it private, no-store), config comments name both D1 tables and both Turnstile routes, and the docs (inventories, routes, caching, security, operations, d1/README, TODO) describe the target state. The final review found the Cloudflare bindings inventory missing getMembershipMail() and getBagEvents(), plus five wording drifts (Turnstile leniency, payment.ts as the source of the bank details, the WAF rule's two paths, the unset site key on /diventa-socio); one fix round closed them. The local dev check and the gate are green. One ruling: dispatches carried the 102 KB packet by path instead of verbatim. The production half (WAF, remote D1 0004, deploy, live checks, real request) and T6 are left to the conductor. Executor extras kept: the erasure UPDATE also NULLs areas_other (free text), and fee_* columns are documented as never erased.

Conductor sequence (2026-11-25): the WAF rule's expression became `(http.request.uri.path in {"/api/ordine" "/api/socio"})` with one PATCH, nothing else changed (404 404 429 before deploy, 400 400 429 after). Remote D1 0004 applied (23 columns, `orders` unchanged). Deployed version `2922a340-bf9b-4189-b89a-1acd49a461f4` with `MEMBERSHIP_MAIL`. Production checks green (/diventa-socio 200 with the form, /info/adesioni 301, home link, /api/ordine 400, /borsa, /info/ordinare and sitemap 200). The owner's real request `SO-261125-PE7E` was saved and notified, then deleted. A second code the owner saw, `SO-261125-5VVA`, never reached production (one 200 in the Worker logs): most likely a submit on the local dev server, which answers with a code and saves nothing. T6 recorded the facts (ab60aa3).


Plans of earlier slices (interfaces, markup contract): docs/work/2026-11-24-diventa-socio/V1-plan.md, docs/work/2026-11-24-diventa-socio/V2-plan.md, docs/work/2026-11-24-diventa-socio/V3-plan.md. Production facts: WAF rule 81caab052795465b994f776850616d33 in ruleset 070bdb6d589e47b0a562bb96fe424f98, expression (http.request.uri.path in {"/api/ordine" "/api/socio"}); Cloudflare account 59fd5121a90b86d19e5a982e6fc41696; deploy only via npx dotenv -e .env.cloudflare -- npm run deploy:cf; membership record D-sTlquHR7GiqaEOpMA80w on env home-featured-book; fee block ids WrjeoCkCQoq2KQGUhsCrcg (Ordinaria 20), LY2eNn_KSG20yyYZwhD_PA (Studente under 25, 10), DuCMDkmySmCrbey2VIbAPg (Disoccupato, 10).

## lessons.md
# Lessons — diventa-socio

- Before committing, run `npm run build` (not only prettier or a selector count): a `~/` alias exists only for the folders in tsconfig `paths` (components, layouts, lib, pages, schema), so `src/styles` is imported by relative path.
- Run `npx prettier --write` on the touched files before the commit, not after, so the formatting lands in the same commit instead of a second "Format …" commit.
- When a check script fails on cases the task didn't touch, find the commit that changed the behaviour and confirm the intent in the guidelines before you align the expectations, and align them in a separate commit.
- Never import from `astro/runtime/...` to build a component inline: add a real `.astro` file, even an empty one, and ask to widen Files.
- Executors cannot run `dotenv -e .env` (auto mode denies it): plan live CDA checks as conductor checks against the running dev server, GET only.
- Run every grep and count in the task's Verified line before the first commit, so a check never needs a second, comment-only commit.
- When a page reuses another page's markup, check that each class is defined in a stylesheet the page itself loads (src/styles/form.css), not in the source page's private CSS.
- Under `wrangler dev`, `request.url` carries the first route's host (www.multimage.org) unless `--local-upstream localhost:8787` is passed: plan local Worker checks that depend on the hostname with that flag.
- Local `wrangler dev` needs `--compatibility-date` at or below the installed workerd's newest date, and its outbound fetches can be too slow for a 10 s siteverify timeout: test the insert path directly against local D1, and the full submit on production.
- When a new endpoint reuses a shared helper module (bindings, Turnstile, payment data), update that module's inventory entry in the same slice: grep its exports against list-helpers.md, not only the new files'.
- Docs written before a deploy should not carry a "live since" date; leave the date to the step that writes the production facts.
- A doc sentence that names one endpoint ("the order code", "on /api/ordine") goes stale when a sibling endpoint joins it: grep the old path across docs/guidelines when adding the new one.
- A plain `astro dev` submit answers with a real-looking code that is saved nowhere: when a production test is asked for, say which host to use and match codes against the Worker logs (`cf observability telemetry query`) before suspecting a bug.

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


Owner override for this work: CMS schema/content edits directly on primary via CMA (additive only), no migration script.

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
- Order endpoint keys and bindings (`/api/ordine`, see `security.md` § Order endpoint): `TURNSTILE_SECRET_KEY` is a Worker secret (`wrangler secret put`, optional: unset means `/api/ordine` answers 503). Orders go to the D1 binding `ORDERS` (database `multimage-orders`, jurisdiction eu) and the notice through the `ORDER_MAIL` `send_email` binding (to `ordini@`), both declared in `wrangler.jsonc` (setup: `docs/work/archive/2026-11-24-borsa/setup-borsa.md`). `PUBLIC_TURNSTILE_SITE_KEY` is public and inlined at build like `PUBLIC_SITE_URL`, so it lives in `.env.cloudflare` and needs a `deploy:cf` to take effect; set it last, after the secret (until it is built in, `/borsa` shows the email box). The membership form (`/diventa-socio`, `POST /api/socio`) shares `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY` and the `ORDERS` binding (table `membership_requests`) and adds the `MEMBERSHIP_MAIL` `send_email` binding (to `info@multimage.org`, verified in Email Routing), declared in `wrangler.jsonc`. None of these keys or bindings is needed on Vercel (no traffic).
- WAF rule, a prerequisite before setting `TURNSTILE_SECRET_KEY`: one Cloudflare rate limiting rule (Free plan: one rule, 10 s period, 10 s block) on expression `(http.request.uri.path in {"/api/ordine" "/api/socio"})` (applied on 2026-11-25; the `in` form was accepted), counted per IP with one counter shared by both paths, 2 requests per 10 s, action Block. The Free plan likely offers only Path and Verified Bot fields, so no Method condition (GETs count too, harmless); confirm field and period options in the dashboard. Check with bare `{}` POSTs, which answer 404 until the code of each endpoint is deployed (`/api/ordine`, `/api/socio`) and 400 after it, and save nothing; the 429 proves the rule. Steps: `docs/work/archive/2026-11-24-borsa/setup-borsa.md`.
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
- Membership endpoint: the same tail shows the `[socio] <status> <code>` lines (counts only, no personal data). Requests whose notice did not go out are found with the `notify_status <> 'sent'` query on `membership_requests` in `d1/README.md`, at least weekly.
- Site Search reindex (since 2026-11-24): a Cron Trigger on the Worker, daily at 02:00 UTC, logs `[site-search] cron: reindex triggered 200` (or `failed <status>`, or `skipped` when the token or the trigger id is unset). Workers Observability also shows the `DatoCmsSearchBot` crawl that follows. To find CPU limit hits, query Workers Observability with `cf observability telemetry query --body @file`, grouping by `$workers.outcome` (`exceededCpu`) and `$workers.event.request.url`.
- Bag counters (since 2026-11-24): every add to the bag, every first book in an empty bag, every bag emptied by hand and every saved order is one data point in Workers Analytics Engine (dataset `multimage_bag_events`, binding `BAG_EVENTS`; Free plan: 100,000 writes and 10,000 queries a day, kept three months). Aggregate only: no visitor identifier, no cookie, no IP. `POST /api/evento` takes the browser events, `/api/ordine` writes `order`. Read them with `npx dotenv -e .env.cloudflare -- npm run stats:bag [days]` (the token needs Account Analytics: Read): the books added most, adds per place, and bags left (started − ordered − emptied, an estimate over the period).
- The `/llms-full.txt` export route was removed (2026-06-20); no exporter to maintain.

## Testing & Automation

- No CI workflow runs `astro check`, linting, or builds. Add GitHub Actions (or Vercel checks) to execute at least `npm run lint` and `npm run build` on pull requests.
- `npm run test` chains `npm run format` → `npm run lint` (Prettier `--check`) → `npm run build`. This covers formatting and build health but not unit coverage.
- Utilities like `src/pages/cerca/search-page.client.ts` and the staff CSV helpers have zero unit tests; start with Vitest for pure helpers and DOM tests for CSV/search scripts.
- GraphQL queries rely on build-time validation. Consider lightweight contract tests that mock `executeQuery` responses so schema drift is caught earlier.

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

Outer limits, beyond the code: a Cloudflare WAF rate limiting rule on `/api/ordine` and `/api/socio` (one shared counter; set it before `TURNSTILE_SECRET_KEY`, see `docs/guidelines/operations.md` § Environment & Secrets). There is no third-party mail tier to hit: Cloudflare is the only service involved (Workers Free limits apply). The WAF rule covers only the zone hostnames: the `workers.dev` and preview URLs (`workers_dev`, `preview_urls` in `wrangler.jsonc`) bypass it. No order goes through them (the siteverify hostname check refuses it), but each request costs a siteverify call and Worker time; TODO `CF-vercel-cleanup` turns them off after go-live. Setup steps for the user: `docs/work/archive/2026-11-24-borsa/setup-borsa.md`.

### Membership endpoint (/api/socio)

`POST /api/socio` (`src/pages/api/socio/index.ts`, helpers in `src/lib/membership-request.ts`) follows the order endpoint step by step (405, fail-closed 503, size, shape, Turnstile, one published CDA read, save then notify, `cache-control: private, no-store`, error bodies with codes only). What differs:

- **Size.** Body capped at 8192 bytes (`MEMBERSHIP_BODY_MAX_BYTES`), on `content-length` and again on the read body.
- **Consent on the server.** The privacy consent is checked in `parseMembershipRequest`, not only in the browser: a missing consent is `400` with `fields: ["consent"]`.
- **Turnstile action `socio`.** The check is the shared one in `src/lib/turnstile.ts` (success, hostname, action). The always-pass test secret is accepted in dev and also on the hostnames `localhost` and `127.0.0.1`, for both `/api/socio` and `/api/ordine`.
- **No amount from the client.** The fee and the areas come from the published `membership` singleton, re-read on every request and resolved by id (`resolveMembershipChoices`); the client sends ids only, a draft-only or unknown tier is rejected, and the amount and the bank causale in the answer are the server's.
- **Save, then notify.** The row goes into the D1 table `membership_requests` with the code `SO-YYMMDD-XXXX` (one retry on a clash on `membership_requests.code`). One plain-text email goes to `info@multimage.org` through the `MEMBERSHIP_MAIL` `send_email` binding, with reply-to the applicant, and `notify_status` is updated. The visitor gets no email.
- **New personal data.** The form collects date and place of birth and the full address, which `/borsa` does not. There is **no retention rule** for these rows (owner, 2026-11-24): they stay until someone erases them with the UPDATE by `code` in `d1/README.md`. TODO **BORSA-privacy** covers the policy side (birth data, address, iubenda).
- **Logs.** `[socio] <status> <code>` (or `[socio] 200 ok areas=<n> saved=<bool> notified=<bool>`), plus `code_clash`, `save_error` and `notify_update_error`: counts only, never a name, email, birth data, address or token.

The WAF rate limiting rule covers both endpoints (`/api/ordine` and `/api/socio`, one shared counter per IP); see `docs/guidelines/operations.md`.

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
| `TURNSTILE_SECRET_KEY` | server | secret | yes | no | `src/pages/api/ordine/index.ts`, `src/pages/api/socio/index.ts` | Worker secret only (unset = `/api/ordine` and `/api/socio` answer 503) |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | client | public | no | **YES** | `src/pages/cerca/index.astro` (via `import.meta.env`), search bundle | yes |
| `PUBLIC_SITE_URL` | client | public | no | **YES** | BaseLayout canonical, sitemap, `post-deploy` | yes |
| `PUBLIC_TURNSTILE_SITE_KEY` | client | public | yes | **YES** | `src/pages/borsa/index.astro`, `src/pages/diventa-socio/index.astro` (widget) | build env file (`.env.cloudflare`), inlined at build; unset = `/borsa` shows the email box and `/diventa-socio` swaps the form for a "Scrivi a info@multimage.org" mailto button |
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
