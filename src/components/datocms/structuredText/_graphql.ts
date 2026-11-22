/** Shared fields of the book and author blocks, for every query that renders Structured Text. */
export const SINGLE_BOOK_BLOCK_FIELDS = /* GraphQL */ `
  ... on SingleBookRecord {
    id
    book {
      id
      title
      subtitle
      slug
      price
      format
      archive
      authors {
        id
        fullName
        alias
      }
      coverImage {
        url
        width
        height
        colors {
          hex
        }
      }
    }
  }
`;

export const SINGLE_AUTHOR_BLOCK_FIELDS = /* GraphQL */ `
  ... on SingleAuthorRecord {
    id
    author {
      id
      fullName
      alias
      slug
      picture {
        url
      }
    }
  }
`;
