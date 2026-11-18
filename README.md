# GTA VI Tracker (GTA 6 / Grand Theft Auto VI)

> Queres ir direto ao assunto? Abre o **COMECA-AQUI.md**.

Site que mostra quantas pessoas estão a ver GTA VI na **Twitch, na Kick e no YouTube**. Tem três vistas (mundo, Portugal e em português), duas línguas (PT e EN), previsões, recordes e imagens prontas para o LinkedIn.
Feito por Duarte Rodrigues.

## Como funciona

```
GitHub Actions (de hora a hora) ──► guarda o histórico no repositório ──► Vercel publica o site
                                                                          │
                     visitantes ◄── /api/live (Twitch + Kick, a cada 2 min) ┘
```

- **O teu computador pode estar desligado.** Tudo corre nos servidores do GitHub e do Vercel.
- **As chaves nunca chegam ao browser.** Ficam nos *Secrets* do GitHub e nas *Environment Variables* do Vercel. O site só recebe números já somados.
- **As APIs não vão abaixo.** O YouTube só é consultado pelo GitHub, de hora a hora. A Twitch e a Kick passam por uma cache de 2 minutos, por isso recebem cerca de um pedido a cada 2 minutos, haja 10 ou 100 000 visitantes.
- **Custo: 0 €.**

---

# Passo a passo para pôr o site online (cerca de 25 minutos)

## 1. Criar as chaves das plataformas

### YouTube
1. Abre https://console.cloud.google.com, clica no seletor de projetos no topo, depois **New project**, dá-lhe o nome `gta6-tracker` e clica **Create**.
2. Vai a **APIs & Services → Library**, procura **YouTube Data API v3** e clica **Enable**.
3. Vai a **APIs & Services → Credentials → + Create credentials → API key** e copia a chave.
4. Recomendado: clica na chave e, em *API restrictions*, escolhe **Restrict key → YouTube Data API v3**. Guarda.

### Twitch
A conta Twitch precisa de ter a autenticação de dois fatores ligada (*Settings → Security*).
1. Abre https://dev.twitch.tv/console/apps e clica **Register Your Application**.
2. Preenche assim:
   - **Name:** `gta6-tracker-duarte`
   - **OAuth Redirect URLs:** `http://localhost`
   - **Category:** Analytics Tool
   - **Client Type:** Confidential
3. Clica **Create** e depois **Manage**. Copia o **Client ID**, carrega em **New Secret** e copia o **Client Secret**.

### Kick
1. Com sessão iniciada na Kick, abre https://kick.com/settings/developer e cria uma app.
2. **Redirect URL:** `http://localhost`. Não precisas de marcar nenhum *scope*.
3. Copia o **Client ID** e o **Client Secret**.

> Se não quiseres uma das plataformas, salta-a. O site funciona com as que tiveres.

## 2. Pôr o código no GitHub

1. Cria uma conta em https://github.com, se ainda não tiveres.
2. Abre https://github.com/new e preenche:
   - **Repository name:** `gta6-tracker`
   - Marca **Private**.
   - Clica **Create repository**.
3. Na página que aparece, clica em **uploading an existing file**.
4. Descompacta o zip e arrasta **o conteúdo** da pasta `gta6` (não a pasta em si) para a página. Depois clica **Commit changes**.
   - **A pasta `.github` é obrigatória.** No Mac está escondida: no Finder, carrega em `Cmd + Shift + .` para a veres. No Windows, ativa *Ver → Itens ocultos*.
   - Para confirmar, no repositório tem de existir o ficheiro `.github/workflows/collect.yml`. Se não existir, cria-o: **Add file → Create new file**, escreve esse nome e cola o conteúdo do ficheiro que está no zip.
5. Vai a **Settings → Secrets and variables → Actions → New repository secret** e cria estes cinco secrets, um de cada vez:

   | Name | Secret |
   |---|---|
   | `YOUTUBE_API_KEY` | a chave do YouTube |
   | `TWITCH_CLIENT_ID` | o Client ID da Twitch |
   | `TWITCH_CLIENT_SECRET` | o Client Secret da Twitch |
   | `KICK_CLIENT_ID` | o Client ID da Kick |
   | `KICK_CLIENT_SECRET` | o Client Secret da Kick |

6. Vai ao separador **Actions**. Se aparecer um aviso, clica para ativar os workflows. Depois:
   1. clica **Recolha horária GTA VI** à esquerda;
   2. clica **Run workflow** e outra vez **Run workflow**;
   3. espera cerca de 1 minuto até aparecer um ✓ verde.

   Se aparecer um ✗ vermelho, clica nele e abre o passo **Recolher dados**: diz qual plataforma falhou e porquê (ver "Problemas comuns" no fim).

A partir daqui a recolha corre sozinha de hora a hora.

## 3. Publicar no Vercel

