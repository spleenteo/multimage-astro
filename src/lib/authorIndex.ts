/**
 * The /autori index: one item per author with books, shared by the page (which renders the first
 * letters), by `/authors-index.json` (every author, for the cards the browser builds) and by
 * `AuthorCard`. Server-rendered and browser-built cards come from the same values.
 */
import {
  extractSortLetter,
  mapAuthorsToCards,
  sortAuthorsForIndex,
  type AuthorRecordForCard,
} from '~/lib/authors';

/** Letters the server renders; the browser adds the others from the JSON. */
export const AUTHORS_SERVER_LETTERS = ['A', 'B', 'C', 'D', 'E'];
/** Authors read for the server letters (profiles without books included), with some margin. */
export const AUTHORS_SERVER_READ = 130;
export const AUTHORS_INDEX_URL = '/authors-index.json';

const COVERS_PER_AUTHOR = 4;
/** Covers are small: one image at twice the displayed height serves every screen. */
const COVER_HEIGHT = 56;

export type AuthorIndexBook = {
  archive: boolean | null;
  /** `slug`, `sortBy` and `fullName` place every author with books in a letter (`authorIndexLetters`). */
  authors: Array<{
    id: string;
    slug?: string | null;
    sortBy?: string | null;
    fullName?: string | null;
  }>;
  coverImage: { url: string; width: number | null; height: number | null } | null;
};

type Cover = { src: string; width: number; height: number };

/** An author in the index. Short keys: this is also the JSON the browser reads. */
export type AuthorIndexItem = {
  /** Slug: key of the card. */
  k: string;
  /** Letter group and its anchor id. */
  l: string;
  a: string;
  /** Display name, legal name under an alias. */
  n: string;
  ln?: string;
  /** "Italia · 3 libri · 1 fuori catalogo". */
  sz: string;
  /** One-line bio. */
  b?: string;
  /** Portrait URL (128px square), or the initial when there is none. */
  p?: string;
  i: string;
  /** The way to the author's books in the catalogue. */
  h: string;
  /** Latest covers, in-catalogue ones first. */
  cv: Cover[];
  /** Text the search matches. */
  s: string;
};

function letterAnchor(letter: string): string {
  const cleaned = letter
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]/g, '');
  return `lettera-${cleaned.length > 0 ? cleaned.toLowerCase() : 'other'}`;
}

export type AuthorIndexLetter = { letter: string; anchorId: string; count: number };

/**
 * The letters of the whole index, in order, with how many authors each holds: known from the books
 * alone, so the page can render the full letter strip and the total without reading every profile.
 */
export function authorIndexLetters(books: AuthorIndexBook[]): AuthorIndexLetter[] {
  const authors = new Map<string, AuthorRecordForCard>();
  for (const book of books) {
    for (const author of book.authors ?? []) {
      if (author?.id && author.slug) authors.set(author.id, author);
    }
  }
  const letters = new Map<string, AuthorIndexLetter>();
  for (const author of sortAuthorsForIndex([...authors.values()])) {
    const letter = extractSortLetter(author) || '#';
    const anchorId = letterAnchor(letter);
    const entry = letters.get(anchorId) ?? { letter, anchorId, count: 0 };
    entry.count += 1;
    letters.set(anchorId, entry);
  }
  return [...letters.values()];
}

const plural = (count: number) => (count === 1 ? '1 libro' : `${count} libri`);

/** Authors with at least one book, A–Z, each with counts and latest covers. */
export function buildAuthorIndex(
  records: AuthorRecordForCard[],
  books: AuthorIndexBook[],
): AuthorIndexItem[] {
  // Per author: books in and out of the catalogue, and the newest covers of each kind.
  type Own = { inCatalogue: number; archived: number; covers: Cover[]; archivedCovers: Cover[] };
  const booksByAuthor = new Map<string, Own>();
  for (const book of books) {
    const isArchived = book.archive === true;
    const image = book.coverImage;
    const ratio = image?.width && image?.height ? image.width / image.height : 0.7;
    const cover: Cover | null = image?.url
      ? {
          src: `${image.url}?h=${COVER_HEIGHT * 2}&fit=max&auto=format`,
          width: Math.round(COVER_HEIGHT * ratio),
          height: COVER_HEIGHT,
        }
      : null;
    for (const author of book.authors ?? []) {
      if (!author?.id) continue;
      const own = booksByAuthor.get(author.id) ?? {
        inCatalogue: 0,
        archived: 0,
        covers: [],
        archivedCovers: [],
      };
      if (isArchived) own.archived += 1;
      else own.inCatalogue += 1;
      if (cover) (isArchived ? own.archivedCovers : own.covers).push(cover);
      booksByAuthor.set(author.id, own);
    }
  }

  const sorted = sortAuthorsForIndex(records);
  const byId = new Map(sorted.map((record) => [record.id, record]));

  // Profiles without a single book stay out of the index.
  return mapAuthorsToCards(sorted)
    .filter((author) => author.slug.length > 0 && booksByAuthor.has(author.id))
    .map((author) => {
      const own = booksByAuthor.get(author.id)!;
      const record = byId.get(author.id);
      const fullName = record?.fullName?.trim() || null;
      // Under an alias ("Silo"), the legal name ("Mario Luis Rodríguez Cobos").
      const legalName = author.alias && fullName && fullName !== author.name ? fullName : null;
      const count =
        own.inCatalogue > 0
          ? [plural(own.inCatalogue), own.archived > 0 ? `${own.archived} fuori catalogo` : null]
              .filter(Boolean)
              .join(' · ')
          : `${plural(own.archived)} fuori catalogo`;
      const letter = author.sortLetter || '#';
      const bio = record?.oneLineBio?.trim();
      const portrait = author.picture?.responsiveImage?.src;
      const item: AuthorIndexItem = {
        k: author.slug,
        l: letter,
        a: letterAnchor(letter),
        n: author.name,
        // Country first, when the editors filled it: "Italia · 3 libri".
        sz: [author.country, count].filter(Boolean).join(' · '),
        i: author.name.trim().charAt(0).toUpperCase() || '·',
        h: `/libri?autore=${encodeURIComponent(author.slug)}${own.inCatalogue === 0 ? '&archivio=1' : ''}`,
        cv: [...own.covers, ...own.archivedCovers].slice(0, COVERS_PER_AUTHOR),
        s: [author.name, author.alias, fullName].filter(Boolean).join(' '),
      };
      if (legalName) item.ln = legalName;
      if (bio) item.b = bio;
      if (portrait) item.p = portrait;
      return item;
    });
}
