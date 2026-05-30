import { buildClient } from '@datocms/cma-client';
import type { APIRoute } from 'astro';
import {
  SECRET_API_TOKEN,
  BYPASS_TOKEN,
  DATOCMS_CMA_TOKEN,
  SITE_SEARCH_BUILD_TRIGGER_ID,
} from 'astro:env/server';
import { PUBLIC_SITE_URL } from 'astro:env/client';
import { getAllPublicUrls } from '~/lib/datocms/publicUrls';
import { handleUnexpectedError, invalidRequestResponse, json, withCORS } from '../utils';

/**
 * Re-spiders the DatoCMS Site Search index without a site rebuild. Best-effort:
 * a failure here must not fail the cache revalidation, so errors are logged and
 * swallowed. No-op unless both the CMA token and the build trigger id are set.
 */
async function reindexSiteSearch(): Promise<boolean> {
  if (!DATOCMS_CMA_TOKEN || !SITE_SEARCH_BUILD_TRIGGER_ID) {
    return false;
  }
  try {
    const client = buildClient({ apiToken: DATOCMS_CMA_TOKEN });
    await client.buildTriggers.reindex(SITE_SEARCH_BUILD_TRIGGER_ID);
    console.log(`[revalidate] Site Search reindex triggered (${SITE_SEARCH_BUILD_TRIGGER_ID})`);
    return true;
  } catch (error) {
    console.error('[revalidate] Site Search reindex failed:', error);
    return false;
  }
}

export const prerender = false;

const DEBOUNCE_MS = 5_000;
const CHUNK_SIZE = 20;
const CHUNK_PAUSE_MS = 250;

let lastRunAt = 0;

export const OPTIONS: APIRoute = () => new Response('OK', withCORS());

export const POST: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (token !== SECRET_API_TOKEN) {
    return invalidRequestResponse('Invalid token', 401);
  }

  const bypassToken = BYPASS_TOKEN;
  if (!bypassToken) {
    return invalidRequestResponse('BYPASS_TOKEN is not configured', 500);
  }

  const now = Date.now();
  if (now - lastRunAt < DEBOUNCE_MS) {
    const elapsed = now - lastRunAt;
    console.log(`[revalidate] Debounced (${elapsed}ms since last run)`);
    return json({ debounced: true, sinceLastMs: elapsed }, withCORS());
  }
  lastRunAt = now;

  const start = Date.now();
  let urls: string[];
  try {
    urls = await getAllPublicUrls();
  } catch (error) {
    return handleUnexpectedError(error);
  }

  const baseUrl = (PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  if (!baseUrl) {
    return invalidRequestResponse('PUBLIC_SITE_URL is not configured', 500);
  }

  console.log(`[revalidate] Starting invalidation of ${urls.length} URLs`);

  let success = 0;
  let failures = 0;

  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map((path) =>
        fetch(`${baseUrl}${path}`, {
          headers: { 'x-prerender-revalidate': bypassToken },
        }),
      ),
    );
    success += results.filter((r) => r.status === 'fulfilled').length;
    failures += results.filter((r) => r.status === 'rejected').length;

    if (i + CHUNK_SIZE < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, CHUNK_PAUSE_MS));
    }
  }

  const reindexed = await reindexSiteSearch();

  const elapsedMs = Date.now() - start;
  console.log(
    `[revalidate] Done. ${success} ok, ${failures} failed, total ${urls.length} URLs in ${elapsedMs}ms (search reindex: ${reindexed})`,
  );

  return json({ total: urls.length, success, failures, elapsedMs, reindexed }, withCORS());
};
