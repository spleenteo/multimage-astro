// Gateway Worker entry (wrangler.jsonc `main`).
//
// The default entrypoint has Workers Cache off, so it runs on every request. It
// decides how the request meets the cache and forwards it to `Backend`, whose
// entrypoint has the cache on (`exports` in wrangler.jsonc). `Backend` wraps the
// Astro handler, so every render, and the V2 cache purges, happen there.
//
// - Draft cookie present: `cache: 'no-store'`, so an editor never reads or fills
//   the shared copy. The middleware also calls `cache.set(false)` for drafts:
//   the bypass is double, because draft HTML carries the draft CDA token.
// - Outside /api: `cf.cacheKey` is the path only, so ?utm_*, ?fbclid and other
//   query strings share one entry. The one query string the server reads is
//   `/magazine?categoria=<slug>` (the category filter): it gets its own entry,
//   and the page's cache tags purge every variant together.
//
// - Cron Trigger (wrangler.jsonc `triggers.crons`, once a day at night):
//   re-spiders the DatoCMS Site Search index through the CMA build trigger
//   `SITE_SEARCH_BUILD_TRIGGER_ID` (with `DATOCMS_CMA_TOKEN`). It replaces the
//   reindex per publish of /api/invalidate-cache: the crawler then reads a warm
//   cache once a day instead of purged pages after every publish. The same call
//   as `reindexSiteSearch` (src/lib/datocms/siteSearch.ts), which `astro:env`
//   keeps out of this file.
//
// The cookie name rule is copied from src/lib/draftMode.ts:9 (keep in sync; the
// worker cannot import `astro:env`).
//
// This file is excluded from `astro check` (tsconfig.json): the Workers runtime
// types (`cloudflare:workers`, `ExecutionContext`) are not installed, and adding
// them would clash with the DOM lib in the rest of the Astro code. The bundler
// strips the types; the Cloudflare build and deploy check the file.
import { WorkerEntrypoint } from 'cloudflare:workers';
import { handle } from '@astrojs/cloudflare/handler';

export class Backend extends WorkerEntrypoint {
  fetch(request: Request) {
    return handle(request, this.env, this.ctx);
  }
}

function hasCookie(header: string | null, name: string) {
  return (header ?? '').split(';').some((part) => part.trim().startsWith(`${name}=`));
}

function cacheKeyFor(url: URL) {
  const category =
    url.pathname === '/magazine' ? url.searchParams.get('categoria')?.trim().toLowerCase() : '';
  return category && /^[a-z0-9-]{1,60}$/.test(category)
    ? `${url.pathname}?categoria=${category}`
    : url.pathname;
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const cookieName = env.DRAFT_MODE_COOKIE_NAME?.trim() || 'multimage_draft_mode';
    const isApi = url.pathname === '/api' || url.pathname.startsWith('/api/');

    let init: RequestInit | undefined;
    if (hasCookie(request.headers.get('cookie'), cookieName)) {
      init = { cache: 'no-store' };
    } else if (!isApi) {
      init = { cf: { cacheKey: cacheKeyFor(url) } } as RequestInit;
    }
    return ctx.exports.Backend.fetch(request, init);
  },

  async scheduled(_controller: unknown, env: any, ctx: any) {
    const token = env.DATOCMS_CMA_TOKEN?.trim();
    const trigger = env.SITE_SEARCH_BUILD_TRIGGER_ID?.trim();
    if (!token || !trigger) {
      console.log('[site-search] cron: reindex skipped (token or trigger id unset)');
      return;
    }
    ctx.waitUntil(
      fetch(`https://site-api.datocms.com/build-triggers/${encodeURIComponent(trigger)}/reindex`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'X-Api-Version': '3',
        },
      }).then(
        (res) =>
          console.log(
            `[site-search] cron: reindex ${res.ok ? 'triggered' : 'failed'} ${res.status}`,
          ),
        (error) => console.error('[site-search] cron: reindex failed', error),
      ),
    );
  },
};
