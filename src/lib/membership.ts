/**
 * Membership request ("Diventa socio"): field keys, rules, limits and Italian messages.
 * No imports: the client bundles this file, like `order.ts`.
 */

export const MEMBERSHIP_EMAIL = 'info@multimage.org';
export const MEMBERSHIP_ACTION = 'socio';

export const PAYMENT_METHODS = {
  bonifico: 'Bonifico bancario',
  paypal: 'PayPal',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

/** Value of the fixed "Altro" collaboration checkbox. */
export const AREA_OTHER = 'altro';

export const MEMBERSHIP_NAME_MAX = 60;
export const MEMBERSHIP_BIRTH_PLACE_MIN = 2;
export const MEMBERSHIP_BIRTH_PLACE_MAX = 100;
export const MEMBERSHIP_ADDRESS_MIN = 3;
export const MEMBERSHIP_ADDRESS_MAX = 200;
export const MEMBERSHIP_CITY_MIN = 2;
export const MEMBERSHIP_CITY_MAX = 100;
export const MEMBERSHIP_REGION_MAX = 60;
export const MEMBERSHIP_POSTCODE_MIN = 2;
export const MEMBERSHIP_POSTCODE_MAX = 12;
export const MEMBERSHIP_COUNTRY_MIN = 2;
export const MEMBERSHIP_COUNTRY_MAX = 60;
export const MEMBERSHIP_AREAS_MAX = 20;
export const MEMBERSHIP_AREAS_OTHER_MIN = 2;
export const MEMBERSHIP_AREAS_OTHER_MAX = 200;
export const MEMBERSHIP_BIRTH_DATE_MIN = '1900-01-01';

export type MembershipFieldKey =
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'birthPlace'
  | 'address1'
  | 'address2'
  | 'city'
  | 'region'
  | 'postcode'
  | 'country'
  | 'fee'
  | 'payment'
  | 'areas'
  | 'areasOther'
  | 'consent';

export interface MembershipFields {
  email: string;
  firstName: string;
  lastName: string;
  /** `YYYY-MM-DD`. */
  birthDate: string;
  birthPlace: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  /** Id of the fee block. */
  fee: string;
  /** A key of PAYMENT_METHODS. */
  payment: string;
  /** Ids of the area blocks, plus AREA_OTHER. */
  areas: string[];
  areasOther: string;
  consent: boolean;
}

export type MembershipErrorCode =
  | 'method_not_allowed'
  | 'bad_request'
  | 'too_large'
  | 'invalid'
  | 'turnstile'
  | 'turnstile_unavailable'
  | 'cms_unavailable'
  | 'save_failed'
  | 'not_configured';

export type MembershipResponse =
  | {
      ok: true;
      code: string;
      notified: boolean;
      /** The fee as the server resolved it from the CMS. */
      fee: { label: string; amountCents: number };
      payment: PaymentMethod;
      /** The payment reason to write on the transfer or the PayPal payment. */
      causale: string;
    }
  | { ok: false; error: MembershipErrorCode; fields?: MembershipFieldKey[] };

export const MEMBERSHIP_LABELS: Record<MembershipFieldKey, string> = {
  email: 'Email',
  firstName: 'Nome',
  lastName: 'Cognome',
  birthDate: 'Data di nascita',
  birthPlace: 'Luogo di nascita',
  address1: 'Indirizzo',
  address2: 'Indirizzo, seconda riga (facoltativo)',
  city: 'Città',
  region: 'Provincia (facoltativo)',
  postcode: 'CAP',
  country: 'Paese',
  fee: 'Tipo di quota',
  payment: 'Come paghi',
  areas: 'Come vuoi collaborare',
  areasOther: 'Altro: scrivi come',
  consent: 'Consenso al trattamento dei dati',
};

export const MEMBERSHIP_FIELD_MESSAGES: Record<MembershipFieldKey, string> = {
  email:
    "L'email non è completa: controlla la chiocciola e il dominio, per esempio nome@esempio.it.",
  firstName: `Scrivi il tuo nome, per esempio Ada (al massimo ${MEMBERSHIP_NAME_MAX} caratteri).`,
  lastName: `Scrivi il tuo cognome, per esempio Neri (al massimo ${MEMBERSHIP_NAME_MAX} caratteri).`,
  birthDate:
    'Scrivi la data di nascita come giorno, mese e anno, per esempio 01/05/1990: non può essere futura.',
  birthPlace: 'Scrivi il luogo di nascita, per esempio Firenze.',
  address1: 'Scrivi via e numero civico, per esempio Via Roma 1.',
  address2: `La seconda riga dell'indirizzo supera i ${MEMBERSHIP_ADDRESS_MAX} caratteri: accorciala o lasciala vuota.`,
  city: 'Scrivi la città, per esempio Firenze.',
  region: `Provincia o regione supera i ${MEMBERSHIP_REGION_MAX} caratteri: accorcia, per esempio FI, o lascia vuoto.`,
  postcode: 'Scrivi il CAP: da 2 a 12 tra lettere, cifre, spazi e trattini, per esempio 50100.',
  country: 'Scrivi il paese, per esempio Italia.',
  fee: 'Scegli il tipo di quota.',
  payment: 'Scegli come vuoi pagare: bonifico bancario o PayPal.',
  areas: 'Le aree scelte non sono valide: ricarica la pagina e riprova.',
  areasOther: `Hai spuntato Altro: scrivi in poche parole come vuoi collaborare, per esempio "traduzioni dall'inglese" (da ${MEMBERSHIP_AREAS_OTHER_MIN} a ${MEMBERSHIP_AREAS_OTHER_MAX} caratteri).`,
  consent: 'Per inviare la richiesta spunta il consenso al trattamento dei dati.',
};

export const MEMBERSHIP_CONSENT_LABEL =
  "Acconsento al trattamento dei miei dati, compresi data e luogo di nascita e indirizzo, per gestire la mia adesione all'Associazione Multimage.";
export const MEMBERSHIP_CONSENT_HINT =
  "Li usiamo solo per il libro soci e per le comunicazioni dell'associazione.";

/** "10 € — Studente under 25": whole euros without decimals, others with two. */
export function membershipFeeLabel(fee: { label: string; amount: number }): string {
  const whole = Number.isInteger(fee.amount);
  const amount = fee.amount.toLocaleString('it-IT', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
  return `${amount} € — ${fee.label}`;
}

const EMAIL_EMPTY_MESSAGE = 'Scrivi la tua email: ci serve per risponderti.';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POSTCODE_PATTERN = /^[A-Za-z0-9 -]+$/;
const FEE_ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
const AREA_ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

const has = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);
const inRange = (s: string, min: number, max: number): boolean =>
  s.length >= min && s.length <= max && !CONTROL_CHARS.test(s);

/** A real calendar date `YYYY-MM-DD` from 1900-01-01 to today (UTC). */
function isValidBirthDate(s: string): boolean {
  const m = DATE_PATTERN.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d)
    return false;
  const today = new Date().toISOString().slice(0, 10);
  return s >= MEMBERSHIP_BIRTH_DATE_MIN && s <= today;
}

