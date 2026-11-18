// Portugal, canais do YouTube, comparação com outros jogos, /api/data e /api/visitors (sem rede).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const calls = [];
const J = (o, status = 200) => ({ ok: status < 400, status, statusText: 'x', text: async () => JSON.stringify(o), json: async () => o });
globalThis.fetch = async (url, opts = {}) => {
  url = String(url); calls.push({ url, opts });
  if (url.startsWith('https://id.twitch.tv/oauth2/token')) return J({ access_token: 'T', expires_in: 5000 });
  if (url.includes('/helix/clips')) return J({ data: [] });
  if (url.includes('/helix/games/top')) return J({ data: [{ id: '1', name: 'Just Chatting' }, { id: '2', name: 'Counter-Strike' }, { id: '999', name: 'Grand Theft Auto VI' }, { id: '3', name: 'Minecraft' }] });
  if (url.includes('/helix/streams') && url.includes('game_id=2')) return J({ data: [{ id: 'a', viewer_count: 900 }, { id: 'b', viewer_count: 100 }], pagination: {} });
  if (url.includes('/helix/streams') && url.includes('game_id=3')) return J({ data: [{ id: 'c', viewer_count: 300 }], pagination: {} });
  if (url.includes('/helix/streams')) return J({ data: [], pagination: {} });
  // YouTube
  if (url.includes('youtube/v3/channels') && url.includes('forHandle')) {
    const h = new URL(url).searchParams.get('forHandle');
    return J({ items: h === '@RicFazeres' ? [{ id: 'UCric', snippet: { title: 'RicFazeres', country: '' }, contentDetails: { relatedPlaylists: { uploads: 'UUric' } } }] : [] });
  }
  if (url.includes('youtube/v3/playlistItems')) return J({ items: [
    { contentDetails: { videoId: 'r1', videoPublishedAt: '2026-11-19T10:00:00Z' } },
    { contentDetails: { videoId: 'r2', videoPublishedAt: '2026-11-19T11:00:00Z' } },
    { contentDetails: { videoId: 'r3', videoPublishedAt: '2026-11-01T11:00:00Z' } }] });
  if (url.includes('youtube/v3/search')) return J({ pageInfo: { totalResults: 0 }, items: [] });
  if (url.includes('youtube/v3/videos')) {
    const all = [
      { id: 'r1', snippet: { channelId: 'UCric', channelTitle: 'RicFazeres', title: 'O PRIMEIRO DIA NO GTA 6', liveBroadcastContent: 'none' }, statistics: { viewCount: '250000' } },
      { id: 'r2', snippet: { channelId: 'UCric', channelTitle: 'RicFazeres', title: 'GTA VI em direto!', liveBroadcastContent: 'live' }, liveStreamingDetails: { concurrentViewers: '12000', actualStartTime: '2026-11-19T11:00:00Z' } },
      { id: 'r3', snippet: { channelId: 'UCric', channelTitle: 'RicFazeres', title: 'Minecraft', liveBroadcastContent: 'none' }, statistics: { viewCount: '1' } },
    ];
    const ids = new URL(url).searchParams.get('id').split(',');
    return J({ items: all.filter((v) => ids.includes(v.id)) });
  }
  if (url.includes('youtube/v3/channels')) return J({ items: [{ id: 'UCric', snippet: { country: '' } }] });
  // GitHub raw (branch data)
  if (url.startsWith('https://raw.githubusercontent.com/dono/repo/data/public/data/history.json')) return J({ points: [1, 2] });
  // Upstash
  if (url.startsWith('https://redis.example/pipeline')) {
    const cmds = JSON.parse(opts.body);
    if (cmds[0][0] === 'MGET') return J([{ result: ['5', '9', '1000', '120'] }]);
    return J(cmds.map(() => ({ result: 1 })));
  }
  return J({ message: 'not found ' + url }, 404);
};

const P = await import('../lib/platforms.js');

test('Portugal: marcas explícitas e português europeu contam, Brasil não', () => {
  assert.equal(P.looksPortugal('twitch', 'x', 'GTA VI 🇵🇹 com a malta'), true);
  assert.equal(P.looksPortugal('twitch', 'x', 'GTA 6 a jogar até de manhã'), true);
  assert.equal(P.looksPortugal('twitch', 'x', 'GTA 6 jogando com a galera'), false);
  assert.equal(P.looksPortugal('twitch', 'x', 'GTA 6 fixed version', [], 'en'), false);
  assert.equal(P.looksPortugal('twitch', 'x', 'GTA 6 a jogar', [], 'en'), false);   // só em streams "pt"
});

test('Portugal: criadores da lista contam sempre, mesmo sem palavras-chave', () => {
  assert.equal(P.looksPortugal('twitch', 'RicFazeres', 'GTA 6 DIA 1', [], 'pt'), true);
  assert.equal(P.looksPortugal('kick', 'wuant', 'gta', [], 'en'), true);
});

