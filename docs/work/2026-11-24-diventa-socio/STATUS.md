---
status: open
phase: slice
slice: V4
step: plan
work: diventa-socio
stacks: [astro, datocms]
base: main
updated: 2026-11-24
tags: [work, diventa-socio]
description: "A /diventa-socio page with the texts of the DatoCMS `membership` singleton and a membership request form; the data reaches info@multimage.org by email through Cloudflare (and a D1 copy); the confirmation says the person will be contacted soon and can already pay the fee by bank transfer or PayPal."
---

# Status — Diventa socio

> Update at the **end of every session**: done, remaining, blockers.

**Entry**: technical, decided on 2026-11-24 because the outcome fits one sentence: a visitor reads the membership info at /diventa-socio, sends the request, and sees a confirmation with the bank transfer and PayPal details.

Owner answers at opening (2026-11-24):

- Form fields: email, first name, last name, date of birth, place of birth, address (line 1, line 2, city, state/province/region, postal code, country defaulting to Italy), fee type (a list, e.g. "10€ — Studente under 25"), payment method (bank transfer or PayPal), collaboration areas as checkboxes (area editoriale, web e social, impaginare, fare video, scrivere articoli per il Magazine, ufficio stampa, partecipare in un gruppo locale, altro with free text).
- Destination mailbox: info@multimage.org.
- D1 copy of each request: yes.
- New fields on the `membership` singleton, edited on the primary environment: yes. Fee tiers and collaboration areas live in DatoCMS.
- Menu link: corrected at impact: the links are in code; /info/adesioni gets a 301 to /diventa-socio (owner).
- Retention of personal data: no rule (owner).
- info@multimage.org added as Email Routing destination 2026-11-24, unverified until the owner clicks.
- Texts of `content`, `payment_note`, `success_text`: drafted by Claude, approved by the owner.

## Slices

- [x] V1 — The page and the form, from the CMS
- [x] V2 — Sending the request and the confirmation
- [x] V3 — Live on multimage.org
- [ ] V4 — From the critique: trust, a shorter form, a confirmation that leads to books

## Pending proposals

<!-- date — kind:name — link, when an adapter returns proposed -->

## Log

<!-- date — step — done — remaining — wall-clock — cost -->

- 2026-11-24 — opening — work opened, technical path: frame, shaping, breadboard and design skipped (outcome clear, form styled like /borsa) — slicing, impact, slices — 10 min — n/a
- 2026-11-24 — slicing — 3 slices (page+CMS, send path, live); fidelity check skipped (no frame) — impact — 10 min — n/a
- 2026-11-24 — impact — 2 agents, 24 findings (1 high: live model has subtitle+content, not description; rate limit; links in code; info@ unverified; seed must be published; shared modules) — all applied to slices.md — V1 plan — 15 min — n/a
- 2026-11-24 — V1 close — page + form from the CMS, schema and seed published, shared form CSS/helpers; gate green; 3 browser checks pending — V2 — ~45 min — n/a
- 2026-11-25 — V2 close — /api/socio, D1 0004 (local), MEMBERSHIP_MAIL, shared payment/turnstile modules, confirmation; gate green; local D1 row proven, full submit deferred to production (local workerd outbound timeouts) — V3 — ~60 min — n/a
- 2026-11-25 — V3 close — links + 301, docs, WAF widened, remote D1 0004, deployed 2922a340, real request saved/notified/deleted — closing sequence (changelog, archive, merge) — ~50 min — n/a
- 2026-11-25 — slicing — V4 added from the Impeccable critique (25/40), owner chose all five issues, payment and collaboration moved to the confirmation — V4 plan — 10 min — n/a
