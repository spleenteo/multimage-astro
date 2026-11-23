import type { APIRoute } from 'astro';
import { resolveDraftMode } from '~/lib/draftPreview';
import { readAuthorsIndex } from './autori/index/_data';

/**
 * Every author of the /autori index, in order, for the cards the browser builds: the page renders
 * the first letters only (one cached file, purged by cache tags like a page).
 */
export const prerender = false;

export const GET: APIRoute = async (context) => {
  const { items } = await readAuthorsIndex(resolveDraftMode(context), 500);
  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
