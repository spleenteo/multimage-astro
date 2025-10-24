export type SeoMetaTag = {
  tag: string;
  attributes: Record<string, string> | null;
  content: string | null;
};

export type AssetColor = {
  hex?: string | null;
};

export type ResponsiveImage = {
  src: string;
  width: number;
  height: number;
  srcSet?: string | null;
  sizes?: string | null;
  alt?: string | null;
  title?: string | null;
  base64?: string | null;
  bgColor?: string | null;
};

export type AssetImage = {
  url?: string | null;
  alt: string | null;
  title?: string | null;
  width: number | null;
  height: number | null;
  colors?: AssetColor[] | null;
  responsiveImage?: ResponsiveImage | null;
};

export type AuthorSummaryRecord = {
  id: string;
  fullName: string | null;
  slug: string | null;
  alias: string | null;
  country: string | null;
  biography: string | null;
  sortBy: string | null;
  picture: AssetImage | null;
};

export type AuthorDetailRecord = AuthorSummaryRecord & {
  note: string | null;
  pseudonyms: Array<{
    id: string;
    fullName: string | null;
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
  body: string | null;
  label: string | null;
  menu: boolean | null;
  seo: SeoMetaTag[] | null;
};
