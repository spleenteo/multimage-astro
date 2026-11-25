import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { SeoMetaTag } from '~/lib/datocms/types';

// /diventa-socio: the Membership singleton. The `slug` field is ignored (fixed route), and
// `paymentNote` / `successText` feed the confirmation shown after the send.
// The `content` field accepts six blocks. The three the page renders (image, video, banner) take
// the selections of /info/[slug]; the other three only need their id and type, because the page
// renders them as nothing (@datocms/astro throws on a block missing from `blocks`).
export const MEMBERSHIP_PAGE_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query MembershipPage {
    membership {
      title
      subtitle
      feeNote
      paymentNote
      successText
      content {
        value
        blocks {
          __typename
          ... on VideoRecord {
            id
            video {
              title
              url
              thumbnailUrl
              provider
              providerUid
            }
          }
          ... on BannerRecord {
            id
            title
            content
            link
            imagePosition
            featuredImage {
              responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 960, auto: format }) {
                ...ResponsiveImageFragment
              }
            }
          }
          ... on ImageBlockRecord {
            id
            image {
              responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 960, auto: format }) {
                ...ResponsiveImageFragment
              }
            }
            caption
          }
          ... on SingleInfoBlockRecord {
            id
          }
          ... on NewsletterSubscriptionRecord {
            id
          }
          ... on ButtonRecord {
            id
          }
        }
        links {
          __typename
          ... on PageRecord {
            id
            title
            slug
          }
          ... on BlogPostRecord {
            id
            title
            slug
          }
        }
      }
      fees {
        ... on MembershipFeeBlockRecord {
          id
          label
          amount
        }
      }
      collaborationAreas {
        ... on CollaborationAreaBlockRecord {
          id
          label
        }
      }
      _seoMetaTags {
        tag
        attributes
        content
      }
    }
  }
`;

export type MembershipFee = { id: string; label: string; amount: number };
export type CollaborationArea = { id: string; label: string };

export type MembershipPageQueryResult = {
  membership: {
    title: string | null;
    subtitle: string | null;
    feeNote: string | null;
    paymentNote: string | null;
    successText: string | null;
    // Structured text value + its blocks and links, as @datocms/astro's StructuredText reads it.
    content: {
      value: unknown;
      blocks: Array<{ __typename: string; id: string; [key: string]: unknown }>;
      links: Array<{ __typename: string; id: string; [key: string]: unknown }>;
    } | null;
    fees: MembershipFee[];
    collaborationAreas: CollaborationArea[];
    _seoMetaTags: SeoMetaTag[] | null;
  } | null;
};
