// /api/visitors — quantas pessoas estão no site agora + visitas (hoje e total).
// Guarda só contadores (nada de IPs, cookies ou identificadores) numa base Redis grátis (Upstash, via Vercel).
//   POST /api/visitors {"first":true}  → batimento do browser (a cada 5 min enquanto a página está aberta)
//   GET  /api/visitors                  → { online, today, total }  (cache 30 s na CDN)
// Sem a base configurada, responde 404 e o site esconde o contador.

const SLOT_S = 300;                  // cada visitante envia 1 batimento por janela de 5 min (poupa comandos do Upstash grátis: 500 000/mês)
const env = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});
const lisbonDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(d);

async function redis(cmds) {
  const { url, token } = env();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds), signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()).map((x) => x.result);
  } finally { clearTimeout(timer); }
}

function sameOrigin(req) {
  const h = req.headers || {};
  if (h['sec-fetch-site'] && h['sec-fetch-site'] !== 'same-origin') return false;
  const origin = h.origin;
  if (!origin) return true;
  try { return new URL(origin).host === h.host; } catch { return false; }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = '';
  for await (const c of req) { raw += c; if (raw.length > 200) break; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  const { url, token } = env();
  if (process.env.VISITORS_OFF === '1' || !/^https:\/\//.test(url) || !token) { res.setHeader('Cache-Control', 'public, s-maxage=300'); return res.status(404).send('{"error":"off"}'); }

  const slot = Math.floor(Date.now() / 1000 / SLOT_S);
  const day = lisbonDay();

  if (req.method === 'POST') {
    res.setHeader('Cache-Control', 'no-store');
    if (!sameOrigin(req)) return res.status(403).send('{"error":"forbidden"}');
    const body = await readBody(req);
    // 1 comando por batimento (o plano grátis do Upstash conta comandos); EXPIRE só quando a chave nasce
    const cmds = [['INCR', `on:${slot}`]];
    if (body.first === true) cmds.push(['INCR', 'visits:total'], ['INCR', `visits:${day}`]);
    try {
      const r = await redis(cmds);
      const exp = [];
      if (r[0] === 1) exp.push(['EXPIRE', `on:${slot}`, String(SLOT_S * 3)]);
      if (body.first === true && r[2] === 1) exp.push(['EXPIRE', `visits:${day}`, String(3 * 86400)]);
      if (exp.length) await redis(exp);
    } catch { /* contador é opcional */ }
    return res.status(204).end();
  }
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD, POST');
    return res.status(405).send('{"error":"method not allowed"}');
  }
  try {
    const [vals] = await redis([['MGET', `on:${slot}`, `on:${slot - 1}`, 'visits:total', `visits:${day}`]]);
    const n = (v) => Math.max(0, Number(v) || 0);
    // a janela atual ainda está a encher: usa a maior das duas últimas
    const body = { online: Math.max(n(vals[0]), n(vals[1]), 1), today: n(vals[3]), total: n(vals[2]) };
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).send(JSON.stringify(body));
  } catch {
    res.setHeader('Cache-Control', 'public, s-maxage=30');
    return res.status(503).send('{"error":"unavailable"}');
  }
}
