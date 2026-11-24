# Ledger — V6
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (both unset)

Ruling: every dispatch opens with an instruction to read /Users/spleenteo/Sites/multimage/multimage-astro/docs/work/2026-11-24-borsa/V6-packet.md whole (28 KB) plus its Project constraints verbatim, instead of pasting it all — the user at the first stop asked to tell executors to read the packet file whole; same ruling as V4/V5 — an agent that skims misses a rule; reviewers check against the same file

- T1 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 93fe903
  Commits: 93fe903 Compute the member discount on the server and store it in D1. Tests: discount-check.ts ok (ORDER_COLUMNS 18 → 20); sqlite3 0001+0002 last columns discount_cents, member; member=2 CHECK fails; default 0|0; no imports in order.ts; orderTotals(lines, shippingKind, order.member); prettier on 3 TS files; astro check 0 errors. Servers: none. Concerns: prettier has no SQL parser (0002 unchecked, as 0001); scratch test not committed.

- T1 review · flow:task-reviewer · opus (top tier, critical) · Spec pass, Quality pass · 93fe903
  Low (logged, not fixed): order.ts:461 ORDER_COLUMNS doc comment extended past 100 columns; order.ts:402 MEMBER_DISCOUNT_PERCENT doc comment past 100 columns. Checked INSERT_SQL built from ORDER_COLUMNS, single ok reply typed OrderResponse, no other callers.
- T1: complete

- T3 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 98e914c
  Commits: 98e914c Document the member discount in the D1 contract, setup note and design docs. Tests: Verified greps pass (discount_cents 2, 0002 in setup line 45, member in security.md, memberDiscount 1, "Sono socia o socio" in DESIGN.md and current-state.md); docs:inventory green; prettier realigned the d1/README table. Servers: none. Concerns: `grep -i "city and province"` misses the binding sentence ("City, province, `member`, …"), kept verbatim; added a clause to setup step 4 that n = 0 applies on a fresh database.

- T3 review · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · 98e914c
  Low (logged, not fixed): setup-borsa.md:46 "on a fresh database" is an accurate addition; the Verified grep "city and province" cannot match the binding retention sentence (the binding fix line wins; grep superseded); current-state.md:39 sentence added inside a long line.
- T3: complete

- T2 · flow:executor · definition: sonnet · DONE · 83367da
  Commits: 83367da Show the member discount in the order form, success screen and PDF. Tests: pdf-check.ts ok (member/non-member blocks, pdfText('−30%') → -30%); #order-member grep shows aria-describedby, no required; "lo staff verifica" 1, "l'iscrizione\." 1; data-order-discount-row 1 each; no .innerHTML; prettier unchanged; astro check 0 errors. Servers: none. Concerns: browser checks left to T4; say() fires on change only.

- T2 review · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · 83367da
  Low (logged, not fixed): order-pdf.ts:126 builds `−${formatCents(...)}` by hand instead of formatDiscount (same output).
- T2: complete

