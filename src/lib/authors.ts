import type { AssetImage } from './datocms/types';
import { truncateToLength } from './text';
import type { StructuredTextField } from './datocms/types';
import { structuredTextToPlainText } from './datocms/structuredText';

export type AuthorRecordForCard = {
  id: string;
  fullName?: string | null;
  slug?: string | null;
  alias?: string | null;
  country?: string | null;
  biography?: StructuredTextField;
  sortBy?: string | null;
  picture?: AssetImage | null;
};

export type AuthorCardViewModel = {
  id: string;
  slug: string;
  name: string;
  alias?: string | null;
  country?: string | null;
  summary?: string | null;
  booksCount: number;
  picture?: AssetImage | null;
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

export const AUTHOR_NAME_FALLBACK = 'Autore in aggiornamento';

export type AuthorNameLike = {
  alias?: string | null;
  fullName?: string | null;
};

export type AuthorSlugLike = AuthorNameLike & {
  slug?: string | null;
};

export function getAuthorDisplayName(
  author: AuthorNameLike,
  fallback = AUTHOR_NAME_FALLBACK,
): string {
  const alias = normalize(author.alias);
  const fullName = normalize(author.fullName);
  return alias ?? fullName ?? fallback;
}

type FormatterOptions = {
  fallback?: string;
  separator?: string;
  twoConnector?: string;
  lastConnector?: string;
};

function formatNameList(names: string[], options: FormatterOptions = {}): string {
  const fallback = options.fallback ?? AUTHOR_NAME_FALLBACK;
  const separator = options.separator ?? ', ';
  const twoConnector = options.twoConnector ?? ' e ';
  const lastConnector = options.lastConnector ?? ' e ';

  if (names.length === 0) {
    return fallback;
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]}${twoConnector}${names[1]}`;
  }

  const head = names.slice(0, -1).join(separator);
  const tail = names[names.length - 1];
  return `${head}${lastConnector}${tail}`;
}

export function formatAuthorNames(
  authors: AuthorNameLike[],
  options: FormatterOptions = {},
): string {
  const names = authors
    .map((author) => getAuthorDisplayName(author, options.fallback))
    .filter((name) => name.length > 0);

  return formatNameList(names, options);
}

export type AuthorSegment =
  | { type: 'text'; value: string }
  | { type: 'author'; label: string; href?: string | null };

export function buildAuthorSegments(
  authors: AuthorSlugLike[],
  options: FormatterOptions = {},
): AuthorSegment[] {
  const fallback = options.fallback ?? AUTHOR_NAME_FALLBACK;
  const separator = options.separator ?? ', ';
  const twoConnector = options.twoConnector ?? ' e ';
  const lastConnector = options.lastConnector ?? ' e ';

  const items = authors
    .map((author) => ({
      label: getAuthorDisplayName(author, fallback),
      href: author.slug ? `/autori/${author.slug}` : null,
    }))
    .filter((item) => item.label.length > 0);

  if (items.length === 0) {
    return [{ type: 'text', value: fallback }];
  }

  if (items.length === 1) {
    const [item] = items;
    return [{ type: 'author', label: item.label, href: item.href }];
  }

  if (items.length === 2) {
    return [
      { type: 'author', label: items[0].label, href: items[0].href },
      { type: 'text', value: twoConnector },
      { type: 'author', label: items[1].label, href: items[1].href },
    ];
  }

  const segments: AuthorSegment[] = [];
  items.forEach((item, index) => {
    if (index > 0) {
      segments.push({
        type: 'text',
        value: index === items.length - 1 ? lastConnector : separator,
      });
    }
    segments.push({ type: 'author', label: item.label, href: item.href });
  });

  return segments;
}

export function mapAuthorsToCards(
  authors: Array<AuthorRecordForCard>,
  options: { bookCounts?: Map<string, number> } = {},
): AuthorCardViewModel[] {
  const { bookCounts } = options;

  return authors.map((author) => {
    const biographyPlain = structuredTextToPlainText(author.biography ?? null);
    const summary = biographyPlain.length > 0 ? truncateToLength(biographyPlain, 200) : undefined;

    const booksCount = bookCounts?.get(author.id) ?? 0;
    const sortLetter = extractSortLetter(author);

    return {
      id: author.id,
      slug: author.slug ?? '',
      name: getAuthorDisplayName(author),
      alias: normalize(author.alias),
      country: normalize(author.country),
      summary,
      booksCount,
      picture: author.picture ?? null,
      sortLetter,
    };
  });
}
