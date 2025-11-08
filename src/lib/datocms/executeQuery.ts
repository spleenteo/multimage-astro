import { executeQuery as libExecuteQuery } from '@datocms/cda-client';
import {
  DATOCMS_DRAFT_CONTENT_CDA_TOKEN,
  DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN,
} from 'astro:env/server';

/**
 * Executes a GraphQL query using the DatoCMS Content Delivery API, using a
 * different API token depending on whether we want to fetch draft content or
 * published.
 */
export async function executeQuery<
  Result = unknown,
  Variables extends Record<string, unknown> = Record<string, unknown>,
>(query: string, options?: ExecuteQueryOptions<Variables>) {
  const includeDrafts = Boolean(options?.includeDrafts);
  const token = options?.token ?? resolveToken(includeDrafts);

  const result = await libExecuteQuery<Result, Variables>(query, {
    variables: options?.variables,
    excludeInvalid: options?.excludeInvalid ?? true,
    includeDrafts,
    token,
    environment: options?.environment,
  });

  return result;
}

function resolveToken(includeDrafts: boolean) {
  if (includeDrafts) {
    if (!DATOCMS_DRAFT_CONTENT_CDA_TOKEN) {
      throw new Error(
        'Draft mode requested but DATOCMS_DRAFT_CONTENT_CDA_TOKEN is missing. Make sure it is configured locally and on Vercel.',
      );
    }

    return DATOCMS_DRAFT_CONTENT_CDA_TOKEN;
  }

  if (!DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN) {
    throw new Error('Missing DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN.');
  }

  return DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN;
}

type ExecuteQueryOptions<Variables extends Record<string, unknown>> = {
  variables?: Variables;
  includeDrafts?: boolean;
  token?: string;
  excludeInvalid?: boolean;
  environment?: string;
};
