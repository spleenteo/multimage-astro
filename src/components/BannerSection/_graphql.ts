export const BANNER_SECTION_FRAGMENT = /* GraphQL */ `
  fragment BannerSectionBlock on BannerRecord {
    id
    title
    content
    link
    imagePosition
    featuredImage {
      alt
      title
      colors {
        hex
      }
      responsiveImage(imgixParams: { fit: max, w: 600, auto: format }) {
        ...ResponsiveImageFragment
      }
    }
  }
`;
