export const LLMS_INTRO_QUERY = /* GraphQL */ `
  query LLMsIntro {
    chiSiamo: page(filter: { slug: { eq: "chi-siamo" } }) {
      title
      body {
        value
      }
    }
    laStoria: page(filter: { slug: { eq: "la-storia" } }) {
      title
      body {
        value
      }
    }
  }
`;

export const LLMS_BOOKS_QUERY = /* GraphQL */ `
  query AllBooksBatch($first: IntType!, $skip: IntType!) {
    allBooks(orderBy: [printYear_DESC, title_ASC], first: $first, skip: $skip) {
      title
      subtitle
      slug
      collection {
        name
        slug
      }
      review {
        value
      }
      isbn
      edition
      printYear
      archive
      authors {
        fullName
        alias
        slug
        biography {
          value
        }
      }
    }
  }
`;
