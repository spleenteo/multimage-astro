// /cerca: DatoCMS Site Search from the browser. Results are flat rows: a clean title (the only
// link), one slate line saying what the result is, and the highlighted excerpt. Books also show
// their cover, authors, year, format and price, read from /search-books.json; print and ebook
// editions of the same book share one row.

type SearchResultAttributes = {
  title: string;
  body_excerpt?: string | null;
  url: string;
  highlight?: {
    title?: string[] | null;
    body?: string[] | null;
  } | null;
};

type SearchResult = {
  id: string;
  attributes: SearchResultAttributes;
};

type SearchResponse = {
  data?: SearchResult[];
  meta?: {
    total_count?: number;
  };
};

type SearchConfig = {
  endpoint: string;
  token: string;
  minLength: number;
  limit: number;
  fuzzy: boolean;
};

/** See src/pages/search-books.json.ts. */
type BookEntry = {
  t: string;
  a?: string;
  y?: string;
  f?: string;
  p?: string;
  x?: 1;
  c?: string;
  r?: number;
  k?: string;
};

type Kind = 'book' | 'author' | 'article' | 'collection' | 'catalogue' | 'page';
type FilterKey = 'books' | 'authors' | 'magazine' | 'other';

type CleanupFn = () => void;

const KIND_LABEL: Record<Kind, string> = {
  book: 'Libro',
  author: 'Autrice o autore',
  article: 'Dal magazine',
  collection: 'Collana',
  catalogue: 'Catalogo',
  page: 'Pagina',
};

const FILTER_LABEL: Record<FilterKey, string> = {
  books: 'libri',
  authors: 'autrici e autori',
  magazine: 'magazine',
  other: 'collane e pagine',
};

const pathFromUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
};

const kindOf = (url: string): Kind => {
  const path = pathFromUrl(url);
  if (/^\/libri(\/(pagina|archivio)(\/|$)|\/?$)/.test(path)) return 'catalogue';
  if (/^\/libri\/[^/]+/.test(path)) return 'book';
  if (/^\/autori\/[^/]+/.test(path)) return 'author';
  if (/^\/magazine\/[^/]+/.test(path)) return 'article';
  if (/^\/collane\/[^/]+/.test(path)) return 'collection';
  return 'page';
};

const filterOf = (kind: Kind): FilterKey =>
  kind === 'book'
    ? 'books'
    : kind === 'author'
      ? 'authors'
      : kind === 'article'
        ? 'magazine'
        : 'other';

const getRootConfig = (root: HTMLElement): SearchConfig => {
  const { endpoint, token, minLength = '3', limit = '25', fuzzy = 'true' } = root.dataset;

  if (!endpoint) {
    throw new Error(
      '[search] data-endpoint mancante su [data-search-root]. Controlla PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN.',
    );
  }
  if (!token) {
    throw new Error(
      '[search] data-token mancante su [data-search-root]. Controlla PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN.',
    );
  }

  return {
    endpoint,
    token,
    minLength: Number.parseInt(minLength, 10) || 3,
    limit: Number.parseInt(limit, 10) || 25,
    fuzzy: fuzzy !== 'false',
  };
};

const isHiddenUrl = (url: string): boolean => /\/libri\/schede\//.test(pathFromUrl(url));

/** Page titles carry the SEO suffix ("Ciecam | Multimage Editrice"): the reader only needs the name. */
const cleanTitle = (value: string): string =>
  value.replace(/\s*[|–—-]\s*Multimage(\s+Editrice)?\s*$/i, '').trim();

const appendHighlightedText = (target: HTMLElement, source: string | null | undefined) => {
  const text = source ?? '';
  const regex = /\[h\]([\s\S]*?)\[\/h\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const [full, value] = match;
    const preceding = text.slice(lastIndex, match.index);
    if (preceding) {
      target.append(document.createTextNode(preceding));
    }
    const mark = document.createElement('mark');
    mark.className = 'highlight';
    mark.textContent = value;
    target.append(mark);
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    target.append(document.createTextNode(text.slice(lastIndex)));
  }
};

const stripHighlightMarkers = (value: string): string => value.replace(/\[\/?h\]/g, '');

