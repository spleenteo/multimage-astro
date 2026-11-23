/**
 * Geometry of the 3D book (Book3D): from cover size, page count and pose to the inline variables
 * and the one side face the pose shows. Shared by the component and by `/catalogue-books.json`,
 * whose cards the browser builds, so a book looks the same wherever its markup comes from.
 */
export type Book3DInput = {
  title: string;
  pages?: number;
  width?: number;
  /** Cover height in px: when set, the width comes from `aspect`. */
  height?: number;
  aspect?: number;
  spineColor?: string;
  accentColor?: string;
  inkColor?: string;
  rotY?: number;
  rotX?: number;
  rotZ?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  restShadow?: string;
};

export type Book3DView = {
  /** Inline style: the variables the component's CSS reads. */
  style: string;
  /** true: the pose shows the spine (with the title); false: the page edges. */
  showSpine: boolean;
  /** Which of the top/bottom page edges the pose shows. */
  edgeClass: 'b3d--top' | 'b3d--bottom';
};

const PAGES_MIN = 20;
const PAGES_MAX = 600;
const D_MIN = 16;
const D_MAX = 90;

export function book3dView({
  title,
  pages = 290,
  width = 300,
  height,
  aspect = 1.4142,
  spineColor = '#f3e3c2',
  accentColor = '#f0b429',
  inkColor = '#4f6f2c',
  rotY = -43,
  rotX = -17,
  rotZ = 0,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  restShadow,
}: Book3DInput): Book3DView {
  const W = height ? Math.round(height / aspect) : width;
  const H = height ? Math.round(height) : Math.round(W * aspect);
  const s = W / 300; // scale against the original drawing (300 px wide)

  // Thickness: 20 pages (16 px) to 600 pages (90 px), scaled with the width.
  const t = (Math.min(PAGES_MAX, Math.max(PAGES_MIN, pages)) - PAGES_MIN) / (PAGES_MAX - PAGES_MIN);
  const D = (D_MIN + t * (D_MAX - D_MIN)) * s;

  // The spine text shrinks when the title is long.
  const BAND = 18 * s;
  const avail = H - 2 * BAND - 16 * s;
  const fs = Math.max(
    8 * s,
    Math.min(22 * s, (D - 6 * s) * 0.6, avail / (Math.max(1, title.length) * 0.68)),
  );

  const ox = Math.max(-60, Math.min(60, offsetX));
  const oy = Math.max(-60, Math.min(60, offsetY));
  const sc = Math.max(1, Math.min(1.3, scale));

  // A pose shows one side face and one page edge: the others are never rendered.
  const showSpine = rotY > 0;

  const style = [
    `--w:${W}px`,
    `--h:${H}px`,
    `--d:${D.toFixed(2)}px`,
    `--ox:${ox}px`,
    `--oy:${oy}px`,
    `--sc:${sc}`,
    `--rot:rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
    showSpine
      ? `--fs:${fs.toFixed(1)}px;--spine:${spineColor};--accent:${accentColor};--ink:${inkColor}`
      : null,
    restShadow ? `--rest-shadow:${restShadow}` : null,
  ]
    .filter(Boolean)
    .join(';');

  return { style, showSpine, edgeClass: rotX < 0 ? 'b3d--top' : 'b3d--bottom' };
}
