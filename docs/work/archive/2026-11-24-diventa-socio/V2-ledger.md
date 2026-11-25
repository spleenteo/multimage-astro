# Ledger — V2
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (both unset)
Ruling: every dispatch gets the packet as a file to read whole first (absolute path), not pasted inline, as in V1 — the packet is about 58 KB, and pasting it into some 20 dispatches would cost far more than the subagents re-reading one file — cost if wrong: a subagent that skims the packet; each instruction says to read it all first
Ruling: build tasks run one at a time (order T1 with T4, then T3, T5, T2, T6, T8, T7, T9), not T1/T3/T5 side by side — each runs `npm run build` in the same checkout and would see the others half-written files and race on dist/ — cost if wrong: a slower slice
- T4 · flow:executor · definition: sonnet · DONE · d99785b
  Commits: d99785b Add D1 migration 0004: membership_requests table
  Tests: wrangler d1 migrations apply --local applied 0004; pragma_table_info count 23; prettier skipped (no SQL parser)
  Servers: none
  Concerns: none
  Interfaces: id, code, created_at, email, first_name, last_name, birth_date, birth_place, address1, address2, city, region, postcode, country, fee_id, fee_label, fee_cents, payment_method, areas_json, areas_other, consent_at, notify_status (NOT NULL default 'pending'), notify_error
- T1 · flow:executor · definition: sonnet · DONE · cee8f8b
  Commits: cee8f8b Extract payment facts and request codes from order.ts (refactor, two files only)
  Tests: node --import tsx /tmp/v2-t1.ts all true; prettier --write no changes; npm run build ok
  Servers: none
  Concerns: none (toCents stays in order.ts; ORDER_* = PAYMENT_* aliases, formatIban re-exported)
  Interfaces: payment.ts PAYMENT_* strings, formatIban(s), paypalUrl(causale, cents); order.ts requestCode(prefix, at, random), orderCode, orderPaypalUrl(code, totalCents), isCodeClash(err, table='orders'), saveWithCodeRetry(insert, first, next, table='orders') → {saved, code, retried}, toCents(price)
- T4 review · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · No findings
- T4: complete
- T3 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 43f418c
  Commits: 43f418c Move the bank box styles from borsa to the shared form.css
  Tests: order-bank count baseline (cee8f8b) 16 = form.css 16, _borsa.css 0; prettier unchanged; npm run build ok
  Servers: none
  Concerns: shared rule `[data-order-done-causale], .order-done__lede b` split (nowrap now two rules); cascade checked, only `.order-next a` candidate, outranked; no browser look at /borsa
- T1 review · flow:task-reviewer · opus (top, critical) · Spec pass, Quality pass
  Low (logged, not fixed): ORDER_CODE_ALPHABET keeps its ORDER_ name though requestCode now serves SO- codes too
- T1: complete
- T5 · flow:executor · definition: sonnet · DONE · 980be78
  Commits: 980be78 Add the MEMBERSHIP_MAIL send_email binding and getter
  Tests: wrangler d1 migrations list --local exit 0, no config warning; prettier unchanged; npm run build ok, astro check 0 errors
  Servers: none
  Concerns: none (mirrors ORDER_MAIL allowed_sender_addresses; no worker-configuration.d.ts)
  Interfaces: getMembershipMail(): OrderMail | null from ~/lib/cloudflare-bindings
- T3 review · flow:task-reviewer · opus (top, critical) · Spec pass, Quality pass · No findings (moved text identical bar the L4 split; import order form.css before _borsa.css on /borsa and /designsystem; cascade unchanged; /borsa browser look left to the conductor)
- T3: complete
- T5 review · flow:task-reviewer · opus (top, critical) · Spec pass, Quality pass
  Low (logged, not fixed): cloudflare-bindings.ts header lines 1-2 over 100 columns; "both getters return null" stale (four getters now)
  Cannot verify: whether a send_email binding to the unverified info@ destination blocks a deploy or the sends — V3 prerequisite: owner verifies info@ before any deploy of this branch
