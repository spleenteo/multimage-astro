import { executeQuery } from './executeQuery';

const STATIC_URLS: readonly string[] = [
  '/',
  '/sitemap.xml',
  '/llms-full.txt',
  '/archived-books.json',
  '/libri',
  '/libri/ebooks',
  '/libri/highlights',
  '/libri/archivio',
  '/autori',
  '/magazine',
  '/collane',
  '/distributori',
  '/cerca',
  '/info',
];

const ALL_SLUGS_QUERY = /* GraphQL */ `
  query AllPublicSlugs {
    allBooks(first: 500) {
      slug
    }
    allAuthors(first: 500) {
      slug
    }
    allBlogPosts(first: 500) {
      slug
    }
    allCollections(first: 500) {
      slug
    }
    allPages(first: 500) {
      slug
    }
  }
`;

type SlugRecord = { slug: string | null };

type AllSlugsResult = {
  allBooks: SlugRecord[] | null;
  allAuthors: SlugRecord[] | null;
  allBlogPosts: SlugRecord[] | null;
  allCollections: SlugRecord[] | null;
  allPages: SlugRecord[] | null;
};

function buildSlugUrls(records: SlugRecord[] | null | undefined, prefix: string): string[] {
  return (records ?? [])
    .map((record) => record.slug?.trim())
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => `${prefix}/${slug}`);
}

/**
 * Enumerate every public URL that may be served by the site.
 * Used by /api/revalidate to invalidate the full surface after a CMS publish.
 */
export async function getAllPublicUrls(): Promise<string[]> {
  const data = await executeQuery<AllSlugsResult>(ALL_SLUGS_QUERY);

  const dynamic: string[] = [
    ...buildSlugUrls(data.allBooks, '/libri'),
    ...buildSlugUrls(data.allAuthors, '/autori'),
    ...buildSlugUrls(data.allBlogPosts, '/magazine'),
    ...buildSlugUrls(data.allCollections, '/collane'),
    ...buildSlugUrls(data.allPages, '/info'),
  ];

  return [...STATIC_URLS, ...dynamic];
}
