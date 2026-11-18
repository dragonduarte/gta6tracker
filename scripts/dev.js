// Servidor local para testar: node scripts/dev.js  →  http://localhost:3000
// Lê as chaves de um ficheiro .env (se existir). Com MOCK=1 usa dados falsos no /api/live.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/live') {
    if (process.env.MOCK) {
      const { mockSnapshots } = await import('./mock.js');
      const { strip } = await import('../lib/platforms.js');
      const snaps = mockSnapshots(new Date(), false); const out = { ts: new Date().toISOString(), errors: [] };
      for (const p of ['twitch', 'kick']) { const r = await snaps[p]; out[p] = { ...r, list: undefined, languages: undefined,
        top: r.list.slice(0, 15).map(strip), top_pt: r.list.filter((s) => s.lang === 'pt').map(strip), top_portugal: r.list.filter((s) => s.portugal).map(strip) }; }
      res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(out));
    }
    const { default: handler } = await import('../api/live.js');
    const wrap = { setHeader: (k, v) => res.setHeader(k, v), status(c) { res.statusCode = c; return wrap; }, send: (b) => res.end(b) };
    return handler(req, wrap);
  }
  const PUBLIC = path.join(ROOT, 'public');
  let file;
  try { file = path.resolve(PUBLIC, '.' + decodeURIComponent(url.pathname)); } catch { res.writeHead(400); return res.end(); }
  const rel = path.relative(PUBLIC, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) { res.writeHead(403); return res.end(); }
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    // aplica os mesmos cabeçalhos de segurança do vercel.json (para testar a CSP localmente)
    const extra = {};
    try {
      for (const rule of JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers || []) {
        const re = new RegExp('^' + rule.source.replace(/\(\.\*\)/g, '(.*)') + '$');
        if (re.test(url.pathname)) for (const h of rule.headers) extra[h.key] = h.value;
      }
    } catch { /* sem vercel.json */ }
    delete extra['Strict-Transport-Security'];
    if (extra['Content-Security-Policy']) extra['Content-Security-Policy'] = extra['Content-Security-Policy'].replace('; upgrade-insecure-requests', '');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', ...extra }); res.end(buf);
  });
}).listen(process.env.PORT || 3000, '127.0.0.1', () => console.log(`Dashboard em http://localhost:${process.env.PORT || 3000}`));
