export const STAFF_ARCHIVE_CATALOG_QUERY = /* GraphQL */ `
  query StaffArchivioCatalogo {
    allBooks(orderBy: printYear_DESC, first: 500) {
      id
      slug
      title
      subtitle
      isbn
      archive
      format
      layoutArtist
      illustrator
      coverDesigner
      pages
      edition
      printYear
      firstPrintYear
      dimension {
        id
        dimensions
      }
      originalLang
      originalTitle
      translator
      price
      promo
      stock
      copyright
      authors {
        id
        fullName
        alias
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
          year
          circulation
        }
      }
      keywords {
        id
        name
      }
    }
  }
`;

export type StaffArchivioCatalogoQueryResult = {
  allBooks: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    isbn: string | null;
    archive: boolean | null;
    format: string | null;
    layoutArtist: string | null;
    illustrator: string | null;
    coverDesigner: string | null;
    pages: number | null;
    edition: number | null;
    printYear: string | null;
    firstPrintYear: number | null;
    dimensions: string | null;
    dimension: {
      id: string;
      dimensions: string | null;
    } | null;
    originalLang: string | null;
    originalTitle: string | null;
    translator: string | null;
    price: number | null;
    promo: string | null;
    stock: number | null;
    copyright: string | null;
    authors: Array<{
      id: string;
      fullName: string | null;
      alias: string | null;
    }>;
    collection: {
      id: string;
      name: string | null;
      slug: string | null;
    } | null;
    reprints: Array<{
      __typename: string;
      number?: number | null;
      year?: string | null;
      circulation?: number | null;
    }> | null;
    keywords: Array<{
      id: string;
      name: string | null;
    }> | null;
  }>;
};
