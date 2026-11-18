// Testa a lógica com respostas simuladas no formato documentado das APIs (sem rede).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const calls = [];
globalThis.fetch = async (url, opts = {}) => {
  url = String(url); calls.push(url);
  const J = (o, status = 200) => ({ ok: status < 400, status, statusText: 'x', text: async () => JSON.stringify(o) });
  if (url.startsWith('https://id.twitch.tv/oauth2/token')) return J({ access_token: 'T', expires_in: 5000 });
  if (url.includes('/helix/games/top')) return J({ data: [{ id: '1' }, { id: '999' }], pagination: {} });
  if (url.includes('/helix/games?')) return J({ data: [{ id: '999', name: 'Grand Theft Auto VI', box_art_url: 'x' }] });
  if (url.includes('/helix/clips')) return J({ data: [{ title: 'a', view_count: 5, broadcaster_name: 'x', url: 'https://clips.twitch.tv/a' }, { title: 'b', view_count: 50, broadcaster_name: 'y', url: 'https://clips.twitch.tv/b' }] });
  if (url.includes('/helix/streams') && !url.includes('game_id')) return J({ data: [
    { id: 'a', game_id: '999', viewer_count: 1000 }, { id: 'b', game_id: '1', viewer_count: 3000 }, { id: 'c', game_id: '999', viewer_count: 500 }], pagination: {} });
  if (url.includes('/helix/streams')) {
    const page2 = url.includes('after=c1');
    return J({ data: page2
      ? [{ id: 's3', user_id: 'u3', user_login: 'tuga', user_name: 'Tuga', title: 'GTA VI', viewer_count: 50, language: 'pt', tags: ['Portugal'] },
         { id: 's1', user_id: 'u1', user_login: 'big', user_name: 'Big', title: 'dup', viewer_count: 1000, language: 'en', tags: [] }]
      : [{ id: 's1', user_id: 'u1', user_login: 'big', user_name: 'Big', title: 'GTA 6', viewer_count: 1000, language: 'en', tags: [] },
         { id: 's2', user_id: 'u2', user_login: 'br', user_name: 'Br', title: 'GTA 6 BR', viewer_count: 300, language: 'pt', tags: ['Brasil'] }],
      pagination: page2 ? {} : { cursor: 'c1' } });
  }
  if (url.includes('/helix/users')) return J({ data: [{ id: 'u1', profile_image_url: 'pic1' }] });
  if (url === 'https://id.kick.com/oauth/token') { assert.match(opts.body, /grant_type=client_credentials/); return J({ access_token: 'K', expires_in: 3600 }); }
  if (url.includes('api.kick.com/public/v2/categories')) return J({ data: [{ id: 4242, name: 'Grand Theft Auto VI' }] });
  if (url.includes('api.kick.com/public/v1/livestreams')) {
    const pt = url.includes('language=pt');
    const s = (id, slug, v, lang, title) => ({ broadcaster_user_id: id, channel_id: id, slug, stream_title: title, language: lang, viewer_count: v, started_at: 'x', category: { id: 4242 } });
    if (!url.includes('category_id')) return J({ data: [s(1, 'kbig', 500, 'en', 'gta'), { ...s(9, 'slots', 1500, 'en', 'x'), category: { id: 28 } }] });
    assert.match(url, /category_id=4242/);
    return J({ data: pt ? [s(2, 'kpt', 80, 'pt', 'GTA VI 🇵🇹')] : [s(1, 'kbig', 500, 'en', 'gta'), s(2, 'kpt', 80, 'pt', 'GTA VI 🇵🇹')], message: 'OK' });
  }
  if (url.includes('youtube/v3/search')) {
    const live = url.includes('eventType=live');
    return J({ pageInfo: { totalResults: 1234 }, items: live ? [{ id: { videoId: 'v1' } }, { id: { videoId: 'v2' } }] : [{ id: { videoId: 'n1' } }] });
  }
  if (url.includes('youtube/v3/videos')) {
    const items = [
      { id: 'v1', snippet: { channelId: 'c1', channelTitle: 'Yank', title: 'live', defaultAudioLanguage: 'en' }, liveStreamingDetails: { concurrentViewers: '700' } },
      { id: 'v2', snippet: { channelId: 'c2', channelTitle: 'Luso', title: 'live pt' }, liveStreamingDetails: { concurrentViewers: '90' } },
      { id: 'n1', snippet: { channelId: 'c2', channelTitle: 'Luso', title: 'novo' }, statistics: { viewCount: '5000' } },
    ];
    const ids = new URL(url).searchParams.get('id').split(',');
    return J({ items: items.filter((i) => ids.includes(i.id)) });
  }
  if (url.includes('youtube/v3/channels')) return J({ items: [{ id: 'c1', snippet: { country: 'US' } }, { id: 'c2', snippet: { country: 'PT' } }] });
  return J({ message: 'not found ' + url }, 404);
};

