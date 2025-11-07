---
agent_edit: true 
scope: provide SEO guidance for the single-locale Multimage site
---

# Search Engine Optimisation (SEO)

## SEO meta data

Multimage is mono-locale (Italian-only) and fully powered by DatoCMS SEO fields. Configure the global defaults under **SEO Preferences** (`/editor/settings`) and extend every routable model with its own SEO field so editors can override title/description/canonical tags per page.

To render those tags, query `_seoMetaTags`, wrap them with `withFallbackSeo`, and pass the result to `BaseLayout`, which hydrates `@datocms/astro`'s `<Seo />` component.

For example:

```graphql
query Page($slug: String!) {
  page(filter: { slug: { eq: $slug } }) {
    _seoMetaTags {
      attributes
      content
      tag
    }
  # ...
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

### Canonical strategy

Because the site is permanently Italian-only, there is a single canonical URL per page and no alternate/hreflang variants. Let DatoCMS manage canonicals via its SEO field—if `_seoMetaTags` omits one, add it directly in the CMS. Do **not** pass `pageUrls` or generate alternate links in the layout.

## Sitemap

`src/pages/sitemap.xml.ts` builds the sitemap manually. At build time it:

1. Reads `PUBLIC_SITE_URL` (or falls back to `site` from `astro.config.mjs`).
2. Fetches all published pages, books, collections, authors, and blog posts via `SITEMAP_QUERY`.
3. Emits `/sitemap.xml` with one `<url>` per slug (no alternates because there is only one locale).

Ensure `PUBLIC_SITE_URL` is set for every environment so URLs never fall back to `http://localhost:4321` (see docs/TODO.md task **SEO1**). When adding new routable models, update `src/pages/sitemap.xml/_graphql.ts` so those slugs are included.

`public/robots.txt` already points to `/sitemap.xml`, so crawlers discover it automatically.
