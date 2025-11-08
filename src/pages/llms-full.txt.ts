import type { APIRoute } from 'astro';
import { executeQuery } from '~/lib/datocms/executeQuery';
import { LLMS_BOOKS_QUERY, LLMS_INTRO_QUERY } from './llms-full/_graphql';

export const prerender = import.meta.env.PROD;

const PAGE_SIZE = 100;

type StructuredTextRecord = {
  value?: {
    document?: StructuredTextNode;
  };
  document?: StructuredTextNode;
  type?: string;
  children?: StructuredTextNode[];
};

type StructuredTextNode = {
  type?: string;
  level?: number;
  style?: string;
  marks?: string[];
  url?: string;
  value?: string;
  children?: StructuredTextNode[];
};

type IntroQueryResult = {
  chiSiamo?: {
    body?: StructuredTextRecord | null;
  } | null;
  laStoria?: {
    body?: StructuredTextRecord | null;
  } | null;
};

type BookRecord = {
  title?: string | null;
  subtitle?: string | null;
  slug?: string | null;
  collection?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  review?: StructuredTextRecord | null;
  isbn?: string | null;
  edition?: number | null;
  printYear?: string | null;
  archive?: boolean | null;
  authors?: Array<{
    fullName?: string | null;
    alias?: string | null;
    slug?: string | null;
    biography?: StructuredTextRecord | null;
  } | null> | null;
};

type BooksQueryResult = {
  allBooks: BookRecord[];
};

function normalizeWhitespace(text: string) {
  return text.replace(/\u00a0/g, ' ');
}

function extractDocument(data: StructuredTextRecord | StructuredTextNode | null | undefined) {
  if (!data || typeof data !== 'object') return null;

  if ('value' in data && data.value && typeof data.value === 'object' && 'document' in data.value) {
    return data.value.document ?? null;
  }

  if ('document' in data && data.document && typeof data.document === 'object') {
    return data.document;
  }

  if ('type' in data && 'children' in data) {
    return data as StructuredTextNode;
  }

  return null;
}

function renderStructuredTextToMarkdown(field?: StructuredTextRecord | null) {
  const root = extractDocument(field);
  if (!root) return '';

  const blocks: string[] = [];

  const renderInlines = (nodes: StructuredTextNode[] = []): string =>
    nodes
      .map((node) => {
        if (!node) {
          return '';
        }

        if (node.type === 'span') {
          const raw = normalizeWhitespace(node.value ?? '');
          const leading = raw.match(/^\s*/)?.[0] ?? '';
          const trailing = raw.match(/\s*$/)?.[0] ?? '';
          let content = raw.trim();

          if (!content) {
            return raw;
          }

          if (node.marks && Array.isArray(node.marks)) {
            for (const mark of node.marks) {
              switch (mark) {
                case 'strong':
                  content = `**${content}**`;
                  break;
                case 'emphasis':
                  content = `*${content}*`;
                  break;
                case 'underline':
                  break;
                case 'code':
                  content = `\`${content}\``;
                  break;
                default:
                  break;
              }
            }
          }
          return `${leading}${content}${trailing}`;
        }

        if (node.type === 'link') {
          const label = renderInlines(node.children || []);
          const url = node.url || '';
          return url ? `[${label}](${url})` : label;
        }

        if (node.type === 'inlineItem' || node.type === 'inlineRecord') {
          return renderInlines(node.children || []);
        }

        if (node.children && node.children.length > 0) {
          return renderInlines(node.children);
        }

        return '';
      })
      .join('');

  const renderBlock = (node: StructuredTextNode | null | undefined, depth = 0): string => {
    if (!node) {
      return '';
    }

    switch (node.type) {
      case 'paragraph': {
        const content = renderInlines(node.children || []).trim();
        return content;
      }
      case 'heading': {
        const level = Math.min(Math.max(node.level ?? 2, 1), 6);
        const content = renderInlines(node.children || []).trim();
        return `${'#'.repeat(level)} ${content}`;
      }
      case 'list': {
        const isNumbered = node.style === 'numbered';
        const indent = '  '.repeat(depth);
        return (node.children || [])
          .map((item, index) => {
            const marker = isNumbered ? `${index + 1}.` : '-';
            const paragraphs =
              (item?.children || [])
                .map((child) => renderBlock(child, depth + 1))
                .filter(Boolean) || [];
            if (paragraphs.length === 0) {
              return '';
            }
            const [first, ...rest] = paragraphs;
            const lines = [`${indent}${marker} ${first}`];
            for (const paragraph of rest) {
              const trimmed = paragraph.trim();
              if (trimmed.length === 0) {
                lines.push('');
              } else {
                lines.push(`${indent}  ${trimmed}`);
              }
            }
            return lines.join('\n');
          })
          .filter(Boolean)
          .join('\n');
      }
      case 'listItem': {
        return (node.children || [])
          .map((child) => renderBlock(child, depth))
          .filter(Boolean)
          .join('\n');
      }
      case 'blockquote': {
        const content = (node.children || [])
          .map((child) => renderBlock(child, depth))
          .filter(Boolean)
          .join('\n')
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
        return content;
      }
      default: {
        if (node.children && node.children.length > 0) {
          return (node.children || [])
            .map((child) => renderBlock(child, depth))
            .filter(Boolean)
            .join('\n');
        }
        return '';
      }
    }
  };

  for (const child of root.children || []) {
    const rendered = renderBlock(child, 0);
    if (rendered && rendered.trim().length > 0) {
      blocks.push(rendered.trim());
    }
  }

  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n');
}

