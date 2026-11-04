// Module resolve hook: swaps the real executeQuery for the stub, refuses astro:env.
const STUB = new URL('./stub-execute-query.mjs', import.meta.url).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('astro:env/')) {
    throw new Error(`revalidation-map check must not load ${specifier}`);
  }
  if (
    specifier === './executeQuery' &&
    context.parentURL?.endsWith('/src/lib/datocms/revalidationUrls.ts')
  ) {
    return { url: STUB, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
