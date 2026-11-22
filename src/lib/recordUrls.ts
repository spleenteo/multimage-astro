/**
 * Public path of a CMS record linked from Structured Text, by its GraphQL `__typename`.
 * One map, so links between records never drift (blog posts once pointed to a dead `/blog/…`).
 */
const PATH_PREFIX: Record<string, string> = {
  AuthorRecord: '/autori',
  BookRecord: '/libri',
  CollectionRecord: '/collane',
  PageRecord: '/info',
  BlogPostRecord: '/magazine',
};

export function recordPath(typename: string, slug: string | null | undefined): string | null {
  const prefix = PATH_PREFIX[typename];
  const clean = slug?.trim();
  return prefix && clean ? `${prefix}/${encodeURIComponent(clean)}` : null;
}

const OWN_HOSTS = /^https?:\/\/(www\.)?multimage\.org(?=\/|$)/i;

/** Links typed by hand to the site itself ("https://www.multimage.org/libri/…") become relative. */
export function toSitePath(url: string): string {
  return url.replace(OWN_HOSTS, '') || '/';
}
