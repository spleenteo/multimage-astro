type MaybeSlug = string | null | undefined;

type DatoRecord = {
  attributes: Record<string, unknown>;
};

function normalizeSlug(value: MaybeSlug) {
  return value?.trim() || null;
}

function buildUrl(basePath: string, slug: MaybeSlug) {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  return `${basePath}/${normalizedSlug}`;
}

// Index pages are `index_page` records told apart by slug (see the
// `allIndexPages(filter: { slug: { eq } })` query of each index route).
export const INDEX_PAGE_PATHS: Readonly<Record<string, string>> = {
  libri: '/libri',
  archivio: '/libri/archivio',
  collane: '/collane',
  autori: '/autori',
  magazine: '/magazine',
  distributori: '/distributori',
};

export function indexPagePath(slug: MaybeSlug): string | null {
  const s = normalizeSlug(slug);
  return s && Object.hasOwn(INDEX_PAGE_PATHS, s) ? INDEX_PAGE_PATHS[s] : null;
}

export async function recordToWebsiteRoute(
  item: DatoRecord,
  itemTypeApiKey: string,
  _locale: string,
): Promise<string | null> {
  switch (itemTypeApiKey) {
    case 'home':
      return '/';
    case 'book':
      return buildUrl('/libri', item.attributes.slug as MaybeSlug);
    case 'collection':
      return buildUrl('/collane', item.attributes.slug as MaybeSlug);
    case 'author':
      return buildUrl('/autori', item.attributes.slug as MaybeSlug);
    case 'blog_post':
      return buildUrl('/magazine', item.attributes.slug as MaybeSlug);
    case 'index_page':
      return indexPagePath(item.attributes.slug as MaybeSlug);
    case 'supplier':
      return '/distributori';
    case 'page':
      return buildUrl('/info', item.attributes.slug as MaybeSlug);
    case 'membership':
      return '/diventa-socio';
    default:
      return null;
  }
}

export async function recordToSlug(
  item: DatoRecord,
  itemTypeApiKey: string,
  _locale: string,
): Promise<string | null> {
  switch (itemTypeApiKey) {
    case 'book':
    case 'collection':
    case 'author':
    case 'blog_post':
    case 'page':
      return normalizeSlug(item.attributes.slug as MaybeSlug);
    default:
      return null;
  }
}
