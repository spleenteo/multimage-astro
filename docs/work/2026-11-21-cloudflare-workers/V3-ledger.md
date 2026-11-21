# Ledger — V3
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (both unset)

Ruling: T2 does not run; T1 step 5 stops at the no-CMA-token checks, the full seo-analysis check and T2's Backend patch go into the runbook (step after custom domains, on www) — binding conductor amendment and plan-review amendment 5, project rule against reading .env* — cost if wrong: the self-fetch gap is found on switch day instead of now, with the fix already written.
Ruling: T6 does not tick V3 in docs/shapes/2026-03-05-cache-tags.md, does not set its Status to done and does not change docs/shapes/README.md; it only adds the runbook link to the shape — user at first stop: the conductor ticks the shape and STATUS at close — cost if wrong: the conductor adds two small edits at close.
Ruling: the 89 KB packet goes to each executor and reviewer as its absolute path with an order to read it whole before anything else, not pasted inline — pasting it into eight-plus dispatches costs ~20k output tokens each and risks transcription drift; the agents have Read — cost if wrong: an agent skims the packet and misses a rule, caught by the review.

- T1 · slice-runner (conductor task, in runner) · n/a · DONE · no commits
  (1) enable: token=wrong → 401; right token + url=https://example.com → 422; right token + url=/libri/arte-trascendentale → 307 to /libri/arte-trascendentale, `__draftMode` cookie, Max-Age=2592000, Secure, Partitioned, SameSite=None.
  (2) with the jar: /libri/arte-trascendentale and /staff → 200, body has `Strumenti staff`, `cache-control: private, no-store`, CSP holds `frame-ancestors`, `cf-cache-status: DYNAMIC` (not HIT).
  (3) disable?url=/ → 307 to /; then / has no `Strumenti staff`, /staff → 404.
  (4) POST /api/preview-links?token=wrong → 401; signed POST (book, slug arte-trascendentale, status updated) → 200, two links: "Draft version" origin workers.dev path /api/draft-mode/enable url=/libri/arte-trascendentale; "Published version" path /api/draft-mode/disable same url. Following Draft with a fresh jar → 307 to /libri/arte-trascendentale, cookie set.
  (5) /api/seo-analysis?token=wrong → 401; signed with all params → 500 `DATOCMS_CMA_TOKEN is not configured on this environment.` (route and linkedom load). Per amendments no CMA token was put, no .env read; the full render/self-fetch check moves to the runbook on www.
  Secrets at the end (names only): CACHE_INVALIDATION_WEBHOOK_SECRET, DATOCMS_BASE_EDITING_URL, DATOCMS_DRAFT_CONTENT_CDA_TOKEN, DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN, DRAFT_MODE_COOKIE_NAME, PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN, PUBLIC_SITE_URL, SECRET_API_TOKEN, SIGNED_COOKIE_JWT_SECRET — no DATOCMS_CMA_TOKEN. No tail run (only needed for the seo-analysis render). Jars, headers, captures deleted (scratchpad/v3 removed). Servers: none.
- T1: complete

- T4 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 7c680bf
  Tests: grep "not implemented" on caching.md and cms-data-loading.md → none; prettier --check pass. Servers: none.
  Concerns: links to cloudflare-switch.md written before T3 landed; code 1134 and tag counts 27–515 taken from V2 ledger/slices.md (not in code); route table written from src/middleware.ts; /robots.txt is a public/ static asset, table says "none today"; 503 fires when cache.enabled false or cfContext.cache missing; `## Configuration` renamed `## Configuration (Vercel)`.

- T3 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · d8c0885
  Tests: 11 `### N.` steps, 11 Do/Check/Rollback each; no 40+ hex; build:cf/deploy:cf exist; prettier pass. Servers: none.
  Concerns: own wording in step 1 rollback (Free 10 ms CPU risk) and step 3 rollback (second inter-account move; 30-day lock applicability unconfirmed); step 9 plugin-origin listing (`datocms cma:call plugins list`) is an example, not run; step 4 CMA token source is a guess (DatoCMS API tokens page); apex redirect "disable" rollback marked short-term only.