- T5: complete
- T2 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 1c6b291 aafc9cf
  Commits: 1c6b291 Move the Turnstile check into src/lib/turnstile.ts; aafc9cf Accept a test Turnstile secret on localhost hostnames
  Tests: grep checkSiteverify order.ts 0; node --import tsx /tmp/v2-t2.mts true x5 (incl. M1 non-test secret case); build + prettier before both commits
  Servers: none
  Concerns: /tmp/v2-t2.ts needs .mts (top-level await); order.ts section header now "// --- Mailto ---"
  Interfaces: DEV_TURNSTILE_SECRET; turnstileSecret(configured, isDev); checkSiteverify(result, {hostname, action, lenient}); verifyTurnstile({secret, token, request, action, isDev}) → TurnstileResult
- T2 review · flow:task-reviewer · opus (top, critical) · Spec pass, Quality pass
  Commit 1 identical to pre-change /api/ordine (answers, codes, logs, order, hostname source); commit 2 follows M1 exactly; allowedDomains unset in astro.config.mjs; [::1] fails closed, left as is
  Low (logged, not fixed): order.ts:699 "Mailto" header shorter than the others; docs/list-helpers.md:83 still lists checkSiteverify under order.ts, no turnstile.ts entry (docs step); report over 20 lines
- T2: complete
- T6 · flow:executor · definition: sonnet · DONE · 85e9d76
  Commits: 85e9d76 Add the membership request helpers and response types
  Tests: node --import tsx /tmp/v2-t6.mts all true (incl. M3 areas_other null, L2 150-char note keeps code, fallback, non-string area); prettier --write; npm run build ok
  Servers: none
  Concerns: none (fee_label stores raw CMS label, email shows membershipFeeLabel; areas de-duplicated; extra exports MEMBERSHIP_CODE_PREFIX, MEMBERSHIP_CAUSALE_FALLBACK)
  Interfaces: membership.ts PaymentMethod, MembershipErrorCode, MembershipResponse; membership-request.ts MEMBERSHIP_BODY_MAX_BYTES, MEMBERSHIP_TABLE, MEMBERSHIP_COLUMNS (21), MembershipRequest, MembershipFee {id,label,amount}, MembershipArea, MembershipChoices, parseMembershipRequest(body), membershipCode(at, random), membershipCausale(note, code, first, last), resolveMembershipChoices(request, {fees, areas}), membershipRow({request, choices, code, at}), membershipEmail({request, choices, code, causale, at})
- T6 review · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass
  Low (logged, not fixed): non-array `areas` silently becomes [] instead of invalid (harmless, nothing stored); fee amount 0 accepted (amount < 0 check; CMS-content risk); areasOther guard repeated in row and email; MEMBERSHIP_CODE_PREFIX / MEMBERSHIP_CAUSALE_FALLBACK exported unnecessarily
- T6: complete
- T8 · flow:executor · definition: sonnet · DONE · bf882ef
  Commits: bf882ef Add the confirmation markup to the membership page
  Tests: npm run build ok (astro check + build); prettier --write on both before commit
  Servers: none
  Concerns: none (successText/paymentNote split as plain text; two [data-socio-causale] dd, one per method; causale comes from the server answer, per plan)
  Interfaces: data-socio-done (section hidden), -done-heading (h2 tabindex -1), -done-lede, -done-fee, -methods, -method="bonifico"|"paypal", -copy-iban (button hidden), -copy-label, -paypal-link (a hidden), -paypal-label, -causale (x2 dd), -announce (sr-only aria-live)
- T7 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · e221af0
  Commits: e221af0 Add POST /api/socio for membership requests
  Tests: prettier --write unchanged; npm run build passed (tail only read); grep console: only status/codes/counts, plus the L1-exempt dev email print
  Servers: none
  Concerns: fee.label in the answer = membershipFeeLabel ("10 € — Studente under 25"); CMS blocks with null id/label/amount filtered out; null singleton → 502 cms_unavailable; dev without bindings → 200 notified:true, not saved (as /api/ordine)
  Interfaces: 200 {ok, code SO-YYMMDD-XXXX, notified, fee {label, amountCents}, payment, causale}; errors {ok:false, error, fields?}: 405 method_not_allowed, 503 not_configured, 400 too_large, 400 bad_request, 400 invalid (+fields), 400 turnstile, 502 turnstile_unavailable, 502 cms_unavailable, 502 save_failed; logs [socio] <status> <code>, [socio] 200 ok areas= saved= notified=
