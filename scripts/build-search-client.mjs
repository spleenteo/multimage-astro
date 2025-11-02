import { mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const outDir = resolve(projectRoot, 'public/generated');
const sourcemap = process.env.NODE_ENV === 'development';

const artifacts = [
  {
    entryPoint: resolve(projectRoot, 'src/pages/cerca/search-page.client.ts'),
    outFile: resolve(outDir, 'search-page.client.js'),
  },
  {
    entryPoint: resolve(projectRoot, 'src/components/BookCarouselSection/swiper-element.ts'),
    outFile: resolve(outDir, 'swiper-element.js'),
  },
];

try {
  await mkdir(outDir, { recursive: true });
  await Promise.all(artifacts.map(({ outFile }) => rm(outFile, { force: true })));
} catch (error) {
  console.warn('[build-assets] Unable to prepare output directory', error);
}

await Promise.all(
  artifacts.map(async ({ entryPoint, outFile }) => {
    await build({
      entryPoints: [entryPoint],
      outfile: outFile,
      bundle: true,
      format: 'esm',
      target: 'es2019',
      platform: 'browser',
      sourcemap,
      logLevel: 'info',
    });

    console.log(`[build-assets] Written ${outFile}`);
  }),
);
