import { run } from './process.mjs';
import {
  copyFile,
  writeFile,
  readdir,
  readFile,
  mkdir,
} from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
run('node_modules/vite/bin/vite.js', [
  'build',
  '--config',
  'apps/math-lab/vite.config.ts',
]);
const root = 'dist/math-lab';
await writeFile(join(root, '.nojekyll'), '');
await mkdir(join(root, 'licenses'), { recursive: true });
for (const [packageName, file] of [
  ['katex', 'LICENSE'],
  ['react', 'LICENSE'],
  ['react-dom', 'LICENSE'],
  ['zod', 'LICENSE'],
])
  await copyFile(
    join('node_modules', packageName, file),
    join(root, 'licenses', `${packageName}.txt`),
  );
const packageInfo = JSON.parse(await readFile('package.json', 'utf8'));
const entries = [];
async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await inspect(path);
      continue;
    }
    let bytes = await readFile(path);
    const relative = path.slice(root.length + 1).replaceAll('\\', '/');
    if (/\.(?:js|html|css|json|txt)$/.test(relative)) {
      bytes = Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'));
      await writeFile(path, bytes);
    }
    if (
      relative.endsWith('.map') ||
      /(?:private\.json|\.env|\.sql|\.sqlite)/.test(relative)
    )
      throw new Error(
        'A non-public source or runtime file entered the Math Lab build.',
      );
    if (
      /\.(?:js|html|css|json)$/.test(relative) &&
      /fplab_practice_notebooks|\/api\/v1|NotebookWorkspace|fplab_local|\/auth\/callback/.test(
        bytes.toString('utf8'),
      )
    )
      throw new Error(`Unexpected classroom/backend material in ${relative}`);
    entries.push({
      path: relative,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
}
await inspect(root);
await writeFile(
  join(root, 'build-manifest.json'),
  JSON.stringify(
    {
      application: 'FPLab Math Lab',
      version: packageInfo.version,
      url: 'https://fplearning.ca/math-lab/',
      mode: 'public-static',
      files: entries,
    },
    null,
    2,
  ) + '\n',
);
console.info(
  `Public Math Lab build verified: ${entries.length} static files; no classroom API, notebook workspace or source maps.`,
);
