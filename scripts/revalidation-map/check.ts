/**
 * No-network check of the webhook -> URL map (procedure (a) in docs/guidelines/caching.md).
 * Run with `npm run check:revalidation-map`. Parses every sample payload like the
 * endpoint does, then compares getRevalidationUrls() with a hard-coded expectation.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { parseWebhookPayload } from '../../src/lib/datocms/webhookPayload';
import { getRevalidationUrls } from '../../src/lib/datocms/revalidationUrls';

let fetchCalls = 0;
globalThis.fetch = (() => {
  fetchCalls += 1;
  throw new Error('fetch is blocked in the revalidation-map check');
}) as typeof fetch;

const SITEMAP = '/sitemap.xml';
const bookStatic = [
  '/libri/libro-pubblicato',
  '/libri/ebooks',
  '/libri/highlights',
  '/libri/archivio',
  '/',
  SITEMAP,
];

// Expected URL set per payload file (null = the endpoint skips the map, apiKey is null).
// note: GAP when the expectation encodes a known hole in the map.
const EXPECTED: Record<string, { urls: string[] | null; note?: 'GAP' }> = {
  'book-publish': {
    urls: [
      ...bookStatic,
      '/libri',
      '/libri/pagina/2',
      '/libri/pagina/3',
      '/autori/autore-uno',
      '/autori/autore-due',
      '/collane/collana-uno',
    ],
  },
  // book unpublished: no author / collection pages, no catalogue pages beyond the page count
  'book-unpublish': {
    urls: [
      '/libri/libro-non-pubblicato',
      '/libri/ebooks',
      '/libri/highlights',
      '/libri/archivio',
      '/',
      SITEMAP,
      '/libri',
      '/libri/pagina/2',
      '/libri/pagina/3',
    ],
    note: 'GAP',
  },
  'author-publish': { urls: ['/autori/autore-uno', '/autori', SITEMAP] },
  'collection-publish': { urls: ['/collane/collana-uno', '/collane', SITEMAP] },
  'blog_post-publish': { urls: ['/magazine/articolo-uno', '/magazine', SITEMAP] },
  // page feeds header/footer menus on every route, only /info is revalidated
  'page-publish': { urls: ['/info/chi-siamo', '/info', SITEMAP], note: 'GAP' },
  'home-publish': { urls: ['/', SITEMAP] },
  // phantom model: the real one is index_page, but the map still has the key
  'books_index-publish': { urls: ['/libri', SITEMAP] },
  'index_page-publish': { urls: [], note: 'GAP' },
  'supplier-publish': { urls: [], note: 'GAP' },
  'license-publish': { urls: [], note: 'GAP' },
  'app-publish': { urls: [], note: 'GAP' },
  malformed: { urls: null },
};

const dir = new URL('./payloads/', import.meta.url);
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort();

let mismatches = 0;
for (const file of files) {
  const name = file.replace(/\.json$/, '');
  const { eventType, apiKey, slug } = parseWebhookPayload(
    JSON.parse(readFileSync(new URL(file, dir), 'utf8')),
  );
  const expected = EXPECTED[name];
  // Like the endpoint: no api_key means the map is skipped.
  const actual = apiKey === null ? null : await getRevalidationUrls({ apiKey, slug });

  let status: string;
  if (!expected) {
    status = 'MISMATCH';
  } else if (actual === null || expected.urls === null) {
    status = actual === expected.urls ? 'OK' : 'MISMATCH';
  } else {
    const a = new Set(actual);
    const same =
      a.size === actual.length &&
      a.size === expected.urls.length &&
      expected.urls.every((u) => a.has(u));
    status = same ? (expected.note ?? 'OK') : 'MISMATCH';
  }
  if (status === 'MISMATCH') {
    mismatches += 1;
    if (actual) console.log(`  actual: ${actual.join(' ')}`);
  }
  console.log(
    `${name} ${eventType} ${apiKey} ${slug} ${actual === null ? 'skipped' : actual.length} ${status}`,
  );
}

console.log(`${files.length} payloads, ${mismatches} mismatches, fetch calls: ${fetchCalls}`);
process.exit(mismatches > 0 || fetchCalls > 0 ? 1 : 0);
