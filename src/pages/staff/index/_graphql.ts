export const STAFF_INDEX_QUERY = /* GraphQL */ `
  query StaffIndexPage {
    _allBooksMeta {
      count
    }
  }
`;

export type StaffIndexQueryResult = {
  _allBooksMeta: {
    count: number;
  } | null;
};
