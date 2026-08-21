import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** City landing — bundled in `landing/` for deploy; optional sibling `card/apple-3d-card` for local dev. */
export const LANDING_ROOT = (() => {
  const bundled = path.resolve(__dirname, '../../landing');
  const sibling = path.resolve(__dirname, '../../card/apple-3d-card');
  if (fs.existsSync(bundled)) return bundled;
  return sibling;
})();

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** Landing CTAs stay as written; the server sends them into CivicPulse. */
export const LANDING_TO_APP: Record<string, string> = {
  '/register-complaint.html': '/app/#compose',
  '/view-complaint.html': '/app/#search',
  '/open-thoughts.html': '/app/#home',
};

function pathnameOf(req: IncomingMessage): string {
  try {
    return new URL(req.url || '/', 'http://localhost').pathname;
  } catch {
    return '/';
  }
}

function shouldSkip(pathname: string): boolean {
  return (
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    pathname.startsWith('/src') ||
    pathname.startsWith('/@') ||
    pathname.startsWith('/node_modules') ||
    pathname.startsWith('/api')
  );
}

function sendLandingFile(pathname: string, res: ServerResponse): boolean {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const filePath = path.resolve(LANDING_ROOT, relative);
  if (!filePath.startsWith(LANDING_ROOT)) return false;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;

  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function landingMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  const pathname = pathnameOf(req);
  if (shouldSkip(pathname)) {
    next();
    return;
  }

  const dest = LANDING_TO_APP[pathname];
  if (dest) {
    res.statusCode = 302;
    res.setHeader('Location', dest);
    res.end();
    return;
  }

  if (sendLandingFile(pathname, res)) return;
  next();
}

function copyLandingIntoDist(distRoot: string) {
  if (!fs.existsSync(LANDING_ROOT)) {
    console.warn(`[civic-landing] Landing folder not found: ${LANDING_ROOT}`);
    return;
  }

  fs.mkdirSync(distRoot, { recursive: true });

  for (const name of ['index.html', 'style.css', 'app.js']) {
    const src = path.join(LANDING_ROOT, name);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distRoot, name));
  }

  const carsSrc = path.join(LANDING_ROOT, 'cars');
  const carsDest = path.join(distRoot, 'cars');
  if (fs.existsSync(carsSrc)) {
    fs.cpSync(carsSrc, carsDest, { recursive: true });
  }

  const stubs: Record<string, string> = {
    'register-complaint.html': LANDING_TO_APP['/register-complaint.html'],
    'view-complaint.html': LANDING_TO_APP['/view-complaint.html'],
    'open-thoughts.html': LANDING_TO_APP['/open-thoughts.html'],
  };

  for (const [file, href] of Object.entries(stubs)) {
    fs.writeFileSync(
      path.join(distRoot, file),
      `<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${href}"><script>location.replace(${JSON.stringify(href)})</script>`,
      'utf8'
    );
  }
}

export function civicLandingPlugin(): Plugin {
  return {
    name: 'civic-landing',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(landingMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(landingMiddleware);
    },
    closeBundle() {
      const distRoot = path.resolve(__dirname, 'dist');
      copyLandingIntoDist(distRoot);
    },
  };
}
