type SitemapItem = {
  slug: string | null;
  updatedAt: string | null;
};

export const SITEMAP_QUERY = /* GraphQL */ `
  query SitemapEntries {
    allPages(orderBy: updatedAt_DESC, first: 200) {
      slug
      updatedAt
    }
    allBooks(orderBy: updatedAt_DESC, first: 500) {
      slug
      updatedAt
    }
    allCollections(orderBy: updatedAt_DESC, first: 200) {
      slug
      updatedAt
    }
    allAuthors(orderBy: updatedAt_DESC, first: 500) {
      slug
      updatedAt
    }
    allBlogPosts(orderBy: updatedAt_DESC, first: 500) {
      slug
      updatedAt
    }
  }
`;

export type SitemapQueryResult = {
  allPages: SitemapItem[];
  allBooks: SitemapItem[];
  allCollections: SitemapItem[];
  allAuthors: SitemapItem[];
  allBlogPosts: SitemapItem[];
};
