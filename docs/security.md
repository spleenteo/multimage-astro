---
agent_edit: true
scope: Live security posture and open work
---

# Security — Current State (2025-11-16)

- Preview endpoints rely on JWT-signed cookies (`SIGNED_COOKIE_JWT_SECRET`) plus `SECRET_API_TOKEN`. Cookies are `secure`, `sameSite='none'`, and partitioned.
- `/staff` and `/staff/archivio-catalogo` remain publicly accessible, exposing catalog exports (docs/TODO.md **S1**).
- `/llms-full.txt` exposes the entire catalogue in plaintext (docs/TODO.md **S4**) and should be gated/removed.
- `/api/post-deploy` currently accepts arbitrary requests and can leak preview secrets; needs retirement or additional auth (**S5**).
- Inline HTML renderers (`toRichTextHtml`, `set:html`) lack sanitization, leaving the door open for stored XSS (**S2**).
- CSP/SRI headers are not enforced; Iconify, GA, Iubenda, and generated bundles rely on default browser behavior (**S3**).
- Secrets live outside the repo; `.env*` is ignored. `astro.config.mjs` validates the required env fields at build time to avoid surprise deployments.

Security policies and guardrails are documented in `/docs/guidelines/security.md`.
