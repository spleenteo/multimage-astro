import { executeQuery } from '~/lib/datocms/executeQuery';
import { buildAuthorIndex, type AuthorIndexBook } from '~/lib/authorIndex';
import {
  AUTHORS_BOOKS_PAGE_SIZE,
  AUTHORS_BOOKS_QUERY,
  AUTHORS_PAGE_QUERY,
  type AuthorsBooksResult,
  type AuthorsPageQueryResult,
} from './_graphql';

/** Variables of the first read, also given to the draft-mode listener. */
export const authorsPageVariables = (authors: number) => ({
  first: AUTHORS_BOOKS_PAGE_SIZE,
  skip: 0,
  authors,
});

/**
 * Reads the first `authors` profiles and every book, and builds the index items. Shared by the
 * page (first letters) and by `/authors-index.json` (everyone).
 */
export async function readAuthorsIndex(includeDrafts: boolean, authors: number) {
  const data = await executeQuery<AuthorsPageQueryResult>(AUTHORS_PAGE_QUERY, {
    includeDrafts,
    variables: authorsPageVariables(authors),
  });

  // The CDA returns at most 500 records per query: read the rest of the books, if any.
  const books: AuthorIndexBook[] = [...(data.allBooks ?? [])];
  const totalBooks = data._allBooksMeta?.count ?? books.length;
  while (books.length < totalBooks) {
    const next = await executeQuery<AuthorsBooksResult>(AUTHORS_BOOKS_QUERY, {
      includeDrafts,
      variables: { first: AUTHORS_BOOKS_PAGE_SIZE, skip: books.length },
    });
    if (!next.allBooks?.length) break;
    books.push(...next.allBooks);
  }

  return {
    indexContent: data.authorsIndexPage?.[0] ?? null,
    items: buildAuthorIndex(data.allAuthors ?? [], books),
    // Everyone who signs at least one book, whether or not their profile was read here.
    authorsWithBooks: new Set(
      books.flatMap((book) => (book.authors ?? []).map((author) => author.id)),
    ).size,
    booksInCatalogue: books.filter((book) => book.archive !== true).length,
  };
}
