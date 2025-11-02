**Key Issues**

- `executeQuery` advertises draft support but hardcodes `includeDrafts: false`, so preview features silently fail; update it to respect options and swap tokens as needed (src/lib/datocms/executeQuery.ts:13-26).
- Rich-text handling mixes StructuredText rendering with manual HTML injection; consolidate around structured renderers to maintain consistent escaping rules (src/pages/index.astro:345-355, src/components/SupplierCard/index.astro:71-139).
- `ClientRouter` usage effectively converts the site into an SPA; if transitions remain, consider wrapping only specific routes to avoid unnecessary hydration (src/layouts/BaseLayout.astro:12-124).

**Duplication & Dead Code**

- Hard-coded `first: 500` limits appear across numerous queries; centralise pagination helpers or shared query fragments to avoid scattering magic numbers (src/pages/libri/[slug]/\_graphql.ts:44-109, src/pages/autori/index/\_graphql.ts:11-37, src/pages/sitemap.xml/\_graphql.ts:4-24).

**Maintainability Gaps**

- No QueryListener/DraftMode toggler exists despite the requirement in AGENTS.md; introduce dedicated components/utilities to standardise preview flows (AGENTS.md:73-89).
- Staff tooling lives under `/src/pages/staff` alongside public content; once secured, consider relocating to an authenticated API route or a protected admin bundle to prevent accidental exposure (src/pages/staff/index.astro:1-55).
- Unused Astro adapters (`@astrojs/cloudflare`, `@astrojs/node`) remain in dependencies, complicating upgrades and audits; remove or configure them intentionally (package.json:20-24).
