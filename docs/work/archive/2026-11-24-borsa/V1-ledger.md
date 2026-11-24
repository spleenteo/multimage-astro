# Ledger — V1
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (both unset)

Ruling: dispatches carry the packet by reference (a fixed header naming /Users/spleenteo/Sites/multimage/multimage-astro/docs/work/2026-11-24-borsa/V1-packet.md, to be read whole before anything else) instead of its 82 KB inline — retyping it in ~20 dispatches costs far more output tokens and time than it saves in cache hits, and the header is still one identical prefix — an agent that skims the file could miss a rule; reviewers check against the same file.

- T1 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 3242672
  Status: DONE · Commits: 3242672 Add the order module with the bag facts and helpers · Tests: npx tsx $TMPDIR/borsa-V1/order-check.ts exit 0; grep ^import → 0; prettier --check pass · Servers: none · Concerns: read packet only to line 557 (trailers taken from session); null/undefined archive/format treated as print; toBagItem missing qty → 1.

- T1 review · flow:task-reviewer · definition: sonnet · Spec pass · Quality pass · no findings
- T1: complete

- T2 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · f0770b2
  Status: DONE_WITH_CONCERNS · Commits: f0770b2 Use the single order email constant from order.ts · Tests: grep ordini@ → only order.ts; ORDERS_EMAIL/no cart grep empty; prettier unchanged; astro check 0/0/0 · Servers: none · Concerns: order.ts formatter not exported, so formatBookPrice/euroFormatter left duplicated; /distributori HTML not diffed (same value).

- T3 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 16b2f11
  Status: DONE_WITH_CONCERNS · Commits: 16b2f11 Add the client bag store with cross-tab sync · Tests: REPO=<repo> npx tsx $TMPDIR/borsa-V1/bag-check.mts exit 0 (.mts, top-level await); prettier pass · Servers: none · Concerns: trailer says Claude Sonnet 5.5 not Opus 5.5; storage key===null also re-dispatches; onBagChange passes items; readBag drops invalid/duplicate items and rewrites; setQty on unknown id is a no-op.

Ruling: executor commits carry the trailer "Co-Authored-By: Claude Sonnet 5.5" (the executors' own model) instead of the packet's "Claude Opus 5.5" — accepted, the trailer names the model that wrote the commit and amending is forbidden — a reader of the log may expect the packet's exact line.

- T5 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 4eb57d6
  Status: DONE_WITH_CONCERNS · Commits: 4eb57d6 Add the bag buttons to the header · Tests: prettier pass; astro check 0/0/0; grep data-bag-open → 2 (lines 209, 262) · Servers: none · Concerns: prettier puts `hidden` on the line before data-bag-open (literal grep misses it); Sonnet trailer; search form classes changed hidden md:flex → flex since the wrapper hides; no visual check (T9).

- T3 review · flow:task-reviewer · definition: sonnet · Spec pass · Quality pass · low: key===null storage branch beyond spec; in-memory fallback ignores other-tab events while active (the plan asks for it); readBag rewrites on partly valid bags; check script is .mts
- T3: complete

Ruling: T2's fix round may edit src/lib/order.ts (T1's file) to export the it-IT EUR formatter the plan says order.ts exports, then make formatBookPrice use it and delete euroFormatter in books.ts — the plan's decision requires it and T1 missed the export — a second edit of a completed task's file, checked by T2's fix review.

- T6 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · f9e79b6
  Status: DONE_WITH_CONCERNS · Commits: f9e79b6 Add the BagAdd component with the mailto fallback · Tests: grep hidden → enhanced span line 29; prettier pass; astro check 0/0/0 · Servers: none · Concerns: Sonnet trailer (ruled); inline <script> in index.astro imports ./add.client and calls initBagAdd() (repo pattern); data-bag-add-ready flag; invalid JSON keeps the fallback; not exercised in a browser.

