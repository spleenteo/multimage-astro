import { SINGLE_AUTHOR_BLOCK_FIELDS, SINGLE_BOOK_BLOCK_FIELDS } from '~/components/datocms/structuredText/_graphql';
import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';

export const INFO_PAGE_QUERY = /* GraphQL */ `
  ${BOOK_CARD_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query InfoPage($slug: String) {
    page(filter: { slug: { eq: $slug } }) {
      id
      title
      subtitle
      slug
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
        }
        links {
          __typename
          ... on AuthorRecord {
            id
            fullName
            alias
            slug
          }
          ... on CollectionRecord {
            id
            name
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
      label
      menu
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

export const INFO_PAGE_SLUGS_QUERY = /* GraphQL */ `
  query InfoPageSlugs {
    allPages(first: 200) {
      slug
    }
  }
`;
