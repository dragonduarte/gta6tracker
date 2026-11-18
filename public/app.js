'use strict';
/* ============================================================ config */
const CFG = window.SITE_CONFIG || {};               // editar em public/config.js
const AUTHOR = String(CFG.author || 'Duarte Rodrigues');
const AUTHOR_URL = (() => { try { const u = new URL(CFG.authorUrl); if (u.protocol === 'https:') return u.href; } catch { /* usa o padrão */ } return 'https://www.linkedin.com/in/duartenrodrigues26/'; })();
const PUBLIC_DOWNLOADS = CFG.publicDownloads !== false;
const LAUNCH = new Date(CFG.launch || '2026-11-19T00:00:00Z');
const ANNOUNCED = new Date('2025-11-06T00:00:00Z');   // anúncio da data final
const LIVE_EVERY = 120e3, HISTORY_EVERY = 10 * 60e3;
const PLATFORMS = ['twitch', 'kick', 'youtube'];
const NAMES = { twitch: 'Twitch', kick: 'Kick', youtube: 'YouTube' };
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const COLOR = { twitch: css('--twitch'), kick: css('--kick'), youtube: css('--youtube') };

/* ============================================================ textos */
const I18N = {
  pt: {
    locale: 'pt-PT',
    scope_global: 'Mundo', scope_portugal: 'Portugal', scope_luso: 'Em português',
    lead: 'Quantas pessoas estão a ver GTA VI (GTA 6, Grand Theft Auto VI) neste momento? Espectadores, streams e vídeos em tempo real na Twitch, Kick e YouTube.',
    hero_viewers: { global: 'a ver agora, em todo o mundo', portugal: 'a ver agora, em streams de Portugal', luso: 'a ver agora, em streams em português' },
    hero_streams: 'streams em direto agora', days: 'dias', hours: 'horas', minutes: 'min', seconds: 'seg',
    cd_until_t: 'Faltam para o lançamento', cd_since_t: 'Desde o lançamento', cd_date: '19 nov 2026 · PS5 & Xbox Series X|S',
    now_title: { global: 'Agora, em todo o mundo', portugal: 'Agora, em Portugal', luso: 'Agora, em língua portuguesa' },
    now_sub: { global: 'Soma das três plataformas.', portugal: 'Streams portuguesas (PT-PT). Vê a metodologia no fim da página.', luso: 'Todas as streams em português: Portugal, Brasil e outros.' },
    share_title: 'Fatia de espectadores por plataforma',
    share_btn: 'Descarregar', download: 'Descarregar imagem', pdf: 'Guardar em PDF', embed: 'Incorporar no teu site', close: 'Fechar', downloading: 'A preparar a imagem…',
    by: 'por', author_role: 'Fiz este tracker. Se usares os dados ou as imagens, indica a fonte.', record: '🔥 Novo recorde', credit_line: 'Dados e visualização de', made_by: 'Feito por',
    headline: { global: (n) => `Neste momento, <span class="n tnum">${n}</span> pessoas estão a ver GTA&nbsp;VI`, portugal: (n) => `Neste momento, <span class="n tnum">${n}</span> pessoas veem GTA&nbsp;VI em streams portuguesas`, luso: (n) => `Neste momento, <span class="n tnum">${n}</span> pessoas veem GTA&nbsp;VI em português` },
    hero_sub: (s, live) => `Em ${s} streams na Twitch, na Kick e no YouTube. ${live}`,
    live: 'Ao vivo', live_ago: (m) => m < 1 ? 'Atualizado agora mesmo.' : `Atualizado há ${m} min.`, live_off: (d) => `Última recolha às ${d}.`,
    status_live: 'Ao vivo', status_off: 'Última recolha',
    cd_until: (d, h, m, s) => `O jogo sai a 19 de novembro. Faltam <b class="tnum">${d}</b> dias, <b class="tnum">${h}</b> h <b class="tnum">${m}</b> min <b class="tnum">${s}</b> s.`,
    cd_since: (d, h) => `O jogo saiu há <b class="tnum">${d}</b> ${d === 1 ? 'dia' : 'dias'} e <b class="tnum">${h}</b> h.`,
    cd_announced: 'Data anunciada a 6 de novembro de 2025', cd_pct: (p) => `${p}% da espera`, cd_out: 'Já saiu',
    k_now: 'Espectadores agora', k_peak: 'Pico registado', k_hours: 'Horas assistidas', k_streams: 'Streams agora', k_rank: 'Lugar na Twitch', k_share: 'Fatia do total mundial', k_unique: 'Canais diferentes',
    k_hours_note: 'estimativa desde o início', k_rank_note: 'entre todos os jogos', k_unique_note: 'já transmitiram GTA VI', k_share_note: 'dos espectadores globais', k_streams_note: 'nas três plataformas',
    streams: 'streams', stream1: 'stream', of_total: 'do total', top100: 'só as 100 maiores', top50: 'só as 50 maiores lives', hourly: 'atualizado de hora a hora', live_short: 'ao vivo',
    ts_h2: { v: 'Ao longo do tempo', s: 'Streams ao longo do tempo' },
    ts_insight: (r) => r, m_viewers: 'Espectadores', m_streams: 'Streams', all: 'Tudo', r_month: '1 mês', forecast: 'previsão',
    board_title: { global: 'Quem tem mais gente a ver', portugal: 'Streamers portugueses com mais gente', luso: 'Streamers em português com mais gente' },
    board_desc: 'Agora, nas três plataformas', board_empty: 'Ninguém a transmitir nesta vista neste momento.',
    viewers: 'espectadores', views: 'visualizações',
    yt_sub: 'Lives e vídeos novos que mencionam "GTA VI", "GTA 6", "GTA6", "Grand Theft Auto VI" ou "Grand Theft Auto 6".',
    yt_new_title: 'Vídeos novos publicados', yt_new_desc: 'Por cada 3 horas. O número é uma estimativa do próprio YouTube.',
    lang_title: 'Twitch e Kick por língua', lang_desc: 'Espectadores na última recolha, 8 línguas com mais audiência',
    vid_title: { global: 'Os vídeos novos mais vistos', portugal: 'Vídeos novos de canais portugueses', luso: 'Vídeos novos em português' },
    vid_desc: 'Publicados nas 3 horas antes da última recolha de vídeos', no_videos: 'Ainda não há vídeos nesta vista.',
    stale: 'Os dados estão atrasados', err: 'sem dados de momento', updated: 'Atualizado',
    no_data: 'Ainda não há dados. A primeira recolha aparece aqui dentro de alguns minutos.',
    fc_title: 'Previsão para as próximas 24 horas', fc_chart: 'Real e previsto', fc_chart_desc: 'Total de espectadores nesta vista', fc_real: 'Real', fc_pred: 'Previsto',
    fc_track: 'Acertámos?', fc_track_desc: 'A previsão de cada dia, feita à meia-noite, comparada com o pico real',
    fc_th: ['Dia', 'Pico previsto', 'Pico real', 'Erro'],
    fc_insight: (pk, h, d) => `Pelo ritmo dos últimos dias, o próximo pico deve rondar <b>${pk}</b> pessoas, por volta das <b>${h}</b> de ${d}. O modelo é simples: repete o padrão de cada hora dos últimos 3 dias e ajusta pela tendência.`,
    fc_wait: 'A previsão aparece quando houver pelo menos 24 horas de dados (depois do lançamento, conta só a partir dele).', fc_none: 'Ainda não há previsões terminadas para comparar.',
    method_title: 'Como é que isto é medido',
    method: `<p><b>Fontes.</b> Só APIs oficiais. Na Twitch, todas as streams da categoria "Grand Theft Auto VI" (também conhecido como GTA VI, GTA 6 ou Grand Theft Auto 6). Na Kick, as 100 maiores streams da categoria, que é o limite da API pública. No YouTube, as 50 lives mais vistas que mencionam GTA VI, GTA 6, GTA6, Grand Theft Auto VI ou Grand Theft Auto 6, e uma segunda pesquisa orientada a português; os vídeos novos são contados de 3 em 3 horas e esse número é uma estimativa do YouTube.</p>
      <p><b>Portugal e português.</b> A Twitch e a Kick dizem a língua de cada stream, não o país. "Em português" junta todas as streams em português, incluindo as do Brasil. "Portugal" conta as streams em português com sinais de português de Portugal no título ou nas etiquetas ("Portugal", "PT-PT", "tuga", a bandeira) e os canais de uma lista feita à mão. No YouTube usa-se o país declarado do canal. É uma contagem por baixo: há streamers portugueses que não aparecem.</p>
      <p><b>Espectadores</b> são pessoas a ver ao mesmo tempo, não visualizações acumuladas, e a mesma pessoa pode estar em mais do que uma stream. <b>Horas assistidas</b> é a soma dos espectadores de cada recolha horária, uma estimativa. A <b>previsão</b> repete o padrão horário dos últimos 3 dias, ajustado pela tendência; serve para dar uma ideia, não é uma promessa.</p>
      <p>A Twitch e a Kick atualizam a cada 2 minutos; o YouTube e o histórico, de hora a hora. Este projeto não tem ligação à Rockstar Games nem à Take-Two.</p>`,
    footer: 'Projeto independente com dados públicos das APIs oficiais. Podes partilhar os dados e as imagens, desde que indiques a fonte.',
    sc_eyebrow: { global: 'Live Tracker · Mundo', portugal: 'Live Tracker · Portugal 🇵🇹', luso: 'Live Tracker · Em português' },
    sc_sub: 'Twitch, Kick e YouTube', sc_peak: 'pessoas a ver ao mesmo tempo, o pico até agora', sc_top: 'Quem juntou mais gente',
    cant_render: 'Não foi possível gerar a imagem. Faz uma captura de ecrã ao cartão.',
  },
  en: {
    locale: 'en-US',
    scope_global: 'World', scope_portugal: 'Portugal', scope_luso: 'In Portuguese',
    lead: 'How many people are watching GTA VI (GTA 6, Grand Theft Auto VI) right now? Live viewers, streams and videos across Twitch, Kick and YouTube.',
    hero_viewers: { global: 'watching right now, worldwide', portugal: 'watching Portuguese streams right now', luso: 'watching Portuguese-language streams' },
    hero_streams: 'live streams right now', days: 'days', hours: 'hours', minutes: 'min', seconds: 'sec',
    cd_until_t: 'Until launch', cd_since_t: 'Since launch', cd_date: 'Nov 19, 2026 · PS5 & Xbox Series X|S',
    now_title: { global: 'Right now, worldwide', portugal: 'Right now, in Portugal', luso: 'Right now, in Portuguese' },
    now_sub: { global: 'All three platforms combined.', portugal: 'Portugal-based (PT-PT) streams. See the methodology at the bottom.', luso: 'Every Portuguese-language stream: Portugal, Brazil and others.' },
    share_title: 'Viewer share by platform',
    share_btn: 'Download', download: 'Download image', pdf: 'Save as PDF', embed: 'Embed on your site', close: 'Close', downloading: 'Preparing image…',
    by: 'by', author_role: 'I built this tracker. If you use the data or images, please credit the source.', record: '🔥 New record', credit_line: 'Data and visualisation by', made_by: 'Made by',
    headline: { global: (n) => `Right now, <span class="n tnum">${n}</span> people are watching GTA&nbsp;VI`, portugal: (n) => `Right now, <span class="n tnum">${n}</span> people are watching GTA&nbsp;VI on Portuguese streams`, luso: (n) => `Right now, <span class="n tnum">${n}</span> people are watching GTA&nbsp;VI in Portuguese` },
    hero_sub: (s, live) => `Across ${s} streams on Twitch, Kick and YouTube. ${live}`,
    live: 'Live', live_ago: (m) => m < 1 ? 'Updated just now.' : `Updated ${m} min ago.`, live_off: (d) => `Last snapshot at ${d}.`,
    status_live: 'Live', status_off: 'Last snapshot',
    cd_until: (d, h, m, s) => `The game comes out on November 19. <b class="tnum">${d}</b> days, <b class="tnum">${h}</b> h <b class="tnum">${m}</b> min <b class="tnum">${s}</b> s to go.`,
    cd_since: (d, h) => `The game came out <b class="tnum">${d}</b> ${d === 1 ? 'day' : 'days'} and <b class="tnum">${h}</b> h ago.`,
    cd_announced: 'Date announced on November 6, 2025', cd_pct: (p) => `${p}% of the wait`, cd_out: "It's out",
    k_now: 'Viewers now', k_peak: 'Peak recorded', k_hours: 'Hours watched', k_streams: 'Streams now', k_rank: 'Rank on Twitch', k_share: 'Share of the world total', k_unique: 'Different channels',
    k_hours_note: 'estimated since tracking began', k_rank_note: 'among all games', k_unique_note: 'have streamed GTA VI', k_share_note: 'of global viewers', k_streams_note: 'across the three platforms',
    streams: 'streams', stream1: 'stream', of_total: 'of total', top100: 'top 100 only', top50: 'top 50 lives only', hourly: 'updated hourly', live_short: 'live',
    ts_h2: { v: 'Over time', s: 'Streams over time' },
    ts_insight: (r) => r, m_viewers: 'Viewers', m_streams: 'Streams', all: 'All', r_month: '1 month', forecast: 'forecast',
    board_title: { global: 'Who has the most people watching', portugal: 'Portuguese streamers with the biggest audience', luso: 'Portuguese-language streamers with the biggest audience' },
    board_desc: 'Right now, across the three platforms', board_empty: 'Nobody is streaming in this view right now.',
    viewers: 'viewers', views: 'views',
    yt_sub: 'Live streams and new videos that mention "GTA VI", "GTA 6", "GTA6", "Grand Theft Auto VI" or "Grand Theft Auto 6".',
    yt_new_title: 'New videos published', yt_new_desc: 'Per 3 hours. The number is YouTube\'s own estimate.',
    lang_title: 'Twitch and Kick by language', lang_desc: 'Viewers in the latest snapshot, top 8 languages',
    vid_title: { global: 'Most-viewed new videos', portugal: 'New videos from Portuguese channels', luso: 'New videos in Portuguese' },
    vid_desc: 'Published in the 3 hours before the latest video snapshot', no_videos: 'No videos in this view yet.',
    stale: 'Data is delayed', err: 'no data right now', updated: 'Updated',
    no_data: 'No data yet. The first snapshot will show up here within a few minutes.',
    fc_title: 'Forecast for the next 24 hours', fc_chart: 'Actual and forecast', fc_chart_desc: 'Total viewers in this view', fc_real: 'Actual', fc_pred: 'Forecast',
    fc_track: 'How close were we?', fc_track_desc: "Each day's forecast, made at midnight, against the actual peak",
    fc_th: ['Day', 'Forecast peak', 'Actual peak', 'Error'],
    fc_insight: (pk, h, d) => `Based on the last few days, the next peak should be around <b>${pk}</b> people, at about <b>${h}</b> on ${d}. The model is simple: it repeats each hour's pattern from the last 3 days and adjusts for the trend.`,
    fc_wait: 'The forecast appears once there are at least 24 hours of data (after launch, it only counts from launch).', fc_none: 'No finished forecasts to compare yet.',
    method_title: 'How this is measured',
    method: `<p><b>Sources.</b> Official APIs only. On Twitch, every stream in the "Grand Theft Auto VI" category (also known as GTA VI, GTA 6 or Grand Theft Auto 6). On Kick, the 100 biggest streams in the category, which is the public API's limit. On YouTube, the 50 most-watched live streams mentioning GTA VI, GTA 6, GTA6, Grand Theft Auto VI or Grand Theft Auto 6, plus a second, Portuguese-targeted search; new videos are counted every 3 hours and that number is YouTube's estimate.</p>
      <p><b>Portugal and Portuguese.</b> Twitch and Kick report each stream's language, not its country. "In Portuguese" counts every Portuguese-language stream, including Brazil. "Portugal" counts Portuguese-language streams with European-Portuguese markers in the title or tags ("Portugal", "PT-PT", "tuga", the flag) plus a hand-made channel list. On YouTube it uses the channel's declared country. It undercounts: some Portuguese streamers won't show up.</p>
      <p><b>Viewers</b> means people watching at the same time, not cumulative views, and one person may be on more than one stream. <b>Hours watched</b> is the sum of viewers across hourly snapshots, an estimate. The <b>forecast</b> repeats the hourly pattern of the last 3 days, adjusted for trend; it is a rough guide, not a promise.</p>
      <p>Twitch and Kick refresh every 2 minutes; YouTube and the history, hourly. This project is not affiliated with Rockstar Games or Take-Two.</p>`,
    footer: 'Independent project using public data from official APIs. You can share the data and images as long as you credit the source.',
    sc_eyebrow: { global: 'Live Tracker · World', portugal: 'Live Tracker · Portugal 🇵🇹', luso: 'Live Tracker · In Portuguese' },
    sc_sub: 'Twitch, Kick and YouTube', sc_peak: 'people watching at once, the peak so far', sc_top: 'Who drew the biggest crowd',
    cant_render: 'Could not create the image. Take a screenshot of the card instead.',
  },
};

