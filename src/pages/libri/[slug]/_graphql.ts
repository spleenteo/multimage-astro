import { BOOK_CARD_FRAGMENT } from '~/components/BookCard';
import { RESPONSIVE_IMAGE_FRAGMENT } from '~/lib/datocms/commonFragments';
import type { AssetImage, SeoMetaTag, StructuredTextField } from '~/lib/datocms/types';

export const BOOK_DETAIL_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  query BookDetailPage($slug: String) {
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
      edition
      pages
      format
      price
      printYear
      firstPrintYear
      coverDesigner
      epubUrl
      archive
      coverImage {
        url
        alt
        responsiveImage(imgixParams: { fit: crop, crop: focalpoint, w: 960, auto: format }) {
          ...ResponsiveImageFragment
        }
      }
      authors {
        id
        fullName
        alias
        slug
        biography {
          value
        }
        picture {
          url
          alt
          responsiveImage(
            imgixParams: { fit: crop, crop: focalpoint, w: 640, h: 640, auto: format }
          ) {
            ...ResponsiveImageFragment
          }
        }
      }
      license {
        name
        code
      }
      collection {
        id
        name
        slug
      }
      reprints {
        __typename
        ... on ReprintRecord {
          number
          circulation
          year
        }
      }
      originalLang
      originalTitle
      translator
      layoutArtist
      dimension {
        id
        dimensions
      }

      illustrator
      editedBy
      seo: _seoMetaTags {
        tag
        attributes
        content
      }
    }
  }
`;

export const BOOK_AUTHORS_BOOKS_QUERY = /* GraphQL */ `
  query BookAuthorsBooks($authorIds: [ItemId!]) {
    allBooks(filter: { authors: { anyIn: $authorIds } }, first: 500) {
      id
      authors {
        id
      }
    }
  }
`;

export const BOOK_ALTERNATE_FORMATS_QUERY = /* GraphQL */ `
  query BookAlternateFormats($title: String, $excludeSlug: SlugFilter) {
    allBooks(
      filter: { title: { eq: $title }, slug: $excludeSlug }
      orderBy: format_ASC
      first: 12
    ) {
      id
      title
      slug
      format
      price
      epubUrl
    }
  }
`;

export const BOOK_COLLECTION_BOOKS_QUERY = /* GraphQL */ `
  ${RESPONSIVE_IMAGE_FRAGMENT}
  ${BOOK_CARD_FRAGMENT}
  query BookCollectionBooks($collectionId: ItemId) {
    allBooks(filter: { collection: { eq: $collectionId } }, orderBy: printYear_DESC, first: 500) {
      ...BookCardFragment
    }
  }
`;

export const BOOK_SLUGS_QUERY = /* GraphQL */ `
  query BookSlugsForStaticPaths {
    allBooks(orderBy: title_ASC, first: 500) {
      slug
    }
  }
`;

export type BookDetailRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  promo: string | null;
  description: string | null;
  review: StructuredTextField;
  isbn: string | null;
  edition: number | null;
  pages: number | null;
  format: string | null;
  price: number | null;
  printYear: string | null;
  firstPrintYear: number | null;
  coverDesigner: string | null;
  epubUrl: string | null;
  archive: boolean | null;
  coverImage: AssetImage | null;
  authors: Array<{
    id: string;
    fullName: string | null;
    alias: string | null;
    slug: string | null;
    biography: StructuredTextField;
    picture: AssetImage | null;
  }>;
  license: {
    name: string | null;
    code: string | null;
  } | null;
  collection: {
    id: string;
    name: string | null;
    slug: string | null;
  } | null;
  reprints: Array<{
    __typename: string;
    number: number | null;
    circulation: number | null;
    year: string | null;
  }>;
  originalLang: string | null;
  originalTitle: string | null;
  translator: string | null;
  layoutArtist: string | null;
  dimensions: string | null;
  dimension: {
    id: string;
    dimensions: string | null;
  } | null;
  illustrator: string | null;
  editedBy: boolean | null;
  seo: SeoMetaTag[] | null;
};

export type BookDetailQueryResult = {
  book: BookDetailRecord | null;
};

export type BookAuthorsBooksResult = {
  allBooks: Array<{
    id: string;
    authors: Array<{
      id: string;
    }>;
  }>;
};

export type BookAlternateFormatsResult = {
  allBooks: Array<{
    id: string;
    title: string;
    slug: string;
    format: string | null;
    price: number | null;
    epubUrl: string | null;
  }>;
};

export type BookSlugsResult = {
  allBooks: Array<{
    slug: string | null;
  }>;
};
export type BookCollectionBooksResult = {
  allBooks: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    promo: string | null;
    description: string | null;
    printYear: string | null;
    coverImage: AssetImage | null;
    price: number | null;
    authors: Array<{
      id: string;
      fullName: string | null;
      alias: string | null;
      slug: string | null;
    }>;
    license: {
      name: string | null;
      code: string | null;
    } | null;
    format: string | null;
    archive: boolean | null;
  }>;
};
