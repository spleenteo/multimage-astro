// The PDF of an order request as plain data: pure, runs in the browser and under tsx.
// It imports only from ./order. The renderer (jsPDF) lives in
// src/pages/borsa/_order-pdf.client.ts and is loaded on tap, never with the page.
import {
  BUYER_KINDS,
  ORDER_ACCOUNT_HOLDER,
  ORDER_BANK,
  ORDER_BIC,
  ORDER_CAUSALE,
  ORDER_EMAIL,
  ORDER_IBAN,
  ORDER_PAYPAL,
  ORDER_SWIFT_INTERMEDIARY,
  MEMBER_DISCOUNT_LABEL,
  MEMBER_LINE,
  SHIPPING_KINDS,
  copiesLabel,
  formatCents,
  formatIban,
  orderTotalLabel,
  type BuyerKind,
  type OrderFields,
  type OrderResponse,
} from './order';

export type OrderPdfBlock = {
  kind: 'brand' | 'meta' | 'heading' | 'text' | 'row' | 'total' | 'rule';
  text: string;
  right?: string;
};

export type OrderPdf = { filename: string; title: string; blocks: OrderPdfBlock[] };

export type OrderPdfInput = {
  order: Extract<OrderResponse, { ok: true }>;
  buyer: OrderFields;
  at: Date;
};

// Characters above U+00FF that jsPDF's built-in Helvetica (WinAnsi) can still draw.
const WIN_ANSI_EXTRA = '€…‘’“”–—•';
// ø and Ø are in Latin-1, so they never reach this table.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');
const LETTER_FALLBACK: Record<string, string> = {
  ł: 'l',
  Ł: 'L',
  đ: 'd',
  Đ: 'D',
  // U+2212 (minus) is not WinAnsi and would print as "?"; the discount reads "-30%".
  '−': '-',
};

/**
 * Text safe for the built-in Helvetica: wide spaces become a space, control
 * characters go, and a character outside WinAnsi loses its accent
 * (Wałęsa -> Walesa) or, failing that, becomes "?". Letters already in
 * Latin-1 (è, à) are left alone.
 */
export function pdfText(s: string): string {
  let out = '';
  for (const ch of s.replace(/[\t\n\r]+/g, ' ').normalize('NFC')) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) continue;
    if ((code >= 0x2000 && code <= 0x200b) || code === 0x202f || code === 0x205f) {
      out += ' ';
    } else if (code <= 0xff || WIN_ANSI_EXTRA.includes(ch)) {
      out += ch;
    } else if (code >= 0x300 && code <= 0x36f) {
      continue;
    } else if (LETTER_FALLBACK[ch]) {
      out += LETTER_FALLBACK[ch];
    } else {
      const base = ch.normalize('NFD').replace(COMBINING_MARKS, '').normalize('NFC');
      out += base.length > 0 && [...base].every((c) => c.codePointAt(0)! <= 0xff) ? base : '?';
    }
  }
  return out;
}

const dateIt = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** The request as blocks, in reading order. Every string passes through pdfText. */
export function orderPdf(input: OrderPdfInput): OrderPdf {
  const { order, buyer, at } = input;
  const code = order.code;
  const blocks: OrderPdfBlock[] = [];
  const add = (kind: OrderPdfBlock['kind'], text = '', right?: string) =>
    blocks.push(
      right === undefined
        ? { kind, text: pdfText(text) }
        : { kind, text: pdfText(text), right: pdfText(right) },
    );

  add('brand', 'Multimage');
  add('meta', `${ORDER_ACCOUNT_HOLDER} · ${ORDER_EMAIL}`);
  add('heading', `Richiesta d'ordine ${code}`);
  add('meta', dateIt.format(at));
  if (!order.notified) {
    add('text', `L'avviso allo staff non è partito: scrivi a ${ORDER_EMAIL} indicando il codice.`);
  }

  add('heading', 'Spedizione a');
  add('text', buyer.name);
  add('text', buyer.address);
  add('text', `${buyer.city} (${buyer.province})`);
  add('text', `Email: ${buyer.email}`);
  if (buyer.phone) add('text', `Telefono: ${buyer.phone}`);
  add('text', `Ordini come: ${BUYER_KINDS[buyer.buyer as BuyerKind] ?? buyer.buyer}`);
  if (order.member) add('text', MEMBER_LINE);

  add('heading', 'Libri');
  for (const l of order.lines) {
    add(
      'row',
      `${l.title} · ${copiesLabel(l.qty)} × ${formatCents(l.priceCents)}`,
      formatCents(l.amountCents),
    );
  }
  add('rule');
  add('row', 'Copie', String(order.copies));
  if (order.member) add('row', MEMBER_DISCOUNT_LABEL, `−${formatCents(order.discount)}`);
  add(
    'row',
    `Spedizione: ${SHIPPING_KINDS[order.shippingKind].label}`,
    formatCents(order.shipping),
  );
  add('total', orderTotalLabel(order.member), formatCents(order.total));

  if (buyer.notes) {
    add('heading', 'Note');
    add('text', buyer.notes);
  }

  add('heading', 'Cosa succede dopo');
  add('text', "1. Lo staff conferma l'ordine entro due giorni lavorativi.");
  add(
    'text',
    `2. Spediamo i libri, poi paghi con bonifico o PayPal, con causale "${ORDER_CAUSALE} ${code}".`,
  );
  add('text', `3. Mandi la ricevuta a ${ORDER_EMAIL}.`);

  add('heading', 'Pagamento');
  add('text', `Intestato a: ${ORDER_ACCOUNT_HOLDER}`);
  add('text', `Banca: ${ORDER_BANK}`);
  add('text', `IBAN: ${formatIban(ORDER_IBAN)}`);
  add('text', `BIC: ${ORDER_BIC}`);
  add('text', `Banca intermediaria (SWIFT): ${ORDER_SWIFT_INTERMEDIARY}`);
  add('text', `PayPal: ${ORDER_PAYPAL}`);
  add('text', `Causale: ${ORDER_CAUSALE} ${code}`);
  add('meta', 'I tuoi dati restano allo staff solo per il tempo necessario alla spedizione.');

  return { filename: `ordine-${code}.pdf`, title: `Ordine ${code}`, blocks };
}
