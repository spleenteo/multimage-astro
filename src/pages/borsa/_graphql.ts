// /borsa: the page head and the "Cosa succede dopo" steps, edited in the Shop singleton, and the
// buyer kinds of "Chi ordina" (the `buyer` collection, in its order, with their discount).
export const SHOP_PAGE_QUERY = /* GraphQL */ `
  query ShopPage {
    shop {
      title
      description
      steps {
        ... on OrderStepRecord {
          id
          title
          description
          icon {
            url
            alt
          }
        }
      }
    }
    allBuyers(first: 50, orderBy: position_ASC) {
      id
      name
      discount
    }
  }
`;

export type ShopStep = {
  id: string;
  title: string | null;
  description: string | null;
  icon: { url: string; alt: string | null } | null;
};

export type ShopPageQueryResult = {
  shop: {
    title: string | null;
    description: string | null;
    steps: ShopStep[] | null;
  } | null;
  allBuyers: Array<{ id: string; name: string | null; discount: number | null }>;
};
