import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_URL = 'https://www.datocms.com/docs/llms-full.txt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const docsPath = path.join(repoRoot, 'docs', 'DATOCMS.md');

async function loadEnv() {
  if (process.env.DATOCMS_CMA_TOKEN) {
    return;
  }

  const envPath = path.join(repoRoot, '.env');

  if (!existsSync(envPath)) {
    return;
  }

  try {
    const content = await readFile(envPath, 'utf8');

    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => {
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) {
          return;
        }

        const key = line.slice(0, eqIndex).trim();
        const value = line
          .slice(eqIndex + 1)
          .trim()
          .replace(/^['"]|['"]$/g, '');

        if (!process.env[key]) {
          process.env[key] = value;
        }
      });

    if (!process.env.DATOCMS_API_TOKEN && process.env.DATOCMS_CMA_TOKEN) {
      process.env.DATOCMS_API_TOKEN = process.env.DATOCMS_CMA_TOKEN;
    }
  } catch (error) {
    console.warn(
      '[dato] Unable to read .env file:',
      error instanceof Error ? error.message : error,
    );
  }
}

async function runGenerateSchema() {
  const managementToken = process.env.DATOCMS_API_TOKEN || process.env.DATOCMS_CMA_TOKEN || '';

  if (!managementToken) {
    console.log(
      '[dato] Skipping schema generation: set DATOCMS_API_TOKEN to enable automatic schema updates.',
    );
    return;
  }

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['datocms', 'schema:generate', 'schema.ts'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATOCMS_API_TOKEN: managementToken,
      },
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Schema generation failed with exit code ${code}`));
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function downloadDocs() {
  try {
    const response = await fetch(DOCS_URL, {
      headers: {
        'User-Agent': 'multimage-astro-sync-script',
      },
    });

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    const incoming = await response.text();

    if (existsSync(docsPath)) {
      const current = await readFile(docsPath, 'utf8');

      if (current === incoming) {
        console.log('[dato] DATOCMS.md is already up to date, skipping download.');
        return;
      }
    }

    await mkdir(path.dirname(docsPath), { recursive: true });
    await writeFile(docsPath, incoming, 'utf8');
    console.log('[dato] Updated DATOCMS.md from remote source.');
  } catch (error) {
    console.warn(
      '[dato] Failed to refresh DATOCMS.md — proceeding with existing copy.',
      error instanceof Error ? error.message : error,
    );
  }
}

async function main() {
  await loadEnv();
  await runGenerateSchema();
  await downloadDocs();
}

main().catch((error) => {
  console.error('[dato] Sync script failed:', error);
  process.exit(1);
});
