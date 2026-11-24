// Reads DESIGN.md at build time (bundled as a string, no runtime fs) so the /staff/designsystem
// page drifts with the design document: tokens from the YAML front matter, roles, named rules and
// the Do's and Don'ts from the prose. The parser covers only the YAML subset DESIGN.md uses
// (nested maps of quoted or bare scalars).
import designMd from '../../../../DESIGN.md?raw';

type YamlNode = { [key: string]: string | YamlNode };

function parseFrontMatter(source: string): YamlNode {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const root: YamlNode = {};
  if (!match) return root;
  const stack: Array<{ indent: number; node: YamlNode }> = [{ indent: -1, node: root }];
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const pair = trimmed.match(/^([\w-]+):\s*(.*)$/);
    if (!pair) continue;
    const indent = line.search(/\S/);
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1].node;
    const [, key, raw] = pair;
    if (raw === '') {
      const child: YamlNode = {};
      parent[key] = child;
      stack.push({ indent, node: child });
    } else {
      parent[key] = raw.replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1');
    }
  }
  return root;
}

function asStringMap(node: string | YamlNode | undefined): Record<string, string> {
  if (!node || typeof node === 'string') return {};
  return Object.fromEntries(
    Object.entries(node).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

/** The `## Heading` section of the prose, up to the next level-2 heading. */
function section(title: string): string {
  const start = designMd.search(new RegExp(`^## ${title}\\s*$`, 'm'));
  if (start < 0) return '';
  const rest = designMd.slice(start).split(/\r?\n/).slice(1).join('\n');
  const end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
}

const frontMatter = parseFrontMatter(designMd);

export const colorTokens = asStringMap(frontMatter.colors);
export const spacingTokens = asStringMap(frontMatter.spacing);
export const typographyTokens: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(typeof frontMatter.typography === 'object' ? frontMatter.typography : {}).map(
    ([name, value]) => [name, asStringMap(value)],
  ),
);

export type ColorGroup = 'Primary' | 'Secondary' | 'Tertiary' | 'Neutral' | 'Social';
export type ColorEntry = {
  token: string;
  hex: string;
  name: string;
  role: string;
  /** Contrast ratios DESIGN.md states for this colour ("9.36:1 on white"). */
  statedContrast: string | null;
};

// Tokens the prose names only in passing, not in a bullet of their own.
const EXTRA_ROLES: Record<string, { group: ColorGroup; name: string; role: string }> = {
  'cover-field-fallback': {
    group: 'Tertiary',
    name: 'Cover Field Fallback',
    role: 'The base colour `pickBaseColor` uses when an image has no DatoCMS colours.',
  },
};

/** Colour swatches grouped as in DESIGN.md "Colors", social channels split from Neutral. */
export function colorGroups(): Array<{ group: ColorGroup; entries: ColorEntry[] }> {
  const groups = new Map<ColorGroup, ColorEntry[]>();
  const seen = new Set<string>();
  const add = (group: ColorGroup, entry: ColorEntry) => {
    groups.set(group, [...(groups.get(group) ?? []), entry]);
    seen.add(entry.token);
  };

  let current: ColorGroup | null = null;
  for (const line of section('Colors').split(/\r?\n/)) {
    const heading = line.match(/^### (\w+)/);
    if (heading) {
      const name = heading[1] as ColorGroup;
      current = ['Primary', 'Secondary', 'Tertiary', 'Neutral'].includes(name) ? name : null;
      continue;
    }
    const bullet = line.match(/^- \*\*(.+?)\*\* \(([^)]+)\):\s*(.*)$/);
    if (!current || !bullet) continue;
    const [, name, tokenList, role] = bullet;
    const stated = role.match(/\d+(?:\.\d+)?:1/g);
    for (const token of tokenList.split(',').map((t) => t.trim())) {
      const hex = colorTokens[token];
      if (!hex) continue;
      const group: ColorGroup = token.startsWith('social-') ? 'Social' : current;
      add(group, {
        token,
        hex,
        name: token.startsWith('social-') ? token.replace('social-', 'Social · ') : name,
        role,
        statedContrast: stated ? stated.join(', ') : null,
      });
    }
  }

  for (const [token, hex] of Object.entries(colorTokens)) {
    if (seen.has(token)) continue;
    const extra = EXTRA_ROLES[token];
    add(extra?.group ?? 'Neutral', {
      token,
      hex,
      name: extra?.name ?? token,
      role: extra?.role ?? 'No role of its own in the DESIGN.md prose.',
      statedContrast: null,
    });
  }

  const order: ColorGroup[] = ['Primary', 'Secondary', 'Tertiary', 'Neutral', 'Social'];
  return order
    .filter((group) => groups.has(group))
    .map((group) => ({ group, entries: groups.get(group)! }));
}

/** "**The One Orange Rule.** text" paragraphs, keyed by the rule's name. */
export const namedRules: Record<string, string> = Object.fromEntries(
  [...designMd.matchAll(/^\*\*(The [^*]+? Rule)\.\*\*\s+(.+)$/gm)].map((m) => [m[1], m[2]]),
);

/** The usage line of each style in "Typography > Hierarchy", keyed by lower-case name. */
export const typographyUsage: Record<string, string> = Object.fromEntries(
  [...section('Typography').matchAll(/^- \*\*(\w[\w-]*)\*\* (.+)$/gm)].map((m) => [
    m[1].toLowerCase(),
    m[2],
  ]),
);

function bullets(block: string): string[] {
  return [...block.matchAll(/^- (.+)$/gm)].map((m) => m[1]);
}

const dosAndDonts = section("Do's and Don'ts");
const dontStart = dosAndDonts.search(/^### Don't/m);
export const dos = bullets(dontStart < 0 ? dosAndDonts : dosAndDonts.slice(0, dontStart));
export const donts = dontStart < 0 ? [] : bullets(dosAndDonts.slice(dontStart));

/** Inline Markdown of DESIGN.md (bold, code) as HTML; the text is escaped first. */
export function inlineMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
