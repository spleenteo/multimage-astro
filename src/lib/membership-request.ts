// Server-side helpers for a membership request: parse, code, causale, CMS choices, D1 row, email.
// Also the optional collaboration update that follows the sign-up: the per-request token
// (newCollabToken, hashCollabToken), its parse, the match and update SQL, and the second email.
// Imports only `./membership` and `./order` (relative, no alias): plain `tsx` loads this file.

import {
  AREA_OTHER,
  MEMBERSHIP_LABELS,
  PAYMENT_METHODS,
  membershipFeeLabel,
  validateCollaborationFields,
  validateMembershipFields,
  type CollaborationFields,
  type MembershipErrorCode,
  type MembershipFieldKey,
  type MembershipFields,
  type PaymentMethod,
} from './membership';
import { requestCode, toCents } from './order';

export const MEMBERSHIP_BODY_MAX_BYTES = 8192;
export const MEMBERSHIP_TABLE = 'membership_requests';
export const MEMBERSHIP_CODE_PREFIX = 'SO';
export const MEMBERSHIP_CAUSALE_FALLBACK = 'Quota associativa Multimage';
const CAUSALE_MAX = 120;
const CAUSALE_BASE_MAX = 60;
const NOT_GIVEN = 'non indicato';

/** The `membership_requests` columns the site writes, in table order (`id` and `notify_error` left out). */
export const MEMBERSHIP_COLUMNS = [
  'code',
  'created_at',
  'email',
  'first_name',
  'last_name',
  'birth_date',
  'birth_place',
  'address1',
  'address2',
  'city',
  'region',
  'postcode',
  'country',
  'fee_id',
  'fee_label',
  'fee_cents',
  'payment_method',
  'areas_json',
  'areas_other',
  'consent_at',
  'notify_status',
] as const;

export type MembershipRequest = MembershipFields & { turnstileToken: string };

export type MembershipFee = { id: string; label: string; amount: number };
export type MembershipArea = { id: string; label: string };
export type MembershipChoices = {
  fee: { id: string; label: string; amount: number; cents: number };
  areas: MembershipArea[];
};

type ParseResult =
  | { ok: true; request: MembershipRequest }
  | { ok: false; error: MembershipErrorCode; fields?: MembershipFieldKey[] };

/** Form values may arrive as anything: only strings count, trimmed. */
const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Reads an untrusted JSON body into a MembershipRequest, or names the first problem. */
export function parseMembershipRequest(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    return { ok: false, error: 'bad_request' };
  const o = body as Record<string, unknown>;

  // A non-string area becomes '', which the area rule rejects as an invalid `areas`.
  const areas = Array.isArray(o.areas)
    ? [...new Set((o.areas as unknown[]).map((a) => text(a)))]
    : [];
  const fields: MembershipFields = {
    email: text(o.email),
    firstName: text(o.firstName),
    lastName: text(o.lastName),
    birthDate: text(o.birthDate),
    birthPlace: text(o.birthPlace),
    address1: text(o.address1),
    address2: text(o.address2),
    city: text(o.city),
    region: text(o.region),
    postcode: text(o.postcode),
    country: text(o.country),
    fee: text(o.fee),
    payment: text(o.payment),
    areas,
    // The free text only counts with "Altro" checked.
    areasOther: areas.includes(AREA_OTHER) ? text(o.areasOther) : '',
    consent: o.consent === true,
  };
  const errors = validateMembershipFields(fields);
  const keys = Object.keys(errors) as MembershipFieldKey[];
  if (keys.length > 0) return { ok: false, error: 'invalid', fields: keys };

  const token = o.turnstileToken;
  if (typeof token !== 'string' || token.length < 1 || token.length > 2048)
    return { ok: false, error: 'turnstile' };

  return { ok: true, request: { ...fields, turnstileToken: token } };
}

/** `SO-YYMMDD-XXXX`, the code of a membership request. */
export function membershipCode(at: Date, random: Uint8Array): string {
  return requestCode(MEMBERSHIP_CODE_PREFIX, at, random);
}

/**
 * The payment reason: the first non-empty line of the CMS payment note (capped at 60 characters),
 * then the code whole, then as much of the name as fits in 120 characters.
 */
export function membershipCausale(
  paymentNote: string | null | undefined,
  code: string,
  firstName: string,
  lastName: string,
): string {
  const line = (paymentNote ?? '')
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .find((l) => l !== '');
  const base = (line || MEMBERSHIP_CAUSALE_FALLBACK).slice(0, CAUSALE_BASE_MAX).trim();
  const head = `${base} ${code}`;
  const room = CAUSALE_MAX - head.length - 1;
  const names = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim().slice(0, Math.max(0, room));
  return (names ? `${head} ${names}` : head).trim();
}

