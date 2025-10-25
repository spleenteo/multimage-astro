import { BANNER_SECTION_FRAGMENT } from '~/components/BannerSection';
import { FEATURED_BOOK_HIGHLIGHT_FRAGMENT } from '~/components/FeaturedBookHighlight';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AssetColor, HomeRecord, ResponsiveImage, SeoMetaTag } from '~/lib/datocms/types';
import type { BookRecordForCard } from '~/lib/books';

export const HOME_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${BANNER_SECTION_FRAGMENT}
  ${FEATURED_BOOK_HIGHLIGHT_FRAGMENT}
  query HomePage {
    home {
      title
      claim
      heroImage {
        alt
        title
        responsiveImage(
          imgixParams: { fit: crop, w: 1920, h: 1080, auto: format, crop: focalpoint }
        ) {
          ...ResponsiveImageFragment
        }
      }
      _seoMetaTags {
        ...TagFragment
      }
      banners {
        __typename
        ...BannerSectionBlock
        ...FeaturedBookHighlightBlock
      }
    }
  }
`;

export type HomeBannerBannerBlockRecord = {
  __typename: 'BannerRecord';
  id: string;
  title: string | null;
  content: string | null;
  link: string | null;
  imagePosition: 'left' | 'right' | null;
  featuredImage: {
    alt: string | null;
    title: string | null;
    colors: AssetColor[] | null;
    responsiveImage: ResponsiveImage | null;
  } | null;
};

export type HomeSingleBookBlockRecord = {
  __typename: 'SingleBookRecord';
  id: string;
  book:
    | (BookRecordForCard & {
        collection?: {
          id: string;
          name: string | null;
          slug: string | null;
        } | null;
        coverImage: {
          alt: string | null;
          title: string | null;
          colors: AssetColor[] | null;
          responsiveImage: ResponsiveImage | null;
        } | null;
        authors: Array<{
          id: string;
          fullName: string | null;
          alias: string | null;
          slug: string | null;
          picture: {
            alt: string | null;
            responsiveImage: ResponsiveImage | null;
          } | null;
        }> | null;
      })
    | null;
};

export type HomeBannerBlockRecord = HomeBannerBannerBlockRecord | HomeSingleBookBlockRecord;

export type HomePageQueryResult = {
  home:
    | (HomeRecord & {
        heroImage: {
          alt: string | null;
          title: string | null;
          responsiveImage: ResponsiveImage | null;
        } | null;
        _seoMetaTags: SeoMetaTag[] | null;
        banners: HomeBannerBlockRecord[] | null;
      })
    | null;
};
