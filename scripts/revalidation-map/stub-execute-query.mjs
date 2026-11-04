// Offline stand-in for src/lib/datocms/executeQuery.ts: no network, canned data.
export async function executeQuery(_query, options = {}) {
  const catalogueBooksMeta = { count: 81 };
  if (options.variables?.slug === 'libro-non-pubblicato') {
    return { catalogueBooksMeta, book: null };
  }
  return {
    catalogueBooksMeta,
    book: {
      authors: [{ slug: 'autore-uno' }, { slug: 'autore-due' }],
      collection: { slug: 'collana-uno' },
    },
  };
}
