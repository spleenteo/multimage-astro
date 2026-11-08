// Preload for check.ts: blocks network before anything is imported and arms the exit-code sentinel.

// check.ts reports the count; any call also throws.
globalThis.__fetchCalls = 0;
globalThis.fetch = () => {
  globalThis.__fetchCalls += 1;
  throw new Error('fetch is blocked in the revalidation-map check');
};

// Sentinel: check.ts resets this at the end of a completed run, so an entry
// that never runs (or throws) exits 1 instead of a silent 0.
process.exitCode = 1;
