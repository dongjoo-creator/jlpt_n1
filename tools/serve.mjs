// 개발용 정적 서버 (의존성 없음). 실행: npm run dev  또는  node tools/serve.mjs --port 5173
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const port = Number(portArg > -1 ? process.argv[portArg + 1] : process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const path = resolve(join(root, rel));
  let status = 200;
  let body;
  try {
    if (!path.startsWith(root + sep) || !(await stat(path)).isFile()) throw new Error('not file');
    body = await readFile(path);
    res.setHeader('Content-Type', MIME[extname(path).toLowerCase()] ?? 'application/octet-stream');
  } catch {
    status = 404;
    body = 'Not found';
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.writeHead(status);
  res.end(body);
  console.log(status, rel);
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}/`));
