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
 *   400 invalid (fee not in the published CMS record)
 *   502 save_failed (not saved and the notification failed or has no binding)
 *   200 { ok, code, notified, fee: { label, amountCents }, causale, collabToken }
 *
 * D1 is the record, the email a notification: saved and mail failed (or no mail
 * binding) is still 200 with `notified: false` and the row marked `failed` or
 * `skipped`; not saved but mailed is 200 too (the email carries the whole request).
 * The sign-up carries no payment method and no areas (the confirmation and the collaboration step
 * cover them). The 200 answer returns `collabToken`, a fresh 128-bit token whose SHA-256 is the only
 * form stored (`collab_token_hash`); it never goes in emails, logs or the causale. The client sends only the fee id: label and amount are read from the published
 * CMS, never from the client. `fee.label` in the answer is `membershipFeeLabel` ("10 € — Studente
 * under 25"), the text the page shows. Error bodies carry codes only. Nothing personal is ever
 * logged: one line per answer with the status, the code and counts. Bindings come only through
 * `~/lib/cloudflare-bindings`; with none (plain dev) dev prints the email text to the console and
 * answers 200 with `notified: true` and a code that is not saved.
 *
 * Collaboration branch: a JSON body with a string `code` is the optional second step
 * `{ code, token, areas, areasOther }` (the token is the one the sign-up answer returned). Order:
 *   400 bad_request / invalid (parseCollaborationUpdate), then 404 not_found when the host is not
 *   www.multimage.org or multimage.org (localhost only in dev), then a read-only D1 SELECT that
 *   matches code + SHA-256(token) + the guards (404 not_found, no hint which guard failed), then
 *   ONE published CMS read (502 cms_unavailable) and resolveMembershipAreas (400 invalid, areas),
 *   then the atomic one-shot UPDATE (404 not_found if it lost a race), then the email to info@
 *   (reply-to the applicant) and 200 { ok, notified }. The SELECT comes first so a non-matching
 *   token never costs a CMS read and ids are validated before anything is written; the UPDATE
 *   stays the one-shot guard. No Turnstile (the token is the proof). Without D1, dev prints the
 *   email (areas and code only, no applicant data) and answers 200; production answers 503.
 *   The token never appears in emails, logs or answers. Logs: `[socio] 200 collabora areas=<n>
 *   notified=<bool>` and `[socio] 404 not_found`.
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
  COLLABORATION_WINDOW_MS,
  type CollaborationResponse,
  type MembershipErrorCode,
  type MembershipFieldKey,
  type MembershipResponse,
} from '~/lib/membership';
import {
  MEMBERSHIP_BODY_MAX_BYTES,
  MEMBERSHIP_COLUMNS,
  MEMBERSHIP_TABLE,
  COLLABORATION_MATCH_SQL,
  COLLABORATION_UPDATE_SQL,
  collaborationEmail,
  hashCollabToken,
  newCollabToken,
  parseCollaborationUpdate,
  resolveMembershipAreas,
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
const NOTIFY_SQL = `UPDATE ${MEMBERSHIP_TABLE} SET notify_status = ?1, notify_error = ?2 WHERE code = ?3`;
const SITE_HOSTS = new Set(['www.multimage.org', 'multimage.org']);
const MAIL_ERROR = /^E_[A-Z0-9_]{1,60}$/;

// The send_email error code when it has the expected shape, else 'unknown': never a message.
function mailErrorCode(err: unknown): string {
  const code = typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : null;
  return typeof code === 'string' && MAIL_ERROR.test(code) ? code : 'unknown';
}

function reply(
  body: MembershipResponse | CollaborationResponse,
  status: number,
  headers: Record<string, string> = {},
) {
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

  // 3b. A body with a string `code` is the collaboration step.
  if (
    typeof json === 'object' &&
    json !== null &&
    typeof (json as { code?: unknown }).code === 'string'
  ) {
    return collaborate({ json, request, db, mail, isDev });
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

  // 6. Fee, read again from the published CMS.
  let paymentNote: string | null;
  let fees: Array<{ id: string; label: string; amount: number }>;
  try {
    const data = await executeQuery<MembershipRequestQueryResult>(MEMBERSHIP_REQUEST_QUERY, {
      includeDrafts: false,
    });
    if (!data.membership) return fail(502, 'cms_unavailable');
    paymentNote = data.membership.paymentNote;
    fees = data.membership.fees
      .filter((f) => f.id && f.label && typeof f.amount === 'number')
      .map((f) => ({ id: f.id, label: f.label as string, amount: f.amount as number }));
  } catch {
    return fail(502, 'cms_unavailable');
  }
  const resolved = resolveMembershipChoices(req, { fees });
  if (!resolved.ok) return fail(400, 'invalid', resolved.fields);
  const { choices } = resolved;

  // 7. Code, save, notify.
  const at = new Date();
  // The collaboration token: only its hash is stored; the clear token goes back in the answer.
  const collab = await newCollabToken();
  let code = membershipCode(at, crypto.getRandomValues(new Uint8Array(4)));
  let saved = false;
  let notified = false;
  let notifyError: string | null = null;

  if (db) {
    const r = await saveWithCodeRetry(
      (c) =>
        db
          .prepare(INSERT_SQL)
          .bind(
            ...membershipRow({ request: req, choices, code: c, at, collabTokenHash: collab.hash }),
          )
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
    console.log(`${LOG} 200 ok (dev)`);
  } else {
    console.log(
      `${LOG} 200 ok saved=${saved} notified=${notified}${notifyError ? ` notify_error=${notifyError}` : ''}`,
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
      collabToken: collab.token,
    },
    200,
  );
};

type Db = NonNullable<ReturnType<typeof getOrderDb>>;
type Mail = NonNullable<ReturnType<typeof getMembershipMail>>;

function notFound(): Response {
  return fail(404, 'not_found');
}

async function collaborate(ctx: {
  json: unknown;
  request: Request;
  db: Db | null;
  mail: Mail | null;
  isDev: boolean;
}): Promise<Response> {
  const { json, request, db, mail, isDev } = ctx;
  const parsed = parseCollaborationUpdate(json);
  if (!parsed.ok) return fail(400, parsed.error, parsed.fields);
  const { code, token, areas: ids, areasOther } = parsed.update;

  // Same answer as an unknown code: the step exists only on the site's own hosts.
  let host = '';
  try {
    host = new URL(request.url).hostname;
  } catch {
    // leave empty
  }
  if (!SITE_HOSTS.has(host) && !(isDev && (host === 'localhost' || host === '127.0.0.1')))
    return notFound();

  if (!db && !isDev) return fail(503, 'not_configured');

  const cutoff = () => new Date(Date.now() - COLLABORATION_WINDOW_MS).toISOString();
  const hash = await hashCollabToken(token);

  // Read-only match first: a wrong token costs no CMS read and nothing is written.
  if (db) {
    try {
      const hit = await db.prepare(COLLABORATION_MATCH_SQL).bind(code, hash, cutoff()).first();
      if (!hit) return notFound();
    } catch {
      console.error(`${LOG} collaboration_error`);
      return fail(502, 'save_failed');
    }
  }

  // Area ids are checked against the published CMS before they are written.
  let cmsAreas: Array<{ id: string; label: string }>;
  try {
    const data = await executeQuery<MembershipRequestQueryResult>(MEMBERSHIP_REQUEST_QUERY, {
      includeDrafts: false,
    });
    if (!data.membership) return fail(502, 'cms_unavailable');
    cmsAreas = data.membership.collaborationAreas
      .filter((a) => a.id && a.label)
      .map((a) => ({ id: a.id, label: a.label as string }));
  } catch {
    return fail(502, 'cms_unavailable');
  }
  const resolved = resolveMembershipAreas(ids, cmsAreas);
  if (!resolved.ok) return fail(400, 'invalid', ['areas']);
  const areas = resolved.areas;

  let notified = false;
  if (!db) {
    // Plain dev: areas and code only, no applicant data.
    const { subject, text } = collaborationEmail({ code, areas, areasOther });
    console.log(`${LOG} (dev) to ${MEMBERSHIP_EMAIL}\n${subject}\n\n${text}`);
    notified = true;
  } else {
    let applicant: { email: string; first_name: string; last_name: string } | null;
    try {
      applicant = await db
        .prepare(COLLABORATION_UPDATE_SQL)
        .bind(
          code,
          hash,
          cutoff(),
          JSON.stringify(areas),
          areasOther || null,
          new Date().toISOString(),
        )
        .first<{ email: string; first_name: string; last_name: string }>();
    } catch {
      console.error(`${LOG} collaboration_error`);
      return fail(502, 'save_failed');
    }
    if (!applicant) return notFound();
    if (mail) {
      const { subject, text } = collaborationEmail({
        code,
        applicant: {
          email: applicant.email,
          firstName: applicant.first_name,
          lastName: applicant.last_name,
        },
        areas,
        areasOther,
      });
      try {
        await mail.send({
          from: { email: ORDER_FROM_ADDRESS, name: ORDER_FROM_NAME },
          to: MEMBERSHIP_EMAIL,
          replyTo: applicant.email,
          subject,
          text,
        });
        notified = true;
      } catch (err) {
        console.warn(`${LOG} collaboration_notify_error ${mailErrorCode(err)}`);
      }
    } else {
      console.warn(`${LOG} collaboration_notify_error no_binding`);
    }
  }
  console.log(`${LOG} 200 collabora areas=${areas.length} notified=${notified}`);
  return reply({ ok: true, notified }, 200);
}
