# Ledger — V2
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (both unset)

Ruling: dispatches carry the packet by reference (a fixed header naming /Users/spleenteo/Sites/multimage/multimage-astro/docs/work/2026-11-24-borsa/V2-packet.md, to be read whole, all 899 lines, before anything else) instead of its 100 KB inline, as in V1 — retyping it in ~20 dispatches costs far more output tokens and time than the cache saves, and the header is still one identical prefix — an agent that skims the file could miss a rule; the header names the constraints at the end and reviewers check against the same file.

- T2 · flow:executor · definition: sonnet · DONE · 5728e5d
  Status: DONE · Commits: 5728e5d Declare the order email and Turnstile env fields · Tests: grep count 3; prettier pass; astro check 0/0/0 (optional:true -B3 grep and build not run) · Servers: none · Concerns: none

- T1 · flow:executor · definition: sonnet · DONE · e9e94b1
  Status: DONE · Commits: e9e94b1 Add order facts and pure order functions · Tests: tsx order-check.ts OK exit 0 (all Verified asserts); ^import → 0; prettier pass; standalone tsc --noEmit clean (astro check not run, T2 parallel) · Servers: none · Concerns: causale and contact-block wording chosen by executor; empty-email message is a private constant beside ORDER_FIELD_MESSAGES.email; visitor copy omits notes as decided.

Ruling: T2 medium finding (skipped optional:true -B3 grep not listed as a concern) closed without a fix round — the runner ran the grep, it shows all three keys (lines 94, 100, 114); the finding is about the report, not the code — none.

- T2 review · flow:task-reviewer · opus · Spec pass · Quality pass · medium: report skipped the -B3 grep without a concern (ruled above); low: Done "build runs without keys" left to the gate; low: Turnstile comments don't say what unset does; docs env matrix (security.md, operations.md) left to the close
- T2: complete

- T1 review · flow:task-reviewer · opus/high · Spec pass · Quality pass · low: email line prints "()" when a book has no authors (order.ts:434); low: Causale with all titles can exceed SEPA 140 chars; low: redundant CONTROL_CHARS test on phone; low: no astro check before commit, DONE with concerns; low: visitor copy still carries visitor-chosen name/address text (WAF rule stays a prerequisite)
- T1: complete

- T3 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 95343ef
  Status: DONE_WITH_CONCERNS · Commits: 95343ef Add the order sending endpoint · Tests: greps pass; prettier pass; astro check 0/0/0; curl on dev 4351: GET 405, x 400 bad_request, {} 400 empty_bag, 31 lines 400, qty 21 400 bad_lines, 20000 notes 400 too_large, no token 400 turnstile, unknown id 409, valid 200 (CDA titles/prices, dropped unknown id, dev.log email + [ordine] line without personal data), cache-control private no-store; secret 2x… → 400 turnstile · Servers: astro dev 4351 twice, stopped; schema.ts unchanged · Concerns: CDA rejects non-ItemId ids, so only ^[A-Za-z0-9_-]{22}$ ids are queried, others dropped; dev log prints the visitor email (dev only); Resend path and prod 503 not run (T6).

- T4 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · b263c66
  Status: DONE_WITH_CONCERNS · Commits: b263c66 Add the order page script · Tests: innerHTML/forbidden-words/orderReady greps as expected; prettier pass; astro check 0/0/0 (after T3's server stopped); standalone tsc clean · Servers: none (user's own astro dev untouched) · Concerns: untested against markup (T5 pending), selectors per plan contract; success lines are plain <li> "<title> · <copies> · <amount>"; shipping row shows 0,00 € for free; non-OK response with ok:true body treated as generic failure.

- T4 review · flow:task-reviewer · definition: sonnet · Spec fail · Quality pass · medium: copySent lede email not in <b>; low: invalid with no known keys says "Controlla i campi segnati." with nothing marked; low: 0,00 € free shipping row (per plan); low: !response.ok && ok:true guard (harmless)
- T4 fix 1 · flow:executor (SendMessage) · definition: sonnet · DONE · 4cbfe24
  Status: DONE · Commits: 4cbfe24 Fix review findings on T4: bold the email in the success lede, fall back when invalid names no field · Tests: prettier pass; astro check 0/0/0 · Servers: none · Concerns: none
