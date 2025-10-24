import type { AssetColor } from '~/lib/datocms/types';

export function pickBaseColor(colors: AssetColor[] | null | undefined, fallback = '#E8EEF5') {
  if (!colors || colors.length === 0) {
    return fallback;
  }
  const source = colors.slice(0, 3).find((color) => color?.hex) ?? colors[0];
  return source?.hex ?? fallback;
}

function clamp(amount: number, min = 0, max = 1) {
  return Math.min(Math.max(amount, min), max);
}

export function lightenColor(hex: string, amount = 0.18, fallback = '#F5F7FA') {
  if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
    return fallback;
  }
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  const num = Number.parseInt(normalized, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const blend = (component: number) => Math.round(component + (255 - component) * clamp(amount));
  const newR = blend(r).toString(16).padStart(2, '0');
  const newG = blend(g).toString(16).padStart(2, '0');
  const newB = blend(b).toString(16).padStart(2, '0');
  return `#${newR}${newG}${newB}`;
}

export function darkenColor(hex: string, amount = 0.35, fallback = '#041C43') {
  if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
    return fallback;
  }
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  const num = Number.parseInt(normalized, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const blend = (component: number) => Math.round(component * (1 - clamp(amount)));
  const newR = blend(r).toString(16).padStart(2, '0');
  const newG = blend(g).toString(16).padStart(2, '0');
  const newB = blend(b).toString(16).padStart(2, '0');
  return `#${newR}${newG}${newB}`;
}

export function hexToRgba(hex: string, alpha = 1, fallback = `rgba(4, 28, 67, ${alpha})`) {
  if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
    return fallback;
  }
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  const num = Number.parseInt(normalized, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
