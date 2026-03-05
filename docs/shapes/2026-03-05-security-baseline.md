# Shape: Security Baseline

**Status**: idea
**Date**: 2026-03-05
**Appetite**: medium (2–3 sessions)

## Problem

Several attack surfaces are open in production:

- `/staff` and `/staff/archivio-catalogo` are publicly accessible without any authentication, exposing the full book catalog in both HTML and downloadable CSV.
- `toRichTextHtml` + `set:html` is used in home hero, BannerSection, supplier bios, and staff notices without HTML sanitization — stored XSS is possible if a CMS editor inserts a malicious snippet.
- `/llms-full.txt` exposes every book, author, and page body to anonymous visitors.
- `/api/post-deploy` accepts requests from anyone and can leak `SECRET_API_TOKEN` by being pointed at an attacker-controlled DatoCMS project.

## Appetite

High-impact fixes that don't require a full auth system. S1 (staff auth) is the heaviest slice.

## Solution sketch

- **S2 — HTML sanitizer**: introduce a shared `sanitizeHtml(input)` helper in `src/lib/text.ts` using a lightweight allowlist. Replace all `toRichTextHtml`+`set:html` call sites.
- **S4 — Gate `/llms-full.txt`**: either remove the route or require a bearer token via `Authorization` header (simple shared secret, not full OAuth).
- **S5 — Retire `/api/post-deploy`**: delete the route once production Vercel environments are confirmed configured. If keeping it, add a `X-Deploy-Secret` header check.
- **S1 — Staff auth**: add a simple password-gated middleware or Vercel Edge middleware for `/staff/**`. Alternatively gate via existing `SECRET_API_TOKEN` cookie.

## Rabbit holes

- A full auth system (users, roles, sessions) is out of scope — just a simple gate.
- CSP/SRI headers (S3) are a separate concern — don't mix with this shape.

## No-gos

- No OAuth, no user accounts, no database of users.
- Don't block anonymous access to public catalog pages.

## Slices

- [ ] S2: Add `sanitizeHtml()` helper, replace all `set:html` call sites, add regression test
- [ ] S4: Gate `/llms-full.txt` with bearer token or remove it
- [ ] S5: Delete or secure `/api/post-deploy`
- [ ] S1: Add simple auth gate to `/staff/**`