test('Portugal: canais aprendidos', () => {
  assert.equal(P.looksPortugal('twitch', 'novo_tuga', 'GTA 6'), false);
  P.setLearnedPortugal({ twitch: ['novo_tuga'] });
  assert.equal(P.looksPortugal('twitch', 'novo_tuga', 'GTA 6'), true);
  P.setLearnedPortugal({});
});

test('YouTube: lê diretamente os canais portugueses (vídeos e lives de GTA)', async () => {
  const r = await P.youtubeSnapshot({ apiKey: 'k', now: new Date('2026-11-19T12:00:00Z'), ptHandles: ['@RicFazeres', '@NaoExiste'] });
  assert.equal(r.videos_portugal.length, 1);
  assert.equal(r.videos_portugal[0].channel, 'RicFazeres');
  assert.equal(r.videos_portugal[0].country, 'PT');
  assert.equal(r.ptpt_viewers, 12000);             // a live do RicFazeres conta como Portugal
  assert.equal(r.list[0].portugal, true);
  assert.equal(r.channel_cache['@RicFazeres'].uploads, 'UUric');
  assert.ok(r.channel_cache['@NaoExiste'].missing);
});

test('YouTube: canais em cache não gastam quota outra vez', async () => {
  const before = calls.filter((c) => c.url.includes('forHandle')).length;
  const cache = { '@RicFazeres': { id: 'UCric', uploads: 'UUric', at: '2026-11-19T00:00:00Z' } };
  await P.youtubeSnapshot({ apiKey: 'k', now: new Date('2026-11-19T12:00:00Z'), ptHandles: ['@RicFazeres'], channelCache: cache });
  assert.equal(calls.filter((c) => c.url.includes('forHandle')).length, before);
});

test('Twitch: GTA VI vs outros jogos (sem Just Chatting)', async () => {
  const r = await P.twitchExtras({ clientId: 'id', clientSecret: 's', gameId: '999', gta: { viewers: 5000, streams: 40, complete: true }, now: new Date('2026-11-20T00:00:00Z') });
  assert.deepEqual(r.games.map((g) => g.name), ['Grand Theft Auto VI', 'Counter-Strike', 'Minecraft']);
  assert.equal(r.games[0].gta, true);
  assert.equal(r.games[1].viewers, 1000);
  assert.equal(r.games[1].streams, 2);
});

test('/api/data: só ficheiros conhecidos, lê do branch data, com cache', async () => {
  process.env.DATA_REPO = 'dono/repo'; delete process.env.GITHUB_TOKEN;
  const { default: h } = await import('../api/data.js');
  const mk = () => { const o = { headers: {} }; o.res = { setHeader: (k, v) => (o.headers[k] = v), status(s) { o.status = s; return this; }, send(b) { o.body = b; }, end() {} }; return o; };
  let o = mk(); await h({ method: 'GET', url: '/api/data?f=../../etc/passwd' }, o.res); assert.equal(o.status, 404);
  o = mk(); await h({ method: 'POST', url: '/api/data?f=history' }, o.res); assert.equal(o.status, 405);
  o = mk(); await h({ method: 'GET', url: '/api/data?f=history' }, o.res);
  assert.equal(o.status, 200); assert.deepEqual(JSON.parse(o.body), { points: [1, 2] });
  assert.match(o.headers['Cache-Control'], /s-maxage=60/);
});

test('/api/visitors: desligado sem base, bloqueia outros sites, conta e lê', async () => {
  const { default: h } = await import('../api/visitors.js');
  const mk = () => { const o = { headers: {} }; o.res = { setHeader: (k, v) => (o.headers[k] = v), status(s) { o.status = s; return this; }, send(b) { o.body = b; }, end() { o.ended = true; } }; return o; };
  let o = mk(); await h({ method: 'GET', headers: {} }, o.res); assert.equal(o.status, 404);
  process.env.KV_REST_API_URL = 'https://redis.example'; process.env.KV_REST_API_TOKEN = 'tok';
  o = mk(); await h({ method: 'POST', headers: { host: 'site.app', origin: 'https://evil.com' }, body: { first: true } }, o.res); assert.equal(o.status, 403);
  o = mk(); await h({ method: 'POST', headers: { host: 'site.app', origin: 'https://site.app', 'sec-fetch-site': 'same-origin' }, body: { first: true } }, o.res); assert.equal(o.status, 204);
  const sent = calls.filter((c) => c.url.startsWith('https://redis.example')).map((c) => JSON.parse(c.opts.body));
  assert.ok(sent.some((cmds) => cmds.some((c) => c[0] === 'INCR' && c[1] === 'visits:total')));
  assert.ok(!JSON.stringify(sent).includes('site.app'));          // não guarda nada sobre o visitante
  o = mk(); await h({ method: 'GET', headers: {} }, o.res);
  assert.equal(o.status, 200); assert.deepEqual(JSON.parse(o.body), { online: 9, today: 120, total: 1000 });
  o = mk(); await h({ method: 'DELETE', headers: {} }, o.res); assert.equal(o.status, 405);
});
