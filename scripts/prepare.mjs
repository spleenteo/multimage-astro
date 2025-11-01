import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const pkgPath = resolve(projectRoot, 'package.json');

const isCI =
  process.env.CI === 'true' ||
  process.env.CONTINUOUS_INTEGRATION === 'true' ||
  process.env.VERCEL === '1' ||
  process.env.NETLIFY === 'true';

if (isCI) {
  console.log('[prepare] CI environment detected; skipping git hooks and schema generation.');
  process.exit(0);
}

const hasSimpleGitHooksConfig = (() => {
  if (!existsSync(pkgPath)) {
    return false;
    }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return Boolean(pkg['simple-git-hooks']);
  } catch {
    return false;
  }
})();

const run = (command) => {
  console.log(`[prepare] ${command}`);
  execSync(command, { stdio: 'inherit', env: process.env });
};

if (hasSimpleGitHooksConfig) {
  try {
    run('npx simple-git-hooks');
  } catch (error) {
    console.warn('[prepare] Failed to configure git hooks:', error.message);
  }
} else {
  console.log('[prepare] No simple-git-hooks configuration found; skipping git hooks setup.');
}

if (process.env.SKIP_GENERATE_SCHEMA === '1') {
  console.log('[prepare] SKIP_GENERATE_SCHEMA=1 set; skipping schema generation.');
  process.exit(0);
}

run('npm run generate-schema');
