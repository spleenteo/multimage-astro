import type { AssetImage } from './datocms/types';
import { toPlainText, truncateToLength } from './text';

type BookAuthor = {
  id: string;
  fullName?: string | null;
  alias?: string | null;
  slug?: string | null;
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
  coverImage?: AssetImage | null;
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
  coverImage?: AssetImage | null;
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

export type BookDetailItem = { label: string; value: string; href?: string };

export type BookDetailSource = {
  collection?: { name?: string | null; slug?: string | null } | null;
  isbn?: string | null;
  printYear?: string | null;
  firstPrintYear?: number | null;
  edition?: number | null;
  reprints?: Array<{
    __typename?: string | null;
    number?: number | null;
    circulation?: number | null;
    year?: string | null;
  }> | null;
  originalLang?: string | null;
  originalTitle?: string | null;
  translator?: string | null;
  format?: string | null;
  price?: number | null;
  license?: BookLicense | null;
  pages?: number | null;
  illustrator?: string | null;
  coverDesigner?: string | null;
  layoutArtist?: string | null;
  dimension?: { dimensions?: string | null } | null;
  dimensions?: string | null;
};

export function buildEditionDetails(source: BookDetailSource): BookDetailItem[] {
  const details: BookDetailItem[] = [];

  if (source.collection?.name && source.collection.slug) {
    details.push({
      label: 'Collana',
      value: source.collection.name,
      href: `/collane/${source.collection.slug}`,
    });
  }

  if (source.isbn) {
    details.push({ label: 'ISBN', value: source.isbn });
  }

  const formattedPrintYear = extractYear(source.printYear);
  if (formattedPrintYear) {
    details.push({ label: 'Anno di stampa', value: formattedPrintYear });
  }

  if (source.firstPrintYear) {
    details.push({ label: 'Prima edizione', value: `${source.firstPrintYear}` });
  }

  const formattedEdition = formatEdition(source.edition);
  if (source.edition && source.edition > 1 && formattedEdition) {
    details.push({ label: 'Edizione', value: formattedEdition });
  }

  for (const reprint of source.reprints ?? []) {
    if (reprint.__typename !== 'ReprintRecord') {
      continue;
    }

    const reprintOrdinal = formatOrdinal(reprint.number);
    if (reprintOrdinal) {
      details.push({ label: 'Ristampa', value: `${reprintOrdinal} ristampa` });
    }

    const formattedCirculation = formatCirculation(reprint.circulation ?? null);
    if (formattedCirculation) {
      details.push({ label: 'Tiratura', value: formattedCirculation });
    }

    const reprintYear = extractYear(reprint.year ?? null);
    if (reprintYear) {
      details.push({ label: 'Anno di ristampa', value: reprintYear });
    }
  }

  const originalLang = normalizeText(source.originalLang);
  if (originalLang) {
    details.push({ label: 'Lingua originale', value: originalLang });
  }

  const originalTitle = normalizeText(source.originalTitle);
  if (originalTitle) {
    details.push({ label: 'Titolo originale', value: originalTitle });
  }

  const translator = normalizeText(source.translator);
  if (translator) {
    details.push({ label: 'Traduttore', value: translator });
  }

  const formatValue = normalizeText(source.format);
  if (formatValue) {
    details.push({ label: 'Formato', value: formatValue });
  }

  const formattedPrice = formatBookPrice(source.price);
  if (formattedPrice) {
    details.push({ label: 'Prezzo di copertina', value: formattedPrice });
  }

  const licenseLabel = buildLicenseLabel(source.license);
  if (licenseLabel) {
    details.push({ label: 'Licenza', value: licenseLabel });
  }

  return details;
}

export function buildGraphicsDetails(source: BookDetailSource): BookDetailItem[] {
  const details: BookDetailItem[] = [];

  if (source.pages) {
    details.push({ label: 'Pagine', value: `${source.pages}` });
  }

  const illustrator = normalizeText(source.illustrator);
  if (illustrator) {
    details.push({ label: 'Illustratore', value: illustrator });
  }

  const coverDesigner = normalizeText(source.coverDesigner);
  if (coverDesigner) {
    details.push({ label: 'Grafica di copertina', value: coverDesigner });
  }

  const layoutArtist = normalizeText(source.layoutArtist);
  if (layoutArtist) {
    details.push({ label: 'Impaginatore', value: layoutArtist });
  }

  const coverSizeLabel = normalizeText(source.dimension?.dimensions ?? source.dimensions);
  if (coverSizeLabel) {
    details.push({ label: 'Dimensioni', value: coverSizeLabel });
  }

  return details;
}
