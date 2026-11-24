# Ledger — V4
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (empty, neither set)

Ruling: packet passed by reference (executors and reviewers told to read /Users/spleenteo/Sites/multimage/multimage-astro/docs/work/2026-11-24-borsa/V4-packet.md whole) — it is ~800 lines/39k tokens, same ruling as V1–V3 and the user asked for it at the first stop — an agent that skims it misses project constraints (lesson already in lessons.md)

- T2 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 29fba14 Add the Cloudflare bindings wrapper and its Vercel stub
  Tests: grep -B3 -A3 stub (alias inside `isCloudflare ? {} : {...}`); cloudflare:workers imports only worker.ts + cloudflare-bindings.ts; prettier 4 files pass; astro check grep cloudflare-(bindings|workers) empty. Servers: none.
  Concerns: -B3/-A3 window doesn't reach `isCloudflare` (7 lines up; visible in diff); builds left to T6/gate; first commit attempt failed on quoting before committing, retry one commit, schema.ts untouched.

- T1 · flow:executor · definition: sonnet · DONE · 3d7b9d2 Add the D1 orders table, its contract and the ORDERS and ORDER_MAIL bindings
  Tests: local migrations apply into $TMPDIR (ok); pragma_table_info 20 columns; INSERT shipping_kind 'x' fails on CHECK; ORDERS/ORDER_MAIL grep 1 each; prettier pass; src/worker.ts untouched. Servers: none.
  Concerns: database_id is the all-zero placeholder (real id before merge, conductor + user).

- T3 · flow:executor · definition: sonnet · DONE · a004829 Add order code, D1 row and shop-only email to order facts
  Tests: tsx order-check.ts exits 0 (code MM-261124-23Z2, 50 codes match, 18 columns, NULL phone/notes, priceCents 1600, created_at=consent_at, pending, subject/causale/notes); 0 imports; no resend/visitor/copySent; prettier pass; astro check 5 expected errors in ordine/index.ts and _order-page.client.ts. Servers: none.
  Concerns: wrote $TMPDIR order-check.ts itself (not committed); harness reported order.ts changed on disk mid-task, checks re-run and pass; send_failed kept in OrderErrorCode.

- T1 review · flow:task-reviewer · opus (top tier, critical) · spec pass, quality pass
  Low (logged, not fixed): d1/README.md:43 "(documented in V5)" means nothing to staff-app devs; d1/README.md:51 no note that --local writes to .wrangler/state; report said DONE with an actionable concern. Checked wrangler 4.147.0 schema accepts send_email allowed_sender_addresses and migrations_dir.
- T1: complete

- T3 review · flow:task-reviewer · opus (top tier, critical) · spec pass, quality pass
  Reviewer re-ran a tsx check (MM-261124-23Z2, 18 values, NULLs, pending, 1600). Low (logged): order.ts:239 'send_failed' kept in OrderErrorCode though no path returns it after T4; order.ts:417 orderCode doesn't check random has 4 bytes; report DONE with concerns and over 20 lines.
- T3: complete

- T2 review · flow:task-reviewer · opus (top tier, critical) · spec pass, quality pass
  worker.ts is excluded in tsconfig, so the partial .d.ts changes nothing; the alias spread adds no resolve key on Cloudflare. Low (logged): -B3 window misses isCloudflare (T6 uses -B7); .d.ts comment doesn't say why only env is declared; getters cast instead of typeof-object guard. Cannot verify: builds deferred to T6/gate.
- T2: complete

Ruling: T4 may drop the unused send_failed from OrderErrorCode in src/lib/order.ts (one line outside its Files) — the T3 review flagged it and the decided outcomes never return it — if the client switch still names it, T5 removes that case or astro check catches it

- T4 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · b05fcf9 Save orders to D1 and notify through send_email, drop Resend
  Tests: greps (no resend, no direct cloudflare:workers, wrapper only in endpoint, DEV-gated print, TURNSTILE_SECRET_KEY kept, no send_failed); prettier 3 files; astro check 2 expected errors in _order-page.client.ts; plain dev :4350 GET 405, {} 400 empty_bag, valid 200 MM-261124-JCE6 notified:false (1400×2), dev.log Ordine MM- + 200 ok (dev), probe-v4 in logs 0. Not run: D1/send_email paths (T6). Servers: npm run dev :4350 PID 35082, stopped, schema.ts unchanged.
  Concerns: dev with exactly one binding takes the real path (check in T6). Also edited src/lib/order.ts (send_failed removed, per ruling).

