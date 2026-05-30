# ISR cutover fixes & DatoCMS field hardening

**During the production cutover of the single-project ISR architecture (shape `2026-05-16-unify-projects-isr`), four issues surfaced and were resolved. Documented here because each is non-obvious and likely to recur.**

- Date: 2026-05-30
- Alternatives Considered: see each section

## Decision

### 1. `DATOCMS_BASE_EDITING_URL` must be the bare admin URL (no `/environments/...`)

Initially set to `https://multimage.admin.datocms.com/environments/main`, following the format shown in the DatoCMS Content Link skill reference. The Web Previews plugin then reported **"Environment Mismatch Detected — records belong to sandbox environment main, but you're viewing from the primary environment."**

`main` *is* the primary environment (verified via `datocms environments:list`), but appending `/environments/main` makes the stega-encoded edit-URLs take the **sandbox** URL shape. The plugin compares that against a primary-environment editing session and flags the mismatch.

**Fix**: value is now `https://multimage.admin.datocms.com` (bare). Append `/environments/<name>` only when targeting a genuine non-primary sandbox.

### 2. CSP `frame-ancestors` must include the custom admin domain

The CSP set by `src/middleware.ts` in draft mode initially allowed only `'self' https://plugins-cdn.datocms.com`. The Visual tab still showed **"www.multimage.org refused to connect"**.

The Visual tab nests iframes: `admin.multimage.org` (admin app) → `plugins-cdn.datocms.com` (plugin) → the site. CSP `frame-ancestors` validates the **whole** ancestor chain, so the top-level admin origin must be allowed too. The project uses a custom admin domain (`admin.multimage.org`) which `*.datocms.com` does not match.

**Fix** (commit `17c9e43`): `frame-ancestors 'self' https://*.datocms.com https://admin.multimage.org`.

### 3. Env vars were missing on the first production deploy

The branch merged to `main` and deployed before `BYPASS_TOKEN` / `DATOCMS_BASE_EDITING_URL` were set on Vercel. Symptoms: `enableDraftMode` set only the JWT cookie (the `if (BYPASS_TOKEN)` guard skipped `__prerender_bypass`), so editors kept seeing cached published content; `/api/revalidate` returned 500 "BYPASS_TOKEN is not configured".

**Fix**: set both vars on Vercel + redeploy. `BYPASS_TOKEN` is read at build time by `astro.config.mjs` for the ISR adapter, so a redeploy (not just a var save) is mandatory.

### 4. "Sanitize HTML" field addon caused a phantom dirty-form dialog

Opening `book.description` or `blog_post.abstract` — without editing anything — and navigating away triggered DatoCMS's **"Abbandona senza salvare"** dialog. Cause: the *Sanitize HTML* field addon rewrites the field value on load; if the stored value isn't byte-identical to the sanitizer output, DatoCMS marks the form dirty. Reproduced outside the Visual tab too → unrelated to ISR/Visual Editing, a pre-existing issue.

**Fix** (via CLI, `client.fields.update`):
- Removed the Sanitize HTML addon from both fields (kept the Character counter on `description`).
- Both fields were `editor: textarea` holding hand-written, inconsistent HTML. Converted to `editor: wysiwyg` with a minimal toolbar `['bold','italic','link']` — paste from Word/web now strips everything except bold/italic/link, and editors can no longer paste raw HTML via "show source".
- Added the `sanitized_html` validator with `sanitize_before_validation: true` — HTML is auto-cleaned at save time (no blocking error). This addresses TODO **S2** at the data layer.

**Note**: existing stored values are not migrated; they normalize only when a record is re-saved. The `set:html` render path remains theoretically exposed for un-re-saved values until S2 is also closed at render time (`toRichTextHtml`).

### 5. Site Search re-index on publish + 7-day ISR TTL

The old static architecture rebuilt the whole site on publish, which also
re-spidered the Site Search index. Under ISR there is no rebuild — content
propagates via `/api/revalidate`, which did **not** touch the search index, so
search results drifted until the next manual build.

DatoCMS has no native scheduler for re-indexing, but `buildTriggers.reindex`
re-spiders the index **with no deploy** (verified: `build_status` stays
`success`). Considered a daily Vercel Cron hitting either the deploy hook (wrong
— a full build invalidates the ISR cache for nothing) or `reindex`; chose
instead to call `reindex` directly inside `/api/revalidate` after the cache
sweep. Re-indexing now happens exactly when content is published, no cron, no
wasted spidering. Best-effort (logged, non-blocking); no-op without
`DATOCMS_CMA_TOKEN` + `SITE_SEARCH_BUILD_TRIGGER_ID` (`37696`).

Separately, `isr.expiration` was raised from 24h to **7 days**. With on-demand
revalidation covering every publish, the TTL is only a safety net for a
missed/failed webhook; a manual build forces a full refresh. Permanent caching
(`expiration: false`) was rejected — a silently failed webhook would otherwise
leave a page stale indefinitely.

Also decommissioned in the same pass: the second Vercel project's build trigger
("Preview (Vercel)", id 37875) was deleted, and a hard-coded link to the old
`multimage-astro-vf31.vercel.app` preview domain in `libri/[slug]/index.astro`
was made relative (the `/libri/schede/[slug]` route exists in the unified
project).
