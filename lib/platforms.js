// Recolha de dados de Twitch, Kick e YouTube — partilhado pelo coletor horário e pelo /api/live.
// As credenciais vêm SEMPRE de variáveis de ambiente do servidor. Nunca chegam ao browser.

import PORTUGAL from '../portugal.js';

export const GAME_NAME = 'Grand Theft Auto VI';
// Todas as formas de escrever o nome do jogo (pesquisa no YouTube e deteção da categoria na Twitch/Kick)
export const KEYWORDS = ['GTA VI', 'GTA 6', 'GTA6', 'Grand Theft Auto VI', 'Grand Theft Auto 6'];
const CATEGORY_NAMES = ['Grand Theft Auto VI', 'Grand Theft Auto 6', 'GTA VI', 'GTA 6'];
const YT_QUERY = KEYWORDS.map((k) => `"${k}"`).join('|');
const isGameName = (name) => CATEGORY_NAMES.some((n) => lc(name) === lc(n));
const TIMEOUT_MS = 15000;
// Categorias que não são jogos (ficam fora da comparação "GTA VI vs outros jogos")
export const NON_GAME = /^(just chatting|irl|music|art|asmr|special events|talk shows & podcasts|sports|travel & outdoors|pools, hot tubs, and beaches|slots|slots & casino|casino|virtual casino|gambling|i'm only sleeping|podcasts?|food & drink|science & technology|makers & crafting|beauty & body art|fitness & health)$/i;

// ---------------------------------------------------------------- helpers
// Contador de consumo desta execução (para respeitar os limites grátis e mostrar no log)
export const usage = { twitch: 0, kick: 0, youtube: 0, retries: 0, throttled: 0 };
export const resetUsage = () => { for (const k of Object.keys(usage)) usage[k] = 0; };
// Custo em unidades de quota do YouTube Data API v3: search = 100, o resto = 1
const ytCost = (url) => (/\/youtube\/v3\/search\b/.test(url) ? 100 : 1);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const MAX_WAIT_MS = 20000;

async function http(url, opts = {}, attempt = 0) {
  if (url.includes('api.twitch.tv')) usage.twitch++;
  else if (url.includes('api.kick.com')) usage.kick++;
  else if (url.includes('googleapis.com/youtube')) usage.youtube += ytCost(url);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    // 429 / 503: espera o que a API pedir (máx. 20 s) e tenta no máximo 2 vezes; depois desiste sem insistir
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const ra = Number(res.headers.get('retry-after')) || 0;
      const reset = Number(res.headers.get('ratelimit-reset')) || 0;       // Twitch: timestamp UNIX
      const waitS = ra || (reset ? Math.max(0, reset - Date.now() / 1000) : 0) || 2 ** (attempt + 1);
      const wait = Math.min(MAX_WAIT_MS, Math.ceil(waitS * 1000) + 250 * (attempt + 1));
      usage.retries++;
      await res.text().catch(() => {});
      await sleep(wait);
      return http(url, opts, attempt + 1);
    }
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 200) }; }
    if (!res.ok) {
      const msg = body?.error?.message || body?.message || body?.raw || res.statusText;
      const err = new Error(`${res.status} ${msg}`);
      err.status = res.status;
      if (res.status === 429) usage.throttled++;
      // YouTube: quota diária esgotada → não vale a pena insistir
      if (res.status === 403 && /quota/i.test(JSON.stringify(body?.error?.errors || msg))) err.quotaExceeded = true;
      throw err;
    }
    return body;
  } finally { clearTimeout(t); }
}
const qs = (p) => new URLSearchParams(Object.entries(p).filter(([, v]) => v != null && v !== '')).toString();
const lc = (s) => String(s || '').toLowerCase();
const sum = (arr, f) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);