/** The areas named by id, resolved against the published CMS ones; "Altro" is always known. Pure. */
export function resolveMembershipAreas(
  ids: string[],
  cmsAreas: MembershipArea[],
): { ok: true; areas: MembershipArea[] } | { ok: false } {
  const areas: MembershipArea[] = [];
  let ok = true;
  for (const id of ids) {
    if (id === AREA_OTHER) {
      areas.push({ id: AREA_OTHER, label: 'Altro' });
      continue;
    }
    const area = cmsAreas.find((a) => a.id === id);
    if (area) areas.push({ id: area.id, label: area.label });
    else ok = false;
  }
  return ok ? { ok: true, areas } : { ok: false };
}

/** The fee and areas the applicant named, read again from the published CMS; an unknown id is invalid. */
export function resolveMembershipChoices(
  request: Pick<MembershipRequest, 'fee' | 'areas'>,
  cms: { fees: MembershipFee[]; areas: MembershipArea[] },
): { ok: true; choices: MembershipChoices } | { ok: false; fields: MembershipFieldKey[] } {
  const fields: MembershipFieldKey[] = [];
  const fee = cms.fees.find((f) => f.id === request.fee);
  if (!fee || !Number.isFinite(fee.amount) || fee.amount < 0) fields.push('fee');

  const resolved = resolveMembershipAreas(request.areas, cms.areas);
  if (!resolved.ok) fields.push('areas');
  const areas = resolved.ok ? resolved.areas : [];

  if (fields.length > 0 || !fee) return { ok: false, fields };
  return {
    ok: true,
    choices: {
      fee: { id: fee.id, label: fee.label, amount: fee.amount, cents: toCents(fee.amount) },
      areas,
    },
  };
}

/** The values of one `membership_requests` row, in `MEMBERSHIP_COLUMNS` order; empty optionals are NULL. */
export function membershipRow(data: {
  request: MembershipRequest;
  choices: MembershipChoices;
  code: string;
  at: Date;
}): Array<string | number | null> {
  const { request: r, choices, code, at } = data;
  const time = at.toISOString();
  return [
    code,
    time,
    r.email,
    r.firstName,
    r.lastName,
    r.birthDate,
    r.birthPlace,
    r.address1,
    r.address2 || null,
    r.city,
    r.region || null,
    r.postcode,
    r.country,
    choices.fee.id,
    choices.fee.label,
    choices.fee.cents,
    r.payment,
    JSON.stringify(choices.areas),
    (r.areas.includes(AREA_OTHER) ? r.areasOther : '') || null,
    time,
    'pending',
  ];
}

/** The plain-text email for the association, with every field of the request. */
export function membershipEmail(data: {
  request: MembershipRequest;
  choices: MembershipChoices;
  code: string;
  causale: string;
  at: Date;
}): { subject: string; text: string } {
  const { request: r, choices, code, causale, at } = data;
  const L = MEMBERSHIP_LABELS;
  const opt = (v: string): string => v || NOT_GIVEN;
  const other = r.areas.includes(AREA_OTHER) ? r.areasOther : '';

  const subject = `Richiesta socio ${code} · ${r.firstName} ${r.lastName}`;
  const out = [
    `Nuova richiesta di adesione dal sito: ${code}.`,
    '',
    `${L.email}: ${r.email}`,
    `${L.firstName}: ${r.firstName}`,
    `${L.lastName}: ${r.lastName}`,
    `${L.birthDate}: ${r.birthDate}`,
    `${L.birthPlace}: ${r.birthPlace}`,
    `${L.address1}: ${r.address1}`,
    `${L.address2}: ${opt(r.address2)}`,
    `${L.city}: ${r.city}`,
    `${L.region}: ${opt(r.region)}`,
    `${L.postcode}: ${r.postcode}`,
    `${L.country}: ${r.country}`,
    '',
    `${L.fee}: ${membershipFeeLabel({ label: choices.fee.label, amount: choices.fee.amount })}`,
    `${L.payment}: ${PAYMENT_METHODS[r.payment as PaymentMethod]}`,
    `Causale: ${causale}`,
    '',
    `${L.areas}: ${choices.areas.length > 0 ? choices.areas.map((a) => a.label).join(', ') : NOT_GIVEN}`,
    `${L.areasOther}: ${opt(other)}`,
    '',
    `${L.consent}: sì, il ${at.toISOString()}`,
  ];
  return { subject, text: out.join('\n') };
}

