import type { SeoMetaTag } from '~/lib/datocms/types';

export const INDEX_HERO_FRAGMENT = /* GraphQL */ `
  fragment IndexHeroFields on IndexPage {
    title
    subtitle
    _seoMetaTags {
      ...TagFragment
    }
  }
`;

export type IndexHeroFields = {
  title: string | null;
  subtitle: string | null;
  _seoMetaTags: SeoMetaTag[] | null;
};
