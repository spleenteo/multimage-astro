---
description: Summarise runtime, CMS, and tooling dependencies used by Multimage.
---

# Dependencies

## Runtime & UI

- Node 24.x (`.nvmrc` for local, `engines.node` in `package.json` for Vercel) and TypeScript 6 (`typescript@^6`; TypeScript 7 is deferred, see `docs/decisions-log/2026-11-04-defer-typescript-7.md`).
- `astro@^7` (Rust compiler, Vite 8, `compressHTML: true` pinned) with `output: 'server'` and `@astrojs/vercel@^11` ISR (no prerendered routes), deployed to Vercel as a single project.
- Styling uses `tailwindcss` (3.x) and `autoprefixer` wired as PostCSS plugins (`postcss.config.mjs`/`.cjs`); there is no `@astrojs/tailwind` integration. Brand tokens defined in `tailwind.config.mjs`.
- `swiper` provides the carousel web component; `BookCarouselSection` imports `swiper/element/bundle` so no asset-copy step is required.

## CMS & Data

- `@datocms/astro`, `@datocms/cda-client`, and the `datocms` CLI package (not `@datocms/cli`, held on `~4.0.x`) handle rendering helpers, GraphQL fetching, and schema generation. `@datocms/cma-client` is a runtime dependency: `/api/revalidate` (Site Search reindex) and `/api/post-deploy` call `buildClient`.
- The `datocms` CLI is held on `~4.0.x` and `package.json` carries `overrides: { "@datocms/cli-utils": "<4.2.0" }`: cli-utils 4.2 requires `@datocms/cma-client-node` 6, which moves with the CMA v6 family in V5 (remove the override then, TODO UP-cli-utils-override).
- `tsx` is not a direct dependency: `npm run check:revalidation-map` uses the copy hoisted from the `datocms` CLI (also pulled by `vite`).
- DatoCMS data primarily flows through `@datocms/cda-client`; `dotenv-cli` is only needed for scripts like `npm run sync-datocms`.

## Monitoring & Analytics

- `@vercel/analytics` and `@vercel/speed-insights` augment inline Google Analytics and Iubenda snippets inside `BaseLayout`.

## Tooling

- Formatting is enforced via `prettier` + `prettier-plugin-astro`. No ESLint is configured, so lint coverage stops at formatting.

## Risk Notes

- `swiper` is pinned at exactly 12.1.4 in `package.json`; keep it pinned to avoid sudden bundle regressions introduced by caret releases.
- Track `datocms` CLI updates, especially when schema generation APIs change, and note that the CLI is held on ~4.0.x until V5.
