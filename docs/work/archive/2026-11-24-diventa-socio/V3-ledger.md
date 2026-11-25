# Ledger — V3
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (empty, neither set)

Ruling: dispatches carry the packet by absolute path with a "read it whole first" instruction, not pasted verbatim — the packet is 102 KB (~25k tokens) and retyping it into ~12 prompts would cost ~300k output tokens and risk transcription drift — cost if wrong: lost prompt-cache hits and an agent that skims the packet; the reviews check task output against the plan regardless

- T1 · flow:executor · definition: sonnet · DONE · e1c23a3
  Report: DONE; commit e1c23a3 Point the membership links to /diventa-socio; checks: greps as Verified, prettier unchanged, npm run build passes (x2); Servers: none; Concerns: none
- T5 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 8f0effd
  Report: DONE_WITH_CONCERNS; commit 8f0effd Document the membership endpoint, its D1 table and the shared WAF rule; checks: Verified greps pass, prettier d1/README.md unchanged, no build (docs only); Servers: none; Concerns: erasure UPDATE also NULLs areas_other (free text); README notes fee_id/fee_label/fee_cents NOT NULL and not erased; security matrix notes /api/socio 503 when TURNSTILE_SECRET_KEY unset
- T1 review · flow:task-reviewer · definition: sonnet · spec pass, quality pass · no findings (build not re-run by reviewer, gate covers it)
- T1: complete
- T5 review · flow:task-reviewer · definition: sonnet · spec pass, quality pass · low: (1) security.md "Outer limits" still says WAF rule on /api/ordine only; (2) PUBLIC_TURNSTILE_SITE_KEY matrix row does not state /diventa-socio behaviour when unset; (3) executor additions (areas_other erased, fee_* not erased) accurate, owner may confirm
- T5: complete
- T2 · flow:executor · definition: sonnet · DONE · f3dc619
  Report: DONE; commit f3dc619 Redirect /info/adesioni to /diventa-socio; checks: grep 1, prettier unchanged/check pass, npm run build passes; Servers: none; Concerns: none
- T2 review · flow:task-reviewer · definition: sonnet · spec pass, quality pass · no findings (static route wins over [slug]; middleware sends the 301 as private, no-store)
- T2: complete
- T3 · flow:executor · definition: sonnet · DONE · 4a9d162
  Report: DONE; commit 4a9d162 Update the config comments for /api/socio and the two D1 tables; checks: diff comment-only grep empty, prettier unchanged/check clean, wrangler d1 migrations list --local exit 0 no config warning, npm run build passes (Vercel target); Servers: none; Concerns: none
- T4 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · 01d17ce
  Report: DONE_WITH_CONCERNS; commit 01d17ce Document the membership helpers, models and routes; checks: docs:inventory exit 0, Verified greps pass, prettier PRODUCT.md unchanged; Servers: none; Concerns: model total 36 -> 38 not re-checked with schema:inspect; long membership cell in caching.md; order.ts entry says it builds on payment.ts (no re-export); added form.css relative-import note to project-structure.md
- T3 review · flow:task-reviewer · opus (top tier, critical) · spec pass, quality pass · no findings; out of scope: wrangler.jsonc:2 stale "Trial deploy (branch chore/cloudflare)" comment, wrangler.jsonc:38-39 send_email/analytics comments sit above triggers
- T3: complete
- T4 review · flow:task-reviewer · definition: sonnet · spec pass, quality pass · low: caching.md membership row pipe count unchecked; model total 38 not confirmed by schema:inspect
- T4: complete
- Final review · flow:task-reviewer · opus (top tier) · spec pass, quality pass · medium: list-helpers.md Cloudflare bindings entry missing getMembershipMail()/getBagEvents(); low: operations.md "Neither is needed on Vercel" ambiguous; operations.md:27 "404 until the order code is deployed" names only /api/ordine (left to T6, which rewrites that bullet); list-helpers.md turnstile leniency wording inexact; TODO.md BORSA-info-sync points at order.ts instead of payment.ts; current-state.md:42 already says "since 2026-11-25" (T6 should replace that date with the deploy date, not add a second); migration 0004 header comment calls the table "a contract with the staff app" while the docs say it is written only by the site (no change)
- Final review fix · flow:executor · definition: sonnet · DONE · 695122f
  Report: DONE; commit 695122f Fix final review findings on V3: bindings, Turnstile, WAF and site-key docs; fixed the medium plus the lows on operations.md:26, the turnstile wording, BORSA-info-sync, security.md Outer limits (both paths, shared counter) and the PUBLIC_TURNSTILE_SITE_KEY row (/diventa-socio unset shows a mailto button); checks: docs:inventory exit 0, lint passes; Servers: none; Concerns: none
- Final review fix review · flow:task-reviewer · definition: sonnet · spec pass, quality pass · low: TODO.md:75 names src/lib/payment.ts twice (clumsy, optional)
- Dev check (runner, port 4333, stopped after): /info/adesioni 301 location /diventa-socio; home has 2 href="/diventa-socio"; /info/ordinare 200; /diventa-socio 200
pending: Conductor sequence step 1, WAF rule widened to /api/ordine and /api/socio, read back, rapid POSTs to /api/socio get 429
pending: Conductor sequence step 2, remote D1 migration 0004 applied, orders count unchanged
pending: Conductor sequence step 3, deploy with npx dotenv -e .env.cloudflare -- npm run deploy:cf (Version ID)
pending: Conductor sequence step 4, production checks: /diventa-socio 200 with the production site key, /info/adesioni 301, header button on www, POSTs 400 then 429, /borsa and /info/ordinare 200
pending: Conductor sequence step 5, one real request on www.multimage.org/diventa-socio: received in info@multimage.org, row in D1 with notify_status sent, confirmation shown, test row deleted with the owner's yes
pending: T6, production facts into operations.md (applied expression, also fix "404 until the order code is deployed" to name both endpoints), d1/README.md, current-state.md (replace the existing "since 2026-11-25" with the deploy date), TODO.md done entry with the owner follow-ups (L7 included)
Final review: done
Gate: green (npm run lint passes; npm run build 0 errors, 0 warnings, Complete; after 695122f)

## Close draft

Narrative: T1–T5 ran without a stop: the header button and the three "Soci" links point to /diventa-socio, /info/adesioni is a frontmatter-only 301 page (static route beats info/[slug]; the middleware sends it private, no-store), config comments name both D1 tables and both Turnstile routes, and the docs (inventories, routes, caching, security, operations, d1/README, TODO) describe the target state. The final review found the Cloudflare bindings inventory missing getMembershipMail() and getBagEvents(), plus five wording drifts (Turnstile leniency, payment.ts as the source of the bank details, the WAF rule's two paths, the unset site key on /diventa-socio); one fix round closed them. The local dev check and the gate are green. One ruling: dispatches carried the 102 KB packet by path instead of verbatim. The production half (WAF, remote D1 0004, deploy, live checks, real request) and T6 are left to the conductor. Executor extras kept: the erasure UPDATE also NULLs areas_other (free text), and fee_* columns are documented as never erased.
Lessons:
- When a new endpoint reuses a shared helper module (bindings, Turnstile, payment data), update that module's inventory entry in the same slice: grep its exports against list-helpers.md, not only the new files'.
- Docs written before a deploy should not carry a "live since" date; leave the date to the step that writes the production facts.
- A doc sentence that names one endpoint ("the order code", "on /api/ordine") goes stale when a sibling endpoint joins it: grep the old path across docs/guidelines when adding the new one.
Decision candidate: none
