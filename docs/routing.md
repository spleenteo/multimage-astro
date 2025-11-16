---
agent_edit: true
scope: Live map of current routes and behaviors
---

# Routing — Current State (2025-11-16)

- Static content: `/`, `/libri`, `/libri/[slug]`, `/collane`, `/autori`, `/magazine`, `/magazine/[slug]`, `/distributori`, `/info`, `/info/[slug]`, `/staff`, `/staff/archivio-catalogo`, `/llms-full.txt`, `/sitemap.xml`, `/cerca`, `/libri/ebooks|archivio|highlights`, `/collane/[slug]` all prerender when `SERVER=static` and switch to SSR automatically in preview mode via `~/lib/prerender`.
- API routes: `/api/preview`, `/api/draft-mode/enable|disable`, `/api/preview-links`, `/api/seo-analysis`, `/api/post-deploy`, `/api/utils` remain SSR-only endpoints even during static builds (handled by the Vercel adapter in preview deployments).
- Route helpers: `recordToWebsiteRoute` is used by `/api/preview-links` and `LinkToRecord.astro` to resolve URLs from Dato records.
- Known issues: `/staff` routes still lack auth (Security task **S1**); `/llms-full.txt` should be gated (**S4**); `/magazine` Structured Text links still point to `/blog/...` (**PS2**).

Routing policies, naming, and conventions are defined in `/docs/guidelines/routing.md`.
