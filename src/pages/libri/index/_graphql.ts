import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BookRecordForCard } from '~/lib/books';

/**
 * The /libri catalogue renders every published book (in-catalogue and out-of-catalogue) in one
 * document; the faceted filters show and hide cards in the browser. The CDA caps `first` at 500,
 * so the books are read in pages of that size until `_allBooksMeta.count` is reached.
 */
export const CATALOGUE_PAGE_SIZE = 500;

export const BOOKS_CATALOGUE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  ${BOOK_CARD_FRAGMENT}
  query BooksCatalogue($first: IntType!, $skip: IntType!) {
    booksIndexPage: allIndexPages(filter: { slug: { eq: "libri" } }, first: 1) {
      ...IndexHeroFields
    }
    _allBooksMeta(filter: { _status: { eq: published } }) {
      count
    }
    allCollections(orderBy: name_ASC, first: 100) {
      id
      name
      slug
    }
    allBooks(
      orderBy: [printYear_DESC, title_ASC]
      first: $first
      skip: $skip
      filter: { _status: { eq: published } }
    ) {
      ...BookCardFragment
      highlight
      originalLang
      translator
    }
  }
`;

export type CatalogueBookRecord = BookRecordForCard & {
  highlight?: boolean | null;
  originalLang?: string | null;
  translator?: string | null;
};

export type BooksCatalogueQueryResult = {
  booksIndexPage: IndexHeroFields[] | null;
  _allBooksMeta: { count: number };
  allCollections: Array<{ id: string; name: string; slug: string }>;
  allBooks: CatalogueBookRecord[];
};
