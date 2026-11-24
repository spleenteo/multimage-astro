// Minimal typing for `cloudflare:workers` (no Workers types are installed).
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
