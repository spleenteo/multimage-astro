import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { MagazineIndexRecord, SeoMetaTag } from '~/lib/datocms/types';
import type { ResponsiveImage } from '~/lib/datocms/types';

export const MAGAZINE_INDEX_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query MagazineIndexPage {
    magazineIndex {
      title
      subtitle
      _seoMetaTags {
        tag
        attributes
        content
      }
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
  magazineIndex: (MagazineIndexRecord & { _seoMetaTags: SeoMetaTag[] | null }) | null;
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