const CODE_PATTERN = /^SO-\d{6}-[2-9A-HJ-NP-Z]{4}$/;
/** 16 bytes in base64url without padding: 22 characters, the last one carries 2 bits. */
const COLLAB_TOKEN_PATTERN = /^[A-Za-z0-9_-]{21}[AQgw]$/;

export type CollaborationUpdate = CollaborationFields & { code: string; token: string };

/** Reads an untrusted collaboration body `{ code, token, areas, areasOther }`. */
export function parseCollaborationUpdate(
  body: unknown,
):
  | { ok: true; update: CollaborationUpdate }
  | { ok: false; error: MembershipErrorCode; fields?: MembershipFieldKey[] } {
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    return { ok: false, error: 'bad_request' };
  const o = body as Record<string, unknown>;
  const code = text(o.code);
  const token = typeof o.token === 'string' ? o.token : '';
  if (!CODE_PATTERN.test(code) || !COLLAB_TOKEN_PATTERN.test(token))
    return { ok: false, error: 'bad_request' };

  const areas = Array.isArray(o.areas)
    ? [...new Set((o.areas as unknown[]).map((a) => text(a)))]
    : [];
  const fields: CollaborationFields = {
    areas,
    areasOther: areas.includes(AREA_OTHER) ? text(o.areasOther) : '',
  };
  const errors = validateCollaborationFields(fields);
  const keys = Object.keys(errors) as MembershipFieldKey[];
  if (keys.length > 0) return { ok: false, error: 'invalid', fields: keys };
  return { ok: true, update: { code, token, ...fields } };
}

/** SHA-256 of the token, lower-case hex: the only form D1 stores. */
export async function hashCollabToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** A fresh 128-bit collaboration token (base64url, 22 characters) and its SHA-256 hex. Web Crypto only. */
export async function newCollabToken(): Promise<{ token: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const token = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { token, hash: await hashCollabToken(token) };
}

/**
 * The guards shared by the collaboration match and update, so they cannot drift. Bind order, the
 * same in both statements: ?1 code, ?2 collab_token_hash (SHA-256 hex of the token), ?3 cutoff
 * (ISO, now minus COLLABORATION_WINDOW_MS).
 */
const COLLABORATION_WHERE =
  'WHERE code=?1 AND collab_token_hash=?2 AND collaboration_at IS NULL AND created_at >= ?3 ' +
  'AND email IS NOT NULL';

/** Read-only check that a request matches code + token + guards. Bind ?1 code, ?2 hash, ?3 cutoff; use `.first()`. */
export const COLLABORATION_MATCH_SQL = `SELECT 1 AS ok FROM ${MEMBERSHIP_TABLE} ${COLLABORATION_WHERE}`;

/**
 * The one-shot collaboration update. Bind order: ?1 code, ?2 collab_token_hash, ?3 cutoff (the
 * shared guards), then ?4 areas_json, ?5 areas_other, ?6 collaboration_at (ISO now). Run it with
 * `.first()`: a row means it matched; null covers an unknown, wrong-token, expired, already-sent
 * or erased request alike.
 */
export const COLLABORATION_UPDATE_SQL =
  `UPDATE ${MEMBERSHIP_TABLE} SET areas_json=?4, areas_other=?5, collaboration_at=?6 ` +
  `${COLLABORATION_WHERE} RETURNING email, first_name, last_name`;

/** The second plain-text email for the association. Without `applicant` (dev print) no personal data is written. */
export function collaborationEmail(data: {
  code: string;
  applicant?: { email: string; firstName: string; lastName: string } | null;
  areas: MembershipArea[];
  areasOther: string;
}): { subject: string; text: string } {
  const { code, applicant, areas, areasOther } = data;
  const L = MEMBERSHIP_LABELS;
  const other = areas.some((a) => a.id === AREA_OTHER) ? areasOther : '';
  const subject = applicant
    ? `Collaborazione socio ${code} · ${applicant.firstName} ${applicant.lastName}`
    : `Collaborazione socio ${code}`;
  const out = [`Preferenze di collaborazione per la richiesta ${code}.`, ''];
  if (applicant) out.push(`${L.email}: ${applicant.email}`, '');
  out.push(
    `${L.areas}: ${areas.length > 0 ? areas.map((a) => a.label).join(', ') : NOT_GIVEN}`,
    `${L.areasOther}: ${other || NOT_GIVEN}`,
  );
  return { subject, text: out.join('\n') };
}
