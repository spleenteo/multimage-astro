---
agent_edit: true
scope: How Fastro uses Icons, Fonts and digital assets in general
---

# Assets

## Fonts
- `src/styles/global.css` imports Inter and Playfair Display from Google Fonts once and stores them in the CSS custom properties `--font-sans`/`--font-serif`. Tailwind extends these families globally, so new components only need to use the semantic `font-sans`/`font-serif` utilities instead of hard-coding font names.

## Icons & External Snippets
- The only icon system is Iconify’s custom element. `BaseLayout` injects `https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js` with `defer` and every component uses `<iconify-icon>` directly (Buttons, navigation pills, PillsBlock cards, etc.). Keep the icon set consistent (`iconoir:*` by default) and add new icons by referencing that CDN payload—there is no local sprite.
- `BaseLayout` also inlines Google Analytics (legacy UA) and Iubenda scripts. Treat them as third-party assets when defining CSP/SRI policies (see docs/TODO.md Security tasks).
- Vercel Analytics and Speed Insights run via the inline stubs in `BaseLayout.astro` (`window.va`/`window.si` plus the `/_vercel/...` script tags). Keep those snippets close to the layout to maintain the required execution order and remember to add them to the CSP allow-list in **S3**.

## Images & Responsive Media
- All content images come from DatoCMS via `@datocms/astro/Image`. Shared fragments live in `src/lib/datocms/commonFragments.ts` (`RESPONSIVE_IMAGE_FRAGMENT` + `TAG_FRAGMENT`) and component-specific fragments (for example `BookCardFragment`, `CollectionCardFragment`, `FeaturedBookHighlightFragment`, `PillsBlockFragment`) sit next to their components.
- Every fragment requests Imgix assets with `auto: format`, `fit: crop`, and explicit dimensions so the generated `<picture>` element ships both AVIF/WebP and fallback JPEG sources. `ResponsiveImageFragment` pulls `width`, `height`, `bgColor`, and `base64`, letting `<Image>` emit intrinsic dimensions and a LQIP placeholder by default.
- Heroes that must load eagerly (e.g., home hero, collection hero) can pass `loading="eager"`/`priority` through `<Image>`; everything else keeps the default lazy-loading to preserve Core Web Vitals.
- Usage patterns:
  - Cards/sections (`BookCard`, `CollectionCard`, `AuthorsSection`, `SupplierCard`, `MagazinePostCard`, `FeaturedBookHighlight`, `BannerSection`) always spread the fragment result into `<Image data={...} sizes="..." />` so width/height are inferred from Imgix metadata.
  - Hero media (`home.heroImage`, `CollectionDetailHero`, staff logos) reuse the same fragment and override `sizes` per layout.
  - Structured Text blocks (`src/components/datocms/structuredText/blocks/*.astro`) fetch their own responsive images and ensure fallback `alt` text is injected before rendering.
- Exceptions: the `Header`/`Footer` logos still use a hard-coded remote PNG (`datocms-assets.com/...`). Those `<img>` tags lack intrinsic dimensions and caching directives—capture that debt before shipping any redesign (see docs/TODO.md Project Structure tasks).

## Video & Rich Embeds
- `VideoBlock.astro` is the single entry point for embedded media. It detects Dato’s `provider` metadata, swaps in the correct YouTube/Vimeo embed URL, or falls back to a native `<video>` tag with the provided MP4. No other component should iframe arbitrary providers.
- Book detail pages output Structured Text via `@datocms/astro/StructuredText`, so any future video-capable block must plug into `defaultBlockComponents`.

## Generated Bundles & Client JS
- `scripts/build-search-client.mjs` bundles two browser modules into `public/generated`: `search-page.client.js` (used by `/cerca`) and `swiper-element.js` (used by `BookCarouselSection`). Run `npm run prebuild` before `astro dev`/`astro build` so those files exist, otherwise production pages will 404 the module import.
- Development mode loads the source modules directly (`/src/pages/.../search-page.client.ts`, `/src/components/.../swiper-element.ts`) to enable hot reloads.

## HTML fragments & Sanitization
- Several components render raw HTML strings collected from the CMS: `toRichTextHtml` (home hero copy, BannerSection, PillsBlock body copy, CtaButtonWithImageBlock), `set:html` blocks inside `Book` detail descriptions, supplier bios, and staff notices. Today `toRichTextHtml` simply trusts strings that already look like HTML, so any script injected upstream would ship verbatim. See docs/TODO.md Security task **S2** for the sanitization plan tied to this section.

## Caching & Delivery
- `astro.config.mjs` reads `SERVER` to decide between `output: 'static'` (default, fully prerendered public site) and `output: 'server'` (preview deployments with live drafts). Regardless of the mode every GraphQL query runs at build time using the published CDA token. Dato/Imgix handle image caching (`auto=format` with `base64` placeholders) and the generated pages reference the CDN URLs directly. Client bundles in `public/generated` are copied verbatim—cache-bust them by redeploying or by appending query strings when swapping tokens. The sitemap and canonical URLs depend on `PUBLIC_SITE_URL`; enforce that env so generated XML does not fall back to `http://localhost:4321` in production (tracked in docs/TODO.md SEO task **SEO1**).

## Known gaps
- Sanitization/backfilling for HTML set via `set:html` (see docs/TODO.md Security task **S2** linked above).
- Public `public/generated` assets are not fingerprinted; failures in `npm run prebuild` silently ship empty `<script src>` targets. Track this under docs/TODO.md Project Structure task **PS1**.
- Third-party scripts (Iconify, GA, Iubenda) currently load without CSP/SRI enforcement. Harden them when tackling docs/TODO.md Security task **S3**.
- Header/footer logos still bypass the Dato image pipeline, so they miss intrinsic dimensions and cache headers. Fold them into the CMS or replace them with checked-in assets while addressing docs/TODO.md Project Structure task **PS4**.
