import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { RESPONSIVE_IMAGE_FRAGMENT, TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AuthorRecordForCard } from '~/lib/authors';

export const AUTHORS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  query AuthorsPage {
    authorsIndexPage: allIndexPages(filter: { slug: { eq: "autori" } }, first: 1) {
      ...IndexHeroFields
    }
    allAuthors(orderBy: sortBy_ASC, first: 500) {
      id
      fullName
      slug
      alias
      country
      biography {
        value
      }
      sortBy
      picture {
        url
        alt
        responsiveImage(
          imgixParams: { fit: crop, crop: focalpoint, w: 600, h: 600, auto: format }
        ) {
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
  authorsIndexPage: IndexHeroFields[] | null;
  allAuthors: AuthorRecordForCard[];
  allBooks: Array<{
    id: string;
    authors: Array<{
      id: string;
    }>;
  }>;
};
