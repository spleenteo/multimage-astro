import { ItemTypeDefinition } from '@datocms/cma-client';
type EnvironmentSettings = {
  locales: 'it';
};
export type Author = ItemTypeDefinition<
  EnvironmentSettings,
  '70445',
  {
    full_name: {
      type: 'string';
    };
    sort_by: {
      type: 'string';
    };
    alias: {
      type: 'string';
    };
    pseudonyms: {
      type: 'links';
    };
    country: {
      type: 'string';
    };
    biography: {
      type: 'structured_text';
    };
    picture: {
      type: 'file';
    };
    slug: {
      type: 'slug';
    };
    email: {
      type: 'string';
    };
    phone: {
      type: 'string';
    };
    note: {
      type: 'text';
    };
  }
>;
export type FaqSection = ItemTypeDefinition<
  EnvironmentSettings,
  'QkR2_FyOQrKHP2IdQYmRWw',
  {
    display_options: {
      type: 'string';
    };
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    questions: {
      type: 'rich_text';
      blocks: Question;
    };
  }
>;
export type Question = ItemTypeDefinition<
  EnvironmentSettings,
  'CiaFELTbTVaDalASzzCh-g',
  {
    question: {
      type: 'string';
    };
    answer: {
      type: 'structured_text';
      blocks: NewsletterSubscription | CtaButtonWithImage;
    };
  }
>;
export type NewsletterSubscription = ItemTypeDefinition<
  EnvironmentSettings,
  'JL95W2TbQkq54DqhCfeN2w',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    button_label: {
      type: 'string';
    };
  }
>;
export type CtaButtonWithImage = ItemTypeDefinition<
  EnvironmentSettings,
  'dS2Z8nuURz6Pem2fHRN2tQ',
  {
    image: {
      type: 'file';
    };
    title: {
      type: 'string';
    };
    content: {
      type: 'text';
    };
    buttons: {
      type: 'rich_text';
      blocks: Button;
    };
  }
>;
export type Button = ItemTypeDefinition<
  EnvironmentSettings,
  'NT-1f6AdRFuEqgoY824_uw',
  {
    label: {
      type: 'string';
    };
    url: {
      type: 'string';
    };
    primary: {
      type: 'boolean';
    };
  }
>;
export type BlogPost = ItemTypeDefinition<
  EnvironmentSettings,
  '184824',
  {
    slug: {
      type: 'slug';
    };
    title: {
      type: 'string';
    };
    sticky: {
      type: 'boolean';
    };
    seo: {
      type: 'seo';
    };
    author: {
      type: 'link';
    };
    featured_image: {
      type: 'file';
    };
    abstract: {
      type: 'text';
    };
    category: {
      type: 'link';
    };
    body: {
      type: 'structured_text';
      blocks: CtaButtonWithImage | Video | SingleBook | SingleAuthor | Banner | ImageBlock;
      inline_blocks: Author | Page | Book | BlogPost;
    };
    keywords: {
      type: 'links';
    };
  }
>;
export type BlogCategory = ItemTypeDefinition<
  EnvironmentSettings,
  '70453',
  {
    name: {
      type: 'string';
    };
    description: {
      type: 'text';
    };
    slug: {
      type: 'slug';
    };
  }
>;
export type MagazineIndex = ItemTypeDefinition<
  EnvironmentSettings,
  'Hvp_-y8hTkaEMfZDVmHf-g',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type SingleBook = ItemTypeDefinition<
  EnvironmentSettings,
  'ErrM9cdtQ3u-NUZT_49EdA',
  {
    book: {
      type: 'link';
    };
  }
