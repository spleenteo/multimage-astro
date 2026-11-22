# Ledger — V2
printenv CLAUDE_CODE_SUBAGENT_MODEL_FORCE CLAUDE_CODE_SUBAGENT_MODEL: (both unset)
- T1 · flow:executor · definition: sonnet · DONE · 257454e
  Status: DONE. Commits: 257454e Map index_page by slug and supplier in recordInfo. Tests: phantom-key grep empty; tsx one-liner printed `/libri/archivio /distributori`; prettier check passed. Servers: none. Concerns: none (8 slugs match the allIndexPages filters in the 8 index routes).
- T2 · flow:executor · definition: sonnet · DONE · d892f07
  Status: DONE. Commits: d892f07 Make getRevalidationUrls query injectable and parse record id. Tests: static-import grep empty; check:revalidation-map 13 payloads, 0 mismatches, fetch calls 0; plain-tsx author case 3 URLs; book stub (count 81) includes /libri/pagina/3; astro check 0 errors; build without mixed-import warning; prettier --write on the 3 files (reformatted revalidationUrls.ts). Servers: none. Concerns: none; schema.ts unchanged.
- T1 review · flow:task-reviewer · opus (top tier, critical) · Spec pass, Quality pass
  Low: `s` terse vs `normalizedSlug` (recordInfo.ts:50); comment `{ slug: { eq } }` shorthand (20-21); maps out of sync until T3 (by design); plugins' `item.attributes.slug` shape for index_page unverifiable locally (T6 preview-links covers it). Callers preview-links/seo-analysis handle a null route.
