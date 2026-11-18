// Testes de segurança do front-end e da API (sem rede).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('nenhum script inline executável, handler inline ou recurso externo nas páginas', () => {
  for (const f of ['public/index.html', 'public/embed.html']) {
    const html = read(f);
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter((m) => !/application\/ld\+json/.test(m[1]));
    assert.equal(inline.length, 0, `${f}: script inline`);
    assert.ok(!/\son[a-z]+\s*=/i.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), `${f}: handler inline`);
    for (const m of html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) assert.fail(`${f}: recurso externo ${m[1]}`);
  }
  for (const f of ['public/app.js', 'public/extras.js', 'public/embed.js']) {
    const js = read(f);
    assert.ok(!/\beval\(|new Function\(|document\.write/.test(js), `${f}: eval/Function/write`);
    assert.ok(!/onerror="|onload="|onclick="/.test(js), `${f}: handler inline em template`);
    assert.ok(!/cdn\.jsdelivr|unpkg|googleapis/.test(js), `${f}: CDN externo`);
  }
});

test('CSP e cabeçalhos de segurança configurados no Vercel', () => {
  const v = JSON.parse(read('vercel.json'));
  const all = v.headers.find((h) => h.source.includes('embed')) && v.headers[0];
  const csp = all.headers.find((h) => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /script-src 'self';/);
  assert.ok(!/script-src[^;]*unsafe/.test(csp));
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'self'/);
  for (const k of ['X-Content-Type-Options', 'Referrer-Policy', 'Strict-Transport-Security', 'Permissions-Policy']) assert.ok(all.headers.some((h) => h.key === k), k);
});

test('ações do GitHub fixadas por commit e sem gatilhos perigosos', () => {
  const y = read('.github/workflows/collect.yml');
  for (const m of y.matchAll(/uses:\s*([^\s#]+)/g)) assert.match(m[1], /@[0-9a-f]{40}$/, m[1]);
  assert.ok(!/pull_request_target|issue_comment/.test(y));
  assert.ok(!/\$\{\{\s*github\.event\.(issue|comment|pull_request|head_commit)/.test(y), 'injeção via eventos');
});

test('sem segredos no código nem em ficheiros públicos', () => {
  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    if (['node_modules', '.git', 'vendor', 'fonts'].includes(e.name)) continue;
    const p = path.join(d, e.name); e.isDirectory() ? walk(p) : files.push(p); } };
  walk('.');
  for (const f of files) {
    if (/\.(png|woff2)$/.test(f) || f.includes('test/')) continue;
    const c = read(f);
    assert.ok(!/AIza[0-9A-Za-z_-]{30,}/.test(c), `${f}: chave Google`);
    assert.ok(!/(client_secret|secret)\s*[:=]\s*['"][a-z0-9]{20,}['"]/i.test(c), `${f}: segredo`);
  }
  assert.ok(!fs.existsSync(path.join(ROOT, '.env')), '.env não deve ir no pacote');
  assert.match(read('.gitignore'), /^\.env/m);
});

// --- sanitização no browser: carrega as funções do app.js num sandbox mínimo
function loadSanitizers() {
  const src = read('public/app.js');
  const start = src.indexOf('const esc ='), end = src.indexOf('const safeImg =');
  const code = src.slice(start, src.indexOf('\n', end) + 1) + 'this.out = { esc, safeUrl, safeImg };';
  const ctx = { URL };
  vm.createContext(ctx); vm.runInContext(code, ctx);
  return ctx.out;
}

test('esc neutraliza HTML', () => {
  const { esc } = loadSanitizers();
  assert.equal(esc('<img src=x onerror=alert(1)>"\''), '&lt;img src=x onerror=alert(1)&gt;&quot;&#39;');
});

test('URLs: só https dos domínios permitidos, sem fuga de atributos/CSS', () => {
  const { safeUrl, safeImg } = loadSanitizers();
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('https://evil.com/x'), '#');
  assert.equal(safeUrl('http://twitch.tv/x'), '#');
  assert.equal(safeUrl('https://user:pw@twitch.tv/x'), '#');
  assert.equal(safeUrl('https://twitch.tv/gaules'), 'https://twitch.tv/gaules');
  assert.equal(safeImg('https://evil.com/a.png'), null);
  const img = safeImg("https://i.ytimg.com/vi/a/x.jpg');background:url(https://evil.com/");
  assert.ok(!/['"()]/.test(img), img);
  assert.equal(safeImg('data:image/svg+xml,<svg onload=alert(1)>'), null);
});

test('API ao vivo recusa métodos que não sejam GET/HEAD', async () => {
  const { default: handler } = await import('../api/live.js');
  let status, body; const h = {};
  await handler({ method: 'POST' }, { setHeader: (k, v) => (h[k] = v), status(s) { status = s; return this; }, send(b) { body = b; } });
  assert.equal(status, 405);
  assert.equal(h['X-Content-Type-Options'], 'nosniff');
});
