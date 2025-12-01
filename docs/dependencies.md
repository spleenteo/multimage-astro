---
agent_edit: true
scope: Live inventory of runtime and build dependencies
---

# Dependencies — Current State (2025-12-01)

- Core stack: Astro 5.16.3 (latest), Tailwind 3.4, TypeScript 5.5, `@astrojs/tailwind`, `@astrojs/vercel`, `@datocms/astro`, `@datocms/cda-client`, `@datocms/cma-client`.
- Tooling: Prettier 3.3 + `prettier-plugin-astro`, esbuild 0.25, dotenv-cli, npm-run-all.
- Client bundles: Swiper 11 for carousels, Iconify for icons.
- Dev-only libs: `@astrojs/check`, `@astrojs/ts-plugin`, `@types/*` packages.
- Notable 5.16 changes: experimental SVGO optimization flag for SVG components (disabled here), CLI `astro add --yes` automation hint, and `ActionInputSchema` helper for Actions. citeturn0search0
- Known upgrades/debt: still shipping GA UA snippet, jsdom only used by `/api/seo-analysis`, no automated dependency audit pipeline; evaluate enabling `experimental.svgo` once SVG/icon regressions are ruled out (tracked in docs/TODO.md).

Policies for approving/upgrading dependencies reside in `/docs/guidelines/dependencies.md`.
