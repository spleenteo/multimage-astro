/**
 * Parsing for DatoCMS webhook payloads (payload API v3, `entity_type: item`).
 *
 * Shape consumed (publish / unpublish events):
 *
 *   {
 *     "event_type": "publish",
 *     "entity": {
 *       "id": "123",
 *       "type": "item",
 *       "attributes": { "slug": "my-book", ... },
 *       "relationships": { "item_type": { "data": { "id": "42", "type": "item_type" } } }
 *     },
 *     "related_entities": [
 *       { "id": "42", "type": "item_type", "attributes": { "api_key": "book", ... } }
 *     ]
 *   }
 *
 * The item_type is sideloaded in `related_entities` and referenced from
 * `entity.relationships.item_type`. Pure (no env / network) so it is unit
 * testable on its own.
 */

export type ParsedWebhook = {
  eventType: string | null;
  apiKey: string | null;
  slug: string | null;
};

export function parseWebhookPayload(payload: unknown): ParsedWebhook {
  const body = (payload ?? {}) as Record<string, any>;
  const eventType = typeof body.event_type === 'string' ? body.event_type : null;

  const entity = body.entity as Record<string, any> | undefined;
  const slug =
    typeof entity?.attributes?.slug === 'string' ? (entity.attributes.slug as string) : null;

  const itemTypeId = entity?.relationships?.item_type?.data?.id;
  const related = Array.isArray(body.related_entities) ? body.related_entities : [];
  const itemType = related.find(
    (item: any) => item?.type === 'item_type' && item?.id === itemTypeId,
  );
  const apiKey =
    typeof itemType?.attributes?.api_key === 'string'
      ? (itemType.attributes.api_key as string)
      : null;

  return { eventType, apiKey, slug };
}
