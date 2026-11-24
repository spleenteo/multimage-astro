// Bag drawer: opens the native <dialog>, renders the bag and wires the line controls.
// The DOM is built from the template with textContent and setAttribute only.
import {
  BAG_OPEN_EVENT,
  emptyBag,
  onBagChange,
  readBag,
  removeItem,
  setQty,
} from '~/lib/bag.client';
import {
  QTY_MAX,
  QTY_MIN,
  bagTotals,
  bagSizeLabel,
  clampQty,
  copiesLabel,
  formatCents,
  type BagItem,
} from '~/lib/order';

export function initBagDrawer(): void {
  const dialog = document.querySelector<HTMLDialogElement>('dialog[data-bag-drawer]');
  if (!dialog || dialog.dataset.bagDrawerReady === 'true') return;
  dialog.dataset.bagDrawerReady = 'true';

  const $ = <T extends HTMLElement>(sel: string) => dialog.querySelector<T>(sel);
  const heading = $<HTMLElement>('#bag-drawer-title');
  const size = $<HTMLElement>('[data-bag-size]');
  const filled = $<HTMLElement>('[data-bag-filled]');
  const emptyView = $<HTMLElement>('[data-bag-empty]');
  const list = $<HTMLElement>('[data-bag-list]');
  const copies = $<HTMLElement>('[data-bag-copies]');
  const total = $<HTMLElement>('[data-bag-total]');
  const confirmBox = $<HTMLElement>('[data-bag-confirm]');
  const emptyAsk = $<HTMLButtonElement>('[data-bag-empty-ask]');
  const template = $<HTMLTemplateElement>('template[data-bag-line]');
  if (
    !heading ||
    !size ||
    !filled ||
    !emptyView ||
    !list ||
    !copies ||
    !total ||
    !confirmBox ||
    !emptyAsk ||
    !template
  )
    return;

  const announce = $<HTMLElement>('[data-bag-announce]');
  const say = (text: string) => {
    if (announce) announce.textContent = text;
  };

  let opener: HTMLElement | null = null;

  const open = (from: HTMLElement | null) => {
    opener = from ?? (document.activeElement as HTMLElement | null);
    if (!dialog.open) dialog.showModal();
    heading.focus();
  };

  function buildLine(item: BagItem): HTMLElement {
    const li = (template!.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
    li.dataset.itemId = item.id;
    const cover = li.querySelector<HTMLElement>('[data-line-cover]');
    const img = li.querySelector<HTMLImageElement>('[data-line-img]');
    if (cover && item.tint) cover.style.backgroundColor = item.tint;
    if (img) {
      if (item.cover) img.src = item.cover;
      else img.remove();
    }
    const title = li.querySelector<HTMLAnchorElement>('[data-line-title]');
    if (title) {
      title.textContent = item.title;
      title.setAttribute('href', `/libri/${encodeURIComponent(item.slug)}`);
    }
    const authors = li.querySelector<HTMLElement>('[data-line-authors]');
    if (authors) {
      authors.textContent = item.authors;
      authors.hidden = item.authors === '';
    }
    li.querySelector('[data-line-stepper]')?.setAttribute('aria-label', `Copie di ${item.title}`);
    const qty = li.querySelector('[data-line-qty]');
    if (qty) qty.textContent = String(item.qty);
    const amount = li.querySelector('[data-line-amount]');
    if (amount) amount.textContent = formatCents(item.priceCents * item.qty);
    const minus = li.querySelector<HTMLButtonElement>('[data-line-control="minus"]');
    const plus = li.querySelector<HTMLButtonElement>('[data-line-control="plus"]');
    if (minus) minus.disabled = item.qty <= QTY_MIN;
    if (plus) plus.disabled = item.qty >= QTY_MAX;
    return li;
  }

  function render(items: BagItem[]): void {
    // Remember a focused line control so a re-render does not drop focus.
    const active = document.activeElement as HTMLElement | null;
    const focusedControl =
      active && list!.contains(active) ? active.closest<HTMLElement>('[data-line-control]') : null;
    const focusId = focusedControl?.closest<HTMLElement>('[data-item-id]')?.dataset.itemId ?? null;
    const focusRole = focusedControl?.dataset.lineControl ?? null;

    const totals = bagTotals(items);
    size!.textContent = bagSizeLabel(totals.lines, totals.copies);
    copies!.textContent = String(totals.copies);
    total!.textContent = formatCents(totals.cents);

    const frag = document.createDocumentFragment();
    for (const item of items) frag.append(buildLine(item));
    list!.replaceChildren(frag);

    filled!.hidden = items.length === 0;
    emptyView!.hidden = items.length > 0;
    if (items.length === 0) confirmBox!.hidden = true;

    if (focusId && focusRole) {
      const line = list!.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(focusId)}"]`);
      if (!line) {
        heading!.focus();
      } else {
        const same = line.querySelector<HTMLButtonElement>(`[data-line-control="${focusRole}"]`);
        if (same && !same.disabled) {
          same.focus();
        } else if (focusRole === 'minus' || focusRole === 'plus') {
          const other = line.querySelector<HTMLButtonElement>(
            `[data-line-control="${focusRole === 'minus' ? 'plus' : 'minus'}"]`,
          );
          other?.focus();
        } else {
          heading!.focus();
        }
      }
    }
    updateHeader(totals.copies);
  }

  function updateHeader(copyCount: number): void {
    document.querySelectorAll<HTMLElement>('[data-bag-open]').forEach((btn) => {
      btn.hidden = false;
      btn.setAttribute('aria-label', copyCount > 0 ? `Borsa, ${copiesLabel(copyCount)}` : 'Borsa');
      const badge = btn.querySelector<HTMLElement>('[data-bag-count]');
      if (badge) {
        badge.textContent = copyCount > 0 ? String(copyCount) : '';
        badge.hidden = copyCount === 0;
      }
    });
  }

  // Line controls (delegated: lines are rebuilt on every change).
  list.addEventListener('click', (e) => {
    const control = (e.target as HTMLElement).closest<HTMLElement>('[data-line-control]');
    const id = control?.closest<HTMLElement>('[data-item-id]')?.dataset.itemId;
    if (!control || !id) return;
    const item = readBag().find((i) => i.id === id);
    if (!item) return;
    const role = control.dataset.lineControl;
    if (role === 'minus' || role === 'plus') {
      const qty = clampQty(item.qty + (role === 'minus' ? -1 : 1));
      setQty(id, qty);
      say(`${item.title}: ${copiesLabel(qty)}`);
    } else if (role === 'remove') {
      removeItem(id);
      say(`${item.title} tolto dalla borsa`);
    }
  });

  emptyAsk.addEventListener('click', () => {
    confirmBox.hidden = false;
    confirmBox.querySelector<HTMLElement>('[data-bag-empty-yes] button')?.focus();
  });
  confirmBox.querySelector('[data-bag-empty-yes]')?.addEventListener('click', () => {
    emptyBag();
    say('Borsa svuotata');
    confirmBox.hidden = true;
    heading.focus();
  });
  confirmBox.querySelector('[data-bag-empty-no]')?.addEventListener('click', () => {
    confirmBox.hidden = true;
    emptyAsk.focus();
  });

  // Open, close.
  window.addEventListener(BAG_OPEN_EVENT, (e) => {
    open((e as CustomEvent<{ opener?: HTMLElement | null }>).detail?.opener ?? null);
  });
  document.addEventListener('click', (e) => {
    const trigger = (e.target as HTMLElement).closest<HTMLElement>('[data-bag-open]');
    if (trigger) open(trigger);
  });
  dialog.querySelector('[data-bag-close]')?.addEventListener('click', () => dialog.close());
  // On /borsa the primary is "Torna al modulo": the form is right behind the drawer.
  dialog.querySelector('[data-bag-back] button')?.addEventListener('click', () => dialog.close());
  // The panel fills the dialog, so only a click on the backdrop lands on the dialog itself.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    confirmBox.hidden = true;
    const target = opener;
    opener = null;
    if (target && target.isConnected) target.focus();
  });

  onBagChange(render);
  render(readBag());
}

initBagDrawer();