- T8 review r1 · flow:task-reviewer · definition: sonnet · Spec pass, Quality fail
  Medium: confirmation used .order-done, .order-done__lede, .order-page__title from _borsa.css, which /diventa-socio does not load
  Low (logged, not fixed): [data-socio-causale] has no nowrap (a causale up to 120 chars cannot be nowrap whole); aria-labelledby on a plain <p> (copies /borsa); two [data-socio-causale], T9 uses querySelectorAll
- T8 fix r1 · flow:executor (same, SendMessage) · definition: sonnet · DONE · 97f1eb6
  Commits: 97f1eb6 Fix review findings on T8: style the confirmation with the page's own classes
  Tests: prettier unchanged; npm run build ok
  Servers: none
  Concerns: none (Tailwind utilities mirror the three _borsa.css rules, focus:outline-none mirrors :focus)
- T8 review r2 · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · No findings
- T8: complete
- T9 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 250a77c be190df
  Commits: 250a77c Send the membership request and show the confirmation; be190df Drop the innerHTML word from the membership script header
  Tests: prettier --check ok; npm run build ok before first commit (second is comment-only); grep innerHTML 0, notActive 0
  Servers: none
  Concerns: second commit only to satisfy the grep; local Intl euro formatter duplicates formatCents (order.ts is off-limits to the client); M2 done via resetWidget on every failure; Italian texts chosen by the executor (lede, fee line, failure, turnstile) for owner review; no browser check
- T7 review · flow:task-reviewer · opus (top, critical) · Spec pass, Quality pass
  Checked: Turnstile before CDA/D1; published token, Content Link off; logs/error bodies codes only; replyTo validated (no CR/LF); bound SQL; dev branch build-time only; private, no-store on all answers; GraphQL names match the page query
  Low (logged, not fixed): fee/area selections duplicated between api/socio and diventa-socio _graphql.ts (fragments follow-up); filter + `as` casts instead of a type guard; report over 20 lines; membership.ts EMAIL_PATTERN accepts < > " , (could make send() throw → saved, notified:false)
- T7: complete
- T9 review · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass
  Low (logged, not fixed): `satisfies PaymentMethod` noise + unused type import; generic failure text repeats info@ next to the mailto box; second formatCents copy (move to payment.ts later); a comment-only second commit for the grep; header comment says setAttribute (code sets .href)
- T9: complete
Ruling: the final review's medium (the local wrangler dev run sees hostname www.multimage.org from the first route, so the localhost test-secret leniency never applies) gets no code round — the fix is a run flag, not code: the conductor runs `npx wrangler dev --port 8787 --local-upstream localhost:8787 --var TURNSTILE_SECRET_KEY:1x0000000000000000000000000000000AA`, and the pending item says so — cost if wrong: one failed local submit (400 turnstile reason=hostname), then read the [socio] log line
- Final review · flow:task-reviewer · opus (top) · Spec pass, Quality pass
  Seams checked: client body = parseMembershipRequest keys and types; 200 answer typed as MembershipResponse and read by T9; T8 hooks = T9 selectors; D1 row order = migration; causale server-only; /borsa and /api/ordine unchanged bar the planned localhost leniency; security.md § Order endpoint defences all mirrored
  Medium (ruled, no code round): wrangler dev without --local-upstream rewrites request.url to the route host www.multimage.org (wrangler 4.147 getInferredHost), so the plan's local Cloudflare command would fail with 400 turnstile reason=hostname
  Low (carried to V3): /api/socio has no WAF rate limit (widen the one Free-plan rule to /api/ordine or /api/socio); docs to update: list-helpers.md (payment.ts, turnstile.ts, membership-request.ts; checkSiteverify gone from order.ts), security.md (Membership endpoint section, TURNSTILE_SECRET_KEY row, localhost leniency), operations.md (MEMBERSHIP_MAIL, [socio] logs, 0004), d1/README.md (membership_requests contract, notify query), project-structure.md (/api/socio)
