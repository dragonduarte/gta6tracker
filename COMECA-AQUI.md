# Começa aqui: GTA VI Live Tracker

Lista curta para pôr o site no ar. Os detalhes de cada passo estão no `README.md`.

## Checklist (cerca de 25 min)

### 1. Chaves
- [ ] **YouTube:** em console.cloud.google.com, cria um projeto, ativa a **YouTube Data API v3** e cria uma **API key**.
- [ ] **Twitch:** em dev.twitch.tv/console/apps, cria uma app com o redirect `http://localhost` e o tipo **Confidential**. Copia o **Client ID** e o **Client Secret**.
- [ ] **Kick:** em kick.com/settings/developer, cria uma app com o redirect `http://localhost`. Copia o **Client ID** e o **Client Secret**.

### 2. GitHub
- [ ] Cria um repositório **privado** chamado `gta6-tracker`.
- [ ] Faz upload do **conteúdo** desta pasta, incluindo a pasta escondida `.github`. No Mac, carrega em `Cmd+Shift+.` para a veres.
- [ ] Em **Settings → Secrets and variables → Actions**, cria estes secrets:
  - `YOUTUBE_API_KEY`
  - `TWITCH_CLIENT_ID`
  - `TWITCH_CLIENT_SECRET`
  - `KICK_CLIENT_ID`
  - `KICK_CLIENT_SECRET`
- [ ] Em **Actions → Recolha horária GTA VI**, carrega em **Run workflow** e espera pelo ✓ verde.

### 3. Vercel
- [ ] Entra em vercel.com com a conta GitHub e vai a **Add New → Project → Import gta6-tracker**.
- [ ] Em **Framework Preset**, escolhe **Other**.
- [ ] Em **Environment Variables**, adiciona `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `KICK_CLIENT_ID` e `KICK_CLIENT_SECRET`.
- [ ] Carrega em **Deploy**.
- [ ] Abre `https://o-teu-link.vercel.app/api/live` e confirma que aparece `"errors": []`.
- [ ] Ativa as estatísticas em **Analytics → Enable**.

### 4. Personalizar (no GitHub, ficheiro `public/config.js`)
- [ ] `sponsor.url`: o teu link da Instant Gaming, no lugar de `COLOCA_AQUI`.
- [ ] Confirma o `author` e o `authorUrl`.
- [ ] Opcional: acrescenta streamers portugueses ao `portugal.js`.

## Palavras-chave cobertas
GTA VI, GTA 6, GTA6, Grand Theft Auto VI e Grand Theft Auto 6. São usadas na pesquisa do YouTube, na deteção da categoria na Twitch e na Kick, e no SEO do site (título, descrição, keywords, dados estruturados e pré-visualização no LinkedIn e no X).

## Links úteis depois de publicar
- Site: `https://o-teu-link.vercel.app`
- Vista Portugal em inglês: `https://o-teu-link.vercel.app/?scope=portugal&lang=en`
- Últimas 48 h: `https://o-teu-link.vercel.app/?range=48`
- Imagem para o LinkedIn: botão **Descarregar** no topo do site
