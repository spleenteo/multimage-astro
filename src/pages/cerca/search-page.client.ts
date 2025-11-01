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

type FilterKey = 'books' | 'authors' | 'info';

type CleanupFn = () => void;

const filterLabels: Record<FilterKey, string> = {
  books: 'libri',
  authors: 'autori',
  info: 'informazioni',
};

const classifyEntry = (url: string): FilterKey => {
  if (/\/libri\//.test(url)) return 'books';
  if (/\/autori\//.test(url)) return 'authors';
  if (/\/info\//.test(url)) return 'info';
  if (/\/magazine\//.test(url)) return 'info';
  return 'info';
};

const getRootConfig = (root: HTMLElement): SearchConfig => {
  const { endpoint = '', token = '', minLength = '3', limit = '25', fuzzy = 'true' } = root.dataset;

  return {
    endpoint,
    token,
    minLength: Number.parseInt(minLength, 10) || 3,
    limit: Number.parseInt(limit, 10) || 25,
    fuzzy: fuzzy !== 'false',
  };
};

const labelForUrl = (url: string): string => {
  const key = classifyEntry(url);
  const label = filterLabels[key];
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const pathFromUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
};

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

const createResultItem = (entry: SearchResult): HTMLLIElement => {
  const { attributes } = entry;
  const item = document.createElement('li');
  item.className = 'search-result';

  const badge = document.createElement('span');
  badge.className = 'search-result__badge';
  badge.textContent = labelForUrl(attributes.url ?? '');
  item.append(badge);

  const title = document.createElement('h3');
  title.className = 'search-result__title';

  const link = document.createElement('a');
  link.href = attributes.url ?? '#';
  link.rel = 'noopener';
  appendHighlightedText(link, attributes.highlight?.title?.[0] ?? attributes.title ?? '');
  title.append(link);
  item.append(title);

  const excerptSource = attributes.highlight?.body?.[0] ?? attributes.body_excerpt ?? '';
  if (excerptSource) {
    const excerpt = document.createElement('p');
    excerpt.className = 'search-result__excerpt';
    appendHighlightedText(excerpt, excerptSource);
    item.append(excerpt);
  }

  const url = document.createElement('p');
  url.className = 'search-result__url';
  url.textContent = pathFromUrl(attributes.url ?? '');
  item.append(url);

  return item;
};

const buildRequestUrl = (query: string, config: SearchConfig): string => {
  const target = new URL(config.endpoint);
  target.searchParams.set('filter[query]', query);
  if (config.fuzzy) {
    target.searchParams.set('filter[fuzzy]', 'true');
  }
  target.searchParams.set('page[limit]', String(config.limit));
  return target.toString();
};

const updateUrl = (query: string) => {
  const url = new URL(window.location.href);
  if (query) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.delete('q');
  }
  window.history.replaceState({}, '', url);
};

const readQueryFromLocation = (): string => {
  const params = new URLSearchParams(window.location.search);
  return params.get('q')?.trim() ?? '';
};

const mountSearchPage = (): CleanupFn | undefined => {
  const root = document.querySelector<HTMLElement>('[data-search-root]');
  if (!(root instanceof HTMLElement)) {
    return undefined;
  }

  const config = getRootConfig(root);

  const form = root.querySelector<HTMLFormElement>('[data-search-form]');
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const statusEl = root.querySelector<HTMLElement>('[data-search-status]');
  const resultsWrapper = root.querySelector<HTMLElement>('[data-search-results]');
  const listEl = root.querySelector<HTMLElement>('[data-search-list]');
  const filterInputs = Array.from(root.querySelectorAll<HTMLInputElement>('[data-search-filter]'));

  if (!form || !input || !statusEl || !resultsWrapper || !listEl) {
    console.warn('[search] Markup incompleto per la pagina di ricerca.');
    return undefined;
  }

  if (!config.endpoint || !config.token) {
    statusEl.textContent =
      'Configurazione della ricerca mancante. Verifica il token pubblico di DatoCMS.';
    return undefined;
  }

  let debounceId: number | undefined;
  let activeController: AbortController | null = null;
  let latestQuery = '';
  let cachedResults: SearchResult[] = [];
  let cachedTotal = 0;
  let cachedQuery = '';

  const setStatus = (message: string) => {
    statusEl.textContent = message;
  };

  const clearResults = () => {
    listEl.innerHTML = '';
    resultsWrapper.hidden = true;
    cachedResults = [];
    cachedTotal = 0;
    cachedQuery = '';
  };

  const getActiveFilters = (): FilterKey[] =>
    filterInputs.filter((inputEl) => inputEl.checked).map((inputEl) => inputEl.value as FilterKey);

  const matchesFilters = (entry: SearchResult, filters: FilterKey[]): boolean => {
    if (!filters.length) {
      return true;
    }
    const key = classifyEntry(entry.attributes.url ?? '');
    return filters.includes(key);
  };

  const renderResults = (items: SearchResult[], total: number, query: string) => {
    listEl.innerHTML = '';
    resultsWrapper.hidden = true;

    if (!query) {
      setStatus(`Inserisci almeno ${config.minLength} caratteri per iniziare.`);
      return;
    }

    const activeFilters = getActiveFilters();
    const visibleItems = activeFilters.length
      ? items.filter((entry) => matchesFilters(entry, activeFilters))
      : items;

    if (!items.length) {
      setStatus(`Nessun risultato per “${query}”.`);
      return;
    }

    if (!visibleItems.length) {
      const filtersDescription = activeFilters.map((key) => filterLabels[key]).join(', ');
      setStatus(
        `Nessun risultato per “${query}” con i filtri selezionati (${filtersDescription}).`,
      );
      return;
    }

    const fragment = document.createDocumentFragment();
    visibleItems.forEach((entry) => fragment.append(createResultItem(entry)));
    listEl.append(fragment);
    resultsWrapper.hidden = false;

    const base = `Trovati ${visibleItems.length}${
      activeFilters.length ? ` su ${total}` : ''
    } risultati per “${query}”.`;
    const filtersSuffix =
      activeFilters.length > 0
        ? ` Filtri attivi: ${activeFilters.map((key) => filterLabels[key]).join(', ')}.`
        : '';
    setStatus(base + filtersSuffix);
  };

  const handleError = (error: unknown, query: string) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }

    console.error('Errore durante la ricerca su DatoCMS Site Search', error);
    clearResults();

    if (error instanceof Response && error.status === 401) {
      setStatus('La ricerca non è autorizzata. Verifica il token Site Search.');
      return;
    }

    setStatus(`Si è verificato un errore durante la ricerca di “${query}”. Riprova più tardi.`);
  };

  const applyFilters = () => {
    if (!cachedQuery) {
      setStatus(`Inserisci almeno ${config.minLength} caratteri per iniziare.`);
      return;
    }
    renderResults(cachedResults, cachedTotal, cachedQuery);
  };

  const performSearch = async (query: string) => {
    if (activeController) {
      activeController.abort();
    }

    const controller = new AbortController();
    activeController = controller;
    latestQuery = query;

    try {
      const response = await fetch(buildRequestUrl(query, config), {
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
      cachedResults = payload.data ?? [];
      cachedTotal = payload.meta?.total_count ?? cachedResults.length;
      cachedQuery = query;

      if (latestQuery !== query) {
        return;
      }

      renderResults(cachedResults, cachedTotal, query);
    } catch (error) {
      handleError(error, query);
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
    }
  };

  const triggerSearch = (rawValue: string, { updateHistory = true } = {}) => {
    const query = rawValue.trim();

    if (updateHistory) {
      updateUrl(query);
    }

    if (!query) {
      clearResults();
      setStatus(`Inserisci almeno ${config.minLength} caratteri per iniziare.`);
      return;
    }

    if (query.length < config.minLength) {
      clearResults();
      setStatus(`La ricerca richiede almeno ${config.minLength} caratteri.`);
      return;
    }

    setStatus('Caricamento…');
    void performSearch(query);
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
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
    triggerSearch(current, { updateHistory: false });
  };

  const handleFilterChange = () => {
    applyFilters();
  };

  form.addEventListener('submit', handleSubmit);
  input.addEventListener('input', handleInput);
  window.addEventListener('popstate', handlePopState);
  filterInputs.forEach((inputEl) => inputEl.addEventListener('change', handleFilterChange));

  const initialQuery = readQueryFromLocation();
  if (initialQuery) {
    input.value = initialQuery;
    triggerSearch(initialQuery, { updateHistory: false });
  } else {
    setStatus(`Inserisci almeno ${config.minLength} caratteri per iniziare.`);
  }

  return () => {
    form.removeEventListener('submit', handleSubmit);
    input.removeEventListener('input', handleInput);
    window.removeEventListener('popstate', handlePopState);
    filterInputs.forEach((inputEl) => inputEl.removeEventListener('change', handleFilterChange));
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
