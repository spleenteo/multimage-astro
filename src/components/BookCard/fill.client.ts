// Browser side of BookCard (catalogue variant): writes a book's values into a clone of the card the
// server rendered as a mould. It follows the structure of `index.astro` and of Book3D; when that
// markup changes, change this with it.
//
//   a[href] > article > div (field, style) > div > .b3d (style) > .book > span (spine|pages) + img
//                     > div (body) > div > h3 + p (subtitle)
//                                  > span (authors) > span
//                                  > p (meta)
//                                  > p (price)
//   [data-card-bag] (sibling of the link): the bag control, kept only when the card has `b`.
import type { CatalogueCard } from '~/lib/catalogue';
import type { BagBook } from '~/lib/order';
import { showCardBag } from './bag.client';

export function fillBookCard(item: HTMLElement, slug: string, card: CatalogueCard): void {
  const link = item.querySelector<HTMLAnchorElement>('a');
  const [field, body] = Array.from(item.querySelectorAll<HTMLElement>('a > article > div'));
  if (!link || !field || !body) return;

  link.setAttribute('href', `/libri/${slug}`);
  field.setAttribute('style', `background: ${card.bg};`);

  const book = field.querySelector<HTMLElement>('.b3d');
  if (book && card.c) {
    book.setAttribute('style', card.c.style);
    const side = book.querySelector<HTMLElement>('.book > span');
    if (side) {
      side.className = card.c.sp ? 'spine' : 'pages';
      side.textContent = card.c.sp ? card.t : '';
      if (card.c.sp) side.setAttribute('aria-hidden', 'true');
      else side.removeAttribute('aria-hidden');
    }
    const image = book.querySelector<HTMLImageElement>('img');
    if (image) {
      image.srcset = card.c.set;
      image.src = card.c.src;
    }
  }

  const write = (
    node: Element | null | undefined,
    text: string | undefined,
    target: Element | null | undefined = node,
  ) => {
    if (!node) return;
    if (text && target) target.textContent = text;
    else node.remove();
  };
  const heading = body.firstElementChild;
  write(heading?.children[1], card.st);
  write(heading?.children[0], card.t);
  const authors = body.querySelector(':scope > span');
  write(authors, card.au, authors?.querySelector('span'));
  const [meta, price] = Array.from(body.querySelectorAll(':scope > p'));
  write(meta, card.me);
  write(price, card.pr);

  const bag = item.querySelector<HTMLElement>('[data-card-bag]');
  if (bag) {
    if (card.b) {
      const book: BagBook = {
        id: card.b.i,
        slug,
        title: card.t,
        authors: card.au ?? '',
        priceCents: card.b.p,
        cover: card.c ? `${card.c.src.split('?')[0]}?w=120&fit=max&auto=format` : null,
        tint: card.b.tn,
      };
      bag.dataset.bagItem = JSON.stringify(book);
      showCardBag(bag);
    } else {
      bag.remove();
    }
  }
}
