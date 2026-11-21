import { defineMiddleware } from 'astro:middleware';
import { isDraftModeEnabled } from '~/lib/draftMode';
import {
  cacheTagStore,
  COARSE_MAX_AGE,
  createCacheTagState,
  decidePageTags,
} from '~/lib/datocms/cacheTags';

/**
 * Origins allowed to embed the site in an iframe during draft mode.
 *
 * The Web Previews "Visual" tab nests iframes:
 *
 *   admin.multimage.org           (DatoCMS admin app — top-level ancestor)
 *     └─ plugins-cdn.datocms.com  (the plugin — direct parent)
 *          └─ www.multimage.org   (this site)
 *
 * CSP `frame-ancestors` validates the WHOLE ancestor chain, not just the direct
 * parent, so every ancestor must be listed or the browser shows "refused to
 * connect".
 *
 * - `https://*.datocms.com` covers `plugins-cdn.datocms.com` (the plugin) plus
 *   the default admin host `multimage.admin.datocms.com`.
 * - `https://admin.multimage.org` is the project's custom admin domain (the
 *   URL editors actually use), which the wildcard above does NOT match.
 */
const FRAME_ANCESTORS = ["'self'", 'https://*.datocms.com', 'https://admin.multimage.org'].join(
  ' ',
);

/**
 * Path prefixes reserved for the editorial team ("editor session" required).
 *
 * The signed draft-mode cookie doubles as the editor session: holding it both
 * reveals unpublished content and authorizes access to these internal tools.
 * Everything else on the site is public.
 *
 * - `/staff` — internal hub + catalogue CSV export (exposes stock/circulation)
 * - `/libri/schede` — printable A4 book sheets for editors
 */
const INTERNAL_PATH_PREFIXES = ['/staff', '/libri/schede'];

function isInternalPath(pathname: string) {
  return INTERNAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const SIXTY_DAYS = 60 * 60 * 24 * 60;

/** Non-HTML routes that run CDA queries, so a purge keeps them fresh. */
const CACHED_NON_HTML_PATHS = new Set(['/sitemap.xml', '/archived-books.json']);

function isApiPath(pathname: string) {
  return pathname === '/api' || pathname.startsWith('/api/');
}

/** Set a header; if the headers are immutable, rebuild the response with it. */
function withHeader(response: Response, name: string, value: string) {
  try {
    response.headers.set(name, value);
    return response;
  } catch {
    const copy = new Response(response.body, response);
    copy.headers.set(name, value);
    return copy;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const draft = isDraftModeEnabled(context.cookies);
  const { pathname } = context.url;

  // Gate internal routes behind the editor session. Without it the public must
  // not even learn these paths exist, so we answer a flat 404 (CWE-200). This
  // is the single enforcement point — pages no longer guard themselves.
  if (isInternalPath(pathname) && !draft) {
    const notFound = new Response('Not found', { status: 404 });
    if (!context.cache.enabled) return notFound;
    context.cache.set(false);
    return withHeader(notFound, 'Cache-Control', 'private, no-store');
  }

  // Cloudflare GET requests outside /api open the per-request tag store that
  // `executeQuery` fills (internal paths included: they end up private anyway).
  // Vercel has no cache provider: no store, the handler runs as before.
  const state =
    context.cache.enabled && context.request.method === 'GET' && !isApiPath(pathname)
      ? createCacheTagState()
      : undefined;

  const handle = async () => {
    const response = await next();

    // When the editor is in draft mode, allow the DatoCMS Web Previews plugin
    // to embed the site inside the "Visual" tab iframe. Outside draft mode the
    // header is left untouched (Vercel applies its own defaults).
    // Read again after next(): the draft endpoints set or delete the cookie during
    // the request, and AstroCookies.get() sees those changes first.
    const draftNow = isDraftModeEnabled(context.cookies);
    if (draftNow) {
      response.headers.set('Content-Security-Policy', `frame-ancestors ${FRAME_ANCESTORS}`);
    }

    // Cloudflare only (the cache provider is absent on Vercel, which keeps its
    // ISR behaviour untouched). Exactly one `cache.set` call per request, made
    // here after `next()`: for cached rows the body is buffered first, because
    // the DatoCMS tags are collected while the page streams and a draft query
    // during the stream (state.disabled) turns the row private.
    if (!context.cache.enabled) return response;

    const isHtml = response.headers.get('content-type')?.startsWith('text/html') ?? false;
    const cacheable =
      !draftNow &&
      !state?.disabled &&
      !isInternalPath(pathname) &&
      !isApiPath(pathname) &&
      context.request.method === 'GET' &&
      response.status === 200 &&
      (isHtml || CACHED_NON_HTML_PATHS.has(pathname));

    if (!cacheable) {
      // Private row, or an endpoint with no CDA query (robots.txt, llms*.txt).
      const isPrivate =
        draftNow ||
        state?.disabled ||
        isInternalPath(pathname) ||
        isApiPath(pathname) ||
        context.request.method !== 'GET' ||
        response.status !== 200;
      context.cache.set(false);
      return isPrivate ? withHeader(response, 'Cache-Control', 'private, no-store') : response;
    }

    const body = await response.arrayBuffer();
    const buffered = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // The final decision runs after buffering: a draft query that ran while the
    // body streamed makes the page private whatever `draftNow` said.
    const decision = decidePageTags(state, isHtml);
    if (decision.disabled) {
      context.cache.set(false);
      return withHeader(buffered, 'Cache-Control', 'private, no-store');
    }

    context.cache.set({
      maxAge: decision.coarse ? COARSE_MAX_AGE : SIXTY_DAYS,
      tags: decision.tags,
    });
    const line = JSON.stringify({
      event: 'cache-tags',
      path: pathname,
      tagCount: decision.tagCount,
      hasLayoutTags: decision.hasLayoutTags,
      coarse: decision.coarse,
      reason: decision.reason,
    });
    if (decision.coarse) console.warn(line);
    else console.log(line);
    return buffered;
  };

  return state ? cacheTagStore.run(state, handle) : handle();
});
