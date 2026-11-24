/**
 * No-network check of the webhook -> URL map (procedure (a) in docs/guidelines/caching.md).
 * Run with `npm run check:revalidation-map`. Parses every sample payload like the
 * endpoint does, then compares getRevalidationUrls() with a hard-coded expectation.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { parseWebhookPayload } from '../../src/lib/datocms/webhookPayload';
import { recordToWebsiteRoute } from '../../src/lib/datocms/recordInfo';
import {
  getRevalidationUrls,
  type RevalidationQuery,
} from '../../src/lib/datocms/revalidationUrls';
import * as stub from './stub-execute-query.mjs';

// The fetch blocker and the counter are installed by sentinel.mjs, before any import.
// The stub is always passed in: the default query would load astro:env/server.
const { executeQuery } = stub as { executeQuery: RevalidationQuery };

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
  // book resolves to null: author/collection pages not revalidated
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
  // phantom model: not in the schema, no longer mapped
  'books_index-publish': { urls: [] },
  'index_page-publish': { urls: ['/autori'] },
  'index_page-libri-publish': { urls: ['/libri', '/libri/pagina/2', '/libri/pagina/3'] },
  'index_page-unknown-publish': { urls: [] },
  'supplier-publish': { urls: ['/distributori'] },
  'license-publish': { urls: ['/libri/libro-cc', '/libri/libro-cc-due'] },
  // staff-gated reader only: no-op by design
  'app-publish': { urls: [] },
  malformed: { urls: null },
};

const dir = new URL('./payloads/', import.meta.url);
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort();

let mismatches = 0;
for (const file of files) {
  const name = file.replace(/\.json$/, '');
  const { eventType, apiKey, slug, id } = parseWebhookPayload(
    JSON.parse(readFileSync(new URL(file, dir), 'utf8')),
  );
  const expected = EXPECTED[name];
  // Like the endpoint: no api_key means the map is skipped.
  const actual =
    apiKey === null ? null : await getRevalidationUrls({ apiKey, slug, id }, executeQuery);

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

for (const key of Object.keys(EXPECTED)) {
  if (!files.includes(`${key}.json`)) {
    mismatches += 1;
    console.log(`${key} MISMATCH (no payload file)`);
  }
}

// recordToWebsiteRoute: the Web Previews / SEO side of the same map.
const ROUTES: Array<[string, string, string | null]> = [
  ['index_page', 'libri', '/libri'],
  ['index_page', 'ebooks', '/libri/ebooks'],
  ['index_page', 'highlights', '/libri/highlights'],
  ['index_page', 'archivio', '/libri/archivio'],
  ['index_page', 'collane', '/collane'],
  ['index_page', 'autori', '/autori'],
  ['index_page', 'magazine', '/magazine'],
  ['index_page', 'distributori', '/distributori'],
  ['index_page', 'sconosciuta', null],
  ['index_page', 'constructor', null],
  ['supplier', '', '/distributori'],
  ['membership', '', '/diventa-socio'],
  ['books_index', '', null],
];
for (const [apiKey, slug, want] of ROUTES) {
  const got = await recordToWebsiteRoute({ attributes: slug ? { slug } : {} }, apiKey, 'it');
  const status = got === want ? 'OK' : 'MISMATCH';
  if (status === 'MISMATCH') mismatches += 1;
  console.log(`route ${apiKey} ${slug || '-'} ${got} ${status}`);
}

// fetchCalls is read after the loop so calls made during it are counted.
const fetchCallsNow = (globalThis as { __fetchCalls?: number }).__fetchCalls ?? -1;
console.log(
  `${files.length} payloads, ${ROUTES.length} routes, ${mismatches} mismatches, fetch calls: ${fetchCallsNow}`,
);
// Sentinel: sentinel.mjs sets exitCode = 1; only a completed run resets it.
process.exitCode = mismatches > 0 || fetchCallsNow !== 0 ? 1 : 0;
