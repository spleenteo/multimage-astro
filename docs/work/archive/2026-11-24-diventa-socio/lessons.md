# Lessons — diventa-socio

- Before committing, run `npm run build` (not only prettier or a selector count): a `~/` alias exists only for the folders in tsconfig `paths` (components, layouts, lib, pages, schema), so `src/styles` is imported by relative path.
- Run `npx prettier --write` on the touched files before the commit, not after, so the formatting lands in the same commit instead of a second "Format …" commit.
- When a check script fails on cases the task didn't touch, find the commit that changed the behaviour and confirm the intent in the guidelines before you align the expectations, and align them in a separate commit.
- Never import from `astro/runtime/...` to build a component inline: add a real `.astro` file, even an empty one, and ask to widen Files.
- Executors cannot run `dotenv -e .env` (auto mode denies it): plan live CDA checks as conductor checks against the running dev server, GET only.
- Run every grep and count in the task's Verified line before the first commit, so a check never needs a second, comment-only commit.
- When a page reuses another page's markup, check that each class is defined in a stylesheet the page itself loads (src/styles/form.css), not in the source page's private CSS.
- Under `wrangler dev`, `request.url` carries the first route's host (www.multimage.org) unless `--local-upstream localhost:8787` is passed: plan local Worker checks that depend on the hostname with that flag.
- Local `wrangler dev` needs `--compatibility-date` at or below the installed workerd's newest date, and its outbound fetches can be too slow for a 10 s siteverify timeout: test the insert path directly against local D1, and the full submit on production.
- When a new endpoint reuses a shared helper module (bindings, Turnstile, payment data), update that module's inventory entry in the same slice: grep its exports against list-helpers.md, not only the new files'.
- Docs written before a deploy should not carry a "live since" date; leave the date to the step that writes the production facts.
- A doc sentence that names one endpoint ("the order code", "on /api/ordine") goes stale when a sibling endpoint joins it: grep the old path across docs/guidelines when adding the new one.
- A plain `astro dev` submit answers with a real-looking code that is saved nowhere: when a production test is asked for, say which host to use and match codes against the Worker logs (`cf observability telemetry query`) before suspecting a bug.

## From V4

- When a binding review fix changes a request or table shape (a new token, a new column), grep the plan's Verified lines and Conductor steps for the old shape (probes, column counts) and pass the corrected ones in the dispatch, so checks don't expect the pre-fix answer.
- A doc sentence that says what a path is "not protected by" must be checked against the rule's expression: a new step on an existing path inherits its WAF rule even when its authorisation differs.
- Write DESIGN.md sections from the markup and CSS as committed, not from the plan or commit messages: read the classes and rows you describe.
- When a task's Verified asks for an extraction inside an "additive" task, commit the extraction first and separately, and say so in the report.
- When a change makes an export unused, grep the docs that describe it and either use it or remove both.
- A real production test can return a code that is not the only new row: list all rows of the table before deleting, and keep any row sent by someone else.

## From V5

- In a multi-step form with one `<form>`, the browser's default button is the first submit in tree order even when its step is hidden: route every submit through one handler that branches on the current step and resets transient UI (failure block, send area) before sending.
- When an error path changes the visible step, switch the step before any side effect that depends on visibility (widget reset, focus), so deferred-on-hidden rules apply.
- A "Next" step validator must clear only its own step's errors, or it silently drops server-supplied errors for the later step.
- When a page's field markup repeats across groups, extract a page-private `_Partial.astro` under the route folder (leading underscore keeps it out of routing) instead of copying the row.
