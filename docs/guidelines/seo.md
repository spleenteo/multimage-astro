---
agent_edit: false 
scope: provide SEO guidance for the single-locale Multimage site
---

# Search Engine Optimisation (SEO)

## Meta, OG & Twitter tags
Multimage is mono-locale (Italian-only) and fully powered by DatoCMS SEO fields. Configure the global defaults under **SEO Preferences** (`/editor/settings`) and extend every routable model with its own SEO field so editors can override title/description/canonical tags per page.

To render those tags, query `_seoMetaTags`, wrap them with `withFallbackSeo`, and pass the result to `BaseLayout`, which hydrates `@datocms/astro`'s `<Seo />` component. `withFallbackSeo` adds Italian defaults for `<title>`/`<meta name="description">` when editors forget to populate them.

```graphql
query Page($slug: String!) {
  page(filter: { slug: { eq: $slug } }) {
    _seoMetaTags {
      attributes
      content
      tag
    }
  }
}
```

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
import { withFallbackSeo } from '~/lib/seo';
const { page } = await executeQuery(PAGE_QUERY, { slug });
const seo = withFallbackSeo(page?._seoMetaTags, {
  title: page?.title ? `${page.title} | Multimage` : 'Multimage Editrice',
  description: page?.subtitle ?? undefined,
});
---
<BaseLayout seo={seo}>
  <!-- page content -->
</BaseLayout>
```

Dato automatically emits OG/Twitter tags (image, description, locale) whenever `_seoMetaTags` is rendered, so no extra layout logic is required. Avoid overriding those tags manually unless a route needs additional `meta` entries (e.g., `robots`, `article:published_time`).

## Canonicals, robots & sitemap
- Because the site is permanently Italian-only, there is a single canonical URL per page and no alternate/hreflang variants. `BaseLayout` now adds a `<link rel="canonical">` built from `PUBLIC_SITE_URL` + the current slug/path whenever `_seoMetaTags` does not already include one, so keep that env var aligned with the public origin.
- `src/pages/sitemap.xml.ts` builds the sitemap manually: it reads `PUBLIC_SITE_URL`, fetches all published pages/books/collections/authors/blog posts via `SITEMAP_QUERY`, and emits `/sitemap.xml` with one `<url>` per slug. Update `src/pages/sitemap.xml/_graphql.ts` whenever you introduce a new routable model.
- Set `PUBLIC_SITE_URL` for every environment so URLs never fall back to `http://localhost:4321` (see docs/TODO.md task **SEO1**). `astro.config.mjs` already sets `site`, but Vercel preview deploys still rely on the env var.
- `public/robots.txt` only blocks `/staff/` today. Keep it in sync with any other sensitive routes and leave the `Sitemap: /sitemap.xml` line in place so crawlers discover the XML automatically.

## Structured data & rich results
No JSON-LD is emitted today. Book, article, and organization pages rely solely on the default meta tags, so search engines cannot generate rich cards for catalog items or magazine posts. Track the addition of Book/Article/Organization schemas under docs/TODO.md SEO task **SEO2** and render them via `<script type="application/ld+json">` inside `BaseLayout` or the relevant page once requirements are finalized.

## Preview plugins & automation
- `/api/post-deploy` installs/configures the Dato “Web Previews” and “SEO/Readability Analysis” plugins. It should be disabled after the initial run because it reuses `SECRET_API_TOKEN` when minting preview URLs.
- `/api/preview-links` maps Dato records to site URLs and generates draft/published links that hop through `/api/draft-mode/*` so editors can switch contexts safely.
- `/api/seo-analysis` validates the same secret, fetches the target record through `@datocms/cma-client`, then uses `draftModeHeaders()` + `jsdom` to parse the Italian HTML before returning it to the plugin. Keep this endpoint fast—Dato times out after a few seconds.

## Core Web Vitals & analytics levers
- `BaseLayout` injects Iconify, Google Analytics (legacy UA), Iubenda, Vercel Analytics, and Vercel Speed Insights. Audit these scripts when defining a CSP (docs/TODO.md Security task **S3**).
- `BookCarouselSection` and `/cerca` load their JS bundles from `public/generated`. Missed prebuilds surface as `<script>` 404s, so ensure CI runs `npm run prebuild` (docs/TODO.md Project Structure task **PS1**).
- Use the existing Vercel Analytics dashboard to watch LCP/FID trends and coordinate any future perf work with `docs/guidelines/performance.md`.

## Known gaps
- `PUBLIC_SITE_URL` is not enforced during builds, so sitemap/canonical URLs silently fall back to `http://localhost:4321`. Fix this in docs/TODO.md SEO task **SEO1**.
- No structured data is emitted for books, authors, or magazine posts. Add JSON-LD per docs/TODO.md SEO task **SEO2** once schemas are approved.
- `/api/post-deploy` is still deployed despite being a one-off bootstrap endpoint. Track its retirement under docs/TODO.md Security task **S5** so the preview secret stays private.
