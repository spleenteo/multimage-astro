---
status: open
phase: slice
slice: V2
step: plan
work: upgrade-2026-11
stacks: [astro, datocms]
base: main
updated: 2026-11-05
tags: [work, upgrade-2026-11]
description: "Manutenzione: aggiornare librerie e framework alle ultime versioni stabili (cura devops)"
---

# Status — Upgrade librerie novembre 2026

> Update at the **end of every session**: done, remaining, blockers.

**Entry**: technical, decided on 2026-11-04 because the visitors of the site must see no change: success is a 100% green local build and a working deploy.

Work runs on branch `chire/upgrade-11-26` (user's choice, cut fresh from `main`), not on `work/upgrade-2026-11`.

## Slices

- [x] V1 — Cache baseline: audit route → models → revalidated, `caching.md` procedure, ISR snapshot
- [ ] V2 — Revalidation map fixes (`index_page` by slug, supplier, license, app)
- [ ] V3 — Patch/minor, Node 24, TypeScript 6 (CLI stays 4.0.x)
- [ ] V4 — Astro 7 + @astrojs/vercel 11, preview deploy
- [ ] V5 — DatoCMS clients + CLI 4.2, type shims removed
- [ ] V6 — Other majors: swiper 14, jsdom 30, prettier-plugin-astro 1.x
- [ ] V7 — Tailwind 4, visual check, final preview deploy

## Pending proposals

<!-- date — kind:name — link, when an adapter returns proposed -->

## Log

<!-- date — step — done — remaining — wall-clock — cost -->
- 2026-11-04 — opening + slicing — profile recorded (`.flow.yml`, `docs/development-guidelines.md`), `decision-log/` moved to `decisions-log/`, guidelines frontmatter `scope:` → `description:`, six slices agreed — impact next — ~25 min — n/a
- 2026-11-04 — impact — 18 problems (3 high: CLI 4.2 pulls CMA v6, cache procedure hit production, draft render cacheable without BYPASS_TOKEN), all fixed in slices.md; new slice V2 for revalidation map gaps, slices renumbered V1–V7 — plan V1 next — ~17 min — n/a
- 2026-11-04 — V1 plan + review — 8 tasks; review: 0 high, 4 medium, 8 low, all fixes applied — execute next — ~20 min — n/a
- 2026-11-05 — V1 close — caching.md, revalidation-map check, ISR baseline, procedures a/b/c run; 15 gaps (4 → V2, 11 → TODO); gate green after a formatting fix on 2 pre-existing src files; SECRET_API_TOKEN printed once in an agent terminal (rotation: user's call) — V2 plan next — ~32 min — n/a
- 2026-11-05 — after V1 — token rotation scheduled as last step (TODO S6); dev-server rule (4321 is the user's); V2 gains executeQuery injection instead of the resolve hook (no decision recorded) — V2 plan next, after the user's /clear — n/a — n/a
