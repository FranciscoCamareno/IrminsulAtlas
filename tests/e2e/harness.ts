import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  chromium,
  type Browser,
  type BrowserContextOptions,
} from 'playwright-core';

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// A static server over the existing production build (`npm run build`), like
// any static host: directories serve index.html, responses are gzip-compressed.
export async function startServer() {
  if (!existsSync('dist/index.html'))
    throw new Error(
      'Falta dist/: ejecuta `npm run build` antes de las pruebas e2e.',
    );
  const root = resolve('dist');
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent((request.url ?? '/').split('?')[0]!);
    let file = resolve(join(root, path));
    if (!file.startsWith(root)) return void response.writeHead(403).end();
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = gzipSync(await readFile(file));
      response.writeHead(200, {
        'content-type': types[extname(file)] ?? 'application/octet-stream',
        'content-encoding': 'gzip',
      });
      response.end(body);
    } catch {
      response.writeHead(404, { 'content-type': 'text/html' });
      response.end(await readFile(join(root, '404.html')).catch(() => '404'));
    }
  });
  // A free port per suite, so suites never collide with a lingering server.
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    stop: () => {
      server.closeAllConnections();
      server.close();
    },
  };
}

// Playwright's own browser when installed; otherwise point E2E_CHROMIUM_PATH at
// any Chromium/Chrome binary (the cloud container ships one at /opt/pw-browsers).
export function launch(): Promise<Browser> {
  const executablePath =
    process.env['E2E_CHROMIUM_PATH'] ??
    (existsSync('/opt/pw-browsers/chromium')
      ? '/opt/pw-browsers/chromium'
      : undefined);
  return chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox'],
  });
}

export const desktop: BrowserContextOptions = {
  viewport: { width: 1366, height: 768 },
};
export const phone: BrowserContextOptions = {
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
};
export const narrow: BrowserContextOptions = {
  viewport: { width: 320, height: 640 },
  hasTouch: true,
  isMobile: true,
};

// Stored choice, set before the page loads so tests start past the first-visit prompt.
export const progressKey = 'irminsul-atlas:progress:v1';
export const allProgress = JSON.stringify({ kind: 'all' });
