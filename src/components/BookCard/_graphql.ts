export const BOOK_CARD_FRAGMENT = /* GraphQL */ `
  fragment BookCardFragment on BookRecord {
    id
    title
    subtitle
    slug
    promo
    description
    printYear
    coverImage {
      url
      alt
      colors {
        hex
      }
      responsiveImage(imgixParams: { fit: max, w: 520, auto: format }) {
        ...ResponsiveImageFragment
      }
    }
    price
    authors {
      id
      fullName
      alias
      slug
    }
    license {
      name
      code
    }
    format
    archive
  }
`;