- T5 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 6c84f6a
  Tests: cloudflare-switch.md in operations.md (2 lines); "single supported target" gone; "not implemented" gone from preview-mode.md; prettier pass. Servers: none.
  Concerns: "nine secrets" and SITE_SEARCH_BUILD_TRIGGER_ID text from task/T1, not checked on the Worker; checked BaseLayout:22, worker.ts cookie rule, wrangler observability, enable/disable read only `url=` (/api/preview takes redirect/url/path, § 3 says so); "passo 9" reference not re-checked against the runbook; `wrangler secret list` prints no values (own knowledge); `__prerender_bypass` "never on Worker" and BYPASS_TOKEN "Used in" list not freshly grepped; old SERVER row left.
- T4 review r1 · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · medium caching.md:13 (Vercel span claim includes the new CF section); low intro line 7 Vercel-only; low "site is always added" (not on empty purge); low trailer (withdrawn: session attribution is Opus 5.5); cannot-verify items (2 billed requests/view, version partition, 1134, 25-then-502) sourced from decision doc and V2 ledger.
- T4 fix r1 · flow:executor (same, SendMessage) · definition: sonnet · DONE · 747f11a
  Tests: prettier --check caching.md pass. Servers: none. Concerns: none. Fixed the medium and both lows.
- T4 review r2 · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · no findings left.
- T4: complete
- T5 review r1 · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · flagged facts verified in code (BYPASS_TOKEN usages, __prerender_bypass only if BYPASS_TOKEN, cookie rule worker.ts:37, url= handling, BaseLayout:22, wrangler observability, step 9 cross-ref, 9 secret names). Low (logged, not fixed): security.md "nine secrets of the matrix except BYPASS_TOKEN" inaccurate (matrix lacks DATOCMS_BASE_EDITING_URL, has SERVER/DATOCMS_API_TOKEN); preview-mode § 2 SITE_SEARCH_BUILD_TRIGGER_ID wording garbled; operations.md Preview & Drafts executeQuery bullet still Vercel-only ("cache ISR"); preview-mode.md 229-240 uneven wrap. Cannot verify: wrangler secret list prints no values; trigger id 37696.
- T5: complete
- T3 review r1 · flow:task-reviewer · definition: sonnet · Spec fail, Quality pass · medium 9(b) plugin listing read `attributes.url` (wrong field) and the raw listing would print SECRET_API_TOKEN; medium step 0 canonical check only works after the step 5 deploy; low step 2 rollback not "none" (DNSSEC); low chmod 600 redundant; low Visual tab not under Plugins. Cannot verify: 30-day lock on inter-account move, step 1 CPU numbers.
- T3 fix r1 · flow:executor (same, SendMessage) · definition: sonnet · DONE_WITH_CONCERNS · 1caeae6
  Tests: 11 steps, 11 Do/Check/Rollback, no 40+ hex, prettier pass. Servers: none. Concern: 9(b) command not run; filter accepts flat and `attributes` shapes.
- T3 review r2 · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · low (logged, not fixed): the 9(b) `node -e` filter's stderr is not silenced, so a JSON.parse SyntaxError could echo a short snippet of the listing; fix is `2>/dev/null` on node or a try/catch. Run 9(b) once before switch day.
- T3: complete

- T6 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · d34df53
  Tests: docs:inventory exit 0; CD3 only in Completed; one cloudflare decision; prettier pass; README check skipped per ruling. Servers: none.
  Concerns: shape only gets the runbook link (V3 unticked, Status in-progress, README untouched, per ruling); versions 14.4.9 / 4.147.0 confirmed; current-state edited by content, line-40 baseline reference left; CF-switch owner @spleenteo, CF-vercel-cleanup includes workers_dev/preview_urls; one References line in the decision.
- T6 review r1 · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · medium TODO.md:66-67 new entries out of Impact/Effort order; low current-state.md:108 env line lacks CACHE_INVALIDATION_WEBHOOK_SECRET.
- T6 fix r1 · flow:executor (same, SendMessage) · definition: sonnet · DONE · f61a067
  Tests: prettier clean, docs:inventory green. Servers: none. Concern: also added SITE_SEARCH_BUILD_TRIGGER_ID and DATOCMS_CMA_TOKEN to the env line.
- T6 review r2 · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass · low (logged): current-state.md:108 puts SITE_SEARCH_BUILD_TRIGGER_ID and DATOCMS_CMA_TOKEN under "solo Cloudflare"; they are also Vercel runtime vars and reach the Worker only on switch day.
- T6: complete

