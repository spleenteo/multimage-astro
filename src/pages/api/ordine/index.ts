/**
 * POST /api/ordine: saves one order to D1 and notifies the shop by email.
 *
 * Order of answers (the first failing check wins):
 *   405 method_not_allowed (any method but POST)
 *   503 not_configured (Turnstile secret unset, or neither ORDERS nor ORDER_MAIL bound, outside dev)
 *   400 too_large, bad_request, empty_bag, too_many_lines, bad_lines, invalid, turnstile
 *   502 turnstile_unavailable (siteverify unreachable)
 *   502 catalogue_unavailable (CDA read failed)
 *   409 nothing_orderable (every line dropped)
 *   502 save_failed (not saved and the notification failed or has no binding)
 *   200 { ok, code, notified, lines, copies, shipping, shippingKind, total, dropped }
 *
 * D1 is the record, the email a notification: saved and mail failed (or no mail
 * binding) is still 200 with `notified: false` and the row marked `failed` or
 * `skipped`; not saved but mailed is 200 too (the email carries the whole order).
 * The client sends only book ids and quantities: titles and prices are rebuilt
 * from the published catalogue, so a tampered bag never reaches D1 or the email.
 * Error bodies carry codes only. Nothing personal is ever logged: one line per
 * answer with the status, the code and counts. Bindings come only through
 * `~/lib/cloudflare-bindings`; with none (Vercel build, plain dev) dev prints the
 * email text to the console and answers 200. A code clash at insert regenerates
 * the code and retries once (`saveWithCodeRetry`), so the visitor never gets another
 * order's code.
 *
 * It does not use `src/pages/api/utils.ts` (CORS `*` and error echo do not fit
 * a form endpoint). It sets `cache-control: private, no-store` itself, so the
 * check also holds in dev.
 */
