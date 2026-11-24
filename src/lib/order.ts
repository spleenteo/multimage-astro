// Order facts and pure helpers, shared by pages, the bag drawer and the order email.
// No imports: client scripts bundle this file and plain `tsx` loads it.

export const ORDER_EMAIL = 'ordini@multimage.org';
export const BAG_STORAGE_KEY = 'multimage:bag';
export const QTY_MIN = 1;
export const QTY_MAX = 20;

export type BagItem = {
  id: string;
  slug: string;
  title: string;
  authors: string;
  priceCents: number;
  cover: string | null;
  tint: string | null;
  qty: number;
};

export type BagBook = Omit<BagItem, 'qty'>;

type PrintFacts = {
  archive?: boolean | null;
  format?: string | null;
};

export const euroFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

/** A print book still in the catalogue: not archived and not an ebook. */
export function isPrintInCatalogue({ archive, format }: PrintFacts): boolean {
  if (archive) return false;
  return (format ?? '').trim().toLowerCase() !== 'ebook';
}

/** A print book that can go in the bag: in the catalogue and with a numeric price. */
export function isOrderablePrint(book: PrintFacts & { price?: number | null }): boolean {
  return isPrintInCatalogue(book) && typeof book.price === 'number' && Number.isFinite(book.price);
}

export function toCents(price: number): number {
  return Math.round(price * 100);
}

export function clampQty(n: number): number {
  if (!Number.isFinite(n)) return QTY_MIN;
  return Math.min(QTY_MAX, Math.max(QTY_MIN, Math.floor(n)));
}

export function formatCents(cents: number): string {
  return euroFormatter.format(cents / 100);
}

export function bagTotals(items: Array<Pick<BagItem, 'priceCents' | 'qty'>>): {
  lines: number;
  copies: number;
  cents: number;
} {
  let copies = 0;
  let cents = 0;
  for (const item of items) {
    copies += item.qty;
    cents += item.priceCents * item.qty;
  }
  return { lines: items.length, copies, cents };
}

export function copiesLabel(n: number): string {
  return n === 1 ? '1 copia' : `${n} copie`;
}

export function booksLabel(n: number): string {
  if (n === 0) return 'Nessun libro';
  return n === 1 ? '1 libro' : `${n} libri`;
}

/** The bag's size, copies first like the header badge: "4 copie di 2 libri". */
export function bagSizeLabel(lines: number, copies: number): string {
  if (lines === 0) return booksLabel(0);
  return `${copiesLabel(copies)} di ${booksLabel(lines)}`;
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v !== '';
const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string';

/** Validates an untrusted value (storage, data attribute) into a BagItem. */
export function toBagItem(v: unknown): BagItem | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.id) || !isNonEmptyString(o.slug) || !isNonEmptyString(o.title))
    return null;
  if (typeof o.authors !== 'string') return null;
  if (typeof o.priceCents !== 'number' || !Number.isInteger(o.priceCents) || o.priceCents < 0)
    return null;
  if (!isStringOrNull(o.cover) || !isStringOrNull(o.tint)) return null;
  return {
    id: o.id,
    slug: o.slug,
    title: o.title,
    authors: o.authors,
    priceCents: o.priceCents,
    cover: o.cover,
    tint: o.tint,
    qty: clampQty(typeof o.qty === 'number' ? o.qty : QTY_MIN),
  };
}

/** The data the "Metti in borsa" button carries, or null when the book cannot be ordered. */
export function bagBookFor(book: {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  archive?: boolean | null;
  format?: string | null;
  price?: number | null;
  coverUrl: string | null;
  tint: string | null;
}): BagBook | null {
  if (!isOrderablePrint(book)) return null;
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    authors: book.authors.join(', '),
    priceCents: toCents(book.price as number),
    cover: book.coverUrl ? `${book.coverUrl}?w=120&fit=max&auto=format` : null,
    tint: book.tint,
  };
}

// --- Order facts -----------------------------------------------------------

