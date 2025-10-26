import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { BlogPostRecord, SeoMetaTag } from '~/lib/datocms/types';

export const MAGAZINE_POST_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query MagazinePost($slug: String) {
    blogPost(filter: { slug: { eq: $slug } }) {
      id
      title
      slug
      abstract
      sticky
      createdAt
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
          ... on SingleBookRecord {
            id
            book {
              id
              title
              subtitle
              slug
              coverImage {
                responsiveImage(
                  imgixParams: { fit: crop, crop: focalpoint, w: 600, h: 600, auto: format }
                ) {
                  ...ResponsiveImageFragment
                }
              }
            }
          }
          ... on SingleAuthorRecord {
            id
            author {
              id
              fullName
              alias
              slug
              picture {
                responsiveImage(
                  imgixParams: { fit: crop, crop: focalpoint, w: 600, h: 600, auto: format }
                ) {
                  ...ResponsiveImageFragment
                }
              }
            }
          }
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
        responsiveImage(
          imgixParams: { fit: crop, crop: focalpoint, w: 1280, h: 720, auto: format }
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
      })
    | null;
};

export type MagazinePostSlugsResult = {
  allBlogPosts: Array<{
    slug: string | null;
  }>;
};
