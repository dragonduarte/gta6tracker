'use strict';
// Widget incorporável: só lê dados públicos agregados e escreve tudo com textContent.
const C = window.SITE_CONFIG || {}, q = new URLSearchParams(location.search);
const lang = q.get('lang') === 'en' ? 'en' : 'pt', scope = ['global', 'portugal', 'luso'].includes(q.get('scope')) ? q.get('scope') : 'global';
const L = {
  pt: { loc: 'pt-PT', lbl: { global: 'a ver agora, no mundo', portugal: 'a ver agora, streams de Portugal', luso: 'a ver agora, streams em português' }, sc: { global: '🌍 Mundo', portugal: '🇵🇹 Portugal', luso: '🗣️ Em português' }, until: 'para o lançamento', since: 'desde o lançamento', by: 'por', go: 'Ver dashboard ↗' },
  en: { loc: 'en-US', lbl: { global: 'watching now, worldwide', portugal: 'watching Portuguese streams', luso: 'watching Portuguese-language streams' }, sc: { global: '🌍 World', portugal: '🇵🇹 Portugal', luso: '🗣️ In Portuguese' }, until: 'until launch', since: 'since launch', by: 'by', go: 'Open dashboard ↗' },
}[lang];
const K = { global: ['v', 'viewers'], portugal: ['ppv', 'ptpt_viewers'], luso: ['pv', 'pt_viewers'] }[scope];
const LAUNCH = Date.parse(C.launch || '2026-11-19T00:00:00Z') || Date.parse('2026-11-19T00:00:00Z');
document.getElementById('scope').textContent = L.sc[scope];
document.getElementById('l').textContent = L.lbl[scope];
// crédito do autor, construído com DOM (sem HTML a partir de texto)
const by = document.getElementById('by'); by.textContent = L.by + ' ';
const a = document.createElement('a'); a.textContent = String(C.author || 'Duarte Rodrigues'); a.target = '_blank'; a.rel = 'noopener noreferrer';
try { const u = new URL(C.authorUrl); if (u.protocol === 'https:') a.href = u.href; } catch { /* sem link */ }
by.appendChild(a);
const go = document.getElementById('go'); go.textContent = L.go; go.href = `${location.origin}/?scope=${scope}&lang=${lang}`; go.target = '_blank'; go.rel = 'noopener';
function tick() {
  const d = LAUNCH - Date.now(), a = Math.abs(d), D = Math.floor(a / 864e5), H = Math.floor(a / 36e5) % 24, M = Math.floor(a / 6e4) % 60;
  document.getElementById('cd').textContent = `${D}d ${String(H).padStart(2, '0')}h ${String(M).padStart(2, '0')}m`;
  document.getElementById('cdl').textContent = d > 0 ? L.until : L.since;
}
async function load() {
  const j = (u) => fetch(u, { cache: 'no-cache', credentials: 'same-origin' }).then((r) => r.ok ? r.json() : null).catch(() => null);
  const [h, live] = await Promise.all([j('api/data?f=history').then((x) => x || j('data/history.json')), j('api/live')]);
  const pts = h?.points || [];
  const tot = pts.map((p) => ['twitch', 'kick', 'youtube'].reduce((s, k) => s + (p[k]?.[K[0]] || 0), 0));
  let now = tot.length ? tot[tot.length - 1] : null;
  const ok = live && (live.twitch || live.kick);
  if (ok) {
    const lastYt = [...pts].reverse().find((p) => p.youtube)?.youtube?.[K[0]] || 0;
    now = (live.twitch?.[K[1]] || 0) + (live.kick?.[K[1]] || 0) + lastYt;
  }
  document.getElementById('p').className = 'p' + (ok ? '' : ' off');
  document.getElementById('n').textContent = now == null ? '—' : new Intl.NumberFormat(L.loc).format(now);
  const v = tot.slice(-72), max = Math.max(1, ...v);
  document.getElementById('sp').setAttribute('d', v.length > 1 ? v.map((x, i) => `${i ? 'L' : 'M'}${(i / (v.length - 1) * 300).toFixed(1)} ${(32 - (Number(x) || 0) / max * 30).toFixed(1)}`).join(' ') : '');
}
tick(); setInterval(tick, 30000); load(); setInterval(load, 120000);
