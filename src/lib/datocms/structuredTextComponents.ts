import VideoBlock from '~/components/datocms/structuredText/blocks/VideoBlock.astro';
import SingleBookBlock from '~/components/datocms/structuredText/blocks/SingleBookBlock.astro';
import SingleAuthorBlock from '~/components/datocms/structuredText/blocks/SingleAuthorBlock.astro';
import BannerBlock from '~/components/datocms/structuredText/blocks/BannerBlock.astro';
import ImageBlock from '~/components/datocms/structuredText/blocks/ImageBlock.astro';
import CtaButtonWithImageBlock from '~/components/datocms/structuredText/blocks/CtaButtonWithImageBlock.astro';
import InlineRecordBlock from '~/components/datocms/structuredText/InlineRecordBlock.astro';
import LinkToRecord from '~/components/datocms/structuredText/LinkToRecord.astro';

type StructuredTextComponentMap = Record<string, unknown>;

export const defaultBlockComponents: StructuredTextComponentMap = {
  VideoRecord: VideoBlock,
  SingleBookRecord: SingleBookBlock,
  SingleAuthorRecord: SingleAuthorBlock,
  BannerRecord: BannerBlock,
  ImageBlockRecord: ImageBlock,
  CtaButtonWithImageRecord: CtaButtonWithImageBlock,
};

export const defaultInlineBlockComponents: StructuredTextComponentMap = {
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
