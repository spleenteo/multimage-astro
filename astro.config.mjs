import { fileURLToPath } from 'node:url';

import { defineConfig, envField } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// DEPLOY_TARGET=cloudflare builds for Cloudflare Workers (trial, branch chore/cloudflare).
// Anything else keeps the Vercel adapter with ISR.
const isCloudflare = process.env.DEPLOY_TARGET === 'cloudflare';

const adapter = isCloudflare
  ? cloudflare({ imageService: 'passthrough', imagesBindingName: false })
  : vercel({
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
  // Workers Cache provider, Cloudflare only: on Vercel there is no `cache` key (ISR does the caching).
  ...(isCloudflare ? { cache: { provider: cacheCloudflare() } } : {}),
  site: 'https://www.multimage.org',
  // Permanent redirects for retired URLs (pages deleted from the CMS that may still be linked).
  redirects: {
    // Christmas 2025 membership page, deleted 2026-11-27.
    '/info/a-natale-regala-libri-multimage': { status: 301, destination: '/diventa-socio' },
  },
  // Astro 7 defaults to 'jsx' (strips whitespace between inline elements); keep HTML-aware compression.
  // Keep in sync with astroCompressHTML in .prettierrc (true = 'html').
  compressHTML: true,
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
      CACHE_INVALIDATION_WEBHOOK_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      DATOCMS_BASE_EDITING_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
      // DatoCMS environment to read from (e.g. a sandbox). Unset = the primary environment.
      DATOCMS_ENVIRONMENT: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
      SITE_SEARCH_BUILD_TRIGGER_ID: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      // Cloudflare Turnstile secret, verified server-side on /api/ordine and /api/socio.
      TURNSTILE_SECRET_KEY: envField.string({
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
      // Turnstile site key for the widget on /borsa and /diventa-socio; public, inlined at build.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
    validateSecrets: true,
  },
  integrations: [],
  build: {
    concurrency: 8,
  },
  vite: {
    plugins: [tailwindcss()],
    // Vercel build and Node dev compile the bindings wrapper against an empty stub; the
    // Cloudflare build gets the real `cloudflare:workers`.
    ...(isCloudflare
      ? {}
      : {
          resolve: {
            alias: {
              'cloudflare:workers': fileURLToPath(
                new URL('./src/lib/cloudflare-workers-stub.ts', import.meta.url),
              ),
            },
          },
        }),
    define: {
      'import.meta.env.DEPLOY_TARGET': JSON.stringify(process.env.DEPLOY_TARGET ?? 'vercel'),
    },
  },
});
