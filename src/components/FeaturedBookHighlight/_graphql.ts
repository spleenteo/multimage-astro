export const FEATURED_BOOK_HIGHLIGHT_FRAGMENT = /* GraphQL */ `
  fragment FeaturedBookHighlightBlock on SingleBookRecord {
    id
    book {
      id
      title
      subtitle
      slug
      promo
      description
      coverImage {
        url
        alt
        title
        colors {
          hex
        }
        responsiveImage(imgixParams: { fit: max, w: 520, auto: format }) {
          ...ResponsiveImageFragment
        }
      }
      authors {
        id
        fullName
        alias
        slug
        picture {
          alt
          responsiveImage(imgixParams: { fit: crop, w: 220, h: 220, auto: format, crop: faces }) {
            ...ResponsiveImageFragment
          }
        }
      }
      license {
        name
        code
      }
      format
      price
      printYear
      archive
      collection {
        id
        name
        slug
      }
    }
  }
`;
