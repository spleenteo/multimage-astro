import VideoBlock from '~/components/datocms/structuredText/blocks/VideoBlock.astro';
import SingleBookBlock from '~/components/datocms/structuredText/blocks/SingleBookBlock.astro';
import SingleAuthorBlock from '~/components/datocms/structuredText/blocks/SingleAuthorBlock.astro';
import BannerBlock from '~/components/datocms/structuredText/blocks/BannerBlock.astro';
import ImageBlock from '~/components/datocms/structuredText/blocks/ImageBlock.astro';
import CtaButtonWithImageBlock from '~/components/datocms/structuredText/blocks/CtaButtonWithImageBlock.astro';
import BookCarouselBlock from '~/components/datocms/structuredText/blocks/BookCarouselBlock.astro';
import InlineRecordBlock from '~/components/datocms/structuredText/InlineRecordBlock.astro';
import LinkToRecord from '~/components/datocms/structuredText/LinkToRecord.astro';
import LinkNode from '~/components/datocms/structuredText/nodes/Link.astro';

type StructuredTextComponentMap = Record<string, unknown>;

export const defaultBlockComponents: StructuredTextComponentMap = {
  VideoRecord: VideoBlock,
  SingleBookRecord: SingleBookBlock,
  SingleAuthorRecord: SingleAuthorBlock,
  BannerRecord: BannerBlock,
  ImageBlockRecord: ImageBlock,
  CtaButtonWithImageRecord: CtaButtonWithImageBlock,
  BookCarouselRecord: BookCarouselBlock,
};

/** Records placed inline in the text (`inlineItem` nodes): pass as `inlineRecordComponents`. */
export const defaultInlineRecordComponents: StructuredTextComponentMap = {
  AuthorRecord: InlineRecordBlock,
  CollectionRecord: InlineRecordBlock,
  PageRecord: InlineRecordBlock,
  BookRecord: InlineRecordBlock,
  BlogPostRecord: InlineRecordBlock,
};

export const defaultLinkToRecordComponents: StructuredTextComponentMap = {
  AuthorRecord: LinkToRecord,
  CollectionRecord: LinkToRecord,
  PageRecord: LinkToRecord,
  BookRecord: LinkToRecord,
  BlogPostRecord: LinkToRecord,
};

/** Node overrides: plain links (own-domain URLs made relative, new tabs announced). */
export const defaultNodeOverrides: StructuredTextComponentMap = {
  link: LinkNode,
};
