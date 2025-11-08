import type { APIRoute } from 'astro';
import { executeQuery } from '~/lib/datocms/executeQuery';
import { SITEMAP_QUERY, type SitemapQueryResult } from './sitemap.xml/_graphql';

export const prerender = import.meta.env.PROD;

const STATIC_PATHS = [
  '/',
  '/libri',
  '/libri/ebooks',
  '/libri/highlights',
  '/libri/archivio',
  '/autori',
  '/collane',
  '/distributori',
  '/magazine',
  '/info',
];

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

export const GET: APIRoute = async ({ site }) => {
  const envOrigin = (import.meta.env.PUBLIC_SITE_URL || '').trim();
  const origin = envOrigin || site?.toString() || 'http://localhost:4321';

  if (!envOrigin && !site) {
    console.warn(
      '[sitemap] Falling back to http://localhost:4321. Configure PUBLIC_SITE_URL or the `site` option in astro.config.mjs for accurate sitemap URLs.',
    );
  }

  const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const buildTime = new Date().toISOString();
  const seen = new Set<string>();
  const urls: SitemapEntry[] = [];

  const normalizeLastModified = (value?: string | null) => {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
  };

  const pushEntry = (path: string, lastmod?: string | null) => {
    const url = new URL(path, baseUrl).toString();
    if (seen.has(url)) {
      return;
    }

    seen.add(url);
    urls.push({
      loc: url,
      lastmod: normalizeLastModified(lastmod),
    });
  };

  STATIC_PATHS.forEach((path) => {
    pushEntry(path, buildTime);
  });

  const data = await executeQuery<SitemapQueryResult>(SITEMAP_QUERY);

  const mapRecords = (records: SitemapQueryResult[keyof SitemapQueryResult], prefix: string) => {
    records.forEach((item) => {
      const slug = item.slug?.trim();
      if (!slug) {
        return;
      }

      pushEntry(`${prefix}${slug}`, item.updatedAt);
    });
  };

  mapRecords(data.allPages ?? [], '/info/');
  mapRecords(data.allBooks ?? [], '/libri/');
  mapRecords(data.allCollections ?? [], '/collane/');
  mapRecords(data.allAuthors ?? [], '/autori/');
  mapRecords(data.allBlogPosts ?? [], '/magazine/');

  urls.sort((a, b) => a.loc.localeCompare(b.loc));

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((entry) => {
        const lastmod = entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : '';
        return `  <url>\n    <loc>${entry.loc}</loc>\n${lastmod}  </url>`;
      })
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
