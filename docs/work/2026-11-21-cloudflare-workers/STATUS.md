---
status: open
phase: impact
slice: null
step: null
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

- [ ] V1 — Cache in front of the Worker, editors bypass it
- [ ] V2 — DatoCMS tags and the invalidation endpoint
- [ ] V3 — Switch runbook and docs

## Log

- 2026-11-21 — opening + shaping + slicing — shape A picked (Astro route cache, native DatoCMS tags, gateway entrypoint, invalidation endpoint); frame and breadboard skipped (technical work, no new UI) — 25 min — n/a