// Deteção "Portugal" (vs Brasil): nenhuma plataforma expõe o país do streamer na stream.
// Sinais (ver portugal.js): lista curada, canais aprendidos, marcas de Portugal e de português europeu.
const norm = (s) => lc(s).normalize('NFC');
const PT_LISTS = {
  twitch: new Set((PORTUGAL.twitch || []).map(lc)),
  kick: new Set((PORTUGAL.kick || []).map(lc)),
  youtube: new Set(),
};
const LEARNED = { twitch: new Set(), kick: new Set(), youtube: new Set() };
export function setLearnedPortugal(obj = {}) {
  for (const k of Object.keys(LEARNED)) LEARNED[k] = new Set((obj[k] || []).map(lc));
}
export function curatedPortugal(platform, login) {
  return !!(PT_LISTS[platform]?.has(lc(login)) || LEARNED[platform]?.has(lc(login)));
}
const PT_KEYWORDS = (PORTUGAL.keywords || []).map(norm);
const word = (w) => new RegExp(`(^|[^\\p{L}])${w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u');
const isWord = (k) => /^[\p{L}-]+$/u.test(k);
const has = (list, text, flat) => list.some((k) => (isWord(k) ? word(k).test(text) : flat.includes(k.replace(/\s+/g, ''))));
const PT_HARD = (PORTUGAL.ptpt || []).map(norm);
const PT_SOFT = (PORTUGAL.ptpt_soft || []).map(norm);
const BR = (PORTUGAL.brazil || []).map(norm);
// gerúndio ("jogando", "chegando", "fazendo") é típico do Brasil; em Portugal diz-se "a jogar"
const GERUND = /(^|[^\p{L}])\p{L}{3,}(ando|endo|indo)($|[^\p{L}])/u;
const GERUND_OK = new Set(['quando', 'mando', 'comando', 'bando', 'brando', 'lindo', 'vindo', 'bem-vindo', 'bem-vindos', 'vindos', 'fundo', 'mundo', 'segundo', 'sendo', 'lendo', 'tendo', 'vendo', 'fernando', 'orlando', 'leonardo', 'armando', 'rolando', 'remando']);
const hasGerund = (text) => text.split(/[^\p{L}-]+/u).some((w) => w.length >= 6 && /(ando|endo|indo)$/.test(w) && !GERUND_OK.has(w));

// "strong" = marca explícita de Portugal no título; "weak" = português europeu sem marcas do Brasil; null = nada (ou Brasil)
export function ptSignal(title, tags = []) {
  const t = norm(title || ''), tf = t.replace(/\s+/g, '');
  const tg = norm((tags || []).join(' ')), tgf = tg.replace(/\s+/g, '');
  const all = t + ' ' + tg, allf = tf + tgf;
  const brazil = has(BR, all, allf) || hasGerund(t);
  if (has(PT_KEYWORDS, t, tf)) return brazil && (allf.includes('🇧🇷') || has(['brasil', 'brazil', 'ptbr', 'pt-br', '(br)', '[br]'], all, allf)) ? null : 'strong';
  if (brazil) return null;
  const soft = PT_SOFT.filter((k) => word(k).test(t)).length;
  const tagPt = has(['portugal', 'ptpt', 'pt-pt', 'tuga', 'tugas'], tg, tgf);
  if (has(PT_HARD, t, tf) || soft >= 2 || (soft >= 1 && tagPt) || tagPt) return 'weak';
  return null;
}
export function looksPortugal(platform, login, title, tags = [], lang = 'pt') {
  if (curatedPortugal(platform, login)) return true;
  if (lang && lang !== 'pt') return false;
  const sig = ptSignal(title, tags);
  if (sig) return true;
  // nome do canal com marca de Portugal (ex.: nightz_pt, tuga_gamer), desde que o título não seja do Brasil
  return /(^|_)pt($|_)|tuga/i.test(String(login || '')) && !/brasil|brazil|🇧🇷|ptbr|pt-br/i.test(String(title || '') + (tags || []).join(' ')) && !hasGerund(norm(title || ''));
}

function summarize(streams) {
  const pt = streams.filter((s) => s.lang === 'pt');
  const ptpt = streams.filter((s) => s.portugal);
  return {
    viewers: sum(streams, (s) => s.viewers), streams: streams.length,
    pt_viewers: sum(pt, (s) => s.viewers), pt_streams: pt.length,
    ptpt_viewers: sum(ptpt, (s) => s.viewers), ptpt_streams: ptpt.length,
  };
}

// ----------------------------------------------------------------- TWITCH
let twitchToken = null; // cache entre invocações "quentes"
async function twitchAuth(id, secret) {
  if (twitchToken && twitchToken.exp > Date.now() + 60000) return twitchToken.value;
  // segredo vai no corpo do pedido (nunca no URL, para não ficar em logs)
  const r = await http('https://id.twitch.tv/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: qs({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }) });
  twitchToken = { value: r.access_token, exp: Date.now() + (r.expires_in || 3600) * 1000 };
  return twitchToken.value;
}

export async function twitchSnapshot({ clientId, clientSecret, maxPages = 60 }) {
  const token = await twitchAuth(clientId, clientSecret);
  const h = { 'Client-Id': clientId, Authorization: `Bearer ${token}` };
  const api = (path, p) => http(`https://api.twitch.tv/helix/${path}?${qs(p)}`, { headers: h });

  // a API aceita vários nomes no mesmo pedido: name=...&name=...
  const g = await http(`https://api.twitch.tv/helix/games?${CATEGORY_NAMES.map((n) => 'name=' + encodeURIComponent(n)).join('&')}`, { headers: h });
  const game = (g.data || []).find((x) => lc(x.name) === lc(GAME_NAME)) || g.data?.[0];
  if (!game) throw new Error(`categoria "${GAME_NAME}" não encontrada`);

  const seen = new Map();
  let cursor, pages = 0;
  do {
    const r = await api('streams', { game_id: game.id, first: 100, after: cursor });
    for (const s of r.data || []) seen.set(s.id, s); // dedupe (a paginação pode repetir)
    cursor = r.pagination?.cursor;
    pages++;
    if (!r.data?.length) break;
  } while (cursor && pages < maxPages);

  const streams = [...seen.values()].map((s) => ({
    platform: 'twitch', id: s.user_id, login: s.user_login, name: s.user_name,
    title: s.title || '', viewers: s.viewer_count || 0, lang: s.language || '',
    started_at: s.started_at, url: `https://twitch.tv/${s.user_login}`,
    portugal: looksPortugal('twitch', s.user_login, s.title, s.tags, s.language),
  })).sort((a, b) => b.viewers - a.viewers);

  // Avatares para os destaques (1 pedido, até 100 IDs)
  const featured = [...streams.slice(0, 40), ...streams.filter((s) => s.lang === 'pt').slice(0, 40), ...streams.filter((s) => s.portugal).slice(0, 20)];
  const ids = [...new Set(featured.map((s) => s.id))].slice(0, 100);
  if (ids.length) {
    try {
      const u = await http(`https://api.twitch.tv/helix/users?${ids.map((i) => `id=${i}`).join('&')}`, { headers: h });
      const pics = new Map((u.data || []).map((x) => [x.id, x.profile_image_url]));
      for (const s of streams) if (pics.has(s.id)) s.avatar = pics.get(s.id);
    } catch { /* avatares são opcionais */ }
  }

  // Posição de GTA VI no ranking de jogos mais vistos da Twitch
  let rank = null;
  try {
    let c, offset = 0;
    for (let i = 0; i < 3 && rank == null; i++) {
      const r = await api('games/top', { first: 100, after: c });
      const idx = (r.data || []).findIndex((x) => x.id === game.id);
      if (idx >= 0) rank = offset + idx + 1;
      offset += (r.data || []).length;
      c = r.pagination?.cursor;
      if (!c) break;
    }
  } catch { /* opcional */ }

  const langs = {};
  for (const s of streams) langs[s.lang || '?'] = (langs[s.lang || '?'] || 0) + s.viewers;

  return { ...summarize(streams), rank, complete: !cursor, min_v: !cursor || !streams.length ? 0 : streams[streams.length - 1].viewers, list: streams, languages: langs, box_art: game.box_art_url, game_id: game.id,
    top10: streams.slice(0, 10).reduce((a, s) => a + s.viewers, 0) };
}

