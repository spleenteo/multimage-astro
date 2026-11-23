/** A catalogue card's JSON form (`CatalogueCard`), from the same views the server-rendered card uses. */
import { formatAuthorNames } from '~/lib/authors';
import { book3dView } from '~/lib/book3d';
import { bookCardView } from '~/lib/bookCardView';
import type { CatalogueCard } from '~/lib/catalogue';
import type { CatalogueCardRecord } from '~/pages/libri/index/_graphql';

export function toCatalogueCard(record: CatalogueCardRecord): CatalogueCard {
  const view = bookCardView({
    title: record.title,
    slug: record.slug,
    format: record.format,
    coverImage: record.coverImage,
    pages: record.pages,
    price: record.price,
    printYear: record.printYear,
    collectionName: record.collection?.name ?? null,
    isArchived: record.archive === true,
    variant: 'catalogue',
  });
  const authors = record.authors?.length ? formatAuthorNames(record.authors) : '';
  const card: CatalogueCard = { t: record.title, bg: view.backgroundColor };
  if (record.subtitle) card.st = record.subtitle;
  if (authors) card.au = authors;
  if (view.meta.length > 0) card.me = view.meta.join(' · ');
  if (view.priceLabel) card.pr = view.priceLabel;
  if (view.cover) {
    const book = book3dView(view.cover.book);
    card.c = {
      src: view.cover.src,
      set: view.cover.srcset,
      style: book.style,
      sp: book.showSpine ? 1 : 0,
    };
  }
  return card;
}