- T4 review fix 1 · flow:task-reviewer · definition: sonnet · Spec pass · Quality pass · no findings
- T4: complete

Ruling: T3 fix round also widens ITEM_ID to accept numeric DatoCMS ids (a cannot-verify item from the review, not a high/medium) — dropping a legacy book silently from every order is worse than one more regex branch — a numeric id the CDA rejects would give 502 catalogue_unavailable, which is still safe (no email).

- T3 review · flow:task-reviewer · opus/high · Spec pass · Quality pass · medium: email print under plain else (reachable only in dev today); low: ITEM_ID filter lives in the endpoint, narrower than BOOK_ID_PATTERN; low: no cheap length check before UTF-8 count; low: executor.md server rule vs plan's dev-server Verified; low: report format; cannot verify: numeric legacy ids dropped, tampered 22-char id may 502
- T3 fix 1 · flow:executor (SendMessage) · definition: sonnet · DONE · a92012c
  Status: DONE · Commits: a92012c Fix review findings on T3: dev-only email print, cheap size check, numeric item ids · Tests: prettier pass; astro check 0/0 (curl not re-run, left to T6) · Servers: none · Concerns: none
- T3 review fix 1 · flow:task-reviewer · opus/high · Spec pass · Quality pass · low: comment at index.ts:164-165 still says ItemId is 22 chars; cannot verify: CDA ItemId forms vs \d{1,20}
- T3: complete

- T5 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · b477934
  Status: DONE_WITH_CONCERNS · Commits: b477934 Add the /borsa order page · Tests: data-order-* and data-error-for loops empty; noindex 1; prerender/executeQuery none; primary 2; forbidden words none; prettier pass; astro check 0/0/0; schema.ts clean · Servers: none · Concerns: @apply not compiled yet (build at gate); Button variant="outline" maps to mist secondary in Button component; fieldsets carry error ids; mailto-box button href replaced by bagMailto; success li styled via .order-done__lines li; bank box side-by-side only 640-767 and ≥1280; no browser check (T6).

- T5 review · flow:task-reviewer · opus/high · Spec pass · Quality pass · medium: textFields array duplicated type/autocomplete ignored by markup; low: "CAP e città" has autocomplete=postal-code (city may be lost); low: sr-only text " , si apre…" stray space; low: double focus ring on shipping rows; low: .order-page space-y-8 with hidden last child (v3-space-y-8); low: Button outline maps to mist secondary (component gap); cannot verify: CSS compile (gate), 390px/44px (T6)
- T5 fix 1 · flow:executor (SendMessage) · definition: sonnet · DONE · 82ec4dc
  Status: DONE · Commits: 82ec4dc Fix review findings on T5: drop the unused textFields array, inline each field's facts · Tests: prettier pass; astro check 0/0/0; T5 Verified loops/greps pass; schema.ts unchanged · Servers: none · Concerns: none
- T5 review fix 1 · flow:task-reviewer · opus/high · Spec pass · Quality pass · low: report has no Files: line
- T5: complete

- Final review · flow:task-reviewer · opus/high · Spec pass · Quality pass · medium: Turnstile error-callback / throwing render left no email way out; low: not_configured drops focus to body; low: turnstile focus invisible and aria-invalid on a div; low: refused siteverify logs no reason; low: unreachable else in index.ts (kept as a guard); low: head lede contradicts mailto/empty states; low: partly configured prod loses typed data (closing report: set the public site key last); low: real secret + no public key in dev fails every order (closing report)
- Final review fix · flow:executor · definition: sonnet · DONE · 93194de
  Status: DONE · Commits: 93194de Fix final review findings on V2: email way out on widget errors, focus and lede states, siteverify reason in the log · Tests: prettier pass; astro check 0/0/0; orderReady and primary greps · Servers: none · Concerns: none
