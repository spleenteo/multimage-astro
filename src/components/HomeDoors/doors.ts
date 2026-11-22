// The three ways into the catalogue shown under the home hero. Also used by the home page to
// skip CMS blocks that only repeat these links (the old "Cosa cerchi?" pills block).
export const HOME_DOORS = [
  { href: '/libri', title: 'Catalogo', text: 'Tutti i libri disponibili' },
  { href: '/autori', title: 'Autrici e autori', text: 'Chi scrive per Multimage' },
  { href: '/collane', title: 'Collane', text: 'I libri raccolti per tema' },
] as const;

const DOOR_PATHS: ReadonlySet<string> = new Set(HOME_DOORS.map((door) => door.href));

// True when every link points to one of the doors (trailing slash and absolute site URLs
// tolerated), i.e. the block would only duplicate them.
export function onlyRepeatsDoors(urls: Array<string | null | undefined>): boolean {
  const paths = urls.filter((url): url is string => Boolean(url?.trim()));
  if (paths.length === 0) {
    return false;
  }
  return paths.every((url) => {
    const path =
      url
        .trim()
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/\/+$/, '') || '/';
    return DOOR_PATHS.has(path);
  });
}
