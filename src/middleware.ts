import { defineMiddleware } from 'astro:middleware';
import { isDraftModeEnabled } from '~/lib/draftMode';

const DATOCMS_PLUGINS_ORIGIN = 'https://plugins-cdn.datocms.com';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // When the editor is in draft mode, allow the DatoCMS Web Previews plugin
  // to embed the site inside the "Visual" tab iframe. Outside draft mode the
  // header is left untouched (Vercel applies its own defaults).
  if (isDraftModeEnabled(context.cookies)) {
    response.headers.set(
      'Content-Security-Policy',
      `frame-ancestors 'self' ${DATOCMS_PLUGINS_ORIGIN}`,
    );
  }

  return response;
});
