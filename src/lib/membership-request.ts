// Server-side helpers for a membership request: parse, code, causale, CMS choices, D1 row, email.
// Imports only `./membership` and `./order` (relative, no alias): plain `tsx` loads this file.

import {
  AREA_OTHER,
  MEMBERSHIP_LABELS,
  membershipFeeLabel,
  validateMembershipFields,
  type MembershipErrorCode,
  type MembershipFieldKey,
  type MembershipFields,
} from './membership';
import { requestCode, toCents } from './order';

export const MEMBERSHIP_BODY_MAX_BYTES = 8192;
export const MEMBERSHIP_TABLE = 'membership_requests';
export const MEMBERSHIP_CODE_PREFIX = 'SO';
export const MEMBERSHIP_CAUSALE_FALLBACK = 'Quota associativa Multimage';
const CAUSALE_MAX = 120;
const CAUSALE_BASE_MAX = 60;
const NOT_GIVEN = 'non indicato';

/** The `membership_requests` columns the sign-up writes (`id`, `collaboration_at` and `notify_error` left out). */
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

/** The fee the applicant named, read again from the published CMS; an unknown id is invalid. */
export function resolveMembershipChoices(
  request: Pick<MembershipRequest, 'fee'>,
  cms: { fees: MembershipFee[] },
): { ok: true; choices: MembershipChoices } | { ok: false; fields: MembershipFieldKey[] } {
  const fields: MembershipFieldKey[] = [];
  const fee = cms.fees.find((f) => f.id === request.fee);
  if (!fee || !Number.isFinite(fee.amount) || fee.amount < 0) fields.push('fee');

  if (fields.length > 0 || !fee) return { ok: false, fields };
  return {
    ok: true,
    choices: {
      fee: { id: fee.id, label: fee.label, amount: fee.amount, cents: toCents(fee.amount) },
    },
  };
}

/**
 * The values of one `membership_requests` row, in `MEMBERSHIP_COLUMNS` order; empty optionals are
 * NULL. The sign-up carries no payment method and no areas (`payment_method` NULL, `areas_json`
 * '[]', `areas_other` NULL): the collaboration step fills the areas later.
 */
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
    null,
    '[]',
    null,
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
    `Causale: ${causale}`,
    '',
    `${L.consent}: sì, il ${at.toISOString()}`,
  ];
  return { subject, text: out.join('\n') };
}
