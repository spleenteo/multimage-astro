---
description: Summarise runtime, CMS, and tooling dependencies used by Multimage.
---

# Dependencies

## Runtime & UI

- `astro@^6` with `output: 'server'` and `@astrojs/vercel` ISR (no prerendered routes), deployed to Vercel as a single project.
- Styling uses `tailwindcss` (3.x) and `autoprefixer` wired as PostCSS plugins (`postcss.config.mjs`/`.cjs`); there is no `@astrojs/tailwind` integration. Brand tokens defined in `tailwind.config.mjs`.
- `swiper` provides the carousel web component; `BookCarouselSection` imports `swiper/element/bundle` so no asset-copy step is required.

## CMS & Data

- `@datocms/astro`, `@datocms/cda-client`, and the `datocms` CLI package (not `@datocms/cli`) handle rendering helpers, GraphQL fetching, and schema generation. `@datocms/cma-client` is a runtime dependency: `/api/revalidate` (Site Search reindex) and `/api/post-deploy` call `buildClient`.
- `tsx` is not a direct dependency: `npm run check:revalidation-map` uses the copy hoisted from the `datocms` CLI (also pulled by `vite`).
- DatoCMS data primarily flows through `@datocms/cda-client`; `dotenv-cli` is only needed for scripts like `npm run sync-datocms`.

## Monitoring & Analytics

- `@vercel/analytics` and `@vercel/speed-insights` augment inline Google Analytics and Iubenda snippets inside `BaseLayout`.

## Tooling

- Formatting is enforced via `prettier` + `prettier-plugin-astro`. No ESLint is configured, so lint coverage stops at formatting.

## Risk Notes

- Keep `swiper` pinned to a specific version to avoid sudden bundle regressions introduced by caret releases.
- Track `datocms` CLI updates, especially when schema generation APIs change, and upgrade promptly to retain compatibility.
