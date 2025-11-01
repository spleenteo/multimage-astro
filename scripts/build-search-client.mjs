import { mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const entryPoint = resolve(projectRoot, 'src/pages/cerca/search-page.client.ts');
const outDir = resolve(projectRoot, 'public/generated');
const outFile = resolve(outDir, 'search-page.client.js');

try {
  await mkdir(outDir, { recursive: true });
  // Clear previous build to avoid stale code in case of errors
  await rm(outFile, { force: true });
} catch (error) {
  console.warn('[build-search-client] Unable to prepare output directory', error);
}

await build({
  entryPoints: [entryPoint],
  outfile: outFile,
  bundle: true,
  format: 'esm',
  target: 'es2019',
  platform: 'browser',
  sourcemap: process.env.NODE_ENV === 'development',
  logLevel: 'info',
});

console.log(`[build-search-client] Written ${outFile}`);