>;
export type Book = ItemTypeDefinition<
  EnvironmentSettings,
  '70450',
  {
    copyright: {
      type: 'string';
    };
    edited_by: {
      type: 'boolean';
    };
    isbn: {
      type: 'string';
    };
    slug: {
      type: 'slug';
    };
    subtitle: {
      type: 'string';
    };
    title: {
      type: 'string';
    };
    price: {
      type: 'float';
    };
    pages: {
      type: 'integer';
    };
    description: {
      type: 'text';
    };
    promo: {
      type: 'string';
    };
    license: {
      type: 'link';
    };
    seo: {
      type: 'seo';
    };
    highlight: {
      type: 'boolean';
    };
    authors: {
      type: 'links';
    };
    layout_artist: {
      type: 'string';
    };
    epub_url: {
      type: 'string';
    };
    print_year: {
      type: 'date';
    };
    review: {
      type: 'structured_text';
    };
    archive: {
      type: 'boolean';
    };
    edition: {
      type: 'integer';
    };
    collection: {
      type: 'link';
    };
    illustrator: {
      type: 'string';
    };
    stock: {
      type: 'integer';
    };
    first_print_year: {
      type: 'integer';
    };
    cover_designer: {
      type: 'string';
    };
    format: {
      type: 'string';
    };
    cover_image: {
      type: 'file';
    };
    reprints: {
      type: 'rich_text';
      blocks: Reprint;
    };
    dimensions: {
      type: 'string';
    };
    original_title: {
      type: 'string';
    };
    original_lang: {
      type: 'string';
    };
    translator: {
      type: 'string';
    };
    keywords: {
      type: 'links';
    };
  }
>;
export type BlogPostOld = ItemTypeDefinition<
  EnvironmentSettings,
  '70452',
  {
    sticky: {
      type: 'boolean';
    };
    title: {
      type: 'string';
    };
    category: {
      type: 'link';
    };
    author: {
      type: 'link';
    };
    featured_image: {
      type: 'file';
    };
    abstract: {
      type: 'text';
    };
    tags: {
      type: 'links';
    };
    related_posts: {
      type: 'links';
    };
    slug: {
      type: 'slug';
    };
    seo: {
      type: 'seo';
    };
    body_old: {
      type: 'text';
    };
  }
>;
export type SingleAuthor = ItemTypeDefinition<
  EnvironmentSettings,
  'VdpvBBQAR0ykrmM4yRYhlQ',
  {
    author: {
      type: 'link';
    };
  }
>;
export type ImageBlock = ItemTypeDefinition<
  EnvironmentSettings,
  '184826',
  {
    image: {
      type: 'file';
    };
    caption: {
      type: 'string';
    };
  }
>;
export type Video = ItemTypeDefinition<
  EnvironmentSettings,
  '184828',
  {
    video: {
      type: 'video';
    };
  }
>;
export type Page = ItemTypeDefinition<
  EnvironmentSettings,
  '70448',
  {
    menu: {
      type: 'boolean';
    };
    label: {
      type: 'string';
    };
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'string';
    };
    featured_image: {
      type: 'file';
    };
    body: {
      type: 'structured_text';
      blocks: ImageBlock | Video | Banner | SingleBook | SingleAuthor;
      inline_blocks: Author | Collection | Page | Book | BlogPost;
    };
    layout: {
      type: 'string';
    };
    slug: {
      type: 'slug';
    };
    seo: {
      type: 'seo';
    };
    position: {
      type: 'integer';
    };
  }
>;
export type Supplier = ItemTypeDefinition<
  EnvironmentSettings,
  '70444',
  {
    name: {
      type: 'string';
    };
    logo: {
      type: 'file';
    };
    city: {
      type: 'string';
    };
    region: {
      type: 'string';
    };
    address: {
      type: 'string';
    };
    telephone: {
      type: 'string';
    };
    description: {
      type: 'text';
    };
    url: {
      type: 'string';
    };
    email: {
      type: 'string';
    };
    map: {
      type: 'lat_lon';
    };
  }