// Extras horários da Twitch: clips virais e peso do GTA VI nas maiores streams da plataforma
export async function twitchExtras({ clientId, clientSecret, gameId, gta = null, now = new Date(), gamesPages = 10, samplePages = 50 }) {
  const token = await twitchAuth(clientId, clientSecret);
  const h = { 'Client-Id': clientId, Authorization: `Bearer ${token}` };
  const api = (path, p) => http(`https://api.twitch.tv/helix/${path}?${qs(p)}`, { headers: h });
  const out = {};

  // Clips mais vistos das últimas 24 h
  try {
    const r = await api('clips', { game_id: gameId, first: 24, started_at: new Date(now - 24 * 3600e3).toISOString(), ended_at: now.toISOString() });
    out.clips = (r.data || []).sort((a, b) => b.view_count - a.view_count).slice(0, 12).map((c) => ({
      title: (c.title || '').slice(0, 100), views: c.view_count, creator: c.broadcaster_name, url: c.url,
      thumb: c.thumbnail_url, lang: c.language, created_at: c.created_at, duration: c.duration,
    }));
  } catch (e) { out.clips_error = e.message; }

  // Das 5000 streams mais vistas da Twitch (todas as categorias, 50 pedidos), quanto é GTA VI?
  try {
    let cursor, all = [];
    for (let i = 0; i < samplePages; i++) {
      const r = await api('streams', { first: 100, after: cursor });
      all.push(...(r.data || []));
      cursor = r.pagination?.cursor;
      if (!cursor || !r.data?.length) break;
    }
    const uniq = [...new Map(all.map((s) => [s.id, s])).values()].sort((a, b) => b.viewer_count - a.viewer_count);
    const tot = uniq.reduce((a, s) => a + s.viewer_count, 0);
    const gta = uniq.filter((s) => s.game_id === gameId);
    out.dominance = {
      sample: uniq.length, sample_viewers: tot, min_v: uniq.length ? uniq[uniq.length - 1].viewer_count : 0, gta_viewers: gta.reduce((a, s) => a + s.viewer_count, 0),
      gta_in_top100: uniq.slice(0, 100).filter((s) => s.game_id === gameId).length,
      gta_in_top10: uniq.slice(0, 10).filter((s) => s.game_id === gameId).length,
    };
  } catch (e) { out.dominance_error = e.message; }

  // GTA VI vs outros jogos: espectadores reais de cada um dos 10 jogos mais vistos da Twitch
  // (soma de todas as streams de cada jogo, até 1000 streams por jogo; as restantes têm 1–3 espectadores)
  try {
    const top = (await api('games/top', { first: 12 })).data || [];
    const list = top.filter((g) => !NON_GAME.test(g.name));
    if (!list.some((g) => g.id === gameId)) list.push({ id: gameId, name: GAME_NAME });
    const count = async (g) => {
      if (g.id === gameId && gta) return { viewers: gta.viewers, streams: gta.streams, complete: gta.complete };
      let cursor, v = 0, n = 0, pages = 0;
      const ids = new Set();
      do {
        const r = await api('streams', { game_id: g.id, first: 100, after: cursor });
        for (const x of r.data || []) if (!ids.has(x.id)) { ids.add(x.id); v += x.viewer_count || 0; n++; }
        cursor = r.pagination?.cursor; pages++;
        if (!r.data?.length) break;
      } while (cursor && pages < gamesPages);
      return { viewers: v, streams: n, complete: !cursor };
    };
    const games = [];
    for (let i = 0; i < list.length; i += 3) {
      const part = await Promise.all(list.slice(i, i + 3).map(async (g) => ({ id: g.id, name: g.name, ...(await count(g)), gta: g.id === gameId })));
      games.push(...part);
    }
    out.games = games.sort((a, b) => b.viewers - a.viewers).slice(0, 11);
  } catch (e) { out.games_error = e.message; }
  return out;
}

