// Coletor horário (GitHub Actions). Escreve:
//   public/data/history.json  — série temporal (1 ponto por hora)
//   public/data/latest.json   — rankings e detalhes da última recolha
//   data/seen.json            — canais únicos já vistos (privado, fora do site)
// Uso: node scripts/collect.js         (usa as variáveis de ambiente)
//      MOCK=1 node scripts/collect.js  (dados falsos, para testar o dashboard)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { twitchSnapshot, twitchExtras, kickSnapshot, youtubeSnapshot, creds, strip } from '../lib/platforms.js';
import { forecast, peakOf } from '../public/forecast.js';

const LAUNCH = Date.parse('2026-11-19T00:00:00Z');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public', 'data');
const PRIV = path.join(ROOT, 'data');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJSON = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o)); };

const now = process.env.MOCK_NOW ? new Date(process.env.MOCK_NOW) : new Date();
now.setUTCMinutes(0, 0, 0);
const ts = now.toISOString().replace('.000Z', 'Z');
const withVideos = now.getUTCHours() % 3 === 0 || process.env.FORCE_YT_VIDEOS === '1';

async function run() {
  const c = creds();
  const res = {}, errors = [];
  const jobs = process.env.MOCK
    ? (await import('./mock.js')).mockSnapshots(now, withVideos)
    : {
      twitch: c.twitch && twitchSnapshot({ ...c.twitch, maxPages: 150 }),
      kick: c.kick && kickSnapshot(c.kick),
      youtube: c.youtube && youtubeSnapshot({ ...c.youtube, withVideos, now }),
    };
  await Promise.all(Object.entries(jobs).map(async ([k, p]) => {
    if (!p) { console.log(`${k}: sem credenciais, a saltar`); return; }
    try { res[k] = await p; console.log(`${k}: ${res[k].streams} streams, ${res[k].viewers} espectadores`); }
    catch (e) { errors.push(`${k}: ${e.message}`); console.error(`ERRO ${k}:`, e.message); }
  }));

  // ---- extras da Twitch (clips + domínio na plataforma)
  let extras = {};
  if (res.twitch?.game_id && (c.twitch || process.env.MOCK)) {
    try {
      extras = process.env.MOCK ? (await import('./mock.js')).mockExtras(now) : await twitchExtras({ ...c.twitch, gameId: res.twitch.game_id, now });
      if (extras.clips_error) errors.push(`twitch clips: ${extras.clips_error}`);
    } catch (e) { errors.push(`twitch extras: ${e.message}`); }
  }

  // ---- canais únicos acumulados
  const seen = readJSON(path.join(PRIV, 'seen.json'), {});
  for (const [k, r] of Object.entries(res)) {
    const set = new Set(seen[k] || []);
    for (const s of r.list) set.add(s.id);
    seen[k] = [...set];
  }
  writeJSON(path.join(PRIV, 'seen.json'), seen);

  // ---- histórico
  const history = readJSON(path.join(PUB, 'history.json'), { points: [] });
  const point = { ts };
  for (const [k, r] of Object.entries(res)) {
    point[k] = { v: r.viewers, s: r.streams, pv: r.pt_viewers, ps: r.pt_streams, ppv: r.ptpt_viewers, pps: r.ptpt_streams };
    if (r.rank != null) point[k].rank = r.rank;
    if (r.top10 != null) point[k].t10 = r.top10;
    const dom = k === 'twitch' ? extras.dominance : r.dominance;
    if (dom) Object.assign(point[k], { dg: dom.gta_viewers, dt: dom.sample_viewers, d100: dom.gta_in_top100, d10: dom.gta_in_top10, dn: dom.sample });
    if (r.new_videos_3h != null) Object.assign(point[k], { nv: r.new_videos_3h, nvp: r.new_videos_3h_pt, nvpp: r.new_videos_3h_portugal });
  }
  // quem domina o top 10 (todas as plataformas juntas)
  const top10all = Object.values(res).flatMap((r) => r.list).sort((a, b) => b.viewers - a.viewers).slice(0, 10);
  if (top10all.length) point.mix = Object.fromEntries(Object.keys(res).map((k) => [k, top10all.filter((s) => s.platform === k).length]));
  history.points = history.points.filter((p) => p.ts !== ts); // re-run na mesma hora substitui
  if (Object.keys(point).length > 1) history.points.push(point);
  history.points.sort((a, b) => a.ts.localeCompare(b.ts));
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
  const hourIdx = Math.round(now.getTime() / 3600e3);   // hora desde 1970 (compacto)
  const liveByKey = new Map(Object.values(res).flatMap((r) => r.list).map((s) => [`${s.platform}:${s.id}`, s]));
  const tracked = Object.keys(hall.all).slice(0, 150);
  for (const key of tracked) {
    const s = liveByKey.get(key), h = hall.all[key];
    const rec = series[key] || { name: h.name, platform: h.platform, url: h.url, avatar: h.avatar, lang: h.lang, portugal: h.portugal, pts: [] };
    Object.assign(rec, { name: h.name, avatar: h.avatar || rec.avatar, peak: h.peak, peak_at: h.at, portugal: h.portugal || rec.portugal });
    rec.pts = rec.pts.filter((x) => x[0] !== hourIdx);
    if (s) rec.pts.push([hourIdx, s.viewers]);
    rec.pts = rec.pts.slice(-1500);
    series[key] = rec;
  }
  for (const k of Object.keys(series)) if (!tracked.includes(k)) delete series[k];
  writeJSON(path.join(PUB, 'streamers.json'), series);

  // ---- saltos: streamers que ganharam muitos espectadores desde a última hora
  const prevV = readJSON(path.join(PRIV, 'prev.json'), {});
  const events = readJSON(path.join(PUB, 'events.json'), []);
  const nextV = {};
  for (const [key, s] of liveByKey) {
    if (s.viewers >= 200) nextV[key] = s.viewers;
    const before = prevV[key] || 0, gain = s.viewers - before;
    const min = s.lang === 'pt' ? 1000 : 5000;
    if (s.viewers >= min && (gain >= min || (before && s.viewers >= before * 2 && gain >= min / 2))) {
      events.push({ ts, key, ...strip(s), from: before, to: s.viewers, kind: before ? 'jump' : 'start' });
    }
  }
  writeJSON(path.join(PRIV, 'prev.json'), nextV);
  writeJSON(path.join(PUB, 'events.json'), events.filter((e) => e.ts !== ts || true).slice(-80));

  // ---- maratonas: streams em direto há mais tempo (com pelo menos 20 espectadores)
  const allLive = Object.values(res).flatMap((r) => r.list).filter((s) => s.started_at && s.viewers >= 20);
  const byAge = (arr) => arr.sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at)).slice(0, 10).map(strip);
  const marathons = { global: byAge([...allLive]), luso: byAge(allLive.filter((s) => s.lang === 'pt')), portugal: byAge(allLive.filter((s) => s.portugal)) };

  // ---- línguas (Twitch + Kick)
  const langs = {};
  for (const k of ['twitch', 'kick']) for (const s of res[k]?.list || []) langs[s.lang || '?'] = (langs[s.lang || '?'] || 0) + s.viewers;

  // ---- latest (rankings)
  const prev = readJSON(path.join(PUB, 'latest.json'), {});
  const all = Object.values(res).flatMap((r) => r.list);
  const latest = {
    ts, updated: new Date().toISOString(), errors,
    totals: Object.fromEntries(Object.entries(res).map(([k, r]) => [k, { viewers: r.viewers, streams: r.streams, pt_viewers: r.pt_viewers, ptpt_viewers: r.ptpt_viewers, complete: r.complete, rank: r.rank ?? null }])),
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
  console.log(`OK ${ts} — ${Object.keys(res).length} plataformas, ${errors.length} erros`);
  if (!Object.keys(res).length && !process.env.ALLOW_EMPTY) process.exitCode = 1;
}
run();