- T5 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · a44b708 Show the order code on the confirmation and handle save_failed
  Tests: no copySent; res.code 1 line (textContent); 'save_failed' 1 line; prettier pass; astro check 0 errors/0 warnings (197 files). Servers: none.
  Concerns: innerHTML grep matches only the line-2 header comment "never innerHTML"; no send_failed case existed.

- T5 review · flow:task-reviewer · definition: sonnet · spec pass, quality pass
  Low (logged): the plan's innerHTML grep can't be empty while line 2's comment says "never innerHTML" (grep `\.innerHTML` instead); no stale copy-to-visitor remnants.
- T5: complete

Ruling: T4 executor starting plain npm run dev (:4350) stands — the plan's Verified line required it, free port, stopped by PID, schema.ts unchanged — a plan that delegates dev servers to executors risks a leftover server, checked at the close with lsof

- T4 review · flow:task-reviewer · opus (top tier, critical) · spec pass, quality pass
  Fail-closed at line 108 before body read; DEV print in its own block; outcome matrix as decided; SQL via bind; logs codes only; header injection blocked by control-char validation. Low (logged): index.ts:243 `db!` non-null assertion; :246 nested ternary for status; :240 both-fail log lacks notify_error code; :21 header comment reads as if Vercel build prints; report over 20 lines; ORDER_FROM now unused (order.ts:134). Cannot verify: send_email error shape (.code E_…), D1/send_email paths (T6).
- T4: complete

