import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AuthorRecordForCard } from '~/lib/authors';
import type { AuthorIndexBook } from '~/lib/authorIndex';

/** The CDA caps `first` at 500: the books are read in pages of this size until the count is reached. */
export const AUTHORS_BOOKS_PAGE_SIZE = 500;

/**
 * Every book's authors, archive flag and cover (newest print year first), so each author gets an
 * exact in-catalogue count and their latest covers from a single read.
 */
const AUTHOR_BOOKS_FIELDS = /* GraphQL */ `
  _allBooksMeta {
    count
  }
  allBooks(orderBy: [printYear_DESC, title_ASC], first: $first, skip: $skip) {
    archive
    authors {
      id
    }
    coverImage {
      url
      width
      height
    }
  }
`;

/** What an index card shows. The full biography is not read: `oneLineBio` stands in for it. */
const AUTHOR_FIELDS = /* GraphQL */ `
  id
  fullName
  slug
  alias
  country
  oneLineBio
  sortBy
  picture {
    responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 128, h: 128, auto: format }) {
      src
    }
  }
`;

/**
 * The page: the first `$authors` profiles in A–Z order (the server renders the first letters) and
 * every book. `/authors-index.json` runs the same query with `$authors: 500` for all of them.
 */
export const AUTHORS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  query AuthorsPage($first: IntType!, $skip: IntType!, $authors: IntType!) {
    authorsIndexPage: allIndexPages(filter: { slug: { eq: "autori" } }, first: 1) {
      ...IndexHeroFields
    }
    allAuthors(orderBy: sortBy_ASC, first: $authors) {
      ${AUTHOR_FIELDS}
    }
    ${AUTHOR_BOOKS_FIELDS}
  }
`;

export const AUTHORS_BOOKS_QUERY = /* GraphQL */ `
  query AuthorsBooks($first: IntType!, $skip: IntType!) {
    ${AUTHOR_BOOKS_FIELDS}
  }
`;

export type AuthorsBooksResult = {
  _allBooksMeta: { count: number };
  allBooks: AuthorIndexBook[];
};

export type AuthorsPageQueryResult = AuthorsBooksResult & {
  authorsIndexPage: IndexHeroFields[] | null;
  allAuthors: AuthorRecordForCard[];
};
