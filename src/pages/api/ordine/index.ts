/**
 * POST /api/ordine: sends one order by email.
 *
 * Order of answers (the first failing check wins):
 *   405 method_not_allowed (any method but POST)
 *   503 not_configured (Resend key or Turnstile secret unset, outside dev)
 *   400 too_large, bad_request, empty_bag, too_many_lines, bad_lines, invalid, turnstile
 *   502 turnstile_unavailable (siteverify unreachable)
 *   502 catalogue_unavailable (CDA read failed)
 *   409 nothing_orderable (every line dropped)
 *   502 send_failed (the mail to the shop failed)
 *   200 { ok, copySent, lines, copies, shipping, shippingKind, total, dropped }
 *
 * The client sends only book ids and quantities: titles and prices are rebuilt
 * from the published catalogue, so a tampered bag never reaches the email.
 * Error bodies carry codes only. Nothing personal is ever logged: one line per
 * answer with the status, the code and counts. In dev with no Resend key the
 * email text goes to the console instead of the network.
 *
 * It does not use `src/pages/api/utils.ts` (CORS `*` and error echo do not fit
 * a form endpoint) nor the Workers runtime module (breaks the Vercel build). It sets
 * `cache-control: private, no-store` itself, so the check also holds in dev.
 */
import type { APIRoute } from 'astro';
import { RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { executeQuery } from '~/lib/datocms/executeQuery';
import { getAuthorDisplayName } from '~/lib/authors';
import {
  ORDER_ACTION,
  ORDER_BODY_MAX_BYTES,
  ORDER_EMAIL,
  ORDER_FROM,
  checkSiteverify,
  orderEmail,
  orderTotals,
  parseOrderRequest,
  rebuildOrder,
  type OrderBook,
  type OrderErrorCode,
  type OrderFieldKey,
  type OrderResponse,
  type ShippingKind,
} from '~/lib/order';
import { ORDER_BOOKS_QUERY, type OrderBooksQueryResult } from './_graphql';

export const prerender = false;

const LOG = '[ordine]';
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';
// Cloudflare's always-pass test secret, used only in dev when no secret is set.
const DEV_TURNSTILE_SECRET = '1x0000000000000000000000000000000AA';
const TEST_SECRET = /^\dx0+AA$/;
const ITEM_ID = /^[A-Za-z0-9_-]{22}$/;

function reply(body: OrderResponse, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'private, no-store',
      ...headers,
    },
  });
}

function fail(status: number, error: OrderErrorCode, fields?: OrderFieldKey[]): Response {
  console.warn(`${LOG} ${status} ${error}`);
  return reply(fields ? { ok: false, error, fields } : { ok: false, error }, status);
}

export const ALL: APIRoute = () => {
  console.warn(`${LOG} 405 method_not_allowed`);
  return reply({ ok: false, error: 'method_not_allowed' }, 405, { allow: 'POST' });
};

async function sendMail(
  apiKey: string,
  mail: { to: string; replyTo: string; subject: string; text: string },
): Promise<boolean> {
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: ORDER_FROM,
        to: [mail.to],
        reply_to: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const isDev = import.meta.env.DEV;
  const resendKey = RESEND_API_KEY || '';
  const turnstileSecret = TURNSTILE_SECRET_KEY || (isDev ? DEV_TURNSTILE_SECRET : '');

  // 1. Config: fail closed outside dev.
  if (!turnstileSecret || (!resendKey && !isDev)) return fail(503, 'not_configured');

  // 2. Size: the declared length first, then the real bytes.
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > ORDER_BODY_MAX_BYTES) return fail(400, 'too_large');
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(400, 'bad_request');
  }
  if (new TextEncoder().encode(raw).length > ORDER_BODY_MAX_BYTES) return fail(400, 'too_large');

  // 3. JSON.
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, 'bad_request');
  }

  // 4. Shape and fields.
  const parsed = parseOrderRequest(json);
  if (!parsed.ok) return fail(400, parsed.error, parsed.fields);
  const { order } = parsed;

  // 5. Turnstile.
  let verdict: unknown;
  try {
    const form = new URLSearchParams({ secret: turnstileSecret, response: order.turnstileToken });
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) form.set('remoteip', ip);
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return fail(502, 'turnstile_unavailable');
    verdict = await res.json();
  } catch {
    return fail(502, 'turnstile_unavailable');
  }
  const lenient = isDev && TEST_SECRET.test(turnstileSecret);
  if (
    !checkSiteverify(verdict, {
      hostname: new URL(request.url).hostname,
      action: ORDER_ACTION,
      lenient,
    })
  )
    return fail(400, 'turnstile');

  // 6. Rebuild the lines from the published catalogue.
  let books: OrderBook[];
  try {
    // The CDA rejects the whole query on a value that is not an ItemId (22 characters),
    // so other ids are not sent: they simply come back as dropped lines.
    const ids = order.lines.map((l) => l.id).filter((id) => ITEM_ID.test(id));
    const data =
      ids.length > 0
        ? await executeQuery<OrderBooksQueryResult>(ORDER_BOOKS_QUERY, {
            variables: { ids },
            includeDrafts: false,
          })
        : { allBooks: [] };
    books = data.allBooks.map((b) => ({
      id: b.id,
      title: b.title ?? '',
      slug: b.slug ?? '',
      price: b.price,
      format: b.format,
      archive: b.archive,
      authors: b.authors.map((a) => getAuthorDisplayName(a, '')).filter((n) => n.length > 0),
    }));
  } catch {
    return fail(502, 'catalogue_unavailable');
  }
  const { lines, dropped } = rebuildOrder(order.lines, books);
  if (lines.length === 0) return fail(409, 'nothing_orderable');

  // 7. Totals and email.
  const shippingKind = order.shipping as ShippingKind;
  const totals = orderTotals(lines, shippingKind);
  const data = { order, lines, totals };
  const shopMail = orderEmail(data, 'shop');
  const visitorMail = orderEmail(data, 'visitor');

  let copySent: boolean;
  if (resendKey) {
    const shopSent = await sendMail(resendKey, {
      to: ORDER_EMAIL,
      replyTo: order.email,
      ...shopMail,
    });
    if (!shopSent) return fail(502, 'send_failed');
    copySent = await sendMail(resendKey, {
      to: order.email,
      replyTo: ORDER_EMAIL,
      ...visitorMail,
    });
  } else {
    // Dev with no key: print the texts instead of sending them.
    console.log(`${LOG} (dev) to ${ORDER_EMAIL}\n${shopMail.subject}\n\n${shopMail.text}`);
    console.log(`${LOG} (dev) to ${order.email}\n${visitorMail.subject}\n\n${visitorMail.text}`);
    copySent = true;
  }

  // 8. Answer.
  console.log(`${LOG} 200 ok lines=${lines.length} dropped=${dropped.length} copySent=${copySent}`);
  return reply(
    {
      ok: true,
      copySent,
      lines: lines.map(({ id, title, qty, priceCents, amountCents }) => ({
        id,
        title,
        qty,
        priceCents,
        amountCents,
      })),
      copies: totals.copies,
      shipping: totals.shipping,
      shippingKind,
      total: totals.total,
      dropped,
    },
    200,
  );
};