- T6 · slice runner (conductor's task, run in the runner) · Done walk
  Done 1 pass: local migrations applied to .wrangler/state; DEPLOY_TARGET=cloudflare astro dev :4361 (PID 36669, stopped) POST valid → 200 MM-261124-FZY3 notified:true; D1 one row, code matches, copies 2, subtotal/total 2800, p=1400 (book page 14,00 €), notify_status sent, notify_error null, phone/notes NULL; cf-dev.log "send_email binding called" From "Multimage" <sito@ordini.multimage.org> To ordini@, Subject "Ordine MM-261124-FZY3 · …"; save_error 0; probe-v4 in [ordine] lines 0. Dev read .env/.env.local (wrangler notice, not opened); Turnstile passed with the dummy token.
  Done 2 (dev) pass: plain npm run dev :4362 (stopped) → 200 MM-261124-PBTE notified:false, console print + [ordine] 200 ok (dev); probe 0.
  Done 2 (production) pass: build:cf with empty Turnstile vars; wrangler-nobind.json (original held both bindings); wrangler dev --local --compatibility-date 2026-10-08 (workerd older, lesson) :4363 POST {} → 503 not_configured; full config :4364 → 400 empty_bag. case 'not_configured' -A6 shows the mailto box. Note: on the 503 path the runtime logs "Uncaught TypeError: Can't read from request stream after response has been sent" (response still correct; body never read).
  Done 5 pass: cloudflare:workers absent from dist/client and .vercel/output. Done 3 pass: grep -ri resend src astro.config.mjs empty. Done 6: placeholder id count 1 → pending for the close (real id before merge). Alias check: grep -B7 shows `...(isCloudflare` at line 126.
  Gate: npm run lint green; npm run build green (astro check 0 errors 0 warnings, 197 files).

- Final review · flow:task-reviewer · opus (top tier) · spec pass, quality pass
  Medium: a saved but unnotified order (200 notified:false) told the visitor "L'abbiamo girato a Olivier" while nobody reads D1 yet (_order-page.client.ts:319-321) → fixed below; V5 should also add an ops check for rows with notify_status <> 'sent' until the staff app ships (setup-borsa.md / operations.md).
  Low (logged): T3/T4 commits didn't type-check (the plan accepted it); a UNIQUE code clash gives the visitor's screen, email and causale another order's code (no retry, odds ~1e-6/pair/day); workerd "Can't read from request stream after response has been sent" on early returns comes from the gateway forwarding an unread body to Backend (src/worker.ts:57), not V4 — silence in Backend.fetch by cancelling an unread body, or record as known noise (V5); T4's dev server covered by the ruling. Cannot verify: not-saved+mailed and both-failed paths run only in code review; send_email error .code shape.
- Final review fix · flow:executor · definition: sonnet · DONE · 4f7a4e1 Fix final review findings on V4: say when the order notice did not go out
  Tests: res.notified 1 line; no .innerHTML; prettier pass; astro check 0 errors. Servers: none. notified:false path not run in a browser.
- Final review fix review · flow:task-reviewer · definition: sonnet · spec pass, quality pass · low: subject wording differs from `Fix review findings on T<n>` (task text named it).
- Gate re-run after 4f7a4e1: npm run lint green; npm run build green (astro check 0/0/0, 197 files); cloudflare:workers absent from .vercel/output. Cleanup: .wrangler/state/v3/d1, .wrangler/tmp/email, dist/server/wrangler-nobind.json, $TMPDIR/borsa-V4 removed; no servers left on 4350-4364; schema.ts clean; tree holds only the ledger.
pending: Done 6 — no placeholder database_id at merge time (wrangler.jsonc still holds 00000000-0000-0000-0000-000000000000; the conductor creates multimage-orders --jurisdiction eu with the user's ok and commits the real id before the merge)
Final review: done
Gate: green (npm run lint, npm run build; npm run build:cf also compiles)

## Close draft
Narrative: V4 moved the order record to Cloudflare: d1/migrations/0001_orders.sql creates `orders` (20 columns, CHECKs, AUTOINCREMENT id, nullable personal fields for anonymising) with its staff-app contract in d1/README.md; wrangler.jsonc gained top-level ORDERS (placeholder id) and ORDER_MAIL (send_email to ordini@, sender allowlisted to sito@ordini.multimage.org); one wrapper, src/lib/cloudflare-bindings.ts, reads the bindings, aliased to an empty stub outside the Cloudflare build; order.ts gained the MM-YYMMDD-XXXX code, ORDER_COLUMNS/orderRow and a shop-only email; the endpoint inserts, sends, then updates notify_status, and Resend, the visitor copy, RESEND_API_KEY and copySent are gone. The walk ran Cloudflare dev with local D1 (one row at server prices, notify_status sent, the simulated send_email logged), plain dev (200 with a dev code), and a production-mode Worker with the bindings stripped (503 not_configured) and kept (400 empty_bag), with the older-workerd compatibility date again. The final review found that a saved but unnotified order (200 notified:false) still told the visitor it had reached Olivier while nobody reads D1 yet; the success lede now says the notice did not go out and offers a mailto with the code (4f7a4e1). It also traced the workerd "Can't read from request stream" log on early returns to the gateway forwarding an unread body (not V4), and noted that a code clash would hand the visitor another order's code (no retry, accepted odds). Rulings: packet by reference; T4 dropped the unused send_failed from order.ts; T4's executor-run dev server stands. For V5: an ops check on rows with notify_status <> 'sent' until the staff app ships; whether to cancel unread bodies in Backend.fetch. Pending: Done 6, the real D1 id before the merge.
Lessons:
- A task that changes a shared type updates its consumers in the same commit, or the plan orders tasks so every commit type-checks.
- When a response gains a degraded-success flag (e.g. notified:false), the same slice makes the client read it; never leave a success screen that claims more than the flag says.
- A plan's absence grep anchors on the code form (`\.innerHTML`, not `innerHTML`) so a comment naming the rule doesn't trip it, and a grep's context window is counted against the real file.
- Dev-server checks go to the runner/conductor, not the executor's Verified line (executor.md forbids executors starting servers).
- In the gateway/Backend Worker, an endpoint that answers before reading the body logs "Can't read from request stream after response has been sent" in workerd; the client's answer is correct, so judge it as gateway noise, not an endpoint failure.
Decision candidate: none
