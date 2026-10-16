// Minimal static server for the built app (dist/), used by Railway's `npm start`.
// Unknown paths fall back to index.html; the service worker and HTML are never
// cached so updates show up on the next visit.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const port = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
};

async function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(root, safe);
  if (candidate.startsWith(root)) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // fall through to index.html
    }
  }
  return join(root, 'index.html');
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const file = await resolveFile(pathname);
    const ext = extname(file);
    const body = await readFile(file);
    const immutable = pathname.startsWith('/assets/');
    res.writeHead(200, {
      'Content-Type': TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
  } catch {
    res.writeHead(500).end('Server error');
  }
}).listen(port, '0.0.0.0', () => console.log(`routin.fit on :${port}`));