- T1: complete
- T2 review · flow:task-reviewer · opus (top tier, critical) · Spec pass, Quality pass
  Low: webhookPayload.ts:20-22 doc comment wraps unevenly; report shows prettier --write, not --check; mixed dynamic/static import warning on executeQuery.ts not independently verified (re-check in the gate's build output).
- T2: complete
- T3 · flow:executor · definition: sonnet · DONE · 86779db
  Status: DONE. Commits: 86779db Map index_page, supplier, license and app in the revalidation map. Tests: check:revalidation-map exit 0, `15 payloads, 11 routes, 0 mismatches, fetch calls: 0`; 2 GAP (book-unpublish, page); new payload lines and 11 route lines OK; phantom grep empty; astro check 0 errors; prettier --check passes on 5 files. Servers: none. Concerns: license-publish.json already had rec-1010; new payload ids rec-1011/rec-1012 keep item_type 1008; CATALOGUE_COUNT_QUERY and LICENSE_BOOKS_QUERY ($id: ItemId) only run against the stub (T6 is the first real CDA run); check still uses the old hooks until T4.
- T3 review · flow:task-reviewer · opus (top tier, critical) · Spec pass, Quality pass
  Low: INDEX_PAGE_PATHS[slug] plain-object lookup (prototype keys like `constructor`), also in recordInfo.ts, and no slug trim in revalidationUrls.ts; stale "Singleton / index records" comment and missing blank line (150-156); doc block omits `id` (4-5); no license payload without entity.id. Unverifiable: the CDA accepting CatalogueRevalidationCount / LicenseRevalidationBooks (T6 proves it).
- T3: complete
- T4 · flow:executor · definition: sonnet · DONE · 284d020
  Status: DONE. Commits: 284d020 Drop resolve hooks from the revalidation map check. Tests: check `15 payloads, 11 routes, 0 mismatches, fetch calls: 0`, exit 0, no astro:env; hooks grep empty; astro check 0 errors, 0 warnings, 1 hint; prettier --check passes (after --write on check.ts); sentinel test: a temporary throw gave exit 1, reverted. Servers: none. Concerns: none.
- T4 review · flow:task-reviewer · opus (top tier, critical) · Spec pass, Quality pass
  Reviewer proved the preload flag with an empty entry: exit 1 with sentinel.mjs, 0 without. Low: the executor's throw-based flag test proves nothing; "Concerns: none" followed by notes; tsx still not a devDependency (hoisted from the datocms CLI, engines >=18). Unverifiable: check on Node 20 (only Node 16 and 24 installed).
- T4: complete
- T7 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · b0e5dc8
  Status: DONE_WITH_CONCERNS. Commits: b0e5dc8 Update helper docs, current state and TODO for the V2 revalidation map. Tests: old-wording grep empty; `Cache gap #16` count 0; docs:inventory exit 0; prettier passes on list-helpers, current-state, dependencies; fails on TODO.md, already failing at HEAD in untouched lines (not reformatted). Servers: none. Concerns: ran `git stash` by mistake mid-task, which swept T5's uncommitted caching.md, then popped it at once (applied cleanly, stash list empty); TODO.md had no open entries for gaps #1-#4, so one completed line was added; UP-node reworded; gap #13 reworded as narrowed.
- T5 · flow:executor · definition: sonnet · DONE_WITH_CONCERNS · dc2a648, 0b4424e
  Status: DONE_WITH_CONCERNS. Commits: dc2a648 Update caching guideline for the V2 revalidation map; 0b4424e Drop the Node version mention from caching procedure (a). Tests: check exit 0, `15 payloads, 11 routes, 0 mismatches, fetch calls: 0`, GAP only book-unpublish and page; Verified grep empty; V2 Runs heading count 1; no row 16; prettier --check passes. Servers: none. Concerns: two commits (a failed macOS `sed -i` left a 22.15 mention); run (b) left `pending (T6)`; gap fates rewritten with the legend; /info/[slug] and /magazine/[slug] rows corrected for license; /libri/schede note on app/license.
- T5 review · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass
  Pasted run (a) matches a fresh run; the doc matches the code; stash incident left the file coherent (305 lines, no duplicates). Low: two commits for one task (dc2a648 alone still held 22.15; no amend allowed); old Runs 2026-11-04 heading says "Run on 2026-11-05" (V1 text).
- T5: complete
- T7 review · flow:task-reviewer · definition: sonnet · Spec pass, Quality pass
  Confirmed TODO.md failed prettier at b0e5dc8^ (baseline, not caused by T7). Low: completed line placement/format matches repo usage; UP-node line has three consecutive parentheticals; stash incident: no loss visible (caching.md committed in dc2a648, tree clean).
- T7: complete
- T6 (server part) · runner, in session · DONE · no commit
  Own astro dev on 4331 with the overrides (4321/4329 untouched). index_page-libri → /libri + /libri/pagina/2..9 (9 URLs); supplier → ["/distributori"]; app → noop; license by-nc-nd (2133406) → 42 /libri/<slug> URLs, by-nd (2133398) → 2; all reindexed:false; dev log 0 `enrichment failed`, 0 ERROR, no 4xx/5xx; preview-links (published index_page libri) → 1 link with url=/libri. Server stopped, 4331 free, schema.ts unchanged. Token never echoed (dotenv sh -c form; CLI output filtered to id+code).
- T6 · flow:executor · definition: sonnet · DONE · ee36201
  Status: DONE. Commits: ee36201 Record the V2 local astro dev run in the caching guideline. Tests: token/hex grep empty; prettier --check (ignore-path /dev/null) passes. Servers: none. Concerns: none; (c) after deploy noted as open.
- T6 review · flow:task-reviewer · opus (top tier, critical) · Spec pass, Quality pass
  Every recorded value traced to the run's real output; no secret, license ids not in the doc. Low: the record doesn't say book-publish and wrong-token were not repeated (covered by the 2026-11-04 run); V1 heading/date mismatch (pre-existing).
- T6: complete
Ruling: the three low findings of the final-review fix review stay unfixed (raw `slug === 'libri'` vs trimmed indexPagePath; no `constructor` webhook payload; list-helpers and the revalidationUrls.ts:13 comment don't name indexPagePath) — low per the loop's rule, the fix round is spent, and none changes behaviour for real slugs — cost if wrong: a slug with spaces skips the catalogue pages, and one doc line is stale until the next touch.
- Final review · flow:task-reviewer · opus (top tier) · Spec pass, Quality pass
  Low: plain-object lookup on INDEX_PAGE_PATHS (prototype keys; trim differs between the maps); list-helpers signature wrong (`query` positional); record `id` missing in 3 doc lines; check bullet omits route table; current-state.md:27 overstated "same table" and named LinkToRecord.astro; stale "Singleton / index records" comment; UP-node wording; process slips (T5 two commits, T7 `git stash` in a shared checkout). Cannot verify: full report fields (ledger trims).
- Final review fix · flow:executor · definition: sonnet · DONE · 2fc5c52, c833289
  Status: DONE. Commits: 2fc5c52 Fix review findings on V2 final review: own-property index page lookup; c833289 Fix review findings on V2 final review: docs accuracy. Tests: check `15 payloads, 12 routes, 0 mismatches, fetch calls: 0`; astro check 0 errors; prettier on code and the 3 docs passes; docs:inventory exit 0; token grep empty. Servers: none. Concerns: none.
- Final review fix review · flow:task-reviewer · opus (top tier) · Spec pass, Quality pass
  Low (ruled above): `slug === 'libri'` vs trimmed path; no constructor webhook payload; indexPagePath not named in list-helpers / revalidationUrls.ts:13.
- Gate fix round: none needed.
pending: after merge+deploy, a real publish of an index page shows the index URL revalidated (procedure (c) on production, at the end of the work)
Final review: done
Gate: green — npm run lint rc 0 (all files use Prettier style); npm run build rc 0 (astro check 156 files, 0 errors, 0 warnings, 1 hint; build Complete; no mixed dynamic/static import warning on executeQuery.ts); check:revalidation-map 15 payloads, 12 routes, 0 mismatches, fetch calls: 0. Re-run after the final-review fixes. Done items: (a) green with the new cases; Web Previews link for an index page resolves (local POST /api/preview-links → url=/libri); real-CDA run (b) on own port 4331 green. No server left running by the slice (4321 and 4329 are the user's).

## Close draft

Narrative: V2 mapped `index_page` (by slug, through `INDEX_PAGE_PATHS` and the `indexPagePath` helper, now shared by both maps), `supplier` → `/distributori`, `license` → its books' `/libri/<slug>` pages by record id, and `app` as a deliberate no-op, and removed the 7 phantom api_keys from `recordInfo.ts` and `revalidationUrls.ts`. `getRevalidationUrls` takes an injectable query with a lazy `executeQuery` default, so the check passes its stub directly: `hooks.mjs`, `register-stubs.mjs` and the Node >= 22.15 requirement are gone, and a preload sentinel keeps the fail-if-not-run guarantee (proven by the reviewer with an empty entry, not by a throw). Plan review overturned V1's audit: the license is rendered only on the book page, so the card routes need nothing. The real-CDA run on an own server (port 4331) gave `/libri` + `/libri/pagina/2..9` for the libri index, 42 and 2 book pages for two licenses, no enrichment failure, and a resolving Web Previews link. The final review found only low items. A fix round added the own-property lookup (prototype-key slugs) and corrected the docs. Three low items were ruled and left: the raw `libri` compare, the missing constructor payload, and the stale `indexPagePath` doc line. Process slips: T5 landed in two commits, and the T7 executor ran `git stash` in the shared checkout while T5 had uncommitted work, with no loss. Still open: the Done item "a real publish of an index page after merge+deploy", to be checked by procedure (c) on production.
Lessons:
- Executors running in parallel share one checkout and index: never `git stash`, `git reset` or `git checkout -- .`; stage by path only.
- Prove a preload's exit-code guard with an entry that returns without throwing; a thrown error exits 1 on its own and proves nothing.
- An object used as a lookup table keyed by CMS input needs an own-property check (`Object.hasOwn`); `constructor` or `__proto__` slugs otherwise return inherited values.
- On macOS, `sed -i` needs an empty suffix argument (`sed -i ''`); re-run the Verified grep after any in-place edit, before committing.
Decision candidate: none
