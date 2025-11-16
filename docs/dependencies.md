---
agent_edit: true
scope: Live inventory of runtime and build dependencies
---

# Dependencies — Current State (2025-11-16)

- Core stack: Astro 5.15, Tailwind 3.4, TypeScript 5.5, `@astrojs/tailwind`, `@astrojs/vercel`, `@datocms/astro`, `@datocms/cda-client`, `@datocms/cma-client`.
- Tooling: Prettier 3.3 + `prettier-plugin-astro`, esbuild 0.25, dotenv-cli, npm-run-all.
- Client bundles: Swiper 11 for carousels, Iconify for icons.
- Dev-only libs: `@astrojs/check`, `@astrojs/ts-plugin`, `@types/*` packages.
- Known upgrades/debt: still shipping GA UA snippet, jsdom only used by `/api/seo-analysis`, no automated dependency audit pipeline.

Policies for approving/upgrading dependencies reside in `/docs/guidelines/dependencies.md`.
