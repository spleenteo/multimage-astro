# Lessons — cloudflare-workers

One rule per line, read by every later subagent.

- In Astro middleware, read any cookie-derived flag after `next()` when the response depends on it: `context.cookies.get()` returns the cookies the endpoint set or deleted during the request, so a value read before `next()` is stale on the endpoints that change it.
- Files under `public/` are served by Workers Assets before the Worker runs: the middleware's cache policy never applies to them, and they leave no `wrangler tail` event. Check them with `_headers`, not the middleware.
- Every Cloudflare build rewrites `.wrangler/deploy/config.json`: keep `.wrangler/` in `.prettierignore` so `npm run lint` stays green after `build:cf`.
