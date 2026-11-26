import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(root, '.next', 'standalone', '.next', 'static');
const publicSrc = path.join(root, 'public');
const publicDest = path.join(root, '.next', 'standalone', 'public');

try {
  if (fs.existsSync(staticSrc)) {
    fs.mkdirSync(staticDest, { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true });
    console.log('[build] Copied .next/static to standalone folder');
  }

  if (fs.existsSync(publicSrc)) {
    fs.mkdirSync(publicDest, { recursive: true });
    fs.cpSync(publicSrc, publicDest, { recursive: true });
    console.log('[build] Copied public/ to standalone folder');
  }
} catch (err) {
  console.error('[build] Asset copy warning:', err.message);
}
