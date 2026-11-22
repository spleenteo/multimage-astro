# 2026-11-22 — /libri becomes one faceted catalogue

## Context

The 2026-06-20 FOT reduction paginated `/libri` (40 books per page, `/libri/pagina/<n>`) to cut Vercel Fast Origin Transfer: the un-paginated page shipped ~1 MB per render. Since 2026-11-22 production runs on Cloudflare Workers, where cache hits cost no origin transfer and the binding constraint is CPU per render (Free plan, 10 ms), not bytes.

The Impeccable critique of `/libri` (19/40) found that the only way into ~350 books was paging through them by print year: no collections, no format, no search on the page. The user asked for faceted filters on the whole catalogue (brief: `.impeccable/surfaces/src-pages-libri-index-astro.md`).

## Decision

- `/libri` renders every published book (in catalogue and out of catalogue) as a `BookCard` in its `catalogue` variant (no summary, lighter field). Size: ~855 KB HTML, ~95 KB gzip.
- A browser script filters, sorts and reveals the cards 40 at a time: collana, formato, autrice/autore, periodo (latest two years, then decades), tradotti, fuori catalogo, plus search in titles and names. Facet counts take the other active filters into account. The state lives in the URL (`replaceState`).
- Without JavaScript the filters are hidden and the whole in-catalogue list shows; out-of-catalogue books stay on `/libri/archivio`.
- `/libri/pagina/<n>` answers 301 to `/libri`. `buildBooksCataloguePaths()` returns `['/libri']`, so sitemap and revalidation callers stay unchanged.
- "Solo titoli in evidenza" (books flagged `highlight`) is the first facet, above the collections (`evidenza=1`). A highlights shelf above the grid was tried and dropped: it took too much room before the catalogue.
- Themes (`keywords`, filled on 114 of 363 books, with 514 distinct values) are not a facet. They are a second phase: an editorial set of 8–12 themes first.
- Follow-up the same day: `/libri/ebooks` → 301 `/libri?formato=ebook` and `/libri/highlights` → 301 `/libri?evidenza=1`. The header menu has "Catalogo" and "Collane" as first-level items (the "Libri" dropdown and the `BooksSectionNav` sub-navigation are gone). Their `index_page` records (slugs `ebooks`, `highlights`) are no longer rendered; they can be deleted in the CMS.

## Consequences

- A cache miss on `/libri` renders ~9× more cards than before. Measured on the dev server, `/libri` takes ~80 ms longer than `/libri/ebooks` (50 cards). Before deploying, check `cpuTime` on a miss with `wrangler tail`. If it exceeds the plan, the fix is to render the first 40 cards on the server and the rest from a cached JSON endpoint.
- Supersedes the `/libri` pagination part of `2026-06-20-fot-reduction`. The `catalogueBooksMeta` count queries in `publicUrls.ts`, `revalidationUrls.ts` and the sitemap are now redundant (TODO CAT-count-cleanup).
