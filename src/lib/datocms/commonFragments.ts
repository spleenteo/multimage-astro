/*
 * This file lists a series of fragments not related to any specific component,
 * but necessary in various parts of the codebase.
 */

export const TAG_FRAGMENT = /* GraphQL */ `
  fragment TagFragment on Tag {
    tag
    attributes
    content
  }
`;

export const RESPONSIVE_IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ResponsiveImageFragment on ResponsiveImage {
    src
    width
    height
    srcSet
    sizes
    alt
    title
    base64
    bgColor
  }
`;

/**
 * Lean responsive-image selection for card/thumbnail grids. Deliberately omits
 * `base64` (the LQIP blur-up) and `srcSet`:
 *
 * - Cards already render a flat `bgColor` placeholder, so the base64 blur-up is
 *   redundant in a grid (~171 KB on /libri alone).
 * - The `@datocms/astro` <Image> rebuilds a trimmed srcset client-side from
 *   `src` when `data.srcSet` is absent — pass `srcSetCandidates={[1, 2]}` on the
 *   component so it emits 2 candidates instead of the 6 DatoCMS would return
 *   (~180 KB on /libri).
 *
 * Both omissions shrink the rendered HTML, which is exactly what Vercel bills as
 * Fast Origin Transfer on every render (cache miss, TTL expiry, revalidation).
 * Keep RESPONSIVE_IMAGE_FRAGMENT (with base64 + srcSet) for hero/detail images
 * where the blur-up and a full srcset are actually wanted.
 *
 * Interpolated as raw fields (not a named fragment) so consuming queries don't
 * need to register an extra fragment definition and never risk GraphQL
 * "unknown/unused fragment" validation errors.
 */
export const RESPONSIVE_IMAGE_CARD_FIELDS = /* GraphQL */ `
  src
  width
  height
  sizes
  alt
  title
  bgColor
`;
