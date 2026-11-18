// Coletor (GitHub Actions, de 10 em 10 minutos). Escreve:
//   public/data/history.json  — série temporal (1 ponto a cada 10 min nos últimos 3 dias, depois 1 por hora)
//   public/data/latest.json   — rankings e detalhes da última recolha
//   data/seen.json            — canais únicos já vistos (privado, fora do site)
// Uso: node scripts/collect.js         (usa as variáveis de ambiente)
//      MOCK=1 node scripts/collect.js  (dados falsos, para testar o dashboard)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { twitchSnapshot, twitchExtras, kickSnapshot, youtubeSnapshot, creds, strip, setLearnedPortugal, ptSignal, usage } from '../lib/platforms.js';
import { forecast, peakOf } from '../public/forecast.js';
import PORTUGAL_LIST from '../portugal.js';

const LAUNCH = Date.parse('2026-11-19T00:00:00Z');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public', 'data');
const PRIV = path.join(ROOT, 'data');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJSON = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o)); };

const STEP_MIN = 10;                                   // resolução da série (minutos)
const now = process.env.MOCK_NOW ? new Date(process.env.MOCK_NOW) : new Date();
now.setUTCMinutes(Math.floor(now.getUTCMinutes() / STEP_MIN) * STEP_MIN, 0, 0);
const ts = now.toISOString().replace('.000Z', 'Z');

// O YouTube tem quota diária: só é consultado de hora a hora (lives) e a cada 3 h (vídeos novos).
// Twitch e Kick são consultados em todas as recolhas.
const state = readJSON(path.join(PRIV, 'state.json'), {});
const ago = (k) => (state[k] ? now.getTime() - Date.parse(state[k]) : Infinity);
const force = process.env.FORCE_YT_VIDEOS === '1';
// Quota do YouTube: 10 000 unidades/dia, repõe à meia-noite do Pacífico. Guardamos o gasto do dia
// e paramos a 9 000 (margem de 10%) — mesmo com execuções manuais ou forçadas.
const YT_DAILY_CAP = 9000, YT_RUN_COST = 300, YT_VIDEOS_COST = 600;
const ptDay = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(d);
const quota = state.yt_quota && state.yt_quota.day === ptDay(now) ? state.yt_quota : { day: ptDay(now), units: 0 };
const ytAfford = (cost) => quota.units + cost <= YT_DAILY_CAP;
const dueYoutube = ago('youtube') >= 55 * 60e3;
const withYoutube = (force || dueYoutube) && ytAfford(YT_RUN_COST);
const withVideos = withYoutube && (force || ago('youtube_videos') >= 175 * 60e3) && ytAfford(YT_RUN_COST + YT_VIDEOS_COST);
if ((force || dueYoutube) && !withYoutube) console.log(`YouTube: quota do dia (${quota.units}/${YT_DAILY_CAP}) — a saltar esta recolha`);

