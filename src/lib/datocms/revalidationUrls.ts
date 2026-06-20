import { buildBooksCataloguePaths } from '~/lib/books';
import { executeQuery } from './executeQuery';

/**
 * Maps a changed DatoCMS record (model `api_key` + `slug`) to the small set of
 * public URLs whose rendered HTML may have changed and therefore must be
 * revalidated. The goal is ~5–20 URLs per publish instead of the whole site
 * (~670 URLs), so a single edit no longer re-renders everything and burns
 * Vercel Fast Origin Transfer.
 *
 * The api_key → route mapping mirrors `recordToWebsiteRoute` in `recordInfo.ts`
 * (the source of truth for the Web Previews / SEO plugins); keep the two in sync
 * when routes change.
 */

const HOME = '/';
const SITEMAP = '/sitemap.xml';

export type RevalidationInput = {
  apiKey: string | null | undefined;
  slug: string | null | undefined;
};

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

/**
 * Returns the list of URLs to revalidate for a record change, or an empty array
 * for unknown / unmapped models (the caller then no-ops). Never throws: any
 * enrichment failure degrades gracefully to the bounded static set.
 */
export async function getRevalidationUrls({ apiKey, slug }: RevalidationInput): Promise<string[]> {
  const urls = new Set<string>();
  const add = (url: string | null | undefined) => {
    if (url) {
      urls.add(url);
    }
  };

  switch (apiKey) {
    case 'book': {
      add(slug ? `/libri/${slug}` : null);
      add('/libri/ebooks');
      add('/libri/highlights');
      add('/libri/archivio');
      add(HOME); // homepage carousels / single-book blocks may feature this book
      add(SITEMAP);

      try {
        const data = await executeQuery<BookContextResult>(BOOK_CONTEXT_QUERY, {
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

    // Singleton / index records: revalidate only the page they back.
    case 'home':
      add(HOME);
      add(SITEMAP);
      break;
    case 'books_index':
      add('/libri');
      add(SITEMAP);
      break;
    case 'archive_index':
      add('/libri/archivio');
      add(SITEMAP);
      break;
    case 'highlights_index':
      add('/libri/highlights');
      add(SITEMAP);
      break;
    case 'ebooks_index':
      add('/libri/ebooks');
      add(SITEMAP);
      break;
    case 'collections_index':
      add('/collane');
      add(SITEMAP);
      break;
    case 'authors_index':
      add('/autori');
      add(SITEMAP);
      break;
    case 'magazine_index':
      add('/magazine');
      add(SITEMAP);
      break;

    default:
      // Unknown / unmapped model: let the caller decide to no-op.
      return [];
  }

  return [...urls];
}
