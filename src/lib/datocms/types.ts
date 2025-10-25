import type { ResponsiveImageType } from '@datocms/astro/Image';

export type SeoMetaTag = {
  tag: string;
  attributes: Record<string, string> | null;
  content: string | null;
};

export type AssetColor = {
  hex?: string | null;
};

export type ResponsiveImage = ResponsiveImageType;

export type AssetImage = {
  url?: string | null;
  alt: string | null;
  title?: string | null;
  width: number | null;
  height: number | null;
  colors?: AssetColor[] | null;
  responsiveImage?: ResponsiveImage | null;
};

export type StructuredTextField = {
  value: {
    schema: 'dast';
    document: unknown;
  } | null;
  blocks?: Array<Record<string, unknown>>;
  links?: Array<Record<string, unknown>>;
  inlineBlocks?: Array<Record<string, unknown>>;
} | null;

export type AuthorSummaryRecord = {
  id: string;
  fullName: string | null;
  slug: string | null;
  alias: string | null;
  country: string | null;
  biography: StructuredTextField;
  sortBy: string | null;
  picture: AssetImage | null;
};

export type AuthorDetailRecord = AuthorSummaryRecord & {
  note: string | null;
  pseudonyms: Array<{
    id: string;
    fullName: string | null;
    alias?: string | null;
    slug: string | null;
  }>;
};

export type AuthorsIndexRecord = {
  title: string | null;
  subtitle: string | null;
  seo: SeoMetaTag[] | null;
};

export type BooksIndexRecord = {
  title: string | null;
  subtitle: string | null;
  seo: SeoMetaTag[] | null;
};

export type HomeRecord = {
  title: string | null;
  claim: string | null;
  seo: SeoMetaTag[] | null;
  heroImage: AssetImage | null;
  highlight?: {
    id: string;
  } | null;
};

export type ArchiveIndexRecord = {
  title: string | null;
  subtitle: string | null;
  seo: SeoMetaTag[] | null;
};

export type HighlightsIndexRecord = {
  title: string | null;
  subtitle: string | null;
  seo: SeoMetaTag[] | null;
};

export type EbooksIndexRecord = {
  title: string | null;
  subtitle: string | null;
  seo: SeoMetaTag[] | null;
};

export type MagazineIndexRecord = {
  title: string | null;
  subtitle: string | null;
  seo: SeoMetaTag[] | null;
};

export type CollectionSummaryRecord = {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  logo: AssetImage | null;
  seo?: SeoMetaTag[] | null;
};

export type CollectionsIndexRecord = {
  title: string | null;
  subtitle: string | null;
  seo: SeoMetaTag[] | null;
};

export type SuppliersIndexRecord = {
  title: string | null;
  subtitle: string | null;
  seo: SeoMetaTag[] | null;
};

export type PageRecord = {
  id: string;
  title: string | null;
  subtitle: string | null;
  slug: string | null;
  body: StructuredTextField;
  label: string | null;
  menu: boolean | null;
  seo: SeoMetaTag[] | null;
};

export type BlogCategoryRecord = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type BlogPostRecord = {
  id: string;
  title: string | null;
  slug: string | null;
  sticky: boolean | null;
  abstract: string | null;
  seo: SeoMetaTag[] | null;
  featuredImage: AssetImage | null;
  body: StructuredTextField;
  author: {
    id: string;
    name: string | null;
    slug: string | null;
    biography?: string | null;
    seo?: SeoMetaTag[] | null;
  } | null;
  category: BlogCategoryRecord | null;
  keywords?: Array<{
    id: string;
    tag?: string | null;
    slug?: string | null;
    name?: string | null;
  }> | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};
