import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('./platforms.test.js'); // reaproveita o fetch simulado
const { default: handler } = await import('../api/live.js');

test('/api/live devolve só dados agregados, com cache e sem segredos', async () => {
  process.env.TWITCH_CLIENT_ID = 'id'; process.env.TWITCH_CLIENT_SECRET = 'SUPERSECRET';
  process.env.KICK_CLIENT_ID = 'id'; process.env.KICK_CLIENT_SECRET = 'SUPERSECRET';
  const headers = {}; let body, status;
  const res = { setHeader: (k, v) => (headers[k] = v), status(s) { status = s; return this; }, send(b) { body = b; } };
  await handler({}, res);
  assert.equal(status, 200);
  assert.match(headers['Cache-Control'], /s-maxage=120/);
  assert.ok(!body.includes('SUPERSECRET'));
  const j = JSON.parse(body);
  assert.equal(j.twitch.viewers, 1350);
  assert.equal(j.kick.top_portugal[0].name, 'kpt');
  assert.deepEqual(j.errors, []);
});
