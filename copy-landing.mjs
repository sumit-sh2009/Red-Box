import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'landing');
const dest = path.join(root, 'client', 'dist');

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('copy-landing: missing landing/index.html at', src);
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });

for (const name of ['index.html', 'style.css', 'app.js']) {
  const from = path.join(src, name);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(dest, name));
}

const carsSrc = path.join(src, 'cars');
if (fs.existsSync(carsSrc)) {
  fs.cpSync(carsSrc, path.join(dest, 'cars'), { recursive: true });
}

const redirects = {
  'register-complaint.html': '/app/#compose',
  'view-complaint.html': '/app/#search',
  'open-thoughts.html': '/app/#home',
};
for (const [file, href] of Object.entries(redirects)) {
  fs.writeFileSync(
    path.join(dest, file),
    `<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${href}"><script>location.replace(${JSON.stringify(href)})</script>`
  );
}

if (!fs.existsSync(path.join(dest, 'index.html'))) {
  console.error('copy-landing: client/dist/index.html was not written');
  process.exit(1);
}

console.log('copy-landing: wrote landing into client/dist');
