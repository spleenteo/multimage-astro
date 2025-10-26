export const BOOK_SEARCH_QUERY = /* GraphQL */ `
  query BookSearch($pattern: String!) {
    allBooks(
      filter: {
        OR: [
          { title: { matches: { pattern: $pattern, caseSensitive: false } } }
          { subtitle: { matches: { pattern: $pattern, caseSensitive: false } } }
          { isbn: { matches: { pattern: $pattern, caseSensitive: false } } }
        ]
      }
      orderBy: title_ASC
      first: 20
    ) {
      id
      title
      subtitle
      slug
      isbn
      collection {
        id
        name
      }
      authors {
        id
        fullName
        alias
      }
    }
  }
`;

export type BookSearchResult = {
  allBooks: Array<{
    id: string;
    title: string | null;
    subtitle: string | null;
    slug: string | null;
    isbn: string | null;
    collection: {
      id: string;
      name: string | null;
    } | null;
    authors: Array<{
      id: string;
      fullName: string | null;
      alias: string | null;
    }>;
  }>;
};
