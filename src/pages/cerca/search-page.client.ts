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

type CleanupFn = () => void;

const TYPE_LABELS: Array<{ test: (url: string) => boolean; label: string }> = [
  { test: (url) => /\/libri\//.test(url), label: 'Libro' },
  { test: (url) => /\/autori\//.test(url), label: 'Autore' },
  { test: (url) => /\/(magazine|blog)\//.test(url), label: 'Magazine' },
];

const getRootConfig = (root: HTMLElement): SearchConfig => {
  const {
    endpoint = '',
    token = '',
    minLength = '3',
    limit = '25',
    fuzzy = 'true',
  } = root.dataset;

  return {
    endpoint,
    token,
    minLength: Number.parseInt(minLength, 10) || 3,
    limit: Number.parseInt(limit, 10) || 25,
    fuzzy: fuzzy !== 'false',
  };
};

const labelForUrl = (url: string): string => {
  const matcher = TYPE_LABELS.find(({ test }) => test(url));
  return matcher ? matcher.label : 'Risorsa';
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

  const setStatus = (message: string) => {
    statusEl.textContent = message;
  };

  const clearResults = () => {
    listEl.innerHTML = '';
    resultsWrapper.hidden = true;
  };

  const renderResults = (items: SearchResult[], total: number, query: string) => {
    clearResults();

    if (!items.length) {
      setStatus(`Nessun risultato per “${query}”.`);
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((entry) => fragment.append(createResultItem(entry)));

    listEl.append(fragment);
    resultsWrapper.hidden = false;
    setStatus(`Trovati ${total} risultati per “${query}”.`);
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
      if (latestQuery !== query) {
        return;
      }

      const items = payload.data ?? [];
      const total = payload.meta?.total_count ?? items.length;
      renderResults(items, total, query);
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

  const readInitialQuery = () => {
    if (typeof window === 'undefined') {
      return '';
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('q')?.trim() ?? '';
  };

  const syncFromLocation = (options: { updateHistory: boolean }) => {
    const current = readInitialQuery();
    input.value = current;
    if (!current) {
      clearResults();
      setStatus(`Inserisci almeno ${config.minLength} caratteri per iniziare.`);
      return;
    }

    if (current.length < config.minLength) {
      clearResults();
      setStatus(`La ricerca richiede almeno ${config.minLength} caratteri.`);
      return;
    }

    triggerSearch(current, options);
  };

  syncFromLocation({ updateHistory: false });

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
    syncFromLocation({ updateHistory: false });
  };

  form.addEventListener('submit', handleSubmit);
  input.addEventListener('input', handleInput);
  window.addEventListener('popstate', handlePopState);

  return () => {
    form.removeEventListener('submit', handleSubmit);
    input.removeEventListener('input', handleInput);
    window.removeEventListener('popstate', handlePopState);
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