// ------------------------------------------------------------------- KICK
let kickToken = null;
async function kickAuth(id, secret) {
  if (kickToken && kickToken.exp > Date.now() + 60000) return kickToken.value;
  const r = await http('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: qs({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }),
  });
  kickToken = { value: r.access_token, exp: Date.now() + (r.expires_in || 3600) * 1000 };
  return kickToken.value;
}

let kickCategoryCache = null;
async function kickCategory(h, fixedId) {
  if (fixedId) return fixedId;
  if (kickCategoryCache) return kickCategoryCache;
  const tries = [
    `https://api.kick.com/public/v2/categories?${qs({ name: GAME_NAME, limit: 25 })}`,
    `https://api.kick.com/public/v1/categories?${qs({ q: GAME_NAME })}`,
  ];
  for (const url of tries) {
    try {
      const r = await http(url, { headers: h });
      const cats = r.data || [];
      const hit = cats.find((c) => isGameName(c.name)) || cats.find((c) => /grand theft auto (vi|6)\b/i.test(c.name || ''));
      if (hit) return (kickCategoryCache = hit.id);
    } catch { /* tenta a próxima */ }
  }
  // último recurso: procurar a categoria nas streams mais vistas da Kick
  try {
    const r = await http(`https://api.kick.com/public/v1/livestreams?${qs({ limit: 100, sort: 'viewer_count' })}`, { headers: h });
    const hit = (r.data || []).map((s) => s.category).find((c) => c && isGameName(c.name));
    if (hit) return (kickCategoryCache = hit.id);
  } catch { /* nada */ }
  throw new Error(`categoria "${GAME_NAME}" não encontrada — define KICK_CATEGORY_ID`);
}

