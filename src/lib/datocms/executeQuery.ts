import { executeQuery as libExecuteQuery } from '@datocms/cda-client';
import { DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN } from 'astro:env/server';

/**
 * Executes a GraphQL query using the DatoCMS Content Delivery API, using a
 * different API token depending on whether we want to fetch draft content or
 * published.
 */
export async function executeQuery<
  Result = unknown,
  Variables extends Record<string, unknown> = Record<string, unknown>,
>(query: string, options?: ExecuteQueryOptions<Variables>) {
  const result = await libExecuteQuery<Result, Variables>(query, {
    variables: options?.variables,
    excludeInvalid: true,
    includeDrafts: false,
    token: DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN,
  });

  return result;
}

type ExecuteQueryOptions<Variables extends Record<string, unknown>> = {
  variables?: Variables;
  includeDrafts?: boolean;
};
