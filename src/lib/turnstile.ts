/**
 * Server-side Turnstile check shared by the form endpoints (`/api/ordine`, `/api/socio`).
 *
 * Server-only and free of `astro:env`: the caller passes the configured secret in, so the
 * module also loads under plain Node.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Cloudflare's always-pass test secret, used only in dev when no secret is set. */
export const DEV_TURNSTILE_SECRET = '1x0000000000000000000000000000000AA';
const TEST_SECRET = /^\dx0+AA$/;

export type TurnstileResult =
  | { ok: true }
  | {
      ok: false;
      status: 400 | 502;
      error: 'turnstile' | 'turnstile_unavailable';
      reason?: 'success' | 'hostname' | 'action';
    };

/** The secret to use: the configured one, else the test secret in dev, else '' (not configured). */
export function turnstileSecret(configured: string | undefined, isDev: boolean): string {
  return configured || (isDev ? DEV_TURNSTILE_SECRET : '');
}

/** A siteverify answer passes when `success` is true and, unless lenient, hostname and action match. */
export function checkSiteverify(
  result: unknown,
  expected: { hostname: string; action: string; lenient: boolean },
): boolean {
  if (typeof result !== 'object' || result === null) return false;
  const r = result as Record<string, unknown>;
  if (r.success !== true) return false;
  if (expected.lenient) return true;
  return r.hostname === expected.hostname && r.action === expected.action;
}

/** Verifies a widget token with siteverify; the token is never logged or returned. */
export async function verifyTurnstile(args: {
  secret: string;
  token: string;
  request: Request;
  action: string;
  isDev: boolean;
}): Promise<TurnstileResult> {
  const { secret, token, request, action, isDev } = args;
  let verdict: unknown;
  try {
    const form = new URLSearchParams({ secret, response: token });
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) form.set('remoteip', ip);
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, status: 502, error: 'turnstile_unavailable' };
    verdict = await res.json();
  } catch {
    return { ok: false, status: 502, error: 'turnstile_unavailable' };
  }
  // Lenient (success only) for Cloudflare's test secrets, in dev or on a local hostname.
  // The hostname comes only from `new URL(request.url).hostname`, matched exactly: never
  // from Host / X-Forwarded-Host, never startsWith/includes. Setting `security.allowedDomains`
  // in Astro would let X-Forwarded-Host rewrite `request.url`, and must re-examine this.
  const hostname = new URL(request.url).hostname;
  const lenient =
    TEST_SECRET.test(secret) && (isDev || ['localhost', '127.0.0.1'].includes(hostname));
  const expected = { hostname, action, lenient };
  if (checkSiteverify(verdict, expected)) return { ok: true };
  // Which check failed, for the operator: no token, no visitor data.
  const r = (typeof verdict === 'object' && verdict !== null ? verdict : {}) as Record<
    string,
    unknown
  >;
  const reason =
    r.success !== true ? 'success' : r.hostname !== expected.hostname ? 'hostname' : 'action';
  return { ok: false, status: 400, error: 'turnstile', reason };
}
