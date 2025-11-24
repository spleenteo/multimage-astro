import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AssetImage, StructuredTextField } from '~/lib/datocms/types';

export const BOOK_SHEET_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query BookSheetPage($slug: String) {
    book(filter: { slug: { eq: $slug } }) {
      id
      title
      subtitle
      slug
      editedBy
      format
      price
      isbn
      edition
      pages
      printYear
      firstPrintYear
      originalLang
      originalTitle
      translator
      layoutArtist
      coverDesigner
      illustrator
      dimension {
        id
        dimensions
      }
      reprints {
        __typename
        ... on ReprintRecord {
          number
          circulation
          year
        }
      }
      collection {
        name
        slug
      }
      authors {
        id
        fullName
        alias
        slug
        biographyShort {
          value
        }
        biography {
          value
        }
      }
      reviewShort {
        value
      }
      review {
        value
      }
      coverImage {
        url(imgixParams: { auto: format, fit: crop, w: 900 })
        alt
        responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 720, auto: format, q: 80 }) {
          ...ResponsiveImageFragment
        }
      }
      license {
        name
        code
      }
    }
    app {
      pdfFooter
    }
  }
`;

export type BookSheetRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  editedBy: boolean | null;
  format: string | null;
  price: number | null;
  isbn: string | null;
  edition: number | null;
  pages: number | null;
  printYear: string | null;
  firstPrintYear: number | null;
  originalLang: string | null;
  originalTitle: string | null;
  translator: string | null;
  layoutArtist: string | null;
  coverDesigner: string | null;
  illustrator: string | null;
  dimension: { id: string; dimensions: string | null } | null;
  dimensions?: string | null;
  reprints: Array<{
    __typename: string;
    number: number | null;
    circulation: number | null;
    year: string | null;
  }>;
  collection: { name: string | null; slug: string | null } | null;
  authors: Array<{
    id: string;
    fullName: string | null;
    alias: string | null;
    slug: string | null;
    biographyShort: StructuredTextField;
    biography: StructuredTextField;
  }>;
  reviewShort: StructuredTextField;
  review: StructuredTextField;
  coverImage: AssetImage | null;
  license: { name: string | null; code: string | null } | null;
};

export type BookSheetQueryResult = {
  book: BookSheetRecord | null;
  app: {
    pdfFooter: string | null;
  } | null;
};
