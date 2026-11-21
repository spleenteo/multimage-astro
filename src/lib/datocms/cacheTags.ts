import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request cache tag collection (Cloudflare only). `executeQuery` pushes the
 * `x-cache-tags` of every published query into the state; only the middleware
 * reads it, after the response is buffered, and makes the one `cache.set` call.
 * Pure module: no env, no network.
 */
export type CacheTagState = {
  tags: Set<string>;
  /** True once a layout query (BaseLayout) contributed at least one tag. */
  layout: boolean;
  /** True once a draft query ran: the page must not be cached. */
  disabled: boolean;
};

export const SITE_TAG = 'site';
/** Cloudflare keeps the first 1000 tags and the provider appends its path tag last. */
export const MAX_PAGE_TAGS = 990;
/** Short maxAge (1 day) for pages that fall back to the coarse `site` tag. */
export const COARSE_MAX_AGE = 86400;
const MAX_TAG_LENGTH = 1024;

export type PageTagsReason = 'tags' | 'empty' | 'overflow' | 'invalid' | 'no-layout' | 'disabled';

export type PageTagsDecision = {
  tags: string[];
  coarse: boolean;
  reason: PageTagsReason;
  /** Unique collected tags. */
  tagCount: number;
  hasLayoutTags: boolean;
  disabled: boolean;
};

export const cacheTagStore = new AsyncLocalStorage<CacheTagState>();

export function createCacheTagState(): CacheTagState {
  return { tags: new Set(), layout: false, disabled: false };
}

/** Printable ASCII 0x21-0x7E, no comma (the provider's separator), at most 1024 chars. */
export function isValidCacheTag(tag: string): boolean {
  return (
    tag.length > 0 &&
    tag.length <= MAX_TAG_LENGTH &&
    /^[\x21-\x7E]+$/.test(tag) &&
    !tag.includes(',')
  );
}

/** Adds the tags of an `x-cache-tags` header (space separated) to the state. */
export function addCacheTags(state: CacheTagState, header: string | null, scope?: 'layout'): void {
  if (!header) return;
  let added = 0;
  for (const tag of header.split(/\s+/)) {
    if (!tag) continue;
    state.tags.add(tag);
    added++;
  }
  if (scope === 'layout' && added > 0) state.layout = true;
}

/**
 * Decides the tags of a cacheable page. Coarse fallback (`['site']`, short
 * maxAge) when there are no tags, too many, an invalid one, or an HTML page
 * (`requireLayout`) with no layout tag: each would leave the page unpurgeable.
 */
export function decidePageTags(
  state: CacheTagState | undefined,
  requireLayout: boolean,
): PageTagsDecision {
  const collected = state ? [...state.tags] : [];
  const base = {
    tagCount: collected.length,
    hasLayoutTags: state?.layout ?? false,
    disabled: state?.disabled ?? false,
  };
  const coarse = (reason: PageTagsReason): PageTagsDecision => ({
    ...base,
    tags: [SITE_TAG],
    coarse: true,
    reason,
  });

  if (base.disabled) return coarse('disabled');
  if (collected.length === 0) return coarse('empty');
  if (collected.length > MAX_PAGE_TAGS) return coarse('overflow');
  if (!collected.every(isValidCacheTag)) return coarse('invalid');
  if (requireLayout && !base.hasLayoutTags) return coarse('no-layout');
  return { ...base, tags: collected, coarse: false, reason: 'tags' };
}