- Final review · flow:task-reviewer · opus (effort high, top tier) · Spec pass, Quality fail · high: runbook rollback `wrangler deploy` re-deploys the built dist/server/wrangler.json and brings the custom domains back; high: step 9(c) signed seo-analysis call would print the draft render, which embeds DATOCMS_DRAFT_CONTENT_CDA_TOKEN (DraftModeQueryListener). medium: step 7 503 meaning wrong; "double reindex" reason wrong in runbook/caching.md/TODO.md (revalidate 500s on BYPASS_TOKEN first); rollback left Vercel ISR stale; secret placement inconsistent across security/preview-mode/current-state. low: build:cf then deploy:cf builds twice; 9(b) node stderr; commit wrangler.jsonc routes; UP-cma-token-docs stale; preview-mode:100 wording; step 0 empty-var check after vercel env pull.
- Final fix · flow:executor (fresh) · definition: sonnet · DONE · 7c66eeb
  Tests: runbook greps 11/11/11/11, no 40+ hex; npm run lint pass; docs:inventory pass. Servers: none. All 12 fixed. Concern: step 0 empty-var filter not run (needs the env file).
- Final review r2 · flow:task-reviewer · opus (same) · Spec pass, Quality pass · no value can print from the step 0 or 9(c) filters; rollback order coherent. Low (logged, not fixed): step 0 filter flags values ending in `=` as empty (fix: `grep -E '^(…)[A-Z_]*=$'`); 9(c) command quoting prints `200n` and writes the body to $TMPDIR (one-pipe version given in review); preview-mode.md:85 sentence reads badly; rollback could re-create Vercel records before the rebuild to shorten downtime. Cannot verify: Worker self-fetch on its own custom domain (Backend patch is the written fallback).
Final review: done
Gate: green — npm run lint exit 0 (after 7c66eeb); npx dotenv -e <cf.env> -- npm run build exit 0, astro check 0 errors (run before the docs-only commits f61a067, 7c66eeb); npm run docs:inventory green (executor, after 7c66eeb)

## Close draft

Narrative: V3 wrote the switch-day runbook (docs/guidelines/cloudflare-switch.md, steps 0–10, each with Do / Check / Rollback) and described both targets in caching, cms-data-loading, operations, preview-mode, security, current-state and TODO; the decision gained a reference to the runbook. T1, run in the runner with curl on the trial Worker, passed: draft enable (401/422/307, 30-day cookie), draft pages `private, no-store` with staff markers, disable then /staff 404, /api/preview-links (401, 200 with links on the request origin, Draft link sets the cookie), /api/seo-analysis 401 and the signed "DATOCMS_CMA_TOKEN is not configured" 500 (route and linkedom load). Per the binding amendments T2 did not run and no CMA token went on the Worker: the full seo-analysis render and the self-fetch question are runbook step 9(c) on www, with the Backend `no-store` patch written as the fix. Rulings: T2 skipped; the shape tick, its Status and the README left to the conductor; the packet passed to agents by path. The final review caught two switch-day hazards the per-task reviews missed: the rollback's bare `wrangler deploy` would have re-deployed the built config with the custom domains, and the 9(c) call would have printed the draft CDA token embedded in the draft render; both fixed in 7c66eeb with four mediums on status codes, reindex reasons, Vercel ISR staleness after a rollback and secret placement. Four lows remain in the ledger (step 0 empty-var regex, 9(c) quoting/temp file, preview-mode.md:85 wording, a shorter rollback order).
Lessons:
- In a runbook, every call to a signed endpoint or a listing that can carry tokens pipes the raw output straight into a filter that prints only named fields; a draft render embeds the draft CDA token (DraftModeQueryListener), so its body never reaches the terminal or the disk.
- `wrangler deploy` without a build deploys the last built `dist/server/wrangler.json` (via `.wrangler/deploy/config.json`), not the edited `wrangler.jsonc`: a config change such as adding or removing `routes` takes effect only through `npm run deploy:cf`.
- Before a doc says why an endpoint fails or what a status means, read the handler's order of checks and quote the line: `/api/revalidate` returns 500 on `BYPASS_TOKEN` before any reindex, and `/api/invalidate-cache` answers 401 for an unset secret and 503 only for a missing cache provider.
- Give a final review to a slice of docs-only tasks too: per-task reviews check each file against its task, and only a cross-file pass catches a runbook step that contradicts the code or another guideline.
Decision candidate: none
