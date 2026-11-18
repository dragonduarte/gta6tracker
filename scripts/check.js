// Verifica as tuas chaves: node scripts/check.js  (lê .env se existir)
// Mostra o que cada plataforma devolve, sem gastar quase nada de quota.
import fs from 'node:fs';
try { for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, ''); } } catch {}
const { twitchSnapshot, kickSnapshot, youtubeSnapshot, creds } = await import('../lib/platforms.js');
const c = creds();
const ok = (n, r) => console.log(`✅ ${n}: ${r.streams} streams, ${r.viewers} espectadores (PT: ${r.pt_viewers}, Portugal: ${r.ptpt_viewers})${r.rank ? `, #${r.rank} na Twitch` : ''}${r.category_id ? `, categoria Kick = ${r.category_id}` : ''}\n   top: ${r.list.slice(0, 3).map((s) => `${s.name} (${s.viewers})`).join(', ') || '—'}`);
for (const [n, fn] of [['Twitch', c.twitch && (() => twitchSnapshot({ ...c.twitch, maxPages: 3 }))], ['Kick', c.kick && (() => kickSnapshot(c.kick))], ['YouTube', c.youtube && (() => youtubeSnapshot(c.youtube))]]) {
  if (!fn) { console.log(`⏭  ${n}: sem chaves`); continue; }
  try { ok(n, await fn()); } catch (e) { console.log(`❌ ${n}: ${e.message}`); process.exitCode = 1; }
}
