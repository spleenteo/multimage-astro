---
agent_edit: true
scope: How to manage draft preview for editors
---

# Preview & Draft Mode

Editors need a way to see unpublished changes on Vercel. The codebase already
ships Draft Mode utilities (`src/lib/draftMode.ts`), UI stubs
(`src/components/DraftModeToggler`, `src/components/DraftModeQueryListener`),
and placeholder API routes under `src/pages/api/draft-mode`, but the pipeline
remains unhooked. Use the steps below as the source of truth.

## 1. Secure the preview endpoint

1. Create `src/pages/api/draft-mode/enable.ts` and `disable.ts` endpoints that
   validate a shared secret (stored as `DRAFT_MODE_SECRET`).
2. When the secret matches, call `enableDraftMode({ response })` or
   `disableDraftMode({ response })` from `src/lib/draftMode.ts` to toggle the
   signed cookie, then redirect back to the requested URL.
3. Reject unknown origins or missing secrets with `401` responses so preview
   tokens cannot be brute-forced.

## 2. Fetch draft content safely

1. Update `executeQuery` to accept `{ includeDrafts: true }` and select the
   draft CDA token (`DATOCMS_DRAFT_CONTENT_CDA_TOKEN`) when Draft Mode is
   active; otherwise continue using the published token.
2. Use `draftModeHeaders()` in API routes that need to proxy CDA calls so the
   viewer’s cookie is respected.
3. Never expose draft tokens to the browser. All draft fetches must run on the
   server.

## 3. Wire up the UI helpers

1. Drop `<DraftModeToggler />` somewhere inside `BaseLayout` so authenticated
   editors can toggle previews in the UI (the component automatically pings the
   enable/disable endpoints).
2. Wrap pages with `<DraftModeQueryListener />` so Structured Text queries are
   live-reloaded when editors change content in DatoCMS.
3. Show a visible banner (even a simple outline) when Draft Mode is active so
   editors know they are seeing unpublished data.

## 4. Editor workflow checklist

1. Editor opens `/api/draft-mode/enable?secret=...&redirect=/percorso`.
2. Astro sets the Draft Mode cookie and redirects to the page.
3. Pages render using `includeDrafts` queries and, if Query Listener is
   connected, update live when edits are saved in the CMS.
4. Editor visits `/api/draft-mode/disable` (or uses the toggler) to clear the
   cookie, returning the site to published-mode rendering.

## Current gaps (Nov 7, 2025)

- `/api/draft-mode/*` routes are not implemented yet.
- `executeQuery` ignores the `includeDrafts` flag, so even manual Draft Mode
  toggles would fall back to published content.
- No preview secret or environment variables are defined. Add them to
  `datocms.json`, `.env.example`, and the deployment platform before enabling
  the feature.
