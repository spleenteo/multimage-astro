---
status: open
phase: impact
slice: null
step: null
work: upgrade-2026-11
stacks: [astro, datocms]
base: main
updated: 2026-11-04
tags: [work, upgrade-2026-11]
description: "Manutenzione: aggiornare librerie e framework alle ultime versioni stabili (cura devops)"
---

# Status — Upgrade librerie novembre 2026

> Update at the **end of every session**: done, remaining, blockers.

**Entry**: technical, decided on 2026-11-04 because the visitors of the site must see no change: success is a 100% green local build and a working deploy.

Work runs on branch `chire/upgrade-11-26` (user's choice, cut fresh from `main`), not on `work/upgrade-2026-11`.

## Slices

- [ ] V1 — Cache baseline: audit of ISR + surgical revalidation, verification procedure
- [ ] V2 — Patch/minor bumps, Node 24, TypeScript 6
- [ ] V3 — Astro 7 + @astrojs/vercel 11, cache re-verified, preview deploy
- [ ] V4 — DatoCMS clients: cda-client 0.3, cma-client 6
- [ ] V5 — Other majors: swiper 14, jsdom 30, prettier-plugin-astro 1.x
- [ ] V6 — Tailwind 4, visual check, final preview deploy

## Pending proposals

<!-- date — kind:name — link, when an adapter returns proposed -->

## Log

<!-- date — step — done — remaining — wall-clock — cost -->
- 2026-11-04 — opening + slicing — profile recorded (`.flow.yml`, `docs/development-guidelines.md`), `decision-log/` moved to `decisions-log/`, guidelines frontmatter `scope:` → `description:`, six slices agreed — impact next — ~25 min — n/a
