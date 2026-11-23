import type { APIRoute } from 'astro';
import { executeQuery } from '~/lib/datocms/executeQuery';
import { formatAuthorNames } from '~/lib/authors';
import { formatBookPrice } from '~/lib/books';
import { coverFieldPalette } from '~/lib/colors';

/**
 * Compact details of every published book, keyed by slug, for /cerca: the site search returns only
 * a page title and an excerpt, so the results page reads cover, authors, year, format and price
 * here (one cached file, loaded after the first search that finds a book).
 */
const PAGE_SIZE = 500;

const SEARCH_BOOKS_QUERY = /* GraphQL */ `
  query SearchBooks($first: IntType, $skip: IntType) {
    _allBooksMeta(filter: { _status: { eq: published } }) {
      count
    }
    allBooks(
      filter: { _status: { eq: published } }
      first: $first
      skip: $skip
      orderBy: title_ASC
    ) {
      slug
      title
      printYear
      format
      price
      archive
      authors {
        fullName
        alias
      }
      coverImage {
        url
        width
        height
        colors {
          hex
        }
      }
    }
  }
`;

type BookRow = {
  slug: string | null;
  title: string | null;
  printYear: string | null;
  format: string | null;
  price: number | null;
  archive: boolean | null;
  authors: Array<{ fullName: string | null; alias: string | null }> | null;
  coverImage: {
    url: string;
    width: number | null;
    height: number | null;
    colors: Array<{ hex: string }> | null;
  } | null;
};

type SearchBooksResult = { _allBooksMeta: { count: number } | null; allBooks: BookRow[] | null };

/** One entry per slug: t title, a authors, y year, f format (only when not paper), p price, x archived, c cover url, r cover ratio, k cover field colour. */
export type SearchBookEntry = {
  t: string;
  a?: string;
  y?: string;
  f?: string;
  p?: string;
  x?: 1;
  c?: string;
  r?: number;
  k?: string;
};

export const GET: APIRoute = async () => {
  const books: BookRow[] = [];
  let total = Infinity;
  while (books.length < total) {
    const data = await executeQuery<SearchBooksResult>(SEARCH_BOOKS_QUERY, {
      variables: { first: PAGE_SIZE, skip: books.length },
    });
    total = data._allBooksMeta?.count ?? 0;
    if (!data.allBooks?.length) break;
    books.push(...data.allBooks);
  }

  const entries: Record<string, SearchBookEntry> = {};
  for (const book of books) {
    const slug = book.slug?.trim();
    if (!slug) continue;
    const format = book.format?.trim();
    const cover = book.coverImage;
    const entry: SearchBookEntry = { t: book.title?.trim() || slug };
    const authors = formatAuthorNames(book.authors ?? [], { fallback: '' });
    if (authors) entry.a = authors;
    if (book.printYear) entry.y = book.printYear.slice(0, 4);
    if (format && format.toLowerCase() !== 'cartaceo') entry.f = format;
    const price = book.archive ? null : formatBookPrice(book.price);
    if (price) entry.p = price;
    if (book.archive) entry.x = 1;
    if (cover?.url) {
      entry.c = cover.url;
      if (cover.width && cover.height)
        entry.r = Math.round((cover.width / cover.height) * 100) / 100;
      entry.k = coverFieldPalette(cover.colors).copy;
    }
    entries[slug] = entry;
  }

  return new Response(JSON.stringify(entries), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
