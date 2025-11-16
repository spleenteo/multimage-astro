import { defineConfig, envField } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

const serverMode = (process.env.SERVER ?? 'static').toLowerCase();
const resolvedOutput = /** @type {'static' | 'server'} */ (
  serverMode === 'preview' ? 'server' : 'static'
);
const adapter = vercel();

// https://astro.build/config
export default defineConfig({
  output: resolvedOutput,
  adapter,
  site: 'https://www.multimage.org',
  env: {
    schema: {
      SERVER: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
      DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
      }),
      DATOCMS_DRAFT_CONTENT_CDA_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
      }),
      DATOCMS_CMA_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      SECRET_API_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
      }),
      SIGNED_COOKIE_JWT_SECRET: envField.string({
        context: 'server',
        access: 'secret',
      }),
      DRAFT_MODE_COOKIE_NAME: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN: envField.string({
        context: 'client',
        access: 'public',
      }),
      PUBLIC_SITE_URL: envField.string({
        context: 'client',
        access: 'public',
      }),
    },
    validateSecrets: true,
  },
  integrations: [tailwind()],
  build: {
    concurrency: 8, // Start here, then test 2, 6, 8
  },
});
