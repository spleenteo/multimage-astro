import { SINGLE_AUTHOR_BLOCK_FIELDS, SINGLE_BOOK_BLOCK_FIELDS } from '~/components/datocms/structuredText/_graphql';
import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BlogPostRecord, SeoMetaTag } from '~/lib/datocms/types';

export const MAGAZINE_POST_QUERY = /* GraphQL */ `
  ${BOOK_CARD_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query MagazinePost($slug: String) {
    blogPost(filter: { slug: { eq: $slug } }) {
      id
      title
      slug
      abstract
      sticky
      createdAt
      _firstPublishedAt
      body {
        value
        blocks {
          __typename
          ... on VideoRecord {
            id
            video {
              title
              url
              thumbnailUrl
              provider
              providerUid
            }
          }
          ${SINGLE_BOOK_BLOCK_FIELDS}
          ${SINGLE_AUTHOR_BLOCK_FIELDS}
          ... on BannerRecord {
            id
            title
            content
            link
            imagePosition
            featuredImage {
              responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 960, auto: format }) {
                ...ResponsiveImageFragment
              }
            }
          }
          ... on ImageBlockRecord {
            id
            image {
              responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 960, auto: format }) {
                ...ResponsiveImageFragment
              }
            }
            caption
          }
          ... on BookCarouselRecord {
            id
            title
            description
            books {
              ...BookCardFragment
            }
          }
          ... on CtaButtonWithImageRecord {
            id
            title
            content
            image {
              responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 960, auto: format }) {
                ...ResponsiveImageFragment
              }
            }
            buttons {
              id
              label
              url
              primary
            }
          }
        }
        links {
          __typename
          ... on AuthorRecord {
            id
            fullName
            alias
            slug
          }
          ... on PageRecord {
            id
            title
            slug
          }
          ... on BookRecord {
            id
            title
            slug
          }
          ... on BlogPostRecord {
            id
            title
            slug
          }
        }
      }
      featuredImage {
        responsiveImage(imgixParams: { fit: max, w: 1360, h: 1360, auto: format }) {
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
      seo {
        title
        description
        image {
          url
          alt
        }
      }
      _seoMetaTags {
        tag
        attributes
        content
      }
    }
  }
`;

/** Up to three more articles of the same category, newest first, for the end of the article. */
export const MAGAZINE_RELATED_QUERY = /* GraphQL */ `
  query MagazineRelated($id: ItemId, $category: ItemId) {
    allBlogPosts(
      filter: { id: { neq: $id }, category: { eq: $category } }
      orderBy: _firstPublishedAt_DESC
      first: 3
    ) {
      id
      title
      slug
      createdAt
      _firstPublishedAt
    }
  }
`;

export type MagazineRelatedResult = {
  allBlogPosts: Array<{
    id: string;
    title: string | null;
    slug: string | null;
    createdAt: string | null;
    _firstPublishedAt: string | null;
  }>;
};

export const MAGAZINE_POST_SLUGS_QUERY = /* GraphQL */ `
  query MagazinePostSlugs {
    allBlogPosts(first: 500) {
      slug
    }
  }
`;

export type MagazinePostQueryResult = {
  blogPost:
    | (BlogPostRecord & {
        _seoMetaTags: SeoMetaTag[] | null;
        _firstPublishedAt?: string | null;
      })
    | null;
};

export type MagazinePostSlugsResult = {
  allBlogPosts: Array<{
    slug: string | null;
  }>;
};