// Sender on the Email Routing subdomain, confirmed in the shaping revision.
export const ORDER_FROM_ADDRESS = 'sito@ordini.multimage.org';
export const ORDER_FROM_NAME = 'Multimage';
export const ORDER_FROM = `${ORDER_FROM_NAME} <${ORDER_FROM_ADDRESS}>`;
export const ORDER_ACCOUNT_HOLDER = 'Associazione Multimage';
export const ORDER_BANK = 'Banca Etica';
export const ORDER_IBAN = 'IT50T0501802800000011361524';
export const ORDER_BIC = 'ETICIT22XXX';
export const ORDER_SWIFT_INTERMEDIARY = 'POSOIT22XXX';
export const ORDER_PAYPAL = 'info@multimage.org';
export const ORDER_CAUSALE = 'Ordine libri';
export const ORDER_ACTION = 'ordine';
export const ORDER_MAX_LINES = 30;
export const ORDER_NOTES_MAX = 1000;
export const ORDER_BODY_MAX_BYTES = 16384;
export const BOOK_ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;

export const SHIPPING_KINDS = {
  piego: {
    label: 'Piego di libri',
    note: 'Gratuita · arriva di solito in una settimana',
    cents: 0,
  },
  rapida: { label: 'Rapida e tracciabile', note: 'Con numero di tracciamento', cents: 500 },
} as const;
export type ShippingKind = keyof typeof SHIPPING_KINDS;

export const BUYER_KINDS = {
  privato: 'Privato',
  scuola: 'Scuola',
  associazione: 'Associazione',
  libreria: 'Libreria',
} as const;
export type BuyerKind = keyof typeof BUYER_KINDS;

// --- Types -----------------------------------------------------------------

export type OrderFieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'postcode'
  | 'city'
  | 'province'
  | 'shipping'
  | 'buyer'
  | 'notes'
  | 'consent';

export type OrderFields = {
  name: string;
  email: string;
  phone: string;
  address: string;
  /** Italian CAP, five digits. Stored with the city in the `city` column (`orderPlace`). */
  postcode: string;
  city: string;
  province: string;
  shipping: string;
  buyer: string;
  notes: string;
  consent: boolean;
  /** The buyer ticked "Sono socia o socio": the server applies the member discount. */
  member: boolean;
};

export type OrderLineInput = { id: string; qty: number };

export type OrderRequest = OrderFields & {
  lines: OrderLineInput[];
  turnstileToken: string;
};

export type OrderBook = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  format: string | null;
  archive: boolean | null;
  authors: string[];
};

export type OrderLine = {
  id: string;
  slug: string;
  title: string;
  authors: string;
  priceCents: number;
  qty: number;
  amountCents: number;
};

export type OrderTotals = {
  copies: number;
  /** Books at cover price, in cents. */
  subtotal: number;
  /** Member discount in cents (0 when not a member); books only, never shipping. */
  discount: number;
  shipping: number;
  /** Subtotal minus discount plus shipping. */
  total: number;
};

export type OrderErrorCode =
  | 'method_not_allowed'
  | 'bad_request'
  | 'too_large'
  | 'empty_bag'
  | 'too_many_lines'
  | 'bad_lines'
  | 'invalid'
  | 'turnstile'
  | 'nothing_orderable'
  | 'turnstile_unavailable'
  | 'catalogue_unavailable'
  | 'save_failed'
  | 'not_configured';

export type OrderResponse =
  | {
      ok: true;
      code: string;
      notified: boolean;
      lines: Array<Pick<OrderLine, 'id' | 'title' | 'qty' | 'priceCents' | 'amountCents'>>;
      copies: number;
      shipping: number;
      shippingKind: ShippingKind;
      member: boolean;
      discount: number;
      total: number;
      dropped: string[];
    }
  | { ok: false; error: OrderErrorCode; fields?: OrderFieldKey[] };

// --- Formatting ------------------------------------------------------------

/** The IBAN in groups of four, for reading and copying by hand. */
export function formatIban(s: string): string {
  return s.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');
}

// --- Validation ------------------------------------------------------------

