import { buildBooksCataloguePaths } from '~/lib/books';
import { executeQuery } from './executeQuery';

const STATIC_URLS: readonly string[] = [
  '/',
  '/sitemap.xml',
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
    catalogueBooksMeta: _allBooksMeta(
      filter: { _status: { eq: published }, archive: { eq: false } }
    ) {
      count
    }
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
  catalogueBooksMeta: { count: number } | null;
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
 * Enumerate every public URL that may be served by the site. Used by
 * /api/revalidate?mode=full to invalidate the full surface (manual maintenance
 * / emergency). Per-publish revalidation uses the surgical map in
 * `revalidationUrls.ts` instead.
 */
export async function getAllPublicUrls(): Promise<string[]> {
  const data = await executeQuery<AllSlugsResult>(ALL_SLUGS_QUERY);

  const dynamic: string[] = [
    ...buildBooksCataloguePaths(data.catalogueBooksMeta?.count ?? 0),
    ...buildSlugUrls(data.allBooks, '/libri'),
    ...buildSlugUrls(data.allAuthors, '/autori'),
    ...buildSlugUrls(data.allBlogPosts, '/magazine'),
    ...buildSlugUrls(data.allCollections, '/collane'),
    ...buildSlugUrls(data.allPages, '/info'),
  ];

  // Dedupe: catalogue page 1 (/libri) is also in STATIC_URLS.
  return [...new Set([...STATIC_URLS, ...dynamic])];
}
