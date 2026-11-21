import { buildClient } from '@datocms/cma-client';
import { DATOCMS_CMA_TOKEN, SITE_SEARCH_BUILD_TRIGGER_ID } from 'astro:env/server';

/**
 * Re-spiders the DatoCMS Site Search index without a site rebuild. Best-effort:
 * a failure here must not fail the cache revalidation, so errors are logged and
 * swallowed. No-op (returns false) unless both the CMA token and the build
 * trigger id are set; true only when the reindex was triggered.
 */
export async function reindexSiteSearch(logPrefix = '[site-search]'): Promise<boolean> {
  if (!DATOCMS_CMA_TOKEN || !SITE_SEARCH_BUILD_TRIGGER_ID) {
    return false;
  }
  try {
    const client = buildClient({ apiToken: DATOCMS_CMA_TOKEN });
    await client.buildTriggers.reindex(SITE_SEARCH_BUILD_TRIGGER_ID);
    console.log(`${logPrefix} Site Search reindex triggered (${SITE_SEARCH_BUILD_TRIGGER_ID})`);
    return true;
  } catch (error) {
    console.error(`${logPrefix} Site Search reindex failed:`, error);
    return false;
  }
}
