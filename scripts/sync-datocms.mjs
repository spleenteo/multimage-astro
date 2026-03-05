import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
// Note: only handles schema generation. DatoCMS documentation is available via installed skills.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

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

function resolveDatoEnvironment() {
  const override = process.env.DATO_ENVIROMENT || process.env.DATO_ENVIRONMENT;
  if (!override) {
    return undefined;
  }

  const trimmed = override.trim();
  return trimmed.length ? trimmed : undefined;
}

async function runGenerateSchema() {
  const managementToken = process.env.DATOCMS_API_TOKEN || process.env.DATOCMS_CMA_TOKEN || '';
  const datoEnvironment = resolveDatoEnvironment();

  if (!managementToken) {
    console.log(
      '[dato] Skipping schema generation: set DATOCMS_API_TOKEN to enable automatic schema updates.',
    );
    return;
  }

  return new Promise((resolve, reject) => {
    const args = ['datocms', 'schema:generate', 'schema.ts'];

    if (datoEnvironment) {
      args.push('--environment', datoEnvironment);
    }

    const child = spawn('npx', args, {
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

async function main() {
  await loadEnv();
  await runGenerateSchema();
}

main().catch((error) => {
  console.error('[dato] Sync script failed:', error);
  process.exit(1);
});
