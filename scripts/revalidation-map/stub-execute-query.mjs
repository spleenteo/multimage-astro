// Offline stand-in for src/lib/datocms/executeQuery.ts: no network, canned data.
export async function executeQuery(_query, options = {}) {
  const catalogueBooksMeta = { count: 81 };
  const allBooks =
    options.variables?.id === 'rec-1010' ? [{ slug: 'libro-cc' }, { slug: 'libro-cc-due' }] : [];
  if (options.variables?.slug === 'libro-non-pubblicato') {
    return { catalogueBooksMeta, allBooks, book: null };
  }
  return {
    catalogueBooksMeta,
    allBooks,
    book: {
      authors: [{ slug: 'autore-uno' }, { slug: 'autore-due' }],
      collection: { slug: 'collana-uno' },
    },
  };
}
