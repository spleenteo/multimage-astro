import { BANNER_SECTION_FRAGMENT } from '~/components/BannerSection';
import { FEATURED_BOOK_HIGHLIGHT_FRAGMENT } from '~/components/FeaturedBookHighlight';
import { BOOK_CAROUSEL_SECTION_FRAGMENT } from '~/components/BookCarouselSection';
import { PILLS_BLOCK_FRAGMENT } from '~/components/blocks/PillsBlock';
import { TAG_FRAGMENT, RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AssetColor, HomeRecord, ResponsiveImage, SeoMetaTag } from '~/lib/datocms/types';
import type { BookRecordForCard } from '~/lib/books';

export const CTA_BUTTON_WITH_IMAGE_HOME_FRAGMENT = /* GraphQL */ `
  fragment CtaButtonWithImageHomeBlock on CtaButtonWithImageRecord {
    __typename
    id
    title
    content
    contentHtml: content
    buttons {
      id
      label
      url
      primary
    }
    image {
      url
      responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 960, auto: format }) {
        ...ResponsiveImageFragment
      }
    }
  }
`;

export const HOME_PAGE_QUERY = /* GraphQL */ `
  ${TAG_FRAGMENT}
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${BANNER_SECTION_FRAGMENT}
  ${FEATURED_BOOK_HIGHLIGHT_FRAGMENT}
  ${CTA_BUTTON_WITH_IMAGE_HOME_FRAGMENT}
  ${BOOK_CAROUSEL_SECTION_FRAGMENT}
  ${PILLS_BLOCK_FRAGMENT}
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
        ...CtaButtonWithImageHomeBlock
        ...BookCarouselSectionFragment
        ...PillsBlockFragment
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

export type HomeCtaButtonBlockRecord = {
  __typename: 'CtaButtonWithImageRecord';
  id: string;
  title: string | null;
  content: string | null;
  contentHtml: string | null;
  buttons: Array<{
    id: string;
    label: string | null;
    url: string | null;
    primary: boolean | null;
  }> | null;
  image: {
    url: string | null;
    responsiveImage: ResponsiveImage | null;
  } | null;
};

export type HomeBookCarouselBlockRecord = {
  __typename: 'BookCarouselRecord';
  id: string;
  title: string | null;
  description: string | null;
  books: BookRecordForCard[] | null;
};

export type HomePillsBlockRecord = {
  __typename: 'PillsBlockRecord';
  id: string;
  title: string | null;
  description: string | null;
  pillsBlock: Array<{
    __typename: 'SingleInfoBlockRecord';
    id: string;
    icon: string | null;
    title: string | null;
    content: string | null;
    button: {
      __typename: 'ButtonRecord';
      id: string;
      label: string | null;
      url: string | null;
      primary: boolean | null;
    } | null;
  } | null> | null;
};

export type HomeBannerBlockRecord =
  | HomeBannerBannerBlockRecord
  | HomeSingleBookBlockRecord
  | HomeCtaButtonBlockRecord
  | HomeBookCarouselBlockRecord
  | HomePillsBlockRecord;

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
