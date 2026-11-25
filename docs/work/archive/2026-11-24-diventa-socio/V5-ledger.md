# Ledger — V5
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (both unset)

- T1 · flow:executor · definition: sonnet · DONE · 5bf4bdf
  Report: DONE; commit 5bf4bdf "Simplify membership_requests to one send: migration 0006". Local D1 only: first apply ran before the test row (shell slip), so the local table was rebuilt from 0004+0005, 0006 row removed from d1_migrations, test row SO-000000-TEST inserted, 0006 re-applied. 18 columns in order; row id 1, areas `Traduzioni, Altro`, areas_other `prova`; index_list has membership_requests_created_at + sqlite_autoindex_membership_requests_1; test row deleted; orders count 0 before/after. Servers: none. Concerns: local membership_requests empty before and after; no remote, no .env read.
- T1 review · flow:task-reviewer · opus (top tier, critical) · spec pass, quality pass
  Low (logged, not fixed): group_concat order over json_each not formally guaranteed (local test and Conductor 3 check it; `ORDER BY j.key` needs SQLite 3.44+); the rebuild resets AUTOINCREMENT to the max copied id (harmless, rows addressed by code). Cannot verify remote apply (Conductor 1–3, M1).
- T1: complete

- T2 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 509bd32
  Report: DONE_WITH_CONCERNS; commit 509bd32 "Remove the collaboration step and its token from the membership sign-up". Grep empty, prettier write+check, `npm run build` passed. Servers: none. Concerns: also removed now-unused imports (validateCollaborationFields/CollaborationFields in membership-request.ts, resolveMembershipAreas in the route), rewrote headers; client session is `{ code }`. Left for T3: `areas` in index.astro and imports AREA_OTHER/MEMBERSHIP_LABELS/MEMBERSHIP_AREAS_OTHER_MAX possibly unused; resolveMembershipAreas, validateCollaborationFields, COLLABORATION_EMPTY_MESSAGE without callers; membershipRow/MEMBERSHIP_COLUMNS at 21 (T3 reshapes to 0006); membershipRow doc comment still says "the collaboration step fills the areas later".
