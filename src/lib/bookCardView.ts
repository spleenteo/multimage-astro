/**
 * What a book card shows, worked out from the record: link, meta line, price, the tinted field and
 * the 3D book of the cover. Shared by `BookCard` and by `/catalogue-books.json` (cards the browser
 * builds from the same values).
 */
import { bookPose, bookSpineColors } from '~/lib/bookPose';
import type { Book3DInput } from '~/lib/book3d';
import { extractYear } from '~/lib/books';
import { darkenColor, hexToRgba, lightenColor, pickBaseColor } from '~/lib/colors';
import { formatEuro } from '~/lib/currency';
import type { AssetColor } from '~/lib/datocms/types';

export type BookCardInput = {
  title: string;
  slug: string;
  href?: string;
  format?: string | null;
  coverImage?: {
    url?: string | null;
    width?: number | null;
    height?: number | null;
    colors?: AssetColor[] | null;
  } | null;
  pages?: number | null;
  price?: number | null;
  printYear?: string | null;
  collectionName?: string | null;
  isArchived?: boolean | null;
  variant?: 'default' | 'catalogue';
};

export type BookCardView = {
  href: string;
  /** Collection, year, ebook format, "Fuori catalogo": joined with " · ". */
  meta: string[];
  priceLabel: string | null;
  /** The field behind the cover, tinted from the cover's own colour. */
  backgroundColor: string;
  cover: { src: string; srcset: string; book: Book3DInput } | null;
};

export function bookCardView({
  title,
  slug,
  href,
  format,
  coverImage,
  pages = null,
  price,
  printYear = null,
  collectionName = null,
  isArchived = false,
  variant = 'default',
}: BookCardInput): BookCardView {
  const isCatalogue = variant === 'catalogue';

  const normalizedFormat = format?.trim() ?? null;
  const isEbook = normalizedFormat ? normalizedFormat.toLowerCase() !== 'cartaceo' : false;
  const meta = [
    collectionName?.trim() || null,
    extractYear(printYear),
    isEbook ? normalizedFormat : null,
    isArchived ? 'Fuori catalogo' : null,
  ].filter((value): value is string => Boolean(value));

  const baseColor = pickBaseColor(coverImage?.colors);
  // In a grid of dozens the full-strength field turns into wallpaper: the catalogue keeps the hue,
  // lighter, so the cover stays the loudest thing in each card.
  const backgroundColor = lightenColor(baseColor, isCatalogue ? 0.55 : 0.18);
  const shadowColor = hexToRgba(darkenColor(baseColor, 0.55), isCatalogue ? 0.32 : 0.42);

  // The 3D book: covers line up by height (13rem in the catalogue, 14rem elsewhere; phones zoom it
  // down in CSS); the spine takes the cover's hue, pale, with bands at full strength and dark ink.
  const coverUrl = coverImage?.url ?? null;
  const coverAspect =
    coverImage?.width && coverImage?.height ? coverImage.height / coverImage.width : 1.45;
  // Portrait covers take the full height; landscape and square ones are capped by width, so they
  // fit the field too (on phones the catalogue zooms the book to 77%: 180px wide becomes 139px).
  const maxCoverHeight = isCatalogue ? 208 : 224;
  const maxCoverWidth = isCatalogue ? 180 : 210;
  const coverHeight = Math.round(Math.min(maxCoverHeight, maxCoverWidth * coverAspect));
  const coverSrc = (h: number) => `${coverUrl}?h=${h}&fit=max&auto=format`;

  return {
    href: href ?? `/libri/${slug}`,
    meta,
    priceLabel: typeof price === 'number' ? formatEuro(price) : null,
    backgroundColor,
    cover: coverUrl
      ? {
          src: coverSrc(coverHeight),
          srcset: `${coverSrc(coverHeight * 2)} 2x`,
          book: {
            title,
            pages: pages ?? undefined,
            height: coverHeight,
            aspect: coverAspect,
            ...bookSpineColors(coverImage?.colors),
            restShadow: `drop-shadow(18px 26px 32px ${shadowColor})`,
            ...bookPose(slug),
          },
        }
      : null,
  };
}
