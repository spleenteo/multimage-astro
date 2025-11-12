import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { RESPONSIVE_IMAGE_FRAGMENT, TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { ResponsiveImage } from '~/lib/datocms/types';

export const MAGAZINE_INDEX_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  query MagazineIndexPage {
    magazineIndexPage: allIndexPages(filter: { slug: { eq: "magazine" } }, first: 1) {
      ...IndexHeroFields
    }
    allBlogPosts(orderBy: createdAt_DESC, first: 60) {
      id
      title
      slug
      abstract
      sticky
      createdAt
      featuredImage {
        responsiveImage(
          imgixParams: { fit: crop, crop: focalpoint, w: 800, h: 520, auto: format }
        ) {
          ...ResponsiveImageFragment
        }
      }
      category {
        id
        name
        slug
      }
      author {
        id
        slug
        name
      }
    }
  }
`;

export type MagazineIndexQueryResult = {
  magazineIndexPage: IndexHeroFields[] | null;
  allBlogPosts: Array<{
    id: string;
    title: string | null;
    slug: string | null;
    abstract: string | null;
    sticky: boolean | null;
    createdAt: string | null;
    featuredImage: {
      responsiveImage: ResponsiveImage | null;
    } | null;
    category: {
      id: string;
      name: string | null;
      slug: string | null;
    } | null;
    author: {
      id: string;
      slug: string | null;
      name: string | null;
    } | null;
  }>;
};