import type { APIRoute } from 'astro';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { getOrderDb, getOrderMail } from '~/lib/cloudflare-bindings';
import { executeQuery } from '~/lib/datocms/executeQuery';
import { getAuthorDisplayName } from '~/lib/authors';
import {
  ORDER_ACTION,
  ORDER_BODY_MAX_BYTES,
  ORDER_EMAIL,
  ORDER_COLUMNS,
  ORDER_FROM_ADDRESS,
  ORDER_FROM_NAME,
  checkSiteverify,
  orderCode,
  orderEmail,
  orderRow,
  orderTotals,
  parseOrderRequest,
  rebuildOrder,
  saveWithCodeRetry,
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
// Cloudflare's always-pass test secret, used only in dev when no secret is set.
const DEV_TURNSTILE_SECRET = '1x0000000000000000000000000000000AA';
const TEST_SECRET = /^\dx0+AA$/;
// DatoCMS item ids: 22 base64url characters, or digits on older records.
const ITEM_ID = /^(?:[A-Za-z0-9_-]{22}|\d{1,20})$/;
// Built once: values only ever go through bind().
const INSERT_SQL = `INSERT INTO orders (${ORDER_COLUMNS.join(', ')}) VALUES (${ORDER_COLUMNS.map((_, i) => `?${i + 1}`).join(', ')})`;
const NOTIFY_SQL = 'UPDATE orders SET notify_status = ?1, notify_error = ?2 WHERE code = ?3';
const MAIL_ERROR = /^E_[A-Z0-9_]{1,60}$/;

// The send_email error code when it has the expected shape, else 'unknown': never a message.
function mailErrorCode(err: unknown): string {
  const code = typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : null;
  return typeof code === 'string' && MAIL_ERROR.test(code) ? code : 'unknown';
}

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

function fail(
  status: number,
  error: OrderErrorCode,
  fields?: OrderFieldKey[],
  detail?: string,
): Response {
  console.warn(`${LOG} ${status} ${error}${detail ? ` ${detail}` : ''}`);
  return reply(fields ? { ok: false, error, fields } : { ok: false, error }, status);
}

export const ALL: APIRoute = () => {
  console.warn(`${LOG} 405 method_not_allowed`);
  return reply({ ok: false, error: 'method_not_allowed' }, 405, { allow: 'POST' });
};

export const POST: APIRoute = async ({ request }) => {
  const isDev = import.meta.env.DEV;
  const db = getOrderDb();
  const mail = getOrderMail();
  const turnstileSecret = TURNSTILE_SECRET_KEY || (isDev ? DEV_TURNSTILE_SECRET : '');

  // 1. Config: fail closed outside dev.
  if (!turnstileSecret || (!db && !mail && !isDev)) return fail(503, 'not_configured');

  // 2. Size: the declared length first, then the real bytes.
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > ORDER_BODY_MAX_BYTES) return fail(400, 'too_large');
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(400, 'bad_request');
  }
  // A string never has more characters than UTF-8 bytes: skip the encoder when already over.
  if (raw.length > ORDER_BODY_MAX_BYTES) return fail(400, 'too_large');
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
  const expected = { hostname: new URL(request.url).hostname, action: ORDER_ACTION, lenient };
  if (!checkSiteverify(verdict, expected)) {
    // Which check failed, for the operator: no token, no visitor data.
    const r = (typeof verdict === 'object' && verdict !== null ? verdict : {}) as Record<
      string,
      unknown
    >;
    const reason =
      r.success !== true ? 'success' : r.hostname !== expected.hostname ? 'hostname' : 'action';
    return fail(400, 'turnstile', undefined, `reason=${reason}`);
  }

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

  // 7. Totals, save, notify.
  const shippingKind = order.shipping as ShippingKind;
  const totals = orderTotals(lines, shippingKind);
  const at = new Date();
  let code = orderCode(at, crypto.getRandomValues(new Uint8Array(4)));

  let saved = false;
  let notified = false;
  let notifyError: string | null = null;

  if (db) {
    const r = await saveWithCodeRetry(
      (c) =>
        db
          .prepare(INSERT_SQL)
          .bind(...orderRow({ order, lines, totals, code: c, at }))
          .run(),
      code,
      () => orderCode(at, crypto.getRandomValues(new Uint8Array(4))),
    );
    saved = r.saved;
    code = r.code;
    // No error text: it can quote the row.
    if (r.retried) console.warn(`${LOG} code_clash`);
    if (!saved) console.error(`${LOG} save_error`);
  }
  const { subject, text } = orderEmail({ order, lines, totals, code });

  if (!db && !mail) {
    // No bindings (plain dev): print the text instead of sending it.
    if (import.meta.env.DEV) {
      console.log(`${LOG} (dev) to ${ORDER_EMAIL}\n${subject}\n\n${text}`);
    } else {
      return fail(503, 'not_configured');
    }
  } else {
    if (mail) {
      try {
        await mail.send({
          from: { email: ORDER_FROM_ADDRESS, name: ORDER_FROM_NAME },
          to: ORDER_EMAIL,
          replyTo: order.email,
          subject,
          text,
        });
        notified = true;
      } catch (err) {
        notifyError = mailErrorCode(err);
      }
    } else {
      notifyError = 'no_binding';
    }
    if (!saved && !notified) return fail(502, 'save_failed');
    if (saved) {
      try {
        await db!
          .prepare(NOTIFY_SQL)
          .bind(
            notified ? 'sent' : notifyError === 'no_binding' ? 'skipped' : 'failed',
            notifyError,
            code,
          )
          .run();
      } catch {
        console.error(`${LOG} notify_update_error`);
      }
    }
  }

  // 8. Answer.
  if (!db && !mail) {
    console.log(`${LOG} 200 ok (dev) lines=${lines.length} dropped=${dropped.length}`);
  } else {
    console.log(
      `${LOG} 200 ok lines=${lines.length} dropped=${dropped.length} saved=${saved} notified=${notified}${notifyError ? ` notify_error=${notifyError}` : ''}`,
    );
  }
  return reply(
    {
      ok: true,
      code,
      notified,
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