- Final review fix review · flow:task-reviewer · definition: sonnet · Spec pass · Quality pass · low: render() re-shows the lede on a bag change after not_configured; low: `lede` shadowed in showDone; cannot verify: focus paths in a browser
- T6 walk (runner) · astro dev :4361 with empty keys, headless Chromium (playwright-core in scratch), curl; production: build:cf with empty keys + wrangler dev --local :4362 (-c dist/server/wrangler.json --compatibility-date 2026-10-08: astro preview exits, the bundled workerd supports up to 2026-10-08) · all servers stopped, schema.ts clean, scratch removed
  Done 1 pass: recap 3 libri · 4 copie · 73,00 €, drawer copies 4 / 73,00 €; rapida → Spedizione 5,00 €, total 78,00 €
  Done 2 pass: email "giulia@" → message under the field, aria-invalid, aria-describedby order-email-error, focus on #order-email, no [ordine] line in dev log
  Done 3 and 9 pass: priceCents 100 tampered (recap 2,00 €) → success state, bag emptied, header badges hidden, success line 24,00 € + "Prezzo aggiornato: 25 anni dal G8:, ora 12,00 € a copia."; dev log emails carry "2 copie × 12,00 € = 24,00 €", total 73,00 €; visitor copy without notes
  Done 4 and 10 pass: GET 405; {} 400 empty_bag with cache-control: private, no-store; no token 400 turnstile; a made-up 22-char id with the test token → 502 catalogue_unavailable (CDA rejects the id; safe, no email)
  Done 5 pass: empty bag → [data-order-empty] with link /libri, [data-order-filled] hidden
  Done 6 partial: tab order reaches every field, radio group, notes, consent, privacy link, Turnstile, submit; success heading takes focus; error wiring by attributes. Screen reader not run
  Widths pass: 390 and 1280 no horizontal scroll; "Ordini come" 2×2 at 390, one row at 1280; nothing under 44px at 390 (inputs 40px at 1280 by DESIGN lg:h-10)
  Done 8 pass: production /borsa has no data-order-form, the mailto box shows with every bag line in its href, no lede; POST with probe-v2@example.invalid → 503 not_configured; log lines "[ordine] 503 not_configured", "[ordine] 405 method_not_allowed", probe-v2 count 0
  order-check.ts re-run on final order.ts: OK
pending: Done 6 — a screen reader (VoiceOver) reading label and error through aria-describedby; checked only through the DOM attributes and focus
Final review: done
Gate: green — npm run lint pass; npm run build pass (astro check 0 errors, build complete)

## Close draft
Narrative: V2 shipped /borsa and POST /api/ordine as planned: order facts and pure functions in order.ts, three optional env fields, an endpoint that fails closed (503 without keys outside dev), verifies Turnstile, refetches titles and prices from the CDA and mails through Resend or, in dev, the console; the page drives empty, filled, mailto, error and success states from one script. Execution showed that the CDA rejects the whole `id: { in }` query on an id that isn't a valid ItemId, so the endpoint pre-filters ids (22-char or numeric) and a forged id ends in a safe 502; the dev-only email print was moved under import.meta.env.DEV itself, not left behind the config check; the final review added the email way out when the Turnstile widget errors, focus for the not_configured and missing-check paths, and a reason on refused siteverify logs. Rulings: packet by reference as in V1; T2's report-only medium closed after the runner ran the grep; ITEM_ID widened to numeric ids. The production-mode check runs with wrangler dev --local on dist/server/wrangler.json with an older compatibility date, since astro preview exits. Pending: a screen-reader pass. For the closing report: set the public site key last (after RESEND_API_KEY and TURNSTILE_SECRET_KEY), the WAF rate-limit rule before the Resend key, and the env matrix in security.md and operations.md.
Lessons:
- A dev-only branch (console output of personal data) is gated on import.meta.env.DEV itself, never only on an earlier check that returns first in production.
- The CDA rejects a whole `filter: { id: { in } }` query when one id is not a valid ItemId: pre-filter ids by format and treat a CDA error as a safe failure.
- A production-mode check of the Cloudflare build runs with `npx wrangler dev --local -c dist/server/wrangler.json`, adding `--compatibility-date` when the bundled workerd is older; `astro preview` and `.wrangler/deploy/config.json` do not start it.
- An executor that skips a step of its Verified line lists it under Concerns, not only under Tests.
Decision candidate: none
