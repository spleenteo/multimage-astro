import type { APIRoute } from 'astro';
import { executeQuery } from '~/lib/datocms/executeQuery';

export const prerender = true;

const ARCHIVED_BOOKS_QUERY = /* GraphQL */ `
  query ArchivedBooksSlugs {
    allBooks(filter: { _status: { eq: published }, archive: { eq: true } }) {
      slug
    }
  }
`;

type ArchivedBooksResponse = {
  allBooks: Array<{ slug?: string | null }> | null;
};

export const GET: APIRoute = async () => {
  const data = await executeQuery<ArchivedBooksResponse>(ARCHIVED_BOOKS_QUERY);

  const slugs = (data.allBooks ?? [])
    .map((book) => book.slug?.trim())
    .filter((slug): slug is string => Boolean(slug))
    .filter((slug, index, list) => list.indexOf(slug) === index);

  return new Response(JSON.stringify({ slugs }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, immutable',
    },
  });
};
