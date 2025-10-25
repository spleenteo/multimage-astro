import { COLLECTION_CARD_FRAGMENT } from '~/components/CollectionCard';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type {
  CollectionSummaryRecord,
  CollectionsIndexRecord,
  SeoMetaTag,
} from '~/lib/datocms/types';

export const COLLECTIONS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${COLLECTION_CARD_FRAGMENT}
  query CollectionsPage {
    collectionsIndex {
      title
      subtitle
      seoMetaTags: _seoMetaTags {
        ...TagFragment
      }
    }
    allCollections(orderBy: name_ASC) {
      ...CollectionCardFragment
    }
    allBooks(first: 500) {
      id
      collection {
        id
      }
    }
  }
`;

export type CollectionsQueryResult = {
  collectionsIndex: (CollectionsIndexRecord & { seoMetaTags: SeoMetaTag[] | null }) | null;
  allCollections: Array<
    Pick<CollectionSummaryRecord, 'id' | 'name' | 'slug' | 'description' | 'logo'>
  >;
  allBooks: Array<{
    id: string;
    collection: {
      id: string | null;
    } | null;
  }>;
};
