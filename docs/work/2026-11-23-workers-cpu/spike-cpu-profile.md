# Spike — CPU profile of uncached renders on local workerd

Date: 2026-11-23. Build: `main` at `2706cef` (`build:cf`). Runtime: `wrangler dev --local` 4.147, compatibility date 2026-10-08, Apple silicon. Cache skipped with `Cookie: __draftMode=measure`.

## Questions and outcomes

**1. How much CPU does an uncached render cost locally?** Process CPU of the user `workerd` (`ps -o time`), 20 warm requests per page:

| Page | Local, warm | Local, first request | Production (2026-11-22) | HTML |
|---|---|---|---|---|
| 404 (layout + 2 queries) | 5 ms | — | — | 60 KB |
| `/magazine` | 14 ms | — | 19 ms | — |
| `/` | 15 ms | 20 ms | 17–47 ms | 84 KB |
| book page | 18 ms | 30 ms | 21–49 ms | 60 KB |
| `/collane` | 19 ms | 10–20 ms | 22 ms | 163 KB |
| `/autori` | 37 ms | 50 ms | 182–248 ms | 705 KB, 4,112 elements |
| `/libri` | 41 ms | 70 ms | 65–88 ms | 943 KB |

Process CPU includes workerd's network threads (TLS, gunzip), which production `cpuTime` does not count; `ps` resolves 10 ms, so single first-request values are coarse.

**2. Does a cold isolate explain production?** No. First requests cost 1.3–1.7× the warm ones. `/libri` in production is about 2× local; `/autori` is 5–6× local, and nothing local reproduces that gap. Open hypothesis: memory pressure (large Structured Text JSON, garbage collection under the 128 MB isolate limit).

**3. Where does the time go?** Self time from the V8 sampling profiler (direct workerd inspector), with gaps longer than 3× the median sample interval dropped. Shares are reliable, absolute values are not (see Method limits).

`/autori`: garbage collector 19%; Astro render runtime (`server_*.mjs`: `addAttribute`, `write`, `next`) 27%; `structuredTextToPlainText` + `authors` chunk 12%; native `Headers.set` and `URL` 10%; `Image` srcset 6%; page template 6%.

`/libri`: garbage collector 22%; Astro render runtime 32%; page template (`index_*.mjs`) 11%; `BookCard` 8%; `TextEncoder.encode` 5%; `toPlainText` 4%.

Small pages: no function above 0.3 ms; the cost is spread over the layout, two to eight DatoCMS fetches and JSON parsing.

**4. Is the middleware buffering visible?** Not as a hot spot: `arrayBuffer()` in `src/middleware.ts:136` is native and does not show in samples. Its share is unmeasured.

## Findings

- Cost follows output size and allocation: the two heavy pages spend half their sampled time in the Astro render runtime and the garbage collector.
- The floor is high: a 404 costs 5 ms locally, every real page 14 ms or more. No page fits 10 ms in production today, and tuning alone will not bring `/libri` or `/autori` under it unless their output shrinks by an order of magnitude.
- `/autori` reads every biography as Structured Text to keep 200 characters, plus every book with cover and colours (`src/pages/autori/index/_graphql.ts`).

## Method limits

- workerd's sampler records about 100 samples per request and reports no idle time: network waits appear as gaps charged to the next sample. Uncapped totals equal wall-clock time; capped totals undercount long native calls (`JSON.parse`).
- `wrangler dev --inspector-port` proxy echoes Profiler commands; connect to the workerd inspector directly (`ps` shows `--inspector-addr`, then `/json` on the neighbouring ports).
- `--env-file` paths resolve from the config's folder (`dist/server/`): pass absolute paths.
- Reliable way to price an intervention: apply it locally, rebuild, compare process CPU over 20 requests.

Scripts: `spike/profile.mjs` (`WS=<inspector ws url> node profile.mjs <path> <runs> <out.cpuprofile>`), `spike/analyze.mjs`.

## Addendum — `Book3D` markup cut (2026-11-23)