/** Field rules, on trimmed values. Returns the message per invalid key; `{}` means valid. */
export function validateMembershipFields(
  f: MembershipFields,
): Partial<Record<MembershipFieldKey, string>> {
  const errors: Partial<Record<MembershipFieldKey, string>> = {};
  const m = MEMBERSHIP_FIELD_MESSAGES;
  const email = f.email.trim();
  const address2 = f.address2.trim();
  const region = f.region.trim();
  const postcode = f.postcode.trim();
  const areas = Array.isArray(f.areas) ? f.areas : [];

  if (email === '') errors.email = EMAIL_EMPTY_MESSAGE;
  else if (email.length > 254 || CONTROL_CHARS.test(email) || !EMAIL_PATTERN.test(email))
    errors.email = m.email;
  if (!inRange(f.firstName.trim(), 1, MEMBERSHIP_NAME_MAX)) errors.firstName = m.firstName;
  if (!inRange(f.lastName.trim(), 1, MEMBERSHIP_NAME_MAX)) errors.lastName = m.lastName;
  if (!isValidBirthDate(f.birthDate.trim())) errors.birthDate = m.birthDate;
  if (!inRange(f.birthPlace.trim(), MEMBERSHIP_BIRTH_PLACE_MIN, MEMBERSHIP_BIRTH_PLACE_MAX))
    errors.birthPlace = m.birthPlace;
  if (!inRange(f.address1.trim(), MEMBERSHIP_ADDRESS_MIN, MEMBERSHIP_ADDRESS_MAX))
    errors.address1 = m.address1;
  if (address2 !== '' && !inRange(address2, 1, MEMBERSHIP_ADDRESS_MAX))
    errors.address2 = m.address2;
  if (!inRange(f.city.trim(), MEMBERSHIP_CITY_MIN, MEMBERSHIP_CITY_MAX)) errors.city = m.city;
  if (region !== '' && !inRange(region, 1, MEMBERSHIP_REGION_MAX)) errors.region = m.region;
  if (
    postcode.length < MEMBERSHIP_POSTCODE_MIN ||
    postcode.length > MEMBERSHIP_POSTCODE_MAX ||
    !POSTCODE_PATTERN.test(postcode)
  )
    errors.postcode = m.postcode;
  if (!inRange(f.country.trim(), MEMBERSHIP_COUNTRY_MIN, MEMBERSHIP_COUNTRY_MAX))
    errors.country = m.country;
  if (!FEE_ID_PATTERN.test(f.fee.trim())) errors.fee = m.fee;
  if (!has(PAYMENT_METHODS, f.payment.trim())) errors.payment = m.payment;
  if (
    areas.length > MEMBERSHIP_AREAS_MAX ||
    areas.some((a) => typeof a !== 'string' || !AREA_ID_PATTERN.test(a))
  )
    errors.areas = m.areas;
  if (
    areas.includes(AREA_OTHER) &&
    !inRange(f.areasOther.trim(), MEMBERSHIP_AREAS_OTHER_MIN, MEMBERSHIP_AREAS_OTHER_MAX)
  )
    errors.areasOther = m.areasOther;
  if (f.consent !== true) errors.consent = m.consent;
  return errors;
}
