// Limites das APIs grátis: retry em 429, contador de quota do YouTube, 403 de quota (sem rede).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { twitchSnapshot, usage, resetUsage } from '../lib/platforms.js';

const J = (o, status = 200, headers = {}) => ({ ok: status < 400, status, statusText: 'x', headers: { get: (k) => headers[k.toLowerCase()] ?? null }, text: async () => JSON.stringify(o) });

test('429 da Twitch: espera e repete no máximo 2 vezes', async () => {
  resetUsage();
  let n = 0;
  globalThis.fetch = async (url) => {
    url = String(url);
    if (url.includes('oauth2/token')) return J({ access_token: 'T', expires_in: 5000 });
    if (url.includes('/helix/games?')) return J({ data: [{ id: '9', name: 'Grand Theft Auto VI', box_art_url: '' }] });
    if (url.includes('/helix/streams')) { n++; return n < 2 ? J({ message: 'slow down' }, 429, { 'retry-after': '0' }) : J({ data: [{ id: 's1', user_id: '1', user_login: 'a', user_name: 'A', viewer_count: 10, language: 'pt', title: 't', tags: [] }], pagination: {} }); }
    return J({ data: [] });
  };
  const r = await twitchSnapshot({ clientId: 'x', clientSecret: 'y' });
  assert.equal(r.viewers, 10);
  assert.equal(usage.retries, 1);
});

test('429 persistente: desiste sem insistir (3 tentativas no máximo)', async () => {
  resetUsage();
  let n = 0;
  globalThis.fetch = async (url) => {
    url = String(url);
    if (url.includes('oauth2/token')) return J({ access_token: 'T', expires_in: 5000 });
    if (url.includes('/helix/games?')) return J({ data: [{ id: '9', name: 'Grand Theft Auto VI' }] });
    if (url.includes('/helix/streams')) { n++; return J({ message: 'no' }, 429, { 'retry-after': '0' }); }
    return J({ data: [] });
  };
  await assert.rejects(twitchSnapshot({ clientId: 'x', clientSecret: 'y' }), /429/);
  assert.equal(n, 3);
});

test('YouTube: search custa 100 unidades, o resto 1', async () => {
  resetUsage();
  const { youtubeSnapshot } = await import('../lib/platforms.js');
  globalThis.fetch = async (url) => { url = String(url); return url.includes('/search') ? J({ pageInfo: { totalResults: 0 }, items: [] }) : J({ items: [] }); };
  await youtubeSnapshot({ apiKey: 'k', ptHandles: [], withVideos: false });
  assert.equal(usage.youtube, 200);   // 2 pesquisas de lives
});

test('YouTube: 403 de quota é marcado para parar o dia', async () => {
  resetUsage();
  const { youtubeSnapshot } = await import('../lib/platforms.js');
  globalThis.fetch = async () => J({ error: { message: 'quota', errors: [{ reason: 'quotaExceeded' }] } }, 403);
  await assert.rejects(youtubeSnapshot({ apiKey: 'k', ptHandles: [] }), (e) => e.quotaExceeded === true);
});
