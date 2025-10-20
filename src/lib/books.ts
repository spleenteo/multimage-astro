import { toPlainText, truncateToLength } from './text';

type BookAuthor = {
  id: string;
  fullName?: string | null;
};

type BookCover = {
  url?: string | null;
  alt?: string | null;
  colors?: Array<{ hex?: string | null }> | null;
  width?: number | null;
  height?: number | null;
};

type BookLicense = {
  name?: string | null;
  code?: string | null;
};

export type BookRecordForCard = {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  promo?: string | null;
  description?: string | null;
  coverImage?: BookCover | null;
  authors?: BookAuthor[] | null;
  license?: BookLicense | null;
  format?: string | null;
  price?: number | null;
  printYear?: string | null;
  archive?: boolean | null;
};

export type BookCardViewModel = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  summary?: string | null;
  coverImage?: BookCover | null;
  authors: BookAuthor[];
  license?: BookLicense | null;
  format?: string | null;
  price?: number | null;
  printYear?: string | null;
  isArchived: boolean;
};

export function toBookCard(record: BookRecordForCard): BookCardViewModel {
  const rawSummary =
    record.promo && record.promo.trim().length > 0 ? record.promo : record.description;
  const summary = truncateToLength(toPlainText(rawSummary ?? ''), 180);

  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    subtitle: record.subtitle ?? null,
    summary: summary.length > 0 ? summary : undefined,
    coverImage: record.coverImage ?? null,
    authors: record.authors ?? [],
    license: record.license ?? null,
    format: record.format ?? null,
    price: record.price ?? null,
    printYear: record.printYear ?? null,
    isArchived: record.archive === true,
  };
}

export function mapBooksToCards(books: Array<BookRecordForCard> | null | undefined) {
  return (books ?? []).map(toBookCard);
}

const euroFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const circulationFormatter = new Intl.NumberFormat('it-IT');

export function formatBookPrice(price: number | null | undefined): string | null {
  if (typeof price !== 'number') {
    return null;
  }

  return euroFormatter.format(price);
}

export function formatEdition(edition: number | null | undefined): string | null {
  if (!edition) {
    return null;
  }

  return `${edition}ª edizione`;
}

export function extractYear(date: string | null | undefined): string | null {
  if (!date) {
    return null;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return `${parsed.getFullYear()}`;
}

export function formatOrdinal(value: number | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return `${value}ª`;
}

export function formatCirculation(value: number | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return circulationFormatter.format(value);
}

export function normalizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function buildLicenseLabel(license: BookLicense | null | undefined): string | null {
  if (!license) {
    return null;
  }

  const name = normalizeText(license.name ?? null);
  const code = normalizeText(license.code ?? null)?.toUpperCase() ?? null;

  if (name && code) {
    return `${name} (${code})`;
  }

  return name ?? code ?? null;
}
