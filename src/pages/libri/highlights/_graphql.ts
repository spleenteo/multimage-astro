import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BookRecordForCard } from '~/lib/books';

export const HIGHLIGHTS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  ${BOOK_CARD_FRAGMENT}
  query HighlightsPage {
    highlightsIndexPage: allIndexPages(filter: { slug: { eq: "highlights" } }, first: 1) {
      ...IndexHeroFields
    }
    allBooks(
      orderBy: printYear_DESC
      first: 500
      filter: { _status: { eq: published }, archive: { eq: false }, highlight: { eq: true } }
    ) {
      ...BookCardFragment
    }
  }
`;

export type HighlightsPageQueryResult = {
  highlightsIndexPage: IndexHeroFields[] | null;
  allBooks: BookRecordForCard[];
};
