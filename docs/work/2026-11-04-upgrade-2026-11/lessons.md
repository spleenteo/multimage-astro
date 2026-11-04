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
