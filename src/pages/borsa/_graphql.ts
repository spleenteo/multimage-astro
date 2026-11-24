// /borsa: the page head and the "Cosa succede dopo" steps, edited in the Shop singleton.
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
};
