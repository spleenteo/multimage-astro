/**
 * POST /api/invalidate-cache: DatoCMS cache-tags webhook receiver. Cloudflare only.
 *
 * Purges the Workers Cache entries carrying the tags in `entity.attributes.tags`
 * (plus the coarse `site` tag), then triggers the Site Search reindex.
 *
 * Why `locals.cfContext.cache.purge` and not `context.cache.invalidate` or a
 * direct import of the Workers runtime module: the Astro provider's `invalidate`
 * ignores the purge result (a failed purge would look like success, so DatoCMS
 * would not retry), and that module cannot be imported on the Vercel build.
 * `ctx.cache.purge` returns `{ success, errors }`, which this route checks.
 *
 * Free plan limits: 5 purge requests per minute (burst 25), 100 tags per call,
 * hence batches of 100 in sequence; the first failure stops the run and answers
 * 502 so DatoCMS retries. This route never calls `cache.set`.
 *
 * Order: 401 (secret unset or bearer mismatch) -> 400 (bad body) -> 503 (cache
 * not enabled, e.g. Vercel) -> purge. Logs carry counts only, never the bearer
 * or the tags.
 */
import type { APIRoute } from 'astro';
import { CACHE_INVALIDATION_WEBHOOK_SECRET } from 'astro:env/server';
import { invalidationTags, purgeInBatches, type PurgeFn } from '~/lib/datocms/cacheInvalidation';
import { reindexSiteSearch } from '~/lib/datocms/siteSearch';

export const prerender = false;

const LOG = '[invalidate-cache]';

function reply(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}

/** Constant-time string comparison (length is not secret). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const POST: APIRoute = async ({ request, locals, cache }) => {
  const secret = CACHE_INVALIDATION_WEBHOOK_SECRET;
  const bearer = /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!secret || !bearer || !safeEqual(bearer, secret)) {
    console.log(`${LOG} 401 unauthorized`);
    return reply({ error: 'Unauthorized' }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    console.log(`${LOG} 400 body is not JSON`);
    return reply({ error: 'Body is not valid JSON' }, 400);
  }
  const parsed = invalidationTags(payload);
  if (!parsed) {
    console.log(`${LOG} 400 payload has no valid entity.attributes.tags`);
    return reply({ error: 'Payload has no valid entity.attributes.tags' }, 400);
  }

  const cfCache = (locals as unknown as { cfContext?: { cache?: { purge: PurgeFn } } }).cfContext
    ?.cache;
  if (!cache.enabled || !cfCache) {
    console.log(`${LOG} 503 cache purge unavailable on this deployment`);
    return reply({ error: 'Cache purge is not available on this deployment' }, 503);
  }

  const { tags, dropped } = parsed;
  if (tags.length === 0) {
    console.log(`${LOG} 200 noop (no tags)`);
    return reply({ purged: 0, batches: 0, noop: true }, 200);
  }

  const purge: PurgeFn = (options) => cfCache.purge(options);
  const result = await purgeInBatches(tags, purge);
  if (!result.ok) {
    console.log(
      `${LOG} 502 purge failed after ${result.batches} batch(es), ${tags.length} tags, ${dropped} dropped`,
    );
    return reply({ error: 'Purge failed', batches: result.batches, errors: result.errors }, 502);
  }

  const reindexed = await reindexSiteSearch(LOG);
  console.log(
    `${LOG} 200 purged ${tags.length} tags in ${result.batches} batch(es), ${dropped} dropped, reindexed: ${reindexed}`,
  );
  return reply({ purged: tags.length, batches: result.batches, reindexed }, 200);
};
