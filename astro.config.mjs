import { defineConfig, envField } from 'astro/config';

import vercel from '@astrojs/vercel';

const adapter = vercel({
  isr: {
    bypassToken: process.env.BYPASS_TOKEN,
    // 60-day TTL as a safety net only. Content changes propagate on-demand via
    // the /api/revalidate webhook (publish → surgical invalidation of just the
    // affected URLs + Site Search reindex), so the TTL only covers the rare case
    // of a missed/failed webhook. A short TTL is pure waste here: it forces the
    // whole surface (~670 URLs) to re-render in the background roughly weekly,
    // burning Vercel Fast Origin Transfer for content that has not changed. Force
    // a full refresh anytime with a manual build or POST /api/revalidate?mode=full.
    expiration: 60 * 60 * 24 * 60,
    exclude: [/^\/api\//],
  },
});

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter,
  site: 'https://www.multimage.org',
  env: {
    schema: {
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
      BYPASS_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      DATOCMS_BASE_EDITING_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
      SITE_SEARCH_BUILD_TRIGGER_ID: envField.string({
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
  integrations: [],
  build: {
    concurrency: 8,
  },
});
