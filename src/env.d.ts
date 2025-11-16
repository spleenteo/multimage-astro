/// <reference path="../.astro/types.d.ts" />
/// <reference path="../.astro/env.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN?: string;
  readonly SERVER?: 'static' | 'preview';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