- T2 review · flow:task-reviewer · opus (top tier, critical) · spec pass, quality pass (build not re-run, executor's green)
  Low (logged; passed on to T3/T4 as notes): client `session` written but never read (_membership-page.client.ts:76-77, :183); index.astro AREA_OTHER, MEMBERSHIP_AREAS_OTHER_MAX, `areas` unused until T4; stale comments in membershipRow doc and api/socio header ("the confirmation covers them").
- T2: complete

- T3 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 94cb9b9
  Report: DONE_WITH_CONCERNS; commit 94cb9b9 "Carry the collaboration areas in the sign-up: one save, one email". tsx checks: areas [] ok; ['altro'] no text → invalid areasOther; unknown id → fields ['areas']; membershipRow 17 values, `Traduzioni, Altro` at areas; email has the two area lines before consent; local D1 INSERT ok, row deleted; NOTIFY_SQL count 0; prettier write+check; build passes. Servers: none. Concerns: mail-failure log adds `notify_error=<E> code=SO-…` (M2); dev no-binding log unchanged; index.astro lacks the area inputs until T4 (readFields sends [] and ''); T2 lows fixed (session removed, comments rewritten); ERROR_KEYS/FIELD_NAMES untouched, for T4.
- T3 review · flow:task-reviewer · opus (top tier, critical) · spec pass, quality pass
  Low (logged, not fixed): api/socio/index.ts:16 header line ~125 chars; labels join written twice in membership-request.ts (:195, :231); T2 low fixes folded into the feature commit (asked by the dispatch); ERROR_KEYS/FIELD_NAMES lack areas/areasOther until T4 (passed to T4).
- T3: complete

- T4 · flow:executor · definition: sonnet · DONE · 25141a6
  Report: DONE; commit 25141a6 "Split the membership form into two steps and add the failure block". Verified grep 11, focusin 0, prettier write+check, build 0 errors; GET on 4391: step 1 visible, step 2 hidden; no browser run. Servers: none (GET on conductor's 4391). Concerns: Avanti submit first in tree, onSubmit branches by step, send button picked via `[data-socio-send] button[type=submit]` (Safari Enter = conductor check); goStep/showDone/showSendFailure are closures in initMembershipPage; areas render only when CMS has them, T2 leftovers now used; MSG.generic/turnstileFailed removed (failures go to .socio-fail, widget load error stays in band); server invalid with step-1 key returns to step 1; hint spacing `-mt-3` to check in browser; ~16 lines of field markup duplicated (no row component); M3 M4 L1 L2 L3 L5 L6 applied; DESIGN.md left to T6.
- T4 review · flow:task-reviewer · definition: sonnet · spec pass, quality pass with one medium
  Medium: step-1 personal rows and address rows duplicated the same row markup (~16 lines) in index.astro. Low (logged): header comment line >100 cols; `-mt-3` magic number in `.socio-step__count + .order-hint-line`; summary label "Come vuoi collaborare" differs from the areas legend, fee legend "Tipo di quota" (as planned); Riprova focuses submit with a cleared Turnstile token (plan's decision, kept); section landmarks harmless; Turnstile load error stays in band on step 1 (L2, by design). Cannot verify: Safari Enter, visual spacing.
- T4 fix round 1 · flow:executor (same, SendMessage) · definition: sonnet · DONE · 4f16e5d
  Report: DONE; commit 4f16e5d "Fix review findings on T4: render the field rows from one component". New src/pages/diventa-socio/_FieldRows.astro (not a route), index.astro uses it for both blocks; header comment re-wrapped; prettier clean; build 0 errors; GET on 4391 shows each id once, socio-hint-data twice. Servers: none.
- T4 fix review · flow:task-reviewer · definition: sonnet · spec pass, quality pass
  Medium resolved; same attributes; no scoped styles lost; `/diventa-socio/_FieldRows` 404. Low (logged): short orphan lines in the re-wrapped header comment.
- T4: complete

- T5 · flow:executor · definition: sonnet · DONE · 498123e
  Report: DONE; commit 498123e "Add the localhost preview of the confirmation and failure states". searchParams one line (224) inside previewAllowed; fetch( count 1; prettier clean; build passes; GET 4391: conferma has data-socio-preview + answer JSON (SO-000000-PROV, notified true), errore has data-socio-preview="errore", plain URL neither. Servers: none (GET on 4391). Concerns: none; empty fees → no answer attribute; errore = goStep(2,false) + showSendFailure('generic'); L4 probes are conductor's.
- T5 review · flow:task-reviewer · definition: sonnet · spec pass, quality pass
  Gate checked: DEV false in build, hostname from Cloudflare Host/SNI, worker.ts does not rewrite the URL, output server, JSON attribute escaped, no fetch added. Low (logged): local wrangler dev/preview on localhost also enables the preview (harmless). Cannot verify spoofed Host in production: L4 probes (conductor).
- T5: complete

- T6 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · cb1f33e
  Report: DONE_WITH_CONCERNS; commit cb1f33e "Document the two-step membership form, one save and one email". Verified grep clean (notify_status only in orders sections and the 0006 dropped-columns sentence); 0006 count 2; docs:inventory exit 0 (no list-components entry needed for _FieldRows.astro); prettier write+check. Servers: none. M2: Workers Free logs retention 3 days confirmed from Cloudflare docs, cadence every 2 days, `cf observability telemetry query --body @file` shape. L6 consent sentence added; read-one-row query replaces the unsent-notices query. Concerns: the telemetry body key names were not run against production (doc says check with `cf schema` first); print rule unchanged and documented; orders notify_status docs left alone.
- T6 review · flow:task-reviewer · definition: sonnet · spec pass, quality pass
  Docs match committed code (log lines, 0006 columns, DESIGN classes, print rule); no stale collaboration/token mentions; no 0006 live date. Low (logged): DESIGN.md says preview "on localhost only" while dev on any host also enables it; telemetry body keys not run (doc points to `cf schema`).
- T6: complete

- Final review · flow:task-reviewer · opus (top tier) · spec pass, quality pass, no high/medium
  Cross-task contract, 0006 ↔ MEMBERSHIP_COLUMNS ↔ docs, preview gate (worker.ts uses real request.url, no allowedDomains), [hidden] beats .order-send flex, dead code: all clean. Low: (1) Enter in "Altro" sends with the failure block still shown; (2) next() clearAllErrors drops server step-2 errors; (3) resetWidget runs while step 2 is about to hide on a step-1 invalid (against L1); (4) DESIGN.md "Quota" fieldset vs legend "Tipo di quota".
- Final review fix · flow:executor (fresh) · definition: sonnet · DONE · 846a904
  Report: DONE; commit 846a904 "Fix review findings on V5 final review: reset failure state on send, keep step-2 errors, defer widget reset, fix legend name". Shared hideSendFailure() used by onSubmit step 2 and retry(); next() clears STEP_ONE_KEYS only; showFailure = handleFailure + resetWidget, showInvalid goes to step 1 first so the reset is deferred (needsReset); DESIGN.md legend fixed. fetch( 1, focusin 0, prettier clean, build complete. Servers: none. Concerns: none.
- Final review fix review · flow:task-reviewer · definition: sonnet · spec pass, quality pass
  No regressions (onSubmit still clears all before revalidating; preview errore path unchanged). Low (logged): showFailure comment describes order not purpose; resetWidget now runs after the failure block takes focus (cannot verify Turnstile reset never steals focus without a browser).
Gate fix round: none needed. Conductor GETs on dev 4391: plain page 200 with "Passo 1 di 2" and no preview attribute; ?anteprima=conferma and ?anteprima=errore carry their data-socio-preview.
pending: on dev in a browser: both steps, Avanti/Indietro keep values, step-1 errors block Avanti, Enter on step 1 = Avanti (and Safari), DevTools shows one POST to /api/socio at the end, the dev email lists the areas, the ?anteprima views render, Riprova restores the send area, step-1 hint spacing (-mt-3)
pending: ?anteprima=conferma|errore ignored in production (L4 probes, after deploy)
pending: remote D1 0006 applied with the existing row SO-261125-8UHV preserved (Conductor 1–3, M1: build:cf first, Time Travel bookmark, migrate then deploy at once)
pending: deployed (Conductor 4)
pending: production probes (Conductor 5)
pending: a real request by the owner gives one row and one email with the areas, then the test row deleted (Conductor 6–7)
pending: T7 — production facts in d1/README.md and current-state.md
Final review: done
Gate: green — npm run lint (prettier check) passes; npm run build 0 errors, 0 warnings

## Close draft

Narrative: V5 turned the two-send membership flow into one: migration 0006 rebuilds membership_requests to 18 columns (id kept as the rowid alias and copied, areas_json folded into a plain `areas` labels text via json_each/group_concat, notify and collaboration columns dropped), the collaboration step and its per-request token left code and docs, and /api/socio now takes the areas with the sign-up, resolves them by id from the CMS, saves one row and sends one email; a mail failure is logged with the request code (M2) instead of a notify UPDATE, and operations.md sets a 2-day check against the 3-day Workers Free log retention. The form is two client-side steps (Avanti as the first submit, onSubmit branching on step, Turnstile loaded only on step 2 with deferred resets), send failures show a .socio-fail block in the form column with Riprova, and ?anteprima=conferma|errore previews the end states on localhost or in dev only. One T4 review round removed duplicated field-row markup by adding the page partial _FieldRows.astro; the final review found four low flow issues (send behind a visible failure block, server step-2 errors cleared by Avanti, a widget reset inside a hidden step, a legend name in DESIGN.md), fixed in one commit. Run scope stopped before the Conductor sequence: remote 0006, deploy, probes, the owner's real request and T7 are pending.
Lessons:
- In a multi-step form with one `<form>`, the browser's default button is the first submit in tree order even when its step is hidden: route every submit through one handler that branches on the current step and resets transient UI (failure block, send area) before sending.
- When an error path changes the visible step, switch the step before any side effect that depends on visibility (widget reset, focus), so deferred-on-hidden rules apply.
- A "Next" step validator must clear only its own step's errors, or it silently drops server-supplied errors for the later step.
- When a page's field markup repeats across groups, extract a page-private `_Partial.astro` under the route folder (leading underscore keeps it out of routing) instead of copying the row.
Decision candidate: none