export const ORDER_FIELD_MESSAGES: Record<OrderFieldKey, string> = {
  name: 'Scrivi nome e cognome di chi riceve i libri.',
  email:
    "L'email non è completa: controlla la chiocciola e il dominio, per esempio nome@esempio.it.",
  phone: 'Il telefono può avere solo cifre, spazi e il segno +: correggilo o lascialo vuoto.',
  address: 'Scrivi via e numero civico per la spedizione.',
  postcode: 'Scrivi il CAP, cinque cifre.',
  city: 'Scrivi la città, per esempio Firenze.',
  province: 'Scrivi la sigla, per esempio FI.',
  shipping: 'Scegli come spedire i libri.',
  buyer: 'Scegli chi ordina: privato, scuola, associazione o libreria.',
  notes: `Le note superano i ${ORDER_NOTES_MAX} caratteri: accorciale.`,
  consent: "Per inviare l'ordine spunta il consenso all'uso dei dati.",
};

const EMAIL_EMPTY_MESSAGE = "Scrivi la tua email: ci serve per risponderti sull'ordine.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+0-9 ()./-]{6,30}$/;
const POSTCODE_PATTERN = /^\d{5}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

const has = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);
const inRange = (s: string, min: number, max: number): boolean =>
  s.length >= min && s.length <= max && !CONTROL_CHARS.test(s);

/** Field rules, on trimmed values. Returns the message per invalid key; `{}` means valid. */
export function validateOrderFields(f: OrderFields): Partial<Record<OrderFieldKey, string>> {
  const errors: Partial<Record<OrderFieldKey, string>> = {};
  const m = ORDER_FIELD_MESSAGES;
  const name = f.name.trim();
  const email = f.email.trim();
  const phone = f.phone.trim();

  if (!inRange(name, 2, 100)) errors.name = m.name;
  if (email === '') errors.email = EMAIL_EMPTY_MESSAGE;
  else if (email.length > 254 || CONTROL_CHARS.test(email) || !EMAIL_PATTERN.test(email))
    errors.email = m.email;
  if (phone !== '' && (CONTROL_CHARS.test(phone) || !PHONE_PATTERN.test(phone)))
    errors.phone = m.phone;
  if (!inRange(f.address.trim(), 3, 200)) errors.address = m.address;
  if (!POSTCODE_PATTERN.test(f.postcode.trim())) errors.postcode = m.postcode;
  if (!inRange(f.city.trim(), 2, 100)) errors.city = m.city;
  if (!inRange(f.province.trim(), 2, 40)) errors.province = m.province;
  if (!has(SHIPPING_KINDS, f.shipping.trim())) errors.shipping = m.shipping;
  if (!has(BUYER_KINDS, f.buyer.trim())) errors.buyer = m.buyer;
  if (f.notes.trim().length > ORDER_NOTES_MAX) errors.notes = m.notes;
  if (f.consent !== true) errors.consent = m.consent;
  return errors;
}

type ParseResult =
  | { ok: true; order: OrderRequest }
  | { ok: false; error: OrderErrorCode; fields?: OrderFieldKey[] };

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Reads an untrusted JSON body into an OrderRequest, or names the first problem. */
export function parseOrderRequest(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    return { ok: false, error: 'bad_request' };
  const o = body as Record<string, unknown>;

  if (!Array.isArray(o.lines) || o.lines.length === 0) return { ok: false, error: 'empty_bag' };
  if (o.lines.length > ORDER_MAX_LINES) return { ok: false, error: 'too_many_lines' };

  const lines: OrderLineInput[] = [];
  const seen = new Set<string>();
  for (const raw of o.lines as unknown[]) {
    if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'bad_lines' };
    const { id, qty } = raw as Record<string, unknown>;
    if (typeof id !== 'string' || !BOOK_ID_PATTERN.test(id) || seen.has(id))
      return { ok: false, error: 'bad_lines' };
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < QTY_MIN || qty > QTY_MAX)
      return { ok: false, error: 'bad_lines' };
    seen.add(id);
    lines.push({ id, qty });
  }

  const fields: OrderFields = {
    name: text(o.name),
    email: text(o.email),
    phone: text(o.phone),
    address: text(o.address),
    postcode: text(o.postcode),
    city: text(o.city),
    province: text(o.province),
    shipping: text(o.shipping),
    buyer: text(o.buyer),
    notes: text(o.notes),
    consent: o.consent === true,
    member: o.member === true,
  };
  const errors = validateOrderFields(fields);
  const keys = Object.keys(errors) as OrderFieldKey[];
  if (keys.length > 0) return { ok: false, error: 'invalid', fields: keys };

  const token = o.turnstileToken;
  if (typeof token !== 'string' || token.length < 1 || token.length > 2048)
    return { ok: false, error: 'turnstile' };

  return { ok: true, order: { ...fields, lines, turnstileToken: token } };
}

