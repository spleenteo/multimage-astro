import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BookRecordForCard } from '~/lib/books';
import type { ArchiveIndexRecord, SeoMetaTag } from '~/lib/datocms/types';

export const ARCHIVE_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${BOOK_CARD_FRAGMENT}
  query ArchivePage {
    archiveIndex {
      title
      subtitle
      _seoMetaTags {
        ...TagFragment
      }
    }
    allBooks(
      orderBy: printYear_DESC
      first: 500
      filter: { _status: { eq: published }, archive: { eq: true } }
    ) {
      ...BookCardFragment
    }
  }
`;

export type ArchivePageQueryResult = {
  archiveIndex: (ArchiveIndexRecord & { _seoMetaTags: SeoMetaTag[] | null }) | null;
  allBooks: BookRecordForCard[];
};
