/**
 * POST /api/socio: saves one membership request ("Diventa socio") to D1 and notifies the
 * association by email.
 *
 * Order of answers (the first failing check wins):
 *   405 method_not_allowed (any method but POST)
 *   503 not_configured (Turnstile secret unset, or neither ORDERS nor MEMBERSHIP_MAIL bound, outside dev)
 *   400 too_large, bad_request, invalid (with `fields`), turnstile
 *   502 turnstile_unavailable (siteverify unreachable)
 *   502 cms_unavailable (CDA read failed or no published membership record)
 *   400 invalid (fee or an area not in the published CMS record)
 *   502 save_failed (not saved and the notification failed or has no binding)
 *   200 { ok, code, notified, fee: { label, amountCents }, causale }
 *
 * D1 is the record, the email a notification: saved and mail failed (or no mail
 * binding) is still 200 with `notified: false`; not saved but mailed is 200 too (the email carries the whole request).
 * One send, one row, one email: the insert is the only write (mail failures live in the Worker
 * logs, with the request code). The client sends only the fee id and the area ids: labels and
 * amount are read from the published CMS, never from the client.
 * `fee.label` in the answer is `membershipFeeLabel` ("10 € — Studentessa o studente under 25"),
 * the text the page shows. Error bodies carry codes only. Nothing personal is ever
 * logged: one line per answer with the status, the code and counts. Bindings come only through
 * `~/lib/cloudflare-bindings`; with none (plain dev) dev prints the email text to the console and
 * answers 200 with `notified: true` and a code that is not saved.
 *
 * It does not use `src/pages/api/utils.ts` (CORS `*` and error echo do not fit a form
 * endpoint). It sets `cache-control: private, no-store` itself, so the check also holds in dev.
 */
import type { APIRoute } from 'astro';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { getMembershipMail, getOrderDb } from '~/lib/cloudflare-bindings';
import { executeQuery } from '~/lib/datocms/executeQuery';
import {
  MEMBERSHIP_ACTION,
  MEMBERSHIP_EMAIL,
  membershipFeeLabel,
  type MembershipErrorCode,
  type MembershipFieldKey,
  type MembershipResponse,
} from '~/lib/membership';
import {
  MEMBERSHIP_BODY_MAX_BYTES,
  MEMBERSHIP_COLUMNS,
  MEMBERSHIP_TABLE,
  membershipCausale,
  membershipCode,
  membershipEmail,
  membershipRow,
  parseMembershipRequest,
  resolveMembershipChoices,
} from '~/lib/membership-request';
import { ORDER_FROM_ADDRESS, ORDER_FROM_NAME, saveWithCodeRetry } from '~/lib/order';
import { turnstileSecret, verifyTurnstile } from '~/lib/turnstile';
import { MEMBERSHIP_REQUEST_QUERY, type MembershipRequestQueryResult } from './_graphql';

export const prerender = false;

const LOG = '[socio]';
// Built once: values only ever go through bind().
const INSERT_SQL = `INSERT INTO ${MEMBERSHIP_TABLE} (${MEMBERSHIP_COLUMNS.join(', ')}) VALUES (${MEMBERSHIP_COLUMNS.map((_, i) => `?${i + 1}`).join(', ')})`;
const MAIL_ERROR = /^E_[A-Z0-9_]{1,60}$/;

// The send_email error code when it has the expected shape, else 'unknown': never a message.
function mailErrorCode(err: unknown): string {
  const code = typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : null;
  return typeof code === 'string' && MAIL_ERROR.test(code) ? code : 'unknown';
}

