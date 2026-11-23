import type { APIRoute } from 'astro';
import { executeQuery } from '~/lib/datocms/executeQuery';
import { toCatalogueCard } from '~/lib/catalogueCard';
import type { CatalogueCard } from '~/lib/catalogue';
import { resolveDraftMode } from '~/lib/draftPreview';
import {
  BOOKS_CATALOGUE_CARDS_QUERY,
  CATALOGUE_PAGE_SIZE,
  type BooksCatalogueCardsResult,
} from './libri/index/_graphql';

/**
 * The card of every published book, keyed by slug, for /libri: the page renders the first cards
 * and the browser builds the others from here (one cached file, purged by cache tags like a page).
 */
export const prerender = false;

export const GET: APIRoute = async (context) => {
  const includeDrafts = resolveDraftMode(context);
  const cards: Record<string, CatalogueCard> = {};
  let read = 0;
  let total = Infinity;
  while (read < total) {
    const page = await executeQuery<BooksCatalogueCardsResult>(BOOKS_CATALOGUE_CARDS_QUERY, {
      includeDrafts,
      variables: { first: CATALOGUE_PAGE_SIZE, skip: read },
    });
    total = page._allBooksMeta?.count ?? 0;
    if (!page.allBooks?.length) break;
    read += page.allBooks.length;
    for (const record of page.allBooks) cards[record.slug] = toCatalogueCard(record);
  }

  return new Response(JSON.stringify(cards), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
