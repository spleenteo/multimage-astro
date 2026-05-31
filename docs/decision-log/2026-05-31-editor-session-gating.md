# Editor session gating for internal routes (S1)

**The draft-mode cookie is reframed as a single "editor session" and becomes the one authorization boundary for all internal routes. Documented because it conflates two concepts on purpose, and the reasoning is non-obvious.**

- Date: 2026-05-31
- Closes: TODO **S1** (Catalog data exposure, CWE-200)
- Alternatives Considered: see below

## Context

Two unrelated concerns had been tangled under the same draft-mode cookie, with inconsistent results:

- **Draft mode** = "show unpublished content" (content freshness).
- **Staff access** = "this tool is for the team" (authorization).

The book sheet `/libri/schede/[slug]` gated on draft mode (`throw new Response(404)` otherwise) — using a content toggle as a de-facto auth check. Worse, the `throw` crashed: Astro 6 does not honor a thrown `Response` from page frontmatter, so the page 500'd with a misleading `[object Response]` (formatted by `formatTOMLError`, `errors/utils.js:67`). Meanwhile `/staff` and `/staff/archivio-catalogo` checked **nothing** and were fully public, leaking inventory `stock`/`circulation` and a full-catalogue CSV export.

## Decision

**The signed draft-mode JWT cookie IS the editor session.** Holding it does three things at once: reveals drafts everywhere, authorizes the internal tools, and surfaces editor affordances. One boundary, enforced once.

### 1. Single enforcement point in `src/middleware.ts`

`INTERNAL_PATH_PREFIXES = ['/staff', '/libri/schede']`. Any matching request without `isDraftModeEnabled(cookies)` gets a flat **404** before render. Pages no longer guard themselves — the per-page check is what caused the original bug and the inconsistency.

- **404, not 401/redirect**: strongest information-disclosure posture (CWE-200). The public must not even learn the paths exist. Trade-off accepted: an editor with an expired cookie hitting a bookmark sees a bare 404; the magic link re-activates.

### 2. Bearer token is sufficient — no login system

The protected data is *mildly confidential business data* (stock levels, print runs), not passwords/PII. A JWT signed with `SIGNED_COOKIE_JWT_SECRET` (forging requires the server secret) is an adequate bearer token. A real auth system (passwords, roles, OAuth) would be oversized for this. Vercel-native path protection was rejected: not available for selective production paths on the free plan.

### 3. 30-day expiry

The JWT was previously signed with no `expiresIn` (effectively eternal). Now `expiresIn: '30d'` plus a matching cookie `maxAge`, so a leaked cookie eventually dies. 30 days balances convenience for a small team against the leak window for non-PII data.

### 4. Affordances when the session is active

- **`EditorModeBadge.astro`** (rendered by `BaseLayout` alongside `ContentLink`, draft-only): floating "Modalità editor" indicator with a link to `/staff` and an "Esci" that calls `/api/draft-mode/disable`. Gives editors a clear signal they are viewing drafts and a one-click exit.
- **Contextual link** on `/libri/[slug]`: a "Scheda libro (staff)" link to `/libri/schede/[slug]`, visible only in session — also the natural way editors discover the sheet's slug.

Activation reuses the existing magic link `/api/draft-mode/enable?token=SECRET_API_TOKEN&url=...` (bookmarkable); no new auth surface was added.

## Consequences

- `/libri/schede/[slug].astro` no longer guards access; it keeps only the legitimate "book not found" 404 for a bad slug (returned to an authenticated editor).
- The printable book sheet has no `BaseLayout`, so it shows no badge — intentional.
- Content Link is now coupled to `DATOCMS_BASE_EDITING_URL` in both `executeQuery.ts` and `DraftModeQueryListener` (`enableContentLink = includeDrafts && Boolean(DATOCMS_BASE_EDITING_URL)`). The CDA returns 422 (`INVALID_X_BASE_EDITING_URL_HEADER`) if `contentLink: 'v1'` is sent without a base URL, which previously broke **every** draft-mode page in local dev (the env is unset locally). Now local dev sees drafts without the visual-editing overlay; production (env set) is unchanged.

## Files

- `src/middleware.ts` — gate + `INTERNAL_PATH_PREFIXES`
- `src/lib/draftMode.ts` — `expiresIn`/`maxAge` (30d)
- `src/pages/libri/schede/[slug].astro` — removed the draft-mode guard
- `src/components/EditorModeBadge.astro` — new
- `src/layouts/BaseLayout.astro` — render the badge
- `src/pages/libri/[slug]/index.astro` — contextual staff link
- `src/lib/datocms/executeQuery.ts` + `src/components/DraftModeQueryListener/index.astro` — gate Content Link on `DATOCMS_BASE_EDITING_URL` so draft mode works in local dev
