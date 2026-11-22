import { buildBooksCataloguePaths } from '~/lib/books';
import { indexPagePath } from './recordInfo';

/**
 * Maps a changed DatoCMS record (model `api_key` + `slug`) to the small set of
 * public URLs whose rendered HTML may have changed and therefore must be
 * revalidated. The goal is ~5–20 URLs per publish instead of the whole site
 * (~670 URLs), so a single edit no longer re-renders everything and burns
 * Vercel Fast Origin Transfer.
 *
 * The api_key → route mapping mirrors `recordToWebsiteRoute` in `recordInfo.ts`
 * (the source of truth for the Web Previews / SEO plugins); index paths are
 * shared via `INDEX_PAGE_PATHS`. Keep the two in sync when routes change.
 * The input is the model `api_key`, the record `slug` and, for `license`, the
 * record `id`.
 */

const HOME = '/';
const SITEMAP = '/sitemap.xml';

export type RevalidationInput = {
  apiKey: string | null | undefined;
  slug: string | null | undefined;
  id?: string | null;
};

export type RevalidationQuery = <R>(
  query: string,
  options: { variables: Record<string, unknown> },
) => Promise<R>;

// Lazy default: executeQuery.ts imports `astro:env/server`, which plain tsx
// cannot load, so it is only imported when no query is injected.
const defaultQuery: RevalidationQuery = <R>(q: string, o: { variables: Record<string, unknown> }) =>
  import('./executeQuery').then((m) => m.executeQuery<R>(q, o));

type BookContextResult = {
  catalogueBooksMeta: { count: number } | null;
  book: {
    authors: Array<{ slug: string | null }> | null;
    collection: { slug: string | null } | null;
  } | null;
};

// Enrichment for a book change: how many catalogue pages exist now, plus the
// detail pages that list this book (its authors and its collection) so add /
// remove / rename propagates there too. Published token: on unpublish the book
// resolves to null and we simply skip the related-page enrichment.
const BOOK_CONTEXT_QUERY = /* GraphQL */ `
  query BookRevalidationContext($slug: String) {
    catalogueBooksMeta: _allBooksMeta(
      filter: { _status: { eq: published }, archive: { eq: false } }
    ) {
      count
    }
    book(filter: { slug: { eq: $slug } }) {
      authors {
        slug
      }
      collection {
        slug
      }
    }
  }
`;

// `/libri` pages come from `BOOKS_PAGE_QUERY` (booksIndexPage), so a change to
// that index page also affects every catalogue page: count them.
const CATALOGUE_COUNT_QUERY = /* GraphQL */ `
  query CatalogueRevalidationCount {
    catalogueBooksMeta: _allBooksMeta(
      filter: { _status: { eq: published }, archive: { eq: false } }
    ) {
      count
    }
  }
`;

// The license is rendered only on the book page: find the books that link it.
const LICENSE_BOOKS_QUERY = /* GraphQL */ `
  query LicenseRevalidationBooks($id: ItemId) {
    allBooks(filter: { license: { eq: $id } }, first: 500) {
      slug
    }
  }
`;

/**
 * Returns the list of URLs to revalidate for a record change, or an empty array
 * for unknown / unmapped models (the caller then no-ops). Never throws: any
 * enrichment failure degrades gracefully to the bounded static set.
 */
export async function getRevalidationUrls(
  { apiKey, slug, id }: RevalidationInput,
  query: RevalidationQuery = defaultQuery,
): Promise<string[]> {
  const urls = new Set<string>();
  const add = (url: string | null | undefined) => {
    if (url) {
      urls.add(url);
    }
  };

  switch (apiKey) {
    case 'book': {
      add(slug ? `/libri/${slug}` : null);
      add('/libri/archivio');
      add(HOME); // homepage carousels / single-book blocks may feature this book
      add(SITEMAP);

      try {
        const data = await query<BookContextResult>(BOOK_CONTEXT_QUERY, {
          variables: { slug: slug ?? null },
        });
        buildBooksCataloguePaths(data.catalogueBooksMeta?.count ?? 0).forEach(add);
        data.book?.authors?.forEach((author) => add(author.slug ? `/autori/${author.slug}` : null));
        add(data.book?.collection?.slug ? `/collane/${data.book.collection.slug}` : null);
      } catch (error) {
        // Bounded fallback: at least refresh catalogue page 1.
        console.error('[revalidate] book context enrichment failed, using static set only:', error);
        add('/libri');
      }
      break;
    }

    case 'author':
      add(slug ? `/autori/${slug}` : null);
      add('/autori');
      add(SITEMAP);
      break;

    case 'collection':
      add(slug ? `/collane/${slug}` : null);
      add('/collane');
      add(SITEMAP);
      break;

    case 'blog_post':
      add(slug ? `/magazine/${slug}` : null);
      add('/magazine');
      add(SITEMAP);
      break;

    case 'page':
      add(slug ? `/info/${slug}` : null);
      add('/info');
      add(SITEMAP);
      break;

    // Singleton: revalidate only the page it backs.
    case 'home':
      add(HOME);
      add(SITEMAP);
      break;

    // Index pages are matched by slug (one `index_page` model, many records).
    case 'index_page': {
      const path = indexPagePath(slug);
      if (!path) {
        return [];
      }
      add(path);
      if (slug === 'libri') {
        try {
          const data = await query<Pick<BookContextResult, 'catalogueBooksMeta'>>(
            CATALOGUE_COUNT_QUERY,
            { variables: {} },
          );
          buildBooksCataloguePaths(data.catalogueBooksMeta?.count ?? 0).forEach(add);
        } catch (error) {
          console.error(
            '[revalidate] index_page libri enrichment failed, using /libri only:',
            error,
          );
        }
      }
      break;
    }

    case 'supplier':
      add('/distributori');
      break;

    // No slug: the books linking this license, by record id.
    case 'license': {
      if (!id) {
        return [];
      }
      try {
        // TODO CD2: first: 500 caps the books per license.
        const data = await query<{ allBooks: Array<{ slug: string | null }> | null }>(
          LICENSE_BOOKS_QUERY,
          { variables: { id } },
        );
        data.allBooks?.forEach((book) => add(book.slug ? `/libri/${book.slug}` : null));
      } catch (error) {
        console.error('[revalidate] license enrichment failed:', error);
        return [];
      }
      break;
    }

    // Only read by /libri/schede/[slug], which is staff-gated: nothing public to refresh.
    case 'app':
      return [];

    default:
      // Unknown / unmapped model: let the caller decide to no-op.
      return [];
  }

  return [...urls];
}
