export const PILLS_BLOCK_FRAGMENT = /* GraphQL */ `
  fragment PillsBlockFragment on PillsBlockRecord {
    __typename
    id
    title
    description
    pillsBlock {
      __typename
      ... on SingleInfoBlockRecord {
        id
        icon
        title
        content
        button {
          __typename
          ... on ButtonRecord {
            id
            label
            url
            primary
          }
        }
      }
    }
  }
`;
