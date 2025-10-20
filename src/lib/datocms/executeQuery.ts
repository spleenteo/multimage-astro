import { executeQuery as libExecuteQuery } from '@datocms/cda-client';
import { DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN } from 'astro:env/server';
import type { TadaDocumentNode } from 'gql.tada';

/**
 * Executes a GraphQL query using the DatoCMS Content Delivery API, using a
 * different API token depending on whether we want to fetch draft content or
 * published.
 */
export async function executeQuery<Result, Variables = Record<string, never>>(
  query: TadaDocumentNode<Result, Variables>,
  options?: ExecuteQueryOptions<Variables>,
) {
  const result = await libExecuteQuery<Result, Variables>(query, {
    variables: options?.variables,
    excludeInvalid: true,
    includeDrafts: false,
    token: DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN,
  });

  return result;
}

type ExecuteQueryOptions<Variables> = {
  variables?: Variables;
  includeDrafts?: boolean;
};
