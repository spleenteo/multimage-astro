---
agent_edit: true
scope: Live tracking of perf characteristics and work in flight
---

# Performance — Current State (2025-11-16)

- Production builds ship pure static HTML + assets; preview builds run SSR but share the same codebase.
- Largest images rely on Imgix transformations with AVIF/WebP fallbacks and base64 placeholders, which keeps LCP acceptable, but hero sections still request large crops.
- Search bundle (`public/generated/search-page.client.js`) only loads on `/cerca`; Swiper’s custom element powers carousels and can be heavy on first interaction.
- Vercel Analytics + Speed Insights provide Core Web Vitals monitoring; no custom Web Vitals reporting is instrumented.
- Pending improvements include bundle integrity enforcement (**S3**), cache tags for selective revalidation (**CD3**), and sanitization to avoid layout shift from injected HTML.

See `/docs/guidelines/performance.md` for target budgets and best practices.
