type DastNode = {
  type?: string;
  value?: string;
  children?: DastNode[];
  [key: string]: unknown;
};

type StructuredTextLike =
  | null
  | undefined
  | DastNode
  | {
      value?: {
        schema?: string;
        document?: DastNode;
      } | null;
      document?: DastNode;
    };

function extractDocument(data: StructuredTextLike): DastNode | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  if ('value' in data && data.value && typeof data.value === 'object') {
    const value = data.value as { document?: DastNode | null };
    if (value.document) {
      return value.document;
    }
  }

  if ('document' in data && data.document && typeof data.document === 'object') {
    return data.document as DastNode;
  }

  if ('type' in data) {
    return data as DastNode;
  }

  return null;
}

function visit(node: DastNode, visitor: (node: DastNode) => void) {
  visitor(node);

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      visit(child, visitor);
    }
  }
}

export function structuredTextToPlainText(input: unknown): string {
  const root = extractDocument(input as StructuredTextLike);

  if (!root) {
    return '';
  }

  const pieces: string[] = [];

  const appendNewline = () => {
    if (pieces.length === 0) {
      return;
    }
    const last = pieces[pieces.length - 1];
    if (!last.endsWith('\n')) {
      pieces.push('\n');
    }
  };

  visit(root, (node) => {
    switch (node.type) {
      case 'root':
        break;
      case 'paragraph':
      case 'heading':
        appendNewline();
        break;
      case 'list':
      case 'listItem':
      case 'blockquote':
        appendNewline();
        break;
      case 'span':
        if (typeof node.value === 'string') {
          pieces.push(node.value);
        }
        break;
      default:
        break;
    }
  });

  return pieces.join('').replace(/\s+/g, ' ').trim();
}

export function hasStructuredTextContent(input: unknown): boolean {
  const root = extractDocument(input as StructuredTextLike);

  if (!root) {
    return false;
  }

  let found = false;

  visit(root, (node) => {
    if (found) {
      return;
    }

    if (node.type === 'span' && typeof node.value === 'string' && node.value.trim().length > 0) {
      found = true;
    }
  });

  return found;
}

export function isStructuredTextEmpty(input: unknown): boolean {
  return !hasStructuredTextContent(input);
}
