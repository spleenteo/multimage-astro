/**
 * Magazine view helpers: the date an article is shown and sorted by, and category labels written
 * consistently whatever their case in the CMS ("eventi", "News", "Recensioni").
 */

type DatedPost = { _firstPublishedAt?: string | null; createdAt?: string | null };

/** The first publication date (falls back to creation). Both are migration dates for older posts. */
export function postDate(post: DatedPost): string | null {
  return post._firstPublishedAt ?? post.createdAt ?? null;
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatPostDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

/** Plural (strip, filter) and singular (an article's own line) labels, by category slug. */
type CategoryLabels = { plural: string; singular: string; others: string; all: string };

const CATEGORY_LABELS: Record<string, CategoryLabels> = {
  recensioni: { plural: 'Recensioni', singular: 'Recensione', others: 'Altre recensioni', all: 'Tutte le recensioni' },
  eventi: { plural: 'Eventi', singular: 'Evento', others: 'Altri eventi', all: 'Tutti gli eventi' },
  interviste: { plural: 'Interviste', singular: 'Intervista', others: 'Altre interviste', all: 'Tutte le interviste' },
  news: { plural: 'Notizie', singular: 'Notizia', others: 'Altre notizie', all: 'Tutte le notizie' },
  libri: { plural: 'Libri', singular: 'Libri', others: 'Altri articoli sui libri', all: 'Tutti gli articoli sui libri' },
  premiazioni: { plural: 'Premiazioni', singular: 'Premiazione', others: 'Altre premiazioni', all: 'Tutte le premiazioni' },
};

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase('it-IT') + value.slice(1);

export type PostCategory = { name?: string | null; slug?: string | null } | null | undefined;

export function categoryLabel(category: PostCategory, form: keyof CategoryLabels = 'plural'): string | null {
  const slug = category?.slug?.trim().toLowerCase();
  const known = slug ? CATEGORY_LABELS[slug] : undefined;
  if (known) return known[form];
  const name = category?.name?.trim();
  if (!name) return null;
  if (form === 'others') return `Altri articoli: ${name.toLowerCase()}`;
  if (form === 'all') return `Tutti gli articoli: ${name.toLowerCase()}`;
  return capitalize(name);
}

/** The index filtered by one category. */
export function categoryHref(category: PostCategory): string | null {
  const slug = category?.slug?.trim();
  return slug ? `/magazine?categoria=${encodeURIComponent(slug)}` : null;
}
