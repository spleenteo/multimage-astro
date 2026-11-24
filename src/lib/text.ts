const namedEntities: Record<string, string> = {
  '&quot;': '"',
  '&apos;': "'",
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&agrave;': 'à',
  '&egrave;': 'è',
  '&igrave;': 'ì',
  '&ograve;': 'ò',
  '&ugrave;': 'ù',
  '&Agrave;': 'À',
  '&Egrave;': 'È',
  '&Igrave;': 'Ì',
  '&Ograve;': 'Ò',
  '&Ugrave;': 'Ù',
  '&eacute;': 'é',
  '&Eacute;': 'É',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
  '&laquo;': '«',
  '&raquo;': '»',
  '&deg;': '°',
  '&middot;': '·',
  '&euro;': '€',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity) => {
    if (entity.startsWith('&#x')) {
      const codePoint = Number.parseInt(entity.slice(3, -1), 16);
      return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
    }

    if (entity.startsWith('&#')) {
      const codePoint = Number.parseInt(entity.slice(2, -1), 10);
      return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
    }

    return namedEntities[entity] ?? entity;
  });
}

export function toPlainText(html: string | null | undefined): string {
  if (!html) {
    return '';
  }

  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  return decodeEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

export function truncateToLength(text: string, maxLength = 160): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength).replace(/\s+\S*$/, '');
  return `${truncated}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function toRichTextHtml(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const looksLikeHtml = /<\s*\w+[^>]*>/i.test(trimmed);
  if (looksLikeHtml) {
    return trimmed;
  }

  const paragraphs = trimmed
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) {
    return null;
  }

  const renderParagraph = (text: string) => escapeHtml(text).replace(/\r?\n/g, '<br />');

  if (paragraphs.length === 1) {
    return `<p>${renderParagraph(paragraphs[0])}</p>`;
  }

  return paragraphs.map((paragraph) => `<p>${renderParagraph(paragraph)}</p>`).join('');
}

/** Drops bare URLs (and "www." addresses) from plain text, e.g. a lede pasted with its source link. */
export function withoutUrls(text: string): string {
  return text
    .replace(/(https?:\/\/|www\.)\S+/gi, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const SAFE_TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li']);
const SAFE_HREF = /^(https?:|mailto:|tel:|\/|#)/i;

/**
 * Allowlist sanitizer for short CMS WYSIWYG fragments rendered with `set:html`: keeps the inline
 * and list tags in SAFE_TAGS (attributes dropped, except a safe `href` on links), removes every
 * other tag (its text stays) and the content of script, style and similar elements. Plain text
 * without tags is escaped and wrapped in paragraphs, as `toRichTextHtml` does.
 */
export function sanitizeCmsHtml(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!/<\s*\/?\s*\w+[^>]*>/.test(trimmed)) return toRichTextHtml(trimmed);

  const html = trimmed
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?([a-zA-Z][\w-]*)\b([^>]*)>/g, (tag, rawName: string, attrs: string) => {
      const name = rawName.toLowerCase();
      if (!SAFE_TAGS.has(name)) return '';
      if (tag.startsWith('</')) return name === 'br' ? '' : `</${name}>`;
      if (name !== 'a') return `<${name}>`;
      const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
      const url = (href?.[1] ?? href?.[2] ?? href?.[3] ?? '').trim();
      if (!SAFE_HREF.test(url)) return '<a>';
      const external = /^https?:/i.test(url);
      return `<a href="${escapeHtml(url)}"${external ? ' rel="noopener noreferrer"' : ''}>`;
    })
    // A stray "<" left after the pass (not a tag) must not open one.
    .replace(/<(?![/a-z])/gi, '&lt;');
  return html.trim() || null;
}
