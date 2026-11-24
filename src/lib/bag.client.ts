// Client-side bag store: localStorage-backed, with an in-memory fallback.
// Browser only; `window` is touched inside functions, never at import time.
import { BAG_STORAGE_KEY, clampQty, QTY_MAX, toBagItem, type BagBook, type BagItem } from './order';
import type { BagPlace } from './bag-events';
import { trackBag } from './bag-events.client';

export const BAG_CHANGE_EVENT = 'bag:change';
export const BAG_OPEN_EVENT = 'bag:open';

// Holds the bag when localStorage throws (private mode, blocked storage).
let memoryItems: BagItem[] | null = null;
let storageListenerInstalled = false;

function writeItems(items: BagItem[]): void {
  try {
    window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify({ v: 1, items }));
    memoryItems = null;
  } catch {
    memoryItems = items;
  }
}

/** Reads the bag; a corrupt stored value is discarded and rewritten as an empty bag. */
export function readBag(): BagItem[] {
  if (memoryItems) return [...memoryItems];
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(BAG_STORAGE_KEY);
  } catch {
    return [];
  }
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as { v?: unknown }).v === 1 &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      const rawItems = (parsed as { items: unknown[] }).items;
      const items: BagItem[] = [];
      for (const entry of rawItems) {
        const item = toBagItem(entry);
        if (item && !items.some((i) => i.id === item.id)) items.push(item);
      }
      if (items.length !== rawItems.length) writeItems(items);
      return items;
    }
  } catch {
    // fall through to the reset below
  }
  writeItems([]);
  return [];
}

function commit(items: BagItem[]): void {
  writeItems(items);
  window.dispatchEvent(new CustomEvent(BAG_CHANGE_EVENT, { detail: { items } }));
}

/** Adds one copy; `place` names the button for the bag counters (Analytics Engine, no visitor id). */
export function addBook(book: BagBook, place: BagPlace): void {
  const items = readBag();
  const wasEmpty = items.length === 0;
  const existing = items.find((i) => i.id === book.id);
  if (existing) existing.qty = Math.min(QTY_MAX, existing.qty + 1);
  else items.push({ ...book, qty: 1 });
  commit(items);
  if (wasEmpty) trackBag({ e: 'start', s: book.slug, p: place });
  trackBag({ e: 'add', s: book.slug, p: place });
}

export function setQty(id: string, n: number): void {
  const items = readBag();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.qty = clampQty(n);
  commit(items);
}

export function removeItem(id: string): void {
  commit(readBag().filter((i) => i.id !== id));
}

/** Empties the bag; `byVisitor` counts it as an emptied bag (not after an order is sent). */
export function emptyBag(options: { byVisitor?: boolean } = {}): void {
  const hadItems = readBag().length > 0;
  commit([]);
  if (options.byVisitor && hadItems) trackBag({ e: 'emptied' });
}

/** Subscribes to bag changes (this tab and, through `storage`, other tabs). Returns an unsubscribe. */
export function onBagChange(fn: (items: BagItem[]) => void): () => void {
  if (!storageListenerInstalled) {
    storageListenerInstalled = true;
    window.addEventListener('storage', (e) => {
      const key = (e as StorageEvent).key;
      if (key !== null && key !== BAG_STORAGE_KEY) return;
      window.dispatchEvent(new CustomEvent(BAG_CHANGE_EVENT, { detail: { items: readBag() } }));
    });
  }
  const handler = (e: Event) => fn((e as CustomEvent<{ items: BagItem[] }>).detail.items);
  window.addEventListener(BAG_CHANGE_EVENT, handler);
  return () => window.removeEventListener(BAG_CHANGE_EVENT, handler);
}

/** Asks the drawer to open; `opener` gets focus back when it closes. */
export function openBag(opener: HTMLElement | null): void {
  window.dispatchEvent(new CustomEvent(BAG_OPEN_EVENT, { detail: { opener } }));
}
