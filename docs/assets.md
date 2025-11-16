---
agent_edit: true
scope: Snapshot of fonts, media, and bundle usage in Multimage
---

# Assets — Current State (2025-11-16)

- Fonts: `src/styles/global.css` imports Inter + Playfair Display from Google Fonts once and stores them in CSS variables consumed by Tailwind (`font-sans`/`font-serif`). No local font files exist.
- Icons: the project loads `iconify-icon.min.js` from the Iconify CDN via `BaseLayout`. Components render `<iconify-icon>` directly (navigation, pills, CTA blocks). There is no tree-shaking or local sprite.
- Third-party snippets: BaseLayout injects legacy Google Analytics, Iubenda, Vercel Analytics, and Vercel Speed Insights scripts verbatim; CSP/SRI hardening is still open (docs/TODO.md **S3**).
- Images: every CMS-driven image goes through `@datocms/astro/Image` with shared fragments (`ResponsiveImageFragment`, etc.), emitting AVIF/WebP + JPEG fallbacks and base64 placeholders. Header/footer logos are still remote PNGs lacking intrinsic dimensions.
- Videos: `VideoBlock.astro` handles YouTube/Vimeo/native MP4 embeds coming from Structured Text blocks; no other component should iframe media directly.
- Generated bundles: `npm run prebuild` emits `public/generated/search-page.client.js` and `public/generated/swiper-element.js`. Missing bundles break `/cerca` and `BookCarouselSection`; enforcement remains TODO (**PS1**).
- HTML sanitization: Home hero copy, Banner sections, supplier bios, and staff notices still call `toRichTextHtml`/`set:html` without sanitization (docs/TODO.md **S2**).

See `/docs/guidelines/assets.md` for the full media policy and authoring requirements.
