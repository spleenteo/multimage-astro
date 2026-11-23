// Browser side of AuthorCard: writes an author's values into a clone of the card the server
// rendered as a mould. It follows the structure of `index.astro`; change the two together.
//
//   article > div (head) > div (portrait > img | initial) + div > h3 > a (name + arrow), p (legal), p (size)
//           > p (bio)
//           > div (foot) > a (covers) > img… + a (way to the books)
import type { AuthorIndexItem } from '~/lib/authorIndex';

export function fillAuthorCard(card: HTMLElement, author: AuthorIndexItem): void {
  const article = card.querySelector('article');
  const head = article?.firstElementChild;
  const foot = article?.lastElementChild;
  const [face, info] = Array.from(head?.children ?? []);
  if (!article || !face || !info || !foot) return;

  const portrait = face.querySelector('img');
  if (portrait && author.p) portrait.src = author.p;
  else face.textContent = author.i;

  const link = info.querySelector<HTMLAnchorElement>('h3 > a');
  if (link) {
    link.setAttribute('href', `/autori/${author.k}`);
    // The name is the link's first node; the arrow after it stays.
    if (link.firstChild) link.firstChild.nodeValue = author.n;
  }
  const [legal, size] = Array.from(info.querySelectorAll(':scope > p'));
  if (author.ln) legal.textContent = author.ln;
  else legal.remove();
  size.textContent = author.sz;

  const bio = article.querySelector(':scope > p');
  if (bio && author.b) bio.textContent = author.b;
  else bio?.remove();

  const [covers, way] = Array.from(foot.querySelectorAll<HTMLAnchorElement>(':scope > a'));
  way.setAttribute('href', author.h);
  const mould = covers.querySelector('img');
  if (!mould || author.cv.length === 0) {
    covers.remove();
    return;
  }
  covers.setAttribute('href', author.h);
  covers.replaceChildren(
    ...author.cv.map((cover) => {
      const image = mould.cloneNode(true) as HTMLImageElement;
      image.width = cover.width;
      image.height = cover.height;
      image.src = cover.src;
      return image;
    }),
  );
}
