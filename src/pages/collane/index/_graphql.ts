import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { RESPONSIVE_IMAGE_CARD_FIELDS, TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AssetImage } from '~/lib/datocms/types';

/** The index page and every collection (the CDA default page is 20: ask for all of them). */
export const COLLECTIONS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  query CollectionsPage {
    collectionsIndexPage: allIndexPages(filter: { slug: { eq: "collane" } }, first: 1) {
      ...IndexHeroFields
    }
    allCollections(orderBy: name_ASC, first: 100) {
      id
      name
      slug
      description
    }
  }
`;

export type CollectionsQueryResult = {
  collectionsIndexPage: IndexHeroFields[] | null;
  allCollections: Array<{
    id: string;
    name: string | null;
    slug: string | null;
    description: string | null;
  }>;
};

/** How many recent books each shelf reads; archived ones are skipped, four covers are shown. */
const SHELF_BOOKS = 6;

/**
 * One query for every shelf: per collection (aliased by index) the newest books by print year, the
 * total and the out-of-catalogue count. Exact counts without reading the whole catalogue.
 */
export function buildCollectionShelvesQuery(collectionIds: string[]): string {
  const fields = collectionIds
    .filter((id) => /^[A-Za-z0-9_-]+$/.test(id))
    .map(
      (id, index) => `
    books${index}: allBooks(
      filter: { collection: { eq: "${id}" } }
      orderBy: [printYear_DESC, title_ASC]
      first: ${SHELF_BOOKS}
    ) {
      id
      title
      slug
      printYear
      archive
      coverImage {
        alt
        colors {
          hex
        }
        responsiveImage(imgixParams: { fit: max, h: 320, auto: format }) {
          ${RESPONSIVE_IMAGE_CARD_FIELDS}
        }
      }
    }
    total${index}: _allBooksMeta(filter: { collection: { eq: "${id}" } }) {
      count
    }
    archived${index}: _allBooksMeta(filter: { collection: { eq: "${id}" }, archive: { eq: true } }) {
      count
    }`,
    )
    .join('');
  return `query CollectionShelves {${fields}\n}`;
}

export type ShelfBookRecord = {
  id: string;
  title: string;
  slug: string;
  printYear: string | null;
  archive: boolean | null;
  coverImage: AssetImage | null;
};

export type CollectionShelvesResult = Record<string, ShelfBookRecord[] | { count: number }>;
