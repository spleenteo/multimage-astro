import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AssetImage, StructuredTextField } from '~/lib/datocms/types';

export const BOOK_SHEET_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query BookSheet($slug: String) {
    book(filter: { slug: { eq: $slug } }) {
      id
      title
      subtitle
      slug
      promo
      description
      review {
        value
      }
      isbn
      price
      pages
      format
      printYear
      firstPrintYear
      layoutArtist
      coverDesigner
      illustrator
      collection {
        id
        name
      }
      authors {
        id
        fullName
        alias
        biography {
          value
        }
      }
      coverImage {
        alt
        url
        responsiveImage(
          imgixParams: { fit: crop, crop: focalpoint, w: 700, h: 1000, auto: format }
        ) {
          ...ResponsiveImageFragment
        }
      }
    }
  }
`;

export type BookSheetQueryResult = {
  book: {
    id: string;
    title: string | null;
    subtitle: string | null;
    slug: string | null;
    promo: string | null;
    description: string | null;
    review: StructuredTextField | null;
    isbn: string | null;
    price: number | null;
    pages: number | null;
    format: string | null;
    printYear: string | null;
    firstPrintYear: number | null;
    layoutArtist: string | null;
    coverDesigner: string | null;
    illustrator: string | null;
    collection: {
      id: string;
      name: string | null;
    } | null;
    authors: Array<{
      id: string;
      fullName: string | null;
      alias: string | null;
      biography: StructuredTextField | null;
    }>;
    coverImage: AssetImage | null;
  } | null;
};

export type BookSheetRecord = NonNullable<BookSheetQueryResult['book']>;
