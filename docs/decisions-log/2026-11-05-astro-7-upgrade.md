# Upgrade to Astro 7 and @astrojs/vercel 11

**Astro 7.4.7 and `@astrojs/vercel` 11.0.20, with `compressHTML: true` pinned and `--ignore-lock` for one-off dev servers.**

- Date: 2026-11-05
- Alternatives Considered: keep Astro's new default `compressHTML: 'jsx'` and audit every `{" "}`; set `compressHTML: false`

## Decision

Work `upgrade-2026-11`, slice V4: Astro 7.4.7 (Rust compiler, Vite 8) and `@astrojs/vercel` 11.0.20, following the official upgrade guide.

**`compressHTML: true` is pinned.** The Astro 7 default is `'jsx'`, which strips whitespace between elements. In dev it glued words in the header nav and produced far larger diffs than `true`, so it would need an audit of every place that relies on whitespace (`{" "}`). `false` would ship uncompressed HTML. `true` keeps the DOM identical to Astro 6; the only differences are single spaces kept between elements in block or flex context, which do not change the rendering.

**ISR output changed, as expected.** Compared with the V1 snapshot: `allowQuery` gains `x_astro_path_token`; every `/_isr` route is `^(X)$` and rewrites to `/_isr?x_astro_path=$1&x_astro_path_token=<per-build token>` (the token is per build, never stored); the `/_astro` cache header block moved above the filesystem handler; the final catch-all lost `"status": 404` (with a server-rendered 404 page the status comes from the page). The option names in `astro.config.mjs` are unchanged. Verified on a Vercel preview: smoke routes 200, unknown path 404, `/staff` 404 for anonymous visitors and 200 with the draft session, `__prerender_bypass` set by draft mode enable.

**Dev servers.** Under an AI agent, Astro 7 `astro dev` starts in the background (`npx astro dev stop`), and refuses a second server while one holds the project lock. `--ignore-lock` keeps a separate foreground server for one-off checks (revalidation procedure b).

## Consequences

Node 24 is now required on Vercel too (project setting changed, preview build ran on nodejs24.x). `path-to-regexp` ReDoS (GHSA-9wv6-86v2-598j) is still listed by `npm audit --omit=dev`, now through `@vercel/routing-utils` 6.6.1 (`path-to-regexp` 6.1.0).