1. Abre https://vercel.com/signup e entra com **Continue with GitHub**.
2. Clica **Add New… → Project**. Se o `gta6-tracker` não aparecer, clica **Adjust GitHub App Permissions** e dá acesso a esse repositório.
3. Clica **Import** ao lado de `gta6-tracker`.
4. Em **Framework Preset** escolhe **Other** e não mexas em mais nada. O `vercel.json` já trata do resto.
5. Abre **Environment Variables** e adiciona estas quatro variáveis. O YouTube não é preciso aqui.
   `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`
6. Clica **Deploy**. Ao fim de cerca de 1 minuto tens um link do tipo `https://gta6-tracker-xxxx.vercel.app`.

### Confirmar que está tudo bem
- Abre `https://<o-teu-link>/api/live`. Deves ver números da Twitch e da Kick, e `"errors": []`.
- No site, o ponto ao lado de "Ao vivo" deve estar cor-de-rosa.

### Extras no Vercel (opcionais)
- **Estatísticas de visitas:** abre o projeto no Vercel, vai a **Analytics → Enable**. O código já está no site.
- **Domínio próprio:** em **Settings → Domains**, adiciona por exemplo `gta6.duarterodrigues.pt` e segue as instruções de DNS.

## 4. Pôr o teu link da Instant Gaming

1. No GitHub, abre o ficheiro `public/config.js` e clica no lápis (✏️).
2. Substitui `https://www.instant-gaming.com/?igr=COLOCA_AQUI` pelo teu link de afiliado. Encontras esse link na tua conta Instant Gaming, na secção de parceria/afiliação.
3. Clica **Commit changes**. O Vercel publica a alteração em cerca de 1 minuto.

O anúncio aparece a seguir aos números principais, identificado como "Publicidade, link de afiliado". Enquanto o link tiver `COLOCA_AQUI`, o anúncio fica escondido.

---

## O que podes mudar em `public/config.js`

| Campo | Para que serve |
|---|---|
| `author`, `authorUrl` | O teu nome e o teu LinkedIn, que aparecem no site, nas imagens, no PDF e no widget. |
| `publicDownloads` | Se for `false`, o botão "Descarregar" só aparece se abrires o site com `?owner=1` no fim do link. |
| `launch` | Hora do lançamento, em UTC. Se a mudares, muda também `LAUNCH` em `scripts/collect.js`. |
| `sponsor.url` | O teu link da Instant Gaming. |
| `trendsKeyword` | O termo que o Google Trends compara. |

Para afinar a vista **Portugal**, acrescenta os logins dos streamers portugueses que conheces ao ficheiro `portugal.js`.

## O que o site tem

| Secção | Fonte | Atualização |
|---|---|---|
| Frase principal e números de agora, por plataforma | Twitch, Kick e YouTube | 2 min (Twitch e Kick), 1 h (YouTube) |
| Gráfico ao longo do tempo, com filtro de 24 h, 48 h, 7 dias, 1 mês ou tudo | histórico | 1 h |
| Previsão para as próximas 24 h, e "Acertámos?" | histórico | 1 h |
| Quanto pesa o GTA VI na Twitch (1000 maiores streams) e na Kick (100 maiores) | Twitch e Kick | 1 h |
| Espectadores por stream | histórico | 1 h |
| A que horas se vê mais (mapa de calor) e fatia de cada plataforma | histórico | 1 h |
| Clips mais vistos nas últimas 24 h | Twitch | 1 h |
| Recordes por streamer e maratonas | todas | 1 h |
| As primeiras 24 horas, com imagem própria | histórico | ativa-se no lançamento |
| Mapa por língua e Google Trends | Twitch, Kick e Google | 1 h / tempo real |
| Vídeos novos no YouTube | YouTube | 3 h |

**Partilhar:** o botão "Descarregar" gera uma imagem 1080×1350 para o LinkedIn, sempre com o teu nome. Também há a opção "Guardar em PDF".
**Links diretos:** podes partilhar uma vista específica, por exemplo `?lang=en&scope=portugal&range=48`.
**Incorporar:** o botão "Incorporar no teu site" dá um `<iframe>` que mostra os números ao vivo, com crédito.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| "kick: sem dados de momento", com "categoria não encontrada" | Antes do lançamento pode ainda não haver streams na categoria, e isto resolve-se sozinho. Se continuar depois do dia 19: abre `kick.com/category/grand-theft-auto-vi`, prime F12, vai ao separador *Network*, recarrega a página e procura `"id"` nas respostas da categoria. Cria `KICK_CATEGORY_ID` com esse número no GitHub (Secrets) e no Vercel (Environment Variables). |
| "youtube", com "quota" | A quota grátis é de 10 000 unidades por dia e o tracker usa cerca de 8 500. Evita carregar em "Run workflow" muitas vezes seguidas. A quota reinicia por volta das 08:00 de Lisboa. |
| "Os dados estão atrasados" | O GitHub às vezes atrasa os agendamentos. Se passar das 3 horas, vê o separador Actions. |
| Twitch com "401" | O Client Secret está errado ou foi regenerado. Atualiza-o no GitHub e no Vercel e, no Vercel, vai a **Deployments → ⋯ → Redeploy**. |
| O ponto "Ao vivo" fica cinzento | Faltam as Environment Variables no Vercel, ou foram adicionadas depois do deploy. Nesse caso, faz **Redeploy**. |

