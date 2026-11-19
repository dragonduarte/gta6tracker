// Previsão simples e explicável para as próximas horas.
// Usada no browser (dashboard) e no coletor (para guardar a previsão de cada dia e comparar com o real).
//
// Modelo: (dados agregados à hora) para cada hora futura, média dos valores à mesma hora do dia (hora de Lisboa) nos últimos
// 3 dias disponíveis, multiplicada pela tendência (últimas 24 h ÷ 24 h anteriores, limitada a 0,6–1,5).
// Depois do lançamento só usa dados pós-lançamento (o comportamento muda completamente).

const HOUR = 3600e3;
const lisbonHour = (t) => Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Lisbon' }).format(new Date(t)));

/**
 * @param {{ts:string}[]} points  histórico (ordenado)
 * @param {(p:object)=>number|null} value  extrai o valor de um ponto
 * @param {number} fromTs  início da previsão (ms)
 * @param {number} hours  horas a prever
 * @param {number} launchTs  momento do lançamento (ms)
 * @returns {{ts:number, v:number}[] | null}
 */
export function forecast(points, value, fromTs, hours = 24, launchTs = Date.parse('2026-11-18T11:00:00Z')) {
  // médias por hora (a recolha é de 10 em 10 min; o modelo trabalha à hora)
  const buckets = new Map();
  for (const p of points) {
    const t = Date.parse(p.ts), v = value(p);
    if (v == null || !(t < fromTs)) continue;
    const h = Math.floor(t / HOUR) * HOUR, b = buckets.get(h) || [0, 0];
    b[0] += v; b[1]++; buckets.set(h, b);
  }
  let series = [...buckets].sort((a, b) => a[0] - b[0]).map(([t, [s, n]]) => ({ t, v: s / n }));
  if (fromTs > launchTs) series = series.filter((x) => x.t >= launchTs);   // regime pós-lançamento
  // Previsão provisória: depois do lançamento, com 8 a 23 horas de dados (ver em baixo). Com 24 h ou mais, só dados pós-lançamento.
  const partial = series.length < 24;
  if (partial && (fromTs <= launchTs || series.length < 8)) return null;
  const last = series[series.length - 1].t;

  // tendência
  const win = (a, b) => series.filter((x) => x.t > a && x.t <= b).map((x) => x.v);
  const avg = (a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const recent = avg(win(last - 24 * HOUR, last)), before = avg(win(last - 48 * HOUR, last - 24 * HOUR));
  const trend = recent && before ? Math.min(1.5, Math.max(0.6, recent / before)) : 1;

  // perfil por hora do dia (últimos 3 dias). O pico das primeiras 3 horas do lançamento não se repete, por isso não entra.
  const spike = (t) => fromTs > launchTs && t >= launchTs && t < launchTs + 3 * HOUR;
  const byHour = Array.from({ length: 24 }, () => []);
  for (const x of series.filter((x) => x.t > last - 72 * HOUR && !spike(x.t))) byHour[lisbonHour(x.t)].push(x.v);
  const overall = avg(series.slice(-24).map((x) => x.v));
  // horas sem dados: na previsão provisória ficam ao nível das últimas 3 horas (não se inventa uma forma que ainda não vimos)
  const fill = partial ? avg(series.slice(-3).map((x) => x.v)) : overall;
  let profile = byHour.map((a) => avg(a) ?? fill);
  profile = profile.map((v) => v ?? overall);

  const out = [];
  const start = Math.ceil(fromTs / HOUR) * HOUR;
  for (let i = 0; i < hours; i++) {
    const t = start + i * HOUR;
    out.push({ ts: t, v: Math.max(0, Math.round(profile[lisbonHour(t)] * trend)) });
  }
  out.partial = partial;
  return out;
}

export function peakOf(series) {
  if (!series?.length) return null;
  return series.reduce((m, x) => (x.v > m.v ? x : m), series[0]);
}

if (typeof window !== 'undefined') window.GTA_FORECAST = { forecast, peakOf };
