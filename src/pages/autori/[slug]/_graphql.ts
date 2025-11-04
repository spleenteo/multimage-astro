import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AuthorDetailRecord, SeoMetaTag } from '~/lib/datocms/types';
import type { BookRecordForCard } from '~/lib/books';

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
          imgixParams: { fit: crop, crop: focalpoint, w: 960, h: 960, auto: format }
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

export const AUTHOR_RELATED_BOOKS_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query AuthorRelatedBooks($authorIds: [ItemId!]) {
    _allBooksMeta(filter: { authors: { anyIn: $authorIds } }) {
      count
    }
    allBooks(filter: { authors: { anyIn: $authorIds } }, orderBy: printYear_DESC, first: 60) {
      id
      title
      subtitle
      slug
      promo
      description
      coverImage {
        url
        alt
        colors {
          hex
        }
        responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 520, auto: format }) {
          ...ResponsiveImageFragment
        }
      }
      authors {
        id
        fullName
        alias
        slug
      }
      license {
        name
        code
      }
      format
      price
      archive
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
  _allBooksMeta: {
    count: number;
  } | null;
  allBooks: BookRecordForCard[];
};

export type AuthorSlugsResult = {
  allAuthors: Array<{
    slug: string | null;
  }>;
};
