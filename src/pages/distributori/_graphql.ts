import { INDEX_HERO_FRAGMENT, type IndexHeroFields } from '~/components/IndexHeroSection/_graphql';
import { RESPONSIVE_IMAGE_FRAGMENT, TAG_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { SupplierRecord } from '~/lib/suppliers';

export const SUPPLIERS_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${INDEX_HERO_FRAGMENT}
  query SuppliersPage {
    suppliersIndexPage: allIndexPages(filter: { slug: { eq: "distributori" } }, first: 1) {
      ...IndexHeroFields
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
  suppliersIndexPage: IndexHeroFields[] | null;
  allSuppliers: SupplierRecord[];
};
