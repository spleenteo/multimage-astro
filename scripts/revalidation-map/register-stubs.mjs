import module from 'node:module';
import { resolve } from './hooks.mjs';

if (typeof module.registerHooks !== 'function') {
  throw new Error('revalidation-map check needs Node >= 22.15 (module.registerHooks)');
}
module.registerHooks({ resolve });

// Block network before anything is imported; check.ts reports the count.
globalThis.__fetchCalls = 0;
globalThis.fetch = () => {
  globalThis.__fetchCalls += 1;
  throw new Error('fetch is blocked in the revalidation-map check');
};

// Sentinel: check.ts resets this at the end of a completed run, so an entry
// that never runs exits 1 instead of a silent 0.
process.exitCode = 1;
