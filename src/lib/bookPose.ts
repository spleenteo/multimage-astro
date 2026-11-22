/**
 * A hover pose for Book3D that looks random across a grid but stays the same for each book: derived
 * from the slug, so a cached page and every visit show the same book turned the same way.
 */
import { darkenColor, lightenColor, pickBaseColor } from '~/lib/colors';
import type { AssetColor } from '~/lib/datocms/types';

/** Spine and back of the 3D book from the cover's own hue: pale ground, full-strength bands, dark ink. */
export function bookSpineColors(colors: AssetColor[] | null | undefined) {
  const base = pickBaseColor(colors);
  return {
    spineColor: lightenColor(base, 0.82),
    accentColor: base,
    inkColor: darkenColor(base, 0.7),
  };
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random numbers in [0, 1) from a seed (mulberry32). */
function sequence(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type BookPose = {
  rotY: number;
  rotX: number;
  rotZ: number;
  offsetX: number;
  offsetY: number;
  scale: number;
};

export function bookPose(key: string): BookPose {
  const next = sequence(hash(key));
  const between = (min: number, max: number) => Math.round((min + next() * (max - min)) * 10) / 10;
  // Either way: turned right (positive) the spine with the title shows, turned left the page edges.
  const side = next() < 0.5 ? 1 : -1;
  return {
    rotY: side * between(24, 40),
    rotX: between(-16, -6),
    rotZ: between(-2.5, 2.5),
    offsetX: between(-6, 6),
    // About 30px up and larger, so the book rises out of its coloured field, clear of the title.
    offsetY: between(-34, -26),
    scale: Math.round(between(1.12, 1.2) * 100) / 100,
  };
}
