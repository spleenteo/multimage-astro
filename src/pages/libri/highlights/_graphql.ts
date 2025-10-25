import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BookRecordForCard } from '~/lib/books';
import type { HighlightsIndexRecord, SeoMetaTag } from '~/lib/datocms/types';

export const HIGHLIGHTS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${BOOK_CARD_FRAGMENT}
  query HighlightsPage {
    highlightsIndex {
      title
      subtitle
      _seoMetaTags {
        ...TagFragment
      }
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
  highlightsIndex: (HighlightsIndexRecord & { _seoMetaTags: SeoMetaTag[] | null }) | null;
  allBooks: BookRecordForCard[];
};
