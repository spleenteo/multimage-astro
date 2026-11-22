import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { RESPONSIVE_IMAGE_CARD_FIELDS, TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { ResponsiveImage } from '~/lib/datocms/types';

/** The CDA returns at most 100 records per query; the page reads further pages if needed. */
export const MAGAZINE_PAGE_SIZE = 100;

const POST_FIELDS = /* GraphQL */ `
  fragment MagazinePostFields on BlogPostRecord {
    id
    title
    slug
    abstract
    sticky
    createdAt
    _firstPublishedAt
    featuredImage {
      responsiveImage(
        imgixParams: { fit: crop, crop: focalpoint, w: 800, h: 500, auto: format }
      ) {
        ${RESPONSIVE_IMAGE_CARD_FIELDS}
      }
    }
    category {
      id
      name
      slug
    }
  }
`;

export const MAGAZINE_INDEX_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  ${POST_FIELDS}
  query MagazineIndexPage($first: IntType, $skip: IntType) {
    magazineIndexPage: allIndexPages(filter: { slug: { eq: "magazine" } }, first: 1) {
      ...IndexHeroFields
    }
    _allBlogPostsMeta {
      count
    }
    allBlogPosts(orderBy: _firstPublishedAt_DESC, first: $first, skip: $skip) {
      ...MagazinePostFields
    }
  }
`;

export const MAGAZINE_POSTS_QUERY = /* GraphQL */ `
  ${POST_FIELDS}
  query MagazinePosts($first: IntType, $skip: IntType) {
    allBlogPosts(orderBy: _firstPublishedAt_DESC, first: $first, skip: $skip) {
      ...MagazinePostFields
    }
  }
`;

export type MagazinePostRecord = {
  id: string;
  title: string | null;
  slug: string | null;
  abstract: string | null;
  sticky: boolean | null;
  createdAt: string | null;
  _firstPublishedAt: string | null;
  featuredImage: { responsiveImage: ResponsiveImage | null } | null;
  category: { id: string; name: string | null; slug: string | null } | null;
};

export type MagazinePostsResult = { allBlogPosts: MagazinePostRecord[] };

export type MagazineIndexQueryResult = MagazinePostsResult & {
  magazineIndexPage: IndexHeroFields[] | null;
  _allBlogPostsMeta: { count: number } | null;
};
