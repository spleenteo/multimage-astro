import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BookRecordForCard } from '~/lib/books';

// Re-exported so the route files can import the page size alongside the query.
// The full catalogue (~340 published, non-archived books) used to render in a
// single ~1 MB document; paginating keeps each page small, which directly cuts
// the Fast Origin Transfer billed on every render. Page 1 lives at /libri,
// pages 2..N at /libri/pagina/<n>.
export { BOOKS_PER_PAGE } from '~/lib/books';

export const BOOKS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  ${BOOK_CARD_FRAGMENT}
  query BooksPage($first: IntType!, $skip: IntType!) {
    booksIndexPage: allIndexPages(filter: { slug: { eq: "libri" } }, first: 1) {
      ...IndexHeroFields
    }
    _allBooksMeta(filter: { _status: { eq: published }, archive: { eq: false } }) {
      count
    }
    allBooks(
      orderBy: printYear_DESC
      first: $first
      skip: $skip
      filter: { _status: { eq: published }, archive: { eq: false } }
    ) {
      ...BookCardFragment
    }
  }
`;

export type BooksPageQueryResult = {
  booksIndexPage: IndexHeroFields[] | null;
  _allBooksMeta: { count: number };
  allBooks: BookRecordForCard[];
};
