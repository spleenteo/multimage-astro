---
status: open
phase: slice
slice: V2
step: plan
work: cloudflare-workers
stacks: [astro, datocms]
base: main
updated: 2026-11-21
tags: [work, cloudflare-workers]
description: "Migrare Multimage da Vercel a Cloudflare Workers, con la Workers Cache invalidata dai cache tag DatoCMS al posto dell'ISR di Vercel (verifica sul Worker workers.dev, senza toccare DNS né produzione)"
---

# Status — Cloudflare Workers + cache tag DatoCMS

> Update at the **end of every session**: done, remaining, blockers.

**Entry**: technical, decided on 2026-11-21 because the visitors must see the same site: success is pages served from the Workers Cache, publishes visible within seconds, editors always on drafts.

Work runs on branch `chore/cloudflare` (user's choice: the branch of the trial deploy, cut from `main`), not on `work/cloudflare-workers`. The user is asleep and asked to run the whole work without stopping except for serious problems: at each Flow stop the recommended answer is taken and noted in the Log.

## Slices

- [x] V1 — Cache in front of the Worker, editors bypass it
- [ ] V2 — DatoCMS tags and the invalidation endpoint
- [ ] V3 — Switch runbook and docs

## Log

- 2026-11-21 — opening + shaping + slicing — shape A picked (Astro route cache, native DatoCMS tags, gateway entrypoint, invalidation endpoint); frame and breadboard skipped (technical work, no new UI) — 25 min — n/a
- 2026-11-21 — impact — 2 agents, 23 findings (4 high: purge result ignored, late cache.set re-enables caching, non-HTML routes cached by default, middleware would change Vercel); all fixes applied to slices.md as cross-slice rules and per-slice items (user asleep: recommended fixes accepted) — 12 min — n/a
- 2026-11-21 — V1 plan + review — 3 tasks; review: 0 high, 3 medium (robots.txt is a static asset, tail counts, no Vercel header check), 3 low; all fixes applied (user asleep) — 20 min — n/a
- 2026-11-21 — V1 close — cache in front of the Worker works on workers.dev (MISS→HIT, drafts bypass, internal BYPASS); gate green; 4 commits; decision candidate (gateway as second entrypoint) held for V3's decisions update — 12 min — n/a
