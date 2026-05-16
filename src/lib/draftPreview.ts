import type { AstroCookies } from 'astro';
import { draftModeEnabledFromAstro } from '~/lib/draftMode';

export function resolveDraftMode(astro: { request?: Request; cookies: AstroCookies }) {
  return draftModeEnabledFromAstro(astro);
}
