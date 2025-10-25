import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AuthorRecordForCard } from '~/lib/authors';
import type { AuthorsIndexRecord, SeoMetaTag } from '~/lib/datocms/types';

export const AUTHORS_PAGE_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query AuthorsPage {
    authorsIndex {
      title
      subtitle
      _seoMetaTags {
        tag
        attributes
        content
      }
    }
    allAuthors(orderBy: sortBy_ASC, first: 500) {
      id
      fullName
      slug
      alias
      country
      biography
      sortBy
      picture {
        url
        alt
        responsiveImage(imgixParams: { fit: crop, w: 600, h: 600, auto: format }) {
          ...ResponsiveImageFragment
        }
      }
    }
    allBooks(first: 500) {
      id
      authors {
        id
      }
    }
  }
`;

export type AuthorsPageQueryResult = {
  authorsIndex: (AuthorsIndexRecord & { _seoMetaTags: SeoMetaTag[] | null }) | null;
  allAuthors: AuthorRecordForCard[];
  allBooks: Array<{
    id: string;
    authors: Array<{
      id: string;
    }>;
  }>;
};
