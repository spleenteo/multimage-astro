// Browser side of the /libri faceted catalogue: reads the JSON island the server rendered, filters
// and sorts the server-rendered cards in place, reveals them 40 at a time, and mirrors the state in
// the URL (replaceState, so a filtered catalogue can be shared and survives a trip to a book page).
import {
  CATALOGUE_CHUNK,
  EMPTY_CATALOGUE_STATE,
  matchesCatalogue,
  normalizeForSearch,
  parseCatalogueState,
  serializeCatalogueState,
  type CatalogueEntry,
  type CatalogueState,
} from '~/lib/catalogue';

type Payload = {
  entries: CatalogueEntry[];
  newest: number;
  labels: {
    collane: Record<string, string>;
    autori: Record<string, string>;
    periodi: Record<string, string>;
  };
};

type ActiveFilter = { label: string; remove: (state: CatalogueState) => CatalogueState };

const plural = (count: number) => (count === 1 ? '1 libro' : `${count} libri`);
const DESKTOP = window.matchMedia('(min-width: 64rem)');

export function initCatalogue(root: HTMLElement) {
  const dataNode = root.querySelector('[data-catalogue-data]');
  const grid = root.querySelector<HTMLUListElement>('[data-grid]');
  const filters = root.querySelector<HTMLElement>('[data-filters]');
  if (!dataNode?.textContent || !grid || !filters) return;

  const { entries, newest, labels } = JSON.parse(dataNode.textContent) as Payload;
  const items = Array.from(grid.querySelectorAll<HTMLLIElement>(':scope > li[data-index]'));
  if (items.length !== entries.length) return;

  const q = <T extends Element>(selector: string) => root.querySelector<T>(selector);
  const qa = <T extends Element>(selector: string) => Array.from(root.querySelectorAll<T>(selector));

  const searchInput = q<HTMLInputElement>('[data-search]');
  const sortSelect = q<HTMLSelectElement>('[data-sort]');
  const authorInput = q<HTMLInputElement>('[data-author-input]');
  const authorStatus = q<HTMLElement>('[data-author-status]');
  const heading = q<HTMLElement>('[data-result-heading]');
  const live = q<HTMLElement>('[data-live]');
  const chips = q<HTMLUListElement>('[data-chips]');
  const activeWrap = q<HTMLElement>('[data-active]');
  const empty = q<HTMLElement>('[data-empty]');
  const undo = q<HTMLButtonElement>('[data-undo]');
  const siteSearch = q<HTMLAnchorElement>('[data-site-search]');
  const moreWrap = q<HTMLElement>('[data-more-wrap]');
  const moreStatus = q<HTMLElement>('[data-more-status]');
  const moreButton = q<HTMLButtonElement>('[data-more]');
  const openButton = q<HTMLButtonElement>('[data-filters-open]');
  const activeCount = q<HTMLElement>('[data-active-count]');
  const backdrop = q<HTMLElement>('[data-filters-backdrop]');

  // Author lookup by normalised display name, for the datalist field.
  const authorByName = new Map(
    Object.entries(labels.autori).map(([slug, name]) => [normalizeForSearch(name), slug]),
  );

  // Sort orders over the full list; the server already renders "novità" order.
  const collator = new Intl.Collator('it', { sensitivity: 'base', numeric: true });
  const orders: Record<CatalogueState['ordine'], number[]> = {
    novita: entries.map((_, index) => index),
    titolo: entries.map((_, index) => index).sort((a, b) => collator.compare(entries[a].n, entries[b].n)),
  };

  const sanitize = (input: CatalogueState): CatalogueState => ({
    ...input,
    collane: input.collane.filter((slug) => slug in labels.collane),
    autore: input.autore in labels.autori ? input.autore : '',
    periodo: input.periodo in labels.periodi ? input.periodo : '',
  });

  let state = sanitize(parseCatalogueState(window.location.search));
  let shown = CATALOGUE_CHUNK;
  let renderedOrder: CatalogueState['ordine'] = 'novita';
  let liveTimer: number | undefined;

  const activeFilters = (current: CatalogueState): ActiveFilter[] => {
    const list: ActiveFilter[] = [];
    current.collane.forEach((slug) =>
      list.push({
        label: labels.collane[slug] ?? slug,
        remove: (s) => ({ ...s, collane: s.collane.filter((value) => value !== slug) }),
      }),
    );
    if (current.formato) {
      list.push({ label: current.formato === 'ebook' ? 'Ebook' : 'Cartaceo', remove: (s) => ({ ...s, formato: '' }) });
    }
    if (current.autore) {
      list.push({ label: labels.autori[current.autore] ?? current.autore, remove: (s) => ({ ...s, autore: '' }) });
    }
    if (current.periodo) {
      list.push({ label: labels.periodi[current.periodo] ?? current.periodo, remove: (s) => ({ ...s, periodo: '' }) });
    }
    if (current.tradotti) list.push({ label: 'Tradotti', remove: (s) => ({ ...s, tradotti: false }) });
    if (current.evidenza) list.push({ label: 'In evidenza', remove: (s) => ({ ...s, evidenza: false }) });
    if (current.archivio) list.push({ label: 'Con i fuori catalogo', remove: (s) => ({ ...s, archivio: false }) });
    if (current.q) list.push({ label: `«${current.q}»`, remove: (s) => ({ ...s, q: '' }) });
    return list;
  };

  const syncControls = () => {
    qa<HTMLInputElement>('input[data-facet]').forEach((input) => {
      const facet = input.dataset.facet;
      if (facet === 'collane') input.checked = state.collane.includes(input.value);
      else if (facet === 'formato') input.checked = state.formato === input.value;
      else if (facet === 'periodo') input.checked = state.periodo === input.value;
      else if (facet === 'tradotti') input.checked = state.tradotti;
      else if (facet === 'evidenza') input.checked = state.evidenza;
      else if (facet === 'archivio') input.checked = state.archivio;
    });
    if (searchInput && searchInput.value.trim() !== state.q) searchInput.value = state.q;
    if (sortSelect) sortSelect.value = state.ordine;
    if (authorStatus) {
      authorStatus.replaceChildren();
      if (state.autore) {
        authorStatus.append(`Solo libri di ${labels.autori[state.autore]}.`);
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.textContent = 'Togli';
        clear.addEventListener('click', () => update({ ...state, autore: '' }));
        authorStatus.append(clear);
      }
    }
  };

  const updateCounts = () => {
    const count = (facet: Parameters<typeof matchesCatalogue>[3], test: (entry: CatalogueEntry) => boolean) =>
      entries.reduce((total, entry) => (test(entry) && matchesCatalogue(entry, state, newest, facet) ? total + 1 : total), 0);

    qa<HTMLElement>('[data-count]').forEach((node) => {
      const facet = node.dataset.count;
      const value = node.dataset.value ?? '';
      let optionCount = 0;
      if (facet === 'collane') optionCount = count('collane', (entry) => entry.c === value);
      else if (facet === 'formato')
        optionCount = count('formato', (entry) => (value === '' ? true : value === 'ebook' ? entry.e === 1 : entry.e === 0));
      else if (facet === 'periodo')
        optionCount = count('periodo', (entry) =>
          value === '' ? true : matchesCatalogue(entry, { ...EMPTY_CATALOGUE_STATE, archivio: true, periodo: value }, newest),
        );
      else if (facet === 'tradotti') optionCount = count('tradotti', (entry) => entry.t === 1);
      else if (facet === 'evidenza') optionCount = count('evidenza', (entry) => entry.h === 1);
      else if (facet === 'archivio') optionCount = count('archivio', (entry) => entry.x === 1);
      node.textContent = String(optionCount);
      node.closest('[data-option]')?.toggleAttribute('data-zero', optionCount === 0);
    });
  };

  const render = (announce: boolean) => {
    if (renderedOrder !== state.ordine) {
      const fragment = document.createDocumentFragment();
      orders[state.ordine].forEach((index) => fragment.append(items[index]));
      grid.append(fragment);
      renderedOrder = state.ordine;
    }

    let total = 0;
    orders[state.ordine].forEach((index) => {
      const item = items[index];
      const match = matchesCatalogue(entries[index], state, newest);
      item.hidden = !(match && total < shown);
      if (match) total += 1;
      item.removeAttribute('data-initial-overflow');
    });

    const visible = Math.min(total, shown);
    if (heading) heading.textContent = plural(total);
    qa<HTMLElement>('[data-result-count]').forEach((node) => (node.textContent = plural(total)));

    const active = activeFilters(state);
    if (chips && activeWrap) {
      chips.replaceChildren(
        ...active.map((filter) => {
          const li = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.setAttribute('aria-label', `Togli il filtro ${filter.label}`);
          button.innerHTML =
            '<span></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
          button.querySelector('span')!.textContent = filter.label;
          button.addEventListener('click', () => update(filter.remove(state)));
          li.append(button);
          return li;
        }),
      );
      activeWrap.hidden = active.length === 0;
    }

    const facetCount = active.length - (state.q ? 1 : 0);
    if (activeCount) activeCount.textContent = facetCount > 0 ? ` (${facetCount})` : '';

    if (empty) empty.hidden = total > 0;
    if (undo) {
      const last = active.at(-1);
      undo.hidden = !last || active.length < 2;
      if (last) undo.textContent = `Togli ${last.label}`;
    }
    if (siteSearch) siteSearch.href = state.q ? `/cerca?q=${encodeURIComponent(state.q)}` : '/cerca';

    if (moreWrap && moreStatus && moreButton) {
      moreWrap.hidden = total <= visible;
      moreStatus.textContent = `${visible} di ${total}`;
      moreButton.textContent = `Mostra altri ${Math.min(CATALOGUE_CHUNK, total - visible)}`;
    }

    updateCounts();

    const query = serializeCatalogueState(state);
    if (query !== window.location.search) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${query}`);
    }

    if (announce && live) {
      window.clearTimeout(liveTimer);
      liveTimer = window.setTimeout(() => {
        live.textContent =
          total === 0 ? 'Nessun libro con questi filtri' : total === 1 ? '1 libro trovato' : `${total} libri trovati`;
      }, 500);
    }
  };

  const update = (next: CatalogueState) => {
    state = sanitize(next);
    shown = CATALOGUE_CHUNK;
    syncControls();
    render(true);
  };

  // Facet controls.
  filters.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const facet = input.dataset.facet;
    if (!facet) return;
    if (facet === 'collane') {
      const collane = input.checked
        ? [...state.collane, input.value]
        : state.collane.filter((slug) => slug !== input.value);
      update({ ...state, collane });
    } else if (facet === 'formato') update({ ...state, formato: input.value as CatalogueState['formato'] });
    else if (facet === 'periodo') update({ ...state, periodo: input.value });
    else if (facet === 'tradotti') update({ ...state, tradotti: input.checked });
    else if (facet === 'evidenza') update({ ...state, evidenza: input.checked });
    else if (facet === 'archivio') update({ ...state, archivio: input.checked });
  });

  // Author field: the datalist suggests names; a full match becomes the filter.
  const applyAuthor = () => {
    if (!authorInput) return;
    const typed = normalizeForSearch(authorInput.value);
    if (!typed) return;
    const slug = authorByName.get(typed);
    if (slug) {
      authorInput.value = '';
      update({ ...state, autore: slug });
    } else if (authorStatus) {
      authorStatus.textContent = 'Nessuna autrice o autore con questo nome nel catalogo. Scegli un nome dai suggerimenti.';
    }
  };
  authorInput?.addEventListener('change', applyAuthor);
  authorInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyAuthor();
    }
  });

  let searchTimer: number | undefined;
  searchInput?.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => update({ ...state, q: searchInput.value.trim() }), 200);
  });

  sortSelect?.addEventListener('change', () => {
    update({ ...state, ordine: sortSelect.value === 'titolo' ? 'titolo' : 'novita' });
  });

  qa<HTMLButtonElement>('[data-reset]').forEach((button) =>
    button.addEventListener('click', () => update({ ...EMPTY_CATALOGUE_STATE, ordine: state.ordine })),
  );

  undo?.addEventListener('click', () => {
    const last = activeFilters(state).at(-1);
    if (last) update(last.remove(state));
  });

  // "Mostra altri": reveal the next chunk and move focus to its first card.
  moreButton?.addEventListener('click', () => {
    const firstNew = shown;
    shown += CATALOGUE_CHUNK;
    render(false);
    const visibleItems = items.filter((item) => !item.hidden);
    const ordered = orders[state.ordine].map((index) => items[index]).filter((item) => visibleItems.includes(item));
    ordered[firstNew]?.querySelector<HTMLAnchorElement>('a')?.focus();
  });

  // Mobile sheet.
  const setSheet = (open: boolean) => {
    if (DESKTOP.matches && open) return;
    filters.toggleAttribute('data-open', open);
    if (backdrop) backdrop.hidden = !open;
    openButton?.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      filters.setAttribute('role', 'dialog');
      filters.setAttribute('aria-modal', 'true');
      filters.querySelector<HTMLElement>('input, button')?.focus();
    } else {
      filters.removeAttribute('role');
      filters.removeAttribute('aria-modal');
    }
  };
  openButton?.addEventListener('click', () => setSheet(true));
  qa<HTMLButtonElement>('[data-filters-close]').forEach((button) =>
    button.addEventListener('click', () => {
      setSheet(false);
      openButton?.focus();
    }),
  );
  backdrop?.addEventListener('click', () => {
    setSheet(false);
    openButton?.focus();
  });
  filters.addEventListener('keydown', (event) => {
    if (!filters.hasAttribute('data-open')) return;
    if (event.key === 'Escape') {
      setSheet(false);
      openButton?.focus();
      return;
    }
    // Keep Tab inside the open sheet.
    if (event.key === 'Tab') {
      const focusable = Array.from(
        filters.querySelectorAll<HTMLElement>('input, select, button, a[href]'),
      ).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  // "Tutte le collane": opens on its own when the URL selects a collection beyond the first rows.
  const collectionsToggle = q<HTMLButtonElement>('[data-collections-toggle]');
  const collectionsList = q<HTMLElement>('#catalogo-collane');
  const setCollectionsOpen = (open: boolean) => {
    if (!collectionsToggle || !collectionsList) return;
    collectionsList.toggleAttribute('data-expanded', open);
    collectionsToggle.setAttribute('aria-expanded', String(open));
    collectionsToggle.textContent =
      (open ? collectionsToggle.dataset.labelOpen : collectionsToggle.dataset.labelClosed) ?? '';
  };
  collectionsToggle?.addEventListener('click', () =>
    setCollectionsOpen(collectionsToggle.getAttribute('aria-expanded') !== 'true'),
  );
  if (
    collectionsList &&
    state.collane.some((slug) =>
      collectionsList.querySelector(`[data-extra] input[value="${CSS.escape(slug)}"]`),
    )
  ) {
    setCollectionsOpen(true);
  }
  DESKTOP.addEventListener('change', () => setSheet(false));

  q<HTMLElement>('[data-controls]')?.removeAttribute('hidden');
  syncControls();
  render(false);
}