- T2 review · flow:task-reviewer · definition: sonnet · Spec fail · Quality pass · medium: books.ts kept duplicate euroFormatter (order.ts didn't export it); low: double colon in buildOrderMailto comment
- T2 fix 1 · flow:executor (SendMessage) · definition: sonnet · DONE · 1ab0c53
  Status: DONE · Commits: 1ab0c53 Fix review findings on T2: share the euro formatter from order.ts · Tests: tsx formatBookPrice(16/14.9/null) unchanged before/after; grep ordini@ → only order.ts; ^import in order.ts → 0; prettier unchanged; astro check 0 · Servers: none · Concerns: none
- T2 review fix 1 · flow:task-reviewer · definition: sonnet · Spec pass · Quality pass · low: src/lib/currency.ts holds a third euro formatter (out of scope, TODO candidate)
- T2: complete

- T6 review · flow:task-reviewer · definition: sonnet · Spec pass · Quality pass · low: enhanced span has class contents + hidden (relies on preflight [hidden] !important; browser check in T9)
- T6: complete

- T4 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 146a6f1
  Status: DONE_WITH_CONCERNS · Commits: 146a6f1 Add the bag drawer to the layout · Tests: grep <BagDrawer → 1; innerHTML/executeQuery grep empty; forbidden-words grep empty; prettier pass; astro check 0/0/0; astro build no errors · Servers: none · Concerns: not run in a browser; "Sì, svuota" Button wrapped in span[data-bag-empty-yes] holding the listener; no exit animation; initBagDrawer runs on module load with data-bag-drawer-ready guard; no 16px gutter/safe-area on the side sheet.

- T7 · flow:executor · definition: sonnet · DONE · 8c8e9b4
  Status: DONE · Commits: 8c8e9b4 Add the bag button to the book page · Tests: prettier pass; astro check 0/0/0; grep isArchived && !isEbookFormat|no cart → nothing · Servers: none · Concerns: none (Done 1, 6, 7, 9 left to T9).

- T8 · flow:executor · definition: sonnet · DONE · cc3192f
  Status: DONE · Commits: cc3192f Add the bag action to the home hero · Tests: prettier unchanged after --write; astro check 0/0/0 · Servers: none · Concerns: none (read packet to line 557 only; no other consumer of the hero props).

- T5 review · flow:task-reviewer · opus/high · Spec pass · Quality fail · high: mobile header row ~375px vs 342px at 390px; low: unused `relative` on desktop button; Verified grep can't match prettier's line breaks (hidden is on the line before); badge 20px vs mock 22px
- T5 fix 1 · flow:executor (SendMessage) · definition: sonnet · DONE · 415d468
  Status: DONE · Commits: 415d468 Fix review findings on T5: fit the mobile header at 390px · Tests: prettier pass; astro check 0/0/0 · Servers: none · Concerns: not rendered; Menu text sr-only below sm, button 44px; row 324px of 342px.
- T5 review fix 1 · flow:task-reviewer · opus/high · Spec pass · Quality pass · no findings
- T5: complete

- T7 review · flow:task-reviewer · opus/high · Spec pass · Quality pass · low: no-JS view shows "Ordina via email" plus "oppure scrivici un'email" to the same mailto (as specified); isArchived/isEbookFormat local copies of the rule remain (out of scope)
- T7: complete

- T8 review · flow:task-reviewer · opus/high · Spec pass · Quality pass · low: authors.map computed twice in HomeHero; executor ran prettier --write not --check and read the packet to line 557; no-JS hero mailto icon moved left (BagAdd)
- T8: complete

- T4 review · flow:task-reviewer · opus/high · Spec pass · Quality fail · medium: short viewports collapse the list and clip the footer (WCAG 1.4.10); medium: rebuilt lines never announce changes; low: confirm question not read out; mist-on-mist "Sì, svuota"; identical "Togli dalla borsa" names; title link under 44px; empty src="" in template; non-null assertions
- T4 fix 1 · flow:executor (SendMessage) · definition: sonnet · DONE · 1eeed1f
  Status: DONE · Commits: 1eeed1f Fix review findings on T4: let the drawer reflow and announce changes · Tests: greps clean; prettier pass; astro check 0/0/0 · Servers: none · Concerns: none; panel scrolls under max-height 36rem; persistent sr-only live region [data-bag-announce].
- T4 review fix 1 · flow:task-reviewer · opus/high · Spec pass · Quality pass · low: "<title> tolto dalla borsa" masculine after feminine/plural titles; clampQty import order; cannot verify: 36rem threshold margin (short-height check added to T9)
- T4: complete

- T9 · conductor (slice runner) · browser walk · dev server `npx astro dev --ignore-lock --port 4391`, headless Chromium (Playwright 1.63, cached headless shell 1248), 1280×800 and 390×844, plus JS off and 844×390 / 1280×600 short heights. Books: arte-trascendentale (35,00 €), dal-militare-al-sociale-invece-di-armarci-potremmo (8,00 €), il-gatto-del-presidente-ebook (ebook), documento-del-movimento-umanista-9788886762052 (archived, no price); no unarchived print book without a price exists in the catalogue.
  Done 1: pass (drawer opens, heading focused, title, cover thumb ?w=120, authors, 1 copia, 35,00 €; header count 1; "Nella borsa · 1 copia" under the button). Done 2: pass (2 libri · 4 copie, 105,00 € + 8,00 € = 113,00 €; announce "Arte Trascendentale: 3 copie"). Done 3: pass (reload, home and second tab show 4; removing a line in tab 1 shows 3 in tab 2). Done 4: pass ("Togli" removes one line, focus to heading; "No, tienili" back to "Svuota la borsa"; "Sì, svuota" empties, empty state, counts hidden, storage {"v":1,"items":[]}). Done 5: pass after T4 fix 2 (Tab stays in the dialog, leaving only to the browser chrome; Esc closes, focus back on the header button; backdrop click closes at 1280, n/a at 390 where the sheet is full width); stepper first measured 44×42 → reopened T4. Done 6: pass (JS off: mailto visible, "Metti in borsa" and header buttons hidden; curl shows href="mailto:ordini@…"). Done 7: pass (ebook and archived pages have no [data-bag-add]). Done 9: no live example; covered by T1's check and the T7 review. Also: no horizontal overflow at 390 on book and home pages; home hero shows "Metti in borsa"; corrupt storage resets to empty; short heights reach the last line, "Completa l'ordine" and "Sì, svuota"; no page errors. Title link in a line is 21px tall (inline-link exemption, logged low in T4).
- T4 fix 2 · flow:executor (SendMessage) · definition: sonnet · DONE · e7c6b28
  Status: DONE · Commits: e7c6b28 Fix review findings on T4: make the stepper buttons 44px tall · Tests: prettier pass; astro check 0 · Servers: none · Concerns: none; group lost fixed h-11, buttons h-11 w-11.
- T4 review fix 2 · flow:task-reviewer · opus/high · Spec pass · Quality pass · low: not re-measured by the executor (conductor re-measured: 44×44 at 390 and 1280)
- T4: complete

- Final review · flow:task-reviewer · opus/high · Spec pass · Quality fail · medium: BagAdd init guard set '' and checked truthiness, so a second init re-enhanced (add.client.ts:24/31); low: BagDrawer/index.ts re-export unused (BaseLayout imports index.astro); low: HTML comment in the header shipped on every page, and BagAdd still uses the Iconify bag icon; cannot verify: gate, single shared store chunk
- Final fix · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · fbedd7f
  Status: DONE_WITH_CONCERNS · Commits: fbedd7f Fix final review findings on V1: real BagAdd init guard, no HTML comment in the header · Tests: grep bagAddReady 'true'/=== 'true'; grep "<!-- Inline" → 0; prettier pass; astro check 0/0/0 · Servers: none · Concerns: a second <!-- Inline --> comment (search icon) converted too; trailer model name.
- Final fix review · flow:task-reviewer · definition: sonnet · Spec pass · Quality pass · no findings
- Gate: the conductor's walk server on 4391 stopped, schema.ts unchanged; `npm run lint` pass (after fbedd7f); `npm run build` exit 0 (astro check 190 files, 0 errors; build complete); dist holds one store chunk (bag.client.*.js) shared by drawer and BagAdd. Throwaway $TMPDIR/borsa-V1 deleted.
pending: 9. A print book with no price has no "Metti in borsa" — no unarchived priced-less print book exists in the catalogue to walk; covered only by T1's assertion (isOrderablePrint false for price null) and the T7/T8 reviews (BagAdd with a null book renders only the mailto).
Final review: done
Gate: green — npm run lint pass, npm run build pass (0 errors)

## Close draft
Narrative: V1 shipped the bag end to end on the client: `src/lib/order.ts` (no imports) holds ordini@, the 1–20 cap, the storage key, the two order rules and the money helpers; `bag.client.ts` keeps `{"v":1,"items":[]}` in localStorage with cross-tab sync; `BagDrawer` (native modal dialog in BaseLayout, static markup) renders it and drives the header buttons; `BagAdd` swaps a mailto fallback for "Metti in borsa" on the book page and the home hero. Reviews caught what the plan didn't foresee: the header row overflowed at 390px once the bag button joined it (Menu text now sr-only below sm); the drawer clipped its footer on short screens and announced nothing to screen readers (panel scrolls under 36rem, a persistent live region); the browser walk measured the stepper at 44×42 because the group's border ate 2px (fixed); the BagAdd second-init guard used an empty-string flag that never stopped anything. T2 had to edit T1's order.ts to export the euro formatter the plan said it exported (ruling). Executors sign commits with their own model name in the trailer (ruling). Packets were passed by reference to a file, not inline (ruling). The browser walk ran in headless Chromium from a cached Playwright; Done 1–7 pass, Done 9 has no live example in the catalogue.
Lessons:
- A Verified grep that expects two attributes on one line fails after prettier splits attributes; write it with -A/-B context or grep each attribute separately.
- When a new control joins a fixed-width row, the plan sums the row at 390px before execution: logo, gaps and every button, against the container minus its padding.
- A fixed-height group with a border shrinks its stretched children by the border width; give the controls the 44px height, not the group.
- A data-* ready flag must be set to a non-empty value ('true') and compared with ===; an empty string is falsy and the guard never fires.
- A plan that says module A "exports" a helper for task B checks that A's own task text lists the export; otherwise B is blocked outside its Files.
- Executors read the packet whole; two read only to line 557 of 766 and missed the project constraints.
Decision candidate: none