export async function kickSnapshot({ clientId, clientSecret, categoryId }) {
  const token = await kickAuth(clientId, clientSecret);
  const h = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const cat = await kickCategory(h, categoryId);
  const get = (language) => http(`https://api.kick.com/public/v1/livestreams?${qs({ category_id: cat, limit: 100, sort: 'viewer_count', language })}`, { headers: h }).then((r) => r.data || []);
  const [all, pt] = await Promise.all([get(), get('pt')]);

  const map = (s) => ({
    platform: 'kick', id: String(s.broadcaster_user_id ?? s.channel_id ?? s.slug), login: s.slug, name: s.slug,
    title: s.stream_title || '', viewers: Number(s.viewer_count) || 0, lang: s.language || '',
    started_at: s.started_at, url: `https://kick.com/${s.slug}`, thumb: s.thumbnail,
  });
  const byId = new Map();
  for (const s of [...all, ...pt].map(map)) byId.set(s.id, s);
  const streams = [...byId.values()]
    .map((s) => ({ ...s, portugal: looksPortugal('kick', s.login, s.title, [], s.lang) }))
    .sort((a, b) => b.viewers - a.viewers);

  // A API pública devolve no máximo 100 streams por pedido → valores são "top 100".
  // Peso do GTA VI nas 100 maiores streams da Kick (todas as categorias)
  let dominance = null;
  try {
    const top = await http(`https://api.kick.com/public/v1/livestreams?${qs({ limit: 100, sort: 'viewer_count' })}`, { headers: h }).then((r) => r.data || []);
    const tot = sum(top, (s) => s.viewer_count);
    const gta = top.filter((s) => String(s.category?.id) === String(cat));
    dominance = { sample: top.length, sample_viewers: tot, min_v: top.length ? Math.min(...top.map((x) => Number(x.viewer_count) || 0)) : 0, gta_viewers: sum(gta, (s) => s.viewer_count),
      gta_in_top100: gta.length, gta_in_top10: top.slice(0, 10).filter((s) => String(s.category?.id) === String(cat)).length };
    const byCat = new Map();
    for (const s of top) {
      const c = s.category || {}; const key = String(c.id ?? c.name ?? '?');
      const e = byCat.get(key) || { id: key, name: c.name || '?', viewers: 0, streams: 0, gta: key === String(cat) };
      e.viewers += Number(s.viewer_count) || 0; e.streams++; byCat.set(key, e);
    }
    dominance.games = [...byCat.values()].filter((g) => g.gta || !NON_GAME.test(g.name)).sort((a, b) => b.viewers - a.viewers).slice(0, 10);
  } catch { /* opcional */ }
  return { ...summarize(streams), complete: all.length < 100, min_v: all.length >= 100 ? Math.min(...all.map((x) => Number(x.viewer_count) || 0)) : 0, list: streams, category_id: cat, dominance,
    top10: streams.slice(0, 10).reduce((a, s) => a + s.viewers, 0) };
}

// ---------------------------------------------------------------- YOUTUBE
// Quota grátis: 10 000 unidades/dia. search = 100, videos/channels = 1.
const GTA_RE = /\bgta\s*-?\s*(vi|6)\b|\bgta6\b|grand\s+theft\s+auto\s*(vi|6)\b/i;
export const mentionsGTA = (...txt) => GTA_RE.test(txt.filter(Boolean).join(' '));

