import type { ItemTypeDefinition } from '@datocms/cma-client';

type EnvironmentSettings = {
  locales: 'it';
};

export type Supplier = ItemTypeDefinition<
  EnvironmentSettings,
  '70444',
  {
    city: {
      type: 'string';
    };
    name: {
      type: 'string';
    };
    url: {
      type: 'string';
    };
    email: {
      type: 'string';
    };
    logo: {
      type: 'file';
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
    map: {
      type: 'lat_lon';
    };
    description: {
      type: 'text';
    };
  }
>;
export const Supplier = {
  ID: '70444',
  REF: { type: 'item_type', id: '70444' },
} as const;

export type Author = ItemTypeDefinition<
  EnvironmentSettings,
  '70445',
  {
    biography_short: {
      type: 'structured_text';
    };
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
    alias: {
      type: 'string';
    };
    note_private: {
      type: 'text';
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
export const Author = {
  ID: '70445',
  REF: { type: 'item_type', id: '70445' },
} as const;

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
export const Collection = {
  ID: '70447',
  REF: { type: 'item_type', id: '70447' },
} as const;

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
    };
    layout: {
      type: 'string';
    };
    position: {
      type: 'integer';
    };
  }
>;
export const Page = {
  ID: '70448',
  REF: { type: 'item_type', id: '70448' },
} as const;

export type Book = ItemTypeDefinition<
  EnvironmentSettings,
  '70450',
  {
    isbn: {
      type: 'string';
    };
    price: {
      type: 'float';
    };
    reviews: {
      type: 'links';
    };
    edited_by: {
      type: 'boolean';
    };
    review_short: {
      type: 'structured_text';
    };
    slug: {
      type: 'slug';
    };
    copyright: {
      type: 'string';
    };
    subtitle: {
      type: 'string';
    };
    title: {
      type: 'string';
    };
    seo: {
      type: 'seo';
    };
    description: {
      type: 'text';
    };
    promo: {
      type: 'string';
    };
    highlight: {
      type: 'boolean';
    };
    authors: {
      type: 'links';
    };
    pages: {
      type: 'integer';
    };
    license: {
      type: 'link';
    };
    review: {
      type: 'structured_text';
    };
    print_year: {
      type: 'date';
    };
    archive: {
      type: 'boolean';
    };
    epub_url: {
      type: 'string';
    };
    layout_artist: {
      type: 'string';
    };
    illustrator: {
      type: 'string';
    };
    edition: {
      type: 'integer';
    };
    stock: {
      type: 'integer';
    };
    collection: {
      type: 'link';
    };
    format: {
      type: 'string';
    };
    first_print_year: {
      type: 'integer';
    };
    cover_designer: {
      type: 'string';
    };
    reprints: {
      type: 'rich_text';
      blocks: Reprint;
    };
    cover_image: {
      type: 'file';
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
export const Book = {
  ID: '70450',
  REF: { type: 'item_type', id: '70450' },
} as const;

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
export const BlogPostOld = {
  ID: '70452',
  REF: { type: 'item_type', id: '70452' },
} as const;

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
export const BlogCategory = {
  ID: '70453',
  REF: { type: 'item_type', id: '70453' },
} as const;

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
export const BlogTag = {
  ID: '70454',
  REF: { type: 'item_type', id: '70454' },
} as const;

export type Home = ItemTypeDefinition<
  EnvironmentSettings,
  '152502',
  {
    cta_title: {
      type: 'string';
    };
    newsletter_title: {
      type: 'string';
    };
    title: {
      type: 'string';
    };
    claim: {
      type: 'text';
    };
    cta_body: {
      type: 'text';
    };
    newsletter_body: {
      type: 'text';
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
    hero_image: {
      type: 'file';
    };
    seo: {
      type: 'seo';
    };
  }
>;
export const Home = {
  ID: '152502',
  REF: { type: 'item_type', id: '152502' },
} as const;

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
export const Reprint = {
  ID: '181484',
  REF: { type: 'item_type', id: '181484' },
} as const;

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
export const BlogAuthor = {
  ID: '181489',
  REF: { type: 'item_type', id: '181489' },
} as const;

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
export const License = {
  ID: '183992',
  REF: { type: 'item_type', id: '183992' },
} as const;

export type BlogPost = ItemTypeDefinition<
  EnvironmentSettings,
  '184824',
  {
    author: {
      type: 'link';
    };
    slug: {
      type: 'slug';
    };
    title: {
      type: 'string';
    };
    category: {
      type: 'link';
    };
    featured_image: {
      type: 'file';
    };
    seo: {
      type: 'seo';
    };
    abstract: {
      type: 'text';
    };
    keywords: {
      type: 'links';
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
    };
    sticky: {
      type: 'boolean';
    };
  }
>;
export const BlogPost = {
  ID: '184824',
  REF: { type: 'item_type', id: '184824' },
} as const;

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
export const ImageBlock = {
  ID: '184826',
  REF: { type: 'item_type', id: '184826' },
} as const;

export type Video = ItemTypeDefinition<
  EnvironmentSettings,
  '184828',
  {
    video: {
      type: 'video';
    };
  }
>;
export const Video = {
  ID: '184828',
  REF: { type: 'item_type', id: '184828' },
} as const;

export type Keyword = ItemTypeDefinition<
  EnvironmentSettings,
  '1295615',
  {
    name: {
      type: 'string';
    };
  }
>;
export const Keyword = {
  ID: '1295615',
  REF: { type: 'item_type', id: '1295615' },
} as const;

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
export const Banner = {
  ID: '1936637',
  REF: { type: 'item_type', id: '1936637' },
} as const;

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
export const Question = {
  ID: 'CiaFELTbTVaDalASzzCh-g',
  REF: { type: 'item_type', id: 'CiaFELTbTVaDalASzzCh-g' },
} as const;

export type ProjectComment = ItemTypeDefinition<
  EnvironmentSettings,
  'DSifBVWPSki5p1x3eJqjNA',
  {
    model_id: {
      type: 'string';
    };
    record_id: {
      type: 'string';
    };
    content: {
      type: 'json';
    };
  }
>;
export const ProjectComment = {
  ID: 'DSifBVWPSki5p1x3eJqjNA',
  REF: { type: 'item_type', id: 'DSifBVWPSki5p1x3eJqjNA' },
} as const;

export type SingleBook = ItemTypeDefinition<
  EnvironmentSettings,
  'ErrM9cdtQ3u-NUZT_49EdA',
  {
    book: {
      type: 'link';
    };
  }
>;
export const SingleBook = {
  ID: 'ErrM9cdtQ3u-NUZT_49EdA',
  REF: { type: 'item_type', id: 'ErrM9cdtQ3u-NUZT_49EdA' },
} as const;

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
export const BookCarousel = {
  ID: 'GIeyoYr9QKOsVnBTSxGpiw',
  REF: { type: 'item_type', id: 'GIeyoYr9QKOsVnBTSxGpiw' },
} as const;

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
export const PillsBlock = {
  ID: 'HZi-jubFRamxNRRshwBsng',
  REF: { type: 'item_type', id: 'HZi-jubFRamxNRRshwBsng' },
} as const;

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
export const MenuItem = {
  ID: 'HgR65F53QMCb2K39_hHZZw',
  REF: { type: 'item_type', id: 'HgR65F53QMCb2K39_hHZZw' },
} as const;

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
export const NewsletterSubscription = {
  ID: 'JL95W2TbQkq54DqhCfeN2w',
  REF: { type: 'item_type', id: 'JL95W2TbQkq54DqhCfeN2w' },
} as const;

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
export const MenuDropdown = {
  ID: 'KqTe02scRaOINXc7vgwjbA',
  REF: { type: 'item_type', id: 'KqTe02scRaOINXc7vgwjbA' },
} as const;

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
export const SingleInfoBlock = {
  ID: 'LC9IkC3SQfeCI8hNLSoLww',
  REF: { type: 'item_type', id: 'LC9IkC3SQfeCI8hNLSoLww' },
} as const;

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
export const Button = {
  ID: 'NT-1f6AdRFuEqgoY824_uw',
  REF: { type: 'item_type', id: 'NT-1f6AdRFuEqgoY824_uw' },
} as const;

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
export const FaqSection = {
  ID: 'QkR2_FyOQrKHP2IdQYmRWw',
  REF: { type: 'item_type', id: 'QkR2_FyOQrKHP2IdQYmRWw' },
} as const;

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
export const FooterMenuBlock = {
  ID: 'RkbPKoyQTc-ZOyS_6ou0vw',
  REF: { type: 'item_type', id: 'RkbPKoyQTc-ZOyS_6ou0vw' },
} as const;

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
export const SocialLink = {
  ID: 'Uoswkz_uQ4ibh_EoJ-DwkQ',
  REF: { type: 'item_type', id: 'Uoswkz_uQ4ibh_EoJ-DwkQ' },
} as const;

export type SingleAuthor = ItemTypeDefinition<
  EnvironmentSettings,
  'VdpvBBQAR0ykrmM4yRYhlQ',
  {
    author: {
      type: 'link';
    };
  }
>;
export const SingleAuthor = {
  ID: 'VdpvBBQAR0ykrmM4yRYhlQ',
  REF: { type: 'item_type', id: 'VdpvBBQAR0ykrmM4yRYhlQ' },
} as const;

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
export const MenuExternalItem = {
  ID: 'Y3bk-wH6TKibydUwoN1eBA',
  REF: { type: 'item_type', id: 'Y3bk-wH6TKibydUwoN1eBA' },
} as const;

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
    pdf_footer: {
      type: 'text';
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
export const App = {
  ID: 'ZwV1BuKbRiGcG4zyhazrrw',
  REF: { type: 'item_type', id: 'ZwV1BuKbRiGcG4zyhazrrw' },
} as const;

export type CoverSize = ItemTypeDefinition<
  EnvironmentSettings,
  'cj2JswthQqK9y4JL20VDdw',
  {
    dimensions: {
      type: 'string';
    };
  }
>;
export const CoverSize = {
  ID: 'cj2JswthQqK9y4JL20VDdw',
  REF: { type: 'item_type', id: 'cj2JswthQqK9y4JL20VDdw' },
} as const;

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
export const CtaButtonWithImage = {
  ID: 'dS2Z8nuURz6Pem2fHRN2tQ',
  REF: { type: 'item_type', id: 'dS2Z8nuURz6Pem2fHRN2tQ' },
} as const;

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
export const IndexPage = {
  ID: 'fAa-reI7QymIa_MCsJxNlQ',
  REF: { type: 'item_type', id: 'fAa-reI7QymIa_MCsJxNlQ' },
} as const;

export type AnyBlock =
  | Reprint
  | ImageBlock
  | Video
  | Banner
  | Question
  | SingleBook
  | BookCarousel
  | PillsBlock
  | MenuItem
  | NewsletterSubscription
  | MenuDropdown
  | SingleInfoBlock
  | Button
  | FaqSection
  | FooterMenuBlock
  | SocialLink
  | SingleAuthor
  | MenuExternalItem
  | CtaButtonWithImage;
export type AnyModel =
  | Supplier
  | Author
  | Collection
  | Page
  | Book
  | BlogPostOld
  | BlogCategory
  | BlogTag
  | Home
  | BlogAuthor
  | License
  | BlogPost
  | Keyword
  | ProjectComment
  | App
  | CoverSize
  | IndexPage;
export type AnyBlockOrModel = AnyBlock | AnyModel;
