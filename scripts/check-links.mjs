import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : path.join(directory, entry.name),
      ),
    )
  ).flat();
}
const htmlFiles = (await files(root)).filter((file) => file.endsWith('.html'));
const failures = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) continue;
    const relative = decodeURIComponent(value.split(/[?#]/)[0]);
    const target = relative.startsWith('/')
      ? path.join(root, relative.slice(1))
      : path.resolve(path.dirname(file), relative);
    try {
      const info = await stat(target);
      if (info.isDirectory()) await stat(path.join(target, 'index.html'));
    } catch {
      failures.push(`${path.relative(root, file)} → ${value}`);
    }
  }
}
if (failures.length) {
  console.error('Broken local links:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`Verified local links and assets in ${htmlFiles.length} generated pages.`);