- T4 · slice runner (conductor's task, run in the runner) · Done walk · no commits
  Setup: migrations apply --local --persist-to .wrangler/state (0001, 0002 ✅); DEPLOY_TARGET=cloudflare astro dev --ignore-lock :4373 (PIDs 32293/32317, stopped); playwright-core + axe-core in scratch, chrome-headless-shell 1248; bag seeded with #BeHuman (1400) × 2, S = 2800, D = 840.
  Done 1 pass (390×844 and 1280×800): unticked row display none, label "Totale a prezzo di copertina", total 28,00 €; ticked row flex "Sconto soci −30%" −8,40 €, total and size line 19,60 €, label "Totale con sconto soci", live region "Totale con sconto soci: 19,60 €"; untick → hidden, 28,00 €, announced; re-tick + Rapida → 24,60 € (5 € not discounted); member label row 44 px; overflow 0; checkbox label "Sono socia o socio di Multimage" and hint word for word "Sconto del 30% sul prezzo di copertina: lo staff verifica l'iscrizione."; axe ticked: only link-in-text-block(1) and region(2) (site-wide, known).
  Done 2 pass: 1280 ticked + Rapida → 200 MM-261124-T7PQ member true, discount 840, total 2460, notified true; success lists "Socia/socio: sì", "Sconto soci −30% · −8,40 €", "Totale con sconto soci · rapida e tracciabile 24,60 €"; PDF (pdftotext) "Socia/socio: sì", "Sconto soci -30% … -8,40 €", "Totale con sconto soci 24,60 €"; D1 row member 1, 2800, 840, 500, 2460, sent; shop email (miniflare email-text) "Socia/socio: sì" after "Ordini come", "Sconto soci −30%: −8,40 €" after "Copie", "Totale con sconto soci: 24,60 €". curl member true + discount 99999 + total 1 → stored member 1, discount_cents 840, total_cents 1960; member "true" → 0|0, total 2800.
  Done 3 pass: 390 unticked piego → MM-261124-PKQ5, success "#BeHuman · 2 copie · 28,00 €", "Totale · piego di libri 28,00 €", no member/discount line; PDF "Totale a prezzo di copertina 28,00 €", no Sconto/Socia/socio line; D1 member 0, discount 0, total 2800; email unchanged. (A debug submit, member 0 + rapida, stored 0|0|3300.)
  Cleanup: .wrangler/state/v3/d1, .wrangler/tmp/email and scratch removed; 4373 free; schema.ts untouched; git status shows only the ledger.
  Gate: npm run lint green; npm run docs:inventory green; npm run build green (astro check 0/0/0); npm run build:cf green (Done 4).
- T4: complete

- Final review · flow:task-reviewer · opus (top tier) · Spec pass, Quality pass · 93fe903 98e914c 83367da
  Medium: bagMailto (order.ts:627, client :257) dropped the member flag, so the email fallback promised 30% on the recap but sent no member line (plan gap, created by V6). Lows: d1/README contract silent on discount_cents = 0 unless member and half-up rounding; order-pdf.ts:126 hand-built discount string; order-pdf.ts import order; _borsa.css .order-member repeats .order-consent; three order.ts doc comments past 100 columns; T3 Verified grep vs binding retention sentence (lesson). Cannot verify: full executor report fields; `git commit -- <paths>` use.
- Final review fix · flow:executor (fresh) · definition: sonnet · DONE · c52d26d
  c52d26d Fix final review findings on V6: keep the member flag in the mailto fallback, tidy PDF, docs and CSS (findings 1–6). Tests: scratch tsx (bagMailto default byte-identical; with true "Socia/socio: sì" right after the shipping line; orderPdf discount row unchanged), astro check 0, lint, docs:inventory, prettier. Servers: none. bagMailto has one caller (/borsa client), rebuilt on every render.
- Final review fix review · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · no findings
- Gate re-run after c52d26d: lint green; docs:inventory green; build green (astro check 0/0/0); build:cf green.
Final review: done
Gate: green (lint, build with astro check 0/0/0, docs:inventory, build:cf), re-run after the final-review fix

## Close draft

Narrative: V6 added the member discount. A "Sono socia o socio di Multimage" checkbox row (44 px, slate hint "Sconto del 30% sul prezzo di copertina: lo staff verifica l'iscrizione.") sits after "Ordini come"; ticking it shows "Sconto soci −30%" in the recap and relabels the total "Totale con sconto soci", announced in the polite region. The server owns the discount: order.ts gained MEMBER_DISCOUNT_PERCENT, memberDiscount (30% of the books, half up, never shipping: the 5 € fast shipping stays whole), formatDiscount, orderTotalLabel and the member strings; the client sends only `member` (strict `=== true`), and a forged discount or total is ignored. Migration 0002 adds `member` (CHECK 0/1) and `discount_cents`; `total_cents` is after the discount. The shop email, the success screen and the PDF (U+2212 mapped to '-' for WinAnsi) carry "Socia/socio: sì" and the discount line; unticked, every surface is as before. The walk ran Cloudflare dev with local D1 at 390 and 1280: #BeHuman × 2 gave 28,00 → 19,60 €, 24,60 € with Rapida, the row stored 1/840/2460, curl with discount 99999 stored 840 and "member":"true" stored 0. The final review found that the mailto fallback dropped the member flag while the recap promised the discount; bagMailto now adds the member line (c52d26d), along with a sharper d1/README contract (0 unless member, half up) and small tidy-ups. d1/README retention now keeps city, province and `member` after anonymising (the user's call). Rulings: the packet was read from file rather than pasted. Before any deploy the conductor applies 0002 to the remote D1.
Lessons:
- A change to what the recap promises (a price, a discount) is traced through every way the order can leave the page, fallbacks included (mailto), not only the main submit.
- A Verified grep is checked against any binding "Review fixes" text that rewrites the line it looks for, and adjusted in the plan.
- A browser walk on /borsa clicks `[data-order-form] button[type=submit]` (the header search has submit buttons too) and waits on `load` plus a selector, never `networkidle` (the dev server keeps a socket open).
Decision candidate: none
