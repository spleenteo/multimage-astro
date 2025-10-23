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
};

function normalize(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractSortKey(author: AuthorRecordForCard): string {
  const sortValue = normalize(author.sortBy);
  const name = normalize(author.fullName);
  return (sortValue ?? name ?? '').toLocaleLowerCase('it');
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

    return {
      id: author.id,
      slug: author.slug ?? '',
      name: author.fullName?.trim() || 'Autore in aggiornamento',
      alias: normalize(author.alias),
      country: normalize(author.country),
      summary,
      booksCount,
      picture: author.picture ?? null,
    };
  });
}
