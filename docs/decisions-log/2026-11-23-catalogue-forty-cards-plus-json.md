---
kind: decision
status: active
superseded_by: null
work: workers-cpu
area: performance
touches: [src/pages/libri/index.astro, src/pages/libri/index/_graphql.ts, src/pages/catalogue-books.json.ts, src/components/BooksCatalogue, src/components/BookCard, src/components/Book3D, src/lib/catalogue.ts, src/middleware.ts]
description: "/libri server-renders 40 cards; the browser builds the rest from /catalogue-books.json. Rules out server-rendering every book under the 10 ms CPU limit."
---

# /libri renders 40 cards on the server and the rest from a JSON in the browser

**Date**: 2026-11-23

## The decision

/libri renders on the server only the first 40 in-catalogue cards (newest first) plus the inline facet data of every published book; the browser builds every other card from /catalogue-books.json (cards keyed by slug, cached and purged by cache tags like /search-books.json), cloning a card the server renders once as a template. The catalogue query no longer uses BookCardFragment: it reads facet fields for every book and card fields for the first 60. Book3D renders 4 elements per book instead of 14 (only the side face and page edge the pose shows; shadow, gloss and edge are pseudo-elements). Card and book geometry live in src/lib/bookCardView.ts and src/lib/book3d.ts, used by the server card and by the JSON, so both produce the same markup.

## Context

On Cloudflare Workers Free the limit is 10 ms of CPU per request. Uncached /libri cost 65-88 ms in production (2026-11-22) and 40.6 ms on local workerd. The owner ruled out the Paid plan and keeps a fully static site as the last resort. Measures on local workerd: data side about 45% of the page, rendering 374 cards about 55%; Book3D markup cut alone gave -7%, the slim query -12%, 40 cards plus JSON brought the page to 22.4 ms and the JSON endpoint to 13.8 ms. The owner accepted that readers without JavaScript and crawlers get the first 40 books and the sitemap.

## Alternatives discarded

- **Keep every card server-rendered and only trim markup and query**: measured, the page stays near 36 ms locally because the per-card work scales with 374 books.
- **Fetch DatoCMS directly from the browser with a read-only CDA token**: the token exposes the whole published schema, including the `_private` fields, until those move to a model the token cannot read; and the card preparation would be redone in every browser.
- **Move the facet data to the JSON too, so the page reads only 40 books**: lower page CPU, but facet counts would appear after the labels and the filters would not work until the JSON arrives; kept as the next lever if the page must go lower.
- **Build Book3D in the browser on first hover**: after the 40-card cut the server renders 40 books, so the gain is negligible and it adds JavaScript to a CSS-only component.
- **Static site rebuilt by GitHub Actions with an SSR Worker for previews only**: zero CPU, but changes go live after minutes and the hosting model changes; last resort by the owner's choice.

## Consequences

Supersedes the "every published book is rendered server-side" part of 2026-11-22-faceted-catalogue. Without JavaScript /libri shows 40 books, not the whole catalogue. A deep link with filters shows placeholders until the JSON arrives. BookCard/fill.client.ts mirrors the DOM structure of BookCard and Book3D: change them together. Both /libri and /catalogue-books.json still exceed 10 ms in production by estimate (about twice the local figures); production cpuTime and the purge of the new endpoint are still to be measured after the first deploy.

## Reopen when

Production cpuTime of /libri or /catalogue-books.json after deploy stays high enough to cause 1102 errors, or the catalogue grows past the point where the inline facet data dominates the page.

## References

- [spike-cpu-profile](../work/archive/2026-11-23-workers-cpu/spike-cpu-profile.md)
- [2026-11-22-faceted-catalogue](2026-11-22-faceted-catalogue.md)

## Status log

- 2026-11-23 — recorded
