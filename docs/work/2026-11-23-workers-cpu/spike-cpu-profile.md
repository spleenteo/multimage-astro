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

## Addendum — `/autori` (2026-11-23)

Two builds side by side, 6 interleaved rounds of 25 requests.

- Without `biography` in the query (experiment, not kept): 38.2 → 27.2 ms (−29%), page 706 → 657 KB. The full Structured Text of 240 biographies costs about 11 ms to keep 200 characters each.
- Portrait as a plain `<img>` (kept): the 208 portraits were DatoCMS `<picture>` elements with seven `srcset` candidates for a 56px image, 328 KB of the page. One 128px square now serves 1x and 2x. With the query trimmed to `responsiveImage { src }`: 40.4 → 29.7 ms (−26%), page 706 → 429 KB. Screenshot of the first letter group at 2x: no pixel differs.

Still in the page: the biographies (about 11 ms) and the read of every book for counts and covers.

## Addendum — `/autori` with `one_line_bio` (2026-11-23)

The owner added `one_line_bio` (string, 100 characters at most) to the author model. 224 lines were written from the biographies and published (15 authors have none: no biography, or one that says nothing); `country` became a select of 190 Italian country names and 91 values were normalised. `/autori` reads `oneLineBio` and `country` instead of the full `biography`, and the card shows "Italia · 3 libri" and the line.

Against the build before the `/autori` work, two runs of 6 interleaved rounds: 40.1 → 24.2 ms on a quiet machine, 31.7 → 26.7 ms on a loaded one (load average 5). Page 700 → 404 KB.

The line is clamped at four rows: 100 characters fit in the four-column desktop grid, and are cut on phones (two columns, about 22 characters per row) for about half of the authors.

## Addendum — `/autori` with one cover and "+n" (2026-11-23)

The card shows the latest cover only, with "+n" for the author's other books (owner's request). Against the previous build, 6 interleaved rounds: 24.1 → 20.7 ms, page 404 → 360 KB. The query is unchanged: counts and the latest cover per author still come from the read of every book.

## Addendum — `/autori` with letters A–E on the server and `/authors-index.json` (2026-11-23)

Card layout chosen by the owner in an Impeccable live session (plain covers at the foot, no tinted field), then up to four small covers per author (one image at twice the displayed height, no `srcset`). The server renders letters A–E (91 of 230 authors; three more of those letters sort past the first 130 profiles the page reads and arrive with the JSON); the browser adds the other letters from `/authors-index.json` when the page is idle.

Against the previous build, 6 interleaved rounds: 21.9 → 16.8 ms, page 360 → 165 KB. Same instance, 5 rounds: page 16.3 ms, `/authors-index.json` 9.2 ms (144 KB, 29 KB gzipped), 404 page 5.9 ms.

Checked in headless Chromium: 91 cards and letters A–E on load; after the JSON 230 cards in 22 letter groups, in the JSON's order; search finds an author from a later letter; `/autori#lettera-p` scrolls to the letter once it exists. Not checked: phones, keyboard, the JSON failing, draft mode, cache tags of the endpoint on Cloudflare.

`/autori` since the start of this work: about 40 ms → 16 ms, 706 KB → 165 KB.

## Addendum — `/autori` after the live design session and the review (2026-11-23)

Design chosen by the owner in Impeccable live sessions: each author on a mist sheet that turns white and lifts on hover, an arrow after the name, grid of one, two and three columns.

An independent review of the `/autori` code found no cache or draft problem and nine defects in the browser script and the page; fixed: the full letter strip is rendered by the server (letters and counts come from the books read, which now carries each author's `slug`, `sortBy` and `fullName`), so the strip no longer grows after load; letters arriving with the JSON are inserted in order; a search before the JSON says it is still looking and no longer shows "no results"; a letter clicked before its authors exist, and a return to a scroll position further down, are honoured once they arrive; groups are keyed by anchor, focus survives a re-insert, the empty state looks at the whole index. Not fixed: profiles past 500 (239 today).

Same instance, 5 rounds of 25 requests: `/autori` 17.2–20.0 ms (mean 19.0), `/authors-index.json` 9.2–12.4 ms (mean 11.0), 404 page 4.8–5.6 ms. Page 189 KB. The page costs about 2–3 ms more than before the design and review changes (larger books read, the arrow in every card).

Checked in headless Chromium at 390px on the dev server: 22 letters in the strip from first paint (same height before and after the JSON); search with the JSON held back, after it arrives, and after it fails twice; click on a pending letter; back navigation to a position under a later letter; card order equal to the JSON.

## Production after the deploy (2026-11-23, version `f3038564`)

`wrangler tail`, requests with an invalid `__draftMode` cookie (uncached), 1–4 samples per path, every outcome `ok`; before in brackets (2026-11-22):

- `/autori` 22, 25, 41, 65 ms (182–248)
- `/libri` 28, 31, 54 ms (65–88)
- `/catalogue-books.json` 7, 15, 19, 23 ms; `/authors-index.json` 7, 16, 20 ms
- home 12, 14, 19, 31 ms (17–47); book page 9, 38 ms (21–49); `/collane` 14, 14, 23, 31 ms (22); `/magazine` 15 ms (19)

Without the cookie, every page and both JSON endpoints answer `cf-cache-status: MISS` then `HIT`. `/autori` serves 91 cards, `/libri` 40. Purge checked after the deploy: a one-line bio was changed and published, and within 15 s `/authors-index.json`, `/autori`, `/catalogue-books.json` and `/libri` answered MISS and the JSON carried the new text; the bio was then restored and published. A publish with no change sends no invalidation.
