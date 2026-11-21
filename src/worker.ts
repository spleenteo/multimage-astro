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
//   query strings share one entry (no server code reads the query string).
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

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const cookieName = env.DRAFT_MODE_COOKIE_NAME?.trim() || 'multimage_draft_mode';
    const isApi = url.pathname === '/api' || url.pathname.startsWith('/api/');

    let init: RequestInit | undefined;
    if (hasCookie(request.headers.get('cookie'), cookieName)) {
      init = { cache: 'no-store' };
    } else if (!isApi) {
      init = { cf: { cacheKey: url.pathname } } as RequestInit;
    }
    return ctx.exports.Backend.fetch(request, init);
  },
};
