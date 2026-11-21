/**
 * No-network check of the cache tag decision, the invalidation payload parser
 * and the batched purge. Run with `npm run check:cache-tags`.
 */
import { setTimeout as sleep } from 'node:timers/promises';
import {
  addCacheTags,
  cacheTagStore,
  createCacheTagState,
  decidePageTags,
  SITE_TAG,
  type CacheTagState,
} from '../../src/lib/datocms/cacheTags';
import {
  invalidationTags,
  purgeInBatches,
  type CachePurgeResult,
} from '../../src/lib/datocms/cacheInvalidation';

let cases = 0;
let mismatches = 0;
function check(name: string, ok: boolean, detail = ''): void {
  cases++;
  if (!ok) mismatches++;
  console.log(`${name} ${ok ? 'OK' : 'MISMATCH'}${ok ? '' : ` ${detail}`}`);
}

function stateOf(
  n: number,
  opts: { layout?: boolean; disabled?: boolean; tag?: (i: number) => string } = {},
): CacheTagState {
  const s = createCacheTagState();
  for (let i = 0; i < n; i++) s.tags.add(opts.tag ? opts.tag(i) : `t${i}`);
  s.layout = opts.layout ?? true;
  s.disabled = opts.disabled ?? false;
  return s;
}

// decidePageTags
const five = decidePageTags(stateOf(5), true);
check(
  'tags-5-layout',
  five.reason === 'tags' &&
    !five.coarse &&
    five.tags.length === 5 &&
    five.tagCount === 5 &&
    five.hasLayoutTags,
  JSON.stringify(five),
);
check('tags-0-empty', decidePageTags(stateOf(0), true).reason === 'empty');
check('tags-undefined-empty', decidePageTags(undefined, true).reason === 'empty');
const e = decidePageTags(stateOf(0), true);
check('empty-is-coarse-site', e.coarse && e.tags.length === 1 && e.tags[0] === SITE_TAG);
check('tags-990', decidePageTags(stateOf(990), true).reason === 'tags');
const o = decidePageTags(stateOf(991), true);
check(
  'tags-991-overflow',
  o.reason === 'overflow' && o.coarse && o.tagCount === 991 && o.tags[0] === SITE_TAG,
);
check(
  'tag-comma-invalid',
  decidePageTags(stateOf(1, { tag: () => 'a,b' }), true).reason === 'invalid',
);
check(
  'tag-space-char-invalid',
  decidePageTags(stateOf(1, { tag: () => 'aé' }), true).reason === 'invalid',
);
check(
  'tag-1025-invalid',
  decidePageTags(stateOf(1, { tag: () => 'x'.repeat(1025) }), true).reason === 'invalid',
);
check(
  'tag-1024-valid',
  decidePageTags(stateOf(1, { tag: () => 'x'.repeat(1024) }), true).reason === 'tags',
);
const nl = decidePageTags(stateOf(5, { layout: false }), true);
check('html-no-layout', nl.reason === 'no-layout' && nl.coarse && !nl.hasLayoutTags);
check('non-html-no-layout', decidePageTags(stateOf(5, { layout: false }), false).reason === 'tags');
const d = decidePageTags(stateOf(5, { disabled: true }), true);
check('disabled-reported', d.disabled && d.reason === 'disabled' && d.coarse);

// invalidationTags
const body = (tags: unknown) => ({ entity: { attributes: { tags } } });
const dup = invalidationTags(body(['a', 'b', 'a']));
check(
  'payload-dedup-site',
  !!dup && dup.tags.join() === `a,b,${SITE_TAG}` && dup.dropped === 0,
  JSON.stringify(dup),
);
const empty = invalidationTags(body([]));
check('payload-empty-array', !!empty && empty.tags.length === 0 && empty.dropped === 0);
check('payload-missing-tags', invalidationTags({ entity: { attributes: {} } }) === null);
check('payload-number-tag', invalidationTags(body(['a', 1])) === null);
check('payload-empty-string-tag', invalidationTags(body([''])) === null);
check('payload-string-body', invalidationTags('x') === null);
const inv = invalidationTags(body(['good', 'bad,tag', 'x'.repeat(1025), 'good']));
check(
  'payload-invalid-dropped',
  !!inv && inv.tags.join() === `good,${SITE_TAG}` && inv.dropped === 2,
  JSON.stringify(inv),
);
const allBad = invalidationTags(body(['bad,tag']));
check(
  'payload-all-invalid-keeps-site',
  !!allBad && allBad.tags.join() === SITE_TAG && allBad.dropped === 1,
);

// purgeInBatches
const ok: CachePurgeResult = { success: true, errors: [] };
const sizes: number[] = [];
const r1 = await purgeInBatches(
  Array.from({ length: 250 }, (_, i) => `t${i}`),
  async ({ tags }) => (sizes.push(tags.length), ok),
);
check(
  'purge-250-three-calls',
  r1.ok && r1.batches === 3 && sizes.join() === '100,100,50',
  JSON.stringify([r1, sizes]),
);
let calls = 0;
const r2 = await purgeInBatches(
  Array.from({ length: 250 }, (_, i) => `t${i}`),
  async () => (++calls === 2 ? { success: false, errors: [{ code: 1, message: 'no' }] } : ok),
);
check(
  'purge-fail-call-2',
  !r2.ok && r2.batches === 2 && calls === 2 && r2.errors[0]?.code === 1,
  JSON.stringify(r2),
);
const r3 = await purgeInBatches(['a'], async () => {
  throw new Error('boom');
});
check(
  'purge-throw',
  !r3.ok && r3.errors[0]?.code === 0 && r3.errors[0]?.message === 'boom',
  JSON.stringify(r3),
);

// AsyncLocalStorage survives an await
const st = createCacheTagState();
await cacheTagStore.run(st, async () => {
  await sleep(5);
  const s = cacheTagStore.getStore();
  if (s) addCacheTags(s, 'a b  c', 'layout');
});
check('store-survives-await', st.tags.size === 3 && st.layout);

const fetchCalls = (globalThis as { __fetchCalls?: number }).__fetchCalls ?? -1;
console.log(`${cases} cases, ${mismatches} mismatches, fetch calls: ${fetchCalls}`);
// Sentinel: sentinel.mjs sets exitCode = 1; only a completed run resets it.
process.exitCode = mismatches > 0 || fetchCalls !== 0 ? 1 : 0;