function reply(body: MembershipResponse, status: number, headers: Record<string, string> = {}) {
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
  error: MembershipErrorCode,
  fields?: MembershipFieldKey[],
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
  const mail = getMembershipMail();
  const secret = turnstileSecret(TURNSTILE_SECRET_KEY, isDev);

  // 1. Config: fail closed outside dev.
  if (!secret || (!db && !mail && !isDev)) return fail(503, 'not_configured');

  // 2. Size: the declared length first, then the real bytes.
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MEMBERSHIP_BODY_MAX_BYTES)
    return fail(400, 'too_large');
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(400, 'bad_request');
  }
  // A string never has more characters than UTF-8 bytes: skip the encoder when already over.
  if (raw.length > MEMBERSHIP_BODY_MAX_BYTES) return fail(400, 'too_large');
  if (new TextEncoder().encode(raw).length > MEMBERSHIP_BODY_MAX_BYTES)
    return fail(400, 'too_large');

  // 3. JSON.
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, 'bad_request');
  }

  // 4. Shape and fields.
  const parsed = parseMembershipRequest(json);
  if (!parsed.ok) return fail(400, parsed.error, parsed.fields);
  const { request: req } = parsed;

  // 5. Turnstile.
  const turnstile = await verifyTurnstile({
    secret,
    token: req.turnstileToken,
    request,
    action: MEMBERSHIP_ACTION,
    isDev,
  });
  if (!turnstile.ok) {
    return fail(
      turnstile.status,
      turnstile.error,
      undefined,
      turnstile.reason ? `reason=${turnstile.reason}` : undefined,
    );
  }

  // 6. Fee and areas, read again from the published CMS.
  let paymentNote: string | null;
  let fees: Array<{ id: string; label: string; amount: number }>;
  let areas: Array<{ id: string; label: string }>;
  try {
    const data = await executeQuery<MembershipRequestQueryResult>(MEMBERSHIP_REQUEST_QUERY, {
      includeDrafts: false,
    });
    if (!data.membership) return fail(502, 'cms_unavailable');
    paymentNote = data.membership.paymentNote;
    fees = data.membership.fees
      .filter((f) => f.id && f.label && typeof f.amount === 'number')
      .map((f) => ({ id: f.id, label: f.label as string, amount: f.amount as number }));
    areas = data.membership.collaborationAreas
      .filter((a) => a.id && a.label)
      .map((a) => ({ id: a.id, label: a.label as string }));
  } catch {
    return fail(502, 'cms_unavailable');
  }
  const resolved = resolveMembershipChoices(req, { fees, areas });
  if (!resolved.ok) return fail(400, 'invalid', resolved.fields);
  const { choices } = resolved;

  // 7. Code, save, notify.
  const at = new Date();
  let code = membershipCode(at, crypto.getRandomValues(new Uint8Array(4)));
  let saved = false;
  let notified = false;
  let notifyError: string | null = null;

  if (db) {
    const r = await saveWithCodeRetry(
      (c) =>
        db
          .prepare(INSERT_SQL)
          .bind(...membershipRow({ request: req, choices, code: c, at }))
          .run(),
      code,
      () => membershipCode(at, crypto.getRandomValues(new Uint8Array(4))),
      MEMBERSHIP_TABLE,
    );
    saved = r.saved;
    code = r.code;
    // No error text: it can quote the row.
    if (r.retried) console.warn(`${LOG} code_clash`);
    if (!saved) console.error(`${LOG} save_error`);
  }
  const causale = membershipCausale(paymentNote, code, req.firstName, req.lastName);
  const { subject, text } = membershipEmail({ request: req, choices, code, causale, at });

  if (!db && !mail) {
    // No bindings (plain dev): print the text instead of sending it.
    if (import.meta.env.DEV) {
      console.log(`${LOG} (dev) to ${MEMBERSHIP_EMAIL}\n${subject}\n\n${text}`);
      notified = true;
    } else {
      return fail(503, 'not_configured');
    }
  } else {
    if (mail) {
      try {
        await mail.send({
          from: { email: ORDER_FROM_ADDRESS, name: ORDER_FROM_NAME },
          to: MEMBERSHIP_EMAIL,
          replyTo: req.email,
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
  }

  // 8. Answer.
  if (!db && !mail) {
    console.log(`${LOG} 200 ok (dev)`);
  } else {
    console.log(
      `${LOG} 200 ok saved=${saved} notified=${notified} areas=${choices.areas.length}${notifyError ? ` notify_error=${notifyError} code=${code}` : ''}`,
    );
  }
  return reply(
    {
      ok: true,
      code,
      notified,
      fee: {
        label: membershipFeeLabel({ label: choices.fee.label, amount: choices.fee.amount }),
        amountCents: choices.fee.cents,
      },
      causale,
    },
    200,
  );
};
