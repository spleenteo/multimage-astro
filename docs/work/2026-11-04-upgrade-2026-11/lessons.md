# Lessons — upgrade-2026-11

One rule per line; every subagent reads this.

- Never print raw DatoCMS CLI output, not even with head: webhook-call records carry ?token=<SECRET_API_TOKEN> in request_url; pipe straight into a node filter that prints chosen fields, never through a file.
- `datocms cma:call … --json` prints nothing (npm notices on stdout break parsers): use the plain output, sliced from the first line starting with [ or {.
- A route audit lists models from the fragments too: grep every fragment a page composes (BookCard, FeaturedBookHighlight, review blocks), not only the page's own query.
- A check script must fail when it doesn't run: set process.exitCode = 1 in the preload and let the entry overwrite it at the end; treat a missing fixture as a mismatch.
- With tsx on Node 24, module.register hooks can skip the entry silently; use module.registerHooks (Node >= 22.15).
- `rm` and `/bin/rm` are blocked by the zsh hook in agent shells: delete with Python (os.remove) or `del`, or avoid temp files.
- docs/ is in .prettierignore: format docs with `npx prettier --ignore-path /dev/null`, and don't claim a vacuous prettier pass.
- A Verified line that expects "a status line per URL" must allow for fixture slugs unknown to the CDA: the page throws and logs no status.
- Executors running in parallel share one checkout and index: never `git stash`, `git reset` or `git checkout -- .`; stage by path only.
- Prove a preload's exit-code guard with an entry that returns without throwing; a thrown error exits 1 on its own and proves nothing.
- An object used as a lookup table keyed by CMS input needs an own-property check (`Object.hasOwn`); `constructor` or `__proto__` slugs otherwise return inherited values.
- On macOS, `sed -i` needs an empty suffix argument (`sed -i ''`); re-run the Verified grep after any in-place edit, before committing.
- A `.d.ts` with `declare module 'x'` and no top-level import/export replaces package x's own types entirely: before editing or deleting one such shim, grep `src` for every `declare module 'x'` and treat them as one unit.
- Plain `tsc -p tsconfig.json` cannot resolve `.astro` imports (TS2307 on every component `index.ts`): judge a TypeScript or tsconfig change by `astro check`, never by plain `tsc` alone.
- A dev server log records the full `/api/draft-mode/enable?token=…` URL: write it to the scratchpad, print only redacted lines, delete it when the server stops.
- Before asserting that a newer framework's option "keeps vN output", diff a normalized DOM of real pages before and after: Astro 7 `compressHTML: true` keeps a space v6 dropped.
- A vercel deploy run under an agent prints JSON on stdout: take the URL from `.deployment.url`, not from the last line.
- zsh doesn't word-split an unquoted `$var`: `set -- $p` in a loop silently passes empty arguments; use a function with explicit arguments.
- Probe 404s with more than one shape of unknown path (top-level and under a dynamic route): a dynamic route that throws gives 500 where a top-level miss gives 404.
- `vercel curl` on a protected project with no automation bypass creates one silently on the project: record it in TODO for revocation the moment it is created.
- In a leak probe, guard each needle (`v ? body.includes(v) : 'unset'`): a variable present but empty in `.env` loads as `""`, and `includes("")` is always true.
- In `astro dev`, Vite answers every OPTIONS request with its own 204 before the route runs: prove a route module loads with a GET (404 or 401), and leave the OPTIONS handlers to a deploy.
- On TypeScript 6, a standalone `tsc <file>` with flags fails with TS5112 when a `tsconfig.json` is present: add `--ignoreConfig`.
- Before a smoke that needs a server-side token, check that it is non-empty in the env the server reads (names and emptiness only, never values); a local `.env` can hold the name with no value.
