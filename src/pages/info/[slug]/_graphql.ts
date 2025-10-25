import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';

export const INFO_PAGE_QUERY = /* GraphQL */ `
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
          ... on ImageRecord {
            id
            image {
              responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 960, auto: format }) {
                ...ResponsiveImageFragment
              }
            }
          }
          ... on SectionRecord {
            id
            title
            body
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
