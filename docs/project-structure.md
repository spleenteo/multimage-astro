---
agent_edit: true
scope: Live overview of repository layout and notable rules
---

# Project Structure — Current State (2025-11-16)

- Astro pages live under `src/pages/**`, each with a sibling `_graphql.ts` defining queries/fragments. API routes exist under `src/pages/api/**` and power preview/draft tooling plus automations (`post-deploy`, `seo-analysis`, `preview-links`).
- Components are grouped by feature: `src/components/blocks`, `src/components/datocms/structuredText`, `src/components/ui`, and utility components like `DraftModeQueryListener`.
- Helpers live in `src/lib/**` (datocms, draftMode, seo, books/authors/suppliers). `~/lib/prerender` now centralizes the shared `export { prerender }` flag so pages switch between static/SSR based on `SERVER`.
- Layout, styles, scripts:
  - `src/layouts/BaseLayout.astro` loads site-wide data, analytics, and icon scripts.
  - `src/styles/global.css` imports fonts + Tailwind base layers; `tailwind.config.mjs` defines the design tokens.
  - `scripts/` hosts `sync-datocms.mjs` and `build-search-client.mjs`.
- Generated assets: `public/generated` stores the Site Search + Swiper bundles built during `npm run prebuild`.
- Known gaps: `/staff/*` remains unauthenticated (**S1**), `/llms-full.txt` is public (**S4**), cache tags aren’t wired (**CD3**), and `LinkToRecord` still links `/blog/...` (**PS2**).

Long-term structural requirements and layering constraints remain in `/docs/guidelines/project-structure.md`.
