/**
 * POST /api/evento: one bag counter event (add, start, emptied) into Workers Analytics Engine.
 *
 * Aggregate counters only: the body carries the event, the book slug and the button's place, never
 * a visitor identifier; nothing is read from or set on the visitor (no cookie, IP not written).
 * Rules in `~/lib/bag-events`. Answers 204 with no body whatever happens to the write (a lost
 * event only lowers a counter), 400 on a bad body, 403 on a foreign Origin, 405 on other methods.
 * Without the binding (plain dev, Vercel build) the event is accepted and dropped.
 */
import type { APIRoute } from 'astro';
import { getBagEvents } from '~/lib/cloudflare-bindings';
import { BAG_EVENT_MAX_BYTES, bagDataPoint, parseBagEvent } from '~/lib/bag-events';

export const prerender = false;

const headers = { 'cache-control': 'private, no-store' };

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { ...headers, allow: 'POST' } });

export const POST: APIRoute = async ({ request }) => {
  // Same-site sends only: a browser always sets Origin on this POST.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return new Response(null, { status: 403, headers });
  }
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > BAG_EVENT_MAX_BYTES) {
    return new Response(null, { status: 400, headers });
  }
  let payload;
  try {
    const raw = await request.text();
    if (raw.length > BAG_EVENT_MAX_BYTES) return new Response(null, { status: 400, headers });
    payload = parseBagEvent(JSON.parse(raw));
  } catch {
    payload = null;
  }
  if (!payload) return new Response(null, { status: 400, headers });

  try {
    getBagEvents()?.writeDataPoint(bagDataPoint(payload.e, { slug: payload.s, place: payload.p }));
  } catch {
    // never fail the visitor over a counter
  }
  return new Response(null, { status: 204, headers });
};
