import { isValidCacheTag, SITE_TAG } from './cacheTags';

/**
 * Pure helpers of `POST /api/invalidate-cache`: payload parsing and batched
 * purge. The purge function is injected, so there is no env or network here.
 */
export type CachePurgeResult = {
  success: boolean;
  errors: { code: number; message: string }[];
};

export type PurgeFn = (options: { tags: string[] }) => Promise<CachePurgeResult>;

/** Free plan limit: 100 tags per purge request. */
export const PURGE_BATCH_SIZE = 100;

/**
 * Reads `entity.attributes.tags` of a DatoCMS cache-tags webhook payload.
 * Returns `null` when malformed (not an array of non-empty strings). Otherwise
 * the deduped valid tags plus `SITE_TAG` (when the array is not empty), and
 * `dropped`: how many distinct tags failed `isValidCacheTag` and were left out
 * (callers log it). `[]` gives `{ tags: [], dropped: 0 }`.
 */
export function invalidationTags(payload: unknown): { tags: string[]; dropped: number } | null {
  const tags = (payload as { entity?: { attributes?: { tags?: unknown } } })?.entity?.attributes
    ?.tags;
  if (!Array.isArray(tags)) return null;
  if (!tags.every((t) => typeof t === 'string' && t.length > 0)) return null;
  if (tags.length === 0) return { tags: [], dropped: 0 };

  const unique = [...new Set(tags as string[])];
  const valid = unique.filter(isValidCacheTag);
  return {
    tags: [...new Set([...valid, SITE_TAG])],
    dropped: unique.length - valid.length,
  };
}

/** Purges in sequence, batches of `PURGE_BATCH_SIZE`; stops at the first failure. */
export async function purgeInBatches(
  tags: string[],
  purge: PurgeFn,
): Promise<{
  ok: boolean;
  batches: number;
  errors: { code: number; message: string }[];
}> {
  let batches = 0;
  for (let i = 0; i < tags.length; i += PURGE_BATCH_SIZE) {
    batches++;
    try {
      const result = await purge({ tags: tags.slice(i, i + PURGE_BATCH_SIZE) });
      if (!result.success) return { ok: false, batches, errors: result.errors };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, batches, errors: [{ code: 0, message }] };
    }
  }
  return { ok: true, batches, errors: [] };
}
