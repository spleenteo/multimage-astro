import { COLLECTION_CARD_FRAGMENT } from '~/components/CollectionCard';
import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { CollectionSummaryRecord } from '~/lib/datocms/types';

export const COLLECTIONS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  ${COLLECTION_CARD_FRAGMENT}
  query CollectionsPage {
    collectionsIndexPage: allIndexPages(filter: { slug: { eq: "collane" } }, first: 1) {
      ...IndexHeroFields
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
  collectionsIndexPage: IndexHeroFields[] | null;
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