`Book3D` rewritten in CSS only: 14 elements → 4 per book (container, book, cover, the one side face the pose shows; shadow, gloss and top/bottom edge as pseudo-elements; the back dropped), 16 inline variables → 9–10. Screenshots before/after (4 catalogue cards at rest and on hover, the book page hero): at most 22 pixels of 215,000 differ.

`/libri`: 943 KB → 688 KB (−27%), 10,647 → 6,907 elements (−35%).

CPU, both builds running side by side, 6 interleaved rounds of 25 requests, CPU of each instance's workerd processes: before 30.8–33.6 ms (mean 31.9), after 27.6–33.2 ms (mean 29.7): about −2 ms, −7%.

Reading: a third fewer elements buys 7% of the CPU. Markup volume is not what `/libri` pays for; the remaining suspects are the data (fetch, JSON parse, garbage collection) and the per-card work in `BookCard`.

A/B method: copy `dist/` of each build, start one `wrangler dev` per copy on its own port, record each instance's workerd pids, interleave the rounds.

## Addendum — catalogue JSON endpoint prototype (2026-11-23)

Prototype `src/pages/api/catalogue/index.json.ts` (`/api/catalogue/index.json`): same query and per-book work as `/libri` (`toBookCard`, the facet entry), no HTML. Output 508 KB, 93 KB gzipped, 374 books; the cover object is the largest part of a card (about 590 of 1,100 bytes).

Same instance, 5 interleaved rounds of 25 requests: `/libri` 38.8–41.6 ms (mean 40.6), JSON endpoint 16.8–19.2 ms (mean 18.5), 404 page 5.6–6.4 ms (mean 5.8).

Reading: the data side (two-step fetch, JSON parse, per-book mapping, stringify) is about 45% of `/libri`; rendering the 374 cards is the other 55%. The endpoint still costs three times the floor, so the query itself is worth slimming (full `description` read to keep 180 characters, the whole cover object).

## Addendum — slim catalogue query (2026-11-23)

`/libri` no longer reads `BookCardFragment`: its own field list drops `description`, `promo`, `responsiveImage`, `license`, the cover `alt` and the collection `id`, none of which the catalogue card shows (`src/pages/libri/index/_graphql.ts`).

Same instance, 5 interleaved rounds of 25 requests (previous build in brackets): `/libri` 34.4–37.2 ms, mean 35.7 (40.6); JSON endpoint 13.2–15.2 ms, mean 14.2 (18.5), output 338 KB, 63 KB gzipped (508 KB); 404 page 6.0–8.0 ms. The rendered page is unchanged: 688 KB, 6,907 elements, 374 books.

Reading: the unused fields were about 4–5 ms. What is left in the endpoint is the 374 records themselves (parse, two `normalizeForSearch` per book, colours array, stringify of both `card` and `entry`).

## Addendum — `/libri` with 40 server cards and `/catalogue-books.json` (2026-11-23)

Built on the work branch (not committed, not deployed). The page reads the facet fields of every book plus the card fields of the first 60, renders the first 40 in-catalogue cards and keeps the facet JSON island; the browser builds the other cards from `/catalogue-books.json` (keyed by slug, cached like `/search-books.json`), cloning a card the server renders once as a `<template>`. `bookCardView` and `book3dView` (new, in `src/lib/`) feed both the server card and the JSON.

Same instance, 5 interleaved rounds of 25 requests: `/libri` 21.2–24.0 ms, mean 22.4 (35.7 with every card, 40.6 before this work); `/catalogue-books.json` 13.2–14.4 ms, mean 13.8; 404 page 6.4–8.0 ms. Sizes: page 228 KB and 1,398 elements (was 943 KB, 10,647); JSON 250 KB, 45 KB gzipped.

Checked in headless Chromium: 40 cards on load; sort, facet, search, "Mostra altri" and a deep link with filters all fill from the JSON; with the JSON held back, placeholders hold the grid and are replaced on arrival. All 374 cards (40 from the server, 334 built in the browser) have the same markup as the full server render of the previous build.

Not checked: phones, keyboard and screen reader on built cards, the JSON failing twice, draft mode, cache tags and purge of the new endpoint on Cloudflare.
