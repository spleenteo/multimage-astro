import { toPlainText, truncateToLength } from './text';

type AuthorPicture = {
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

export type AuthorRecordForCard = {
  id: string;
  fullName?: string | null;
  slug?: string | null;
  alias?: string | null;
  country?: string | null;
  biography?: string | null;
  sortBy?: string | null;
  picture?: AuthorPicture | null;
};

export type AuthorCardViewModel = {
  id: string;
  slug: string;
  name: string;
  alias?: string | null;
  country?: string | null;
  summary?: string | null;
  booksCount: number;
  picture?: AuthorPicture | null;
  sortLetter: string;
};

function normalize(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractSortValue(author: AuthorRecordForCard): string {
  return normalize(author.sortBy) ?? normalize(author.fullName) ?? '';
}

function extractSortKey(author: AuthorRecordForCard): string {
  return extractSortValue(author).toLocaleLowerCase('it');
}

function extractSortLetter(author: AuthorRecordForCard): string {
  const sortValue = extractSortValue(author);
  if (!sortValue) {
    return '#';
  }

  const firstChar = sortValue.charAt(0).toUpperCase();
  return /[A-ZÀ-ÖØ-Ý]/i.test(firstChar) ? firstChar : '#';
}

export function sortAuthorsForIndex(authors: Array<AuthorRecordForCard>) {
  return [...authors].sort((a, b) => extractSortKey(a).localeCompare(extractSortKey(b), 'it'));
}

export function mapAuthorsToCards(
  authors: Array<AuthorRecordForCard>,
  options: { bookCounts?: Map<string, number> } = {},
): AuthorCardViewModel[] {
  const { bookCounts } = options;

  return authors.map((author) => {
    const biographyPlain = toPlainText(author.biography ?? null);
    const summary = biographyPlain.length > 0 ? truncateToLength(biographyPlain, 200) : undefined;

    const booksCount = bookCounts?.get(author.id) ?? 0;
    const sortLetter = extractSortLetter(author);

    return {
      id: author.id,
      slug: author.slug ?? '',
      name: author.fullName?.trim() || 'Autore in aggiornamento',
      alias: normalize(author.alias),
      country: normalize(author.country),
      summary,
      booksCount,
      picture: author.picture ?? null,
      sortLetter,
    };
  });
}
