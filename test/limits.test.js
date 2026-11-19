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

test('Portugal: lista nao_portugal tira canais de Portugal', async () => {
  const { notPortugal } = await import('../lib/platforms.js');
  assert.equal(notPortugal('maxMRM GAMEPLAY'), true);
  assert.equal(notPortugal('@maxmrmgameplay'), true);
  assert.equal(notPortugal('MAXMRM_GAMEPLAY'), true);
  assert.equal(notPortugal('wuant'), false);
});

test('Segurança: redact apaga chaves de textos públicos', async () => {
  const { redact } = await import('../lib/platforms.js');
  const env = { YOUTUBE_API_KEY: 'AIzaSECRETKEY123456', TWITCH_CLIENT_SECRET: 'twsecret999' };
  const out = redact('falhou https://x/y?part=id&key=AIzaSECRETKEY123456&q=1 twsecret999 Bearer abc.def', env);
  assert.ok(!out.includes('AIzaSECRETKEY123456') && !out.includes('twsecret999') && !out.includes('abc.def'));
});

test('Segurança: APIs recusam parâmetros extra (não se contorna a cache)', async () => {
  const mk = () => { const r = { headers: {}, code: 0, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, send() { return this; }, end() { return this; } }; return r; };
  const live = (await import('../api/live.js')).default;
  let r = mk(); await live({ method: 'GET', url: '/api/live?x=1' }, r); assert.equal(r.code, 400);
  const data = (await import('../api/data.js')).default;
  r = mk(); await data({ method: 'GET', url: '/api/data?f=latest&x=1' }, r); assert.equal(r.code, 400);
  r = mk(); await data({ method: 'GET', url: '/api/data?f=../../etc' }, r); assert.equal(r.code, 404);
});

test('Segurança: contador de visitas só aceita o próprio site', async () => {
  process.env.KV_REST_API_URL = 'https://redis.example'; process.env.KV_REST_API_TOKEN = 'tok';
  const v = (await import('../api/visitors.js')).default;
  const r = { headers: {}, code: 0, setHeader() {}, status(c) { this.code = c; return this; }, send() { return this; }, end() { return this; } };
  await v({ method: 'POST', url: '/api/visitors', headers: { host: 'a.com' }, body: { first: true } }, r);
  assert.equal(r.code, 403);
});

test('Twitch: streams com 0 espectadores a meio da lista não cortam a recolha', async () => {
  resetUsage();
  // 3 páginas; a 1.ª já tem uma stream com 0 espectadores (a Twitch não ordena de forma estrita);
  // a 3.ª devolve um cursor mas só repetidos -> fim
  const mk = (from, n, zeroAt = -1) => Array.from({ length: n }, (_, i) => ({ id: 's' + (from + i), user_id: String(from + i), user_login: 'u' + (from + i), user_name: 'U', viewer_count: i === zeroAt ? 0 : 100 - i, language: 'en', title: '', tags: [] }));
  const pages = { '': [mk(0, 100, 3), 'c1'], c1: [mk(100, 100), 'c2'], c2: [mk(150, 50), 'c3'] };
  globalThis.fetch = async (url) => {
    url = String(url);
    if (url.includes('oauth2/token')) return J({ access_token: 'T', expires_in: 5000 });
    if (url.includes('/helix/games?')) return J({ data: [{ id: '9', name: 'Grand Theft Auto VI', box_art_url: '' }] });
    if (url.includes('/helix/streams?')) { const after = new URL(url).searchParams.get('after') || ''; const [data, c] = pages[after] || [[], null]; return J({ data, pagination: c ? { cursor: c } : {} }); }
    return J({ data: [] });
  };
  const r = await twitchSnapshot({ clientId: 'x', clientSecret: 'y' });
  assert.equal(r.streams, 200);
  assert.equal(r.complete, true);
});
