import type { AstroCookies } from 'astro';
import { draftModeEnabledFromAstro } from '~/lib/draftMode';

const draftPreviewSsrEnabled = true;

export function resolveDraftMode(astro: { request?: Request; cookies: AstroCookies }) {
  if (!draftPreviewSsrEnabled) {
    return false;
  }

  return draftModeEnabledFromAstro(astro);
}

export { draftPreviewSsrEnabled };