async function run() {
  const c = creds();
  const res = {}, errors = [];
  // canais que o tracker já reconheceu como portugueses
  const learned = readJSON(path.join(PRIV, 'portugal-learned.json'), { twitch: {}, kick: {}, youtube: {} });
  setLearnedPortugal(Object.fromEntries(Object.entries(learned).map(([k, v]) => [k, Object.keys(v || {})])));
  const ytCache = readJSON(path.join(PRIV, 'yt-channels.json'), {});
  const jobs = process.env.MOCK
    ? (await import('./mock.js')).mockSnapshots(now, withVideos)
    : {
      twitch: c.twitch && twitchSnapshot({ ...c.twitch, maxPages: 150 }),
      kick: c.kick && kickSnapshot(c.kick),
      youtube: c.youtube && withYoutube && youtubeSnapshot({ ...c.youtube, withVideos, now, channelCache: ytCache }),
    };
  if (process.env.MOCK && !withYoutube) delete jobs.youtube;
  await Promise.all(Object.entries(jobs).map(async ([k, p]) => {
    if (!p) { console.log(`${k}: sem credenciais, a saltar`); return; }
    try { res[k] = await p; console.log(`${k}: ${res[k].streams} streams, ${res[k].viewers} espectadores`); }
    catch (e) {
      errors.push(`${k}: ${e.message}`); console.error(`ERRO ${k}:`, e.message);
      // quota esgotada de verdade (403): bloqueia o YouTube até ao fim do dia do Pacífico
      if (k === 'youtube' && e.quotaExceeded) quota.units = Math.max(quota.units, 10000);
    }
  }));

  // ---- YouTube: guardar estado e cache dos canais
  if (withYoutube && !process.env.MOCK) quota.units += usage.youtube;
  state.yt_quota = quota;
  if (res.youtube) {
    state.youtube = ts; if (withVideos) state.youtube_videos = ts;
    if (res.youtube.channel_cache) writeJSON(path.join(PRIV, 'yt-channels.json'), res.youtube.channel_cache);
  }

  // ---- aprender canais portugueses (só com sinais fortes: país do canal, lista, marca explícita de Portugal)
  for (const [k, r] of Object.entries(res)) {
    const bucket = (learned[k] ||= {});
    for (const st of r.list) {
      const strong = (k === 'youtube' && (st.country === 'PT')) || (st.lang === 'pt' && ptSignal(st.title) === 'strong');
      const key = String(k === 'youtube' ? st.id : st.login || '').toLowerCase();
      if (!key) continue;
      if (strong) bucket[key] = { name: st.name, n: (bucket[key]?.n || 0) + 1, last: ts };
    }
  }
  writeJSON(path.join(PRIV, 'portugal-learned.json'), learned);

  // ---- extras da Twitch (clips, peso no top 1000, comparação com outros jogos) — a cada 30 min chega
  let extras = {};
  const prevLatest = readJSON(path.join(PUB, 'latest.json'), {});
  const extrasDue = force || process.env.MOCK || ago('extras') >= 25 * 60e3;
  if (res.twitch?.game_id && (c.twitch || process.env.MOCK) && extrasDue) {
    try {
      extras = process.env.MOCK ? (await import('./mock.js')).mockExtras(now) : await twitchExtras({ ...c.twitch, gameId: res.twitch.game_id, gta: res.twitch, now });
      if (extras.clips_error) errors.push(`twitch clips: ${extras.clips_error}`);
      if (extras.games_error) errors.push(`twitch jogos: ${extras.games_error}`);
      state.extras = ts;
    } catch (e) { errors.push(`twitch extras: ${e.message}`); }
  }
  // mantém a lista de jogos atualizada com o valor de GTA VI desta recolha
  if (!extras.games && prevLatest.games?.twitch && res.twitch) {
    extras.games = prevLatest.games.twitch.map((g) => (g.gta ? { ...g, viewers: res.twitch.viewers, streams: res.twitch.streams } : g)).sort((a, b) => b.viewers - a.viewers);
  }
  writeJSON(path.join(PRIV, 'state.json'), state);
  console.log(`Consumo desta execução: Twitch ${usage.twitch} pedidos (limite 800/min), Kick ${usage.kick}, YouTube ${usage.youtube} unidades (hoje ${quota.units}/10000), repetições ${usage.retries}, 429 finais ${usage.throttled}`);

  // ---- canais únicos acumulados
  const seen = readJSON(path.join(PRIV, 'seen.json'), {});
  for (const [k, r] of Object.entries(res)) {
    const set = new Set(seen[k] || []);
    for (const s of r.list) set.add(s.id);
    seen[k] = [...set];
  }
  writeJSON(path.join(PRIV, 'seen.json'), seen);

  // ---- entradas e saídas de streams desde a recolha anterior (só se a recolha anterior foi há ≤ 25 min
  // e a lista é completa; a Kick só dá o top 100, por isso só conta quando há menos de 100 streams)
  const liveSets = readJSON(path.join(PRIV, 'live-ids.json'), {});
  const flow = {}, nextSets = { ts };
  for (const [k, r] of Object.entries(res)) {
    if (k === 'youtube') continue;
    const sets = { g: new Set(r.list.map((x) => x.id)), p: new Set(r.list.filter((x) => x.lang === 'pt').map((x) => x.id)), q: new Set(r.list.filter((x) => x.portugal).map((x) => x.id)) };
    nextSets[k] = Object.fromEntries(Object.entries(sets).map(([n, v]) => [n, [...v]]));
    const prevSets = liveSets[k];
    if (!prevSets || !liveSets.ts || now - Date.parse(liveSets.ts) > 25 * 60e3 || now <= Date.parse(liveSets.ts) || r.complete === false) continue;
    const f = {};
    for (const [n, cur] of Object.entries(sets)) {
      const old = new Set(prevSets[n] || []);
      f[n] = { i: [...cur].filter((x) => !old.has(x)).length, o: [...old].filter((x) => !cur.has(x)).length };
    }
    flow[k] = f;
  }
  for (const k of Object.keys(liveSets)) if (k !== 'ts' && !nextSets[k]) nextSets[k] = liveSets[k]; // plataforma falhou: mantém
  if (!(liveSets.ts && Date.parse(liveSets.ts) >= now.getTime())) writeJSON(path.join(PRIV, 'live-ids.json'), nextSets);

  // ---- histórico
  const history = readJSON(path.join(PUB, 'history.json'), { points: [] });
  const point = { ts };
  // YouTube não consultado nesta recolha: repete o último valor (marcado com c:1) para os totais não caírem
  if (!res.youtube) {
    const lastYt = [...history.points].reverse().find((p) => p.youtube);
    if (lastYt && now - Date.parse(lastYt.ts) < 3 * 3600e3) { const { nv, nvp, nvpp, ...rest } = lastYt.youtube; void nv; void nvp; void nvpp; point.youtube = { ...rest, c: 1 }; }
  }
  for (const [k, r] of Object.entries(res)) {
    point[k] = { v: r.viewers, s: r.streams, pv: r.pt_viewers, ps: r.pt_streams, ppv: r.ptpt_viewers, pps: r.ptpt_streams };
    if (r.rank != null) point[k].rank = r.rank;
    if (flow[k]) Object.assign(point[k], { si: flow[k].g.i, so: flow[k].g.o, psi: flow[k].p.i, pso: flow[k].p.o, ppsi: flow[k].q.i, ppso: flow[k].q.o });
    if (r.top10 != null) point[k].t10 = r.top10;
    const dom = k === 'twitch' ? extras.dominance : r.dominance;
    if (dom) Object.assign(point[k], { dg: dom.gta_viewers, dt: dom.sample_viewers, d100: dom.gta_in_top100, d10: dom.gta_in_top10, dn: dom.sample });
    if (r.new_videos_3h != null) Object.assign(point[k], { nv: r.new_videos_3h, nvp: r.new_videos_3h_pt, nvpp: r.new_videos_3h_portugal });
  }
  // quem domina o top 10 (todas as plataformas juntas)
  const top10all = Object.values(res).flatMap((r) => r.list).sort((a, b) => b.viewers - a.viewers).slice(0, 10);
  if (top10all.length) point.mix = Object.fromEntries(Object.keys(res).map((k) => [k, top10all.filter((s) => s.platform === k).length]));
  history.points = history.points.filter((p) => p.ts !== ts); // re-run no mesmo intervalo substitui
  if (Object.keys(point).length > 1) history.points.push(point);
  history.points.sort((a, b) => a.ts.localeCompare(b.ts));
  // compactação: pontos com mais de 3 dias ficam 1 por hora (o mais próximo da hora certa)
  const cut = now.getTime() - 72 * 3600e3, byHour = new Map(), keep = [];
  for (const p of history.points) {
    const t = Date.parse(p.ts);
    if (t >= cut) { keep.push(p); continue; }
    const h = Math.floor(t / 3600e3), cur = byHour.get(h);
    if (!cur || (t % 3600e3) < (Date.parse(cur.ts) % 3600e3)) byHour.set(h, p);
  }
  history.points = [...byHour.values(), ...keep].sort((a, b) => a.ts.localeCompare(b.ts));
  // recordes (não se perdem com a compactação)
  const tot = (p, key) => { const v = ['twitch', 'kick', 'youtube'].map((k) => p[k]?.[key]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
  history.peaks ||= {};
  for (const [sc, key] of Object.entries({ global: 'v', luso: 'pv', portugal: 'ppv' })) {
    const v = tot(point, key);
    if (v != null && (!history.peaks[sc] || v > history.peaks[sc].v)) history.peaks[sc] = { v, ts };
  }
  history.step = STEP_MIN;
  history.updated = new Date().toISOString();
  writeJSON(path.join(PUB, 'history.json'), history);

  // ---- Previsão do dia (feita uma vez, no primeiro run de cada dia em Lisboa) para comparar depois com o real
  const preds = readJSON(path.join(PUB, 'predictions.json'), { days: {} });
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(now);
  if (!preds.days[day]) {
    let dayStart = Date.parse(day + 'T00:00:00Z');
    const lh = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Lisbon' }).format(new Date(dayStart)));
    if (lh !== 0) dayStart -= lh * 3600e3;
    const scopes = { global: 'v', luso: 'pv', portugal: 'ppv' };
    const entry = { made_at: ts };
    for (const [sc, key] of Object.entries(scopes)) {
      const tot = (p) => { const vals = ['twitch', 'kick', 'youtube'].map((k) => p[k]?.[key]).filter((v) => v != null); return vals.length ? vals.reduce((a, b) => a + b, 0) : null; };
      const f = forecast(history.points.filter((p) => Date.parse(p.ts) < dayStart), tot, dayStart, 24, LAUNCH);
      if (f) { const pk = peakOf(f); entry[sc] = { peak: pk.v, at: new Date(pk.ts).toISOString(), hourly: f.map((x) => x.v) }; }
    }
    if (entry.global) { preds.days[day] = entry; writeJSON(path.join(PUB, 'predictions.json'), preds); }
  }

  // ---- Hall of Fame: maior pico de cada streamer (geral e nas primeiras 24 h após o lançamento)
  const hall = readJSON(path.join(PUB, 'hall.json'), { all: {}, first24: {} });
  const inFirst24 = now.getTime() >= LAUNCH && now.getTime() < LAUNCH + 24 * 3600e3;
  const bump = (bucket, s) => {
    const key = `${s.platform}:${s.id}`, cur = bucket[key];
    if (!cur || s.viewers > cur.peak) bucket[key] = { ...strip(s), peak: s.viewers, at: ts, avatar: s.avatar || cur?.avatar || null };
  };
  for (const r of Object.values(res)) for (const s of r.list) { if (s.viewers >= 50) { bump(hall.all, s); if (inFirst24) bump(hall.first24, s); } }
  const trim = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1].peak - a[1].peak).slice(0, 400));
  hall.all = trim(hall.all); hall.first24 = trim(hall.first24);
  writeJSON(path.join(PUB, 'hall.json'), hall);

  // ---- séries por streamer (para as páginas individuais) — os 150 maiores picos
  const series = readJSON(path.join(PUB, 'streamers.json'), {});
  const hourIdx = Math.floor(now.getTime() / 3600e3);   // hora desde 1970 (compacto)
  const liveByKey = new Map(Object.values(res).flatMap((r) => r.list).map((s) => [`${s.platform}:${s.id}`, s]));
  const tracked = Object.keys(hall.all).slice(0, 150);
  for (const key of tracked) {
    const s = liveByKey.get(key), h = hall.all[key];
    const rec = series[key] || { name: h.name, platform: h.platform, url: h.url, avatar: h.avatar, lang: h.lang, portugal: h.portugal, pts: [] };
    Object.assign(rec, { name: h.name, avatar: h.avatar || rec.avatar, peak: h.peak, peak_at: h.at, portugal: h.portugal || rec.portugal });
    const same = rec.pts.find((x) => x[0] === hourIdx);
    if (s) { if (same) same[1] = Math.max(same[1], s.viewers); else rec.pts.push([hourIdx, s.viewers]); }
    rec.pts = rec.pts.slice(-1500);
    series[key] = rec;
  }
  for (const k of Object.keys(series)) if (!tracked.includes(k)) delete series[k];
  writeJSON(path.join(PUB, 'streamers.json'), series);

  // ---- saltos: streamers que ganharam muitos espectadores desde a última hora
  // compara com o valor de há ~1 hora (guardamos uma janela de 6 recolhas)
  const prevRaw = readJSON(path.join(PRIV, 'prev.json'), {});
  const win = Array.isArray(prevRaw.win) ? prevRaw.win : [];
  const prevV = win[0]?.v || {};
  const events = readJSON(path.join(PUB, 'events.json'), []);
  const nextV = {};
  const seenEvt = new Set(events.filter((e) => now - Date.parse(e.ts) < 3 * 3600e3).map((e) => e.key + e.kind));
  for (const [key, s] of liveByKey) {
    if (s.viewers >= 200) nextV[key] = s.viewers;
    const before = prevV[key] || 0, gain = s.viewers - before;
    if (seenEvt.has(key + (before ? 'jump' : 'start'))) continue;
    const min = s.lang === 'pt' ? 1000 : 5000;
    if (s.viewers >= min && (gain >= min || (before && s.viewers >= before * 2 && gain >= min / 2))) {
      events.push({ ts, key, ...strip(s), from: before, to: s.viewers, kind: before ? 'jump' : 'start' });
    }
  }
  writeJSON(path.join(PRIV, 'prev.json'), { win: [...win, { ts, v: nextV }].filter((w) => now - Date.parse(w.ts) <= 65 * 60e3).slice(-7) });
  writeJSON(path.join(PUB, 'events.json'), events.slice(-80));

  // ---- maratonas: streams em direto há mais tempo (com pelo menos 20 espectadores)
  const allLive = [...Object.entries(res).filter(([k]) => k !== 'youtube').flatMap(([, r]) => r.list), ...(res.youtube?.list || prevLatest.youtube_live || [])].filter((s) => s.started_at && s.viewers >= 20);
  const byAge = (arr) => arr.sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at)).slice(0, 10).map(strip);
  const marathons = { global: byAge([...allLive]), luso: byAge(allLive.filter((s) => s.lang === 'pt')), portugal: byAge(allLive.filter((s) => s.portugal)) };

  // ---- línguas (Twitch + Kick)
  const langs = {};
  for (const k of ['twitch', 'kick']) for (const s of res[k]?.list || []) langs[s.lang || '?'] = (langs[s.lang || '?'] || 0) + s.viewers;

  // ---- latest (rankings)
  const prev = prevLatest;
  // YouTube não consultado agora: reaproveita as lives da última recolha (até 2 h)
  const ytLive = res.youtube?.list || (prev.youtube_live && now - Date.parse(prev.youtube_live_ts || 0) < 2 * 3600e3 ? prev.youtube_live : []);
  const all = [...Object.entries(res).filter(([k]) => k !== 'youtube').flatMap(([, r]) => r.list), ...ytLive];
  const latest = {
    ts, updated: new Date().toISOString(), errors,
    totals: { ...(prev.totals || {}), ...Object.fromEntries(Object.entries(res).map(([k, r]) => [k, { min_v: r.min_v || 0, viewers: r.viewers, streams: r.streams, pt_viewers: r.pt_viewers, ptpt_viewers: r.ptpt_viewers, complete: r.complete, rank: r.rank ?? null, at: ts }])) },
    limits: { kick_top: 100, youtube_top: 50, twitch_sample: extras.dominance?.sample ?? prev.limits?.twitch_sample ?? null, yt_units: quota.units },
    youtube_live: ytLive.slice(0, 60).map((x) => ({ ...strip(x), country: x.country || '' })), youtube_live_ts: res.youtube ? ts : prev.youtube_live_ts,
    games: { twitch: extras.games || prev.games?.twitch || [], kick: res.kick?.dominance?.games || prev.games?.kick || [] },
    videos_portugal: res.youtube?.videos_portugal || prev.videos_portugal || [],
    portugal_channels: { listed: ['twitch', 'kick', 'youtube'].reduce((a, k) => a + ((PORTUGAL_LIST[k] || []).length), 0), learned: Object.values(learned).reduce((a, b) => a + Object.keys(b || {}).length, 0) },
    top_global: all.sort((a, b) => b.viewers - a.viewers).slice(0, 25).map(strip),
    top_pt: all.filter((s) => s.lang === 'pt').sort((a, b) => b.viewers - a.viewers).slice(0, 25).map(strip),
    top_portugal: all.filter((s) => s.portugal).sort((a, b) => b.viewers - a.viewers).slice(0, 25).map(strip),
    languages: Object.keys(langs).length ? langs : prev.languages || {},
    marathons,
    clips: extras.clips || prev.clips || [],
    dominance: { twitch: extras.dominance || prev.dominance?.twitch || null, kick: res.kick?.dominance || prev.dominance?.kick || null },
    unique_channels: Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.length])),
    top_videos: res.youtube?.top_videos || prev.top_videos || [],
    top_videos_pt: res.youtube?.top_videos_pt || prev.top_videos_pt || [],
    box_art: res.twitch?.box_art || prev.box_art || null,
  };
  writeJSON(path.join(PUB, 'latest.json'), latest);
  console.log(`OK ${ts} — ${Object.keys(res).join(', ') || 'nenhuma'}${withYoutube ? '' : ' (YouTube na próxima hora)'} — ${errors.length} erros`);
  if (!Object.keys(res).length && !process.env.ALLOW_EMPTY) process.exitCode = 1;
}
run();