function formatAuthorLine(author: NonNullable<BookRecord['authors']>[number] | undefined) {
  if (!author) return '';

  const fullName = author.fullName?.trim() ?? '';
  const alias = author.alias?.trim() ?? '';
  const display =
    alias && alias.toLowerCase() !== fullName.toLowerCase() && fullName
      ? `${fullName} (alias: ${alias})`
      : fullName || alias || 'Autore sconosciuto';
  const url = author.slug ? `https://www.multimage.org/autori/${author.slug}` : '';
  if (display && url) {
    return `${display} | link: ${url}`;
  }
  return display || (url ? `link: ${url}` : '');
}

function appendIndentedBlock(lines: string[], text: string, indent: string) {
  if (!text) {
    return;
  }
  const segments = text.split('\n');
  for (const segment of segments) {
    if (segment.trim().length === 0) {
      lines.push(indent.trimEnd());
    } else {
      lines.push(`${indent}${segment}`);
    }
  }
}

async function fetchIntro() {
  return executeQuery<IntroQueryResult>(LLMS_INTRO_QUERY);
}

async function fetchAllBooks() {
  let skip = 0;
  const books: BookRecord[] = [];

  while (true) {
    const data = await executeQuery<BooksQueryResult>(LLMS_BOOKS_QUERY, {
      variables: {
        first: PAGE_SIZE,
        skip,
      },
    });

    const batch = data.allBooks ?? [];
    books.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    skip += batch.length;
  }

  return books;
}

function buildMarkdown(intro: IntroQueryResult, books: BookRecord[]) {
  const lines: string[] = [];
  lines.push('# MULTIMAGE, la casa editrice dei diritti umani', '');

  if (intro.chiSiamo) {
    lines.push('## Chi siamo', '');
    const markdown = renderStructuredTextToMarkdown(intro.chiSiamo.body);
    if (markdown) {
      lines.push(markdown, '');
    }
  }

  if (intro.laStoria) {
    lines.push('## La storia', '');
    const markdown = renderStructuredTextToMarkdown(intro.laStoria.body);
    if (markdown) {
      lines.push(markdown, '');
    }
  }

  lines.push('## Catalogo libri', '');

  const sortedBooks = [...books].sort((a, b) => {
    const yearA = a.printYear ?? '';
    const yearB = b.printYear ?? '';
    if (yearA === yearB) {
      return (a.title || '').localeCompare(b.title || '');
    }
    return yearB.localeCompare(yearA);
  });

  for (const book of sortedBooks) {
    const title = book.title ? book.title.trim() : 'Titolo non disponibile';
    lines.push(`### ${title}`);

    if (book.subtitle) {
      lines.push(`- sottotitolo: ${book.subtitle.trim()}`);
    }

    if (book.slug) {
      lines.push(`- link: https://www.multimage.org/libri/${book.slug}`);
    }

    if (book.collection && (book.collection.name || book.collection.slug)) {
      if (book.collection.name) {
        lines.push(`- collana: ${book.collection.name.trim()}`);
      }
      if (book.collection.slug) {
        lines.push(`- link_collana: https://www.multimage.org/collane/${book.collection.slug}`);
      }
    }

    if (book.review && book.review.value) {
      const reviewText = renderStructuredTextToMarkdown(book.review);
      if (reviewText) {
        lines.push('- recensione:', '');
        appendIndentedBlock(lines, reviewText, '  ');
        lines.push('');
      }
    }

    if (book.isbn) {
      lines.push(`- isbn: ${book.isbn}`);
    }

    if (book.edition != null) {
      lines.push(`- edizione: ${book.edition}`);
    }

    if (book.printYear) {
      lines.push(`- anno: ${book.printYear}`);
    }

    const archiveText = book.archive
      ? 'Libro non disponibile in catalogo'
      : 'Disponibile in catalogo';
    lines.push(`- archivio: ${archiveText}`);

    if (Array.isArray(book.authors) && book.authors.length > 0) {
      lines.push('- autori:');
      for (const author of book.authors) {
        const header = formatAuthorLine(author);
        lines.push(header ? `  - ${header}` : '  -');

        const biographyText = author?.biography
          ? renderStructuredTextToMarkdown(author.biography)
          : '';
        if (biographyText) {
          lines.push('    biografia:');
          appendIndentedBlock(lines, biographyText, '      ');
        }
      }
    }

    lines.push('');
  }

  lines.push('');

  return lines.join('\n');
}

export const GET: APIRoute = async () => {
  const [intro, books] = await Promise.all([fetchIntro(), fetchAllBooks()]);
  const markdown = buildMarkdown(intro, books);

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
