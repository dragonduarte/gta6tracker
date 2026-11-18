// Dados FALSOS só para pré-visualizar o dashboard sem chaves.
// node scripts/mock.js  -> preenche public/data com ~4 dias simulados (NÃO fazer commit disto).
import { fileURLToPath } from 'node:url';

const LAUNCH = Date.parse('2026-11-19T00:00:00Z');
const names = ['ShadowRaven', 'Kaique', 'Gaules', 'xQcOW', 'summit1g', 'Tuga_Gamer', 'Rubius', 'ibai', 'LobaLX', 'ZeroPT', 'Coringa', 'NataPT', 'Pato', 'MiguelPlays', 'Lucasbrnx'];
const rnd = (a, b) => a + Math.random() * (b - a);

function curve(t) {
  const h = (t - LAUNCH) / 3600e3;
  const daily = 1 + 0.45 * Math.sin(((new Date(t).getUTCHours() - 8) / 24) * 2 * Math.PI);
  const hype = h < 0 ? 1 + Math.max(0, 24 + h) / 24 : 1 + 9 * Math.exp(-h / 60) + 2;
  return daily * hype * rnd(0.93, 1.07);
}

function fakeList(platform, base, n, t = Date.now()) {
  return Array.from({ length: n }, (_, i) => {
    const pt = i % 3 === 1;
    const name = names[(i + platform.length) % names.length] + (i > 14 ? i : '');
    return { platform, id: `${platform}-${i}`, login: name.toLowerCase(), name, title: pt ? 'GTA VI DIA 1 🇵🇹 a explorar Leonida' : 'GTA 6 FIRST DAY — full playthrough',
      viewers: Math.round(base / (i + 1.4) * (0.6 + ((i * 7919 + Math.floor(t / 3600e3) * 31) % 100) / 100)), lang: pt ? 'pt' : ['en', 'es', 'de', 'fr'][i % 4], portugal: pt && i % 2 === 0, url: '#',
      avatar: null, started_at: new Date(Date.now() - (i * 97 % 40 + 1) * 3600e3 * 0.8).toISOString() };
  });
}

export function mockSnapshots(now, withVideos) {
  const k = curve(now.getTime());
  const mk = (platform, base, n, extra = {}) => {
    const list = fakeList(platform, base * k / 4, 30, now.getTime());
    const pt = list.filter((s) => s.lang === 'pt'), pp = list.filter((s) => s.portugal);
    const scale = n * k;
    return Promise.resolve({ viewers: Math.round(base * k), streams: Math.round(scale),
      pt_viewers: Math.round(base * k * 0.16), pt_streams: Math.round(scale * 0.14),
      ptpt_viewers: Math.round(base * k * 0.022), ptpt_streams: Math.round(scale * 0.018), list, complete: true,
      top10: Math.round(base * k * 0.35), ...(platform === 'kick' ? { dominance: { sample: 100, sample_viewers: Math.round(base * k * 4), gta_viewers: Math.round(base * k), gta_in_top100: Math.round(10 + k * 4), gta_in_top10: Math.min(10, Math.round(k)) } } : {}),
      ...(platform === 'twitch' ? { game_id: '999', rank: k > 3 ? 1 : 2, languages: { en: 50, pt: 16, es: 14, de: 6, fr: 5, ru: 4, ja: 2, it: 2 } } : {}), ...extra });
  };
  return {
    twitch: mk('twitch', 60000, 900),
    kick: mk('kick', 14000, 120),
    youtube: mk('youtube', 30000, 50, withVideos ? {
      new_videos_3h: Math.round(400 * k), new_videos_3h_pt: Math.round(60 * k), new_videos_3h_portugal: Math.round(9 * k),
      top_videos: Array.from({ length: 10 }, (_, i) => ({ id: i, channel: names[i], title: `GTA 6 — tudo o que precisas de saber #${i + 1}`, url: '#', views: Math.round(900000 / (i + 1)), likes: 1000, country: i % 4 ? 'US' : 'PT' })),
      top_videos_pt: Array.from({ length: 8 }, (_, i) => ({ id: i, channel: names[i + 3], title: `GTA VI em português — parte ${i + 1}`, url: '#', views: Math.round(150000 / (i + 1)), likes: 100, country: i % 2 ? 'BR' : 'PT' })),
    } : {}),
  };
}

export function mockExtras(now) {
  const k = curve(now.getTime());
  return {
    clips: Array.from({ length: 12 }, (_, i) => ({ title: ['Perseguição épica em Vice City', 'O primeiro assalto 😂', 'Lucia & Jason — cena incrível', 'Bug mais estranho de sempre'][i % 4], views: Math.round(250000 / (i + 1)), creator: names[i], url: '#', thumb: null, lang: i % 3 ? 'en' : 'pt', created_at: now.toISOString(), duration: 28 })),
    dominance: { sample: 1000, sample_viewers: Math.round(2.4e6 * (0.8 + k / 12)), gta_viewers: Math.round(60000 * k), gta_in_top100: Math.min(100, Math.round(6 * k)), gta_in_top10: Math.min(10, Math.round(k / 1.5)) },
  };
}

// Execução direta: preencher histórico simulado
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { execFileSync } = await import('node:child_process');
  const start = Date.parse('2026-11-16T00:00:00Z');
  const end = Date.parse(process.argv[2] || '2026-11-20T12:00:00Z');
  for (let t = start; t <= end; t += 3600e3) {
    execFileSync(process.execPath, [fileURLToPath(new URL('./collect.js', import.meta.url))], {
      env: { ...process.env, MOCK: '1', MOCK_NOW: new Date(t).toISOString() }, stdio: 'ignore' });
  }
  console.log('Histórico simulado gerado em public/data/');
}
