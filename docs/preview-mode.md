---
agent_edit: true
scope: Live description of the Draft Mode pipeline
---

# Preview Mode — Current State (2025-11-16)

- Two build modes: `SERVER=static` (production) prerenders everything; `SERVER=preview` (preview Vercel project + local dev) enables SSR so Draft Mode cookies can toggle draft CDA tokens.
- Preview entry points: `/api/preview` (secret + redirect) and `/api/draft-mode/enable|disable` (used by the Dato Web Previews plugin). Both read `SECRET_API_TOKEN` and sign cookies with `SIGNED_COOKIE_JWT_SECRET`.
- Draft cookie: stored via `enableDraftMode` helper, defaults to `multimage_draft_mode`, marked `secure`, `sameSite='none'`, and `partitioned`.
- Data flow: `resolveDraftMode(Astro)` inspects the cookie only when `SERVER=preview`; static builds bypass it to avoid warnings.
- Live updates: `DraftModeQueryListener` listens to Dato’s Query Listener endpoint and reloads the page when draft data changes; only rendered when Draft Mode is active to keep draft tokens server-side.
- Known caveats: `npm run preview` serves static HTML and cannot use preview cookies; sanitization for HTML fragments remains outstanding as part of **S2**.

Policies and operational steps remain documented in `/docs/guidelines/preview-mode.md`.
