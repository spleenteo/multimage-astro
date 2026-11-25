# V1 packet — work diventa-socio

Repo: /Users/spleenteo/Sites/multimage/multimage-astro, branch work/diventa-socio. Effective test level: essential (no test runner; checks = gate + the Done runs).

## Slice section (slices.md)

## Context

- **Singleton** `membership` on the primary environment `home-featured-book` (backup env `bkup-2026-11-24`): live fields `slug` (`diventa-socio`), `seo`, `title`, `subtitle` (HTML text), `content` (structured text). The record `D-sTlquHR7GiqaEOpMA80w` is published. The committed `schema.ts` is stale (shows `title` + `description`): regenerate before writing queries.
- **Form fields** (owner's list): email, first name, last name, date of birth, place of birth, address line 1, address line 2, city, state/province/region, postal code, country (default Italia), fee type (one of the CMS tiers, e.g. "10€ — Studente under 25"), payment method (bonifico | PayPal), collaboration areas (checkboxes from the CMS, "altro" with free text). Plus a required privacy consent with membership-specific wording, since the form collects date of birth and address.
- **Mailbox**: info@multimage.org, through a new `send_email` binding. Added as an Email Routing destination on 2026-11-24, **unverified** until the owner clicks the link sent to info@.
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


## lessons.md
(none yet: first slice)

## Matching decisions (descriptions)
- docs/decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md — On Cloudflare, Workers Cache behind a cache-off gateway entrypoint, with DatoCMS cache tags purged by webhook; no Vary: Cookie, no site-wide purge.
- docs/decisions-log/2026-05-31-editor-session-gating.md — The draft-mode cookie becomes a single "editor session" and the one authorization boundary for all internal routes (S1, CWE-200).
- docs/decisions-log/2026-05-30-isr-cutover-fixes.md — Four issues from the single-project ISR cutover, each non-obvious and likely to recur (such as DATOCMS_BASE_EDITING_URL needing the bare admin URL).

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


Owner override of datocms rules 4/5/8 for this work: schema change applied directly on primary via CMA, no migration script (model linked to nothing, backup env bkup-2026-11-24).

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

### docs/guidelines/blocks-and-components.md
---
description: Fastro distinguishes between CMS content related Blocks and regular UI Components.
---

# Blocks and Components

Everytime you have to create a vomponent, follow these instructions

## Block and component files

Fastro is based on the Astro project structure (see [Project Structure](./project-structure.md)). Fastro extends the default structure to group blocks next to the regular components:

```
src/
├── blocks/
│   ├── Blocks.astro
│   ├── Blocks.d.ts
│   └── SomeContentBlock/
│       ├── SomeContentBlock.astro
│       ├── SomeContentBlock.fragment.graphql
│       ├── SomeContentBlock.client.ts
│       └── SomeContentBlock.test.ts
│
└── components/
    └── SomeUiComponent/
        ├── SomeUiComponent.astro
│       ├── SomeContentBlock.client.ts
│       └── SomeContentBlock.test.ts
```

- [Components](https://docs.astro.build/en/core-concepts/astro-components/) are the UI elements the website is composed of. This can be Astro and framework specific components.
- Blocks are a specific set of components which have a complementary content [Block](https://www.datocms.com/docs/content-modelling/blocks) in DatoCMS and therefore have a paired GraphQL Fragment file.
- Optionally blocks and components have a complementary `*.client.ts` file for client-side scripts and a `*.test.ts` file for related unit tests.

See [CMS Data Loading](./cms-data-loading.md) for documentation on the use of GraphQL Fragment files.

## Block templates

Fastro uses the same convention for props and types for every Block: the `Props` interface always contains a `block` property containing the type based on the CMS model. This `block` type is automatically generated based on a Block's GraphQL Fragment file (see [CMS Data Loading](./cms-data-loading.md#graphql-files)). This means a basic Block template looks like this:

```astro
---
import type { SomeContentBlockFragment } from '@lib/datocms/types';

interface Props {
  block: SomeContentBlockFragment;
}

const { block } = Astro.props;
---

{block.someContentBlockField}
```

## Modular Blocks

Within the CMS the Blocks are used in [Modular Content](https://www.datocms.com/docs/content-modelling/modular-content) and [Structured Text](https://www.datocms.com/docs/content-modelling/structured-text) to create dynamic layouts.

Pages and other templates can use the `<Blocks />` component to render a Modular Content or Structured Text field. For example:

```astro
---
import { datocmsRequest } from '@lib/datocms';
import Blocks from '@blocks/Blocks.astro';
import query from './_index.query.graphql';

const { page } = await datocmsRequest({ query, variables: { locale: Astro.params.locale } });
---

<Blocks blocks={page.bodyBlocks} />
```

When you create a new Block, you need to register it in [`blocks/Blocks.astro`](../src/blocks/Blocks.astro) (using the CMS model's typename) and add its type to [`blocks/Blocks.d.ts`](../src/blocks/Blocks.d.ts):

Register a new Block's template:

```astro
---
// src/Blocks/Blocks.astro:

import type { AnyBlock } from './Blocks';
import ImageBlock from './ImageBlock/ImageBlock.astro';
// import your new Block template (order imports A to Z):
import SomeContentBlock from './SomeContentBlock/SomeContentBlock.astro';
import TextBlock from './TextBlock/TextBlock.astro';

const blocksByTypename = {
  ImageBlockRecord: ImageBlock,
  // register your new Block using its CMS model's typename (order A to Z):
  SomeContentBlockRecord: SomeContentBlock,
  TextBlockRecord: TextBlock,
};

interface Props {
  blocks: AnyBlock[];
}
const { blocks } = Astro.props;
---
```

Register a new Block's type:

```ts
// src/Blocks/Blocks.d.ts:

import {
  ImageBlockFragment,
  // import new Block's Fragment:
  SomeContentBlockFragment,
  TextBlockFragment,
} from '@lib/datocms/types';

export type AnyBlock =
  | ImageBlockFragment
  | SomeContentBlockFragment // and add it here (order A to Z)
  | TextBlockFragment;
```

## Client-side scripts

Astro supports [client-side scripts inside components](https://docs.astro.build/en/guides/client-side-scripts/#client-side-scripts). Fastro uses the convention to include these as external scripts for better TypeScript intellisense and linting. To distinguish server-side files (most in Astro) from client-side scripts we use a `.client.ts` extension. So blocks and components can include these as `<script src="./SomeComponent.client.ts"></script>`.

## Focus and colour contrast

- **Focus**: one global `:focus-visible` rule in `src/styles/global.css` draws a 3px outline in `var(--focus-ring)`, navy by default. A dark surface sets `[--focus-ring:var(--color-white)]` on its root (the header and footer do). Do not add `focus:outline-hidden`; if an outline needs to sit inside its box (dropdown items), use `focus-visible:-outline-offset-4`.
- **Link colour on focus**: the compat rule `:where(a):focus` turns links navy. On a dark or coloured surface, add `focus:text-white` (and `hover:text-white`) to links, or their text disappears while focused.
- **Action colour**: white text sits on `bg-brand-orange-deep` (#b84f00, 5.05:1), never on `bg-brand-orange` (#fa7810, 2.7:1). Keep `brand-orange` for decoration with no text on it. Text on a coloured fill needs 4.5:1 (3:1 only from 18.66px bold or 24px).
- **Skip link**: `BaseLayout.astro` renders "Vai al contenuto" before the header, pointing at `<main id="contenuto">`.

### docs/guidelines/caching.md
---
description: How page caching and revalidation work on both targets (Vercel ISR with a URL-based webhook in production, Cloudflare Workers Cache with DatoCMS cache tags on the branch), what each route depends on, and the known gaps
---

# Caching and revalidation

Audited 2026-11-04 (work `upgrade-2026-11`, slice V1), updated 2026-11-05 for slice V2 (revalidation map fixes), and 2026-11-21 (V3) with the Cloudflare section. This file describes the caching as it is, not as it should be.

## Status

**Two targets, one codebase.** The target is chosen at build time (`DEPLOY_TARGET=cloudflare` selects `@astrojs/cloudflare`, otherwise `@astrojs/vercel`).

- **Vercel (production today)**: ISR, URL-based revalidation. A DatoCMS webhook calls `/api/revalidate`, which maps the changed record to a list of public URLs and refetches each one with the Vercel bypass header so the ISR copy is regenerated. Cache tags are not used. `## Configuration (Vercel)`, `## DatoCMS side`, the route table, the Gaps and the Verification procedure describe this path.
- **Cloudflare (branch `chore/cloudflare`, trial Worker, not yet switched)**: Workers Cache with DatoCMS cache tags, purged by `POST /api/invalidate-cache`. See `## Cloudflare Workers (branch chore/cloudflare)` below. On Vercel there is no cache provider (`context.cache.enabled` is false), so none of that code runs there.

The switch procedure is `docs/guidelines/cloudflare-switch.md`. Cache tags are the shape `docs/shapes/2026-03-05-cache-tags.md`.

## Configuration (Vercel)

- **ISR** (`astro.config.mjs`, `@astrojs/vercel`): `output: 'server'`, nothing is prerendered; every page is an ISR function.
  - `bypassToken: process.env.BYPASS_TOKEN` is read at **build time** from the process environment, so `BYPASS_TOKEN` must be exported when building locally (the build output differs without it).
  - `expiration: 5184000` (60 days) is only a safety net for a missed webhook. Short TTLs re-render about 670 URLs and burn Fast Origin Transfer on the Hobby plan (decision `2026-06-20-fot-reduction`).
  - `exclude: [/^\/api\//]`: API routes are never cached.
  - Since `@astrojs/vercel` 11, `allowQuery` is `x_astro_path` plus `x_astro_path_token`, and the ISR routes rewrite to `/_isr?x_astro_path=$1&x_astro_path_token=<per-build token>` (the token is a `crypto.randomUUID()` per build, never stored; the option names in `astro.config.mjs` are unchanged).
- **Dual cookies** (`src/lib/draftMode.ts`): entering draft mode sets two cookies for 30 days, `multimage_draft_mode` (name overridable with `DRAFT_MODE_COOKIE_NAME`; signed JWT, app-level: unlocks drafts, `/staff`, editor affordances) and `__prerender_bypass` (value `BYPASS_TOKEN`, infra-level: the Vercel CDN skips the ISR copy and renders fresh). `__prerender_bypass` is only set when `BYPASS_TOKEN` exists. Both are `SameSite=None; Secure; Partitioned`.
- **`POST /api/revalidate?token=<SECRET_API_TOKEN>`** (`src/pages/api/revalidate/index.ts`, helpers in `src/lib/datocms/`):
  - **Surgical mode** (default): `parseWebhookPayload` extracts `event_type`, the record `id` (used by `license`), the record `slug` and the model `api_key` (looked up through `entity.relationships.item_type` in `related_entities`); `getRevalidationUrls` maps `api_key` + `slug` to URLs. No `api_key`, or a model not in the map, is a 200 no-op (`noop: true`), so DatoCMS sees success.
  - **Book enrichment**: a `book` change runs one published-token query (`BookRevalidationContext`) to add the catalogue pages (`/libri`, `/libri/pagina/N`), the book's authors and its collection. On failure it falls back to `/libri` only. On unpublish/delete the book no longer resolves, so authors and collection are skipped.
  - **`?mode=full`**: revalidates every public URL (`getAllPublicUrls`, about 670). Manual maintenance only; **never run it against production by hand**.
  - Each URL is fetched with `x-prerender-revalidate: <BYPASS_TOKEN>` against `PUBLIC_SITE_URL`, in chunks of 20 with a 250 ms pause. Locally `PUBLIC_SITE_URL` is the production site.
  - **No Site Search reindex** (since 2026-11-24): the index is re-spidered once a day by the gateway Worker's Cron Trigger (`scheduled` in `src/worker.ts`, `0 2 * * *` UTC in `wrangler.jsonc`), which calls the CMA `build-triggers/<SITE_SEARCH_BUILD_TRIGGER_ID>/reindex` with `DATOCMS_CMA_TOKEN`. A reindex per publish sent `DatoCmsSearchBot` over freshly purged pages; on 2026-11-23 a bulk edit of authors (about 4,000 webhooks in two hours) made it re-crawl `/libri?autore=…` against an empty cache and the Worker hit the Free plan CPU limit about 950 times. New content reaches the search within a day; pages still refresh on publish.
  - **The `success` count lies**: `index.ts:55` counts every settled fetch as success, including 401 and 404 responses; only a rejected fetch is a failure. Judge by `x-vercel-cache` and `age` headers on the affected URLs, never by the JSON counts.
- `/archived-books.json` sets its own `Cache-Control: public, max-age=3600, immutable` (`src/pages/archived-books.json.ts:27`), independent of ISR.
- `/search-books.json` (book details for `/cerca`) sets `Cache-Control: public, max-age=3600` and is in the middleware's `CACHED_NON_HTML_PATHS`, so the Workers Cache keeps it with its `book` tags and a book publish purges it.
- `recordToWebsiteRoute` in `recordInfo.ts` is the sibling map used by the Web Previews / SEO plugins; `revalidationUrls.ts` says to keep the two in sync. Since V2 both read the index paths from one export, `INDEX_PAGE_PATHS` (slug → path, `recordInfo.ts`, no imports), and the 7 phantom api_keys are gone from both. `recordInfo.ts` maps `index_page` by slug and `supplier` → `/distributori`; it maps no route for `license` or `app` (no page of their own).
- `getRevalidationUrls(input, query?)` takes an injectable `query`; the default is a lazy import of `executeQuery`, so the map loads under plain `tsx` (the endpoint passes none and behaves as before).

## DatoCMS side

Read-only, through the `datocms` CLI (`cma:call webhooks find 33942`, `schema:inspect`).

**Webhook 33942**, "Revalidate site cache (ISR)": enabled; payload API version 3; `auto_retry` true; `nested_items_in_payload` false; no custom payload, no filter; one event rule, `entity_type: item`, `event_types: publish, unpublish, delete`; URL `https://www.multimage.org/api/revalidate?token=<redacted>`. There are **no upload (asset) events** and no `update` event: saving a draft does nothing, an asset replaced in place does not revalidate anything.

**Models** (`schema:inspect`, 36 total). Mapped in `getRevalidationUrls`: `book`, `author`, `collection`, `blog_post`, `page`, `home`, `index_page`, `supplier`, `license`, and `app` as a deliberate no-op. `index_page` is the real model behind every index page (one record per page, read by `slug`: `libri`, `archivio`, `collane`, `autori`, `magazine`, `distributori`); the `libri` slug maps to `/libri` only (the catalogue is one faceted page since 2026-11-22; `/libri/ebooks` and `/libri/highlights` are 301s to its filters), and an unknown slug, `ebooks` and `highlights` included, is a no-op. `supplier` revalidates `/distributori`. `license` has no slug: the payload's record id finds the books that link it (`allBooks(filter: { license: … })`), and only those books' `/libri/<slug>` pages are revalidated. `app` returns no URL on purpose: its only reader, `/libri/schede/[slug]`, is staff-gated, so a revalidation fetch would only re-cache the anonymous 404. The 7 api_keys V1 found mapped but absent from the project (`books_index`, `archive_index`, …) were removed in V2.

| api_key           | Kind      | Read by                                                                                              | Mapped                               |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `home`            | singleton | `/`                                                                                                  | yes                                  |
| `book`            | record    | book pages, catalogue, home blocks, author/collection, sitemap, staff pages                          | yes                                  |
| `author`          | record    | author pages, book cards, structured-text links, book detail and staff pages                         | yes                                  |
| `collection`      | record    | collection pages, book detail, home featured book, staff pages                                       | yes                                  |
| `page`            | record    | `/info/[slug]`, header/footer menu on every page                                                     | yes                                  |
| `blog_post`       | record    | `/magazine`, `/magazine/[slug]`, book detail (`reviews`)                                             | yes                                  |
| `index_page`      | record    | every index page (by slug)                                                                           | yes                                  |
| `supplier`        | record    | `/distributori`                                                                                      | yes                                  |
| `license`         | record    | `/libri/[slug]` and `/libri/schede/[slug]` (rendered); the card fragments fetch it, no card shows it | yes (its books' pages, by record id) |
| `app`             | singleton | `/libri/schede/[slug]` (`pdfFooter`)                                                                 | no-op by design (staff-only reader)  |
| `cover_size`      | record    | `/libri/[slug]`, `/libri/schede/[slug]`, `/staff/archivio-catalogo` (`dimension`)                    | no                                   |
| `blog_category`   | record    | `/magazine`, `/magazine/[slug]`                                                                      | no                                   |
| `blog_author`     | record    | `/magazine`, `/magazine/[slug]` (post `author`), `/libri/[slug]` (review `author`)                   | no                                   |
| `keyword`         | record    | `/staff/archivio-catalogo` (`book.keywords`)                                                         | no                                   |
| `blog_tag`        | record    | no route query                                                                                       | no                                   |
| `blog_post_old`   | record    | no route query (legacy)                                                                              | no                                   |
| `project_comment` | record    | no route query (editor comments)                                                                     | no                                   |

Block models (`modular_block: true`, 19 of them: `reprint`, `image_block`, `video`, `banner`, `question`, `single_book`, `book_carousel`, `pills_block`, `menu_item`, `newsletter_subscription`, `menu_dropdown`, `single_info_block`, `button`, `faq_section`, `footer_menu_block`, `social_link`, `single_author`, `menu_external_item`, `cta_button_with_image`) have no webhook events of their own: they live inside a parent record, and publishing the parent fires the event for the parent's model. They are excluded from the route audit below.

## Route → models → revalidated?

Layout dependency for every HTML route: `BaseLayout.astro` `SITE_QUERY` reads `_site` (favicon tags) and `allPages` filtered by `menu` / `menuFooter` (header and footer menus). Only the `page` model feeds it, and a `page` publish revalidates just `/info/[slug]`, `/info` and the sitemap, so **the menus of every other page stay stale** until their ISR copy expires (60 days) or another event touches them. Cell "partial" says which event is missing.

| Route                       | Models read (besides layout `page`)                                                                                                                        | Revalidated?                                                                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                         | `home`, `book` (carousel/single book), `author` (card names), `collection` (featured book), `license` (fetched by the card fragments, not rendered)        | partial: `home`, `book` yes; `author`, `collection` no; page menus no                                                                                                                       |
| `/libri`                    | `index_page`, `book`, `author` (card names), `license` (fetched by the card fragments, not rendered)                                                       | partial: `book`, `index_page` yes; `author` no; page menus no                                                                                                                               |
| `/libri/pagina/[page]`      | `index_page`, `book`, `author`, `license` (fetched by the card fragments, not rendered)                                                                    | partial: `book` yes while the page exists (count from published books), `index_page` yes; `author` no; page menus no                                                                        |
| `/libri/[slug]`             | `book`, `author`, `collection`, `license`, `cover_size`, `blog_post` (`reviews`), `blog_author` (review author); sibling books by authors/collection/title | partial: the book's own save and `license` (by record id) yes; `author`, `collection` rename, `cover_size`, `blog_post`, `blog_author`, sibling-book changes no; old slug no; page menus no |
| `/libri/archivio`           | `index_page`, `book`, `license` (fetched by the card fragments, not rendered)                                                                              | partial: `book`, `index_page` yes; page menus no                                                                                                                                            |
| `/libri/schede/[slug]`      | `book`, `author`, `collection`, `license`, `cover_size`, `app` (internal, staff-gated, editor-only)                                                        | no: not in any list (editor cookie bypasses the cache); `app` is a no-op by design, `license` maps only the public book pages                                                               |
| `/autori`                   | `index_page`, `author`, `book`                                                                                                                             | partial: `author`, `index_page` yes; `book` no (book count on cards); page menus no                                                                                                         |
| `/autori/[slug]`            | `author`, `book` (author's books), `license` (fetched by the card fragments, not rendered)                                                                 | partial: `author` yes; `book` add yes on publish, removal from the old author no (enrichment reads current relations), unpublish/delete no; old slug no; page menus no                      |
| `/collane`                  | `index_page`, `collection`, `book`                                                                                                                         | partial: `collection`, `index_page` yes; `book` no; page menus no                                                                                                                           |
| `/collane/[slug]`           | `collection`, `book`, `license` (fetched by the card fragments, not rendered)                                                                              | partial: `collection` yes; `book` add yes on publish, removal from the old collection no (enrichment reads current relations), unpublish/delete no; old slug no; page menus no              |
| `/magazine`                 | `index_page`, `blog_post`, `blog_category`, `blog_author`                                                                                                  | partial: `blog_post`, `index_page` yes; the others no; page menus no                                                                                                                        |
| `/magazine/[slug]`          | `blog_post`, `blog_category`, `blog_author`, linked `author`/`page`/`book`, `license` (fetched by the card fragments, not rendered)                        | partial: `blog_post` yes; the others no; old slug no; page menus no                                                                                                                         |
| `/info`                     | no CMS data (static "coming soon" page)                                                                                                                    | yes (layout `page` menus, via `page` events)                                                                                                                                                |
| `/info/[slug]`              | `page`, linked `author`/`book`/`blog_post`, `license` (fetched by the card fragments of linked books, not rendered)                                        | partial: `page` yes; linked records no; old slug no; page menus no (other pages)                                                                                                            |
| `/distributori`             | `index_page`, `supplier`                                                                                                                                   | yes: `index_page`, `supplier`; page menus no                                                                                                                                                |
| `/cerca`                    | no CMS data (Site Search runs client-side); layout `page` menus only                                                                                       | no: layout `page` menus not revalidated                                                                                                                                                     |
| `/cerca/search-page.client` | not a page: client bundle source, no handler                                                                                                               | n/a                                                                                                                                                                                         |
| `/staff`                    | `book` (counts); internal, gated by middleware                                                                                                             | no: not in any list (editor cookie bypasses the cache)                                                                                                                                      |
| `/staff/archivio-catalogo`  | `book`, `author`, `collection`, `cover_size`, `keyword`; internal, gated by middleware                                                                     | no: not in any list (editor cookie bypasses the cache)                                                                                                                                      |
| `/archived-books.json`      | `book` (archived slugs)                                                                                                                                    | no: `book` events do not include it; the response itself is `Cache-Control: public, max-age=3600, immutable` (`archived-books.json.ts:27`)                                                  |
| `/sitemap.xml`              | `book`, `page`, `collection`, `author`, `blog_post` (slug, `updatedAt`)                                                                                    | yes for every mapped model (all add the sitemap); catalogue pages via `book` enrichment                                                                                                     |

## Cloudflare Workers (branch `chore/cloudflare`)

Described from the code (`src/worker.ts`, `src/middleware.ts`, `src/lib/datocms/{executeQuery,cacheTags,cacheInvalidation}.ts`, `src/pages/api/invalidate-cache/index.ts`, `wrangler.jsonc`). Decision and measurements: `docs/decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md`. Switch-day steps: `docs/guidelines/cloudflare-switch.md`.

### Gateway and Backend

`wrangler.jsonc` turns Workers Cache on for the Worker and defines two entrypoints (`exports`):

- **Gateway** (`default`, `src/worker.ts`, cache off): runs on every request. If the draft cookie is present (name `DRAFT_MODE_COOKIE_NAME` trimmed, else `multimage_draft_mode`; the rule is copied from `src/lib/draftMode.ts`, keep them in sync) it forwards with `cache: 'no-store'`, so an editor never reads or fills the shared copy. Outside `/api` it sets `cf.cacheKey` to the path only, so `?utm_*`, `?fbclid` and other query strings share one entry. Every request, POST included, goes to `Backend`.
- **Backend** (cache on): wraps the Astro handler. Every render and every purge runs here, because a purge only reaches the cache of the entrypoint that calls it. A cache hit uses no CPU; each page view bills two requests (gateway plus Backend).

The middleware makes the one cache decision per request, after `next()` (queries never call `cache.set`). Anything not listed is private.

| Route                                                                                                           | Policy                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Public GET page, `text/html`, status 200, no draft                                                              | cached, `maxAge` 60 days, DatoCMS tags                                                                        |
| `/sitemap.xml`, `/archived-books.json`, `/search-books.json` (GET 200, no draft)                                                      | cached, `maxAge` 60 days, tags (they run CDA queries, so a purge keeps them fresh)                            |
| Endpoints with no CDA query (none today: `robots.txt` is a static asset)                                        | `cache.set(false)`                                                                                            |
| Internal paths (`/staff`, `/libri/schede`), `/api/*`, non-GET, non-200, any draft request, any draft CDA query | `cache.set(false)` plus `Cache-Control: private, no-store` (draft requests answer `cf-cache-status: DYNAMIC`) |

The draft bypass is double (gateway `no-store`, middleware `set(false)`): draft HTML carries the draft CDA token, so a stored draft render would leak it. For cacheable rows the middleware buffers the body first, because the tags are collected while the page streams and a draft query during the stream turns the row private. Internal paths without a session answer a flat 404, private.

### Tags

- `executeQuery` runs published queries through `rawExecuteQuery` with `returnCacheTags` and pushes the response's `x-cache-tags` into a per-request AsyncLocalStorage store (`cacheTags.ts`), opened by the middleware only on Cloudflare GET requests outside `/api`. A draft query marks the store `disabled`. See `cms-data-loading.md`.
- `BaseLayout` marks its site query `cacheTagScope: 'layout'`; an HTML page with no layout tags is treated as unpurgeable (below). `/sitemap.xml` and `/archived-books.json` have no layout, so the check there is a tag count above 0.
- **Coarse fallback**: when there are no tags, more than 990 (`MAX_PAGE_TAGS`; Cloudflare keeps the first 1000 and appends its own path tag), an invalid tag (comma, characters outside `0x21-0x7E`, over 1024 chars), or an HTML page with no layout tags, the page is stored with the single tag `site` and a `maxAge` of 1 day (`COARSE_MAX_AGE`) instead of 60 days. Every purge adds `site`, so a coarse page is purged by any publish and expires in a day at most.
- Measured on the trial Worker (V2): 27 to 515 tags per page (`/` 66, `/libri` 156, `/autori` 515, `/sitemap.xml` 500, `/archived-books.json` 27), none coarse.
- The middleware logs one JSON line per cached page: `{"event":"cache-tags","path","tagCount","hasLayoutTags","coarse","reason"}` (`console.warn` when coarse).

### `POST /api/invalidate-cache`

DatoCMS `cda_cache_tags` / `invalidate` webhook receiver, `Authorization: Bearer <CACHE_INVALIDATION_WEBHOOK_SECRET>`. It purges through `locals.cfContext.cache.purge` (not `context.cache.invalidate`, which ignores the purge result, and not an import of `cloudflare:workers`, which breaks the Vercel build) and never calls `cache.set`. Order of answers:

| Status | When                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 401    | secret unset or bearer mismatch (constant-time compare)                                                                           |
| 400    | body is not JSON, or has no valid `entity.attributes.tags` (array of non-empty strings)                                           |
| 503    | no cache provider or no `cfContext` (Vercel)                                                                                      |
| 200    | `{ purged: 0, batches: 0, noop: true }` for an empty tags array; otherwise `{ purged, batches }` after a good purge                |
| 502    | a purge batch failed; the run stops at the first failure so DatoCMS retries                                                       |

Invalid tags are dropped and counted in the log; `site` is added to every non-empty purge. Tags go in batches of 100 (Free limit), in sequence. The Free plan allows 5 purge requests per minute with a burst of 25: 30 calls in a row gave 25 times 200 then 502 with Cloudflare code 1134 ("rate limit reached"), and the DatoCMS retry is the recovery. Logs carry counts only, never the bearer or the tags. After a good purge it triggers the Site Search reindex (`reindexSiteSearch`, needs `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID`). The old `/api/revalidate` webhook must be disabled at the switch: on the Worker it answers 500 `BYPASS_TOKEN not configured` (before any reindex) and DatoCMS would retry every publish.

### Things that empty or skip the cache

- A deploy or `wrangler secret put` creates a new Worker version, and the cache is partitioned by version: it starts empty. There is no purge-everything endpoint, so a full purge is a redeploy (`npm run deploy:cf`).
- Files under `public/` (`robots.txt`, bundles in `public/generated/`) are served by Workers Assets before the Worker runs: the middleware policy never applies to them and they leave no `wrangler tail` event. Control them with a `_headers` file.
- Every deploy, purge, draft view and `/api` call is a render (a miss): this is why the Free plan's 10 ms CPU limit is the constraint, see the runbook.

### Checks

```bash
npm run check:cache-tags                       # pure checks of tag decisions and payload parsing, no network
curl -sI https://<host>/libri | grep -i cf-cache-status     # MISS, then HIT
npx wrangler tail multimage-astro --format json # the cache-tags lines, per page
```

`wrangler tail` drops events under a burst: for rate-limit checks count the HTTP answers, not the log lines. Check the status line with `-w '%{http_code}'` (curl prints `HTTP/2 200` with no colon).

## Gaps and fate

These gaps and the route table above are the Vercel URL map; on Cloudflare the tags replace the map (a publish purges every page that read the record, layout menus included). Fate `fixed in V2` / `closed in V2`: done in slice V2 (caching behaviour); `TODO` goes to `docs/TODO.md`.

| #   | Gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Fate         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | 7 mapped api_keys did not exist (`books_index`, `archive_index`, `highlights_index`, `ebooks_index`, `collections_index`, `authors_index`, `magazine_index`) while `index_page` (by slug) was unmapped. Fixed in V2: `index_page` is mapped by slug in `revalidationUrls.ts` and `recordInfo.ts`, the phantom keys are removed                                                                                                                                                         | fixed in V2  |
| 2   | `supplier` was unmapped. Fixed in V2: it revalidates `/distributori`                                                                                                                                                                                                                                                                                                                                                                                                                   | fixed in V2  |
| 3   | `license` unmapped: every page that shows a book card or the featured book (`/`, `/libri*`, `/autori/[slug]`, `/collane/[slug]`, `/info/[slug]`, `/magazine/[slug]`) and the book sheets shows a stale license. Fixed in V2: the license is rendered only on `/libri/[slug]` (`buildEditionDetails`); the card fragments fetch it but no card shows it, so `license` revalidates only its books' pages                                                                                 | fixed in V2  |
| 4   | `app` (singleton; `pdfFooter` on the staff book sheet) is a no-op by design: its only reader `/libri/schede/[slug]` is staff-gated, so revalidating it would only re-cache the anonymous 404. Closed in V2                                                                                                                                                                                                                                                                             | closed in V2 |
| 5   | `page` menus: header/footer menus on every page are fed by `page` (`menu`, `menuFooter`, `label`, `position`) but a page event only revalidates `/info/[slug]`, `/info` and the sitemap                                                                                                                                                                                                                                                                                                | TODO         |
| 6   | Book unpublish/delete: the enrichment query returns no book, so author and collection pages (and the old catalogue count) are skipped; on a relation change the old author or collection page is never refreshed (enrichment reads current relations)                                                                                                                                                                                                                                  | TODO         |
| 7   | Slug change: the event carries only the new slug, the old URL stays cached                                                                                                                                                                                                                                                                                                                                                                                                             | TODO         |
| 8   | No upload events on the webhook: replacing or editing an asset revalidates nothing                                                                                                                                                                                                                                                                                                                                                                                                     | TODO         |
| 9   | Referenced records: `author` or `collection` rename does not refresh book cards, book detail, catalogue or home; a book change does not refresh sibling books (same author/collection/title)                                                                                                                                                                                                                                                                                           | TODO         |
| 10  | `cover_size`, `blog_category`, `blog_author`, `keyword` unmapped (read by book detail, book sheets, magazine pages and the staff catalogue)                                                                                                                                                                                                                                                                                                                                            | TODO         |
| 11  | `/archived-books.json` is not in the `book` URL list                                                                                                                                                                                                                                                                                                                                                                                                                                   | TODO         |
| 12  | Unmapped model or payload without `api_key` returns 200 `noop`, and `success` counts 401/404 as ok (`index.ts:55`): DatoCMS and the JSON never show a failed revalidation                                                                                                                                                                                                                                                                                                              | TODO         |
| 13  | `revalidationUrls.ts` and `recordInfo.ts` are two hand-synced maps with no check between them. Narrowed in V2: the index paths now live once (`INDEX_PAGE_PATHS`); the rest of the two maps is still synced by hand                                                                                                                                                                                                                                                                    | TODO         |
| 14  | `blog_post` or `blog_author` change does not refresh the books that link it as a review (`book.reviews`, shown on `/libri/[slug]`)                                                                                                                                                                                                                                                                                                                                                     | TODO         |
| 15  | `/staff` without session: the middleware 404 is cached by Vercel (`x-vercel-cache: HIT`, run (c)). Verify an editor session reaches `/staff` and `/libri/schede` on production despite the cached anonymous 404; depends on `__prerender_bypass`, i.e. `BYPASS_TOKEN` set in the Vercel production env. V4 preview (2026-11-05, Astro 7): anonymous `/staff` 404, then 200 with the draft session (`__prerender_bypass`), then 404 again in a clean session; production still to check | TODO         |

## Verification procedure

Three checks, from the cheapest to the most real. None of them may call the production endpoint: locally `PUBLIC_SITE_URL` is the production URL, so `/api/revalidate` would fetch production pages with `x-prerender-revalidate` and trigger the production Site Search reindex.

### (a) URL map, no network

```bash
npm run check:revalidation-map
```

It runs `parseWebhookPayload` and `getRevalidationUrls` on the sample payloads in `scripts/revalidation-map/payloads/` (one per model, plus `malformed`), with the query function replaced by a stub passed in directly. It then checks `recordToWebsiteRoute` on a table of routes. It opens no connection and needs no token.

- Any Node that supports `--import` (>= 20.6) runs it: no loader hooks, the repo runs on Node 24 (`.nvmrc`). A preload (`sentinel.mjs`) sets the failing exit code and blocks `fetch`.
- `tsx` is not a devDependency: the script uses the copy hoisted by the `datocms` CLI.
- Output, one line per payload: `file event api_key slug n STATUS`, where `n` is the number of URLs. Then one line per route: `route api_key slug result STATUS`. Then `N payloads, R routes, M mismatches, fetch calls: K`. Exit code 1 if `M` or `K` is above 0, or if an entry never ran (sentinel), or if a payload file is missing.
- `OK`: the result matches what the script expects. `GAP`: the model is known to be under-served (see "Gaps and fate"). After V2 only `page` (gap 5, menus) and `book-unpublish` (gap 6) print `GAP`. A `GAP` is not a failure: it is the recorded state of the code. `MISMATCH` is a failure: the code changed and the expectation did not.
- The expectations describe the code **after V2**. When a later slice closes gap 5 or 6, the `GAP` lines must turn `OK` and the expectations in `scripts/revalidation-map/check.ts` change with them.

### (b) Local `astro dev`, with overrides

Pick a free port at run time. Never use 4321 (the user's own `astro dev`, which has the production `PUBLIC_SITE_URL`) or 4329 (another project).

```bash
export PORT=4331
lsof -nP -iTCP:$PORT -sTCP:LISTEN   # must print nothing; otherwise pick another port
```

Overrides, for the shell session only (process env wins over `.env`):

- `PUBLIC_SITE_URL=http://localhost:$PORT`: the same port the server listens on, otherwise the endpoint fetches production URLs or the wrong server.
- `SITE_SEARCH_BUILD_TRIGGER_ID=` (empty): otherwise the endpoint triggers the production Site Search reindex.
- `BYPASS_TOKEN`: a throwaway value, because the ISR config reads it from the environment.
- `--ignore-lock` (on the command below): Astro 7 `astro dev` takes a project lock in `.astro/`; `--ignore-lock` runs a one-off foreground server that neither takes nor checks it, so it does not interfere with the user's own server on 4321.

```bash
PUBLIC_SITE_URL=http://localhost:$PORT SITE_SEARCH_BUILD_TRIGGER_ID= \
  BYPASS_TOKEN="$(openssl rand -hex 16)" npx astro dev --ignore-lock --port $PORT
```

Then POST the sample payloads, one request each: `book-publish`, `index_page-libri-publish`, `supplier-publish`, `app-publish` (a no-op), `license-publish` (with `entity.id` set to a real license id) and one with a wrong token.

```bash
curl -s -X POST "http://localhost:$PORT/api/revalidate?token=<SECRET_API_TOKEN>" \
  -H "content-type: application/json" \
  --data @scripts/revalidation-map/payloads/book-publish.json
```

Shell form, so the real token is never echoed or stored in history: wrap the call in single quotes and let `dotenv` expand the variable inside the child shell, for example `npx dotenv -e .env -- sh -c 'curl -s -X POST "http://localhost:'"$PORT"'/api/revalidate?token=$SECRET_API_TOKEN" -H "content-type: application/json" --data @scripts/revalidation-map/payloads/<file>.json'`. For the wrong-token case use `?token=wrong` and `-o /dev/null -w '%{http_code}'`.

Rules:

- **Never `?mode=full`**, locally or anywhere: it revalidates every route and reindexes.
- **Judge by `urls`, `mode`, `reindexed` and the dev log** (one `[status] /path` line per URL), **not by `success`**: the count includes 401 and 404 as fulfilled (`index.ts:55`). A log line containing `enrichment failed` means a count or license query fell back.
- Expected after V2: `book-publish` returns `"mode":"surgical"` and `"reindexed":false`; `index_page-libri-publish` returns `/libri` plus `/libri/pagina/2..N`; `supplier-publish` returns `["/distributori"]`; `app-publish` returns `"noop":true`; `license-publish` returns only `/libri/<slug>` URLs; the wrong token returns `401`. With the fixture slug, `book-publish` gives no status line for `/libri/libro-pubblicato` (the page throws), yet the endpoint counts it ok.
- Afterwards: stop the server (`lsof -nP -iTCP:$PORT -sTCP:LISTEN`, then kill the PID) and restore the schema that `sync-datocms` may have rewritten: `git diff --quiet -- schema.ts || git checkout -- schema.ts`.
- `astro preview` does not work with `@astrojs/vercel`: use `astro dev`.

### (c) Deployed, passive only

After a real editorial publish, read what DatoCMS sent and what the CDN holds. No POST to the endpoint, no resend of a webhook call, no `?mode=full`.

```bash
npx dotenv -e .env -- npx --no-install datocms cma:call webhookCalls list \
  --params '{filter:{fields:{webhook_id:{eq:"33942"},status:{eq:"success"}}},order_by:"last_sent_at_desc",page:{limit:5}}' \
  2>/dev/null | node -e 'const s=require("fs").readFileSync(0,"utf8"); for (const a of JSON.parse(s.slice(s.search(/^[\[{]/m)))) { let p={}; try{p=JSON.parse(a.response_payload)}catch(e){} console.log(a.last_sent_at,a.event_type,a.status,a.response_status,p.mode,p.total,JSON.stringify(p.urls)) }'
```

Do not add `--json`: it prints nothing here. Each call's `request_url` carries `?token=` and the headers hold secrets: the raw output goes straight into the filter and never reaches the terminal or the disk. Never print it, `head` included.

Print only `last_sent_at`, `event_type`, `status`, `response_status`, and from `response_payload` the `mode`, `total` and `urls` (never the request URL, which carries the token). Then, on 3 to 5 of those URLs plus `/` and `/distributori`:

```bash
curl -sI https://www.multimage.org<path> | grep -iE '^(x-vercel-cache|age|date):'
```

Read: `x-vercel-cache: HIT` with `age` smaller than the seconds since `last_sent_at` is consistent with a refresh by that publish. It shows the publish caused it only if a URL outside the list (e.g. `/distributori`) has a larger `age`, or no deploy came between the publish and the check. `MISS` right after a deploy is normal: a fresh deployment starts with an empty ISR cache. Webhook calls expire, so an old publish may no longer be listed.

### Runs — 2026-11-05 (V2)

Run on 2026-11-05, Node v24.18.0.

#### (a) `npm run check:revalidation-map`

```text
app-publish publish app null 0 OK
author-publish publish author autore-uno 3 OK
blog_post-publish publish blog_post articolo-uno 3 OK
book-publish publish book libro-pubblicato 12 OK
book-unpublish unpublish book libro-non-pubblicato 9 GAP
books_index-publish publish books_index null 0 OK
collection-publish publish collection collana-uno 3 OK
home-publish publish home null 2 OK
index_page-libri-publish publish index_page libri 3 OK
index_page-publish publish index_page autori 1 OK
index_page-unknown-publish publish index_page sconosciuta 0 OK
license-publish publish license null 2 OK
malformed publish null senza-modello skipped OK
page-publish publish page chi-siamo 3 GAP
supplier-publish publish supplier null 1 OK
route index_page libri /libri OK
route index_page ebooks /libri/ebooks OK
route index_page highlights /libri/highlights OK
route index_page archivio /libri/archivio OK
route index_page collane /collane OK
route index_page autori /autori OK
route index_page magazine /magazine OK
route index_page distributori /distributori OK
route index_page sconosciuta null OK
route supplier - /distributori OK
route books_index - null OK
15 payloads, 11 routes, 0 mismatches, fetch calls: 0
```

Exit 0. The two `GAP` lines match the open gaps: `book-unpublish` (6) and `page` (5). `app`, `index_page`, `license` and `supplier` are `OK`; `books_index` now yields no URL because the phantom key is gone.

After the final review the route table gained an `index_page` `constructor` row (inherited-property slug must yield no URL); re-run, same Node: `15 payloads, 12 routes, 0 mismatches, fetch calls: 0`.

#### (b) Local `astro dev`

`astro` v6.3.3 on `localhost:4331` (port free before; 4321 and 4329 untouched), with the overrides above. Requests went through the `dotenv` form, so the token was never echoed. License ids came from one read-only `cma:call items list` filtered to id and code: 7 licenses (`c`, `by`, `by-sa`, `by-nd`, `by-nc`, `by-nc-sa`, `by-nc-nd`); `by-nc-nd` and `by-nd` were used. Each payload was rewritten and piped into `curl --data @-`, with no file.

1. `index_page-libri-publish`: HTTP 200, `"mode":"surgical"`, `"total":9`, `"failures":0`, `"reindexed":false`, 1084 ms. URLs: `/libri`, `/libri/pagina/2` to `/libri/pagina/9` (real count, N = 9).
2. `supplier-publish`: `"total":1`, `"reindexed":false`, `urls` = `["/distributori"]`, 348 ms. Gap 2 is closed.
3. `app-publish`: `{"mode":"surgical","eventType":"publish","apiKey":"app","revalidated":0,"urls":[],"noop":true}`. This is the intended no-op: `app` is mapped to no URL.
4. `license-publish`, `by-nc-nd`: `"total":42`, `"failures":0`, `"reindexed":false`, 2962 ms. All 42 URLs are `/libri/<slug>` (for example `/libri/un-giorno-solo`, `/libri/sedna`, `/libri/sedna-ebook`); no `/`, no listing.
5. `license-publish`, `by-nd`: `"total":2`, `urls` = `["/libri/volti-dal-futuro","/libri/se-vuoi-la-pace-prepara-la-pace"]`, 505 ms.
6. `POST /api/preview-links` with a published `index_page` `libri` item: 1 link, label `Published version`, url `http://localhost:4331/api/draft-mode/disable?url=/libri` (published, so no token in the link). The Web Previews route for an index page resolves.

Dev log: 4 `[revalidate] Done (surgical). ... (search reindex: false)` lines (9, 1, 42 and 2 URLs, 0 failed); 0 lines with `enrichment failed`; 0 `ERROR` lines; no 4xx or 5xx status lines. So the lazy default `executeQuery`, the catalogue count query and the license filter work against the real CDA.

`book-publish` and the wrong-token case were not repeated in this run (covered by the 2026-11-04 run).

After the stop: port 4331 free, `schema.ts` unchanged (`git status --porcelain schema.ts` empty), the user's 4321 server still running. Every page fetch went to localhost; the only outbound calls were CDA reads (plus the one CLI read). Still open: the Done item "a real publish of an index page shows the index URL revalidated" goes through (c) after the production deploy.

### Runs — 2026-11-04

Run on 2026-11-05, Node v24.18.0.

#### (a) `npm run check:revalidation-map`

```text
app-publish publish app null 0 GAP
author-publish publish author autore-uno 3 OK
blog_post-publish publish blog_post articolo-uno 3 OK
book-publish publish book libro-pubblicato 12 OK
book-unpublish unpublish book libro-non-pubblicato 9 GAP
books_index-publish publish books_index null 2 OK
collection-publish publish collection collana-uno 3 OK
home-publish publish home null 2 OK
index_page-publish publish index_page autori 0 GAP
license-publish publish license null 0 GAP
malformed publish null senza-modello skipped OK
page-publish publish page chi-siamo 3 GAP
supplier-publish publish supplier null 0 GAP
13 payloads, 0 mismatches, fetch calls: 0
```

Exit 0. The six `GAP` lines match the recorded gaps: `app` (4), `book-unpublish` (6), `index_page` (1), `license` (3), `page` (5), `supplier` (2). `books_index` still yields URLs because the stale api_key is mapped (gap 1).

#### (b) Local `astro dev`

`astro` v6.3.3 on `localhost:4321`, with the three overrides above (port 4321 free before). Three requests, one each.

1. `book-publish`: HTTP 200, `"mode":"surgical"`, `"total":15`, `"failures":0`, `"reindexed":false`, `"elapsedMs":3309`.

   ```text
   /libri/libro-pubblicato /libri/ebooks /libri/highlights /libri/archivio
   / /sitemap.xml /libri /libri/pagina/2 ... /libri/pagina/9
   ```

   Dev log: a `[200]` line for 14 of the 15 URLs (88 to 602 ms); `/libri/libro-pubblicato` logged two `[ERROR] Book not found` lines and no status line (see below). Then `[revalidate] Done (surgical). 15 ok, 0 failed, total 15 URLs in 3309ms (search reindex: false)`.
   - 15 URLs, not the 12 of (a): the real CDA catalogue gives `/libri/pagina/2` to `/libri/pagina/9`, while the (a) stub (81 books) gives pages 2 and 3.
   - No `/autori/*` or `/collane/*`: the fixture slug is unknown to the CDA, so there are no related authors or collection.
   - `/libri/libro-pubblicato` has no `[200]` line: the page logged `Book not found for slug: libro-pubblicato`, yet the endpoint counted it among the 15 ok. This is the `success` gap (`index.ts:55`) seen live: any HTTP response counts as ok, 4xx/5xx included; here the status code was not logged.
   - The search reindex was skipped (empty `SITE_SEARCH_BUILD_TRIGGER_ID`).

2. `supplier-publish`: `{"mode":"surgical","eventType":"publish","apiKey":"supplier","revalidated":0,"urls":[],"noop":true}`. Log: `Model "supplier" is not mapped to any URL; nothing to do.` This confirms gap 2.
3. `?token=wrong`: HTTP `401`.

After the stop: port 4321 free, `schema.ts` unchanged (`astro dev` was used, not `npm run dev`). No token value in the log. Every page fetch went to localhost; the only outbound calls were CDA reads.

#### (c) Production, passive

Run on 2026-11-04 at 23:15 UTC (00:15 CET on 2026-11-05). Read-only: one `webhookCalls list` through the CLI (output filtered to the fields below, never the request URL or headers) and `curl -I` on `https://www.multimage.org`. No POST, no resend, no `?mode=full`.

The CLI printed nothing with `--json` (only the update warning), so the call ran without it and the JSON was parsed from a file under `$TMPDIR`.

Webhook 33942, last 5 successful calls (all `publish`, `status` success, `response_status` 200, `mode` surgical):

| `last_sent_at` (UTC)                              | `total` | URLs                                                                                                                                                                                                            |
| ------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-03 14:30:18                               | 17      | book `/libri/dal-militare-al-sociale-invece-di-armarci-potremmo`, `/libri/ebooks`, `/libri/highlights`, `/libri/archivio`, `/`, `/sitemap.xml`, `/libri`, `/libri/pagina/2` to `/9`, one author, one collection |
| 2026-11-03 14:29:53, 14:28:42, 14:27:59, 14:27:40 | none    | event on a `keyword` record: no URL (unmapped model, noop)                                                                                                                                                      |

Headers for the latest call with URLs (now is 117930 s after 14:30:18):

| Path                                                        | `x-vercel-cache` | `age` (s) | `date` (response generation) |
| ----------------------------------------------------------- | ---------------- | --------- | ---------------------------- |
| `/libri/dal-militare-al-sociale-invece-di-armarci-potremmo` | HIT              | 117300    | 2026-11-03 14:40:48          |
| `/libri/ebooks`                                             | HIT              | 117298    | 2026-11-03 14:40:50          |
| `/libri`                                                    | HIT              | 117304    | 2026-11-03 14:40:44          |
| `/libri/pagina/2`                                           | HIT              | 117281    | 2026-11-03 14:41:07          |
| `/autori/centro-nuovo-modello-di-sviluppo`                  | HIT              | 117294    | 2026-11-03 14:40:55          |
| `/`                                                         | HIT              | 117253    | 2026-11-03 14:41:35          |
| `/distributori` (not in the list)                           | HIT              | 117306    | 2026-11-03 14:40:43          |

- Every URL of the list: HIT, and `age` (about 117300) is smaller than the 117930 s since `last_sent_at`, so each page was regenerated after that publish. The cached copy dates from 14:40 (10 to 11 minutes after the call), not from the 14:30 call; whether that call refreshed it before a later reset cannot be told from headers.
- `/distributori` is not in the list yet has the same age (117306, generated 14:40:43): its regeneration is not caused by this publish. Either a production deploy at about 14:40 reset the ISR cache for all routes (a deploy resets `age`), or something else refreshed it. So this run cannot tell "refreshed by the publish" from "refreshed by a deploy"; for that, run (c) right after a publish with no deploy in between.
- `/staff` without session: HTTP 404, `x-vercel-cache: HIT`, `cache-control: public, max-age=0, must-revalidate`, `age` 52780 (the 404 was cached at 2026-11-04 08:36 UTC). Vercel does cache the middleware 404 for `/staff`. Whether a request with a valid session cookie is served from that cache was not tested (headers only, no cookie).

### docs/guidelines/cms-content-modelling.md
---
description: Fastro uses DatoCMS and uses content modelling and naming conventions for models and fields
---

# CMS Content Modelling

## Naming strategy

DatoCMS is a headless CMS, so the content models should be as much UI agnostic as possible. In general naming content models after their data properties is a good practice, because it separates concerns, promotes reusability within the CMS and by the applications connection to the CMS, and content models don't need to change everytime a UI changes.

In Head Start content is named in this order of preference:

1. Naming based on data type (for example `slug`, `image`, `color`).
2. Naming based on function (for example `title`, `autoplay`).
3. Naming based on appearance (for example `layout`, `style`).

Specific cases:

- In case of a boolean field it should be named after its function, as a boolean means nothing without context. For example a `Video Block` could have `autoplay`, `loop` and `muted` boolean fields.
- In case a model has multiple fields of the same data type, the primary field should be named after its data type (for example `image`) and secondary fields should be named after their function (for example `background_image`).
- In case a field is named after its function, the validations you configure for the field are typically a good indicator towards a fitting name. For example if you set a single line string field to only accept a URL as a pattern, `url` is probably a good name for the field.
- In case a field is only added to control the appearance of a model in the user interface, Head Start proposes to solve this with a generic `layout` and `style` field. See [Modelling Appearance](#modelling-appearance).

## Model name conventions

The [DatoCMS Schema builder](https://www.datocms.com/docs/content-modelling) distinguishes regular models and reusable blocks that can be used in modular content and structured text fields.

Head Start uses these standardised model names:

- **`... Page`**  
  - Type: regular model.  
  - Notes: all pages end with `Page` (`Home Page`, `Product Page`, generic `Page`) and power the routes in `src/pages/`.
- **`... Block`**  
  - Type: reusable [block](https://www.datocms.com/docs/content-modelling/blocks).  
  - Notes: every reusable block name ends with `Block` (`Text Block`, `Image Block`, etc.) and is consumed by templates and fragments in `src/blocks/`. See [Blocks and Components](./blocks-and-components.md).

Since a project has multiple pages and multiple blocks, the name should describe the models function. For example a `Newsletter Signup Block`.

## Field name conventions

While there can always be exceptions, Head Start aims to cover the majority of field names with a list of standardised field names:

- **`title`**  
  - Type: single line string field.  
  - Notes: do **not** use `heading` or `name` (except for people records).
- **`subtitle`**  
  - Type: single line string field.  
  - Notes: avoid `tagline` or `excerpt`.
- **`slug`**  
  - Type: [slug field](https://www.datocms.com/docs/content-modelling/slug-permalinks).  
  - Notes: not `permalink`, `path`, or `url`; use `title` as the reference field.
- **`blocks`**  
  - Type: [modular content field](https://www.datocms.com/docs/content-modelling/modular-content).  
  - Notes: plural naming signals the list, not `body` or `content`.
- **`items`**  
  - Type: [modular content field](https://www.datocms.com/docs/content-modelling/modular-content).  
  - Notes: use when the field repeats the same item structure (e.g., “Unique Selling Point Block” entries composed of `title` + `image`).
- **`text`**  
  - Type: [structured text field](https://www.datocms.com/docs/content-modelling/structured-text).  
  - Notes: avoid `body`, `content`, `description`; structured text is preferred over multi-paragraph text areas.
- **`image` / `images`**  
  - Type: [single asset or asset gallery field](https://www.datocms.com/docs/general-concepts/media-area).  
  - Notes: not `picture`, `photo`, or `avatar`. Use plural when the UI renders grids/galleries; restrict validation to image extensions only.
- **`video`**  
  - Type: [asset field](https://www.datocms.com/docs/general-concepts/videos) or [external video field](https://www.datocms.com/docs/content-modelling/external-video-field).  
  - Notes: choose the field type based on whether the video is uploaded to Dato or hosted externally.
- **`page` / `pages`**  
  - Type: [link field](https://www.datocms.com/docs/content-modelling/links).  
  - Notes: reference the `InternalLink` model so all `... Page` routes resolve consistently across the codebase.

## Modelling Appearance

In cases where the appearance of a content model needs to be controlled from the CMS, Head Start aims to handle this using two standardised fields:

- **`layout`**  
  - Type: single line string field.  
  - Notes: defines position, size, direction. Configure [accept only specified values](https://www.datocms.com/docs/content-modelling/validations#single-line-text) (e.g., `full-width`, `centered`, `fixed-header`).
- **`style`**  
  - Type: single line string field or [link field](https://www.datocms.com/docs/content-modelling/links).  
  - Notes: governs visual treatments. Use predefined values or create a Style model referenced via link fields when styles are shared (`highlight`, `branded`, `primary`, etc.).

A few example situations:

- A design has a block with two text columns. Avoid creating fields like `text_column_left` and `text_column_right`. Instead create an `items` field (see [Field name conventions](#field-name-conventions)) where each item has a `text` field, and use validations to set a minimum and maximum number of items. Then add a `layout` field to the block with values like `one-column`, `two-columns`, `multi-column`.
- A design has two variations of a block. One with an image on the left and text on the right. The second with the content the other way around. Avoid making multiple blocks or adding an `is_inversed` or `is_image_left` field. Instead create a `layout` field and only allow specific values describing the options, like `image-text` and `text-image`. You can use the presentation of the field to display the options as radio buttons or a dropdown if desired (this doesn't impact the data model). This setup is open to future extension. And if the website later adds right-to-left support the content model doesn't need to change.
- A design has different blocks all showing multiple images. Here conbining an `images` field with a `layout` field with options like `grid` and `gallery` would allow you to model a single content block for both design options. Note: f this feels confusing to editors or if the blocks differ in more ways you may still want to create multiple content blocks in the CMS.
- A design has two variations of a blocks background. Avoid fields like `is_gray` as this makes it difficult to add variations later on, or change an existing variation. Instead use a `style` field with values like `default`, `dimmed` or `highlighted`.
- A design consistently uses multiple style variations across the website. In this case, create a new Style model and create records for each variation. Add `style` link fields to blocks and models referencing the Style model. You can restrict modifying the Style records to admins under [Content Permissions in the CMS](https://www.datocms.com/docs/content-delivery-api/docs/general-concepts/roles-and-permission-system#content-level-permissions).

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

### docs/guidelines/preview-mode.md
---
description: How to manage draft preview, Visual Editing, and on-demand cache invalidation for editors
---

# Preview, Draft Mode & Visual Editing

Multimage runs as a **single Astro project** with `output: 'server'`, on two
targets: **Vercel** with ISR (Incremental Static Regeneration) today, and
**Cloudflare Workers** with Workers Cache on branch `chore/cloudflare` (switch
procedure: `docs/guidelines/cloudflare-switch.md`). On both, anonymous visitors
get cached responses (effectively static); editors with the draft cookie bypass
the cache and see live draft content with click-to-edit overlays. Sections
marked **Vercel** or **Cloudflare** apply to one target only.

Le architetture precedenti (due progetti Vercel separati con `SERVER=static` e
`SERVER=preview`) sono state ritirate il 2026-05-17 con la shape
`2026-05-16-unify-projects-isr.md`.

## 1. Architecture overview

### Vercel (production today)

```
Anonymous visitor → Vercel CDN → cached response (no function invocation)

Editor (draft cookies) → Vercel CDN sees __prerender_bypass cookie
                       → bypass cache → function runs SSR
                       → executeQuery uses draft token + contentLink:'v1'
                       → page rendered with stega-encoded text
                       → ContentLink client enables click-to-edit overlay

DatoCMS publish → webhook → /api/revalidate
                          → parses payload (api_key + slug)
                          → maps to the affected URLs only (surgical)
                          → fetches each with x-prerender-revalidate header
                          → CDN regenerates + recaches
                          → buildTriggers.reindex → Site Search re-spidered
                            (no rebuild, no cache impact)
```

### Cloudflare (branch `chore/cloudflare`)

```
Anonymous visitor → gateway (src/worker.ts, cache off)
                  → Backend (cache on): Workers Cache HIT → cached page
                                        MISS → Astro render, tagged, stored

Editor (draft cookie) → gateway sees the cookie (name rule below)
                      → forwards with cache: 'no-store'
                      → middleware also calls cache.set(false)
                      → Cache-Control: private, no-store (never stored)
                      → executeQuery uses draft token + contentLink:'v1'

DatoCMS publish → cda_cache_tags webhook (event `invalidate`, Bearer
                  CACHE_INVALIDATION_WEBHOOK_SECRET)
                → POST /api/invalidate-cache
                → purge by tag in Backend (cache.purge)
                → Site Search reindex (DATOCMS_CMA_TOKEN +
                  SITE_SEARCH_BUILD_TRIGGER_ID)
```

Draft HTML carries the draft CDA token (`DraftModeQueryListener`), so a stored
draft render would leak it: the bypass is double, gateway `no-store` plus the
middleware's `cache.set(false)`. The gateway reads the cookie name with the same
rule as `src/lib/draftMode.ts` (`env.DRAFT_MODE_COOKIE_NAME?.trim() ||
'multimage_draft_mode'`, `src/worker.ts`). Details and the route policy:
`docs/guidelines/caching.md`.

### Cookies that drive draft mode (dual-cookie pattern on Vercel)

When `/api/draft-mode/enable` runs, the app sets the app-level cookie, plus on
Vercel a second one:

| Cookie | Role | Value |
| --- | --- | --- |
| `multimage_draft_mode` (configurable via `DRAFT_MODE_COOKIE_NAME`) | App-level auth. The site reads this to know the editor is authenticated and to switch to the draft CDA token. | Signed JWT (`SIGNED_COOKIE_JWT_SECRET`) with payload `{ enabled: true }`. |
| `__prerender_bypass` (**Vercel only**) | CDN-level cache bypass. Vercel recognizes this cookie name natively and forces the request to bypass the ISR cache. Only set when `BYPASS_TOKEN` exists, so never on the Worker. | Plain opaque token equal to `BYPASS_TOKEN`. |

On Vercel both cookies are required; on Cloudflare the app-level cookie alone
drives the bypass. The disable endpoint deletes both. Both are `SameSite=None;
Secure; Partitioned`, 30 days.

## 2. Required environment variables

Set the variables of this table that the code needs on the deploy target (not `BYPASS_TOKEN` or `CACHE_INVALIDATION_WEBHOOK_SECRET` locally) and in `.env`:
Vercel for every environment (Production / Preview), or Worker secrets on
Cloudflare (`wrangler secret put`, see `docs/guidelines/security.md`).

| Variable | Required | Notes |
| --- | --- | --- |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | yes | Published-only CDA token. |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | yes | Draft-only CDA token (must include "Access in Preview Mode"). |
| `DATOCMS_CMA_TOKEN` | optional | CMA token for `/api/seo-analysis` and the Site Search reindex. |
| `SECRET_API_TOKEN` | yes | Shared secret for `/api/preview`, `/api/draft-mode/enable`, `/api/preview-links`, `/api/revalidate`. |
| `SIGNED_COOKIE_JWT_SECRET` | yes | Random string used to sign the draft JWT cookie (`openssl rand -hex 32`). |
| `DRAFT_MODE_COOKIE_NAME` | optional | Defaults to `multimage_draft_mode`. |
| `BYPASS_TOKEN` | yes on Vercel, **Vercel only** (not set on the Worker) | Opaque token used both as the `__prerender_bypass` cookie value (Draft Mode) and as the `x-prerender-revalidate` header (on-demand ISR via `/api/revalidate`). Generate with `openssl rand -hex 32`. |
| `DATOCMS_BASE_EDITING_URL` | yes for Visual Editing | **Bare admin URL with no `/environments/...` suffix**: `https://multimage.admin.datocms.com`. Used by Content Link to construct edit-URLs. ⚠️ Appending `/environments/main` (even though `main` *is* the primary) makes the stega edit-URLs take the *sandbox* form, and the plugin then reports "Environment Mismatch Detected" — the sandbox URL shape doesn't match a primary-environment editing session. Only append `/environments/<name>` when targeting a genuine non-primary sandbox. |
| `CACHE_INVALIDATION_WEBHOOK_SECRET` | Cloudflare only | Bearer secret of the `cda_cache_tags` webhook calling `/api/invalidate-cache`. Lives on the Worker, in the DatoCMS webhook header and in the build env file outside the repo (runbook step 0), nowhere else. |
| `SITE_SEARCH_BUILD_TRIGGER_ID` | optional | Site Search build trigger (`37696`) reindexed after a publish; needs `DATOCMS_CMA_TOKEN` as well, otherwise a no-op. Set on switch day on Cloudflare. |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | yes | Site Search token (ships to the browser — must be read-only Site Search scope). |
| `PUBLIC_SITE_URL` | yes | Site origin without trailing slash. |

The `SERVER` env var has been **removed**. Do not set it anywhere.

## 3. Draft mode flow

Editors enter preview through one of:

- The **DatoCMS Web Previews** plugin sidebar in DatoCMS — clicks "Draft version".
  The plugin hits `/api/preview-links?token=...` (no manual setup beyond
  installing the plugin via `/api/post-deploy`). Each preview link goes through
  `/api/draft-mode/enable?url=<recordUrl>&token=...` so both cookies are
  set, then redirects to the record page.
- A direct call to `/api/preview?secret=<SECRET_API_TOKEN>&redirect=/percorso`
  (useful for manual smoke tests).

Exiting preview is automatic when the plugin emits a "Published version" link
(it calls `/api/draft-mode/disable`). Manual exit:
`/api/draft-mode/disable?url=/percorso`. The `enable` and `disable` endpoints
read `url=` only; `/api/preview` accepts `redirect=`, `url=` or `path=`.

## 4. Draft data flow

- `src/lib/datocms/executeQuery.ts` reads `includeDrafts` from the call site and
  automatically swaps the CDA token. In draft mode it also opts into Content
  Link (`contentLink: 'v1'` + `baseEditingUrl: DATOCMS_BASE_EDITING_URL`) so the
  CDA returns stega-encoded text the overlay can attach to.
- Pages call `resolveDraftMode(Astro)` (from `~/lib/draftPreview`) to know
  whether the current request is in draft mode and forward the flag to
  `executeQuery({ includeDrafts })`.
- `DraftModeQueryListener` (in `src/components/DraftModeQueryListener/`)
  subscribes to live updates: when DatoCMS emits an update for the same query,
  the listener reloads the data with stega encoding preserved. The component
  short-circuits (renders nothing) outside draft mode.

## 5. Visual Editing (Content Link)

Outside draft mode, Content Link is fully inert: the CDA response contains no
stega encoding, so the overlay never activates.

Inside draft mode:

- `src/components/ContentLink.astro` is mounted by `BaseLayout` and initializes
  `createController().enableClickToEdit()` on the client.
- Click on any block or text rendered from a structured-text field → DatoCMS
  opens the corresponding field (in a new tab when the site is loaded outside
  the plugin, in a side panel when loaded inside the **Visual** tab of the Web
  Previews plugin).
- 8 custom Structured Text block components carry the
  `data-datocms-content-link-boundary` attribute on their root element so the
  overlay can target each block as a unit.

The plugin's "Visual" tab loads the site inside an iframe. To make that work,
`src/middleware.ts` adds a `Content-Security-Policy: frame-ancestors ...` header
to draft-mode responses only.

⚠️ The Visual tab **nests** iframes — `admin.multimage.org` (the admin app)
frames `plugins-cdn.datocms.com` (the plugin), which frames the site. CSP
`frame-ancestors` validates the *whole* ancestor chain, so listing only
`plugins-cdn.datocms.com` is not enough: the browser shows "refused to connect".
The header therefore allows `'self' https://*.datocms.com
https://admin.multimage.org`. The custom admin domain (`admin.multimage.org`)
must be listed explicitly — the `*.datocms.com` wildcard does **not** match it.

## 6. On-demand cache invalidation (webhook)

On **Cloudflare** invalidation is by cache tag: the `cda_cache_tags` webhook
calls `/api/invalidate-cache`, which purges the tagged entries and reindexes Site
Search (diagram in § 1, procedure in `docs/guidelines/caching.md`). The rest of
this section describes the **Vercel** URL-based webhook (`/api/revalidate`),
which is disabled at the switch.

DatoCMS publish → webhook → `POST /api/revalidate?token=<SECRET_API_TOKEN>`.

The endpoint does **surgical** revalidation (since 2026-06-20 — see
`docs/decisions-log/2026-06-20-fot-reduction.md`):

1. Validates the secret.
2. Parses the webhook payload (`src/lib/datocms/webhookPayload.ts`): the
   `event_type`, the record `slug` (`entity.attributes.slug`), and the model
   `api_key` (from `related_entities`, referenced by
   `entity.relationships.item_type`).
3. Maps `api_key + slug` to the small set of affected URLs via
   `getRevalidationUrls()` (`src/lib/datocms/revalidationUrls.ts`): the record's
   own detail URL + a bounded set of listings. A **book** change also revalidates
   the catalogue pages (`/libri` + `/libri/pagina/2..N`), the book sub-indexes,
   `/`, `/sitemap.xml`, and the detail pages of its authors and collection
   (resolved with one CDA query). Typically ~12–20 URLs for a book, fewer for
   other models. Unknown / unmapped models → **no-op** (logs and returns 200).
4. Fetches each URL with `x-prerender-revalidate: <BYPASS_TOKEN>` in chunks of
   20 in parallel, with a 250 ms pause between chunks (stays under the DatoCMS
   40 req/sec rate limit).
5. Triggers a **Site Search re-index** (`buildTriggers.reindex`) — re-spiders
   the search index with no rebuild and no ISR cache impact. Best-effort: a
   failure is logged but does not fail the revalidation. No-op unless both
   `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID` (currently `37696`)
   are set.
6. Logs mode/total/success/failures, elapsed time, the revalidated `urls`, and
   the reindex result to `vercel logs`. The JSON response echoes the `urls`.

`POST /api/revalidate?mode=full` still runs the whole-surface sweep via
`getAllPublicUrls()` (manual maintenance / emergency). The old in-memory 5 s
debounce was removed: surgical calls are cheap and idempotent, and a debounce
would wrongly drop a second distinct record published within the window.

### Cache TTL (safety net)

`astro.config.mjs` sets `isr.expiration` to **60 days**. This is only a safety
net: content changes propagate on-demand through the webhook above, so the TTL
just covers the rare case of a missed/failed webhook. A short TTL was pure waste
— it re-rendered the whole surface roughly weekly for unchanged content, burning
Fast Origin Transfer. A manual Vercel build or `?mode=full` forces a full refresh
anytime.

### The DatoCMS webhook (configured)

A webhook named **"Revalidate site cache (ISR)"** (id `33942`) is configured on
the project:

- **URL**: `https://www.multimage.org/api/revalidate?token=<SECRET_API_TOKEN>`
- **Events**: `item` → `publish`, `unpublish`, `delete`. `update` is **not**
  triggered on purpose — saving a draft does not change what the public sees, so
  there is nothing to invalidate until the record is actually published.
- **auto_retry**: on (DatoCMS retries on transient failures).

Revalidation is surgical (since 2026-06-20): the endpoint maps the published
record to its own URL plus a bounded set of listings, instead of sweeping the
whole site (`?mode=full` is a manual fallback only). On Vercel revalidation is
URL-based; cache tags exist only on the Cloudflare target. See `docs/guidelines/caching.md` for the
route-to-model audit and the verification procedure.

To recreate it via CLI: `npx datocms cma:call webhooks create --data='{...}'`
with the events above (see the shape doc for the full payload).

## 7. Local development

`npm run dev` runs `astro dev`. ISR caching (Vercel) and Workers Cache
(Cloudflare) are not active locally — every request is SSR'd. Draft mode works via the JWT cookie (visit
`/api/preview?secret=...&redirect=/`). Content Link works locally if
`DATOCMS_BASE_EDITING_URL` is set in `.env`.

`/api/revalidate` works locally but the `fetch` calls hit `PUBLIC_SITE_URL`
(production). Never call it locally without overriding the environment; follow
procedure (b) in `docs/guidelines/caching.md`.

## 8. Troubleshooting

- **Editor sees published content despite cookies (Vercel)** → check both
  cookies are set in DevTools → Application → Cookies (the JWT cookie *and*
  `__prerender_bypass`). If only the JWT is set, `BYPASS_TOKEN` is probably
  missing from Vercel env, so `enableDraftMode` skipped setting the bypass
  cookie. The CDN serves the cached published response.
- **Editor sees published content despite the cookie (Cloudflare)** → the
  gateway looks for the cookie by name (`DRAFT_MODE_COOKIE_NAME`, default
  `multimage_draft_mode`, rule in `src/worker.ts`). If the Worker secret
  `DRAFT_MODE_COOKIE_NAME` differs from the name the cookie was set with, the
  gateway does not see it and serves the shared copy. The name on the Worker must
  match the one the app sets.
- **`/api/seo-analysis` on Cloudflare** → checked on the trial Worker
  (2026-11-21): 401 with a wrong token; with the signed token it answers 500
  `DATOCMS_CMA_TOKEN is not configured on this environment.` (the route and
  `linkedom` load on the Worker; no CMA token is set there by rule). The full
  render, which fetches its own host, is not tested: on `workers.dev` a Worker
  fetching itself is expected to fail. It is checked on www after the custom
  domains (step 9 of `docs/guidelines/cloudflare-switch.md`), with the Backend
  patch (fetch through `locals.cfContext.exports.Backend`, `cache: 'no-store'`)
  as the fix if it fails.
- **`/api/revalidate` returns 500 (Vercel) "BYPASS_TOKEN not configured"** → set
  `BYPASS_TOKEN` on Vercel (and re-deploy so the adapter picks it up).
- **Webhook fires but pages don't update (Vercel)** → check `vercel logs` for the
  `[revalidate]` lines. Most common cause is the `x-prerender-revalidate`
  header value not matching `bypassToken` configured in `astro.config.mjs`.
  Both must come from the same `BYPASS_TOKEN` env var.
- **Visual Editing overlay missing** → confirm `DATOCMS_BASE_EDITING_URL` is
  set. Without it `executeQuery` (and `DraftModeQueryListener`) skip Content
  Link entirely (`contentLink`/`baseEditingUrl` left `undefined`): drafts still
  render, just without the click-to-edit overlay. This is intentional — sending
  `contentLink: 'v1'` without a base URL makes the CDA 422
  (`INVALID_X_BASE_EDITING_URL_HEADER`), which used to break every draft page in
  local dev.
- **Iframe in DatoCMS "Visual" tab won't load / "refused to connect"** → check
  response headers for `Content-Security-Policy: frame-ancestors ...`. Two
  causes: (a) the header is absent — `isDraftModeEnabled` is resolving to
  `false` (missing/invalid JWT cookie); (b) the header is present but does not
  list the custom admin domain — `frame-ancestors` must include
  `https://admin.multimage.org`, not just `https://plugins-cdn.datocms.com`,
  because the ancestor chain includes the admin app (see §5).
- **Plugin shows "Environment Mismatch Detected" (records belong to sandbox
  `main`)** → `DATOCMS_BASE_EDITING_URL` has a `/environments/...` suffix. Remove
  it: the value must be the bare `https://multimage.admin.datocms.com` when
  editing the primary environment (see §2).
- **DatoCMS rate limit errors during webhook** → unlikely with current
  chunking (20 parallel × 250 ms pause ≈ 80 req/sec inbound, but each URL
  triggers 1–3 GraphQL calls so the burst can briefly exceed 40 req/sec).
  Increase `CHUNK_PAUSE_MS` in `src/pages/api/revalidate/index.ts` if you see
  429 errors.
- **Need to revoke editor access** → rotate `SECRET_API_TOKEN`,
  `SIGNED_COOKIE_JWT_SECRET`, and `BYPASS_TOKEN` (Vercel only). Editors with old cookies
  immediately stop receiving drafts; the cookies are still set in their
  browser but no longer recognized.

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

### docs/guidelines/routing.md
---
description: The setup is enhanced with i18n routing, API routing, nested page routing and helpers to resolve routes.
---

# Routing

## I18n routes

Fastro supports multi-language websites with localised routing (`/:locale/page/to/page/`). See [i18n configuration and routing](./i18n.md).

The main locale (usually `ìt`) runs at domain level, while optional others run `/domain/:locale/...`

## Nested routes

Fastro supports nested pages, so editors can create page URLs like `/en/overview-page/category-page/detail-page/`. This is achieved using a `parentPage` field\* in Page models in the CMS, combined with a catch all route `src/pages/[locale]/[...path]/` using [Astro rest parameters](https://docs.astro.build/en/core-concepts/routing/#rest-parameters). This setup can be copied for new page models added to your project.

To make nested routes more useful for website visitors and easier to manage for developers, Fastro provides a [Breadcrumbs component](../src/components/Breadcrumbs/) and [`getHref()` helpers for all linkable models](../src/lib/routing/index.ts).

## Internal links to records

Content editors can link to other models (like Home or generic Page) within Structured Text fields. To create nodes for these links, Fastro provides a reusable [Item Link](../src/blocks/TextBlock/nodes/ItemLink.astro).

When you want to make a new content model available for linking:

1. Add the model to the references option of all relevant Structured Text fields in the CMS.
2. Add the links to the GraphQL fragments of the related blocks (like [`TextBlock.fragment.graphql`](../src/blocks/TextBlock/TextBlock.fragment.graphql)).
3. Extend the generic [`getHref()` helper](../src/lib/routing/index.ts) to resolve the URL for the new model.

## 404 routes

Fastro leverages [Astro's Custom 404 Error page](https://docs.astro.build/en/basics/astro-pages/#custom-404-error-page) (located in [`src/pages/404.astro`](../src/pages/404.astro)), connected to the Not Found model in DatoCMS.

## API routes

Astro supports [API routes](https://docs.astro.build/en/core-concepts/endpoints/#server-endpoints-api-routes) (server endpoints), which can be any route in `src/pages/`. Fastro uses a convention to place all API routes in `src/pages/api/`. This way it's clear where all API routes live, they have a logical URL prefix in the browser (`/api/`) and [API routes not found](../src/pages/api/[...notFound].ts) can be caught and respond with a 404 JSON response, rather than an HTML response.

## Partial page routes

Astro supports [Page Partials](https://docs.astro.build/en/basics/astro-pages/#page-partials) to fetch and use in conjuction with client-side scripts. As a convention Fastro uses a `.partial.astro` for these routes. An example is the [`search/results.partial.astro` route](../src/pages/[locale]/search/results.partial.astro).

## Redirects

Fastro supports redirect rules which are editable and [sortable](https://www.datocms.com/docs/content-modelling/record-ordering) in the CMS. Fastro uses [`regexparam`](https://github.com/lukeed/regexparam) to handle redirect rules with static paths, (optional) parameters and (optional) wildcards. Examples:

- from `/redirect/static-path/` to `/new-static-path/`
- from `/path-with-param/:name/` to `/new-path-with-param/:name/more-slug`
- from `/path-with-wildcard/*` to `/new-path-with-wildcard/*` (or `/new-path-with-wildcard/:splat`)

### docs/guidelines/seo.md
---
description: provide SEO guidance for the single-locale Multimage site
---

# Search Engine Optimisation (SEO)

## Meta, OG & Twitter tags
Multimage is mono-locale (Italian-only) and fully powered by DatoCMS SEO fields. Configure the global defaults under **SEO Preferences** (`/editor/settings`) and extend every routable model with its own SEO field so editors can override title/description/canonical tags per page.

To render those tags, query `_seoMetaTags`, wrap them with `withFallbackSeo`, and pass the result to `BaseLayout`, which hydrates `@datocms/astro`'s `<Seo />` component. `withFallbackSeo` adds Italian defaults for `<title>`/`<meta name="description">` when editors forget to populate them.

```graphql
query Page($slug: String!) {
  page(filter: { slug: { eq: $slug } }) {
    _seoMetaTags {
      attributes
      content
      tag
    }
  }
}
```

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import { withFallbackSeo } from '~/lib/seo';
const { page } = await executeQuery(PAGE_QUERY, { slug });
const seo = withFallbackSeo(page?._seoMetaTags, {
  title: page?.title ? `${page.title} | Multimage` : 'Multimage Editrice',
  description: page?.subtitle ?? undefined,
});
---
<BaseLayout seo={seo}>
  <!-- page content -->
</BaseLayout>
```

Dato automatically emits OG/Twitter tags (image, description, locale) whenever `_seoMetaTags` is rendered, so no extra layout logic is required. Avoid overriding those tags manually unless a route needs additional `meta` entries (e.g., `robots`, `article:published_time`).

## Canonicals, robots & sitemap
- Because the site is permanently Italian-only, there is a single canonical URL per page and no alternate/hreflang variants. `BaseLayout` now adds a `<link rel="canonical">` built from `PUBLIC_SITE_URL` + the current slug/path whenever `_seoMetaTags` does not already include one, so keep that env var aligned with the public origin.
- `src/pages/sitemap.xml.ts` builds the sitemap manually: it reads `PUBLIC_SITE_URL`, fetches all published pages/books/collections/authors/blog posts via `SITEMAP_QUERY`, and emits `/sitemap.xml` with one `<url>` per slug. Update `src/pages/sitemap.xml/_graphql.ts` whenever you introduce a new routable model.
- Set `PUBLIC_SITE_URL` for every environment so URLs never fall back to `http://localhost:4321` (see docs/TODO.md task **SEO1**). `astro.config.mjs` already sets `site`, but Vercel preview deploys still rely on the env var.
- `public/robots.txt` only blocks `/staff/` today. Keep it in sync with any other sensitive routes and leave the `Sitemap: /sitemap.xml` line in place so crawlers discover the XML automatically.

## Structured data & rich results
No JSON-LD is emitted today. Book, article, and organization pages rely solely on the default meta tags, so search engines cannot generate rich cards for catalog items or magazine posts. Track the addition of Book/Article/Organization schemas under docs/TODO.md SEO task **SEO2** and render them via `<script type="application/ld+json">` inside `BaseLayout` or the relevant page once requirements are finalized.

## Preview plugins & automation
- `/api/post-deploy` installs/configures the Dato “Web Previews” and “SEO/Readability Analysis” plugins. It should be disabled after the initial run because it reuses `SECRET_API_TOKEN` when minting preview URLs.
- `/api/preview-links` maps Dato records to site URLs and generates draft/published links that hop through `/api/draft-mode/*` so editors can switch contexts safely.
- `/api/seo-analysis` validates the same secret, fetches the target record through `@datocms/cma-client`, then uses `draftModeHeaders()` + `jsdom` to parse the Italian HTML before returning it to the plugin. Keep this endpoint fast—Dato times out after a few seconds.

## Core Web Vitals & analytics levers
- `BaseLayout` injects Iconify, Google Analytics (legacy UA) and Iubenda. Audit these scripts when defining a CSP (docs/TODO.md Security task **S3**).
- `BookCarouselSection` and `/cerca` load their JS bundles from `public/generated`. Missed prebuilds surface as `<script>` 404s, so ensure CI runs `npm run prebuild` (docs/TODO.md Project Structure task **PS1**).
- No Core Web Vitals dashboard is wired since Vercel Analytics and Speed Insights were removed (2026-11-22); coordinate any future perf work with `docs/guidelines/performance.md`.

## Known gaps
- `PUBLIC_SITE_URL` is not enforced during builds, so sitemap/canonical URLs silently fall back to `http://localhost:4321`. Fix this in docs/TODO.md SEO task **SEO1**.
- No structured data is emitted for books, authors, or magazine posts. Add JSON-LD per docs/TODO.md SEO task **SEO2** once schemas are approved.
- `/api/post-deploy` is still deployed despite being a one-off bootstrap endpoint. Track its retirement under docs/TODO.md Security task **S5** so the preview secret stays private.
