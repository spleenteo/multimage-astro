import { ItemTypeDefinition } from '@datocms/cma-client';
type EnvironmentSettings = {
  locales: 'it';
};
export type IndexPage = ItemTypeDefinition<
  EnvironmentSettings,
  'fAa-reI7QymIa_MCsJxNlQ',
  {
    title: {
      type: 'string';
    };
    subtitle: {
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
export type Author = ItemTypeDefinition<
  EnvironmentSettings,
  '70445',
  {
    email_private: {
      type: 'string';
    };
    full_name: {
      type: 'string';
    };
    phone_private: {
      type: 'string';
    };
    sort_by: {
      type: 'string';
    };
    note_private: {
      type: 'text';
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
  }
>;
export type Supplier = ItemTypeDefinition<
  EnvironmentSettings,
  '70444',
  {
    url: {
      type: 'string';
    };
    name: {
      type: 'string';
    };
    city: {
      type: 'string';
    };
    email: {
      type: 'string';
    };
    region: {
      type: 'string';
    };
    logo: {
      type: 'file';
    };
    telephone: {
      type: 'string';
    };
    address: {
      type: 'string';
    };
    map: {
      type: 'lat_lon';
    };
    description: {
      type: 'text';
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
export type SingleBook = ItemTypeDefinition<
  EnvironmentSettings,
  'ErrM9cdtQ3u-NUZT_49EdA',
  {
    book: {
      type: 'link';
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
export type BookCarousel = ItemTypeDefinition<
  EnvironmentSettings,
  'GIeyoYr9QKOsVnBTSxGpiw',
  {
    title: {
      type: 'string';
    };
    description: {
      type: 'text';
    };
    books: {
      type: 'links';
    };
  }
>;
export type PillsBlock = ItemTypeDefinition<
  EnvironmentSettings,
  'HZi-jubFRamxNRRshwBsng',
  {
    title: {
      type: 'string';
    };
    description: {
      type: 'text';
    };
    pills_block: {
      type: 'rich_text';
      blocks: SingleInfoBlock;
    };
  }
>;
export type SingleInfoBlock = ItemTypeDefinition<
  EnvironmentSettings,
  'LC9IkC3SQfeCI8hNLSoLww',
  {
    icon: {
      type: 'string';
    };
    title: {
      type: 'string';
    };
    content: {
      type: 'text';
    };
    button: {
      type: 'single_block';
      blocks: Button;
    };
  }
>;
export type CoverSize = ItemTypeDefinition<
  EnvironmentSettings,
  'cj2JswthQqK9y4JL20VDdw',
  {
    dimensions: {
      type: 'string';
    };
  }
>;
export type BlogPost = ItemTypeDefinition<
  EnvironmentSettings,
  '184824',
  {
    author: {
      type: 'link';
    };
    title: {
      type: 'string';
    };
    slug: {
      type: 'slug';
    };
    seo: {
      type: 'seo';
    };
    category: {
      type: 'link';
    };
    featured_image: {
      type: 'file';
    };
    keywords: {
      type: 'links';
    };
    abstract: {
      type: 'text';
    };
    sticky: {
      type: 'boolean';
    };
    body: {
      type: 'structured_text';
      blocks:
        | BookCarousel
        | CtaButtonWithImage
        | SingleBook
        | SingleAuthor
        | ImageBlock
        | Video
        | Banner;
      inline_blocks: Author | Page | Book | BlogPost;
    };
  }
>;
export type Home = ItemTypeDefinition<
  EnvironmentSettings,
  '152502',
  {
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
      blocks:
        | Banner
        | SingleBook
        | BookCarousel
        | PillsBlock
        | CtaButtonWithImage;
    };
    seo: {
      type: 'seo';
    };
  }
>;
export type Book = ItemTypeDefinition<
  EnvironmentSettings,
  '70450',
  {
    slug: {
      type: 'slug';
    };
    edited_by: {
      type: 'boolean';
    };
    copyright: {
      type: 'string';
    };
    isbn: {
      type: 'string';
    };
    subtitle: {
      type: 'string';
    };
    price: {
      type: 'float';
    };
    title: {
      type: 'string';
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
    stock: {
      type: 'integer';
    };
    illustrator: {
      type: 'string';
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
    dimension: {
      type: 'link';
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
export type SingleAuthor = ItemTypeDefinition<
  EnvironmentSettings,
  'VdpvBBQAR0ykrmM4yRYhlQ',
  {
    author: {
      type: 'link';
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
export type Page = ItemTypeDefinition<
  EnvironmentSettings,
  '70448',
  {
    label: {
      type: 'string';
    };
    slug: {
      type: 'slug';
    };
    menu: {
      type: 'boolean';
    };
    seo: {
      type: 'seo';
    };
    title: {
      type: 'string';
    };
    menu_footer: {
      type: 'boolean';
    };
    subtitle: {
      type: 'string';
    };
    featured_image: {
      type: 'file';
    };
    body: {
      type: 'structured_text';
      blocks:
        | BookCarousel
        | SingleBook
        | SingleAuthor
        | ImageBlock
        | Video
        | Banner;
      inline_blocks: Author | Collection | Page | Book | BlogPost;
    };
    layout: {
      type: 'string';
    };
    position: {
      type: 'integer';
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
export type MenuItem = ItemTypeDefinition<
  EnvironmentSettings,
  'HgR65F53QMCb2K39_hHZZw',
  {
    label: {
      type: 'string';
    };
    page: {
      type: 'link';
    };
  }
>;
export type App = ItemTypeDefinition<
  EnvironmentSettings,
  'ZwV1BuKbRiGcG4zyhazrrw',
  {
    callout_background: {
      type: 'color';
    };
    footer_text: {
      type: 'structured_text';
    };
    nav_items: {
      type: 'rich_text';
      blocks: MenuItem | MenuDropdown | MenuExternalItem;
      localized: true;
    };
    callout_text: {
      type: 'text';
    };
    footer_links: {
      type: 'rich_text';
      blocks: FooterMenuBlock;
      localized: true;
    };
    social_links: {
      type: 'rich_text';
      blocks: SocialLink;
    };
    legal_text: {
      type: 'structured_text';
      localized: true;
    };
  }
>;
export type SocialLink = ItemTypeDefinition<
  EnvironmentSettings,
  'Uoswkz_uQ4ibh_EoJ-DwkQ',
  {
    platform: {
      type: 'string';
    };
    url: {
      type: 'string';
    };
    icon_name: {
      type: 'string';
    };
  }
>;
export type FooterMenuBlock = ItemTypeDefinition<
  EnvironmentSettings,
  'RkbPKoyQTc-ZOyS_6ou0vw',
  {
    widget_label: {
      type: 'string';
    };
    nav_links: {
      type: 'rich_text';
      blocks: MenuItem | MenuExternalItem;
    };
  }
>;
export type MenuDropdown = ItemTypeDefinition<
  EnvironmentSettings,
  'KqTe02scRaOINXc7vgwjbA',
  {
    static_label: {
      type: 'string';
    };
    pages: {
      type: 'rich_text';
      blocks: MenuItem | MenuExternalItem;
    };
  }
>;
export type MenuExternalItem = ItemTypeDefinition<
  EnvironmentSettings,
  'Y3bk-wH6TKibydUwoN1eBA',
  {
    label: {
      type: 'string';
    };
    url: {
      type: 'string';
    };
  }
>;
export type AnyBlock =
  | Video
  | Reprint
  | SingleBook
  | FaqSection
  | Question
  | NewsletterSubscription
  | Button
  | BookCarousel
  | PillsBlock
  | SingleInfoBlock
  | CtaButtonWithImage
  | ImageBlock
  | SingleAuthor
  | Banner
  | MenuItem
  | SocialLink
  | FooterMenuBlock
  | MenuDropdown
  | MenuExternalItem;
export type AnyModel =
  | IndexPage
  | Author
  | Supplier
  | EbooksIndex
  | BlogAuthor
  | ArchiveIndex
  | Keyword
  | CoverSize
  | BlogPost
  | Home
  | Book
  | BlogCategory
  | License
  | MagazineIndex
  | BlogPostOld
  | BlogTag
  | Homeslide
  | AuthorsIndex
  | Page
  | Collection
  | SuppliersIndex
  | CollectionsIndex
  | HighlightsIndex
  | BooksIndex
  | App;
export type AnyBlockOrModel = AnyBlock | AnyModel;