export async function youtubeSnapshot({ apiKey, withVideos = false, now = new Date(), ptHandles = PORTUGAL.youtube || [], channelCache = {} }) {
  const base = 'https://www.googleapis.com/youtube/v3';
  const search = async (pages, p) => {
    let ids = [], token, total = 0;
    for (let i = 0; i < pages; i++) {
      const r = await http(`${base}/search?${qs({ part: 'id', q: YT_QUERY, type: 'video', maxResults: 50, key: apiKey, pageToken: token, ...p })}`);
      total = r.pageInfo?.totalResults ?? total;
      ids.push(...(r.items || []).map((x) => x.id?.videoId).filter(Boolean));
      token = r.nextPageToken;
      if (!token) break;
    }
    return { ids: [...new Set(ids)], total };
  };
  const batch = async (endpoint, part, ids) => {
    const out = [];
    for (let i = 0; i < ids.length; i += 50) {
      const r = await http(`${base}/${endpoint}?${qs({ part, id: ids.slice(i, i + 50).join(','), key: apiKey })}`);
      out.push(...(r.items || []));
    }
    return out;
  };
  // país declarado do canal -> deteção real de Portugal no YouTube
  const countryCache = new Map();
  const countries = async (channelIds) => {
    const missing = [...new Set(channelIds)].filter((c) => !countryCache.has(c));
    for (const ch of await batch('channels', 'snippet', missing)) countryCache.set(ch.id, ch.snippet?.country || '');
    for (const c of missing) if (!countryCache.has(c)) countryCache.set(c, '');
  };
  const isPtLang = (v) => /^pt/i.test(v.snippet?.defaultAudioLanguage || v.snippet?.defaultLanguage || '');
  const isPtPt = (v) => /^pt-pt$/i.test(v.snippet?.defaultAudioLanguage || v.snippet?.defaultLanguage || '');

  // ---- Canais portugueses conhecidos: vemos os uploads mais recentes de cada um (1 unidade por canal)
  const cache = { ...channelCache };
  const ptChannelIds = new Set([...LEARNED.youtube]);
  const curatedLives = [], curatedVideos = [];
  try {
    const stale = (c) => !c || !c.uploads || now - Date.parse(c.at || 0) > 7 * 86400e3;
    for (const h of ptHandles) {
      if (!stale(cache[h])) continue;
      try {
        const q = /^UC[\w-]{20,}$/.test(h) ? { id: h } : { forHandle: h.startsWith('@') ? h : '@' + h };
        const r = await http(`${base}/channels?${qs({ part: 'snippet,contentDetails', key: apiKey, ...q })}`);
        const ch = r.items?.[0];
        cache[h] = ch ? { id: ch.id, title: ch.snippet?.title, country: ch.snippet?.country || '', uploads: ch.contentDetails?.relatedPlaylists?.uploads, at: now.toISOString() }
                      : { missing: true, at: now.toISOString() };
      } catch { /* canal inválido: ignora */ }
    }
    const chans = ptHandles.map((h) => cache[h]).filter((c) => c?.uploads);
    for (const c of chans) ptChannelIds.add(lc(c.id));
    const recent = [];
    for (const c of chans) {
      try {
        const r = await http(`${base}/playlistItems?${qs({ part: 'contentDetails', playlistId: c.uploads, maxResults: 8, key: apiKey })}`);
        for (const it of r.items || []) {
          const pub = Date.parse(it.contentDetails?.videoPublishedAt || 0);
          if (!pub || now - pub < 7 * 86400e3) recent.push(it.contentDetails.videoId);
        }
      } catch { /* playlist indisponível */ }
    }
    const det = await batch('videos', 'snippet,statistics,liveStreamingDetails', [...new Set(recent)]);
    for (const v of det) {
      if (!mentionsGTA(v.snippet?.title, (v.snippet?.tags || []).join(' '))) continue;
      const live = v.snippet?.liveBroadcastContent === 'live' && v.liveStreamingDetails && !v.liveStreamingDetails.actualEndTime;
      if (live) curatedLives.push(v);
      else if (v.snippet?.liveBroadcastContent !== 'upcoming') curatedVideos.push(v);
    }
  } catch { /* opcional */ }
  const ptChannel = (v) => ptChannelIds.has(lc(v.snippet?.channelId));

  // LIVES: pesquisa global + pesquisa orientada a PT, depois detalhes
  const [g, p] = await Promise.all([
    search(1, { eventType: 'live', order: 'viewCount' }),
    search(1, { eventType: 'live', order: 'viewCount', relevanceLanguage: 'pt', regionCode: 'PT' }),
  ]);
  const ptSearchIds = new Set(p.ids);
  const curatedIds = new Set(curatedLives.map((v) => v.id));
  const vids = [...await batch('videos', 'snippet,liveStreamingDetails', [...new Set([...g.ids, ...p.ids])].filter((id) => !curatedIds.has(id))), ...curatedLives];
  await countries(vids.map((v) => v.snippet.channelId));
  const streams = vids
    .filter((v) => v.liveStreamingDetails && !v.liveStreamingDetails.actualEndTime)
    .map((v) => {
      const country = countryCache.get(v.snippet.channelId);
      const portugal = country === 'PT' || isPtPt(v) || ptChannel(v) || (isPtLang(v) && ptSignal(v.snippet.title) != null);
      const pt = portugal || isPtLang(v) || country === 'BR' || (ptSearchIds.has(v.id) && !country && /[ãõçáéíóúâêô]/i.test(v.snippet.title || '') && !/[ñ¿¡]/.test(v.snippet.title || ''));
      return {
        platform: 'youtube', id: v.snippet.channelId, login: v.snippet.channelId, name: v.snippet.channelTitle,
        title: v.snippet.title, viewers: Number(v.liveStreamingDetails.concurrentViewers) || 0,
        lang: pt ? 'pt' : (v.snippet.defaultAudioLanguage || '').slice(0, 2), country,
        started_at: v.liveStreamingDetails.actualStartTime, url: `https://youtube.com/watch?v=${v.id}`,
        avatar: v.snippet.thumbnails?.default?.url, portugal,
      };
    }).sort((a, b) => b.viewers - a.viewers);

  const out = { ...summarize(streams), complete: false, min_v: streams.length >= 50 ? streams[streams.length - 1].viewers : 0, list: streams, top10: streams.slice(0, 10).reduce((x, s) => x + s.viewers, 0), channel_cache: cache };
  const mapVid = (v, country) => ({
    id: v.id, channel: v.snippet.channelTitle, title: v.snippet.title, url: `https://youtube.com/watch?v=${v.id}`,
    views: Number(v.statistics?.viewCount) || 0, likes: Number(v.statistics?.likeCount) || 0,
    thumb: v.snippet.thumbnails?.medium?.url, published: v.snippet.publishedAt, country,
  });
  // vídeos de GTA VI dos criadores portugueses (últimos 7 dias), vindos diretamente dos canais
  out.videos_portugal = curatedVideos.map((v) => mapVid(v, 'PT')).sort((a, b) => b.views - a.views).slice(0, 24);
  out.portugal_channels = [...ptChannelIds].length;

  // VÍDEOS NOVOS (janela de 3h) — só quando pedido, para poupar quota
  if (withVideos) {
    const after = new Date(now.getTime() - 3 * 3600e3).toISOString().replace(/\.\d+Z$/, 'Z');
    const [vg, vp] = await Promise.all([
      search(3, { publishedAfter: after, order: 'viewCount' }),
      search(1, { publishedAfter: after, order: 'viewCount', relevanceLanguage: 'pt', regionCode: 'PT' }),
    ]);
    const det = await batch('videos', 'snippet,statistics', [...new Set([...vg.ids, ...vp.ids])]);
    await countries(det.map((v) => v.snippet.channelId));
    const mapV = (v) => mapVid(v, countryCache.get(v.snippet.channelId) === 'PT' || isPtPt(v) || ptChannel(v) ? 'PT' : (countryCache.get(v.snippet.channelId) || ''));
    const gl = det.filter((v) => vg.ids.includes(v.id)).map(mapV).sort((a, b) => b.views - a.views);
    const pl = det.filter((v) => vp.ids.includes(v.id)).map(mapV).sort((a, b) => b.views - a.views);
    out.new_videos_3h = vg.total;           // estimativa do YouTube
    out.new_videos_3h_pt = vp.total;
    const recent3h = (v) => now - Date.parse(v.published || 0) < 3 * 3600e3;
    const ptIds = new Set([...pl, ...gl].filter((v) => v.country === 'PT').map((v) => v.id));
    for (const v of out.videos_portugal) if (recent3h(v)) ptIds.add(v.id);
    out.new_videos_3h_portugal = ptIds.size;
    out.top_videos = gl.slice(0, 12);
    out.top_videos_pt = pl.slice(0, 12);
  }
  return out;
}

// --------------------------------------------------------------- utilidades
export const strip = (s) => ({ platform: s.platform, id: s.id, name: s.name, title: s.title.slice(0, 110), viewers: s.viewers,
  lang: s.lang, url: s.url, avatar: s.avatar || null, portugal: !!s.portugal, started_at: s.started_at || null });

export function creds(env = process.env) {
  return {
    twitch: env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET ? { clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET } : null,
    kick: env.KICK_CLIENT_ID && env.KICK_CLIENT_SECRET ? { clientId: env.KICK_CLIENT_ID, clientSecret: env.KICK_CLIENT_SECRET, categoryId: env.KICK_CATEGORY_ID || null } : null,
    youtube: env.YOUTUBE_API_KEY ? { apiKey: env.YOUTUBE_API_KEY } : null,
  };
}
