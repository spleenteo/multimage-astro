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
