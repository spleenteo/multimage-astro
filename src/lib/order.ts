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

const euroFormatter = new Intl.NumberFormat('it-IT', {
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