/* ============================================================ estado */
const KEYS = {
  global:   { v: 'v',   s: 's',   nv: 'nv',   top: 'top_global',   liveTop: 'top',          liveV: 'viewers',      liveS: 'streams' },
  portugal: { v: 'ppv', s: 'pps', nv: 'nvpp', top: 'top_portugal', liveTop: 'top_portugal', liveV: 'ptpt_viewers', liveS: 'ptpt_streams' },
  luso:     { v: 'pv',  s: 'ps',  nv: 'nvp',  top: 'top_pt',       liveTop: 'top_pt',       liveV: 'pt_viewers',   liveS: 'pt_streams' },
};
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
const params = new URLSearchParams(location.search);
const browserLang = (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
const RANGES = ['24', '48', '168', '720', 'all'];
const S = {
  lang: [params.get('lang'), store.get('lang'), browserLang].find((l) => l === 'pt' || l === 'en'),
  scope: [params.get('scope'), store.get('scope'), 'global'].find((x) => Object.prototype.hasOwnProperty.call(KEYS, x || '')),
  metric: 'v', range: [params.get('range'), store.get('range'), '168'].find((x) => RANGES.includes(x)),
  history: { points: [] }, latest: {}, live: null, liveOk: false, liveAt: null,
};
const T = () => I18N[S.lang];
const t = (k) => { const v = T()[k]; return v && typeof v === 'object' && !Array.isArray(v) ? (v[S.scope] ?? v[S.metric]) : v; };

/* ============================================================ formatação */
const nf = (opts) => new Intl.NumberFormat(T().locale, opts);
const fmt = (n) => n == null || isNaN(n) ? '—' : nf({ maximumFractionDigits: 0 }).format(Math.round(n));
const fmtC = (n) => n == null || isNaN(n) ? '—' : (Math.abs(n) >= 1e5 ? nf({ notation: 'compact', maximumFractionDigits: 1 }).format(n) : fmt(n));
const pct = (a, b) => b ? nf({ style: 'percent', maximumFractionDigits: a / b < 0.1 ? 1 : 0 }).format(a / b) : '—';
const dt = (d, o) => new Date(d).toLocaleString(T().locale, o);
const hhmm = (d) => dt(d, { hour: '2-digit', minute: '2-digit' });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Só deixamos passar ligações e imagens HTTPS dos domínios das plataformas. Tudo o resto vira '#' ou é ignorado.
const LINK_HOSTS = ['twitch.tv', 'www.twitch.tv', 'clips.twitch.tv', 'kick.com', 'www.kick.com', 'youtube.com', 'www.youtube.com', 'youtu.be'];
const IMG_HOSTS = ['static-cdn.jtvnw.net', 'clips-media-assets2.twitch.tv', 'i.ytimg.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com', 'files.kick.com', 'images.kick.com'];
function cleanUrl(u, hosts) {
  try {
    const url = new URL(String(u || ''));
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.username || url.password) return null;
    return url.href.replace(/['"()\\\s<>`]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
  } catch { return null; }
}
const safeUrl = (u) => cleanUrl(u, LINK_HOSTS) || '#';
const safeImg = (u) => cleanUrl(u, IMG_HOSTS);

/* contador animado: só no número principal e nos destaques */
const tweens = new WeakMap();
function animate(el, to, f = fmtC) {
  if (to == null || isNaN(to)) { el.textContent = '—'; el.dataset.v = ''; return; }
  const from = Number(el.dataset.v) || 0; el.dataset.v = to;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { el.textContent = f(to); return; }
  const start = performance.now(), dur = from ? 600 : 1000;
  cancelAnimationFrame(tweens.get(el));
  const step = (now) => { const p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = f(from + (to - from) * e); if (p < 1) tweens.set(el, requestAnimationFrame(step)); };
  tweens.set(el, requestAnimationFrame(step));
}

/* ============================================================ dados */
const points = () => S.history.points || [];
const lastPoint = () => points()[points().length - 1] || {};
const rangeStart = () => S.range === 'all' ? -Infinity : Date.now() - Number(S.range) * 3600e3;
const inRange = () => { const c = rangeStart(); const r = points().filter((p) => Date.parse(p.ts) >= c); return r.length ? r : points().slice(-Math.max(2, Number(S.range) || 2)); };
function nowFor(p, field) {               // field: 'V' ou 'S'
  const k = KEYS[S.scope];
  const live = S.liveOk && S.live?.[p];
  if (live && p !== 'youtube') return live[field === 'V' ? k.liveV : k.liveS];
  const lp = [...points()].reverse().find((x) => x[p]);
  return lp ? lp[p][field === 'V' ? k.v : k.s] : null;
}
const totalNow = (f) => { const vals = PLATFORMS.map((p) => nowFor(p, f)); return vals.every((v) => v == null) ? null : vals.reduce((s, v) => s + (v || 0), 0); };
const totalOf = (pt, key) => { const vals = PLATFORMS.map((p) => pt[p]?.[key]).filter((v) => v != null); return vals.length ? vals.reduce((a, b) => a + b, 0) : null; };
const seriesTotal = (key) => points().map((pt) => totalOf(pt, key) || 0);
function hoursWatched(key) {
  const pts = points(); let h = 0;
  for (let i = 0; i < pts.length; i++) {
    const gap = i ? Math.min(2, (Date.parse(pts[i].ts) - Date.parse(pts[i - 1].ts)) / 3600e3) : 1;
    h += (totalOf(pts[i], key) || 0) * gap;
  }
  return h;
}
function leaderboard() {
  const k = KEYS[S.scope];
  const rows = [], liveSet = new Set();
  if (S.liveOk) for (const p of ['twitch', 'kick']) if (S.live[p]) { rows.push(...(S.live[p][k.liveTop] || [])); liveSet.add(p); }
  rows.push(...(S.latest[k.top] || []).filter((r) => !liveSet.has(r.platform)));
  return rows.sort((a, b) => b.viewers - a.viewers).slice(0, 10);
}
function videoList() {
  const L = S.latest;
  if (S.scope === 'global') return L.top_videos || [];
  if (S.scope === 'luso') return L.top_videos_pt || [];
  const seen = new Set();
  return [...(L.top_videos_pt || []), ...(L.top_videos || [])].filter((v) => v.country === 'PT' && !seen.has(v.id) && seen.add(v.id)).sort((a, b) => b.views - a.views);
}
function forecastFor(key, fromTs = Date.now(), hours = 24) {
  const F = window.GTA_FORECAST; if (!F) return null;
  return F.forecast(points(), (p) => totalOf(p, key), fromTs, hours, LAUNCH.getTime());
}
function forecastPlatform(p, key) {
  const F = window.GTA_FORECAST; if (!F) return null;
  return F.forecast(points(), (pt) => pt[p]?.[key] ?? null, Date.parse(lastPoint().ts) + 1, 24, LAUNCH.getTime());
}

/* ============================================================ render */
function applyI18n() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i]').forEach((el) => { const v = t(el.dataset.i); if (typeof v === 'string') el.textContent = v; });
  document.querySelectorAll('#scopeSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.scope === S.scope));
  document.querySelectorAll('#langSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === S.lang));
  document.querySelectorAll('#metricSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.metric === S.metric));
  document.querySelectorAll('#rangeSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.range === String(S.range)));
  document.getElementById('method').innerHTML = T().method;
  const host = location.host || 'gta6-tracker';
  document.getElementById('footer').innerHTML = `${esc(t('made_by'))} <a href="${esc(AUTHOR_URL)}" target="_blank" rel="noopener">${esc(AUTHOR)}</a>. ${esc(T().footer)}`;
  document.getElementById('byline').textContent = `${t('by')} ${AUTHOR}`;
  document.getElementById('authorName').textContent = AUTHOR; document.getElementById('authorLink').href = AUTHOR_URL;
  document.getElementById('printCredit').innerHTML = `<span>GTA VI Tracker. ${esc(t('credit_line'))} <b>${esc(AUTHOR)}</b>, ${esc(AUTHOR_URL.replace('https://www.', ''))}</span><span>${esc(host)}, ${esc(dt(Date.now(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}</span>`;
  document.getElementById('openCard').hidden = !(PUBLIC_DOWNLOADS || params.get('owner'));
}

function renderHero() {
  const k = KEYS[S.scope];
  const now = totalNow('V');
  document.getElementById('livePulse').className = 'pulse' + (S.liveOk ? '' : ' off');
  const lastTs = points().length ? lastPoint().ts : null;
  document.getElementById('liveLabel').textContent = S.liveOk ? `${t('status_live')} · Twitch · Kick · YouTube` : `${t('status_off')}${lastTs ? ' · ' + dt(lastTs, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}`;
  animate(document.getElementById('heroViewers'), now);
  animate(document.getElementById('heroStreams'), totalNow('S'));
  document.getElementById('heroViewersLbl').textContent = t('hero_viewers');
  document.getElementById('heroSub').textContent = S.liveOk && S.liveAt ? T().live_ago(Math.floor((Date.now() - S.liveAt) / 60e3)) : lastTs ? T().live_off(hhmm(lastTs)) : '';
  const hist = seriesTotal(k.v);
  const rec = document.getElementById('recordChip');
  rec.textContent = t('record'); rec.classList.toggle('on', S.liveOk && hist.length > 12 && now > Math.max(...hist));
}

function renderNow() {
  const k = KEYS[S.scope];
  document.getElementById('nowTitle').textContent = t('now_title');
  document.getElementById('nowSub').textContent = t('now_sub');
  const tot = seriesTotal(k.v), now = totalNow('V');
  const peak = Math.max(0, ...tot, now || 0);
  const peakIdx = tot.indexOf(peak);
  const peakWhen = peakIdx >= 0 && points()[peakIdx] ? dt(points()[peakIdx].ts, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t('live');
  let fifth;
  if (S.scope === 'global') {
    const rank = (S.liveOk && S.live.twitch?.rank) || [...points()].reverse().find((p) => p.twitch?.rank)?.twitch.rank;
    const uniq = Object.values(S.latest.unique_channels || {}).reduce((a, b) => a + b, 0);
    fifth = rank ? [t('k_rank'), rank, t('k_rank_note'), (n) => 'nº ' + Math.max(1, Math.round(n))] : [t('k_unique'), uniq || null, t('k_unique_note')];
    if (S.lang === 'en' && rank) fifth[3] = (n) => '#' + Math.max(1, Math.round(n));
  } else {
    const g = PLATFORMS.reduce((s, p) => {
      if (S.liveOk && S.live?.[p] && p !== 'youtube') return s + (S.live[p].viewers || 0);
      const lp = [...points()].reverse().find((x) => x[p]);
      return s + (lp ? lp[p].v || 0 : 0);
    }, 0);
    fifth = [t('k_share'), now != null && g ? (now / g) : null, t('k_share_note'), (n) => pct(n, 1)];
  }
  const tiles = [
    [t('k_now'), now, S.liveOk ? '● ' + t('live') : ''],
    [t('k_peak'), peak || null, peakWhen],
    [t('k_hours'), hoursWatched(k.v) || null, t('k_hours_note')],
    [t('k_streams'), totalNow('S'), t('k_streams_note')],
    fifth,
  ];
  const box = document.getElementById('kpis');
  if (box.children.length !== tiles.length) box.innerHTML = tiles.map(() => `<div class="kpi"><div class="label"></div><div class="value tnum"></div><div class="note"></div></div>`).join('');
  tiles.forEach(([l, v, n, f], i) => {
    const el = box.children[i];
    el.querySelector('.label').textContent = l; el.querySelector('.note').textContent = n || '';
    animate(el.querySelector('.value'), v, f || fmtC);
  });

  const pbox = document.getElementById('platforms');
  if (!pbox.children.length) pbox.innerHTML = PLATFORMS.map((p) => `<div class="plat" data-p="${p}"><div class="top"><div class="name"><i class="dot" style="background:${COLOR[p]}"></i>${NAMES[p]}</div><span class="when"></span></div>
    <div class="value tnum"></div><div class="meta"></div><div class="spark"><canvas></canvas></div></div>`).join('');
  const sum = PLATFORMS.reduce((s, p) => s + (nowFor(p, 'V') || 0), 0);
  for (const p of PLATFORMS) {
    const el = pbox.querySelector(`[data-p="${p}"]`);
    const v = nowFor(p, 'V'), s = nowFor(p, 'S');
    const isLive = S.liveOk && S.live[p] && p !== 'youtube';
    const w = el.querySelector('.when'); w.className = 'when' + (isLive ? ' live' : ''); w.textContent = isLive ? '● ' + t('live') : t('hourly');
    animate(el.querySelector('.value'), v);
    const lim = p === 'kick' ? `, ${t('top100')}` : p === 'youtube' ? `, ${t('top50')}` : '';
    el.querySelector('.meta').textContent = `${fmt(s)} ${s === 1 ? t('stream1') : t('streams')}${lim}. ${pct(v || 0, sum)} ${t('of_total')}.`;
    spark(el.querySelector('canvas'), p, inRange().map((pt) => pt[p]?.[k.v] ?? null));
  }

  document.getElementById('shareTotal').textContent = `${fmt(sum)} ${t('viewers')}`;
  document.getElementById('shareBar').innerHTML = sum ? PLATFORMS.map((p) => `<i style="width:${(nowFor(p, 'V') || 0) / sum * 100}%;background:${COLOR[p]}" title="${NAMES[p]}"></i>`).join('') : '';
  document.getElementById('shareLegend').innerHTML = PLATFORMS.map((p) => `<span><i class="dot" style="background:${COLOR[p]}"></i>${NAMES[p]} <b class="tnum">${pct(nowFor(p, 'V') || 0, sum)}</b></span>`).join('');

  const chips = [];
  const upd = S.history.updated && Date.now() - Date.parse(S.history.updated);
  if (upd && upd > 2.5 * 3600e3) chips.push(`<span class="chip">${t('stale')}</span>`);
  for (const e of [...(S.latest.errors || []), ...((S.liveOk && S.live.errors) || [])]) chips.push(`<span class="chip" title="${esc(e)}">${esc(e.split(':')[0])}: ${t('err')}</span>`);
  document.getElementById('statusChips').innerHTML = [...new Set(chips)].join('');
}

/* ============================================================ gráficos */
Chart.defaults.color = css('--text-secondary');
Chart.defaults.borderColor = css('--grid');
Chart.defaults.font.family = css('--sans');
Chart.defaults.font.size = 12.5;
Chart.defaults.plugins.legend.display = false;
Object.assign(Chart.defaults.plugins.tooltip, {
  backgroundColor: '#0a0910', borderColor: css('--border'), borderWidth: 1, padding: 12, cornerRadius: 10,
  titleColor: css('--text-primary'), bodyColor: css('--text-secondary'), usePointStyle: true, boxPadding: 5, titleFont: { weight: '600' },
});
const launchLine = { id: 'launch', afterDatasetsDraw(ch) {
  const x = ch.scales.x; if (!x || x.type !== 'linear') return;
  const px = x.getPixelForValue(LAUNCH.getTime()); const { top, bottom, left, right } = ch.chartArea;
  if (px < left || px > right) return;
  const g = ch.ctx; g.save(); g.strokeStyle = css('--text-muted'); g.setLineDash([4, 4]); g.lineWidth = 1;
  g.beginPath(); g.moveTo(px, top); g.lineTo(px, bottom); g.stroke(); g.setLineDash([]);
  g.fillStyle = css('--text-secondary'); g.font = `600 12px ${css('--sans')}`; g.fillText(S.lang === 'pt' ? 'Lançamento' : 'Launch', px + 6, top + 12); g.restore();
} };
const timeTick = (v) => { const span = (Number(S.range) || 999) <= 48; return dt(v, span ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }); };
const charts = {};
function mkOrUpdate(id, cfg) {
  if (charts[id]) { charts[id].data = cfg.data; charts[id].options = cfg.options; charts[id].update('none'); return charts[id]; }
  return charts[id] = new Chart(document.getElementById(id), cfg);
}
function spark(canvas, p, data) {
  const key = 'spark_' + p;
  const cfg = { type: 'line', data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: COLOR[p], borderWidth: 2, pointRadius: 0, tension: .3, fill: true, backgroundColor: COLOR[p] + '1f' }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, spanGaps: true, plugins: { tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false, beginAtZero: true } } } };
  if (charts[key]) { charts[key].data = cfg.data; charts[key].update('none'); } else charts[key] = new Chart(canvas, cfg);
}
const baseLine = (xs, extra = {}) => ({ responsive: true, maintainAspectRatio: false, parsing: false, spanGaps: 3 * 3600e3, animation: false,
  interaction: { mode: 'nearest', axis: 'x', intersect: false },
  elements: { point: { radius: 0, hoverRadius: 5, hitRadius: 10, hoverBorderWidth: 2, hoverBorderColor: css('--surface-1') }, line: { borderWidth: 2, tension: .25 } },
  plugins: { tooltip: { callbacks: { title: (it) => dt(it[0].parsed.x, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), label: (c) => ` ${c.dataset.label}: ${fmt(c.parsed.y)}` } } },
  scales: { x: { type: 'linear', min: xs[0], max: xs[xs.length - 1], grid: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, callback: timeTick } },
            y: { beginAtZero: true, border: { display: false }, ticks: { callback: (v) => fmtC(v) } } }, ...extra });