const normalizeText = (value: string): string =>
  stripHighlightMarkers(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const entryContainsPhrase = (entry: SearchResult, phrase: string): boolean => {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) {
    return false;
  }

  const sources: Array<string | null | undefined> = [
    entry.attributes.title,
    entry.attributes.body_excerpt,
    ...(entry.attributes.highlight?.title ?? []),
    ...(entry.attributes.highlight?.body ?? []),
  ];

  return sources.some(
    (source) => Boolean(source) && normalizeText(source!).includes(normalizedPhrase),
  );
};

const bookSlugOf = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const match = pathFromUrl(url).match(/^\/libri\/([^/?#]+)/);
  return match?.[1] ?? null;
};

// Book details, loaded once, after the first search that finds a book.
let booksIndex: Record<string, BookEntry> | null = null;
let booksIndexPromise: Promise<Record<string, BookEntry> | null> | null = null;

const loadBooksIndex = (): Promise<Record<string, BookEntry> | null> => {
  if (booksIndex) return Promise.resolve(booksIndex);
  booksIndexPromise ??= fetch('/search-books.json')
    .then((response) =>
      response.ok ? (response.json() as Promise<Record<string, BookEntry>>) : null,
    )
    .catch(() => null)
    .then((payload) => {
      booksIndex = payload;
      return payload;
    });
  return booksIndexPromise;
};

const bookOf = (entry: SearchResult): BookEntry | null => {
  const slug = bookSlugOf(entry.attributes.url);
  return slug ? (booksIndex?.[slug] ?? null) : null;
};

const isArchivedBook = (entry: SearchResult): boolean => bookOf(entry)?.x === 1;

/** One row per book: a print and an ebook edition (same title and authors) share a row. */
type Row = { entry: SearchResult; kind: Kind; editions: SearchResult[] };

const buildRows = (entries: SearchResult[]): Row[] => {
  const rows: Row[] = [];
  const byBook = new Map<string, Row>();
  for (const entry of entries) {
    const kind = kindOf(entry.attributes.url ?? '');
    if (kind === 'book') {
      const book = bookOf(entry);
      const key = normalizeText(
        `${book?.t ?? cleanTitle(entry.attributes.title ?? '')}|${book?.a ?? ''}`,
      );
      const existing = byBook.get(key);
      if (existing) {
        existing.editions.push(entry);
        continue;
      }
      const row: Row = { entry, kind, editions: [] };
      byBook.set(key, row);
      rows.push(row);
      continue;
    }
    rows.push({ entry, kind, editions: [] });
  }
  return rows;
};

const coverSrc = (url: string, height: number) => `${url}?h=${height}&fit=max&auto=format`;

const createLink = (href: string, className?: string): HTMLAnchorElement => {
  const link = document.createElement('a');
  link.href = href;
  if (/^https?:\/\//.test(href)) link.rel = 'noopener';
  if (className) link.className = className;
  return link;
};

const createResultItem = (row: Row): HTMLLIElement => {
  const { entry, kind, editions } = row;
  const { attributes } = entry;
  const href = pathFromUrl(attributes.url ?? '#');
  const book = kind === 'book' ? bookOf(entry) : null;

  const item = document.createElement('li');
  item.className = 'search-result';
  item.dataset.kind = kind;

  if (book?.c) {
    const field = createLink(href, 'search-result__cover');
    field.tabIndex = -1;
    field.setAttribute('aria-hidden', 'true');
    if (book.k) field.style.background = book.k;
    const img = document.createElement('img');
    img.src = coverSrc(book.c, 96);
    img.srcset = `${coverSrc(book.c, 192)} 2x`;
    img.alt = '';
    img.width = Math.round(96 * (book.r ?? 0.68));
    img.height = 96;
    img.loading = 'lazy';
    img.decoding = 'async';
    field.append(img);
    item.append(field);
  }

  const body = document.createElement('div');
  body.className = 'search-result__body';

  const title = document.createElement('h3');
  title.className = 'search-result__title';
  const link = createLink(href);
  appendHighlightedText(
    link,
    cleanTitle(attributes.highlight?.title?.[0] ?? attributes.title ?? ''),
  );
  title.append(link);
  body.append(title);

  // One slate line: what the result is, and for a book who wrote it and how to have it.
  const meta = document.createElement('p');
  meta.className = 'search-result__meta';
  const parts: Array<string | HTMLElement> = [];
  if (book) {
    if (book.a) parts.push(`di ${book.a}`);
    if (book.y) parts.push(book.y);
    if (book.f) parts.push(book.f);
    if (book.p) {
      const price = document.createElement('span');
      price.className = 'search-result__price';
      price.textContent = book.p;
      parts.push(price);
    }
    for (const edition of editions) {
      const other = bookOf(edition);
      const otherLink = createLink(
        pathFromUrl(edition.attributes.url ?? '#'),
        'search-result__edition',
      );
      otherLink.textContent = `Anche ${other?.f ? `in ${other.f.toLowerCase()}` : 'in cartaceo'}${other?.p ? ` · ${other.p}` : ''}`;
      parts.push(otherLink);
    }
  } else {
    parts.push(KIND_LABEL[kind]);
  }
  parts.forEach((part, index) => {
    if (index > 0) {
      const dot = document.createElement('span');
      dot.className = 'search-result__dot';
      dot.setAttribute('aria-hidden', 'true');
      dot.textContent = '·';
      meta.append(dot);
    }
    meta.append(part);
  });
  body.append(meta);

  const excerptSource = attributes.highlight?.body?.[0] ?? attributes.body_excerpt ?? '';
  if (excerptSource) {
    const excerpt = document.createElement('p');
    excerpt.className = 'search-result__excerpt';
    appendHighlightedText(excerpt, excerptSource);
    body.append(excerpt);
  }

  item.append(body);
  return item;
};

const buildRequestUrl = (
  query: string,
  config: SearchConfig,
  exactMatch: boolean,
  offset: number,
): string => {
  const target = new URL(config.endpoint);
  target.searchParams.set('filter[query]', exactMatch ? `"${query}"` : query);
  if (!exactMatch && config.fuzzy) {
    target.searchParams.set('filter[fuzzy]', 'true');
  }
  target.searchParams.set('page[limit]', String(config.limit));
  if (offset > 0) target.searchParams.set('page[offset]', String(offset));
  return target.toString();
};

const updateUrl = (query: string, exact: boolean) => {
  const url = new URL(window.location.href);
  if (query) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.delete('q');
  }
  if (exact) {
    url.searchParams.set('exact', '1');
  } else {
    url.searchParams.delete('exact');
  }
  window.history.replaceState({}, '', url);
};

const readQueryFromLocation = (): string =>
  new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
const readExactFromLocation = (): boolean =>
  new URLSearchParams(window.location.search).get('exact') === '1';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const mountSearchPage = (): CleanupFn | undefined => {
  const root = document.querySelector<HTMLElement>('[data-search-root]');
  if (!(root instanceof HTMLElement)) {
    return undefined;
  }

  const form = root.querySelector<HTMLFormElement>('[data-search-form]');
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const statusEl = root.querySelector<HTMLElement>('[data-search-status]');
  const resultsWrapper = root.querySelector<HTMLElement>('[data-search-results]');
  const listEl = root.querySelector<HTMLElement>('[data-search-list]');
  const moreEl = root.querySelector<HTMLElement>('[data-search-more]');
  const moreButton = root.querySelector<HTMLButtonElement>('[data-search-more-button]');
  const waysEl = root.querySelector<HTMLElement>('[data-search-ways]');
  const filterInputs = Array.from(root.querySelectorAll<HTMLInputElement>('[data-search-filter]'));
  const exactInput = root.querySelector<HTMLInputElement>('[data-search-exact]');
  const baseTitle = document.title;

  if (!form || !input || !statusEl || !resultsWrapper || !listEl) {
    console.warn('[search] Markup incompleto per la pagina di ricerca.');
    return undefined;
  }

  let config: SearchConfig;
  try {
    config = getRootConfig(root);
  } catch (err) {
    statusEl.textContent =
      'Configurazione della ricerca mancante. Verifica il token pubblico di DatoCMS.';
    console.error(err);
    return undefined;
  }

  let debounceId: number | undefined;
  let activeController: AbortController | null = null;
  let latestQuery = '';
  let exactMatch = false;
  let cachedResults: SearchResult[] = [];
  let cachedTotal = 0;
  let fetchedCount = 0;
  let cachedQuery = '';

  const setStatus = (message: string) => {
    statusEl.textContent = message;
  };

  const showWays = (visible: boolean) => {
    if (waysEl) waysEl.hidden = !visible;
  };

  const showMore = (visible: boolean) => {
    if (moreEl) moreEl.hidden = !visible;
  };

  const clearResults = () => {
    listEl.innerHTML = '';
    resultsWrapper.hidden = true;
    cachedResults = [];
    cachedTotal = 0;
    fetchedCount = 0;
    cachedQuery = '';
    showMore(false);
  };

  const promptStatus = () => {
    setStatus(`Scrivi almeno ${config.minLength} caratteri: un titolo, un nome, un argomento.`);
    showWays(true);
    document.title = baseTitle;
  };

  const getActiveFilters = (): FilterKey[] =>
    filterInputs.filter((inputEl) => inputEl.checked).map((inputEl) => inputEl.value as FilterKey);

  const renderResults = () => {
    const query = cachedQuery;
    listEl.innerHTML = '';
    resultsWrapper.hidden = true;
    resultsWrapper.removeAttribute('aria-busy');

    if (!query) {
      promptStatus();
      return;
    }

    document.title = `Cerca: ${query} | Multimage`;
    const activeFilters = getActiveFilters();
    const catalogue = cachedResults.filter((entry) => !isArchivedBook(entry));
    const visible = activeFilters.length
      ? catalogue.filter((entry) =>
          activeFilters.includes(filterOf(kindOf(entry.attributes.url ?? ''))),
        )
      : catalogue;
    const rows = buildRows(visible);
    const hasMore = fetchedCount < cachedTotal;
    showMore(hasMore);

    if (!catalogue.length && !hasMore) {
      const filtersHint = activeFilters.length ? ' o togli i filtri' : '';
      setStatus(
        `Nessun risultato per “${query}”. Prova con un'altra parola${filtersHint}, oppure scegli da dove partire qui sotto.`,
      );
      showWays(true);
      return;
    }

    if (!rows.length && !activeFilters.length) {
      setStatus(`Nessun risultato in catalogo tra i primi per “${query}”.`);
      showWays(!hasMore);
      return;
    }

    if (!rows.length) {
      const filtersDescription = activeFilters.map((key) => FILTER_LABEL[key]).join(', ');
      setStatus(
        hasMore
          ? `Nessun risultato tra ${filtersDescription} nei primi ${fetchedCount} risultati per “${query}”.`
          : `Nessun risultato per “${query}” tra ${filtersDescription}.`,
      );
      showWays(false);
      return;
    }

    showWays(false);
    const fragment = document.createDocumentFragment();
    rows.forEach((row) => fragment.append(createResultItem(row)));
    listEl.append(fragment);
    resultsWrapper.hidden = false;

    const shown = plural(rows.length, 'risultato', 'risultati');
    if (activeFilters.length) {
      const scope = activeFilters.map((key) => FILTER_LABEL[key]).join(', ');
      setStatus(
        hasMore
          ? `${shown} tra ${scope} nei primi ${fetchedCount} risultati per “${query}”.`
          : `${shown} tra ${scope} per “${query}”.`,
      );
    } else if (hasMore) {
      setStatus(
        `${plural(cachedTotal, 'risultato', 'risultati')} per “${query}”: eccone ${rows.length}, i più pertinenti.`,
      );
    } else {
      setStatus(`${shown} per “${query}”.`);
    }
  };

  const handleError = (error: unknown, query: string) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }

    console.error('Errore durante la ricerca su DatoCMS Site Search', error);
    clearResults();
    resultsWrapper.removeAttribute('aria-busy');

    if (error instanceof Response && error.status === 401) {
      setStatus('La ricerca non è autorizzata. Verifica il token Site Search.');
      return;
    }

    setStatus(`Non siamo riusciti a cercare “${query}”. Riprova tra poco.`);
    showWays(true);
  };

  const fetchPage = async (query: string, offset: number, controller: AbortController) => {
    const response = await fetch(buildRequestUrl(query, config, exactMatch, offset), {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
        'X-Api-Version': '3',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw response;
    }
    const payload = (await response.json()) as SearchResponse;
    const raw = payload.data ?? [];
    const visible = raw.filter((entry) => !isHiddenUrl(entry.attributes.url ?? ''));
    const results = exactMatch
      ? visible.filter((entry) => entryContainsPhrase(entry, query))
      : visible;
    // Book details are needed before the rows are built (archived filter, editions, covers).
    if (results.some((entry) => kindOf(entry.attributes.url ?? '') === 'book')) {
      await loadBooksIndex();
    }
    return { results, rawCount: raw.length, total: payload.meta?.total_count ?? raw.length };
  };

  const performSearch = async (query: string) => {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    latestQuery = query;
    // Visual cue only: the status speaks once, when the results are in.
    resultsWrapper.setAttribute('aria-busy', 'true');

    try {
      const page = await fetchPage(query, 0, controller);
      if (latestQuery !== query) {
        return;
      }
      cachedResults = page.results;
      cachedTotal = page.total;
      fetchedCount = page.rawCount;
      cachedQuery = query;
      renderResults();
    } catch (error) {
      handleError(error, query);
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
    }
  };

  const loadMore = async () => {
    if (!cachedQuery || !moreButton) return;
    const query = cachedQuery;
    const controller = new AbortController();
    activeController = controller;
    moreButton.disabled = true;
    const firstNewIndex = listEl.children.length;
    try {
      const page = await fetchPage(query, fetchedCount, controller);
      if (cachedQuery !== query) return;
      cachedResults = [...cachedResults, ...page.results];
      fetchedCount += page.rawCount;
      if (page.rawCount === 0) fetchedCount = cachedTotal;
      renderResults();
      const first =
        listEl.children[firstNewIndex]?.querySelector<HTMLAnchorElement>('.search-result__title a');
      first?.focus();
    } catch (error) {
      handleError(error, query);
    } finally {
      moreButton.disabled = false;
      if (activeController === controller) activeController = null;
    }
  };

  const triggerSearch = (rawValue: string, { updateHistory = true } = {}) => {
    const query = rawValue.trim();

    if (updateHistory) {
      updateUrl(query, exactMatch);
    }

    if (!query) {
      clearResults();
      promptStatus();
      return;
    }

    if (query.length < config.minLength) {
      clearResults();
      setStatus(`Scrivi almeno ${config.minLength} caratteri.`);
      return;
    }

    void performSearch(query);
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    if (debounceId !== undefined) window.clearTimeout(debounceId);
    triggerSearch(input.value, { updateHistory: true });
  };

  const handleInput = () => {
    if (debounceId !== undefined) {
      window.clearTimeout(debounceId);
    }
    const value = input.value;
    debounceId = window.setTimeout(() => {
      triggerSearch(value, { updateHistory: true });
    }, 300);
  };

  const handlePopState = () => {
    const current = readQueryFromLocation();
    input.value = current;
    exactMatch = readExactFromLocation();
    if (exactInput) {
      exactInput.checked = exactMatch;
    }
    triggerSearch(current, { updateHistory: false });
  };

  const handleFilterChange = () => {
    if (!cachedQuery) {
      promptStatus();
      return;
    }
    renderResults();
  };

  const handleExactChange = () => {
    exactMatch = Boolean(exactInput?.checked);
    triggerSearch(input.value, { updateHistory: true });
  };

  const handleMore = () => {
    void loadMore();
  };

  form.addEventListener('submit', handleSubmit);
  input.addEventListener('input', handleInput);
  window.addEventListener('popstate', handlePopState);
  filterInputs.forEach((inputEl) => inputEl.addEventListener('change', handleFilterChange));
  exactInput?.addEventListener('change', handleExactChange);
  moreButton?.addEventListener('click', handleMore);

  const initialQuery = readQueryFromLocation();
  exactMatch = readExactFromLocation();
  if (exactInput) {
    exactInput.checked = exactMatch;
  }
  if (initialQuery) {
    input.value = initialQuery;
    triggerSearch(initialQuery, { updateHistory: false });
  } else {
    promptStatus();
  }

  return () => {
    form.removeEventListener('submit', handleSubmit);
    input.removeEventListener('input', handleInput);
    window.removeEventListener('popstate', handlePopState);
    filterInputs.forEach((inputEl) => inputEl.removeEventListener('change', handleFilterChange));
    exactInput?.removeEventListener('change', handleExactChange);
    moreButton?.removeEventListener('click', handleMore);
    if (debounceId !== undefined) {
      window.clearTimeout(debounceId);
    }
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  };
};

let cleanup: CleanupFn | undefined;

const run = () => {
  cleanup?.();
  cleanup = mountSearchPage();
};

if (typeof window !== 'undefined') {
  run();
  window.addEventListener('astro:page-load', run);
  window.addEventListener('astro:before-swap', () => {
    cleanup?.();
    cleanup = undefined;
  });
}
