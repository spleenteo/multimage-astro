import { defineMiddleware } from 'astro:middleware';
import { isDraftModeEnabled } from '~/lib/draftMode';

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

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // When the editor is in draft mode, allow the DatoCMS Web Previews plugin
  // to embed the site inside the "Visual" tab iframe. Outside draft mode the
  // header is left untouched (Vercel applies its own defaults).
  if (isDraftModeEnabled(context.cookies)) {
    response.headers.set('Content-Security-Policy', `frame-ancestors ${FRAME_ANCESTORS}`);
  }

  return response;
});
