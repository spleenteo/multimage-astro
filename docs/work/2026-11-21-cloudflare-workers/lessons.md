# Lessons — cloudflare-workers

One rule per line, read by every later subagent.

- In Astro middleware, read any cookie-derived flag after `next()` when the response depends on it: `context.cookies.get()` returns the cookies the endpoint set or deleted during the request, so a value read before `next()` is stale on the endpoints that change it.
- Files under `public/` are served by Workers Assets before the Worker runs: the middleware's cache policy never applies to them, and they leave no `wrangler tail` event. Check them with `_headers`, not the middleware.
- Every Cloudflare build rewrites `.wrangler/deploy/config.json`: keep `.wrangler/` in `.prettierignore` so `npm run lint` stays green after `build:cf`.
- A Flow `h()` helper that greps `^(HTTP|cf-cache-status):` never shows the status line: curl prints `HTTP/2 200` with no colon. Use `-w '%{http_code}'` for the status.
- `wrangler tail` drops events under a burst (31 calls gave 28 endpoint log lines). Count rate-limit outcomes from the HTTP answers, and use the tail only for per-page fields.
- A scratch script that uses top-level await and runs under `node --import tsx` must be `.mts`: tsx compiles a `.ts` file outside the repo's ESM scope to CJS and fails.
- Commit an extraction (moving a helper to `src/lib`) separately from, and before, the feature that reuses it, even inside one plan task: a later split would need a rebase.
- In a runbook, every call to a signed endpoint or a listing that can carry tokens pipes the raw output straight into a filter that prints only named fields; a draft render embeds the draft CDA token (DraftModeQueryListener), so its body never reaches the terminal or the disk.
- `wrangler deploy` without a build deploys the last built `dist/server/wrangler.json` (via `.wrangler/deploy/config.json`), not the edited `wrangler.jsonc`: a config change such as adding or removing `routes` takes effect only through `npm run deploy:cf`.
- Before a doc says why an endpoint fails or what a status means, read the handler's order of checks and quote the line: `/api/revalidate` returns 500 on `BYPASS_TOKEN` before any reindex, and `/api/invalidate-cache` answers 401 for an unset secret and 503 only for a missing cache provider.
- Give a final review to a slice of docs-only tasks too: per-task reviews check each file against its task, and only a cross-file pass catches a runbook step that contradicts the code or another guideline.
