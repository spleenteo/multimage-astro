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