// --- Rebuild and totals ----------------------------------------------------

/** Titles and prices come from the catalogue; a line whose book is missing or not orderable is dropped. */
export function rebuildOrder(
  lines: OrderLineInput[],
  books: OrderBook[],
): { lines: OrderLine[]; dropped: string[] } {
  const byId = new Map(books.map((b) => [b.id, b]));
  const out: OrderLine[] = [];
  const dropped: string[] = [];
  for (const line of lines) {
    const book = byId.get(line.id);
    if (!book || !isOrderablePrint(book)) {
      dropped.push(line.id);
      continue;
    }
    const priceCents = toCents(book.price as number);
    out.push({
      id: book.id,
      slug: book.slug,
      title: book.title,
      authors: book.authors.join(', '),
      priceCents,
      qty: line.qty,
      amountCents: priceCents * line.qty,
    });
  }
  return { lines: out, dropped };
}

/**
 * Members get this percentage off the books (PRODUCT.md, /info/adesioni); the staff verifies
 * membership.
 */
export const MEMBER_DISCOUNT_PERCENT = 30;

/** The discount line label, with U+2212 as the minus sign. */
export const MEMBER_DISCOUNT_LABEL = `Sconto soci −${MEMBER_DISCOUNT_PERCENT}%`;

/** The line that marks a member order in the email, the success screen and the PDF. */
export const MEMBER_LINE = 'Socia/socio: sì';

/**
 * The member discount on a books subtotal, in cents, rounded half up to the cent (1599 gives
 * 480).
 */
export function memberDiscount(subtotal: number): number {
  return Math.round((subtotal * MEMBER_DISCOUNT_PERCENT) / 100);
}

/** A discount amount shown as a deduction, e.g. `−9,60 €` (U+2212). */
export function formatDiscount(cents: number): string {
  return `−${formatCents(cents)}`;
}

/**
 * One scheme for every total (recap, success screen, email, PDF): the books at cover price, the
 * member discount, the shipping, then the total to pay.
 */
export const ORDER_SUBTOTAL_LABEL = 'Libri a prezzo di copertina';
export const ORDER_TOTAL_LABEL = 'Totale da pagare';

/**
 * The three next steps, in the same order and words before sending, on the success screen and in
 * the PDF: confirm, pay, send the receipt. The pay step ends differently before sending (no data
 * yet, no code) and after (the causale with the code, then the bank details).
 */
export const ORDER_STEP_CONFIRM = `Lo staff ti scrive da ${ORDER_EMAIL} per confermare l'ordine, di solito entro due giorni lavorativi.`;
/** Step 1 when the notice to the staff did not go out: the buyer writes first. */
export const ORDER_STEP_CONFIRM_UNNOTIFIED = `Scrivi a ${ORDER_EMAIL} indicando il codice: lo staff ti conferma l'ordine.`;
export const ORDER_STEP_PAY = 'Paghi con bonifico o PayPal dopo la conferma dello staff';
export const ORDER_STEP_PAY_LATER = `${ORDER_STEP_PAY}: i dati te li diamo alla fine.`;
export const ORDER_STEP_RECEIPT_LEAD = 'Mandi la ricevuta del pagamento a';

/** The causale of the payment for an order code. */
export function orderCausale(code: string): string {
  return `${ORDER_CAUSALE} ${code}`;
}