const { twitchSnapshot, twitchExtras, kickSnapshot, youtubeSnapshot } = await import('../lib/platforms.js');

test('twitch: pagina, remove duplicados, separa PT e Portugal, ranking', async () => {
  const r = await twitchSnapshot({ clientId: 'id', clientSecret: 'sec' });
  assert.equal(r.streams, 3);
  assert.equal(r.viewers, 1350);
  assert.equal(r.pt_viewers, 350);
  assert.equal(r.ptpt_viewers, 50);       // só o "tuga" com tag Portugal
  assert.equal(r.rank, 2);
  assert.equal(r.list[0].avatar, 'pic1');
  assert.equal(r.complete, true);
});

test('kick: token, categoria, junta global + pt sem duplicar', async () => {
  const r = await kickSnapshot({ clientId: 'id', clientSecret: 'sec' });
  assert.equal(r.streams, 2);
  assert.equal(r.viewers, 580);
  assert.equal(r.pt_viewers, 80);
  assert.equal(r.ptpt_viewers, 80);       // emoji 🇵🇹 no título
});

test('youtube: lives, país do canal, vídeos novos', async () => {
  const r = await youtubeSnapshot({ apiKey: 'k', withVideos: true, now: new Date('2026-11-19T12:00:00Z') });
  assert.equal(r.viewers, 790);
  assert.equal(r.ptpt_viewers, 90);
  assert.equal(r.new_videos_3h, 1234);
  assert.equal(r.top_videos[0].country, 'PT');
});

test('segredos nunca aparecem fora do pedido de token', () => {
  for (const u of calls.filter((u) => !u.includes('oauth'))) assert.ok(!u.includes('sec'), u);
});

test('twitch extras: clips ordenados e domínio nas maiores streams', async () => {
  const r = await twitchExtras({ clientId: 'id', clientSecret: 'sec', gameId: '999', now: new Date('2026-11-20T00:00:00Z') });
  assert.equal(r.clips[0].views, 50);
  assert.equal(r.dominance.sample_viewers, 4500);
  assert.equal(r.dominance.gta_viewers, 1500);
  assert.equal(r.dominance.gta_in_top10, 2);
});

test('kick: domínio na plataforma', async () => {
  const r = await kickSnapshot({ clientId: 'id', clientSecret: 'sec' });
  assert.equal(r.dominance.sample_viewers, 2000);
  assert.equal(r.dominance.gta_viewers, 500);
  assert.equal(r.top10, 580);
});

test('pesquisa e categoria incluem todas as formas do nome', () => {
  const yt = decodeURIComponent(calls.find((u) => u.includes('youtube/v3/search')).replace(/\+/g, ' '));
  for (const k of ['GTA VI', 'GTA 6', 'GTA6', 'Grand Theft Auto VI', 'Grand Theft Auto 6']) assert.ok(yt.includes(`"${k}"`), k);
  const tw = decodeURIComponent(calls.find((u) => u.includes('/helix/games?')));
  assert.ok(tw.includes('name=Grand Theft Auto VI') && tw.includes('name=Grand Theft Auto 6'));
});

test('segredos nunca vão em URLs (nem no pedido de token)', () => {
  assert.ok(!calls.some((u) => u.includes('client_secret')));
});
