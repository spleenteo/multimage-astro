import type { APIContext, AstroCookieSetOptions, AstroCookies } from 'astro';
import {
  BYPASS_TOKEN,
  DRAFT_MODE_COOKIE_NAME as SERVER_DRAFT_MODE_COOKIE_NAME,
  SIGNED_COOKIE_JWT_SECRET,
} from 'astro:env/server';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const DRAFT_MODE_COOKIE_NAME = SERVER_DRAFT_MODE_COOKIE_NAME?.trim() || 'multimage_draft_mode';

// Cookie name recognized by Vercel CDN to bypass the ISR cache.
// See https://vercel.com/docs/build-output-api/v3/features#draft-mode
const VERCEL_BYPASS_COOKIE_NAME = '__prerender_bypass';

const SHARED_COOKIE_OPTS = {
  path: '/' as const,
  sameSite: 'none' as const,
  secure: true,
  ...({ partitioned: true } as AstroCookieSetOptions),
};

/**
 * Generates a JSON Web Token (JWT) that is used as a signed cookie for entering
 * Draft Mode.
 */
function jwtToken() {
  return jwt.sign({ enabled: true }, SIGNED_COOKIE_JWT_SECRET);
}

/**
 * Sets the signed cookie required to enter Draft Mode plus the Vercel-native
 * `__prerender_bypass` cookie that tells the CDN to bypass ISR cache for the
 * editor's requests.
 *
 * - JWT cookie: identifies the editor as authenticated (app-level)
 * - Vercel bypass cookie: makes the CDN serve fresh responses (infra-level)
 */
export function enableDraftMode(context: APIContext) {
  context.cookies.set(DRAFT_MODE_COOKIE_NAME, jwtToken(), {
    ...SHARED_COOKIE_OPTS,
    httpOnly: false,
  });

  if (BYPASS_TOKEN) {
    context.cookies.set(VERCEL_BYPASS_COOKIE_NAME, BYPASS_TOKEN, {
      ...SHARED_COOKIE_OPTS,
      httpOnly: true,
    });
  }
}

/**
 * Disables Draft Mode by deleting both the JWT cookie and the Vercel bypass
 * cookie.
 */
export function disableDraftMode(context: APIContext) {
  context.cookies.delete(DRAFT_MODE_COOKIE_NAME, {
    ...SHARED_COOKIE_OPTS,
    httpOnly: false,
  });

  context.cookies.delete(VERCEL_BYPASS_COOKIE_NAME, {
    ...SHARED_COOKIE_OPTS,
    httpOnly: true,
  });
}

/**
 * To be used on API routes: checks if Draft Mode is enabled for a given
 * request. It retrieves the JWT cookie and verifies its signature.
 */
export function isDraftModeEnabled(contextOrCookies: APIContext | AstroCookies) {
  const cookies = 'cookies' in contextOrCookies ? contextOrCookies.cookies : contextOrCookies;

  const cookie = cookies.get(DRAFT_MODE_COOKIE_NAME);

  if (!cookie) {
    return false;
  }

  try {
    const payload = jwt.verify(cookie.value, SIGNED_COOKIE_JWT_SECRET) as JwtPayload;

    return payload.enabled as boolean;
  } catch (e) {
    return false;
  }
}

type AstroRuntime = {
  request?: Request;
  cookies: AstroCookies;
};

export function draftModeEnabledFromAstro(astro: AstroRuntime) {
  if (!astro?.request) {
    return false;
  }

  return isDraftModeEnabled(astro.cookies);
}

/**
 * Returns the HTTP headers needed to enable Draft Mode programmatically (e.g.
 * server-side fetch from the SEO analysis endpoint).
 */
export function draftModeHeaders(): HeadersInit {
  const parts = [`${DRAFT_MODE_COOKIE_NAME}=${jwtToken()}`];

  if (BYPASS_TOKEN) {
    parts.push(`${VERCEL_BYPASS_COOKIE_NAME}=${BYPASS_TOKEN}`);
  }

  return { Cookie: parts.join('; ') };
}
