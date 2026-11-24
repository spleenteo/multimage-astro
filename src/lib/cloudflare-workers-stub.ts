// Stand-in for `cloudflare:workers` outside the Cloudflare build (Vercel build, plain
// `astro dev`): no bindings, so the wrappers in cloudflare-bindings.ts return null.
export const env: Record<string, unknown> = {};
