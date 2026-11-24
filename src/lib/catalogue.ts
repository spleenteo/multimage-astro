/**
 * Faceted catalogue (/libri): the data each book carries for the client-side filters, and the pure
 * filtering rules shared by the server render (initial counts) and the browser script.
 */

/** Compact per-book facet record, serialised into the page as JSON (one entry per rendered card). */
export type CatalogueEntry = {
  /** Book slug: the key of its card in `/catalogue-books.json`. */
  k: string;
  /** Collection slug, or '' when the book has none. */
  c: string;
  /** 1 when the book is an ebook. */
  e: 0 | 1;
  /** Print year, or 0 when unknown. */
  y: number;
  /** Author slugs. */
  a: string[];
  /** 1 when the book is a translation. */
  t: 0 | 1;
  /** 1 when the book is out of catalogue (archive). */
  x: 0 | 1;
  /** 1 when the editors flagged the book as highlighted ("In evidenza"). */
  h: 0 | 1;
  /** Normalised text the in-page search matches against (title, subtitle, authors). */
  s: string;
  /** Normalised title for the A–Z sort. */
  n: string;
};

/**
 * A catalogue card as `/catalogue-books.json` serves it, keyed by slug: the values the browser
 * writes into the card template (see `BookCard/fill.client.ts`). Server-rendered cards and these
 * come from the same functions (`bookCardView`, `book3dView`).
 */
export type CatalogueCard = {
  /** Title. */
  t: string;
  /** Subtitle. */
  st?: string;
  /** Authors, already formatted. */
  au?: string;
  /** Meta line (collection · year · format). */
  me?: string;
  /** Price label. */
  pr?: string;
  /** Background of the field behind the cover. */
  bg: string;
  /** Cover: image URL, 2x srcset, Book3D inline style, 1 when the pose shows the spine. */
  c?: { src: string; set: string; style: string; sp: 0 | 1 };
  /**
   * Bag data, only for an orderable print book: record id, price in cents, the field tint. The
   * browser rebuilds the bag item from these, the slug, the title, the authors and the cover.
   */
  b?: { i: string; p: number; tn: string | null };
};

/** Where the browser reads the cards the server did not render. */
export const CATALOGUE_CARDS_URL = '/catalogue-books.json';

export type CatalogueOption = { value: string; label: string };

export type CatalogueState = {
  q: string;
  collane: string[];
  formato: '' | 'ebook' | 'cartaceo';
  autore: string;
  periodo: string;
  tradotti: boolean;
  evidenza: boolean;
  archivio: boolean;
  ordine: 'novita' | 'titolo';
};

export const CATALOGUE_CHUNK = 40;

export const EMPTY_CATALOGUE_STATE: CatalogueState = {
  q: '',
  collane: [],
  formato: '',
  autore: '',
  periodo: '',
  tradotti: false,
  evidenza: false,
  archivio: false,
  ordine: 'novita',
};

/** Lower-case, strip accents and punctuation, collapse spaces: "Perché l'Ahimsa?" → "perche l ahimsa". */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * A book counts as translated when it names a translator, or an original language that is not
 * Italian. The language field is free text in the CMS ("Spagnolo", "spagnolo cileno", …).
 */
export function isTranslated(translator?: string | null, originalLang?: string | null): boolean {
  if (translator && translator.trim().length > 0) {
    return true;
  }
  const lang = originalLang?.trim().toLowerCase() ?? '';
  return lang.length > 0 && !lang.startsWith('italian');
}

/**
 * Period options derived from the data: "Ultime uscite" (the two most recent print years), then one
 * option per decade, newest first. Values: `recenti` and the decade's first year (`2020`, `1990`).
 */
export function buildPeriodOptions(years: number[]): CatalogueOption[] {
  const known = years.filter((year) => year > 0);
  if (known.length === 0) {
    return [];
  }
  const latest = Math.max(...known);
  const decades = [...new Set(known.map((year) => Math.floor(year / 10) * 10))].sort(
    (a, b) => b - a,
  );
  return [
    { value: 'recenti', label: `Ultime uscite (${latest - 1}–${latest})` },
    ...decades.map((decade) => ({
      value: String(decade),
      label: decade >= 2000 ? `Anni ${decade}` : `Anni '${String(decade).slice(2)}`,
    })),
  ];
}

export function latestYear(entries: CatalogueEntry[]): number {
  return entries.reduce((max, entry) => Math.max(max, entry.y), 0);
}

type Facet =
  'q' | 'collane' | 'formato' | 'autore' | 'periodo' | 'tradotti' | 'evidenza' | 'archivio';

/** Whether an entry passes every active filter, optionally ignoring one facet (for facet counts). */
export function matchesCatalogue(
  entry: CatalogueEntry,
  state: CatalogueState,
  newest: number,
  ignore?: Facet,
): boolean {
  if (ignore !== 'archivio' && !state.archivio && entry.x === 1) return false;
  if (ignore !== 'collane' && state.collane.length > 0 && !state.collane.includes(entry.c))
    return false;
  if (ignore !== 'formato' && state.formato === 'ebook' && entry.e !== 1) return false;
  if (ignore !== 'formato' && state.formato === 'cartaceo' && entry.e !== 0) return false;
  if (ignore !== 'autore' && state.autore && !entry.a.includes(state.autore)) return false;
  if (ignore !== 'tradotti' && state.tradotti && entry.t !== 1) return false;
  if (ignore !== 'evidenza' && state.evidenza && entry.h !== 1) return false;
  if (ignore !== 'periodo' && state.periodo) {
    if (state.periodo === 'recenti') {
      if (entry.y < newest - 1) return false;
    } else {
      const decade = Number.parseInt(state.periodo, 10);
      if (!(entry.y >= decade && entry.y < decade + 10)) return false;
    }
  }
  if (ignore !== 'q' && state.q) {
    const terms = normalizeForSearch(state.q).split(' ').filter(Boolean);
    if (!terms.every((term) => entry.s.includes(term))) return false;
  }
  return true;
}

/** Read the filter state from a URL query string; unknown or malformed values fall back to defaults. */
export function parseCatalogueState(search: string): CatalogueState {
  const params = new URLSearchParams(search);
  const formato = params.get('formato');
  return {
    q: params.get('q')?.trim() ?? '',
    collane: params.getAll('collana').filter(Boolean),
    formato: formato === 'ebook' || formato === 'cartaceo' ? formato : '',
    autore: params.get('autore')?.trim() ?? '',
    periodo: params.get('periodo')?.trim() ?? '',
    tradotti: params.get('tradotti') === '1',
    evidenza: params.get('evidenza') === '1',
    archivio: params.get('archivio') === '1',
    ordine: params.get('ordine') === 'titolo' ? 'titolo' : 'novita',
  };
}

/** Serialise the state back to a query string (defaults omitted, so a clean catalogue is `/libri`). */
export function serializeCatalogueState(state: CatalogueState): string {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  state.collane.forEach((slug) => params.append('collana', slug));
  if (state.formato) params.set('formato', state.formato);
  if (state.autore) params.set('autore', state.autore);
  if (state.periodo) params.set('periodo', state.periodo);
  if (state.tradotti) params.set('tradotti', '1');
  if (state.evidenza) params.set('evidenza', '1');
  if (state.archivio) params.set('archivio', '1');
  if (state.ordine !== 'novita') params.set('ordine', state.ordine);
  const query = params.toString();
  return query ? `?${query}` : '';
}
