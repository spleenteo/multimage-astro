// Browser side of the BookCard bag button. Structure (see index.astro):
//   [data-card-bag][data-bag-item] > button[data-card-bag-button] + [data-card-bag-tip]
// The control ships hidden (no JavaScript, no bag): `showCardBag` reveals it once the book data
// validates. One delegated click handler serves every card, including the ones the catalogue
// builds in the browser (fill.client.ts calls `showCardBag` on them). A click adds one copy; the
// header count and the drawer update through the bag's change event, the tooltip says what
// happened and a polite live region announces it.
import { addBook, onBagChange, readBag } from '~/lib/bag.client';
import { copiesLabel, toBagItem, type BagBook, type BagItem } from '~/lib/order';

const TIP_ADD = 'Metti in borsa';
const TIP_ADDED = 'Aggiunto alla borsa';

function parseBook(raw: string | undefined): BagBook | null {
  if (!raw) return null;
  try {
    const item = toBagItem({ ...JSON.parse(raw), qty: 1 });
    if (!item) return null;
    const { qty: _qty, ...book } = item;
    return book;
  } catch {
    return null;
  }
}

let announcer: HTMLElement | null = null;
function announce(text: string): void {
  if (!announcer) {
    announcer = document.createElement('p');
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    document.body.append(announcer);
  }
  announcer.textContent = text;
}

/** The tooltip and the name of one card's control, from the copies of its book in the bag. */
function paint(root: HTMLElement, items: BagItem[]): void {
  const book = parseBook(root.dataset.bagItem);
  const button = root.querySelector<HTMLButtonElement>('[data-card-bag-button]');
  const tip = root.querySelector<HTMLElement>('[data-card-bag-tip]');
  if (!book || !button || !tip) return;
  const line = items.find((i) => i.id === book.id);
  root.toggleAttribute('data-in-bag', Boolean(line));
  if (root.dataset.flash !== 'true') {
    tip.textContent = line ? `Nella borsa · ${copiesLabel(line.qty)}` : TIP_ADD;
  }
  button.setAttribute(
    'aria-label',
    line
      ? `Metti in borsa un'altra copia: ${book.title} (nella borsa: ${copiesLabel(line.qty)})`
      : `Metti in borsa: ${book.title}`,
  );
}

/** Reveals a card's bag control when its book data validates. */
export function showCardBag(root: HTMLElement): void {
  if (!parseBook(root.dataset.bagItem)) return;
  root.hidden = false;
  paint(root, readBag());
}

function onClick(e: Event): void {
  const button = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(
    '[data-card-bag-button]',
  );
  const root = button?.closest<HTMLElement>('[data-card-bag]');
  const book = parseBook(root?.dataset.bagItem);
  if (!button || !root || !book) return;
  e.preventDefault();
  addBook(book, 'card');
  const line = readBag().find((i) => i.id === book.id);
  const tip = root.querySelector<HTMLElement>('[data-card-bag-tip]');
  root.dataset.flash = 'true';
  if (tip) tip.textContent = TIP_ADDED;
  announce(`${book.title} aggiunto alla borsa${line ? `: ${copiesLabel(line.qty)}` : ''}.`);
  window.setTimeout(() => {
    delete root.dataset.flash;
    paint(root, readBag());
  }, 1800);
}

export function initCardBags(): void {
  if (document.documentElement.dataset.cardBagsReady === 'true') return;
  document.documentElement.dataset.cardBagsReady = 'true';
  document.querySelectorAll<HTMLElement>('[data-card-bag]').forEach(showCardBag);
  document.addEventListener('click', onClick);
  onBagChange((items) => {
    document
      .querySelectorAll<HTMLElement>('[data-card-bag]:not([hidden])')
      .forEach((root) => paint(root, items));
  });
}
