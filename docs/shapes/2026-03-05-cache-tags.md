# Shape: Cache Tags & Selective Revalidation

**Status**: idea
**Date**: 2026-03-05
**Appetite**: medium–large (3+ sessions)

## Problem

Currently there is no cache tag plumbing. When an editor publishes a change in DatoCMS, the entire site needs to be redeployed or all cached pages invalidated — there's no way to revalidate only the pages affected by the change.

`executeQuery` accepts an `environment` option but no `cacheTags` option. No route annotates its queries with cache tags, so Vercel's on-demand ISR cannot be used.

## Solution sketch

- Extend `executeQuery` options to accept `cacheTags?: string[]` and forward them to `@datocms/cda-client`'s `rawExecuteQuery`.
- Define a tagging convention: `book-{slug}`, `author-{slug}`, `collection-{slug}`, `magazine-{slug}`, `site` (for global data).
- Update key queries in routes to pass their tags.
- Add a DatoCMS webhook → `/api/revalidate` endpoint that calls Vercel's `revalidatePath`/`revalidateTag` for the affected resources.
- Document the tagging convention in `docs/guidelines/cms-data-loading.md`.

## Rabbit holes

- `@datocms/cda-client` must support `rawExecuteQuery` with tag extraction — verify the version in use.
- Vercel's `revalidateTag` API requires the Vercel KV or Edge Cache — verify it's available on the current plan.
- The `BaseLayout` query (`_site`, header/footer menus) is run on every page and tagged with `site` — a site-wide change would still invalidate everything, which is expected.

## No-gos

- Don't implement a full webhook signature verification system in this shape — use `SECRET_API_TOKEN` as a simple shared secret for now.
- Don't refactor pagination at the same time as cache tags (separate shapes).

## Slices

- [ ] CD3a: Extend `executeQuery` to accept and forward `cacheTags`
- [ ] CD3b: Annotate key routes with cache tags (`BookRecord`, `AuthorRecord`, `CollectionRecord`, `BlogPostRecord`)
- [ ] CD3c: Add `/api/revalidate` webhook endpoint
- [ ] CD3d: Configure DatoCMS webhook to call `/api/revalidate` on publish/unpublish
- [ ] Update `docs/guidelines/cms-data-loading.md` with tagging convention
- [ ] Update `docs/current-state.md`
