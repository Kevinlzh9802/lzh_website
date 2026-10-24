import { copyFile } from 'node:fs/promises';
// Preserve the original cPanel error-page filename as well as standard 404.html.
await copyFile(
  new URL('../dist/404.html', import.meta.url),
  new URL('../dist/404.shtml', import.meta.url),
);
