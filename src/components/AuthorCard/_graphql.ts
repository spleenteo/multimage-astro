export const AUTHOR_CARD_FRAGMENT = /* GraphQL */ `
  fragment AuthorCardFragment on AuthorRecord {
    id
    fullName
    slug
    alias
    country
    biography
    sortBy
    picture {
      url
      alt
      responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 600, h: 600, auto: format }) {
        ...ResponsiveImageFragment
      }
    }
  }
`;
