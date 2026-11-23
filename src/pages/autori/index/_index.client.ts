// Browser side of /autori: the server renders the first letters and the whole letter strip; this
// adds the other letters from `/authors-index.json` once the page is idle (at once when the reader
// searches, follows a letter that is not there yet, or comes back to a scroll position further
// down), with letter groups and cards cloned from the moulds the server rendered.
// `data-index-state` on the root (loading | loaded | failed) and the `authors:loaded` event tell
// the inline search script when to filter again.
import type { AuthorIndexItem } from '~/lib/authorIndex';
import { fillAuthorCard } from '~/components/AuthorCard/fill.client';

const SCROLL_KEY = 'autori:scroll';

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
  // Where to go once the letters exist: a letter's anchor, or a scroll position to restore.
  let pendingAnchor: string | null = null;
  let pendingScroll: number | null = null;
  // The reader moved on their own since then: do not pull the page from under them.
  let moved = false;
  const markMoved = () => {
    moved = true;
  };
  ['wheel', 'touchmove', 'keydown'].forEach((type) =>
    window.addEventListener(type, markMoved, { passive: true, once: true }),
  );

  const merge = (authors: AuthorIndexItem[]) => {
    const cards = new Map<string, HTMLElement>();
    groupsWrap.querySelectorAll<HTMLElement>('[data-author-card][data-key]').forEach((card) => {
      if (card.dataset.key) cards.set(card.dataset.key, card);
    });

    // Letters in the JSON's order, each with its cards in order (server-rendered ones reused).
    const letters = new Map<string, { letter: string; cards: HTMLElement[] }>();
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
      const group = letters.get(author.a) ?? { letter: author.l, cards: [] };
      group.cards.push(card);
      letters.set(author.a, group);
    }

    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const sections: HTMLElement[] = [];
    for (const [anchorId, { letter, cards: groupCards }] of letters) {
      let section = document.getElementById(anchorId);
      if (!section || !groupsWrap.contains(section)) {
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

      const link = nav.querySelector<HTMLElement>(`[data-nav-anchor="${CSS.escape(anchorId)}"]`);
      link?.removeAttribute('data-nav-pending');
    }
    // New letters take their place in the JSON's order, before the next letter already on the page.
    for (let index = sections.length - 1; index >= 0; index -= 1) {
      const section = sections[index];
      if (section.isConnected) continue;
      const next = sections[index + 1];
      if (next?.isConnected) groupsWrap.insertBefore(section, next);
      else groupsWrap.append(section);
    }
    // A letter of the strip with no author in the JSON has nothing to point at.
    nav
      .querySelectorAll<HTMLElement>('[data-nav-pending]')
      .forEach((link) => link.setAttribute('hidden', ''));
    // Re-inserting a card blurs it: give the focus back.
    if (active?.isConnected && document.activeElement !== active) {
      active.focus({ preventScroll: true });
    }

    root.dataset.indexState = 'loaded';
    document.dispatchEvent(new Event('authors:loaded'));

    if (pendingAnchor) document.getElementById(pendingAnchor)?.scrollIntoView();
    else if (pendingScroll !== null && !moved)
      window.scrollTo({ top: pendingScroll, behavior: 'instant' });
    pendingAnchor = null;
    pendingScroll = null;
  };

  const load = () => {
    if (request || attempts >= 2 || root.dataset.indexState === 'loaded') return;
    attempts += 1;
    root.dataset.indexState = 'loading';
    request = fetch(url)
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error(String(response.status))),
      )
      .then(merge)
      .catch(() => {
        // One more try; after that the page keeps the letters it has and the search says so.
        request = null;
        if (attempts < 2) {
          window.setTimeout(load, 2000);
          return;
        }
        root.dataset.indexState = 'failed';
        document.dispatchEvent(new Event('authors:loaded'));
      });
  };

  // A letter whose authors are not on the page yet: fetch, then go there.
  nav.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLElement>('[data-nav-pending]');
    if (!link?.dataset.navAnchor) return;
    pendingAnchor = link.dataset.navAnchor;
    moved = false;
    attempts = Math.min(attempts, 1);
    load();
  });

  // Coming back (or reloading) further down than the server letters reach: restore the position.
  window.addEventListener('pagehide', () => {
    try {
      window.sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
    } catch {
      // Storage can be unavailable: the position is then simply not restored.
    }
  });
  const navigation = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined;
  let saved = 0;
  try {
    saved = Number(window.sessionStorage.getItem(SCROLL_KEY)) || 0;
  } catch {
    saved = 0;
  }
  const returning = navigation?.type === 'back_forward' || navigation?.type === 'reload';
  const hashTarget = window.location.hash.slice(1);

  // Searching needs everyone at once; otherwise wait until the page is quiet.
  root.querySelector('#author-search')?.addEventListener('focus', load, { once: true });
  if (hashTarget && !document.getElementById(hashTarget)) {
    pendingAnchor = hashTarget;
    load();
  } else if (returning && saved > document.documentElement.scrollHeight - window.innerHeight) {
    pendingScroll = saved;
    load();
  } else if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 4000 });
  else globalThis.setTimeout(load, 1500);
}
