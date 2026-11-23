// Browser side of /autori: the server renders the first letters; this adds the others from
// `/authors-index.json` once the page is idle (at once when the reader starts searching or the
// URL points at a letter that is not there yet), with letter groups and cards cloned from the
// moulds the server rendered. The inline search script listens for `authors:loaded`.
import type { AuthorIndexItem } from '~/lib/authorIndex';
import { fillAuthorCard } from '~/components/AuthorCard/fill.client';

export function initAuthorsIndex(root: HTMLElement) {
  const url = root.dataset.indexUrl;
  const groupsWrap = root.querySelector<HTMLElement>('[data-author-groups]');
  const nav = root.querySelector<HTMLElement>('[data-author-nav]');
  const groupTemplate = root.querySelector<HTMLTemplateElement>('[data-group-template]');
  const cardTemplate = root.querySelector<HTMLTemplateElement>('[data-card-template]');
  const initialTemplate = root.querySelector<HTMLTemplateElement>('[data-card-template-initial]');
  if (!url || !groupsWrap || !nav || !groupTemplate || !cardTemplate || !initialTemplate) return;

  let request: Promise<void> | null = null;
  let attempts = 0;

  const merge = (authors: AuthorIndexItem[]) => {
    const cards = new Map<string, HTMLElement>();
    groupsWrap.querySelectorAll<HTMLElement>('[data-author-card][data-key]').forEach((card) => {
      if (card.dataset.key) cards.set(card.dataset.key, card);
    });

    // Letters in the JSON's order, each with its cards in order (server-rendered ones reused).
    const letters: Array<{ letter: string; anchorId: string; cards: HTMLElement[] }> = [];
    for (const author of authors) {
      let card = cards.get(author.k);
      if (!card) {
        const mould = (author.p ? cardTemplate : initialTemplate).content.firstElementChild;
        card = mould?.cloneNode(true) as HTMLElement | undefined;
        if (!card) continue;
        card.dataset.key = author.k;
        card.dataset.search = author.s;
        fillAuthorCard(card, author);
      }
      const last = letters.at(-1);
      if (last && last.anchorId === author.a) last.cards.push(card);
      else letters.push({ letter: author.l, anchorId: author.a, cards: [card] });
    }

    const sections: HTMLElement[] = [];
    const links: HTMLElement[] = [];
    for (const { letter, anchorId, cards: groupCards } of letters) {
      let section = groupsWrap.querySelector<HTMLElement>(`#${CSS.escape(anchorId)}`);
      if (!section) {
        section = groupTemplate.content.firstElementChild?.cloneNode(true) as HTMLElement;
        section.id = anchorId;
        section.setAttribute('aria-labelledby', `${anchorId}-title`);
        const heading = section.querySelector('h2');
        if (heading) {
          heading.id = `${anchorId}-title`;
          heading.textContent = letter;
        }
      }
      const grid = section.lastElementChild;
      const current = grid?.children;
      if (
        grid &&
        current &&
        (current.length !== groupCards.length ||
          groupCards.some((card, index) => card !== current[index]))
      ) {
        grid.replaceChildren(...groupCards);
      }
      sections.push(section);

      let link = nav.querySelector<HTMLElement>(`[data-nav-anchor="${CSS.escape(anchorId)}"]`);
      if (!link) {
        link = document.createElement('a');
        link.setAttribute('href', `#${anchorId}`);
        link.dataset.navAnchor = anchorId;
        link.textContent = letter;
      }
      links.push(link);
    }
    // Append only what is new: the letters already on the page keep their place and their focus.
    sections
      .filter((section) => !section.isConnected)
      .forEach((section) => groupsWrap.append(section));
    links.filter((link) => !link.isConnected).forEach((link) => nav.append(link));

    document.dispatchEvent(new Event('authors:loaded'));
    // A link to a letter that was not on the page yet (`/autori#lettera-m`).
    const target = window.location.hash
      ? document.getElementById(window.location.hash.slice(1))
      : null;
    if (
      target &&
      sections.includes(target) &&
      target.getBoundingClientRect().top > window.innerHeight
    ) {
      target.scrollIntoView();
    }
  };

  const load = () => {
    if (request || attempts >= 2) return;
    attempts += 1;
    request = fetch(url)
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error(String(response.status))),
      )
      .then(merge)
      .catch(() => {
        // One more try; after that the page keeps the letters it has.
        request = null;
        if (attempts < 2) window.setTimeout(load, 2000);
      });
  };

  // Searching needs everyone at once; otherwise wait until the page is quiet.
  root.querySelector('#author-search')?.addEventListener('focus', load, { once: true });
  if (window.location.hash) load();
  else if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 4000 });
  else globalThis.setTimeout(load, 1500);
}
