export const COLLECTION_CARD_FRAGMENT = /* GraphQL */ `
  fragment CollectionCardFragment on CollectionRecord {
    id
    name
    slug
    description
    logo {
      url
      alt
      responsiveImage(imgixParams: { fit: max, w: 320, auto: format }) {
        ...ResponsiveImageFragment
      }
    }
  }
`;
