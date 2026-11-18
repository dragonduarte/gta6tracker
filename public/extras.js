/* =====================================================================
   Extras do dashboard: patrocínio, domínio, concentração, quota no tempo,
   mapa de calor, clips, Hall of Fame, maratonas, primeiras 24 h, mapa por
   língua, Google Trends e widget incorporável.
   Usa as funções e o estado globais definidos em index.html.
   ===================================================================== */
(function () {
  const EX = {
    pt: {
      ad_note: 'link de afiliado',
      ad_title: 'Compra aqui os teus jogos mais baratos',
      ad_text: 'GTA VI e outros jogos para PS5, Xbox e PC, com desconto na Instant Gaming.', ad_cta: 'Ver preços',
      games_h2: 'GTA VI vs outros jogos', games_tw: 'Twitch: os jogos mais vistos agora', games_tw_sub: 'Espectadores somados de todas as streams de cada jogo. Sem Just Chatting e outras categorias que não são jogos.',
      games_kk: 'Kick: os jogos mais vistos agora', games_kk_sub: 'Nas 100 maiores streams da Kick (limite da API pública), por jogo.',
      games_rank: 'Lugar entre os jogos na Twitch', games_vs: (x, n) => `${x} o 2º lugar (${n})`, games_vs_lbl: 'Comparado com o 2º jogo', games_vs_lbl2: 'Comparado com o 1º jogo', games_behind: (x, n) => `${x} do 1º lugar (${n})`,
      games_share: 'dos espectadores das 1000 maiores streams da Twitch', games_wait: 'A comparação aparece depois da primeira recolha.',
      games_insight: (r, x, n) => r === 1 ? `Na Twitch, o GTA VI é agora o <b>jogo mais visto</b>, com <b>${x}</b> o público do 2º lugar, ${n}.` : `Na Twitch, o GTA VI está agora em <b>${r}º lugar</b> entre os jogos. Tem ${x} do público do líder, ${n}.`,
      times: (v) => `${v}×`, more: 'mais que',
      dom_title: 'Quanto pesa o GTA VI em cada plataforma', dom_sub: 'Peso do GTA VI entre as maiores streams de cada plataforma, de todas as categorias',
      dom_tw_big: 'dos espectadores das 1000 maiores streams da Twitch', dom_kk_big: 'dos espectadores das 100 maiores streams da Kick',
      dom_top100: (n, of) => `${n} das ${of} maiores streams`, dom_top10: (n) => `${n} das 10 maiores`,
      dom_chart: 'Quota do GTA VI nas 1000 maiores streams da Twitch', dom_wait: 'A aguardar a primeira recolha horária.',
      conc_title: 'Espectadores por stream', conc_sub: 'Média de espectadores por stream. Quanto mais alta, mais o público está concentrado em poucos canais grandes.',
      conc_avg: 'média por stream', conc_top10: 'nas 10 maiores streams',
      share_t_title: 'A fatia de cada plataforma', share_t_sub: 'Percentagem dos espectadores, hora a hora',
      heat_title: 'Quando é que se vê mais GTA VI?', heat_sub: 'Espectadores por hora do dia, na tua hora local. Mais claro, mais gente.', heat_less: 'menos', heat_more: 'mais',
      clips_title: '🎬 Os clips mais vistos', clips_sub: 'Clips de GTA VI mais vistos na Twitch nas últimas 24 h', clips_sub_pt: 'Clips em português mais vistos na Twitch nas últimas 24 h', clips_empty: 'Ainda sem clips nesta vista.',
      hall_title: '🏆 Recordes por streamer', hall_sub: 'O maior número de pessoas que cada streamer teve a ver ao mesmo tempo', hall_all: 'Desde sempre', hall_24: 'Primeiras 24 h', hall_empty: 'Ainda sem recordes nesta vista.',
      mara_title: '⏳ Maratonas', mara_sub: 'As streams que estão no ar há mais tempo', mara_empty: 'Sem maratonas nesta vista.', live_for: 'no ar há',
      f24_title: '⏱️ As primeiras 24 horas', f24_sub: 'Resumo automático do dia de lançamento',
      f24_wait: (d) => `Disponível a partir de ${d}. Até lá, o dashboard vai guardando tudo.`, f24_partial: 'ainda a decorrer, atualiza de hora a hora',
      f24_peak: 'Pico de espectadores', f24_hours: 'Horas assistidas', f24_avg: 'Média de espectadores', f24_streams: 'Pico de streams', f24_peak_at: 'Hora de pico', f24_top: 'Maiores picos individuais', f24_img: 'Descarregar imagem das 24 h',
      sc24_eyebrow: 'As primeiras 24 horas', sc24_peak: 'pico de espectadores em simultâneo no dia 1',
      map_title: 'Mapa por língua', map_sub: 'Espectadores na Twitch e na Kick pela língua da stream. Cada língua pinta os países onde é falada, por isso não é a localização real de quem vê.', map_loading: 'A carregar mapa…', map_fail: 'Não foi possível carregar o mapa.',
      trends_title: 'Interesse no Google', trends_sub: { global: 'Pesquisas por "{k}" no mundo, últimos 90 dias (0–100, relativo)', portugal: 'Pesquisas por "{k}" em Portugal, últimos 90 dias (0–100, relativo)', luso: 'Pesquisas por "{k}": Portugal vs Brasil, últimos 90 dias (0–100, relativo)' }, trends_open: 'Abrir no Google Trends',
      embed_title: 'Incorporar no teu site', embed_text: 'Copia este código para o teu site, blog ou Notion. Mostra os números ao vivo e indica a fonte.', copy: 'Copiar código', copied: 'Copiado', close: 'Fechar',
      viewers: 'espectadores', views: 'visualizações',
    },
    en: {
      ad_note: 'affiliate link',
      ad_title: 'Buy your games cheaper here',
      ad_text: 'GTA VI and other PS5, Xbox and PC games, discounted on Instant Gaming.', ad_cta: 'See prices',
      games_h2: 'GTA VI vs other games', games_tw: 'Twitch: most-watched games right now', games_tw_sub: 'Viewers summed across every stream of each game. Just Chatting and other non-game categories are left out.',
      games_kk: 'Kick: most-watched games right now', games_kk_sub: "Across Kick's 100 biggest streams (the public API's limit), by game.",
      games_rank: 'Rank among games on Twitch', games_vs: (x, n) => `${x} the #2 game (${n})`, games_vs_lbl: 'Against the #2 game', games_vs_lbl2: 'Against the #1 game', games_behind: (x, n) => `${x} of the #1 game (${n})`,
      games_share: "of viewers across Twitch's 1,000 biggest streams", games_wait: 'The comparison appears after the first snapshot.',
      games_insight: (r, x, n) => r === 1 ? `On Twitch, GTA VI is now the <b>most-watched game</b>, with <b>${x}</b> the audience of #2, ${n}.` : `On Twitch, GTA VI is now <b>#${r}</b> among games, with ${x} of the leader's audience, ${n}.`,
      times: (v) => `${v}×`, more: 'more than',
      dom_title: 'How much GTA VI weighs on each platform', dom_sub: "GTA VI's weight among each platform's biggest streams, across all categories",
      dom_tw_big: "of viewers across Twitch's 1,000 biggest streams", dom_kk_big: "of viewers across Kick's 100 biggest streams",
      dom_top100: (n, of) => `${n} of the top ${of} streams`, dom_top10: (n) => `${n} of the top 10`,
      dom_chart: "GTA VI share of Twitch's 1,000 biggest streams", dom_wait: 'Waiting for the first hourly snapshot.',
      conc_title: 'Viewers per stream', conc_sub: 'Average viewers per stream. The higher it is, the more the audience is concentrated in a few big channels.',
      conc_avg: 'avg per stream', conc_top10: 'on the 10 biggest streams',
      share_t_title: 'Each platform\'s slice', share_t_sub: 'Share of viewers, hour by hour',
      heat_title: 'When do people watch GTA VI?', heat_sub: 'Viewers by hour of day, in your local time. Lighter means more people.', heat_less: 'less', heat_more: 'more',
      clips_title: '🎬 The most-watched clips', clips_sub: 'Most-viewed GTA VI clips on Twitch in the last 24 h', clips_sub_pt: 'Most-viewed Portuguese-language clips on Twitch, last 24 h', clips_empty: 'No clips in this view yet.',
      hall_title: '🏆 Records by streamer', hall_sub: 'The most people each streamer has had watching at once', hall_all: 'All time', hall_24: 'First 24 h', hall_empty: 'No records in this view yet.',
      mara_title: '⏳ Marathons', mara_sub: 'The streams that have been live the longest', mara_empty: 'No marathons in this view.', live_for: 'live for',
      f24_title: '⏱️ The first 24 hours', f24_sub: 'Automatic launch-day summary',
      f24_wait: (d) => `Available from ${d}. Until then, the dashboard keeps recording.`, f24_partial: 'still in progress, updates hourly',
      f24_peak: 'Peak viewers', f24_hours: 'Hours watched', f24_avg: 'Average viewers', f24_streams: 'Peak streams', f24_peak_at: 'Peak hour', f24_top: 'Biggest individual peaks', f24_img: 'Download 24 h image',
      sc24_eyebrow: 'The first 24 hours', sc24_peak: 'peak concurrent viewers on day one',
      map_title: 'Map by language', map_sub: 'Twitch and Kick viewers by stream language. Each language colours the countries where it is spoken, so it is not where viewers actually are.', map_loading: 'Loading map…', map_fail: 'Could not load the map.',
      trends_title: 'Google interest', trends_sub: { global: 'Searches for "{k}" worldwide, last 90 days (0–100, relative)', portugal: 'Searches for "{k}" in Portugal, last 90 days (0–100, relative)', luso: 'Searches for "{k}": Portugal vs Brazil, last 90 days (0–100, relative)' }, trends_open: 'Open in Google Trends',
      embed_title: 'Embed on your site', embed_text: 'Copy this code into your site, blog or Notion. It shows live numbers and credits the source.', copy: 'Copy code', copied: 'Copied', close: 'Close',
      viewers: 'viewers', views: 'views',
    },
  };
  const X = (k) => { const v = EX[S.lang][k]; return v && typeof v === 'object' && !Array.isArray(v) ? v[S.scope] : v; };
  const CFG = window.SITE_CONFIG || {};
  const SEQ = ['#0d366b', '#104281', '#1c5cab', '#2a78d6', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb']; // rampa sequencial (azul), escuro → claro no fundo escuro
  // hora local de quem está a ver (o servidor guarda tudo em UTC)
  const lisbonHour = (ts) => new Date(ts).getHours();
  const lisbonDay = (ts) => new Intl.DateTimeFormat('en-CA').format(new Date(ts));
  const durFmt = (ms) => { const m = Math.max(0, ms / 60e3); return m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.floor(m % 60)).padStart(2, '0')}` : `${Math.floor(m)} min`; };
  const scopeFilter = (r) => S.scope === 'global' ? true : S.scope === 'luso' ? r.lang === 'pt' : !!r.portugal;

  /* ---------------------------------------------------------------- estilos */
  const style = document.createElement('style');
  style.textContent = `
  .ad { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 18px; padding: 16px 20px; border-radius: var(--radius); text-decoration: none; color: inherit; margin-top: 8px;
    background: linear-gradient(var(--surface-1), var(--surface-1)) padding-box, linear-gradient(110deg, var(--sun-1), var(--sun-2), var(--sun-3)) border-box; border: 1px solid transparent; }
  .ad:hover { filter: brightness(1.06); }
  .ad .ad-ico { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: #ff5400; color: #fff; font-weight: 800; font-size: 15px; font-stretch: 75%; }
  .ad .ad-t { font-weight: 650; font-size: 17px; } .ad .ad-s { color: var(--text-secondary); font-size: 14.5px; }
  .ad .ad-tag { font-size: 11px; color: var(--text-muted); display: block; text-align: center; margin-top: 5px; }
  .ad .ad-end { display: flex; flex-direction: column; align-items: center; }
  .grid2.even { grid-template-columns: 1fr 1fr; }
  .chart.games { height: 340px; }
  .stats3 .big-stat { font-size: 44px; margin-top: 10px; }
  .sub-h { font-family: var(--font-display); font-size: 20px; margin: 28px 0 0; letter-spacing: -.01em; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .big-stat { font-family: var(--font-display); font-weight: 700; font-size: 48px; letter-spacing: -.03em; line-height: 1; margin-top: 8px; }
  .stat-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .mini-plats { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }
  .mini-plats .mp { display: grid; grid-template-columns: 84px 1fr auto; gap: 10px; align-items: center; font-size: 14.5px; }
  .mini-plats .bar { height: 8px; border-radius: 2px; background: var(--surface-2); overflow: hidden; }
  .mini-plats .bar i { display: block; height: 100%; }
  .heat { display: grid; gap: 2px; font-size: 12px; color: var(--text-muted); }
  .heat .c { height: 18px; border-radius: 2px; background: var(--surface-2); }
  .heat .c:hover { outline: 2px solid var(--text-primary); z-index: 1; position: relative; }
  .heat .lbl { display: flex; align-items: center; white-space: nowrap; overflow: hidden; }
  .heat-legend { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-muted); margin-top: 12px; }
  .heat-legend i { width: 18px; height: 10px; border-radius: 2px; display: inline-block; }
  .tip { position: fixed; pointer-events: none; z-index: 60; background: #0a0910; border: 1px solid var(--border); color: var(--text-primary); border-radius: 10px; padding: 7px 10px; font-size: 13px; display: none; }
  .clips { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .clip { text-decoration: none; display: block; }
  .clip .th { aspect-ratio: 16/9; border-radius: 10px; background: linear-gradient(135deg, #2a1f3d, #1f1c29) center/cover no-repeat; border: 1px solid var(--border); position: relative; display: grid; place-items: center; font-size: 30px; }
  .clip .th b, .clip .th em { position: absolute; bottom: 6px; background: rgba(0,0,0,.75); color: #fff; font-size: 12.5px; padding: 1px 6px; border-radius: 4px; font-style: normal; font-weight: 600; }
  .clip .th b { right: 6px; } .clip .th em { left: 6px; font-weight: 400; }
  .clip .vt { font-weight: 600; font-size: 14.5px; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .clip .vc { color: var(--text-muted); font-size: 13.5px; }
  .f24 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
  .map-wrap svg { width: 100%; height: auto; display: block; }
  .map-wrap path.country { stroke: var(--surface-1); stroke-width: .6; }
  .map-wrap path.country:hover { stroke: var(--text-primary); stroke-width: 1.2; }
  .trends { width: 100%; height: 380px; border: 0; border-radius: 10px; background: #fff; }
  .embed-code { width: 100%; min-height: 96px; background: var(--surface-2); color: var(--text-primary); border: 1px solid var(--border); border-radius: 6px; padding: 12px; font: 13px/1.5 ui-monospace, Menlo, monospace; resize: vertical; }
  .embed-box { background: var(--surface-1); border: 1px solid var(--border); border-radius: 18px; padding: 22px; width: min(720px, 92vw); display: flex; flex-direction: column; gap: 12px; }
  @media (max-width: 1000px) { .grid3 { grid-template-columns: 1fr; } .grid2.even { grid-template-columns: 1fr; } .stats3 { grid-template-columns: repeat(3, 1fr); } .stats3 .big-stat { font-size: 30px; } .f24 { grid-template-columns: repeat(2, 1fr); } .clips { grid-template-columns: repeat(2, 1fr); } .ad { grid-template-columns: auto 1fr; } .ad .btn { grid-column: 1 / -1; } }
  @media (max-width: 560px) { .stats3 { grid-template-columns: 1fr; } .clips { grid-template-columns: 1fr; } .heat { font-size: 10px; } }
  @media print { .ad, #trendsCard { display: none !important; } .grid3 { grid-template-columns: repeat(3, 1fr) !important; } .f24 { grid-template-columns: repeat(5, 1fr) !important; } .clips { grid-template-columns: repeat(4, 1fr) !important; } }
  `;
  document.head.appendChild(style);

  const tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip);
  const showTip = (e, text) => { tip.textContent = text; tip.style.display = 'block'; const x = Math.min(innerWidth - tip.offsetWidth - 12, e.clientX + 14); tip.style.left = x + 'px'; tip.style.top = (e.clientY + 14) + 'px'; };
  const hideTip = () => { tip.style.display = 'none'; };

  /* ------------------------------------------------------------ esqueleto */
  const mount = (id, html) => { const el = document.getElementById(id); if (el) el.outerHTML = html; };
  mount('mountGames', `
  <section id="jogos">
    <h2 id="gamesH2"></h2><p class="insight" id="gamesInsight"></p>
    <div class="grid3 stats3">
      <div class="panel"><div class="desc" id="gRankL" style="margin:0"></div><div class="big-stat tnum" id="gRank">—</div></div>
      <div class="panel"><div class="desc" id="gVsL" style="margin:0"></div><div class="big-stat tnum" id="gVs">—</div><div class="desc" id="gVsS" style="margin:6px 0 0"></div></div>
      <div class="panel"><div class="desc" style="margin:0">Twitch</div><div class="big-stat tnum" id="domTw">—</div><div class="desc" id="domTwL" style="margin:6px 0 0"></div></div>
    </div>
    <div class="grid2 even" style="margin-top:12px">
      <div class="panel"><h3 id="gTwT"></h3><div class="desc" id="gTwS"></div><div class="chart games"><canvas id="gamesTw"></canvas></div></div>
      <div class="panel"><h3 id="gKkT"></h3><div class="desc" id="gKkS"></div><div class="chart games"><canvas id="gamesKk"></canvas></div></div>
    </div>
    <div class="panel" style="margin-top:12px"><h3 id="domChartT"></h3><div class="desc" id="domChartS"></div><div class="chart sm"><canvas id="domChart"></canvas></div></div>
  </section>`);

  mount('mountStreamers', `
  <section id="streamers">
    <h2 id="hallH2"></h2><p class="insight" id="hallInsight"></p>
    <div class="grid2 even">
      <div class="panel">
        <div class="card-head"><div><h3 id="hallT"></h3><div class="desc" id="hallS"></div></div>
          <div class="seg" id="hallSeg"><button data-h="all"></button><button data-h="first24"></button></div></div>
        <div class="board" id="hall"></div>
      </div>
      <div class="panel"><h3 id="maraT"></h3><div class="desc" id="maraS"></div><div class="board" id="mara"></div></div>
    </div>
    <h3 class="sub-h" id="clipsT"></h3><p class="insight" id="clipsS"></p>
    <div class="clips" id="clips"></div>
  </section>`);

  mount('mountF24', `
  <section id="secF24" hidden>
    <div class="card-head" style="align-items:flex-end"><h2 id="f24T"></h2><button class="btn" id="f24Btn"></button></div>
    <p class="insight" id="f24S"></p>
    <div id="f24"></div>
  </section>`);

  mount('mountMore', `
  <section id="mais">
    <h2 id="moreH2"></h2><p class="insight" id="heatInsight"></p>
    <div class="grid2">
      <div class="panel"><h3 id="heatS2"></h3><div class="desc" id="heatS"></div><div class="heat" id="heat"></div><div class="heat-legend" id="heatLegend"></div></div>
      <div class="panel"><h3 id="langT"></h3><div class="desc" id="langS"></div><div class="chart sm"><canvas id="langChart"></canvas></div></div>
    </div>
    <p class="insight" id="mapInsight" style="margin-top:18px"></p>
    <div class="grid2">
      <div class="panel"><h3 id="mapT"></h3><div class="desc" id="mapS"></div><div class="map-wrap" id="map"></div><div class="heat-legend" id="mapLegend"></div></div>
      <div class="panel" id="trendsCard"><div class="card-head"><div><h3 id="trT"></h3><div class="desc" id="trS"></div></div><a class="btn ghost" id="trOpen" target="_blank" rel="noopener"></a></div><div id="trends"></div></div>
    </div>
  </section>`);

  document.getElementById('hallSeg').onclick = (e) => { const b = e.target.closest('button'); if (b) { S.hallMode = b.dataset.h; renderHall(); } };
  S.hallMode = S.hallMode || 'all';

  /* ------------------------------------------------------------ patrocínio */
  function renderSponsor() {
    const sp = CFG.sponsor || {};
    const spUrl = (() => { try { const u = new URL(sp.url); return u.protocol === 'https:' && /(^|\.)instant-gaming\.com$/.test(u.hostname) ? u.href : null; } catch { return null; } })();
    const ok = spUrl && !/COLOCA_AQUI/.test(spUrl);
    const box = document.getElementById('sponsorTop');
    if (!ok) { box.innerHTML = ''; return; }
    box.innerHTML = `<a class="ad" href="${esc(spUrl)}" target="_blank" rel="sponsored noopener noreferrer">
      <span class="ad-ico">IG</span>
      <span><span class="ad-t">${X('ad_title')}</span><br><span class="ad-s">${X('ad_text')}</span></span>
      <span class="ad-end"><span class="btn">${X('ad_cta')}</span><span class="ad-tag">${X('ad_note')}</span></span></a>`;
  }

  /* --------------------------------------------- GTA VI vs outros jogos */
  const lastWith = (p, f) => [...points()].reverse().find((x) => x[p]?.[f] != null)?.[p];
  const OTHER = '#4b4659';
  function gamesChart(id, list) {
    const rows = (list || []).slice(0, 10);
    const name = (g) => (g.gta ? 'GTA VI' : g.name.length > 26 ? g.name.slice(0, 25) + '…' : g.name);
    return mkOrUpdate(id, {
      type: 'bar',
      plugins: [{ id: 'vals', afterDatasetsDraw(ch) {
        const g = ch.ctx, meta = ch.getDatasetMeta(0);
        g.save(); g.font = `600 12px ${css('--sans')}`; g.textBaseline = 'middle';
        meta.data.forEach((bar, i) => { g.fillStyle = rows[i]?.gta ? css('--text-primary') : css('--text-secondary'); g.fillText(fmtC(rows[i].viewers), bar.x + 6, bar.y); });
        g.restore();
      } }],
      data: { labels: rows.map(name), datasets: [{ data: rows.map((g) => g.viewers), backgroundColor: rows.map((g) => (g.gta ? css('--sun-1') : OTHER)), borderRadius: 4, borderSkipped: 'start', barPercentage: .78, categoryPercentage: .9 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, layout: { padding: { right: 48 } },
        plugins: { tooltip: { callbacks: { label: (c) => ` ${fmt(rows[c.dataIndex].viewers)} ${X('viewers')} · ${fmt(rows[c.dataIndex].streams)} streams` } } },
        scales: { x: { beginAtZero: true, border: { display: false }, grid: { color: css('--grid') }, ticks: { callback: (v) => fmtC(v), maxTicksLimit: 5 } },
                  y: { grid: { display: false }, ticks: { color: (c) => (rows[c.index]?.gta ? css('--text-primary') : css('--text-secondary')), font: (c) => ({ weight: rows[c.index]?.gta ? '700' : '400' }) } } } },
    });
  }
  function renderGames() {
    document.getElementById('gamesH2').textContent = X('games_h2');
    const tw = (S.latest.games?.twitch || []).slice().sort((a, b) => b.viewers - a.viewers);
    const kk = (S.latest.games?.kick || []).slice().sort((a, b) => b.viewers - a.viewers);
    // usa o valor ao vivo do GTA VI, se houver
    const liveTw = S.liveOk && S.live?.twitch?.viewers;
    if (liveTw) for (const g of tw) if (g.gta) g.viewers = liveTw;
    tw.sort((a, b) => b.viewers - a.viewers);
    const i = tw.findIndex((g) => g.gta), gta = tw[i];
    document.getElementById('gTwT').textContent = X('games_tw'); document.getElementById('gTwS').textContent = X('games_tw_sub');
    document.getElementById('gKkT').textContent = X('games_kk'); document.getElementById('gKkS').textContent = X('games_kk_sub');
    document.getElementById('gRankL').textContent = X('games_rank');
    document.getElementById('gVsL').textContent = X('games_vs_lbl');
    const nf1 = nf({ maximumFractionDigits: 1 });
    if (gta && tw.length > 1) {
      const rank = i + 1;
      document.getElementById('gRank').textContent = S.lang === 'pt' ? `${rank}º` : `#${rank}`;
      if (rank === 1) {
        const second = tw[1], x = second.viewers ? gta.viewers / second.viewers : null;
        document.getElementById('gVs').textContent = x ? EX[S.lang].times(nf1.format(x)) : '—';
        document.getElementById('gVsS').textContent = x ? `${X('more')} ${second.name}` : '';
        document.getElementById('gamesInsight').innerHTML = x ? EX[S.lang].games_insight(1, EX[S.lang].times(nf1.format(x)), esc(second.name)) : '';
      } else {
        const lead = tw[0], share = lead.viewers ? gta.viewers / lead.viewers : 0;
        document.getElementById('gVs').textContent = pct(share, 1);
        document.getElementById('gVsL').textContent = X('games_vs_lbl2');
        document.getElementById('gVsS').textContent = EX[S.lang].games_behind('', lead.name).trim();
        document.getElementById('gamesInsight').innerHTML = EX[S.lang].games_insight(rank, pct(share, 1), esc(lead.name));
      }
    } else {
      document.getElementById('gRank').textContent = '—'; document.getElementById('gVs').textContent = '—'; document.getElementById('gVsS').textContent = '';
      document.getElementById('gamesInsight').textContent = X('games_wait');
    }
    gamesChart('gamesTw', tw);
    gamesChart('gamesKk', kk);

    const d = lastWith('twitch', 'dg');
    document.getElementById('domTw').textContent = d && d.dt ? pct(d.dg, d.dt) : '—';
    document.getElementById('domTwL').textContent = d ? X('games_share') : X('dom_wait');

    document.getElementById('domChartT').textContent = X('dom_chart');
    document.getElementById('domChartS').textContent = S.lang === 'pt' ? 'Percentagem ao longo do tempo' : 'Percentage over time';
    const dp = inRange().filter((p) => p.twitch?.dg != null && p.twitch?.dt);
    mkOrUpdate('domChart', {
      type: 'line', plugins: [launchLine],
      data: { datasets: [{ label: 'Twitch', data: dp.map((p) => ({ x: Date.parse(p.ts), y: p.twitch.dg / p.twitch.dt * 100 })), borderColor: css('--sun-1'), backgroundColor: css('--sun-1') + '22', fill: true }] },
      options: { responsive: true, maintainAspectRatio: false, parsing: false, spanGaps: 3 * 3600e3, animation: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false }, elements: { point: { radius: 0, hoverRadius: 5, hitRadius: 10 }, line: { borderWidth: 2, tension: .3 } },
        plugins: { tooltip: { callbacks: { title: (it) => dt(it[0].parsed.x, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), label: (c) => ` ${nf({ maximumFractionDigits: 1 }).format(c.parsed.y)}%` } } },
        scales: { x: { type: 'linear', min: dp.length ? Date.parse(dp[0].ts) : undefined, max: dp.length ? Date.parse(dp[dp.length - 1].ts) : undefined, grid: { display: false }, ticks: { maxTicksLimit: 6, maxRotation: 0, callback: timeTick } },
                  y: { beginAtZero: true, border: { display: false }, ticks: { callback: (v) => v + '%' } } } },
    });
  }

  /* ----------------------------------------------------------- mapa de calor */
  function renderHeat() {
    const k = KEYS[S.scope];
    document.getElementById('moreH2').textContent = X('heat_title');
    document.getElementById('langT').textContent = T().lang_title; document.getElementById('langS').textContent = T().lang_desc;
    document.getElementById('heatS2').textContent = S.lang === 'pt' ? 'Hora a hora' : 'Hour by hour';
    document.getElementById('heatS').textContent = X('heat_sub');
    const grid = new Map(), acc = new Map(); // dia -> [24] (média dos pontos de cada hora)
    for (const pt of inRange()) {
      const v = PLATFORMS.reduce((a, p) => a + (pt[p]?.[k.v] || 0), 0);
      const d = lisbonDay(pt.ts), h = lisbonHour(pt.ts), key = d + ':' + h;
      if (!grid.has(d)) grid.set(d, Array(24).fill(null));
      const a = acc.get(key) || [0, 0]; a[0] += v; a[1]++; acc.set(key, a);
      grid.get(d)[h] = Math.round(a[0] / a[1]);
    }
    const days = [...grid.keys()].sort().slice(-14);
    const vals = days.flatMap((d) => grid.get(d)).filter((v) => v != null);
    const max = Math.max(1, ...vals);
    const el = document.getElementById('heat');
    el.style.gridTemplateColumns = `76px repeat(24, minmax(0, 1fr))`;
    const color = (v) => v == null ? null : SEQ[Math.min(SEQ.length - 1, Math.floor(Math.sqrt(v / max) * SEQ.length))];
    let html = '<span></span>' + Array.from({ length: 24 }, (_, h) => `<span class="lbl" style="overflow:visible">${h % 6 === 0 ? h + 'h' : ''}</span>`).join('');
    for (const d of days) {
      const label = new Date(d + 'T12:00:00Z').toLocaleDateString(T().locale, { weekday: 'short', day: '2-digit' }).replace(/-feira/, '');
      html += `<span class="lbl">${esc(label)}</span>` + grid.get(d).map((v, h) => `<span class="c" data-tip="${esc(`${label} · ${h}h: ${v == null ? '—' : fmt(v)} ${X('viewers')}`)}" style="${color(v) ? `background:${color(v)}` : ''}"></span>`).join('');
    }
    el.innerHTML = days.length ? html : `<div class="empty" style="grid-column:1/-1">—</div>`;
    el.onmousemove = (e) => { const c = e.target.closest('[data-tip]'); c ? showTip(e, c.dataset.tip) : hideTip(); };
    el.onmouseleave = hideTip;
    // hora do dia com mais audiência, em média
    const sums = Array(24).fill(0), cnt = Array(24).fill(0);
    for (const d of days) grid.get(d).forEach((v, h) => { if (v != null) { sums[h] += v; cnt[h]++; } });
    const avgs = sums.map((x, h) => cnt[h] ? x / cnt[h] : -1), best = avgs.indexOf(Math.max(...avgs)), worst = avgs.indexOf(Math.min(...avgs.map((a) => a < 0 ? Infinity : a)));
    document.getElementById('heatInsight').innerHTML = days.length && best >= 0 ? (S.lang === 'pt'
      ? `Em média, a hora com mais gente a ver é às <b>${best}h</b> (hora local), e a mais calma às <b>${worst}h</b>.`
      : `On average, the busiest hour is <b>${best}:00</b> your local time, and the quietest is <b>${worst}:00</b>.`) : '';
    document.getElementById('heatLegend').innerHTML = `${X('heat_less')} ${SEQ.map((c) => `<i style="background:${c}"></i>`).join('')} ${X('heat_more')}`;
  }

  /* ------------------------------------------------------------------ clips */
  function renderClips() {
    document.getElementById('clipsT').textContent = X('clips_title');
    document.getElementById('clipsS').textContent = S.scope === 'global' ? X('clips_sub') : X('clips_sub_pt');
    const clips = (S.latest.clips || []).filter((c) => S.scope === 'global' || c.lang === 'pt').slice(0, 8);
    document.getElementById('clips').innerHTML = clips.length ? clips.map((c) => `<a class="clip" href="${esc(safeUrl(c.url))}" target="_blank" rel="noopener">
      <div class="th" style="${safeImg(c.thumb) ? `background-image:url(&quot;${esc(safeImg(c.thumb))}&quot;)` : ''}">${safeImg(c.thumb) ? '' : '🎬'}<b class="tnum">▶ ${fmtC(c.views)}</b>${c.duration ? `<em>${Math.round(c.duration)}s</em>` : ''}</div>
      <div class="vt">${esc(c.title)}</div><div class="vc">${esc(c.creator)}, ${fmt(c.views)} ${X('views')}</div></a>`).join('')
      : `<div class="empty" style="grid-column:1/-1">${X('clips_empty')}</div>`;
  }

  /* ------------------------------------------------------- hall + maratonas */
  function boardRow(r, i, right, sub) {
    return `<a class="row" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">
      <span class="rank">${i + 1}</span>
      <span class="avatar" style="border-color:${COLOR[r.platform] || 'var(--border)'}">${safeImg(r.avatar) ? `<img src="${esc(safeImg(r.avatar))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : initials(r.name)}</span>
      <span class="who"><span class="n">${esc(r.name)} ${r.portugal ? '<span class="tag pt">PT</span>' : ''}<span class="tag">${NAMES[r.platform]}</span></span><span class="t">${sub}</span></span>
      <span class="viewers">${right}</span></a>`;
  }
  function renderHall() {
    document.getElementById('hallH2').textContent = S.lang === 'pt' ? 'Quem juntou mais gente' : 'Who drew the biggest crowds';
    const best = Object.values(S.hall?.all || {}).filter(scopeFilter).sort((a, b) => b.peak - a.peak)[0];
    document.getElementById('hallInsight').innerHTML = best ? (S.lang === 'pt'
      ? `O recorde nesta vista é de <b>${esc(best.name)}</b>, com <b>${fmt(best.peak)}</b> pessoas a ver ao mesmo tempo na ${NAMES[best.platform]}, ${esc(dt(best.at, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))}.`
      : `The record in this view belongs to <b>${esc(best.name)}</b>, with <b>${fmt(best.peak)}</b> people watching at once on ${NAMES[best.platform]}, on ${esc(dt(best.at, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))}.`) : '';
    document.getElementById('hallT').textContent = X('hall_title');
    document.getElementById('hallS').textContent = X('hall_sub');
    document.querySelectorAll('#hallSeg button').forEach((b) => { b.textContent = X(b.dataset.h === 'all' ? 'hall_all' : 'hall_24'); b.setAttribute('aria-pressed', b.dataset.h === S.hallMode); });
    const rows = Object.values(S.hall?.[S.hallMode] || {}).filter(scopeFilter).sort((a, b) => b.peak - a.peak).slice(0, 10);
    document.getElementById('hall').innerHTML = rows.length ? rows.map((r, i) => boardRow(r, i, `${fmt(r.peak)}<small>${X('viewers')}</small>`,
      esc(dt(r.at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })))).join('') : `<div class="empty">${X('hall_empty')}</div>`;

    document.getElementById('maraT').textContent = X('mara_title');
    document.getElementById('maraS').textContent = X('mara_sub');
    const m = (S.latest.marathons || {})[S.scope] || [];
    const ref = Date.parse(S.latest.updated || S.latest.ts || Date.now());
    document.getElementById('mara').innerHTML = m.length ? m.map((r, i) => boardRow(r, i, `${durFmt(Date.now() - Date.parse(r.started_at))}<small>${fmt(r.viewers)} ${X('viewers')}</small>`,
      esc(r.title))).join('') : `<div class="empty">${X('mara_empty')}</div>`;
    void ref;
  }

  /* --------------------------------------------------------- primeiras 24 h */
  function first24Stats() {
    const k = KEYS[S.scope], a = LAUNCH.getTime(), b = a + 24 * 3600e3;
    const pts = points().filter((p) => { const t = Date.parse(p.ts); return t >= a && t < b; });
    if (!pts.length) return null;
    const tot = pts.map((pt) => PLATFORMS.reduce((x, p) => x + (pt[p]?.[k.v] || 0), 0));
    const st = pts.map((pt) => PLATFORMS.reduce((x, p) => x + (pt[p]?.[k.s] || 0), 0));
    const peak = Math.max(...tot), i = tot.indexOf(peak);
    const top = Object.values(S.hall?.first24 || {}).filter(scopeFilter).sort((x, y) => y.peak - x.peak).slice(0, 3);
    return { pts, tot, peak, peakAt: pts[i].ts, hours: tot.reduce((x, y) => x + y, 0), avg: tot.reduce((x, y) => x + y, 0) / tot.length, streams: Math.max(...st), top, complete: Date.now() >= b };
  }
  function renderF24() {
    document.getElementById('f24T').textContent = X('f24_title');
    const f = first24Stats();
    document.getElementById('secF24').hidden = !f;   // só aparece depois do lançamento
    const btn = document.getElementById('f24Btn');
    btn.textContent = X('f24_img'); btn.hidden = !f || !(PUBLIC_DOWNLOADS || params.get('owner'));
    document.getElementById('f24S').textContent = f && !f.complete ? `${X('f24_sub')}, ${X('f24_partial')}.` : X('f24_sub') + '.';
    const box = document.getElementById('f24');
    if (!f) {
      box.innerHTML = `<div class="panel empty">${EX[S.lang].f24_wait(dt(LAUNCH.getTime() + 3600e3, { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }))}</div>`;
      return;
    }
    const tiles = [[X('f24_peak'), fmt(f.peak)], [X('f24_hours'), fmtC(f.hours)], [X('f24_avg'), fmtC(f.avg)], [X('f24_streams'), fmt(f.streams)], [X('f24_peak_at'), dt(f.peakAt, { hour: '2-digit', minute: '2-digit' })]];
    box.innerHTML = `<div class="f24">${tiles.map(([l, v]) => `<div class="kpi"><div class="label">${esc(l)}</div><div class="value tnum">${esc(v)}</div></div>`).join('')}</div>
      ${f.top.length ? `<div class="panel" style="margin-top:16px"><h3>${X('f24_top')}</h3><div class="board">${f.top.map((r, i) => boardRow(r, i, `${fmt(r.peak)}<small>${X('viewers')}</small>`, esc(dt(r.at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })))).join('')}</div></div>` : ''}`;
  }
  document.getElementById('f24Btn').onclick = () => { S.cardMode = 'first24'; document.getElementById('modal').classList.add('open'); buildCard(); fitCard(); };

  window.buildCard24 = function () {
    const f = first24Stats(); if (!f) return;
    const stamp = dt(LAUNCH, { day: 'numeric', month: 'long', year: 'numeric' });
    const sparkSvg = cardSpark(f.tot, Date.parse(f.pts[0].ts), Date.parse(f.pts[f.pts.length - 1].ts));
    document.getElementById('shareCard').innerHTML = `
      <div class="sc-eyebrow"><i class="pulse"></i>${esc(X('sc24_eyebrow'))} · ${esc(stamp)}</div>
      <div class="sc-title"><span class="grad">GTA VI</span></div>
      <div class="sc-sub">${esc(t('sc_sub'))}</div>
      <div class="sc-hero"><div class="n tnum">${fmt(f.peak)}</div><div class="l">${esc(X('sc24_peak'))}</div></div>
      <div class="sc-grid">${[[fmtC(f.hours), X('f24_hours')], [fmtC(f.avg), X('f24_avg')], [fmt(f.streams), X('f24_streams')]].map(([n, l]) => `<div class="sc-tile"><div class="n tnum">${n}</div><div class="l">${esc(l)}</div></div>`).join('')}</div>
      ${sparkSvg}
      <div class="sc-top"><div style="font-size:22px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.14em;font-weight:600">${esc(X('f24_top'))}</div>
        ${f.top.map((r, i) => `<div class="r"><span><b style="color:var(--text-muted);font-weight:500">${i + 1}</b> ${esc(r.name)} <span style="font-size:20px;color:var(--text-muted);display:flex;align-items:center;gap:8px"><i class="dot" style="background:${COLOR[r.platform]};width:12px;height:12px"></i>${NAMES[r.platform]}</span></span><span class="tnum">${fmt(r.peak)}</span></div>`).join('')}</div>
      ${cardFoot(dt(Date.now(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))}`;
  };


  /* ------------------------------------------------------- mapa por língua */
  const LANG_COUNTRIES = {
    en: ['840', '826', '124', '036', '554', '372'], pt: ['620', '076', '024', '508', '624', '626'], es: ['724', '484', '032', '170', '152', '604', '862', '218', '068', '600', '858', '320', '340', '558', '188', '591', '192', '214'],
    fr: ['250', '056', '756'], de: ['276', '040'], it: ['380'], ru: ['643', '112', '398'], ja: ['392'], ko: ['410'], zh: ['156', '158'], pl: ['616'], tr: ['792'],
    ar: ['682', '818', '012', '504', '784', '368', '400', '788', '434', '760', '414', '512', '634', '887'], nl: ['528'], sv: ['752'], no: ['578'], da: ['208'], fi: ['246'], cs: ['203'], uk: ['804'],
    hu: ['348'], ro: ['642'], el: ['300'], th: ['764'], id: ['360'], vi: ['704'], hi: ['356'], bg: ['100'], sk: ['703'], he: ['376'], ms: ['458'], tl: ['608'],
  };
  let mapState = 'idle', world = null;
  function loadScript(src) { return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
  async function ensureMap() {
    if (mapState !== 'idle') return;
    mapState = 'loading';
    try {
      if (!window.d3) await loadScript('vendor/d3.min.js');
      if (!window.topojson) await loadScript('vendor/topojson-client.min.js');
      const topo = await fetch('vendor/countries-110m.json').then((r) => r.json());
      world = topojson.feature(topo, topo.objects.countries).features.filter((f) => f.id !== '010');
      mapState = 'ready';
    } catch { mapState = 'fail'; }
    renderMap();
  }
  function renderMap() {
    const ls = Object.entries(S.latest.languages || {}).sort((a, b) => b[1] - a[1]); const totL = ls.reduce((a, [, v]) => a + v, 0);
    const ptL = (S.latest.languages || {}).pt || 0, ptRank = ls.findIndex(([l]) => l === 'pt') + 1;
    document.getElementById('mapInsight').innerHTML = totL && ptRank ? (S.lang === 'pt'
      ? `O português é a <b>${ptRank}.ª língua</b> com mais audiência na Twitch e na Kick: <b>${pct(ptL, totL)}</b> de quem está a ver GTA VI nas duas plataformas.`
      : `Portuguese is the <b>no. ${ptRank} language</b> by audience on Twitch and Kick: <b>${pct(ptL, totL)}</b> of everyone watching GTA VI there.`) : '';
    document.getElementById('mapT').textContent = X('map_title');
    document.getElementById('mapS').textContent = X('map_sub');
    const box = document.getElementById('map');
    if (mapState !== 'ready') { box.innerHTML = `<div class="empty">${mapState === 'fail' ? X('map_fail') : X('map_loading')}</div>`; return; }
    const langs = S.latest.languages || {};
    const byCountry = new Map();
    for (const [l, v] of Object.entries(langs)) for (const c of LANG_COUNTRIES[l] || []) byCountry.set(c, { lang: l, v });
    const max = Math.max(1, ...Object.values(langs));
    const W = 900, H = 440;
    const proj = d3.geoNaturalEarth1().fitSize([W, H], { type: 'FeatureCollection', features: world });
    const path = d3.geoPath(proj);
    const dn = (() => { try { return new Intl.DisplayNames([T().locale], { type: 'language' }); } catch { return null; } })();
    const lname = (c) => { try { const n = dn?.of(c); return n ? n[0].toUpperCase() + n.slice(1) : c; } catch { return c; } };
    const col = (v) => SEQ[Math.min(SEQ.length - 1, Math.floor(Math.sqrt(v / max) * SEQ.length))];
    const hl = S.scope !== 'global';
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(X('map_title'))}">${world.map((f) => {
      const d = byCountry.get(f.id);
      const fill = d ? col(d.v) : css('--surface-2');
      const dim = hl && d && d.lang !== 'pt' ? ' opacity=".35"' : '';
      const tipTxt = esc(d ? `${f.properties.name} · ${lname(d.lang)}: ${fmt(d.v)} ${X('viewers')}` : f.properties.name);
      return `<path class="country" d="${path(f)}" fill="${fill}"${dim} data-tip="${tipTxt}"></path>`;
    }).join('')}</svg>`;
    box.onmousemove = (e) => { const c = e.target.closest('[data-tip]'); c ? showTip(e, c.dataset.tip) : hideTip(); };
    box.onmouseleave = hideTip;
    document.getElementById('mapLegend').innerHTML = `${X('heat_less')} ${SEQ.map((c) => `<i style="background:${c}"></i>`).join('')} ${X('heat_more')}`;
  }
  new IntersectionObserver((es, o) => { if (es.some((e) => e.isIntersecting)) { ensureMap(); o.disconnect(); } }, { rootMargin: '400px' }).observe(document.getElementById('map'));

  /* ---------------------------------------------------------- Google Trends */
  let trendsKey = '';
  function renderTrends() {
    const kw = CFG.trendsKeyword || 'GTA 6';
    document.getElementById('trT').textContent = X('trends_title');
    document.getElementById('trS').textContent = X('trends_sub').replace('{k}', kw);
    const geos = S.scope === 'global' ? [''] : S.scope === 'portugal' ? ['PT'] : ['PT', 'BR'];
    const key = geos.join(',') + S.lang;
    const open = `https://trends.google.com/trends/explore?date=today%203-m&q=${encodeURIComponent(geos.map(() => kw).join(','))}${geos[0] ? '&geo=' + geos.join(',') : ''}&hl=${S.lang === 'pt' ? 'pt-PT' : 'en-US'}`;
    const a = document.getElementById('trOpen'); a.href = open; a.rel = 'noopener noreferrer'; a.textContent = X('trends_open');
    if (key === trendsKey) return; trendsKey = key;
    const req = { comparisonItem: geos.map((g) => ({ keyword: kw, geo: g, time: 'today 3-m' })), category: 0, property: '' };
    const eq = `q=${encodeURIComponent(geos.map(() => kw).join(','))}${geos[0] ? '&geo=' + geos.join(',') : ''}&date=${encodeURIComponent('today 3-m')}`;
    const src = `https://trends.google.com/trends/embed/explore/TIMESERIES?req=${encodeURIComponent(JSON.stringify(req))}&tz=0&eq=${encodeURIComponent(eq)}&hl=${S.lang === 'pt' ? 'pt-PT' : 'en-US'}`;
    document.getElementById('trends').innerHTML = `<iframe class="trends" loading="lazy" src="${esc(src)}" title="Google Trends" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe><div class="desc" style="margin-top:8px">${S.lang === 'pt' ? 'Se o gráfico não aparecer (bloqueadores de anúncios/cookies), usa o botão acima.' : 'If the chart does not load (ad/cookie blockers), use the button above.'}</div>`;
  }

  /* ----------------------------------------------------- widget incorporável */
  const embedModal = document.createElement('div');
  embedModal.className = 'modal'; embedModal.id = 'embedModal';
  embedModal.innerHTML = `<div class="embed-box"><h3 id="emT" style="margin:0"></h3><div class="desc" id="emS" style="margin:0"></div>
    <iframe id="emPrev" style="width:100%;height:190px;border:0;border-radius:14px" title="preview"></iframe>
    <textarea class="embed-code" id="emCode" readonly></textarea>
    <div class="modal-actions"><button class="btn" id="emCopy"></button><button class="btn ghost" id="emClose"></button></div></div>`;
  document.body.appendChild(embedModal);
  function embedSrc() { return `${location.origin}/embed.html?scope=${S.scope}&lang=${S.lang}`; }
  function openEmbed() {
    document.getElementById('emT').textContent = X('embed_title');
    document.getElementById('emS').textContent = X('embed_text');
    document.getElementById('emCopy').textContent = X('copy');
    document.getElementById('emClose').textContent = X('close');
    document.getElementById('emPrev').src = `embed.html?scope=${S.scope}&lang=${S.lang}`;
    document.getElementById('emCode').value = `<iframe src="${embedSrc()}" width="100%" height="190" style="border:0;border-radius:14px;max-width:560px" loading="lazy" title="GTA VI Live Tracker — ${AUTHOR}"></iframe>`;
    embedModal.classList.add('open');
  }
  document.getElementById('embedBtn').onclick = openEmbed;
  document.getElementById('emClose').onclick = () => embedModal.classList.remove('open');
  embedModal.onclick = (e) => { if (e.target === embedModal) embedModal.classList.remove('open'); };
  document.getElementById('emCopy').onclick = async () => {
    const ta = document.getElementById('emCode');
    try { await navigator.clipboard.writeText(ta.value); } catch { ta.select(); document.execCommand('copy'); }
    document.getElementById('emCopy').textContent = X('copied');
    setTimeout(() => (document.getElementById('emCopy').textContent = X('copy')), 1800);
  };

  /* ------------------------------------------------------------------ main */
  window.renderExtras = function () {
    const run = (f) => { try { f(); } catch (e) { console.error(f.name, e); } };
    [renderSponsor, renderGames, renderHeat, renderClips, renderHall, renderF24, renderMap, renderTrends].forEach(run);
  };
  if (points().length || S.liveOk) window.renderExtras();
})();
