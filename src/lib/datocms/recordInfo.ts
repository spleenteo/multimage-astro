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
    case 'books_index':
      return '/libri';
    case 'archive_index':
      return '/libri/archivio';
    case 'highlights_index':
      return '/libri/highlights';
    case 'ebooks_index':
      return '/libri/ebooks';
    case 'collection':
      return buildUrl('/collane', item.attributes.slug as MaybeSlug);
    case 'collections_index':
      return '/collane';
    case 'author':
      return buildUrl('/autori', item.attributes.slug as MaybeSlug);
    case 'authors_index':
      return '/autori';
    case 'magazine_index':
      return '/magazine';
    case 'blog_post':
      return buildUrl('/magazine', item.attributes.slug as MaybeSlug);
    case 'page':
      return buildUrl('/info', item.attributes.slug as MaybeSlug);
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
