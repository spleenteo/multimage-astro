export const ORDER_BOOKS_QUERY = /* GraphQL */ `
  query OrderBooks($ids: [ItemId]) {
    allBooks(first: 30, filter: { id: { in: $ids } }) {
      id
      title
      slug
      price
      format
      archive
      authors {
        fullName
        alias
      }
    }
  }
`;

export type OrderBooksQueryResult = {
  allBooks: Array<{
    id: string;
    title: string | null;
    slug: string | null;
    price: number | null;
    format: string | null;
    archive: boolean | null;
    authors: Array<{ fullName: string | null; alias: string | null }>;
  }>;
};
