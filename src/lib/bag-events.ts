// Bag events for Workers Analytics Engine: aggregate counters only, no visitor identifier, no
// cookie, nothing stored in the browser. Shared by the browser (bag-events.client.ts) and the
// endpoint (/api/evento), which validates with these rules before writing a data point.
//
//   add      one copy added to the bag (slug, place)
//   start    the bag went from empty to one book (slug, place): one per bag
//   emptied  the visitor emptied the bag by hand (drawer)
//   order    an order was saved (written by /api/ordine on the server, never from the browser)
//
// Dead bags over a period: start − order − emptied (approximate: a bag started on one day may be
// ordered on another, and a cleared browser drops its bag without an event).

export const BAG_EVENT_URL = '/api/evento';
export const BAG_EVENT_MAX_BYTES = 512;

/** Events the browser may send; `order` is server-only. */
export const CLIENT_BAG_EVENTS = ['add', 'start', 'emptied'] as const;
export type ClientBagEvent = (typeof CLIENT_BAG_EVENTS)[number];
export type BagEventName = ClientBagEvent | 'order';

/** Where an add came from: a book card, the book page, the home hero. */
export const BAG_PLACES = ['card', 'book', 'hero'] as const;
export type BagPlace = (typeof BAG_PLACES)[number];

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/;

export type BagEventPayload = { e: ClientBagEvent; s?: string; p?: BagPlace };

/** Reads an untrusted body into a payload, or null. `add` and `start` need slug and place. */
export function parseBagEvent(body: unknown): BagEventPayload | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const { e, s, p } = body as Record<string, unknown>;
  if (!(CLIENT_BAG_EVENTS as readonly unknown[]).includes(e)) return null;
  const event = e as ClientBagEvent;
  if (event === 'emptied') return { e: event };
  if (typeof s !== 'string' || !SLUG_PATTERN.test(s)) return null;
  if (!(BAG_PLACES as readonly unknown[]).includes(p)) return null;
  return { e: event, s, p: p as BagPlace };
}

/**
 * The Analytics Engine data point: blob1 event, blob2 slug, blob3 place; double1 the count (1),
 * double2 the copies (orders only); index1 the event, so sampling keeps events apart.
 */
export function bagDataPoint(
  event: BagEventName,
  data: { slug?: string; place?: string; copies?: number } = {},
): { blobs: string[]; doubles: number[]; indexes: string[] } {
  return {
    blobs: [event, data.slug ?? '', data.place ?? ''],
    doubles: [1, data.copies ?? 0],
    indexes: [event],
  };
}