pending: `npm run dev`: a complete submit prints the email to the console and shows the confirmation with the chosen method first, the right amount on the PayPal button and the copyable IBAN (browser)
pending: `npm run dev`: a forged fee id and a missing consent are rejected with field errors (curl POST /api/socio, `fee` forgedfee0000000000000 → 400 fields ["fee"]; consent:false → fields ["consent"])
pending: Local Cloudflare run: `npx wrangler d1 migrations apply multimage-orders --local` (0004 already applied by T4), `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build:cf`, `npx wrangler dev --port 8787 --local-upstream localhost:8787 --var TURNSTILE_SECRET_KEY:1x0000000000000000000000000000000AA`, one submit, the row confirmed by `npx wrangler d1 execute multimage-orders --local --command "SELECT code, fee_label, fee_cents, payment_method, notify_status FROM membership_requests ORDER BY id DESC LIMIT 1"`
pending: `/borsa` still sends an order the same way (dev run, one order prints the [ordine] (dev) email and shows its success screen); /borsa and /diventa-socio confirmation look right in a browser after the CSS move
Final review: done
Gate: green — npm run lint (all files Prettier-formatted), npm run build (astro check 218 files: 0 errors, 0 warnings, 0 hints; build Complete)

## Close draft

Narrative: `/diventa-socio` now sends. `POST /api/socio` mirrors `/api/ordine` step by step: 405, fail-closed 503, an 8 KB cap, JSON and field checks with consent checked on the server, Turnstile action `socio`, one published CMS read that re-resolves the fee and the areas by id (the client never sends an amount, and a draft-only tier is rejected), then a D1 insert into the new `membership_requests` table (migration 0004, code `SO-YYMMDD-XXXX` with a clash retry on its own table) and one plain-text email to info@ through the new `MEMBERSHIP_MAIL` binding, reply-to the applicant. Logs carry codes and counts only. To share one copy, the payment facts moved to an import-free `src/lib/payment.ts` and the Turnstile check to `src/lib/turnstile.ts`; `/borsa` and `/api/ordine` were checked unchanged, apart from the planned test-secret leniency on localhost hostnames. The bank box styles moved to `form.css`. The confirmation shows the chosen method first, with the causale and amount taken from the server's answer. Rulings, all read from the ledger: subagents got the packet by path, as in V1; build tasks ran one at a time to keep `npm run build` runs apart; the final review found that `wrangler dev` rewrites the request host to the route's `www.multimage.org`, so the local Cloudflare check needs `--local-upstream localhost:8787` (a run flag, no code change). One review round: T8 first used `/borsa`-only classes the page doesn't load, and those became Tailwind utilities. Carried to V3: a WAF rule covering `/api/socio`, the docs (helpers list, security, operations, d1 README, project structure), and the owner verifying info@ before any deploy. Owner follow-ups: the Italian confirmation and error texts written by the executor. The dev, wrangler and browser Done checks are pending with the conductor.
Lessons:
- Run every grep and count in the task's Verified line before the first commit, so a check never needs a second, comment-only commit.
- When a page reuses another page's markup, check that each class is defined in a stylesheet the page itself loads (src/styles/form.css), not in the source page's private CSS.
- Under `wrangler dev`, `request.url` carries the first route's host (www.multimage.org) unless `--local-upstream localhost:8787` is passed: plan local Worker checks that depend on the hostname with that flag.
Decision candidate: Turnstile test secrets are accepted on `localhost`/`127.0.0.1` request hostnames outside dev too, on `/api/ordine` and `/api/socio`, hostname taken only from `new URL(request.url)` — chosen over keeping the hostname check strict everywhere (which makes a local `wrangler dev` submit impossible); revisit if Astro `security.allowedDomains` is ever set
