---
agent_edit: true
scope: A list to describe all models in pages
---

## Page-Level Models

- `Page` (`page { ... }` in `src/pages/index.astro`): Basic editorial page exposing `title`, `_seoMetaTags`, `_firstPublishedAt`, and a `structuredText` field that can embed modular blocks (`ImageBlockRecord`, `ImageGalleryBlockRecord`, `VideoBlockRecord`) alongside links (`PageRecord`) and inline references. Queried through `BasicPageQuery`.
- `_Site` (`_site` in `src/layouts/Layout.astro`): Global singleton used to fetch `faviconMetaTags`, merged into the `<Seo />` component for every page render via the shared `TagFragment`.

## Structured Text Blocks

- `ImageBlockRecord`: Supplies an `asset` with `title` and `responsiveImage` data. Rendered by `src/components/blocks/ImageBlock`, which reuses the global `ResponsiveImage` fragment.
- `ImageGalleryBlockRecord`: Provides an array of gallery `assets` (each with `id`, `title`, and `responsiveImage`). Handled by `src/components/blocks/ImageGalleryBlock`.
- `VideoBlockRecord`: Returns a single video `asset` including `title` and the nested `VideoPlayerFragment` payload (Mux playback details). Rendered through `src/components/blocks/VideoBlock`.

## Structured Text References

- `PageRecord`: Used in both `PageLinkFragment` and `PageInlineFragment` to collect the `id`, `__typename`, and `title` required for record links/inline pills inside structured text.
- `Tag` (`_seoMetaTags`): Meta tag node containing `tag`, `attributes`, and `content`. Leveraged by `TagFragment` so pages and layouts can declaratively append SEO tags emitted by DatoCMS.
