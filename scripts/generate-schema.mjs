import { spawn } from 'node:child_process';

const managementToken = process.env.DATOCMS_CMA_TOKEN;

if (!managementToken) {
  console.log(
    '[dato] Skipping schema generation: set DATOCMS_CMA_TOKEN to enable automatic schema updates.',
  );
  process.exit(0);
}

const child = spawn('npx', ['datocms', 'schema:generate', 'schema.ts'], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[dato] Failed to run schema generation:', error);
  process.exit(1);
});
