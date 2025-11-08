declare module '@datocms/cma-client' {
  export { ApiError, LogLevel, TimeoutError } from '@datocms/rest-client-utils';
  export { buildClient } from '@datocms/cma-client/dist/types/buildClient';
  export { Client } from '@datocms/cma-client/dist/types/generated/Client';
  export type { ClientConfigOptions } from '@datocms/cma-client/dist/types/generated/Client';
  export * as Resources from '@datocms/cma-client/dist/types/generated/resources';
  export * as SchemaTypes from '@datocms/cma-client/dist/types/generated/SchemaTypes';
  export * as SimpleSchemaTypes from '@datocms/cma-client/dist/types/generated/SimpleSchemaTypes';
}
