// GET /api/live — números AO VIVO de Twitch e Kick.
// Corre no servidor do Vercel: as chaves ficam nas Environment Variables do Vercel e nunca vão para o browser.
// Resposta em cache na CDN durante 2 min → no máximo ~1 pedido a cada 2 minutos às APIs, por muitos visitantes que tenhas.
// O YouTube não entra aqui (a quota grátis não chega para pedidos ao minuto) — vem da recolha horária.
import { twitchSnapshot, kickSnapshot, creds, strip } from '../lib/platforms.js';

// Proteção extra: além da cache da CDN, cada instância reaproveita o último resultado durante 45 s
// e junta pedidos simultâneos num só. Assim, mesmo com milhares de visitas, as APIs quase não sentem.
let memo = null, inflight = null;
const FRESH_MS = 100000;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  // Só leitura: qualquer outro método é recusado. Não há parâmetros de entrada a processar.
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send(JSON.stringify({ error: 'method not allowed' }));
  }
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
  if (memo && Date.now() - memo.at < FRESH_MS) return res.status(200).send(memo.body);
  try {
    inflight ??= collect().finally(() => { inflight = null; });
    const body = await inflight;
    memo = { at: Date.now(), body };
    res.status(200).send(body);
  } catch (e) {
    if (memo) return res.status(200).send(memo.body); // em caso de falha, devolve o último bom
    res.status(200).send(JSON.stringify({ ts: new Date().toISOString(), errors: ['live: indisponível'] }));
  }
}

async function collect() {
  const c = creds();
  const out = { ts: new Date().toISOString(), errors: [] };
  await Promise.all([
    ['twitch', c.twitch && (() => twitchSnapshot({ ...c.twitch, maxPages: 40 }))],
    ['kick', c.kick && (() => kickSnapshot(c.kick))],
  ].map(async ([k, fn]) => {
    if (!fn) return;
    try {
      const r = await fn();
      out[k] = {
        viewers: r.viewers, streams: r.streams, pt_viewers: r.pt_viewers, pt_streams: r.pt_streams,
        ptpt_viewers: r.ptpt_viewers, ptpt_streams: r.ptpt_streams, rank: r.rank ?? null, complete: r.complete,
        top: r.list.slice(0, 15).map(strip),
        top_pt: r.list.filter((s) => s.lang === 'pt').slice(0, 15).map(strip),
        top_portugal: r.list.filter((s) => s.portugal).slice(0, 15).map(strip),
      };
    } catch (e) {
      out.errors.push(`${k}: ${String(e.message).slice(0, 160)}`); // nunca inclui credenciais
    }
  }));
  // Se uma plataforma falhou mas temos um valor recente, mantém-no (marcado como antigo)
  if (memo) { const prev = JSON.parse(memo.body); for (const k of ['twitch', 'kick']) if (!out[k] && prev[k]) out[k] = { ...prev[k], stale: true }; }
  return JSON.stringify(out);
}
