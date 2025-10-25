import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { SupplierRecord } from '~/lib/suppliers';
import type { SuppliersIndexRecord, SeoMetaTag } from '~/lib/datocms/types';

export const SUPPLIERS_PAGE_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query SuppliersPage {
    suppliersIndex {
      title
      subtitle
      _seoMetaTags {
        tag
        attributes
        content
      }
    }
    allSuppliers(
      first: 300
      orderBy: [region_ASC, city_ASC, name_ASC]
      filter: { _status: { eq: published } }
    ) {
      id
      name
      region
      city
      address
      telephone
      email
      url
      description
      map {
        latitude
        longitude
      }
      logo {
        url
        alt
        width
        height
        responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 280, auto: format }) {
          ...ResponsiveImageFragment
        }
      }
    }
  }
`;

export type SuppliersPageQueryResult = {
  suppliersIndex: (SuppliersIndexRecord & { _seoMetaTags: SeoMetaTag[] | null }) | null;
  allSuppliers: SupplierRecord[];
};
