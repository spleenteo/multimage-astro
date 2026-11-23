import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { TAG_FRAGMENT } from '~/lib/datocms/commonFragments';

/**
 * The /libri catalogue: the page carries the facet data of every published book (in-catalogue and
 * out-of-catalogue) and the first cards; the browser filters, and builds the other cards from
 * `/catalogue-books.json`. The CDA caps `first` at 500, so the books are read in pages of that
 * size until `_allBooksMeta.count` is reached.
 */
export const CATALOGUE_PAGE_SIZE = 500;

/**
 * What the facets, the search and the sort need from every book: no cover, no numbers. Not
 * `BookCardFragment`: with every book in one read, its `description`, `promo`, `responsiveImage`
 * and `license` are most of the response and the catalogue shows none of them.
 */
const CATALOGUE_FACET_FIELDS = /* GraphQL */ `
  slug
  title
  subtitle
  printYear
  format
  archive
  highlight
  originalLang
  translator
  authors {
    slug
    fullName
    alias
  }
  collection {
    slug
    name
  }
`;

/** What a catalogue card shows (the server renders the first ones, the rest come as JSON). */
export const CATALOGUE_CARD_FIELDS = /* GraphQL */ `
  slug
  title
  subtitle
  printYear
  pages
  price
  format
  archive
  coverImage {
    url
    width
    height
    colors {
      hex
    }
  }
  authors {
    fullName
    alias
  }
  collection {
    name
  }
`;

const BOOKS_ARGUMENTS = /* GraphQL */ `orderBy: [printYear_DESC, title_ASC], filter: { _status: { eq: published } }`;

/**
 * `firstBooks` carries the cards the server renders; it reads a few more than CATALOGUE_CHUNK
 * because out-of-catalogue books are skipped.
 */
export const BOOKS_CATALOGUE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  query BooksCatalogue($first: IntType!, $skip: IntType!, $cards: IntType!) {
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
    firstBooks: allBooks(${BOOKS_ARGUMENTS}, first: $cards) {
      ${CATALOGUE_CARD_FIELDS}
    }
    allBooks(${BOOKS_ARGUMENTS}, first: $first, skip: $skip) {
      ${CATALOGUE_FACET_FIELDS}
    }
  }
`;

/** Further pages of facet records, past the CDA's 500. */
export const BOOKS_CATALOGUE_FACETS_QUERY = /* GraphQL */ `
  query BooksCatalogueFacets($first: IntType!, $skip: IntType!) {
    allBooks(${BOOKS_ARGUMENTS}, first: $first, skip: $skip) {
      ${CATALOGUE_FACET_FIELDS}
    }
  }
`;

/** Every card, for `/catalogue-books.json`. */
export const BOOKS_CATALOGUE_CARDS_QUERY = /* GraphQL */ `
  query BooksCatalogueCards($first: IntType!, $skip: IntType!) {
    _allBooksMeta(filter: { _status: { eq: published } }) {
      count
    }
    allBooks(${BOOKS_ARGUMENTS}, first: $first, skip: $skip) {
      ${CATALOGUE_CARD_FIELDS}
    }
  }
`;

type AuthorName = { fullName?: string | null; alias?: string | null };

export type CatalogueFacetRecord = {
  slug: string;
  title: string;
  subtitle?: string | null;
  printYear?: string | null;
  format?: string | null;
  archive?: boolean | null;
  highlight?: boolean | null;
  originalLang?: string | null;
  translator?: string | null;
  authors?: Array<AuthorName & { slug?: string | null }> | null;
  collection?: { slug?: string | null; name?: string | null } | null;
};

export type CatalogueCardRecord = {
  slug: string;
  title: string;
  subtitle?: string | null;
  printYear?: string | null;
  pages?: number | null;
  price?: number | null;
  format?: string | null;
  archive?: boolean | null;
  coverImage?: {
    url: string;
    width?: number | null;
    height?: number | null;
    colors?: Array<{ hex: string }> | null;
  } | null;
  authors?: AuthorName[] | null;
  collection?: { name?: string | null } | null;
};

export type BooksCatalogueFacetsResult = { allBooks: CatalogueFacetRecord[] };

export type BooksCatalogueQueryResult = BooksCatalogueFacetsResult & {
  booksIndexPage: IndexHeroFields[] | null;
  _allBooksMeta: { count: number };
  allCollections: Array<{ id: string; name: string; slug: string }>;
  firstBooks: CatalogueCardRecord[];
};

export type BooksCatalogueCardsResult = {
  _allBooksMeta: { count: number };
  allBooks: CatalogueCardRecord[];
};
