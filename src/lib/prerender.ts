const serverMode = (import.meta.env.SERVER ?? 'static').toLowerCase();

/** Shared flag so routes prerender in static mode but stay SSR in preview mode. */
export const prerender = serverMode !== 'preview';
