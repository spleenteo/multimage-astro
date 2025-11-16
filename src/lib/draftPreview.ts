import type { AstroCookies } from 'astro';
import { draftModeEnabledFromAstro } from '~/lib/draftMode';

const serverMode = (import.meta.env.SERVER ?? 'static').toLowerCase();
const draftPreviewSsrEnabled = serverMode === 'preview';

export function resolveDraftMode(astro: { request?: Request; cookies: AstroCookies }) {
  if (!draftPreviewSsrEnabled) {
    return false;
  }

  return draftModeEnabledFromAstro(astro);
}

export { draftPreviewSsrEnabled };
