import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';

export const BOOK_CAROUSEL_SECTION_FRAGMENT = /* GraphQL */ `
  ${BOOK_CARD_FRAGMENT}
  fragment BookCarouselSectionFragment on BookCarouselRecord {
    __typename
    id
    title
    description
    books {
      ...BookCardFragment
    }
  }
`;