/** The buyer-kind question, as the form, the email and the PDF ask it. */
export const BUYER_LABEL = 'Chi ordina';

/**
 * Totals in cents; the shipping fee counts once per order. The member discount
 * applies to the books only, never to shipping.
 */
export function orderTotals(
  lines: OrderLine[],
  shipping: ShippingKind,
  member: boolean,
): OrderTotals {
  let copies = 0;
  let subtotal = 0;
  for (const line of lines) {
    copies += line.qty;
    subtotal += line.amountCents;
  }
  const discount = member ? memberDiscount(subtotal) : 0;
  const fee = SHIPPING_KINDS[shipping].cents;
  return { copies, subtotal, discount, shipping: fee, total: subtotal - discount + fee };
}

// --- Order code and D1 row -------------------------------------------------

/** 32 letters and digits without 0, 1, I and O, so a code read aloud or by hand stays unambiguous. */
export const ORDER_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ORDER_CODE_PATTERN = /^MM-\d{6}-[2-9A-HJ-NP-Z]{4}$/;

/** `MM-YYMMDD-XXXX`: the UTC date and four characters, one random byte each (`byte % 32`, no bias). */
export function orderCode(at: Date, random: Uint8Array): string {
  const iso = at.toISOString();
  const date = iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += ORDER_CODE_ALPHABET[random[i] % 32];
  return `MM-${date}-${suffix}`;
}

/**
 * The `orders` columns the site writes, in table order (`id` and `notify_error` are left out;
 * `member` and `discount_cents` come from migration 0002).
 */
export const ORDER_COLUMNS = [
  'code',
  'created_at',
  'name',
  'email',
  'phone',
  'address',
  'city',
  'province',
  'shipping_kind',
  'buyer_kind',
  'notes',
  'lines_json',
  'copies',
  'subtotal_cents',
  'shipping_cents',
  'total_cents',
  'consent_at',
  'notify_status',
  'member',
  'discount_cents',
] as const;

/** CAP and city as one string ("50123 Firenze"): the `city` column, the email and the PDF. */
export function orderPlace(f: Pick<OrderFields, 'postcode' | 'city'>): string {
  return [f.postcode.trim(), f.city.trim()].filter(Boolean).join(' ');
}

/** The values of one `orders` row, in `ORDER_COLUMNS` order; an empty phone or notes is NULL. */
export function orderRow(data: {
  order: OrderRequest;
  lines: OrderLine[];
  totals: OrderTotals;
  code: string;
  at: Date;
}): Array<string | number | null> {
  const { order, lines, totals, code, at } = data;
  const time = at.toISOString();
  return [
    code,
    time,
    order.name,
    order.email,
    order.phone || null,
    order.address,
    orderPlace(order),
    order.province,
    order.shipping,
    order.buyer,
    order.notes || null,
    JSON.stringify(lines),
    totals.copies,
    totals.subtotal,
    totals.shipping,
    totals.total,
    time,
    'pending',
    order.member ? 1 : 0,
    totals.discount,
  ];
}

const CODE_CLASH = /UNIQUE constraint failed: orders\.code/;

/** True when a D1 error is the UNIQUE clash on `orders.code` (in the message or in its cause). */
export function isCodeClash(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const { message, cause } = err as { message?: unknown; cause?: unknown };
  const causeMessage =
    typeof cause === 'object' && cause !== null ? (cause as { message?: unknown }).message : null;
  return (
    (typeof message === 'string' && CODE_CLASH.test(message)) ||
    (typeof causeMessage === 'string' && CODE_CLASH.test(causeMessage))
  );
}

/**
 * Inserts with `first`; on a code clash inserts once more with `next()`. Any other
 * error, or a second failure, gives `saved: false`. `code` is the one that was
 * last tried. Never logs or rethrows: the caller reports.
 */