## Testar no teu computador (opcional)

Precisas de Node 22.
1. Copia `.env.example` para `.env` e preenche as chaves.
2. Corre um destes comandos:
   - `npm run check` testa as chaves;
   - `npm run dev` abre o site em http://localhost:3000;
   - `npm test` corre os testes automáticos.

Para ver o site com dados inventados: `MOCK=1 npm run mock && MOCK=1 npm run dev`. **Não faças commit** desses dados.

## Segurança

O que foi verificado e está protegido (e coberto por testes automáticos em `test/security.test.js`):

| Risco | Proteção |
|---|---|
| Fuga das chaves | As chaves só existem nos Secrets do GitHub e nas Environment Variables do Vercel; nunca vão para o browser nem para o repositório (`.env` está no `.gitignore`). O segredo da Twitch é enviado no corpo do pedido, nunca no URL, para não ficar em logs. Um teste falha se encontrar uma chave no código. |
| Injeção de código (XSS) a partir de títulos/nomes de streams | Todo o texto vindo das plataformas é escapado antes de ser mostrado; tooltips usam só texto. Ligações e imagens só são aceites se forem `https://` dos domínios oficiais (Twitch, Kick, YouTube); tudo o resto é descartado. |
| Scripts maliciosos / CDN comprometida | Não há scripts de terceiros: Chart.js, D3, o mapa, a biblioteca de imagens e as letras estão **dentro do projeto** (`public/vendor`, `public/fonts`). Não há código inline. |
| Content Security Policy | `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`, imagens só dos domínios das plataformas, iframes só do Google Trends (em sandbox). |
| Clickjacking | O site não pode ser metido num iframe por outros sites (`frame-ancestors 'self'`, `X-Frame-Options`). Só o widget `embed.html` é incorporável, por design. |
| Outros cabeçalhos | HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (câmara, micro, localização desligados), `Cross-Origin-Opener-Policy`. |
| Abuso da API `/api/live` | Só aceita GET/HEAD (405 para o resto), não recebe parâmetros, responde só números agregados, com cache de 2 min na CDN e reaproveitamento em memória → não é possível usá-la para gastar as tuas quotas. |
| Cadeia de fornecimento no GitHub Actions | As actions estão fixadas por *commit* (não por etiqueta), o workflow não reage a pull requests nem a comentários e só tem permissão para escrever no próprio repositório. |
| Link do anúncio | Só é aceite se for `https://` de `instant-gaming.com`; abre com `rel="sponsored noopener noreferrer"`. |
| Dependências | Zero dependências npm em produção (nada para ficar desatualizado). |

Recomendações para ti: mantém o repositório **privado**, ativa a autenticação de dois fatores no GitHub, no Vercel, na Twitch, na Kick e na Google, e restringe a chave do YouTube à "YouTube Data API v3" (passo 1).

## Ficheiros

```
.github/workflows/collect.yml   recolha de hora a hora (GitHub Actions)
api/live.js                     números ao vivo da Twitch e da Kick (servidor Vercel)
lib/platforms.js                ligação às APIs da Twitch, Kick e YouTube
scripts/collect.js              guarda o histórico, os recordes e as previsões
scripts/build.js                põe o endereço do site na pré-visualização do LinkedIn
scripts/check.js, dev.js, mock.js   ferramentas para testar
portugal.js                     lista de streamers portugueses e palavras-chave
public/index.html               o site (só HTML/CSS)
public/app.js                   lógica principal do site
public/extras.js                secções extra (recordes, mapa, clips…)
public/embed.js                 lógica do widget
public/vendor/                  Chart.js, D3, mapa-mundo, html-to-image (cópias locais + licenças)
public/fonts/                   letras Inter e Space Grotesk (licença OFL)
public/robots.txt               indicações para motores de busca (o sitemap é gerado no deploy)
public/forecast.js              modelo de previsão
public/config.js                ⚙️ configuração (autor, anúncio, data)
public/embed.html               widget para outros sites
public/robots.txt               autoriza os motores de pesquisa
public/og.png                   imagem da pré-visualização no LinkedIn
public/data/                    histórico (preenchido automaticamente)
test/                           testes automáticos (lógica, API e segurança)
COMECA-AQUI.md                  checklist curta para pôr tudo online
```
