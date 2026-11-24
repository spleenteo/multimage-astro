---
status: open
phase: slice
slice: null
step: null
work: borsa
stacks: [astro, datocms]
base: main
updated: 2026-11-24
tags: [work, borsa]
description: "A 'bag' (not an e-commerce cart) where visitors put books: titles, editable quantities, total copies and total amount at cover price, emptiable. It ends in a form (name, email, shipping address, notes) that sends the order to ordini@multimage.org (read by Olivier) and a copy to the visitor. Payment stays a bank transfer after shipping. Multimage is an association with promotional-only sales: no transactions, no accounts."
---

# Status — Borsa

> Update at the **end of every session**: done, remaining, blockers.

**Entry**: product, decided on 2026-11-24 because the change is what visitors see and do; the problem is clear, so the frame is skipped and the work starts from shaping.

## Notes

- Design phase runs with Impeccable (user's choice, 2026-11-24): artifacts for the bag sidebar, the order form page, and the "what happens next" guidance (how and when the books arrive, how to pay).
- Technical unknown, spike before the plan: how a Worker on the Free plan sends the order email to ordini@ and a copy to an arbitrary visitor address (Email Routing `send_email` only reaches verified addresses; Cloudflare Email Service; an external provider), plus Turnstile.

## Slices

- [x] V1 — The bag: add, see, change, empty
- [x] V2 — The order page and the sending endpoint
- [x] V3 — Hardening, docs and handover

## Pending proposals

<!-- date — kind:name — link, when an adapter returns proposed -->

## Log

- 2026-11-24 — V3 closed — 9 commits, gate green (lint, docs:inventory, build), axe 0 violations in 8 checks; WAVE and VoiceOver pending after deploy — 20 min run — n/a
- 2026-11-24 — V3 plan + review — 5 tasks; review 1 high (WAF expression on Free plan), 2 medium, 4 low, all applied — 15 min — n/a
- 2026-11-24 — V2 closed — 9 commits, gate green, Done 1–5, 8–10 verified (dev + production build with no keys), Done 6 VoiceOver pending — 24 min run — n/a
- 2026-11-24 — V2 plan + review — 6 tasks (planner needed 3 attempts: sleep, API timeout); review 0 high, 2 medium, 5 low, all applied; ruling: visitor copy omits notes (anti-abuse) — 35 min — n/a
- 2026-11-24 — V1 closed — 13 commits, gate green, Done 1–7 verified in headless Chromium, Done 9 pending (no example); 3 rulings — 19 min run — n/a
- 2026-11-24 — V1 plan + review — 9 tasks; review 1 high, 4 medium, 4 low, all applied — 20 min — n/a
- 2026-11-24 — impact — 2 agents: 3 high (fail-closed keys, Turnstile test key in prod), 11 medium, 7 low; all fixes applied to slices.md (user asked for no stops) — 15 min — n/a
- 2026-11-24 — design + slicing — Impeccable mock docs/design/borsa/borsa-mock.html (artifact HCDpvQfMtVnqefTtB1NNeq); 3 slices; fidelity checks skipped: no frame — 30 min — n/a
- 2026-11-24 — shaping — shape B selected (Resend via spike-email.md), fidelity check skipped: no frame; user asked to run every slice without stops unless something is grave — 40 min — n/a
- 2026-11-24 — opening — work opened, frame skipped (problem clear), next: shaping — 10 min — n/a
