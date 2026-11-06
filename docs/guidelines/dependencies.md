---
description: Summarise runtime, CMS, and tooling dependencies used by Multimage.
---

# Dependencies

## Runtime & UI

- Node 24.x (`.nvmrc` for local, `engines.node` in `package.json` for Vercel) and TypeScript 6 (`typescript@^6`; TypeScript 7 is deferred, see `docs/decisions-log/2026-11-04-defer-typescript-7.md`).
- `astro@^7` (Rust compiler, Vite 8, `compressHTML: true` pinned) with `output: 'server'` and `@astrojs/vercel@^11` ISR (no prerendered routes), deployed to Vercel as a single project.
- Styling uses `tailwindcss` (3.x) and `autoprefixer` wired as PostCSS plugins (`postcss.config.mjs`/`.cjs`); there is no `@astrojs/tailwind` integration. Brand tokens defined in `tailwind.config.mjs`.
- `swiper` 14 (exact pin) provides the carousel web component; `BookCarouselSection` imports `swiper/element/bundle` so no asset-copy step is required. Swiper 14 raises the browser baseline to Chrome/Edge 110+, Safari 16.4+, Firefox 110+.

## CMS & Data

- `@datocms/astro`, `@datocms/cda-client`, and the `datocms` CLI package (not `@datocms/cli`) handle rendering helpers, GraphQL fetching, and schema generation. `@datocms/cma-client` is a runtime dependency: `/api/revalidate` (Site Search reindex), `/api/post-deploy` and `/api/seo-analysis` call `buildClient`.
- `@datocms/cma-client` 6 and the `datocms` CLI 4.2 family share one `@datocms/rest-client-utils` 6 copy (no `overrides` in `package.json`); both clients redact tokens in their `ApiError` (`@datocms/cda-client` ≥ 0.3.1, `@datocms/rest-client-utils` ≥ 6.1.1).
- `jsdom` 30 (with `@types/jsdom` 30) is used only by `/api/seo-analysis` and needs Node `^22.22.2 || ^24.15.0 || >=26`; `engines.node` is `24.x`, so ≥ 24.15 is the floor to keep in mind on Vercel.
- `tsx` is not a direct dependency: `npm run check:revalidation-map` uses the copy hoisted from the `datocms` CLI (also pulled by `vite`).
- DatoCMS data primarily flows through `@datocms/cda-client`; `dotenv-cli` is only needed for scripts like `npm run sync-datocms`.

## Monitoring & Analytics

- `@vercel/analytics` and `@vercel/speed-insights` augment inline Google Analytics and Iubenda snippets inside `BaseLayout`.

## Tooling

- Formatting is enforced via `prettier` + `prettier-plugin-astro` 1.x (Astro Rust compiler). `.prettierrc` sets `astroCompressHTML: "html"`, mirroring `compressHTML: true` in `astro.config.mjs`; change both together. No ESLint is configured, so lint coverage stops at formatting.

## Risk Notes

- `swiper` is pinned at exactly 14.4.0 in `package.json`; keep it pinned to avoid sudden bundle regressions introduced by caret releases.
- Track `datocms` CLI updates, especially when schema generation APIs change.
