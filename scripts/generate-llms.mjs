#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const ENDPOINT = 'https://graphql.datocms.com/';
const TOKEN = process.env.DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'LLMs.md');
const PAGE_SIZE = 100;

if (!TOKEN) {
  console.error('Missing DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN environment variable.');
  process.exitCode = 1;
  process.exit();
}

const INTRO_QUERY = `
  query LLMsIntro {
    chiSiamo: page(filter: { slug: { eq: "chi-siamo" } }) {
      title
      body {
        value
      }
    }
    laStoria: page(filter: { slug: { eq: "la-storia" } }) {
      title
      body {
        value
      }
    }
  }
`;

const BOOKS_QUERY = `
  query AllBooksBatch($first: IntType!, $skip: IntType!) {
    allBooks(orderBy: [printYear_DESC, title_ASC], first: $first, skip: $skip) {
      title
      subtitle
      slug
      collection {
        name
        slug
      }
      review {
        value
      }
      isbn
      edition
      printYear
      archive
      authors {
        fullName
        alias
        slug
        biography {
          value
        }
      }
    }
  }
`;

function normalizeWhitespace(text) {
  return text.replace(/\u00a0/g, ' ');
}

function extractDocument(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.value && typeof data.value === 'object' && data.value.document) {
    return data.value.document;
  }
  if (data.document && typeof data.document === 'object') {
    return data.document;
  }
  if (data.type && data.children) {
    return data;
  }
  return null;
}

function renderStructuredTextToMarkdown(field) {
  const root = extractDocument(field);
  if (!root) return '';

  const blocks = [];

  const renderInlines = (nodes = []) =>
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
                  content = content; // keep underline as plain text
                  break;
                case 'code':
                  content = `\`${content}\``;
                  break;
                default:
                  content = content;
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

  const renderBlock = (node, depth = 0) => {
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
              (item.children || []).map((child) => renderBlock(child, depth + 1)).filter(Boolean) ||
              [];
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
        return (node.children || []).map((child) => renderBlock(child, depth)).filter(Boolean).join('\n');
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
          return (node.children || []).map((child) => renderBlock(child, depth)).filter(Boolean).join('\n');
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

async function fetchGraphQL(query, variables = {}) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DatoCMS request failed: ${response.status} ${response.statusText}\n${text}`);
  }

  const payload = await response.json();
  if (payload.errors) {
    throw new Error(JSON.stringify(payload.errors, null, 2));
  }

  return payload.data;
}

async function fetchAllBooks() {
  let skip = 0;
  const books = [];
  while (true) {
    const data = await fetchGraphQL(BOOKS_QUERY, { first: PAGE_SIZE, skip });
    const batch = data.allBooks ?? [];
    books.push(...batch);
    if (batch.length < PAGE_SIZE) {
      break;
    }
    skip += batch.length;
  }
  return books;
}

function formatAuthorLine(author) {
  const fullName = author.fullName ? author.fullName.trim() : '';
  const alias = author.alias ? author.alias.trim() : '';
  const display = alias && alias.toLowerCase() !== fullName.toLowerCase() && fullName
    ? `${fullName} (alias: ${alias})`
    : fullName || alias || 'Autore sconosciuto';
  const url = author.slug ? `https://www.multimage.org/autori/${author.slug}` : '';
  if (display && url) {
    return `${display} | link: ${url}`;
  }
  return display || (url ? `link: ${url}` : '');
}

function appendIndentedBlock(lines, text, indent) {
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

async function generate() {
  const introData = await fetchGraphQL(INTRO_QUERY);
  const books = await fetchAllBooks();

  const lines = [];
  lines.push('# MULTIMAGE, la casa editrice dei diritti umani', '');

  if (introData.chiSiamo) {
    lines.push('## Chi siamo', '');
    const markdown = renderStructuredTextToMarkdown(introData.chiSiamo.body);
    if (markdown) {
      lines.push(markdown, '');
    }
  }

  if (introData.laStoria) {
    lines.push('## La storia', '');
    const markdown = renderStructuredTextToMarkdown(introData.laStoria.body);
    if (markdown) {
      lines.push(markdown, '');
    }
  }

  lines.push('## Catalogo libri', '');

  const sortedBooks = [...books];
  sortedBooks.sort((a, b) => {
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

  const archiveText = book.archive ? 'Libro non disponibile in catalogo' : 'Disponibile in catalogo';
  lines.push(`- archivio: ${archiveText}`);

  if (Array.isArray(book.authors) && book.authors.length > 0) {
    lines.push('- autori:');
      for (const author of book.authors) {
        const header = formatAuthorLine(author);
        lines.push(header ? `  - ${header}` : '  -');

        if (author.biography && author.biography.value) {
          const biographyText = renderStructuredTextToMarkdown(author.biography);
          if (biographyText) {
            lines.push('    biografia:');
            appendIndentedBlock(lines, biographyText, '      ');
          }
        }
      }
    }

    lines.push('');
  }

  lines.push(''); // ensure file ends with newline

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, lines.join('\n'), 'utf8');

  console.log(`Generated ${path.relative(ROOT_DIR, OUTPUT_PATH)} with ${sortedBooks.length} books.`);
}

generate().catch((error) => {
  console.error('Failed to generate LLMs catalog:', error);
  process.exitCode = 1;
});
