# Changelog

All notable changes to the Multimage site, newest first.

## v1.0.1 — 2026-11-23 — The site now runs on Cloudflare Workers with instant cache refresh

The public site moved from Vercel to Cloudflare Workers, and pages are now cached and refreshed by DatoCMS content changes instead of Vercel's ISR. Visitors see the same site; editors see their changes within seconds.

- **Hosting**: www.multimage.org and the apex domain are served by a Cloudflare Worker, with Vercel kept only as an idle fallback until cleanup.
- **Page cache**: public pages are served from the Workers Cache; editors in draft mode always bypass it and see drafts.
- **Cache refresh**: publishing in DatoCMS purges only the pages tagged with the changed content, through a webhook and a dedicated invalidation endpoint.
- **Analytics**: Vercel Analytics and Speed Insights were removed along with the move.
- **Documentation**: a switch-day runbook and updated caching, operations, preview and security guidelines describe the Cloudflare setup.
- **Work**: `cloudflare-workers`
- **Decision**: [cloudflare-workers-cache-gateway-and-tag-purge](decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md)

---
