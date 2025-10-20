import type { TitleMetaLinkTag } from '@datocms/astro';

type SeoFallback = {
  title?: string | null;
  description?: string | null;
};

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

  return result;
}
