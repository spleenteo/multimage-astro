import { RESPONSIVE_IMAGE_CARD_FIELDS } from '~/lib/datocms/commonFragments';

export const COLLECTION_CARD_FRAGMENT = /* GraphQL */ `
  fragment CollectionCardFragment on CollectionRecord {
    id
    name
    slug
    description
    logo {
      url
      alt
      responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 320, auto: format }) {
        ${RESPONSIVE_IMAGE_CARD_FIELDS}
      }
    }
  }
`;
