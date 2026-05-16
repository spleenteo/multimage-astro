import type { APIRoute } from 'astro';
import { SECRET_API_TOKEN, BYPASS_TOKEN } from 'astro:env/server';
import { PUBLIC_SITE_URL } from 'astro:env/client';
import { getAllPublicUrls } from '~/lib/datocms/publicUrls';
import { handleUnexpectedError, invalidRequestResponse, json, withCORS } from '../utils';

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

  const elapsedMs = Date.now() - start;
  console.log(
    `[revalidate] Done. ${success} ok, ${failures} failed, total ${urls.length} URLs in ${elapsedMs}ms`,
  );

  return json({ total: urls.length, success, failures, elapsedMs }, withCORS());
};