>;
export type SuppliersIndex = ItemTypeDefinition<
  EnvironmentSettings,
  '177742',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type CollectionsIndex = ItemTypeDefinition<
  EnvironmentSettings,
  '177447',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    cover: {
      type: 'file';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type HighlightsIndex = ItemTypeDefinition<
  EnvironmentSettings,
  '177589',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type BlogTag = ItemTypeDefinition<
  EnvironmentSettings,
  '70454',
  {
    name: {
      type: 'string';
    };
    description: {
      type: 'text';
    };
    slug: {
      type: 'string';
    };
  }
>;
export type Collection = ItemTypeDefinition<
  EnvironmentSettings,
  '70447',
  {
    name: {
      type: 'string';
    };
    description: {
      type: 'text';
    };
    slug: {
      type: 'slug';
    };
    logo: {
      type: 'file';
    };
  }
>;
export type Homeslide = ItemTypeDefinition<
  EnvironmentSettings,
  '70446',
  {
    ref: {
      type: 'integer';
    };
    claim: {
      type: 'string';
    };
    title: {
      type: 'string';
    };
    url: {
      type: 'string';
    };
    description: {
      type: 'text';
    };
    online: {
      type: 'boolean';
    };
    item_position: {
      type: 'integer';
    };
    creation_date: {
      type: 'date_time';
    };
    updated_date: {
      type: 'date_time';
    };
    image_image_uid: {
      type: 'file';
    };
  }
>;
export type License = ItemTypeDefinition<
  EnvironmentSettings,
  '183992',
  {
    code: {
      type: 'string';
    };
    name: {
      type: 'string';
    };
    position: {
      type: 'integer';
    };
  }
>;
export type Banner = ItemTypeDefinition<
  EnvironmentSettings,
  '1936637',
  {
    featured_image: {
      type: 'file';
    };
    title: {
      type: 'string';
    };
    content: {
      type: 'text';
    };
    link: {
      type: 'string';
    };
    image_position: {
      type: 'string';
    };
  }
>;
export type BooksIndex = ItemTypeDefinition<
  EnvironmentSettings,
  '171774',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type EbooksIndex = ItemTypeDefinition<
  EnvironmentSettings,
  '180517',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type Section = ItemTypeDefinition<
  EnvironmentSettings,
  '184825',
  {
    title: {
      type: 'string';
    };
    body: {
      type: 'text';
    };
  }
>;
export type Reprint = ItemTypeDefinition<
  EnvironmentSettings,
  '181484',
  {
    number: {
      type: 'integer';
    };
    circulation: {
      type: 'integer';
    };
    year: {
      type: 'date';
    };
  }
>;
export type BlogAuthor = ItemTypeDefinition<
  EnvironmentSettings,
  '181489',
  {
    name: {
      type: 'string';
    };
    biography: {
      type: 'text';
    };
    slug: {
      type: 'slug';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type ArchiveIndex = ItemTypeDefinition<
  EnvironmentSettings,
  '177591',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type AuthorsIndex = ItemTypeDefinition<
  EnvironmentSettings,
  '177592',
  {
    title: {
      type: 'string';
    };
    subtitle: {
      type: 'text';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type Keyword = ItemTypeDefinition<
  EnvironmentSettings,
  '1295615',
  {
    name: {
      type: 'string';
    };
  }
>;
export type Home = ItemTypeDefinition<
  EnvironmentSettings,
  '152502',
  {
    highlight: {
      type: 'link';
    };
    newsletter_title: {
      type: 'string';
    };
    cta_title: {
      type: 'string';
    };
    title: {
      type: 'string';
    };
    claim: {
      type: 'text';
    };
    hero_title: {
      type: 'string';
    };
    newsletter_body: {
      type: 'text';
    };
    cta_body: {
      type: 'text';
    };
    hero_image: {
      type: 'file';
    };
    banners: {
      type: 'rich_text';
      blocks: Banner | SingleBook | CtaButtonWithImage;
    };
    banner: {
      type: 'file';
    };
    banner_url: {
      type: 'string';
    };
    hero_body: {
      type: 'text';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type AnyBlock =
  | FaqSection
  | Question
  | NewsletterSubscription
  | CtaButtonWithImage
  | Button
  | SingleBook
  | SingleAuthor
  | ImageBlock
  | Video
  | Banner
  | Section
  | Reprint;
export type AnyModel =
  | Author
  | BlogPost
  | BlogCategory
  | MagazineIndex
  | Book
  | BlogPostOld
  | Page
  | Supplier
  | SuppliersIndex
  | CollectionsIndex
  | HighlightsIndex
  | BlogTag
  | Collection
  | Homeslide
  | License
  | BooksIndex
  | EbooksIndex
  | BlogAuthor
  | ArchiveIndex
  | AuthorsIndex
  | Keyword
  | Home;
export type AnyBlockOrModel = AnyBlock | AnyModel;
