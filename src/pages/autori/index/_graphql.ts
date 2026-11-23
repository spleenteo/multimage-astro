import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AuthorRecordForCard } from '~/lib/authors';

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
    id
    archive
    authors {
      id
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
`;

export const AUTHORS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  query AuthorsPage($first: IntType!, $skip: IntType!) {
    authorsIndexPage: allIndexPages(filter: { slug: { eq: "autori" } }, first: 1) {
      ...IndexHeroFields
    }
    allAuthors(orderBy: sortBy_ASC, first: 500) {
      id
      fullName
      slug
      alias
      biography {
        value
      }
      sortBy
      picture {
        responsiveImage(
          imgixParams: { fit: crop, crop: focalpoint, w: 128, h: 128, auto: format }
        ) {
          src
        }
      }
    }
    ${AUTHOR_BOOKS_FIELDS}
  }
`;

export const AUTHORS_BOOKS_QUERY = /* GraphQL */ `
  query AuthorsBooks($first: IntType!, $skip: IntType!) {
    ${AUTHOR_BOOKS_FIELDS}
  }
`;

export type AuthorBookRecord = {
  id: string;
  archive: boolean | null;
  authors: Array<{ id: string }>;
  coverImage: {
    url: string;
    width: number | null;
    height: number | null;
    colors: Array<{ hex: string }> | null;
  } | null;
};

export type AuthorsBooksResult = {
  _allBooksMeta: { count: number };
  allBooks: AuthorBookRecord[];
};

export type AuthorsPageQueryResult = AuthorsBooksResult & {
  authorsIndexPage: IndexHeroFields[] | null;
  allAuthors: AuthorRecordForCard[];
};