export async function saveWithCodeRetry(
  insert: (code: string) => Promise<unknown>,
  first: string,
  next: () => string,
): Promise<{ saved: boolean; code: string; retried: boolean }> {
  try {
    await insert(first);
    return { saved: true, code: first, retried: false };
  } catch (err) {
    if (!isCodeClash(err)) return { saved: false, code: first, retried: false };
  }
  const code = next();
  try {
    await insert(code);
    return { saved: true, code, retried: true };
  } catch {
    return { saved: false, code, retried: true };
  }
}

// --- Email -----------------------------------------------------------------

/** The plain-text order email for the shop. */
export function orderEmail(data: {
  order: OrderRequest;
  lines: OrderLine[];
  totals: OrderTotals;
  code: string;
}): { subject: string; text: string } {
  const { order, lines, totals, code } = data;
  const copies = copiesLabel(totals.copies);
  const shipping = SHIPPING_KINDS[order.shipping as ShippingKind];
  const buyer = BUYER_KINDS[order.buyer as BuyerKind];

  const subject = `Ordine ${code} · ${order.name} · ${copies}`;

  const out: string[] = [
    `Nuovo ordine dal sito: ${code}.`,
    '',
    `${BUYER_LABEL}: ${buyer}`,
    ...(order.member ? [MEMBER_LINE] : []),
    '',
    `Nome e cognome: ${order.name}`,
    `Email: ${order.email}`,
    `Telefono: ${order.phone || 'non indicato'}`,
    `Indirizzo: ${order.address}, ${orderPlace(order)} (${order.province})`,
    '',
    'Libri',
    ...lines.map(
      (l) =>
        `- ${l.title} (${l.authors}) · ${copiesLabel(l.qty)} × ${formatCents(l.priceCents)} = ${formatCents(l.amountCents)}`,
    ),
    '',
    `Copie: ${totals.copies}`,
    `${ORDER_SUBTOTAL_LABEL}: ${formatCents(totals.subtotal)}`,
    ...(order.member ? [`${MEMBER_DISCOUNT_LABEL}: ${formatDiscount(totals.discount)}`] : []),
    `Spedizione: ${shipping.label}, ${formatCents(totals.shipping)}`,
    `${ORDER_TOTAL_LABEL}: ${formatCents(totals.total)}`,
  ];
  if (order.notes) out.push('', 'Note', order.notes);
  out.push(
    '',
    'Pagamento',
    `Intestato a: ${ORDER_ACCOUNT_HOLDER}`,
    `Banca: ${ORDER_BANK}`,
    `IBAN: ${formatIban(ORDER_IBAN)}`,
    `BIC: ${ORDER_BIC}`,
    `Banca intermediaria (SWIFT): ${ORDER_SWIFT_INTERMEDIARY}`,
    `PayPal: ${ORDER_PAYPAL}`,
    `Causale: ${orderCausale(code)}`,
    `Manda la ricevuta a ${ORDER_EMAIL}.`,
  );
  return { subject, text: out.join('\n') };
}

// --- Turnstile and mailto --------------------------------------------------

/** A siteverify answer passes when `success` is true and, unless lenient, hostname and action match. */
export function checkSiteverify(
  result: unknown,
  expected: { hostname: string; action: string; lenient: boolean },
): boolean {
  if (typeof result !== 'object' || result === null) return false;
  const r = result as Record<string, unknown>;
  if (r.success !== true) return false;
  if (expected.lenient) return true;
  return r.hostname === expected.hostname && r.action === expected.action;
}

/** The email fallback: a mailto with every bag line, for when the form is off or sending failed. */
export function bagMailto(
  items: BagItem[],
  shipping: ShippingKind = 'piego',
  member = false,
): string {
  const body = [
    ...items.map((i) => `${i.title} · ${copiesLabel(i.qty)}`),
    '',
    `Spedizione: ${SHIPPING_KINDS[shipping].label}`,
    ...(member ? [MEMBER_LINE] : []),
    '',
    'Nome e cognome:',
    'Indirizzo di spedizione:',
    `${BUYER_LABEL}:`,
  ].join('\r\n');
  return `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent('Ordine dal sito')}&body=${encodeURIComponent(body)}`;
}
