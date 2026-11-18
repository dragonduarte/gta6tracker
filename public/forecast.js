// Previsão simples e explicável para as próximas horas.
// Usada no browser (dashboard) e no coletor (para guardar a previsão de cada dia e comparar com o real).
//
// Modelo: para cada hora futura, média dos valores à mesma hora do dia (hora de Lisboa) nos últimos
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
export function forecast(points, value, fromTs, hours = 24, launchTs = Date.parse('2026-11-19T00:00:00Z')) {
  let series = points.map((p) => ({ t: Date.parse(p.ts), v: value(p) })).filter((x) => x.v != null && x.t < fromTs);
  if (fromTs > launchTs) series = series.filter((x) => x.t >= launchTs);   // regime pós-lançamento
  if (series.length < 24) return null;                                     // precisa de pelo menos 1 dia
  const last = series[series.length - 1].t;

  // tendência
  const win = (a, b) => series.filter((x) => x.t > a && x.t <= b).map((x) => x.v);
  const avg = (a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const recent = avg(win(last - 24 * HOUR, last)), before = avg(win(last - 48 * HOUR, last - 24 * HOUR));
  const trend = recent && before ? Math.min(1.5, Math.max(0.6, recent / before)) : 1;

  // perfil por hora do dia (últimos 3 dias)
  const byHour = Array.from({ length: 24 }, () => []);
  for (const x of series.filter((x) => x.t > last - 72 * HOUR)) byHour[lisbonHour(x.t)].push(x.v);
  const overall = avg(series.slice(-24).map((x) => x.v));
  const profile = byHour.map((a) => avg(a) ?? overall);

  const out = [];
  const start = Math.ceil(fromTs / HOUR) * HOUR;
  for (let i = 0; i < hours; i++) {
    const t = start + i * HOUR;
    out.push({ ts: t, v: Math.max(0, Math.round(profile[lisbonHour(t)] * trend)) });
  }
  return out;
}

export function peakOf(series) {
  if (!series?.length) return null;
  return series.reduce((m, x) => (x.v > m.v ? x : m), series[0]);
}

if (typeof window !== 'undefined') window.GTA_FORECAST = { forecast, peakOf };
