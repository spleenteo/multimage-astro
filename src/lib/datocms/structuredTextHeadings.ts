import type { StructuredTextField } from './types';

type DastNode = { type: string; level?: number; children?: DastNode[] };

/**
 * Editors often start an article at h3. Under the page's h1 the outline must continue at h2: shift
 * every heading so the highest one becomes `top` (h3/h4 → h2/h3), keeping their relative order.
 */
export function shiftHeadings<T extends StructuredTextField | null | undefined>(
  field: T,
  top = 2,
): T {
  const document = field?.value?.document as DastNode | undefined;
  if (!field || !document) return field;

  let highest = 7;
  const scan = (node: DastNode) => {
    if (node.type === 'heading' && typeof node.level === 'number')
      highest = Math.min(highest, node.level);
    node.children?.forEach(scan);
  };
  scan(document);
  const shift = highest <= 6 ? highest - top : 0;
  if (shift <= 0) return field;

  const copy = (node: DastNode): DastNode => ({
    ...node,
    ...(node.type === 'heading' && typeof node.level === 'number'
      ? { level: Math.max(top, node.level - shift) }
      : {}),
    ...(node.children ? { children: node.children.map(copy) } : {}),
  });
  return { ...field, value: { ...field.value, document: copy(document) } } as T;
}
