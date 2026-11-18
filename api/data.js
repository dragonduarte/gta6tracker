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

const DEFAULT_REPO = 'dragonduarte/gta6tracker';   // usado se o Vercel não indicar o repositório
function repo(env = process.env) {
  const r = env.DATA_REPO || (env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_SLUG ? `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}` : '') || DEFAULT_REPO;
  return /^[\w.-]+\/[\w.-]+$/.test(r) ? r : DEFAULT_REPO;
}

async function get(url, headers) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const text = await res.text();
    JSON.parse(text);               // só serve JSON válido
    return text;
  } finally { clearTimeout(timer); }
}

// Tenta primeiro o link público (raw). Se houver GITHUB_TOKEN e o raw falhar, tenta pela API com o token.
// Um token errado nunca bloqueia o site.
async function fetchFile(name, env = process.env) {
  const r = repo(env);
  const ua = { 'User-Agent': 'gta6-tracker' };
  try { return await get(`https://raw.githubusercontent.com/${r}/${BRANCH}/public/data/${name}.json?t=${Math.floor(Date.now() / 60e3)}`, ua); }
  catch (e) {
    if (!env.GITHUB_TOKEN) throw e;
    return get(`https://api.github.com/repos/${r}/contents/public/data/${name}.json?ref=${BRANCH}`,
      { ...ua, Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.raw+json' });
  }
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
  } catch (e) {
    if (m) { res.setHeader('Cache-Control', 'public, s-maxage=30'); return res.status(200).send(m.body); }
    // diz porquê (sem segredos), para ser fácil de diagnosticar abrindo /api/data?f=latest no browser
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).send(JSON.stringify({ error: 'unavailable', repo: repo(), why: String(e?.message || e).slice(0, 60) }));
  }
}

export { repo as _repo };
