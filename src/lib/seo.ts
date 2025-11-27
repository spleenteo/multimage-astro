import type { TitleMetaLinkTag } from '@datocms/astro';
import { decodeEntities, toPlainText, truncateToLength } from '~/lib/text';

type SeoFallback = {
  title?: string | null;
  description?: string | null;
};

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeMeta = (tags: TitleMetaLinkTag[]): TitleMetaLinkTag[] =>
  tags.map((tag) => {
    if (tag.tag !== 'meta' || !tag.attributes) {
      return tag;
    }

    const descriptor = (tag.attributes.name ?? tag.attributes.property ?? '')
      .toString()
      .toLowerCase();
    const rawContent =
      (typeof tag.attributes.content === 'string' && tag.attributes.content) ||
      (typeof tag.content === 'string' ? tag.content : '') ||
      '';
    const decoded = decodeEntities(rawContent);
    const normalized = descriptor.includes('description')
      ? truncateToLength(toPlainText(decoded), 240)
      : truncateToLength(decoded, 160);
    const withoutQuotes = normalized.replace(/"/g, "'");
    const safeContent = escapeAttr(withoutQuotes);

    return {
      ...tag,
      attributes: {
        ...tag.attributes,
        content: safeContent,
      },
      content: safeContent,
    };
  });

export function withFallbackSeo(
  tags: TitleMetaLinkTag[] | null | undefined,
  fallback: SeoFallback = {},
): TitleMetaLinkTag[] {
  const result = [...(tags ?? [])];

  if (fallback.title && !result.some((tag) => tag.tag === 'title')) {
    result.push({ tag: 'title', content: fallback.title });
  }

  if (
    fallback.description &&
    !result.some((tag) => tag.tag === 'meta' && tag.attributes?.name === 'description')
  ) {
    result.push({
      tag: 'meta',
      attributes: {
        name: 'description',
        content: fallback.description,
      },
      content: null,
    });
  }

  return sanitizeMeta(result);
}