function renderCharts() {
  const k = KEYS[S.scope], key = S.metric === 'v' ? k.v : k.s;
  const pts = inRange();
  const xs = pts.map((p) => Date.parse(p.ts));
  // previsão por plataforma (linha tracejada), só para espectadores e intervalos até 7 dias
  const showFc = S.metric === 'v' && S.range !== 'all' && Number(S.range) <= 168;
  const fcs = showFc ? Object.fromEntries(PLATFORMS.map((p) => [p, forecastPlatform(p, key)])) : {};
  const anyFc = Object.values(fcs).some(Boolean);
  const fcEnd = anyFc ? Math.max(...Object.values(fcs).filter(Boolean).map((f) => f[f.length - 1].ts)) : null;
  document.getElementById('tsLegend').innerHTML = PLATFORMS.map((p) => `<span><i class="dot" style="background:${COLOR[p]}"></i>${NAMES[p]}</span>`).join('') + (anyFc ? `<span><i class="fc"></i>${t('forecast')}</span>` : '');
  const ds = PLATFORMS.map((p) => ({ label: NAMES[p], data: pts.map((pt, i) => ({ x: xs[i], y: pt[p]?.[key] ?? null })), borderColor: COLOR[p], backgroundColor: COLOR[p] }));
  for (const p of PLATFORMS) if (fcs[p]) {
    const lastReal = pts.length && pts[pts.length - 1][p]?.[key];
    ds.push({ label: `${NAMES[p]} (${t('forecast')})`, data: [...(lastReal != null ? [{ x: xs[xs.length - 1], y: lastReal }] : []), ...fcs[p].map((f) => ({ x: f.ts, y: f.v }))],
      borderColor: COLOR[p], backgroundColor: COLOR[p], borderDash: [5, 4], borderWidth: 1.5 });
  }
  mkOrUpdate('tsChart', { type: 'line', plugins: [launchLine], data: { datasets: ds }, options: baseLine(xs.concat(fcEnd ? [fcEnd] : [])) });

  // frase sobre o intervalo escolhido
  const tot = pts.map((pt) => totalOf(pt, k.v) || 0);
  if (tot.length > 1) {
    const mx = Math.max(...tot), i = tot.indexOf(mx), first = tot.find((v) => v > 0) || 0, lastV = tot[tot.length - 1];
    const ch = first ? (lastV - first) / first : 0;
    const when = dt(pts[i].ts, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    document.getElementById('tsInsight').innerHTML = S.lang === 'pt'
      ? `Neste período, o pico foi de <b>${fmt(mx)}</b> pessoas a ver ao mesmo tempo, ${esc(when)}. ${Math.abs(ch) > 0.05 ? `Desde o início do período, a audiência ${ch > 0 ? 'subiu' : 'desceu'} <b>${pct(Math.abs(ch), 1)}</b>.` : 'A audiência está estável face ao início do período.'}`
      : `In this period, the peak was <b>${fmt(mx)}</b> people watching at once, on ${esc(when)}. ${Math.abs(ch) > 0.05 ? `Since the start of the period, the audience is ${ch > 0 ? 'up' : 'down'} <b>${pct(Math.abs(ch), 1)}</b>.` : 'The audience is flat compared with the start of the period.'}`;
  } else document.getElementById('tsInsight').textContent = '';
  document.getElementById('tsH2').textContent = T().ts_h2[S.metric];

  const yp = points().filter((p) => p.youtube?.[k.nv] != null && Date.parse(p.ts) >= rangeStart());
  mkOrUpdate('ytChart', {
    type: 'bar', plugins: [launchLine],
    data: { datasets: [{ label: t('yt_new_title'), data: yp.map((p) => ({ x: Date.parse(p.ts), y: p.youtube[k.nv] })), backgroundColor: COLOR.youtube, borderRadius: 3, borderSkipped: 'bottom', maxBarThickness: 22 }] },
    options: { responsive: true, maintainAspectRatio: false, parsing: false, animation: false,
      plugins: { tooltip: { callbacks: { title: (it) => `${dt(it[0].parsed.x - 3 * 3600e3, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} – ${hhmm(it[0].parsed.x)}`, label: (c) => ` ${fmt(c.parsed.y)}` } } },
      scales: { x: { type: 'linear', offset: true, min: yp.length ? Date.parse(yp[0].ts) - 5400e3 : undefined, max: yp.length ? Date.parse(yp[yp.length - 1].ts) + 5400e3 : undefined, grid: { display: false }, ticks: { maxTicksLimit: 6, maxRotation: 0, callback: timeTick } },
                y: { beginAtZero: true, border: { display: false }, ticks: { callback: (v) => fmtC(v) } } } },
  });

  const langs = Object.entries(S.latest.languages || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const dn = (() => { try { return new Intl.DisplayNames([T().locale], { type: 'language' }); } catch { return null; } })();
  const lname = (c) => { try { const n = dn?.of(c); return n ? n[0].toUpperCase() + n.slice(1) : c; } catch { return c; } };
  const highlight = S.scope !== 'global';
  mkOrUpdate('langChart', {
    type: 'bar',
    data: { labels: langs.map(([c]) => lname(c)), datasets: [{ label: t('viewers'), data: langs.map(([, v]) => v),
      backgroundColor: langs.map(([c]) => (highlight && c !== 'pt') ? COLOR.twitch + '55' : COLOR.twitch), borderRadius: 3, borderSkipped: 'start', maxBarThickness: 20 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { tooltip: { callbacks: { label: (c) => ` ${fmt(c.parsed.x)} ${t('viewers')}` } } },
      scales: { x: { beginAtZero: true, border: { display: false }, ticks: { callback: (v) => fmtC(v) } }, y: { grid: { display: false } } } },
  });
}

/* ============================================================ previsões */
function renderForecast() {
  const k = KEYS[S.scope];
  const fromTs = points().length ? Date.parse(lastPoint().ts) + 1 : Date.now();
  const f = forecastFor(k.v, fromTs, 24);
  const F = window.GTA_FORECAST;
  if (!f) {
    document.getElementById('fcInsight').textContent = t('fc_wait');
  } else {
    const pk = F.peakOf(f);
    document.getElementById('fcInsight').innerHTML = T().fc_insight(fmt(pk.v), esc(hhmm(pk.ts)), esc(dt(pk.ts, { weekday: 'long' })));
  }
  // gráfico: últimos 3 dias reais + 24 h previstas
  const real = points().filter((p) => Date.parse(p.ts) >= fromTs - 72 * 3600e3).map((p) => ({ x: Date.parse(p.ts), y: totalOf(p, k.v) }));
  const pred = f ? [...(real.length ? [real[real.length - 1]] : []), ...f.map((x) => ({ x: x.ts, y: x.v }))] : [];
  const xs = [...real.map((r) => r.x), ...pred.map((r) => r.x)];
  mkOrUpdate('fcChart', { type: 'line', plugins: [launchLine], data: { datasets: [
    { label: t('fc_real'), data: real, borderColor: css('--sun-1'), backgroundColor: css('--sun-1') },
    { label: t('fc_pred'), data: pred, borderColor: css('--sun-3'), backgroundColor: css('--sun-3'), borderDash: [5, 4] },
  ] }, options: baseLine(xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 1]) });

  // histórico de previsões vs real
  const days = Object.entries(S.predictions?.days || {}).sort((a, b) => b[0].localeCompare(a[0]));
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date());
  const rows = days.filter(([d]) => d < today).slice(0, 7).map(([d, e]) => {
    const p = e[S.scope]; if (!p) return '';
    const dayPts = points().filter((pt) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date(pt.ts)) === d);
    if (!dayPts.length) return '';
    const vals = dayPts.map((pt) => totalOf(pt, k.v) || 0), mx = Math.max(...vals), at = dayPts[vals.indexOf(mx)].ts;
    const err = mx ? (p.peak - mx) / mx : 0;
    const label = new Date(d + 'T12:00:00Z').toLocaleDateString(T().locale, { weekday: 'short', day: 'numeric', month: 'short' });
    return `<tr><td>${esc(label)}</td><td class="r">${fmt(p.peak)} <span style="color:var(--text-muted)">${hhmm(p.at)}</span></td><td class="r">${fmt(mx)} <span style="color:var(--text-muted)">${hhmm(at)}</span></td><td class="r ${Math.abs(err) <= 0.15 ? 'err-good' : 'err-bad'}">${err > 0 ? '+' : ''}${nf({ style: 'percent', maximumFractionDigits: 0 }).format(err)}</td></tr>`;
  }).filter(Boolean);
  const th = T().fc_th;
  document.getElementById('fcTable').innerHTML = rows.length
    ? `<table class="fc-table"><thead><tr><th>${th[0]}</th><th class="r">${th[1]}</th><th class="r">${th[2]}</th><th class="r">${th[3]}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`
    : `<div class="empty">${t('fc_none')}</div>`;
}

/* ============================================================ listas */
function initials(n) { return esc(String(n || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?'); }
function renderBoard() {
  document.getElementById('boardTitle').textContent = t('board_title');
  document.getElementById('boardDesc').textContent = t('board_desc');
  const rows = leaderboard();
  document.getElementById('board').innerHTML = rows.length ? rows.map((r, i) => {
    const mins = r.started_at ? Math.max(0, (Date.now() - Date.parse(r.started_at)) / 60e3) : null;
    const dur = mins == null ? '' : mins >= 60 ? `${Math.floor(mins / 60)} h ${String(Math.floor(mins % 60)).padStart(2, '0')}` : `${Math.floor(mins)} min`;
    return `<a class="row" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">
      <span class="rank">${i + 1}</span>
      <span class="avatar" style="border-color:${COLOR[r.platform] || 'var(--border)'}">${safeImg(r.avatar) ? `<img src="${esc(safeImg(r.avatar))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : initials(r.name)}</span>
      <span class="who"><span class="n">${esc(r.name)} ${r.portugal ? '<span class="tag pt">PT</span>' : ''}<span class="tag">${NAMES[r.platform]}</span></span><span class="t" title="${esc(r.title)}">${esc(r.title)}</span></span>
      <span class="viewers">${fmt(r.viewers)}<small>${dur || t('viewers')}</small></span></a>`;
  }).join('') : `<div class="empty">${t('board_empty')}</div>`;

  document.getElementById('ytSub').textContent = t('yt_sub');
  document.getElementById('vidTitle').textContent = t('vid_title');
  const vids = videoList().slice(0, 8);
  document.getElementById('videos').innerHTML = vids.length ? vids.map((v) => `<a class="video" href="${esc(safeUrl(v.url))}" target="_blank" rel="noopener">
      <div class="th" style="${safeImg(v.thumb) ? `background-image:url(&quot;${esc(safeImg(v.thumb))}&quot;)` : ''}"><b class="tnum">${fmtC(v.views)}</b></div>
      <div class="vt">${esc(v.title)}</div><div class="vc">${esc(v.channel)}${v.country === 'PT' ? ' <span class="tag pt">PT</span>' : ''}, ${fmt(v.views)} ${t('views')}</div></a>`).join('')
    : `<div class="empty" style="grid-column:1/-1">${t('no_videos')}</div>`;
}

/* ============================================================ contagem decrescente */
function tickCountdown() {
  const now = Date.now(), d = LAUNCH - now, abs = Math.abs(d);
  const D = Math.floor(abs / 864e5), H = Math.floor(abs / 36e5) % 24, M = Math.floor(abs / 6e4) % 60, Sx = Math.floor(abs / 1e3) % 60;
  document.getElementById('cdD').textContent = D;
  document.getElementById('cdH').textContent = String(H).padStart(2, '0');
  document.getElementById('cdM').textContent = String(M).padStart(2, '0');
  document.getElementById('cdS').textContent = String(Sx).padStart(2, '0');
  document.getElementById('cdTitle').textContent = d > 0 ? t('cd_until_t') : t('cd_since_t');
  const p = Math.min(1, Math.max(0, (now - ANNOUNCED) / (LAUNCH - ANNOUNCED)));
  document.getElementById('cdBar').style.width = (p * 100).toFixed(2) + '%';
  document.getElementById('cdPct').textContent = d > 0 ? T().cd_pct(nf({ maximumFractionDigits: 1 }).format(p * 100)) : '🎉 ' + t('cd_out');
}

/* ============================================================ imagem para o LinkedIn */
function cardSpark(vals, t0, t1) {
  if (vals.length < 3) return '';
  t0 ??= Date.parse(points()[0].ts); t1 ??= Date.parse(points()[points().length - 1].ts);
  const W = 928, H = 130, max = Math.max(...vals) || 1;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * W, H - 4 - (v / max) * (H - 10)]);
  const d = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  const li = (LAUNCH.getTime() - t0) / (t1 - t0);
  const lx = li > 0 && li < 1 ? li * W : null;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="margin-top:30px;overflow:visible">
    <defs><linearGradient id="scg" x1="0" x2="1"><stop offset="0" stop-color="#6c4bff"/><stop offset=".55" stop-color="#ff4f9a"/><stop offset="1" stop-color="#ffc95c"/></linearGradient>
    <linearGradient id="scf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff4f9a" stop-opacity=".28"/><stop offset="1" stop-color="#ff4f9a" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L ${W} ${H} L 0 ${H} Z" fill="url(#scf)"/><path d="${d}" fill="none" stroke="url(#scg)" stroke-width="4" stroke-linejoin="round"/>
    ${lx != null ? `<line x1="${lx}" x2="${lx}" y1="0" y2="${H}" stroke="#8c8799" stroke-dasharray="6 6"/><text x="${lx - 10}" y="18" text-anchor="end" fill="#c4c0cf" font-size="18" font-weight="600">${S.lang === 'pt' ? 'Lançamento' : 'Launch'}</text>` : ''}
  </svg>`;
}
function cardFoot(extra) {
  return `<div class="sc-foot"><span style="display:flex;align-items:center;gap:16px;color:var(--text-primary);font-size:24px"><span class="sc-mono">DR</span><span>${esc(t('credit_line'))} <b>${esc(AUTHOR)}</b><br><span style="color:var(--text-muted);font-size:20px">${esc(AUTHOR_URL.replace('https://www.', ''))}</span></span></span><span style="text-align:right">${esc(location.host || 'gta6-tracker')}<br>${esc(extra)}</span></div>`;
}
function buildCard() {
  if (S.cardMode === 'first24' && window.buildCard24) return window.buildCard24();
  const k = KEYS[S.scope];
  const tot = seriesTotal(k.v), now = totalNow('V') || 0;
  const peak = Math.max(0, ...tot, now);
  const rows = leaderboard().slice(0, 3);
  const uniq = Object.values(S.latest.unique_channels || {}).reduce((a, b) => a + b, 0);
  const tiles = [
    [fmtC(hoursWatched(k.v)), t('k_hours')],
    [fmtC(totalNow('S')), t('k_streams')],
    S.scope === 'global' && uniq ? [fmtC(uniq), t('k_unique')] : [fmtC(now), t('k_now')],
  ];
  const stamp = dt(Date.now(), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  document.getElementById('shareCard').innerHTML = `
    <div class="sc-eyebrow"><i class="pulse"></i>${esc(t('sc_eyebrow'))}</div>
    <div class="sc-title"><span class="grad">GTA VI</span></div>
    <div class="sc-sub">${esc(t('sc_sub'))}</div>
    <div class="sc-hero"><div class="n tnum">${fmt(peak)}</div><div class="l">${esc(t('sc_peak'))}</div></div>
    <div class="sc-grid">${tiles.map(([n, l]) => `<div class="sc-tile"><div class="n tnum">${n}</div><div class="l">${esc(l)}</div></div>`).join('')}</div>
    ${cardSpark(tot)}
    <div class="sc-top"><div style="font-size:22px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.14em;font-weight:600">${esc(t('sc_top'))}</div>
      ${rows.map((r, i) => `<div class="r"><span><b style="color:var(--text-muted);font-weight:500">${i + 1}</b> ${esc(r.name)} <span style="font-size:20px;color:var(--text-muted);display:flex;align-items:center;gap:8px"><i class="dot" style="background:${COLOR[r.platform]};width:12px;height:12px"></i>${NAMES[r.platform]}</span></span><span class="tnum">${fmt(r.viewers)}</span></div>`).join('')}</div>
    ${cardFoot(stamp)}`;
}
function fitCard() { const box = document.getElementById('cardScale'); document.getElementById('shareCard').style.transform = `scale(${box.clientWidth / 1080})`; }
async function downloadCard() {
  const btn = document.getElementById('dlCard'); const label = btn.textContent; btn.textContent = t('downloading'); btn.disabled = true;
  try {
    if (!window.htmlToImage) await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'vendor/html-to-image.js'; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
    const node = document.getElementById('shareCard'); const prev = node.style.transform; node.style.transform = 'none';
    const url = await htmlToImage.toPng(node, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true });
    node.style.transform = prev;
    const a = document.createElement('a'); a.href = url; a.download = `gta6-tracker-duarte-rodrigues-${S.scope}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.png`; a.click();
  } catch (e) { alert(t('cant_render')); }
  finally { btn.textContent = label; btn.disabled = false; fitCard(); }
}

/* ============================================================ carregamento */
async function getJSON(url) { const r = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' }); if (!r.ok) throw new Error(r.status); return r.json(); }
async function loadHistory() {
  const [h, l, f, p] = await Promise.allSettled([getJSON('data/history.json'), getJSON('data/latest.json'), getJSON('data/hall.json'), getJSON('data/predictions.json')]);
  if (h.status === 'fulfilled') S.history = h.value;
  if (l.status === 'fulfilled') S.latest = l.value;
  if (f.status === 'fulfilled') S.hall = f.value;
  if (p.status === 'fulfilled') S.predictions = p.value;
}
async function loadLive() {
  try { const j = await getJSON('api/live'); S.live = j; S.liveOk = !!(j.twitch || j.kick); if (S.liveOk) S.liveAt = Date.parse(j.ts) || Date.now(); }
  catch { S.liveOk = false; }
}
function renderAll() {
  applyI18n(); tickCountdown(); renderHero();
  const empty = !points().length && !S.liveOk;
  document.querySelector('main').classList.toggle('nodata', empty);
  if (empty) { document.getElementById('kpis').innerHTML = `<div class="empty" style="grid-column:1/-1">${t('no_data')}</div>`; return; }
  renderNow();
  renderCharts(); renderForecast(); renderBoard();
  try { window.renderExtras?.(); } catch (e) { console.error('extras', e); }
  if (document.getElementById('modal').classList.contains('open')) { buildCard(); fitCard(); }
}
function setState(patch) {
  Object.assign(S, patch);
  store.set('lang', S.lang); store.set('scope', S.scope); store.set('range', S.range);
  const u = new URL(location.href); u.searchParams.set('lang', S.lang); u.searchParams.set('scope', S.scope); u.searchParams.set('range', S.range); history.replaceState(null, '', u);
  if ('scope' in patch || 'lang' in patch) document.getElementById('kpis').innerHTML = '';
  renderAll();
}
const onSeg = (id, fn) => document.getElementById(id).onclick = (e) => { const b = e.target.closest('button'); if (b) fn(b); };
onSeg('scopeSeg', (b) => KEYS[b.dataset.scope] && setState({ scope: b.dataset.scope }));
onSeg('langSeg', (b) => I18N[b.dataset.lang] && setState({ lang: b.dataset.lang }));
onSeg('metricSeg', (b) => ['v', 's'].includes(b.dataset.metric) && setState({ metric: b.dataset.metric }));
onSeg('rangeSeg', (b) => RANGES.includes(b.dataset.range) && setState({ range: b.dataset.range }));
document.getElementById('openCard').onclick = () => { S.cardMode = 'now'; document.getElementById('modal').classList.add('open'); buildCard(); fitCard(); };
document.getElementById('closeCard').onclick = () => document.getElementById('modal').classList.remove('open');
document.getElementById('modal').onclick = (e) => { if (e.target.id === 'modal') e.currentTarget.classList.remove('open'); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open')); });
document.getElementById('dlCard').onclick = downloadCard;
function printPdf() { document.getElementById('modal').classList.remove('open'); applyI18n(); setTimeout(() => print(), 50); }
document.getElementById('printBtn').onclick = printPdf;
document.getElementById('pdfFromModal').onclick = printPdf;
addEventListener('beforeprint', () => Object.values(charts).forEach((c) => c.resize()));
addEventListener('afterprint', () => Object.values(charts).forEach((c) => c.resize()));
addEventListener('resize', fitCard);
// avatares que não carregam: mostra as iniciais (sem handlers inline, compatível com a CSP)
document.addEventListener('error', (e) => { const img = e.target; if (img && img.tagName === 'IMG' && img.closest('.avatar')) img.remove(); }, true);

(async function boot() {
  renderAll();
  await Promise.all([loadHistory(), loadLive()]);
  if (!window.GTA_FORECAST) await new Promise((r) => setTimeout(r, 50));
  renderAll();
  if (params.get('card')) document.getElementById('openCard').click();
  setInterval(tickCountdown, 1000);
  setInterval(async () => { if (!document.hidden) { await loadLive(); renderAll(); } }, LIVE_EVERY);
  setInterval(async () => { if (!document.hidden) { await loadHistory(); renderAll(); } }, HISTORY_EVERY);
})();
