**Runtime**
- `astro@^5.15.1` powers the static site; adapters for Node and Cloudflare are installed but unused, increasing attack surface without benefit (package.json:20-24, astro.config.mjs:1-18).
- `@astrojs/tailwind`, `tailwindcss`, and `autoprefixer` deliver styling via Tailwind layers with custom brand tokens (tailwind.config.mjs:1-61).
- `swiper` is bundled purely for the carousel web component; its CSS bundle is imported wholesale and the minified runtime is copied to `public/vendor` at build time (src/components/BookCarouselSection/index.astro:1-102, scripts/ensure-swiper-element.mjs:6-27).

**CMS & Data**
- `@datocms/astro`, `@datocms/cda-client`, and `@datocms/cli` provide rendering helpers, GraphQL fetching, and schema generation; however, `@datocms/cma-client` is only re-exported for types and may be removable if unused elsewhere (package.json:20-36, src/types/datocms.d.ts:1-2).
- The project leans on `dotenv-cli` for scripted env loading (`npm run generate-llms`) and `@datocms/cda-client` for all content queries (package.json:18-35, scripts/generate-llms.mjs:5-238).

**Monitoring & Analytics**
- `@vercel/analytics` and `@vercel/speed-insights` are embedded conditionally in production, complementing legacy Google Analytics and Iubenda snippets defined inline (package.json:24-30, src/layouts/BaseLayout.astro:132-210).

**Tooling**
- Formatting is handled by `prettier` + `prettier-plugin-astro`; no ESLint is configured, so lint coverage is limited to formatting (package.json:31-40).
- `simple-git-hooks` is listed as a dev dependency but lacks configuration, meaning hook setup currently no-ops in `scripts/prepare.mjs` (package.json:31-40, scripts/prepare.mjs:24-52).

**Risk Notes**
- Remove unused adapters (`@astrojs/node`, `@astrojs/cloudflare`) to reduce dependency footprint unless multi-runtime deployment is planned (package.json:20-24).
- Verify `swiper` updates promptly; pinned caret version can introduce breaking bundle changes, so consider locking to an exact version and bundling tree-shaken CSS.
- Ensure `@datocms/cli` is updated when DatoCMS changes schema generation APIs; current version ^3.1.4 should be cross-checked against CLI release notes.
