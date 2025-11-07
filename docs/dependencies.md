---
agent_edit: true
scope: Summarise runtime, CMS, and tooling dependencies used by Multimage.
---

# Dependencies

## Runtime & UI

- `astro@^5.15.1` outputs a fully static site deployed to Vercel.
- Styling stacks on `@astrojs/tailwind`, `tailwindcss`, and `autoprefixer`, with brand tokens defined in `tailwind.config.mjs`.
- `swiper` provides the carousel web component; `BookCarouselSection` imports `swiper/element/bundle` so no asset-copy step is required.

## CMS & Data

- `@datocms/astro`, `@datocms/cda-client`, and `@datocms/cli` handle rendering helpers, GraphQL fetching, and schema generation. `@datocms/cma-client` is only referenced for types and can be dropped if unused.
- DatoCMS data primarily flows through `@datocms/cda-client`; the LLM export now runs inside `src/pages/llms-full.txt.ts`, so `dotenv-cli` is only needed for scripts like `npm run sync-datocms`.

## Monitoring & Analytics

- `@vercel/analytics` and `@vercel/speed-insights` augment inline Google Analytics and Iubenda snippets inside `BaseLayout`.

## Tooling

- Formatting is enforced via `prettier` + `prettier-plugin-astro`. No ESLint is configured, so lint coverage stops at formatting.

## Risk Notes

- Keep `swiper` pinned to a specific version to avoid sudden bundle regressions introduced by caret releases.
- Track `@datocms/cli` updates, especially when schema generation APIs change, and upgrade promptly to retain compatibility.
