import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'client', 'dist');
const dest = path.join(root, 'public');

if (!fs.existsSync(src)) {
  console.error('prepare-vercel-output: client/dist missing — run client build first');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

const index = path.join(dest, 'index.html');
if (!fs.existsSync(index)) {
  const appIndex = path.join(dest, 'app', 'index.html');
  if (fs.existsSync(appIndex)) {
    fs.copyFileSync(appIndex, index);
    console.warn('prepare-vercel-output: root index.html missing — copied from /app/index.html');
  } else {
    console.error('prepare-vercel-output: no index.html in client/dist');
    process.exit(1);
  }
}

console.log('prepare-vercel-output: copied client/dist → public/');
