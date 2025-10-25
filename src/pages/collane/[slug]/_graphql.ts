import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { CollectionSummaryRecord, SeoMetaTag } from '~/lib/datocms/types';
import type { BookRecordForCard } from '~/lib/books';

export const COLLECTION_DETAIL_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query CollectionDetailPage($slug: String) {
    collection(filter: { slug: { eq: $slug } }) {
      id
      name
      description
      slug
      logo {
        url
        alt
        responsiveImage(imgixParams: { fit: max, w: 320, auto: format }) {
          ...ResponsiveImageFragment
        }
      }
      _seoMetaTags {
        tag
        attributes
        content
      }
    }
  }
`;

export const COLLECTION_RELATED_BOOKS_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query CollectionRelatedBooks($collectionId: ItemId) {
    _allBooksMeta(filter: { collection: { eq: $collectionId } }) {
      count
    }
    allBooks(filter: { collection: { eq: $collectionId } }, orderBy: title_ASC, first: 60) {
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
        responsiveImage(imgixParams: { fit: max, w: 520, auto: format }) {
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

export const COLLECTION_SLUGS_QUERY = /* GraphQL */ `
  query CollectionSlugsForStaticPaths {
    allCollections(orderBy: name_ASC) {
      slug
    }
  }
`;

export type CollectionDetailResult = {
  collection: (CollectionSummaryRecord & { _seoMetaTags: SeoMetaTag[] | null }) | null;
};

export type CollectionRelatedBooksResult = {
  _allBooksMeta: {
    count: number;
  } | null;
  allBooks: BookRecordForCard[];
};

export type CollectionSlugsResult = {
  allCollections: Array<{
    slug: string | null;
  }>;
};
