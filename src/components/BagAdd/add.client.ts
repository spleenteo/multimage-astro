// Browser side of BagAdd: swaps the mailto fallback for the bag button once the book data
// validates, adds the book on click and keeps the "Nella borsa" line current.
// Structure it relies on (see index.astro): [data-bag-add][data-bag-place] > [data-bag-fallback],
// [data-bag-enhanced] > button, [data-bag-status].
import { addBook, onBagChange, openBag, readBag } from '~/lib/bag.client';
import { copiesLabel, toBagItem, type BagBook, type BagItem } from '~/lib/order';

function parseBook(raw: string | undefined): BagBook | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const item = toBagItem({ ...parsed, qty: 1 });
  if (!item) return null;
  const { qty: _qty, ...book } = item;
  return book;
}

function enhance(root: HTMLElement): void {
  if (root.dataset.bagAddReady === 'true') return;
  const book = parseBook(root.dataset.bagItem);
  const fallback = root.querySelector<HTMLElement>('[data-bag-fallback]');
  const enhanced = root.querySelector<HTMLElement>('[data-bag-enhanced]');
  const button = enhanced?.querySelector<HTMLButtonElement>('button');
  const status = root.querySelector<HTMLElement>('[data-bag-status]');
  if (!book || !fallback || !enhanced || !button) return;
  root.dataset.bagAddReady = 'true';

  const showStatus = (items: BagItem[]) => {
    if (!status) return;
    const line = items.find((i) => i.id === book.id);
    status.textContent = line ? `Nella borsa · ${copiesLabel(line.qty)}` : '';
  };

  fallback.hidden = true;
  enhanced.hidden = false;
  button.addEventListener('click', () => {
    addBook(book, root.dataset.bagPlace === 'hero' ? 'hero' : 'book');
    openBag(button);
  });
  showStatus(readBag());
  onBagChange(showStatus);
}

export function initBagAdd(): void {
  document.querySelectorAll<HTMLElement>('[data-bag-add]').forEach(enhance);
}
