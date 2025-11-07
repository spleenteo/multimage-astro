---
agent_edit: true
scope: How to implement search offered by DatoCMS
---

# Search

DatoCMS Site Search powers `/cerca`, including the static ES module that runs
in the browser. Keep the following pieces in sync when you touch the page or
the API tokens.

## Architecture

1. `scripts/build-search-client.mjs` fetches the Site Search schema and emits a
   minified client bundle consumed by `src/pages/cerca/index.astro`.
2. The Astro page injects the bundle via `<script type="module">` and passes
   the public token/locale through `data-*` attributes.
3. Queries hit the Site Search API directly from the browser; no proxy route is
   involved, so rate limiting happens client-side.

## Tokens & Permissions

- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` **must** be generated from a role that
  only has the “Perform Site Search API calls” permission. Never reuse CDA/CMA
  tokens because this value ships to every visitor.
- Document the token alongside `PUBLIC_SITE_URL` in `.env.example` and Vercel
  project settings so new environments never fall back to undefined values.
- When rotating the token, re-run `npm run prebuild` so the generated client
  picks up the new value.

## Local development workflow

1. Ensure the public search token is present in `.env` or the shell.
2. Run `npm run prebuild` (or `npm run build-search-client`) to refresh the
   client bundle before `astro dev` starts.
3. Visit `/cerca` and confirm the script loads without CSP violations; the
   bundle relies on native `fetch` and does not require additional polyfills.

## Hardening checklist

- Validate query strings on the client before firing requests to keep the API
  traffic predictable.
- Avoid logging search tokens or queries outside the browser console; treat the
  token as public but unique per environment.
- Keep an eye on bundle size—`scripts/build-search-client.mjs` currently emits
  a minimal ES module, so any new dependencies should be tree-shaken.
