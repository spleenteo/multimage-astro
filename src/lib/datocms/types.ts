
export type SeoMetaTag = {
  tag: string;
  attributes: Record<string, string> | null;
  content: string | null;
};

export type AssetColor = {
  hex?: string | null;
};

export type AssetImage = {
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  colors?: AssetColor[] | null;
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
