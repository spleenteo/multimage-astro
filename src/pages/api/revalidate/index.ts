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
import { getRevalidationUrls } from '~/lib/datocms/revalidationUrls';
import { parseWebhookPayload } from '~/lib/datocms/webhookPayload';
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

const CHUNK_SIZE = 20;
const CHUNK_PAUSE_MS = 250;

export const OPTIONS: APIRoute = () => new Response('OK', withCORS());

async function revalidateUrls(urls: string[], baseUrl: string, bypassToken: string) {
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

  return { success, failures };
}

export const POST: APIRoute = async ({ url, request }) => {
  const token = url.searchParams.get('token');
  if (token !== SECRET_API_TOKEN) {
    return invalidRequestResponse('Invalid token', 401);
  }

  const bypassToken = BYPASS_TOKEN;
  if (!bypassToken) {
    return invalidRequestResponse('BYPASS_TOKEN is not configured', 500);
  }

  const baseUrl = (PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  if (!baseUrl) {
    return invalidRequestResponse('PUBLIC_SITE_URL is not configured', 500);
  }

  const start = Date.now();
  // Full sweep is opt-in via ?mode=full (manual maintenance / emergency).
  const fullMode = url.searchParams.get('mode') === 'full';

  // Surgical mode: parse the webhook payload (ignored if absent/invalid).
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  let urls: string[];
  let mode: 'full' | 'surgical';

  if (fullMode) {
    mode = 'full';
    try {
      urls = await getAllPublicUrls();
    } catch (error) {
      return handleUnexpectedError(error);
    }
  } else {
    mode = 'surgical';
    const { eventType, apiKey, slug } = parseWebhookPayload(payload);

    if (!apiKey) {
      // Unknown / unparseable payload: no-op rather than re-rendering the site.
      console.log(
        `[revalidate] No model api_key in payload (event: ${eventType ?? 'n/a'}); nothing to do. Use ?mode=full to force a full sweep.`,
      );
      return json({ mode, eventType, revalidated: 0, urls: [], noop: true }, withCORS());
    }

    try {
      urls = await getRevalidationUrls({ apiKey, slug });
    } catch (error) {
      return handleUnexpectedError(error);
    }

    if (urls.length === 0) {
      console.log(`[revalidate] Model "${apiKey}" is not mapped to any URL; nothing to do.`);
      return json({ mode, eventType, apiKey, revalidated: 0, urls: [], noop: true }, withCORS());
    }

    console.log(
      `[revalidate] Surgical (event: ${eventType ?? 'n/a'}, model: ${apiKey}, slug: ${slug ?? 'n/a'}) → ${urls.length} URLs: ${urls.join(', ')}`,
    );
  }

  if (mode === 'full') {
    console.log(`[revalidate] Full sweep of ${urls.length} URLs`);
  }

  const { success, failures } = await revalidateUrls(urls, baseUrl, bypassToken);
  const reindexed = await reindexSiteSearch();

  const elapsedMs = Date.now() - start;
  console.log(
    `[revalidate] Done (${mode}). ${success} ok, ${failures} failed, total ${urls.length} URLs in ${elapsedMs}ms (search reindex: ${reindexed})`,
  );

  return json(
    { mode, total: urls.length, success, failures, elapsedMs, reindexed, urls },
    withCORS(),
  );
};
