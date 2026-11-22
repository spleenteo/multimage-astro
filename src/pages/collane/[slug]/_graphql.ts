import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
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
        responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 320, auto: format }) {
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

/** A collection page lists up to this many books; beyond it, the catalogue filtered by collana. */
export const COLLECTION_BOOKS_LIMIT = 100;

export const COLLECTION_RELATED_BOOKS_QUERY = /* GraphQL */ `
  ${BOOK_CARD_FRAGMENT}
  query CollectionRelatedBooks($collectionId: ItemId) {
    _allBooksMeta(filter: { collection: { eq: $collectionId } }) {
      count
    }
    archivedMeta: _allBooksMeta(filter: { collection: { eq: $collectionId }, archive: { eq: true } }) {
      count
    }
    allBooks(
      filter: { collection: { eq: $collectionId } }
      orderBy: [printYear_DESC, title_ASC]
      first: ${COLLECTION_BOOKS_LIMIT}
    ) {
      ...BookCardFragment
    }
  }
`;

export const COLLECTION_SLUGS_QUERY = /* GraphQL */ `
  query CollectionSlugsForStaticPaths {
    allCollections(orderBy: name_ASC, first: 100) {
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
  archivedMeta: {
    count: number;
  } | null;
  allBooks: BookRecordForCard[];
};

export type CollectionSlugsResult = {
  allCollections: Array<{
    slug: string | null;
  }>;
};
