import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import { BOOK_CARD_FRAGMENT } from '~/components/BookCard/_graphql';
import type { AuthorDetailRecord, SeoMetaTag } from '~/lib/datocms/types';
import type { BookRecordForCard } from '~/lib/books';

/** Books shown on a profile; past it, the page links to the catalogue filtered by author. */
export const AUTHOR_BOOKS_LIMIT = 100;

export const AUTHOR_DETAIL_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query AuthorDetailPage($slug: String) {
    author(filter: { slug: { eq: $slug } }) {
      id
      fullName
      alias
      country
      biography {
        value
      }
      picture {
        url
        alt
        responsiveImage(
          imgixParams: { fit: crop, crop: focalpoint, w: 320, h: 320, auto: format }
        ) {
          ...ResponsiveImageFragment
        }
      }
      pseudonyms {
        id
        fullName
        alias
        slug
      }
      _seoMetaTags {
        tag
        attributes
        content
      }
    }
  }
`;

/** The person's books under every name they sign with, newest print year first. */
export const AUTHOR_RELATED_BOOKS_QUERY = /* GraphQL */ `
  ${BOOK_CARD_FRAGMENT}
  query AuthorRelatedBooks($authorIds: [ItemId!]) {
    _allBooksMeta(filter: { authors: { anyIn: $authorIds } }) {
      count
    }
    archivedMeta: _allBooksMeta(filter: { authors: { anyIn: $authorIds }, archive: { eq: true } }) {
      count
    }
    allBooks(
      filter: { authors: { anyIn: $authorIds } }
      orderBy: [printYear_DESC, title_ASC]
      first: ${AUTHOR_BOOKS_LIMIT}
    ) {
      ...BookCardFragment
    }
  }
`;

export const AUTHOR_SLUGS_QUERY = /* GraphQL */ `
  query AuthorSlugsForStaticPaths {
    allAuthors(orderBy: sortBy_ASC, first: 500) {
      slug
    }
  }
`;

export type AuthorDetailResult = {
  author: (AuthorDetailRecord & { _seoMetaTags: SeoMetaTag[] | null }) | null;
};

export type AuthorRelatedBooksResult = {
  _allBooksMeta: { count: number } | null;
  archivedMeta: { count: number } | null;
  allBooks: BookRecordForCard[];
};

export type AuthorSlugsResult = {
  allAuthors: Array<{
    slug: string | null;
  }>;
};
