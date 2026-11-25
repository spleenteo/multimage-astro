export const MEMBERSHIP_REQUEST_QUERY = /* GraphQL */ `
  query MembershipRequest {
    membership {
      paymentNote
      fees {
        ... on MembershipFeeBlockRecord {
          id
          label
          amount
        }
      }
      collaborationAreas {
        ... on CollaborationAreaBlockRecord {
          id
          label
        }
      }
    }
  }
`;

export type MembershipRequestQueryResult = {
  membership: {
    paymentNote: string | null;
    fees: Array<{ id: string; label: string | null; amount: number | null }>;
    collaborationAreas: Array<{ id: string; label: string | null }>;
  } | null;
};
