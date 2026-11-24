// Sends a bag event with sendBeacon (fire and forget, survives navigation). Never throws: a lost
// event only makes a counter one lower.
import { BAG_EVENT_URL, type BagEventPayload } from './bag-events';

export function trackBag(payload: BagEventPayload): void {
  try {
    const body = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon?.(BAG_EVENT_URL, body)) return;
    void fetch(BAG_EVENT_URL, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    // analytics must never break the bag
  }
}
