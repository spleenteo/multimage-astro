import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BookRecordForCard } from '~/lib/books';
import type { EbooksIndexRecord, SeoMetaTag } from '~/lib/datocms/types';

export const EBOOKS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${BOOK_CARD_FRAGMENT}
  query EbooksPage {
    ebooksIndex {
      title
      subtitle
      _seoMetaTags {
        ...TagFragment
      }
    }
    allBooks(
      orderBy: printYear_DESC
      first: 500
      filter: { _status: { eq: published }, archive: { eq: false }, format: { eq: "Ebook" } }
    ) {
      ...BookCardFragment
    }
  }
`;

export type EbooksPageQueryResult = {
  ebooksIndex: (EbooksIndexRecord & { _seoMetaTags: SeoMetaTag[] | null }) | null;
  allBooks: BookRecordForCard[];
};
