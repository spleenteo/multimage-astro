import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const source = path.join(projectRoot, 'node_modules', 'swiper', 'swiper-element-bundle.min.js');
const destinationDir = path.join(projectRoot, 'public', 'vendor');
const destination = path.join(destinationDir, 'swiper-element-bundle.min.js');

async function ensureSwiperBundle() {
  try {
    await fs.access(source);
  } catch {
    console.error(
      '[ensure-swiper] Cannot find swiper-element bundle. Did you install dependencies?',
    );
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(destinationDir, { recursive: true });
  await fs.copyFile(source, destination);
  console.log('[ensure-swiper] Updated', path.relative(projectRoot, destination));
}

ensureSwiperBundle();
