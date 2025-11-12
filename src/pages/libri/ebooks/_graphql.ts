import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BookRecordForCard } from '~/lib/books';

export const EBOOKS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  ${BOOK_CARD_FRAGMENT}
  query EbooksPage {
    ebooksIndexPage: allIndexPages(filter: { slug: { eq: "ebooks" } }, first: 1) {
      ...IndexHeroFields
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
  ebooksIndexPage: IndexHeroFields[] | null;
  allBooks: BookRecordForCard[];
};
