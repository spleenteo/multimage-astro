# Baseline: ISR config and Vercel routes

Date: 2026-11-05
Versions: astro 6.3.3, @astrojs/vercel 10.0.7

Command:

    BYPASS_TOKEN="$(openssl rand -hex 16)" npx astro build

The `bypassToken` in `isr-prerender-config.json` comes from a throwaway random token and is replaced with `<redacted>`. No real token is stored here.

Files:
- `isr-prerender-config.json`: `.vercel/output/functions/_isr.prerender-config.json`
- `vercel-routes.json`: the `routes` array of `.vercel/output/config.json`
- `functions.txt`: `ls .vercel/output/functions`

Use: reference for V4's expected diff (after the Astro 7 / @astrojs/vercel 11 upgrade).

`.vercel/output` was deleted after the snapshot: rebuild before any `--prebuilt` deploy.
