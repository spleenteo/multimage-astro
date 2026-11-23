---
status: open
phase: shaping
slice: null
step: null
work: workers-cpu
stacks: [astro, datocms]
base: main
updated: 2026-11-23
tags: [work, workers-cpu]
description: "Reduce the CPU of Worker-rendered pages and stay on the Workers Free plan (10 ms per request) with margin. Optimisation first; a static site is the last resort."
---

# Status — Workers CPU

> Update at the **end of every session**: done, remaining, blockers.

**Entry**: technical, decided on 2026-11-23 because readers see no change: only the cost of an uncached render moves.

Path: spike (`spike-cpu-profile.md`, CPU profile on local workerd) → shaping (ranked interventions) → user's choice → slicing → impact → slices. Frame, breadboard and design skipped: no UI change, problem already measured (TODO `CAT-cpu`).

Priorities set by the owner (2026-11-23): optimise SSR first (lighter queries, pagination, `Book3D` via `/impeccable optimize`, middleware buffering); static site + GitHub Actions rebuild only if optimisation cannot fit 10 ms.

## Slices

- [ ] (defined during slicing)

## Pending proposals

<!-- date — kind:name — link, when an adapter returns proposed -->

## Log

<!-- date — step — done — remaining — wall-clock — cost -->
- 11-23 — opening + spike — home created; CPU profile on local workerd (`spike-cpu-profile.md`): cost follows output size, floor 5 ms, `/autori` gap with production unexplained — shaping of interventions, owner choice — 50 min — —
- 11-23 — owner choice — option A: cut the heavy pages (`/autori`, `/libri`), accept the floor on small pages; `Book3D` goes through `/impeccable optimize` first; the faceted filters of `/libri` need their own design before any 40-cards-plus-JSON change — impeccable optimize on `Book3D`, then shaping — — —
- 11-23 — prototype on the branch — `Book3D` in 4 elements, slim catalogue query, `/libri` with 40 server cards + `/catalogue-books.json`: `/libri` 40.6 → 22.4 ms local, measures in `spike-cpu-profile.md` — owner review in the browser, then slices/commit, docs, `/autori` — — —
