// GET /api/data?f=history — serve os ficheiros de dados guardados no branch "data" do GitHub.
// Porquê: a recolha corre de 10 em 10 minutos. Se cada recolha fizesse commit no branch principal,
// o Vercel faria um deploy novo de cada vez (e o plano grátis tem limite de deploys por dia).
// Assim os dados vivem num branch à parte e o site lê-os por aqui, com cache na CDN.
//
// Repositório: lido automaticamente das variáveis do Vercel (VERCEL_GIT_REPO_OWNER / _SLUG)
// ou de DATA_REPO="utilizador/repositorio". Repositório privado: define GITHUB_TOKEN (só leitura).

const FILES = new Set(['history', 'latest', 'hall', 'predictions', 'streamers', 'events']);
const BRANCH = 'data';
const memo = new Map();             // ficheiro -> { at, body }
const FRESH_MS = 45e3;

function repo(env = process.env) {
  const r = env.DATA_REPO || (env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_SLUG ? `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}` : '');
  return /^[\w.-]+\/[\w.-]+$/.test(r) ? r : null;
}

async function fetchFile(name, env = process.env) {
  const r = repo(env);
  if (!r) throw new Error('repo');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const token = env.GITHUB_TOKEN;
    const url = token
      ? `https://api.github.com/repos/${r}/contents/public/data/${name}.json?ref=${BRANCH}`
      : `https://raw.githubusercontent.com/${r}/${BRANCH}/public/data/${name}.json`;
    const headers = token ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json', 'User-Agent': 'gta6-tracker' } : { 'User-Agent': 'gta6-tracker' };
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    JSON.parse(text);               // só serve JSON válido
    return text;
  } finally { clearTimeout(timer); }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('{"error":"method not allowed"}');
  }
  const name = String(new URL(req.url || '/', 'http://x').searchParams.get('f') || '');
  if (!FILES.has(name)) return res.status(404).send('{"error":"not found"}');

  const m = memo.get(name);
  if (m && Date.now() - m.at < FRESH_MS) {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return res.status(200).send(m.body);
  }
  try {
    const body = await fetchFile(name);
    memo.set(name, { at: Date.now(), body });
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return res.status(200).send(body);
  } catch {
    if (m) { res.setHeader('Cache-Control', 'public, s-maxage=30'); return res.status(200).send(m.body); }
    // sem branch "data" ainda: o site usa os ficheiros estáticos em /data/
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).send('{"error":"unavailable"}');
  }
}

export { repo as _repo };
