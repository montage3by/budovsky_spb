// Простой статический сервер без зависимостей (для Railway и локального запуска).
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 3000;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const allowed = ['/index.html', '/assets/', '/data/'];

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root) || !allowed.some((a) => p === a || p.startsWith(a))) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': p.startsWith('/data/') ? 'no-cache' : 'public, max-age=300', 'X-Robots-Tag': 'noindex' });
    res.end(buf);
  });
}).listen(port, () => console.log('Dashboard on http://localhost:' + port));
