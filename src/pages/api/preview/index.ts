import type { APIRoute } from 'astro';
import { SECRET_API_TOKEN } from 'astro:env/server';
import { enableDraftMode } from '~/lib/draftMode';
import { handleUnexpectedError, invalidRequestResponse, isRelativeUrl } from '../utils';

export const prerender = false;

const REDIRECT_FALLBACK = '/';

type PreviewPayload = {
  redirect?: string;
  url?: string;
  path?: string;
  secret?: string;
  token?: string;
};

function resolveRedirect(candidate: string | null | undefined) {
  const redirectUrl = candidate?.trim() || REDIRECT_FALLBACK;

  if (!isRelativeUrl(redirectUrl)) {
    return invalidRequestResponse('Redirect must be a relative URL.', 422);
  }

  return redirectUrl;
}

function normalizeSecret(secret: string | null | undefined) {
  return secret?.trim() || null;
}

function validateSecret(secret: string | null | undefined) {
  const normalized = normalizeSecret(secret);

  if (!normalized || normalized !== SECRET_API_TOKEN) {
    console.warn('[preview] Secret mismatch', { normalized, expected: SECRET_API_TOKEN });
    return invalidRequestResponse('Invalid or missing preview secret.', 401);
  }

  return true;
}

function resolveSecretFromParams(url: URL) {
  return normalizeSecret(url.searchParams.get('secret') ?? url.searchParams.get('token'));
}

export const GET: APIRoute = (event) => {
  console.log('[preview] incoming GET', event.url.toString(), 'request.url', event.request.url);
  const secret = resolveSecretFromParams(event.url);
  const secretResult = validateSecret(secret);

  if (secretResult !== true) {
    return secretResult;
  }

  const redirect = resolveRedirect(
    event.url.searchParams.get('redirect') ??
      event.url.searchParams.get('url') ??
      event.url.searchParams.get('path'),
  );

  if (typeof redirect !== 'string') {
    return redirect;
  }

  enableDraftMode(event);

  return event.redirect(redirect, 307);
};

export const POST: APIRoute = async (event) => {
  try {
    const payload = (await event.request.json().catch(() => ({}))) as PreviewPayload;
    const secret = normalizeSecret(
      payload.secret ?? payload.token ?? resolveSecretFromParams(event.url),
    );
    const secretResult = validateSecret(secret);

    if (secretResult !== true) {
      return secretResult;
    }

    const redirectCandidate = payload.redirect ?? payload.url ?? payload.path;
    const redirect = resolveRedirect(redirectCandidate);

    if (typeof redirect !== 'string') {
      return redirect;
    }

    enableDraftMode(event);

    return event.redirect(redirect, 307);
  } catch (error) {
    return handleUnexpectedError(error);
  }
};
