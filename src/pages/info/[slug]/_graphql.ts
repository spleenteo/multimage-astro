export const INFO_PAGE_QUERY = /* GraphQL */ `
  query InfoPage($slug: String) {
    page(filter: { slug: { eq: $slug } }) {
      id
      title
      subtitle
      slug
      body
      label
      menu
      seo {
        title
        description
        image {
          url
          alt
        }
      }
      _seoMetaTags {
        tag
        attributes
        content
      }
    }
  }
`;

export const INFO_PAGE_SLUGS_QUERY = /* GraphQL */ `
  query InfoPageSlugs {
    allPages(first: 200) {
      slug
    }
  }
`;
