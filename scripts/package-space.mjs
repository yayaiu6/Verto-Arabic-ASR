import fs from 'node:fs/promises';
import path from 'node:path';

const target = process.argv[2];
if (!target) throw new Error('Usage: node scripts/package-space.mjs <new-output-directory>');
const output = path.resolve(target);
if (output === process.cwd() || output.startsWith(process.cwd() + path.sep)) {
  throw new Error('Choose a separate output directory outside the repository');
}
// Refuse an existing destination so old files cannot enter the release.
await fs.mkdir(output);
await fs.access('dist/web/index.html');
await fs.cp('dist', output, {recursive: true});
await fs.copyFile('deploy/space.md', path.join(output, 'README.md'));
console.log('Static Space package:', output);
