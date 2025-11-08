#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const LIST_DOCS = ['docs/list-components.md', 'docs/list-helpers.md', 'docs/list-models.md'];

const PATH_TOKEN_REGEX = /`([^`]+)`/g;
const PATH_PREFIX = /^(src|scripts|docs|public|head-start)\//;

const errors = [];

function normalizeRelative(relPath) {
  return relPath.replace(/\\/g, '/');
}

async function fileExists(relativePath) {
  try {
    await fs.stat(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readDoc(docPath) {
  const absolute = path.join(repoRoot, docPath);
  const content = await fs.readFile(absolute, 'utf8');
  return content;
}

function extractInlinePaths(docContent) {
  const matches = new Set();
  let match;
  while ((match = PATH_TOKEN_REGEX.exec(docContent)) !== null) {
    const token = match[1].trim();
    if (PATH_PREFIX.test(token) && !token.includes('*')) {
      matches.add(token);
    }
  }
  return matches;
}

function extractInventoryNames(docContent) {
  const names = new Set();
  const lines = docContent.split('\n');
  const bulletRegex = /^\s*-\s+`([^`]+)`/;
  for (const line of lines) {
    const match = bulletRegex.exec(line);
    if (match) {
      names.add(match[1].trim());
    }
  }
  return names;
}

async function collectAstroComponents() {
  const baseDir = path.join(repoRoot, 'src/components');
  const components = new Map();

  async function walk(dir) {
    let dirents;
    try {
      dirents = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const dirent of dirents) {
      const entryPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (!dirent.isFile() || !dirent.name.endsWith('.astro')) {
        continue;
      }

      const relative = normalizeRelative(path.relative(repoRoot, entryPath));
      const parentDir = path.basename(path.dirname(entryPath));
      const fileBase = path.parse(dirent.name).name;
      let componentName = parentDir;

      if (parentDir === 'components') {
        componentName = fileBase;
      } else if (fileBase !== 'Component' && fileBase !== parentDir) {
        componentName = fileBase;
      }

      if (!components.has(componentName)) {
        components.set(componentName, new Set());
      }
      components.get(componentName).add(relative);
    }
  }

  await walk(baseDir);
  return components;
}

async function collectHelperPaths() {
  const helperPaths = new Set();
  await collectMatchingFiles('src/lib', (entryPath) => {
    const name = path.basename(entryPath);
    return name.endsWith('.ts') && !name.endsWith('.d.ts');
  });
  await collectMatchingFiles('src/config', (entryPath) => entryPath.endsWith('.ts'));
  await collectMatchingFiles('scripts', (entryPath) => entryPath.endsWith('.mjs'));

  const apiUtils = 'src/pages/api/utils.ts';
  if (await fileExists(apiUtils)) {
    helperPaths.add(apiUtils);
  }

  async function collectMatchingFiles(relativeDir, predicate) {
    const absoluteDir = path.join(repoRoot, relativeDir);
    let stats;
    try {
      stats = await fs.stat(absoluteDir);
    } catch {
      return;
    }
    if (!stats.isDirectory()) {
      return;
    }
    const dirents = await fs.readdir(absoluteDir, { withFileTypes: true });
    for (const dirent of dirents) {
      const entryPath = path.join(absoluteDir, dirent.name);
      if (dirent.isDirectory()) {
        await collectMatchingFiles(path.join(relativeDir, dirent.name), predicate);
        continue;
      }
      if (predicate(entryPath)) {
        helperPaths.add(normalizeRelative(path.relative(repoRoot, entryPath)));
      }
    }
  }

  return helperPaths;
}

async function validateDocPaths(docFile, inlinePaths) {
  const missing = [];
  for (const relPath of inlinePaths) {
    if (!(await fileExists(relPath))) {
      missing.push(relPath);
    }
  }

  if (missing.length > 0) {
    errors.push({
      doc: docFile,
      message: `references missing paths:\n    - ${missing.join('\n    - ')}`,
    });
  }
}

async function ensureComponentCoverage(docFile, docContent) {
  const docNames = extractInventoryNames(docContent);
  const components = await collectAstroComponents();
  const actualNames = new Set(components.keys());

  const missingInDocs = [...actualNames].filter((name) => !docNames.has(name));
  const staleDocs = [...docNames].filter((name) => !actualNames.has(name));

  if (missingInDocs.length > 0 || staleDocs.length > 0) {
    if (missingInDocs.length > 0) {
      errors.push({
        doc: docFile,
        message: `is missing component entries:\n    - ${missingInDocs.sort().join('\n    - ')}`,
      });
    }
    if (staleDocs.length > 0) {
      errors.push({
        doc: docFile,
        message: `lists components not found under src/components:\n    - ${staleDocs.sort().join('\n    - ')}`,
      });
    }
  }
}

async function ensureHelperCoverage(docFile, inlinePaths) {
  const helperPaths = await collectHelperPaths();
  const docHelperPaths = [...inlinePaths].filter(
    (relPath) =>
      relPath.startsWith('src/lib/') ||
      relPath.startsWith('src/config/') ||
      relPath.startsWith('scripts/') ||
      relPath.startsWith('src/pages/api/'),
  );
  const documented = new Set(docHelperPaths);

  const missingInDocs = [...helperPaths].filter((relPath) => !documented.has(relPath));
  const staleEntries = docHelperPaths.filter((relPath) => !helperPaths.has(relPath));

  if (missingInDocs.length > 0) {
    errors.push({
      doc: docFile,
      message: `is missing helper coverage for:\n    - ${missingInDocs.sort().join('\n    - ')}`,
    });
  }

  if (staleEntries.length > 0) {
    errors.push({
      doc: docFile,
      message: `references helper paths that no longer exist:\n    - ${staleEntries.sort().join('\n    - ')}`,
    });
  }
}

async function main() {
  const docCache = new Map();

  for (const docFile of LIST_DOCS) {
    const content = await readDoc(docFile);
    const inlinePaths = extractInlinePaths(content);
    docCache.set(docFile, { content, inlinePaths });
    await validateDocPaths(docFile, inlinePaths);
  }

  const componentsDoc = docCache.get('docs/list-components.md');
  if (componentsDoc) {
    await ensureComponentCoverage('docs/list-components.md', componentsDoc.content);
  }

  const helpersDoc = docCache.get('docs/list-helpers.md');
  if (helpersDoc) {
    await ensureHelperCoverage('docs/list-helpers.md', helpersDoc.inlinePaths);
  }

  if (errors.length > 0) {
    console.error('docs/list-* inventory check failed:');
    for (const { doc, message } of errors) {
      console.error(`- [${doc}] ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('docs/list-* inventories look good ✅');
}

main().catch((err) => {
  console.error('Failed to run docs inventory check:', err);
  process.exitCode = 1;
});
