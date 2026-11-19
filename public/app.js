'use strict';
/* ============================================================ config */
const CFG = window.SITE_CONFIG || {};               // editar em public/config.js
const AUTHOR = String(CFG.author || 'Duarte Rodrigues');
const AUTHOR_URL = (() => { try { const u = new URL(CFG.authorUrl); if (u.protocol === 'https:') return u.href; } catch { /* usa o padrão */ } return 'https://www.linkedin.com/in/duartenrodrigues26/'; })();
const PUBLIC_DOWNLOADS = CFG.publicDownloads !== false;
const LAUNCH = new Date(CFG.launch || '2026-11-18T11:00:00Z');
const LIVE_EVERY = 120e3, HISTORY_EVERY = 5 * 60e3, VISIT_EVERY = 300e3;
const ALL = ['twitch', 'kick', 'youtube'];
const SRC_SETS = { twitch: ['twitch'], kick: ['twitch', 'kick'], all: ALL };
const PLATFORMS = ['twitch'];                       // plataformas contadas nos totais (muda com o seletor de fonte)
const CARDS = ['twitch', 'kick'];                   // cartões da secção "Agora" (o YouTube tem secção própria)
const NAMES = { twitch: 'Twitch', kick: 'Kick', youtube: 'YouTube' };
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const COLOR = { twitch: css('--twitch'), kick: css('--kick'), youtube: css('--youtube') };

/* ============================================================ textos */
const I18N = {
  pt: {
    locale: 'pt-PT',
    scope_global: 'Mundo', scope_portugal: 'Portugal', scope_luso: 'Em português',
    lead: 'Quantas pessoas estão a ver GTA VI (GTA 6, Grand Theft Auto VI) neste momento? Espectadores, streams e vídeos em tempo real na Twitch, Kick e YouTube.',
    nav_now: 'Agora', nav_time: 'Evolução', nav_games: 'vs outros jogos', nav_streamers: 'Streamers', nav_more: 'Mais dados', skip: 'Saltar para os dados',
    scope_note: { global: 'Soma das plataformas escolhidas em "Contar". Muda para 🇵🇹 Portugal ou 🗣️ Em português no topo.', portugal: 'Só criadores de Portugal: lista de streamers portugueses + deteção automática (PT-PT no título, país do canal no YouTube). O Brasil fica de fora.', luso: 'Todas as streams faladas em português: Portugal, Brasil e outros países.' },
    visitors: (n) => `<b>${n}</b> ${n === 1 ? 'pessoa' : 'pessoas'} neste site agora`, visitors_tip: (d, t) => `${d} visitas hoje, ${t} no total`,
    hero_viewers: { global: 'a ver agora, em todo o mundo', portugal: 'a ver agora, em streams de Portugal', luso: 'a ver agora, em streams em português' },
    hero_streams: 'streams em direto agora',
    d1h: (pct) => `${pct} na última hora`, d1h_flat: 'estável na última hora',
    top_now: 'A seguir', no1: { global: 'Mais visto agora, no mundo', portugal: 'Mais visto agora, em Portugal', luso: 'Mais visto agora, em português' }, pt_none: 'Ninguém em direto agora nesta vista.', viewers_s: 'espectadores',
    tab_title: (n) => `${n} a ver GTA VI · Live Tracker`,
    hc_title: 'Últimas 24 horas', hc_peak: (v) => `pico ${v}`,
    page_title: 'GTA 6 ao vivo: quantas pessoas estão a ver GTA VI agora? | Twitch, Kick e YouTube', page_desc: 'GTA 6 (GTA VI, Grand Theft Auto VI) ao vivo: espectadores, streams, recordes e vídeos em tempo real na Twitch, Kick e YouTube. No mundo, em Portugal e em português. Por Duarte Rodrigues.',
    now_title: { global: 'Agora, em todo o mundo', portugal: 'Agora, em Portugal', luso: 'Agora, em língua portuguesa' },
    now_sub: { global: 'As plataformas escolhidas em "Contar".', portugal: 'Streams portuguesas (PT-PT). Vê a metodologia no fim da página.', luso: 'Todas as streams em português: Portugal, Brasil e outros.' },
    share_title: 'Fatia de espectadores por plataforma',
    share_btn: 'Descarregar', download: 'Descarregar imagem', pdf: 'Guardar em PDF', embed: 'Incorporar no teu site', close: 'Fechar', downloading: 'A preparar a imagem…',
    by: 'por', author_role: 'Fiz este tracker. Se usares os dados ou as imagens, indica a fonte.', record: '🔥 Novo recorde', credit_line: 'Dados e visualização de', made_by: 'Feito por',
    headline: { global: (n) => `Neste momento, <span class="n tnum">${n}</span> pessoas estão a ver GTA&nbsp;VI`, portugal: (n) => `Neste momento, <span class="n tnum">${n}</span> pessoas veem GTA&nbsp;VI em streams portuguesas`, luso: (n) => `Neste momento, <span class="n tnum">${n}</span> pessoas veem GTA&nbsp;VI em português` },
    hero_sub: (s, live) => `Em ${s} streams na Twitch, na Kick e no YouTube. ${live}`,
    live: 'Ao vivo', live_ago: (m) => m < 1 ? 'Atualizado agora mesmo.' : `Atualizado há ${m} min.`, live_off: (d) => `Última recolha às ${d}.`,
    status_live: 'Ao vivo', status_off: 'Última recolha',
    k_now: 'Espectadores agora', k_peak: 'Pico registado', k_hours: 'Horas assistidas', k_streams: 'Streams agora', k_rank: 'Lugar na Twitch', k_share: 'Fatia do total mundial', k_unique: 'Canais diferentes',
    k_hours_note: 'estimativa desde o início', k_rank_note: 'entre todas as categorias', k_unique_note: 'já transmitiram GTA VI', k_share_note: 'dos espectadores globais', k_streams_note: 'nas plataformas contadas',
    streams: 'streams', stream1: 'stream', of_total: 'do total', top100: 'só as 100 maiores', top50: 'só as maiores lives', hourly: 'de hora a hora', live_short: 'ao vivo',
    ts_h2: { v: 'Ao longo do tempo', s: 'Streams ao longo do tempo' },
    ts_insight: (r) => r, m_viewers: 'Espectadores', m_streams: 'Streams', all: 'Tudo', r_month: '1 mês', forecast: 'previsão',
    board_title: { global: 'Quem tem mais gente a ver', portugal: 'Streamers portugueses com mais gente', luso: 'Streamers em português com mais gente' },
    board_desc: 'Agora, nas plataformas escolhidas', board_empty: 'Ninguém a transmitir nesta vista neste momento.',
    viewers: 'espectadores', views: 'visualizações',
    yt_sub: 'Lives e vídeos novos que mencionam "GTA VI", "GTA 6", "GTA6", "Grand Theft Auto VI" ou "Grand Theft Auto 6".',
    yt_new_title: 'Vídeos novos publicados', yt_new_desc: 'Uma barra por cada 3 horas. O número é uma estimativa do próprio YouTube.',
    lang_title: 'Twitch e Kick por língua', lang_desc: 'Espectadores na última recolha, 8 línguas com mais audiência',
    vid_title: { global: 'Os vídeos novos mais vistos', portugal: 'Vídeos novos de canais portugueses', luso: 'Vídeos novos em português' },
    vid_desc: { global: 'Publicados nas 3 horas antes da última recolha de vídeos', portugal: 'Vídeos sobre GTA VI dos últimos 7 dias, de criadores portugueses (RicFazeres, Wuant, SirKazzio e outros)', luso: 'Publicados nas 3 horas antes da última recolha de vídeos' }, no_videos: 'Ainda não há vídeos nesta vista.',
    stale: 'Os dados estão atrasados', err: 'sem dados de momento', updated: 'Atualizado',
    no_data: 'Ainda não há dados. A primeira recolha aparece aqui dentro de alguns minutos.',
    fc_title: 'Previsão para as próximas 24 horas', fc_chart: 'Real e previsto', fc_chart_desc: 'Total de espectadores nesta vista', fc_real: 'Real', fc_pred: 'Previsto',
    fc_track: 'Acertámos?', fc_track_desc: 'A previsão de cada dia, feita à meia-noite, comparada com o pico real',
    fc_th: ['Dia', 'Pico previsto', 'Pico real', 'Erro'],
    fc_insight: (pk, h, d) => `Pelo ritmo dos últimos dias, o próximo pico deve rondar <b>${pk}</b> pessoas, por volta das <b>${h}</b> de ${d}. O modelo é simples: repete o padrão de cada hora dos últimos 3 dias e ajusta pela tendência.`,
    fc_wait: 'A previsão aparece quando houver pelo menos 8 horas de dados desde o lançamento.', fc_none: 'Ainda não há previsões terminadas para comparar.',
    method_title: 'Como é que isto é medido',
    method: `<p><b>Fontes.</b> Só APIs oficiais. O total mostrado por defeito conta só a Twitch, que é a única que dá todas as streams; podes somar a Kick e o YouTube, mas aí o número passa a ser "pelo menos". Na Twitch, todas as streams da categoria "Grand Theft Auto VI" (também conhecido como GTA VI, GTA 6 ou Grand Theft Auto 6). Na Kick, as 100 maiores streams da categoria, que é o limite da API pública. No YouTube, as 50 lives mais vistas que mencionam GTA VI, GTA 6, GTA6, Grand Theft Auto VI ou Grand Theft Auto 6, e uma segunda pesquisa orientada a português; os vídeos novos são contados de 3 em 3 horas e esse número é uma estimativa do YouTube.</p>
      <p><b>Portugal e português.</b> A Twitch e a Kick dizem a língua de cada stream, não o país. "Em português" junta todas as streams em português, incluindo as do Brasil. "Portugal" junta quatro sinais: uma lista de criadores portugueses (RicFazeres, Wuant, SirKazzio, Zorlak e outros), canais que o tracker já reconheceu como portugueses, títulos com marcas de Portugal ("PT-PT", "🇵🇹", "tuga") ou de português europeu ("a jogar", "connosco", "malta"), e, no YouTube, o país do canal ou o áudio em pt-PT. Os vídeos e as lives dos canais da lista são lidos diretamente, mesmo que não apareçam na pesquisa do YouTube. Ainda assim é uma contagem por baixo.</p>
      <p><b>Espectadores</b> são pessoas a ver ao mesmo tempo, não visualizações acumuladas, e a mesma pessoa pode estar em mais do que uma stream. <b>Horas assistidas</b> é a soma dos espectadores de cada recolha, uma estimativa. A <b>previsão</b> repete o padrão horário dos últimos 3 dias, ajustado pela tendência; serve para dar uma ideia, não é uma promessa.</p>
      <p>Os números ao vivo da Twitch e da Kick atualizam a cada 2 minutos. O histórico guarda um ponto a cada 10 minutos. O YouTube é lido de hora a hora (lives) e de 3 em 3 horas (vídeos novos), por causa da quota diária da API; entre leituras, repete-se o último valor. Este projeto não tem ligação à Rockstar Games nem à Take-Two.</p>`,
    footer: 'Projeto independente com dados públicos das APIs oficiais. Podes partilhar os dados e as imagens, desde que indiques a fonte.',
    sc_eyebrow: { global: 'Live Tracker · Mundo', portugal: 'Live Tracker · Portugal 🇵🇹', luso: 'Live Tracker · Em português' },
    sc_sub: 'Twitch, Kick e YouTube', sc_peak: 'pessoas a ver ao mesmo tempo, o pico até agora', sc_top: 'Quem juntou mais gente',
    cant_render: 'Não foi possível gerar a imagem. Faz uma captura de ecrã ao cartão.',
    src_label: 'Contar', src_twitch: 'Twitch', src_kick: '+ Kick', src_all: '+ YouTube',
    src_note: { twitch: 'Só Twitch: a única plataforma que mostra todas as streams da categoria, por isso é o número mais fiável.', kick: 'Twitch + Kick. A Kick só mostra as 100 maiores streams, por isso o total é "pelo menos".', all: 'Twitch + Kick + YouTube. A Kick mostra as 100 maiores streams e o YouTube as 50 maiores lives, por isso o total é "pelo menos".' },
    at_least: 'pelo menos', not_in_total: 'fora do total', all_streams: 'todas as streams',
    kick_full: 'lista completa', kick_partial: (n) => `top 100, a mais pequena tem ${n}`, yt_partial: (n) => `top 50, a mais pequena tem ${n}`,
    sources_of: (names) => names.join(', '),
    yt_k_viewers: 'A ver lives agora', yt_k_lives: 'Lives agora', yt_k_read: 'Última leitura', yt_k_vids: 'Vídeos novos (3 h)',
    yt_live_title: 'Espectadores nas lives do YouTube', yt_live_desc: (n) => `Conta só as maiores lives (cerca de 50, as que a pesquisa do YouTube devolve${n ? `; agora a mais pequena tem ${n} espectadores` : ''}). As lives mais pequenas não entram, por isso o total real é maior. Uma leitura por hora.`,
    yt_board: 'Lives com mais gente', yt_board_empty: 'Sem lives nesta vista na última leitura.',
    yt_disc: 'O YouTube só mostra as 50 lives mais vistas e é lido de hora a hora, por isso estes números são um mínimo e não entram no total por defeito. ',
    flow_title: 'Streams a entrar e a sair', flow_desc: 'Por hora: canais que começaram (acima) e que terminaram (abaixo) de transmitir GTA VI',
    flow_in: 'Começaram', flow_out: 'Terminaram', flow_wait: 'Aparece depois de duas recolhas seguidas.',
    flow_insight: (i, o, n) => `Na última hora, <b>${fmt(i)}</b> canais começaram a transmitir GTA VI e <b>${fmt(o)}</b> terminaram: ${n >= 0 ? 'ficaram mais' : 'ficaram menos'} <b>${fmt(Math.abs(n))}</b> em direto.`,
    info_btn: 'Mais informação', snap: 'Recolha das',
    notice_title: 'Antes de começares',
    notice_text: 'Este site foi feito com "vibe coding", com ajuda de IA, por uma pessoa e não por uma empresa. Os dados da <b>Twitch</b> vêm da API oficial e são fiáveis. Os da <b>Kick</b> (só as 100 maiores streams) e do <b>YouTube</b> (só as 50 maiores lives, lidas de hora a hora) são limitados e podem ter discrepâncias.',
    notice_ok: 'Percebi', notice_link: 'Sobre estes dados',
  },
  en: {
    locale: (/^en/i.test(navigator.language || '') ? navigator.language : 'en-US'),   // formatos do país do visitante
    scope_global: 'World', scope_portugal: 'Portugal', scope_luso: 'In Portuguese',
    lead: 'How many people are watching GTA VI (GTA 6, Grand Theft Auto VI) right now? Live viewers, streams and videos across Twitch, Kick and YouTube.',
    nav_now: 'Now', nav_time: 'Over time', nav_games: 'vs other games', nav_streamers: 'Streamers', nav_more: 'More data', skip: 'Skip to the data',
    scope_note: { global: 'The platforms picked under "Count" added together. Switch to 🇵🇹 Portugal or 🗣️ In Portuguese at the top.', portugal: 'Creators from Portugal only: a list of Portuguese streamers plus automatic detection (European Portuguese in the title, channel country on YouTube). Brazil is left out.', luso: 'Every stream spoken in Portuguese: Portugal, Brazil and other countries.' },
    visitors: (n) => `<b>${n}</b> ${n === 1 ? 'person' : 'people'} on this site now`, visitors_tip: (d, t) => `${d} visits today, ${t} in total`,
    hero_viewers: { global: 'watching right now, worldwide', portugal: 'watching Portuguese streams right now', luso: 'watching Portuguese-language streams' },
    hero_streams: 'live streams right now',
    d1h: (pct) => `${pct} in the last hour`, d1h_flat: 'steady in the last hour',
    top_now: 'Next up', no1: { global: 'Most watched now, worldwide', portugal: 'Most watched now, in Portugal', luso: 'Most watched now, in Portuguese' }, pt_none: 'Nobody live right now in this view.', viewers_s: 'viewers',
    tab_title: (n) => `${n} watching GTA VI · Live Tracker`,
    hc_title: 'Last 24 hours', hc_peak: (v) => `peak ${v}`,
    page_title: 'GTA 6 live: how many people are watching GTA VI right now? | Twitch, Kick and YouTube', page_desc: 'GTA 6 (GTA VI, Grand Theft Auto VI, Grand Theft Auto 6) live: viewers, streams, records and videos in real time on Twitch, Kick and YouTube. Worldwide, in Portugal and in Portuguese. By Duarte Rodrigues.',
    now_title: { global: 'Right now, worldwide', portugal: 'Right now, in Portugal', luso: 'Right now, in Portuguese' },
    now_sub: { global: 'The platforms picked under "Count".', portugal: 'Portugal-based (PT-PT) streams. See the methodology at the bottom.', luso: 'Every Portuguese-language stream: Portugal, Brazil and others.' },
    share_title: 'Viewer share by platform',
    share_btn: 'Download', download: 'Download image', pdf: 'Save as PDF', embed: 'Embed on your site', close: 'Close', downloading: 'Preparing image…',
    by: 'by', author_role: 'I built this tracker. If you use the data or images, please credit the source.', record: '🔥 New record', credit_line: 'Data and visualisation by', made_by: 'Made by',
    headline: { global: (n) => `Right now, <span class="n tnum">${n}</span> people are watching GTA&nbsp;VI`, portugal: (n) => `Right now, <span class="n tnum">${n}</span> people are watching GTA&nbsp;VI on Portuguese streams`, luso: (n) => `Right now, <span class="n tnum">${n}</span> people are watching GTA&nbsp;VI in Portuguese` },
    hero_sub: (s, live) => `Across ${s} streams on Twitch, Kick and YouTube. ${live}`,
    live: 'Live', live_ago: (m) => m < 1 ? 'Updated just now.' : `Updated ${m} min ago.`, live_off: (d) => `Last snapshot at ${d}.`,
    status_live: 'Live', status_off: 'Last snapshot',
    k_now: 'Viewers now', k_peak: 'Peak recorded', k_hours: 'Hours watched', k_streams: 'Streams now', k_rank: 'Rank on Twitch', k_share: 'Share of the world total', k_unique: 'Different channels',
    k_hours_note: 'estimated since tracking began', k_rank_note: 'among all categories', k_unique_note: 'have streamed GTA VI', k_share_note: 'of global viewers', k_streams_note: 'on the counted platforms',
    streams: 'streams', stream1: 'stream', of_total: 'of total', top100: 'top 100 only', top50: 'biggest lives only', hourly: 'hourly', live_short: 'live',
    ts_h2: { v: 'Over time', s: 'Streams over time' },
    ts_insight: (r) => r, m_viewers: 'Viewers', m_streams: 'Streams', all: 'All', r_month: '1 month', forecast: 'forecast',
    board_title: { global: 'Who has the most people watching', portugal: 'Portuguese streamers with the biggest audience', luso: 'Portuguese-language streamers with the biggest audience' },
    board_desc: 'Right now, on the chosen platforms', board_empty: 'Nobody is streaming in this view right now.',
    viewers: 'viewers', views: 'views',
    yt_sub: 'Live streams and new videos that mention "GTA VI", "GTA 6", "GTA6", "Grand Theft Auto VI" or "Grand Theft Auto 6".',
    yt_new_title: 'New videos published', yt_new_desc: 'One bar per 3 hours. The number is YouTube\'s own estimate.',
    lang_title: 'Twitch and Kick by language', lang_desc: 'Viewers in the latest snapshot, top 8 languages',
    vid_title: { global: 'Most-viewed new videos', portugal: 'New videos from Portuguese channels', luso: 'New videos in Portuguese' },
    vid_desc: { global: 'Published in the 3 hours before the latest video snapshot', portugal: 'GTA VI videos from the last 7 days by Portuguese creators (RicFazeres, Wuant, SirKazzio and others)', luso: 'Published in the 3 hours before the latest video snapshot' }, no_videos: 'No videos in this view yet.',
    stale: 'Data is delayed', err: 'no data right now', updated: 'Updated',
    no_data: 'No data yet. The first snapshot will show up here within a few minutes.',
    fc_title: 'Forecast for the next 24 hours', fc_chart: 'Actual and forecast', fc_chart_desc: 'Total viewers in this view', fc_real: 'Actual', fc_pred: 'Forecast',
    fc_track: 'How close were we?', fc_track_desc: "Each day's forecast, made at midnight, against the actual peak",
    fc_th: ['Day', 'Forecast peak', 'Actual peak', 'Error'],
    fc_insight: (pk, h, d) => `Based on the last few days, the next peak should be around <b>${pk}</b> people, at about <b>${h}</b> on ${d}. The model is simple: it repeats each hour's pattern from the last 3 days and adjusts for the trend.`,
    fc_wait: 'The forecast appears once there are at least 8 hours of data since launch.', fc_none: 'No finished forecasts to compare yet.',
    method_title: 'How this is measured',
    method: `<p><b>Sources.</b> Official APIs only. The total shown by default counts Twitch only, the one platform that gives every stream; you can add Kick and YouTube, but then the number becomes "at least". On Twitch, every stream in the "Grand Theft Auto VI" category (also known as GTA VI, GTA 6 or Grand Theft Auto 6). On Kick, the 100 biggest streams in the category, which is the public API's limit. On YouTube, the 50 most-watched live streams mentioning GTA VI, GTA 6, GTA6, Grand Theft Auto VI or Grand Theft Auto 6, plus a second, Portuguese-targeted search; new videos are counted every 3 hours and that number is YouTube's estimate.</p>
      <p><b>Portugal and Portuguese.</b> Twitch and Kick report each stream's language, not its country. "In Portuguese" counts every Portuguese-language stream, including Brazil. "Portugal" combines four signals: a list of Portuguese creators (RicFazeres, Wuant, SirKazzio, Zorlak and others), channels the tracker has already recognised as Portuguese, titles with Portugal markers ("PT-PT", "🇵🇹", "tuga") or European-Portuguese phrasing, and, on YouTube, the channel country or pt-PT audio. Videos and lives from listed channels are read directly, even when they don't show up in YouTube search. It still undercounts.</p>
      <p><b>Viewers</b> means people watching at the same time, not cumulative views, and one person may be on more than one stream. <b>Hours watched</b> is the sum of viewers across snapshots, an estimate. The <b>forecast</b> repeats the hourly pattern of the last 3 days, adjusted for trend; it is a rough guide, not a promise.</p>
      <p>Live Twitch and Kick numbers refresh every 2 minutes. The history stores a point every 10 minutes. YouTube is read hourly (lives) and every 3 hours (new videos) because of the API's daily quota; between reads the last value is repeated. This project is not affiliated with Rockstar Games or Take-Two.</p>`,
    footer: 'Independent project using public data from official APIs. You can share the data and images as long as you credit the source.',
    sc_eyebrow: { global: 'Live Tracker · World', portugal: 'Live Tracker · Portugal 🇵🇹', luso: 'Live Tracker · In Portuguese' },
    sc_sub: 'Twitch, Kick and YouTube', sc_peak: 'people watching at once, the peak so far', sc_top: 'Who drew the biggest crowd',
    cant_render: 'Could not create the image. Take a screenshot of the card instead.',
    src_label: 'Count', src_twitch: 'Twitch', src_kick: '+ Kick', src_all: '+ YouTube',
    src_note: { twitch: 'Twitch only: the one platform that shows every stream in the category, so it is the most reliable number.', kick: 'Twitch + Kick. Kick only shows its 100 biggest streams, so the total is "at least".', all: 'Twitch + Kick + YouTube. Kick shows its 100 biggest streams and YouTube its 50 biggest lives, so the total is "at least".' },
    at_least: 'at least', not_in_total: 'not in the total', all_streams: 'all streams',
    kick_full: 'complete list', kick_partial: (n) => `top 100, the smallest has ${n}`, yt_partial: (n) => `top 50, the smallest has ${n}`,
    sources_of: (names) => names.join(', '),
    yt_k_viewers: 'Watching lives now', yt_k_lives: 'Lives now', yt_k_read: 'Last read', yt_k_vids: 'New videos (3 h)',
    yt_live_title: 'Viewers on YouTube lives', yt_live_desc: (n) => `Counts only the biggest lives (about 50, the ones YouTube search returns${n ? `; right now the smallest has ${n} viewers` : ''}). Smaller lives are left out, so the real total is higher. One reading per hour.`,
    yt_board: 'Lives with the most people', yt_board_empty: 'No lives in this view in the last reading.',
    yt_disc: 'YouTube only shows the 50 most-watched lives and is read hourly, so these numbers are a minimum and are left out of the total by default.',
    flow_title: 'Streams starting and ending', flow_desc: 'Per hour: channels that started (up) and stopped (down) streaming GTA VI',
    flow_in: 'Started', flow_out: 'Ended', flow_wait: 'Shows up after two back-to-back snapshots.',
    flow_insight: (i, o, n) => `In the last hour, <b>${fmt(i)}</b> channels started streaming GTA VI and <b>${fmt(o)}</b> stopped: there are <b>${fmt(Math.abs(n))}</b> ${n >= 0 ? 'more' : 'fewer'} live.`,
    info_btn: 'More information', snap: 'Snapshot at',
    notice_title: 'Before you start',
    notice_text: 'This site was built with "vibe coding", with AI help, by one person and not a company. <b>Twitch</b> data comes from the official API and is reliable. <b>Kick</b> (only its 100 biggest streams) and <b>YouTube</b> (only its 50 biggest lives, read hourly) are limited and may show discrepancies.',
    notice_ok: 'Got it', notice_link: 'About this data',
  },
};

/* ============================================================ ícones de informação (ⓘ) */
// Texto mostrado ao passar o rato / tocar / focar no ícone. Funções recebem o estado para usar números reais.
const sampleOf = () => S.latest?.dominance?.twitch;
const INFO = {
  pt: {
    src: 'A Twitch mostra todas as streams da categoria. A Kick só devolve as 100 maiores e o YouTube as 50 maiores lives, por isso somar as três dá um mínimo, não o total real.',
    hours: 'Estimativa: soma dos espectadores de cada recolha, ponderada pelo tempo entre recolhas. Não é uma medida oficial das plataformas.',
    kick: () => { const k = S.latest?.totals?.kick; return `A API pública da Kick devolve no máximo 100 streams por pedido. Com menos de 100, a lista é completa. Com 100 ou mais, vemos só as maiores${k?.min_v ? ` (agora a mais pequena tem ${fmt(k.min_v)} espectadores)` : ''}.`; },
    yt_live: 'O YouTube só devolve as cerca de 50 lives mais vistas que mencionam GTA VI. Lives pequenas ficam de fora.',
    yt_hourly: 'O YouTube tem uma quota diária grátis. Por isso as lives são lidas de hora a hora e os vídeos novos de 3 em 3 horas. Entre leituras, o valor repete-se.',
    yt_new: 'Estimativa do próprio YouTube para os vídeos de GTA VI publicados em cada janela de 3 horas. É uma ordem de grandeza, não uma contagem exata. Em Portugal, os vídeos são contados um a um nos canais portugueses que o tracker segue.',
    portugal: 'Nenhuma plataforma diz o país do streamer. Usamos uma lista de criadores portugueses, canais já reconhecidos e marcas de Portugal no título. É sempre uma contagem por baixo.',
    map: 'O mapa mostra a língua da stream, não o país de quem vê. O português pinta Portugal, Brasil e países africanos de língua portuguesa.',
    weight: () => { const d = sampleOf(); return `Das ${d ? fmt(d.sample) : '5 000'} maiores streams da Twitch (todas as categorias), quantos espectadores são de GTA VI.${d?.min_v ? ` A amostra chega até streams com ${fmt(d.min_v)} espectadores; as mais pequenas ficam de fora.` : ''}`; },
    flow: 'Compara as streams com as da recolha anterior (10 minutos). Só conta quando as duas listas são completas, por isso na Kick só aparece com menos de 100 streams.',
    games: 'Soma dos espectadores de cada jogo na Twitch, até 1000 streams por jogo. As restantes têm muito poucos espectadores.',
  },
  en: {
    src: 'Twitch shows every stream in the category. Kick only returns its 100 biggest and YouTube its 50 biggest lives, so adding the three gives a minimum, not the real total.',
    hours: 'An estimate: the sum of viewers at each snapshot, weighted by the time between snapshots. Not an official platform metric.',
    kick: () => { const k = S.latest?.totals?.kick; return `Kick's public API returns at most 100 streams per request. With fewer than 100, the list is complete. With 100 or more we only see the biggest${k?.min_v ? ` (right now the smallest has ${fmt(k.min_v)} viewers)` : ''}.`; },
    yt_live: 'YouTube only returns about the 50 most-watched lives that mention GTA VI. Small lives are left out.',
    yt_hourly: 'YouTube has a free daily quota. That is why lives are read hourly and new videos every 3 hours. Between readings the value repeats.',
    yt_new: "YouTube's own estimate of GTA VI videos published in each 3-hour window. It is a ballpark, not an exact count. For Portugal, videos are counted one by one on the Portuguese channels the tracker follows.",
    portugal: 'No platform tells us a streamer\'s country. We use a list of Portuguese creators, channels already recognised and Portugal markers in the title. It is always an undercount.',
    map: "The map shows the stream's language, not where viewers are. Portuguese colours Portugal, Brazil and the Portuguese-speaking African countries.",
    weight: () => { const d = sampleOf(); return `Of Twitch's ${d ? fmt(d.sample) : '5,000'} biggest streams (all categories), how many viewers are on GTA VI.${d?.min_v ? ` The sample reaches down to streams with ${fmt(d.min_v)} viewers; smaller ones are left out.` : ''}`; },
    flow: 'Compares streams with the previous snapshot (10 minutes ago). It only counts when both lists are complete, so on Kick it only appears with fewer than 100 streams.',
    games: 'Viewers summed per game on Twitch, up to 1,000 streams per game. The rest have very few viewers.',
  },
};
const infoText = (k) => { const v = INFO[S.lang][k]; return typeof v === 'function' ? v() : v || ''; };
const infoBtn = (k) => `<button type="button" class="info" data-info="${esc(k)}" aria-label="${esc(T().info_btn)}">i</button>`;
window.infoBtn = infoBtn;
// Logótipo da plataforma: usa public/img/<plataforma>.svg (ou .png) se existir; senão, o ponto de cor. Sem estilos nem handlers inline.
const LOGO = {};
for (const p of ['twitch', 'kick', 'youtube']) { LOGO[p] = null; }
const plat = (p, withName = true) => `<span class="pl"><span class="pi" data-p="${esc(p)}"><i class="dot" style="background:${COLOR[p] || 'var(--text-muted)'}"></i><img src="img/${esc(p)}.svg" alt="" width="16" height="16" data-logo="${esc(p)}"></span>${withName ? esc(NAMES[p] || p) : ''}</span>`;
window.platHtml = plat;
// se o ficheiro do logótipo não existir, a imagem desaparece e fica o ponto de cor
document.addEventListener('error', (e) => { const i = e.target; if (i?.tagName === 'IMG' && i.dataset?.logo) { if (!i.dataset.png) { i.dataset.png = '1'; i.src = 'img/' + i.dataset.logo + '.png'; } else i.remove(); } else if (i?.tagName === 'IMG' && i.dataset?.plogo) i.remove(); }, true);
document.addEventListener('load', (e) => { const i = e.target; if (i?.tagName !== 'IMG') return; if (i.dataset?.logo) i.closest('.pi')?.classList.add('has'); else if (i.dataset?.plogo) i.closest('.bl')?.classList.add('has'); }, true);
// tooltip único, posicionado junto ao ícone (compatível com a CSP: sem estilos nem handlers inline)
(function initInfoTip() {
  const tipEl = document.createElement('div'); tipEl.className = 'itip'; tipEl.setAttribute('role', 'tooltip'); tipEl.hidden = true; document.body.appendChild(tipEl);
  let cur = null;
  const hide = () => { tipEl.hidden = true; cur = null; };
  const show = (btn) => {
    cur = btn; tipEl.textContent = infoText(btn.dataset.info); tipEl.hidden = false;
    const r = btn.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    const x = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    const below = r.bottom + 8 + h < innerHeight || r.top - 8 - h < 0;
    tipEl.style.left = x + 'px'; tipEl.style.top = (below ? r.bottom + 8 : r.top - 8 - h) + 'px';
  };
  const target = (e) => e.target.closest?.('.info');
  document.addEventListener('mouseover', (e) => { const b = target(e); if (b) show(b); });
  document.addEventListener('mouseout', (e) => { if (target(e)) hide(); });
  document.addEventListener('focusin', (e) => { const b = target(e); if (b) show(b); });
  document.addEventListener('focusout', (e) => { if (target(e)) hide(); });
  document.addEventListener('click', (e) => { const b = target(e); if (b) { e.preventDefault(); cur === b && !tipEl.hidden ? hide() : show(b); } else hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', hide, { passive: true });
})();

/* ============================================================ estado */
const KEYS = {
  global:   { v: 'v',   s: 's',   nv: 'nv',   top: 'top_global',   liveTop: 'top',          liveV: 'viewers',      liveS: 'streams' },
  portugal: { v: 'ppv', s: 'pps', nv: 'nvpp', top: 'top_portugal', liveTop: 'top_portugal', liveV: 'ptpt_viewers', liveS: 'ptpt_streams' },
  luso:     { v: 'pv',  s: 'ps',  nv: 'nvp',  top: 'top_pt',       liveTop: 'top_pt',       liveV: 'pt_viewers',   liveS: 'pt_streams' },
};
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
const params = new URLSearchParams(location.search);
const browserLang = (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
const RANGES = ['24', '48', '168', '720', 'all'];
const S = {
  src: [params.get('src'), store.get('src'), 'twitch'].find((x) => Object.prototype.hasOwnProperty.call(SRC_SETS, x || '')),
  lang: [params.get('lang'), store.get('lang'), browserLang].find((l) => l === 'pt' || l === 'en'),
  scope: [params.get('scope'), store.get('scope'), 'global'].find((x) => Object.prototype.hasOwnProperty.call(KEYS, x || '')),
  metric: 'v', range: [params.get('range'), store.get('range'), '168'].find((x) => RANGES.includes(x)),
  history: { points: [] }, latest: {}, live: null, liveOk: false, liveAt: null,
};
const T = () => I18N[S.lang];
function applySrc() { PLATFORMS.length = 0; PLATFORMS.push(...SRC_SETS[S.src]); }
applySrc();
const srcAll = () => S.src === 'all';
const t = (k) => { const v = T()[k]; return v && typeof v === 'object' && !Array.isArray(v) ? (v[S.scope] ?? v[S.metric]) : v; };

/* ============================================================ formatação */
const nf = (opts) => new Intl.NumberFormat(T().locale, opts);
const fmt = (n) => n == null || isNaN(n) ? '—' : nf({ maximumFractionDigits: 0 }).format(Math.round(n));
const fmtC = (n) => n == null || isNaN(n) ? '—' : (Math.abs(n) >= 1e5 ? nf({ notation: 'compact', maximumFractionDigits: 1 }).format(n) : fmt(n));
const pct = (a, b) => b ? nf({ style: 'percent', maximumFractionDigits: a / b < 0.1 ? 1 : 0 }).format(a / b) : '—';
const dt = (d, o) => new Date(d).toLocaleString(T().locale, o);
const hhmm = (d) => dt(d, { hour: '2-digit', minute: '2-digit' });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Só deixamos passar ligações e imagens HTTPS dos domínios das plataformas. Tudo o resto vira '#' ou é ignorado.
const LINK_HOSTS = ['twitch.tv', 'www.twitch.tv', 'clips.twitch.tv', 'kick.com', 'www.kick.com', 'youtube.com', 'www.youtube.com', 'youtu.be'];
const IMG_HOSTS = ['static-cdn.jtvnw.net', 'clips-media-assets2.twitch.tv', 'i.ytimg.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com', 'files.kick.com', 'images.kick.com'];
function cleanUrl(u, hosts) {
  try {
    const url = new URL(String(u || ''));
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.username || url.password) return null;
    return url.href.replace(/['"()\\\s<>`]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
  } catch { return null; }
}
const safeUrl = (u) => cleanUrl(u, LINK_HOSTS) || '#';
const safeImg = (u) => cleanUrl(u, IMG_HOSTS);

/* contador animado: só no número principal e nos destaques */
const tweens = new WeakMap();
function animate(el, to, f = fmtC) {
  if (to == null || isNaN(to)) { el.textContent = '—'; el.dataset.v = ''; return; }
  const from = Number(el.dataset.v) || 0; el.dataset.v = to;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { el.textContent = f(to); return; }
  const start = performance.now(), dur = from ? 600 : 1000;
  cancelAnimationFrame(tweens.get(el));
  const step = (now) => { const p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = f(from + (to - from) * e); if (p < 1) tweens.set(el, requestAnimationFrame(step)); };
  tweens.set(el, requestAnimationFrame(step));
}

/* ============================================================ dados */
const FLOW_F = ['si', 'so', 'psi', 'pso', 'ppsi', 'ppso'];
const points = () => S.history.points || [];
const lastPoint = () => points()[points().length - 1] || {};
const rangeStart = () => S.range === 'all' ? -Infinity : Date.now() - Number(S.range) * 3600e3;
// Para intervalos longos (7 dias ou mais) os pontos de 10 min são agregados à hora: gráficos mais legíveis e leves
function hourly(pts) {
  const out = new Map();
  for (const p of pts) {
    const h = Math.floor(Date.parse(p.ts) / 3600e3);
    const cur = out.get(h);
    if (!cur) { out.set(h, { ...p, n: 1 }); continue; }
    for (const k of ALL) {
      if (!p[k]) continue;
      if (!cur[k]) { cur[k] = { ...p[k] }; continue; }
      const m = { ...cur[k] };
      for (const f of ['v', 's', 'pv', 'ps', 'ppv', 'pps', 'dg', 'dt']) if (p[k][f] != null) m[f] = cur[k][f] != null ? Math.max(cur[k][f], p[k][f]) : p[k][f];
      for (const f of ['lg', 'sz', 'sv', 'psz', 'psv', 'ppsz', 'ppsv', 'ad', 'md', 'pad', 'pmd', 'ppad', 'ppmd']) if (p[k][f] != null) m[f] = p[k][f];
      for (const f of FLOW_F) if (p[k][f] != null) m[f] = (cur[k][f] || 0) + p[k][f];
      cur[k] = m;
    }
  }
  return [...out.values()];
}
const inRange = () => {
  const c = rangeStart(); let r = points().filter((p) => Date.parse(p.ts) >= c);
  if (!r.length) r = points().slice(-Math.max(2, Number(S.range) || 2));
  return S.range === '24' || S.range === '48' ? r : hourly(r);
};
function nowFor(p, field) {               // field: 'V' ou 'S'
  const k = KEYS[S.scope];
  const live = S.liveOk && S.live?.[p];
  if (live && p !== 'youtube') return live[field === 'V' ? k.liveV : k.liveS];
  const lp = [...points()].reverse().find((x) => x[p]);
  return lp ? lp[p][field === 'V' ? k.v : k.s] : null;
}
const totalNow = (f) => { const vals = PLATFORMS.map((p) => nowFor(p, f)); return vals.every((v) => v == null) ? null : vals.reduce((s, v) => s + (v || 0), 0); };
const totalOf = (pt, key) => { const vals = PLATFORMS.map((p) => pt[p]?.[key]).filter((v) => v != null); return vals.length ? vals.reduce((a, b) => a + b, 0) : null; };
const seriesTotal = (key) => points().map((pt) => totalOf(pt, key) || 0);
function hoursWatched(key) {
  const pts = points(); let h = 0;
  for (let i = 0; i < pts.length; i++) {
    const gap = i ? Math.min(2, (Date.parse(pts[i].ts) - Date.parse(pts[i - 1].ts)) / 3600e3) : 1;
    h += (totalOf(pts[i], key) || 0) * gap;
  }
  return h;
}
function leaderboard() {
  const k = KEYS[S.scope];
  const rows = [], liveSet = new Set();
  if (S.liveOk) for (const p of ['twitch', 'kick']) if (S.live[p] && PLATFORMS.includes(p)) { rows.push(...(S.live[p][k.liveTop] || [])); liveSet.add(p); }
  rows.push(...(S.latest[k.top] || []).filter((r) => !liveSet.has(r.platform) && PLATFORMS.includes(r.platform)));
  return rows.sort((a, b) => b.viewers - a.viewers).slice(0, 10);
}
function videoList() {
  const L = S.latest;
  if (S.scope === 'global') return L.top_videos || [];
  if (S.scope === 'luso') return L.top_videos_pt || [];
  const seen = new Set();
  return [...(L.videos_portugal || []), ...(L.top_videos_pt || []), ...(L.top_videos || [])].filter((v) => v.country === 'PT' && !seen.has(v.id) && seen.add(v.id)).sort((a, b) => b.views - a.views);
}
function forecastFor(key, fromTs = Date.now(), hours = 24) {
  const F = window.GTA_FORECAST; if (!F) return null;
  return F.forecast(points(), (p) => totalOf(p, key), fromTs, hours, LAUNCH.getTime());
}
function forecastPlatform(p, key) {
  const F = window.GTA_FORECAST; if (!F) return null;
  return F.forecast(points(), (pt) => pt[p]?.[key] ?? null, Date.parse(lastPoint().ts) + 1, 24, LAUNCH.getTime());
}

/* ============================================================ render */
function applyI18n() {
  document.documentElement.lang = S.lang;
  document.title = t('page_title');
  document.querySelector('meta[name=description]')?.setAttribute('content', t('page_desc'));
  document.querySelectorAll('[data-i]').forEach((el) => { const v = t(el.dataset.i); if (typeof v === 'string') el.textContent = v; });
  document.querySelectorAll('#scopeSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.scope === S.scope));
  document.querySelectorAll('#langSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === S.lang));
  document.querySelectorAll('#srcSeg button').forEach((b) => { const p = { twitch: 'twitch', kick: 'kick', all: 'youtube' }[b.dataset.src]; b.innerHTML = (b.dataset.src === 'twitch' ? '' : '+ ') + plat(p); b.setAttribute('aria-pressed', b.dataset.src === S.src); });
  document.querySelectorAll('.info-slot').forEach((el) => { el.innerHTML = infoBtn(el.dataset.info); });
  document.querySelectorAll('#metricSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.metric === S.metric));
  document.querySelectorAll('#rangeSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.range === String(S.range)));
  document.getElementById('method').innerHTML = T().method;
  const host = location.host || 'gta6-tracker';
  document.getElementById('footer').innerHTML = `${esc(t('made_by'))} <a href="${esc(AUTHOR_URL)}" target="_blank" rel="noopener">${esc(AUTHOR)}</a>. ${esc(T().footer)} <button type="button" class="linklike" id="noticeBtn">${esc(t('notice_link'))}</button>`;
  document.getElementById('noticeTitle').textContent = t('notice_title'); document.getElementById('noticeText').innerHTML = T().notice_text; document.getElementById('noticeOk').textContent = t('notice_ok');
  document.getElementById('byline').textContent = `${t('by')} ${AUTHOR}`;
  document.getElementById('authorName').textContent = AUTHOR; document.getElementById('authorLink').href = AUTHOR_URL;
  document.getElementById('printCredit').innerHTML = `<span>GTA VI Tracker. ${esc(t('credit_line'))} <b>${esc(AUTHOR)}</b>, ${esc(AUTHOR_URL.replace('https://www.', ''))}</span><span>${esc(host)}, ${esc(dt(Date.now(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}</span>`;
  document.getElementById('openCard').hidden = !(PUBLIC_DOWNLOADS || params.get('owner'));
}

function renderHero() {
  const k = KEYS[S.scope];
  const now = totalNow('V');
  document.getElementById('livePulse').className = 'pulse' + (S.liveOk ? '' : ' off');
  const lastTs = points().length ? lastPoint().ts : null;
  document.getElementById('liveLabel').textContent = S.liveOk ? `${t('status_live')} · ${PLATFORMS.map((p) => NAMES[p]).join(' · ')}` : `${t('status_off')}${lastTs ? ' · ' + dt(lastTs, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}`;
  animate(document.getElementById('heroViewers'), now);
  animate(document.getElementById('heroStreams'), totalNow('S'));
  document.getElementById('heroViewersLbl').textContent = (S.src === 'twitch' ? '' : t('at_least') + ' ') + t('hero_viewers');
  document.getElementById('scopeNote').innerHTML = esc(t('scope_note')) + (S.scope !== 'global' ? ' ' + infoBtn('portugal') : '');
  document.getElementById('srcNote').textContent = T().src_note[S.src];
  document.getElementById('heroSub').textContent = S.liveOk && S.liveAt ? T().live_ago(Math.floor((Date.now() - S.liveAt) / 60e3)) : lastTs ? T().live_off(hhmm(lastTs)) : '';
  renderHeroExtras(now);
  if (now != null) document.title = T().tab_title(fmtC(now));
  // mini gráfico das últimas 24 horas
  const since = Date.now() - 24 * 3600e3;
  const p24 = points().filter((p) => Date.parse(p.ts) >= since && totalOf(p, k.v) != null);
  document.getElementById('hcTitle').textContent = t('hc_title');
  if (p24.length > 1) {
    const ys = p24.map((p) => totalOf(p, k.v)), mx = Math.max(...ys);
    document.getElementById('hcPeak').textContent = T().hc_peak(fmtC(mx));
    const xs = p24.map((p) => Date.parse(p.ts));
    const o = baseLine([xs[0], xs[xs.length - 1]]);
    o.scales.x.ticks.callback = (v) => hhmm(v); o.scales.x.ticks.maxTicksLimit = 5;
    mkOrUpdate('heroChart', { type: 'line', data: { datasets: [{ label: t('viewers'), data: p24.map((p, i) => ({ x: xs[i], y: ys[i] })), borderColor: css('--sun-1'), backgroundColor: css('--sun-1') + '26', fill: true }] }, options: o });
  } else document.getElementById('hcPeak').textContent = '';
  const hist = seriesTotal(k.v);
  const best = Math.max(0, ...hist, (srcAll() && S.history.peaks?.[S.scope]?.v) || 0);
  const rec = document.getElementById('recordChip');
  rec.textContent = t('record'); rec.classList.toggle('on', S.liveOk && hist.length > 12 && now > best);
}

// variação face a ~1 hora atrás, fila dos maiores streamers e destaque de Portugal
function valueAgo(key, mins, from = Date.now()) {
  const target = from - mins * 60e3;
  let best = null, bd = Infinity;
  for (const p of points()) { const d = Math.abs(Date.parse(p.ts) - target); const v = totalOf(p, key); if (v != null && d < bd) { bd = d; best = v; } }
  return bd <= 25 * 60e3 ? best : null;
}
function liveRows(top) {
  const rows = [], liveSet = new Set(), k = KEYS[top];
  if (S.liveOk) for (const p of ['twitch', 'kick']) if (S.live[p] && PLATFORMS.includes(p)) { rows.push(...(S.live[p][k.liveTop] || [])); liveSet.add(p); }
  rows.push(...(S.latest[k.top] || []).filter((r) => !liveSet.has(r.platform) && PLATFORMS.includes(r.platform)));
  return rows.sort((a, b) => b.viewers - a.viewers);
}
const avHtml = (r, cls = '') => `<span class="avatar ${cls}" style="border-color:${COLOR[r.platform] || 'var(--border)'}">${safeImg(r.avatar) ? `<img src="${esc(safeImg(r.avatar))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : initials(r.name)}</span>`;
function renderHeroExtras(now) {
  const k = KEYS[S.scope];
  const d = document.getElementById('heroDelta');
  // compara pontos do histórico entre si (mesma fonte), para a variação ser coerente
  const lp = [...points()].reverse().find((p) => totalOf(p, k.v) != null);
  const lastTs = lp ? Date.parse(lp.ts) : null;
  const ago = lp && Date.now() - lastTs < 3 * 3600e3 ? valueAgo(k.v, 60, lastTs) : null;
  now = lp ? totalOf(lp, k.v) : null;
  if (now != null && ago) {
    const pct = (now - ago) / ago * 100, abs = Math.abs(pct);
    const txt = abs < 1 ? t('d1h_flat') : T().d1h(`${pct > 0 ? '+' : '−'}${nf({ maximumFractionDigits: abs < 10 ? 1 : 0 }).format(abs)}%`);
    d.className = 'delta ' + (abs < 1 ? 'flat' : pct > 0 ? 'up' : 'down');
    d.innerHTML = `<span aria-hidden="true">${abs < 1 ? '→' : pct > 0 ? '▲' : '▼'}</span> ${esc(txt)}`;
    d.title = `${fmt(ago)} → ${fmt(now)}`; d.hidden = false;
  } else d.hidden = true;
  const lb = leaderboard(), no1 = lb[0], top = lb.slice(1, 6);
  const tr = document.getElementById('heroTop');
  tr.hidden = !top.length;
  tr.innerHTML = top.length ? `<span class="ht-lbl">${esc(t('top_now'))}</span><span class="ht-list">${top.map((r) => `<a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener" class="ht-item" title="${esc(r.name)} · ${esc(fmt(r.viewers))} ${esc(t('viewers_s'))} · ${esc(NAMES[r.platform] || '')}">${avHtml(r, 'sm')}<span class="ht-n">${esc(r.name)}</span><span class="ht-v tnum">${fmtC(r.viewers)}</span></a>`).join('')}</span>` : '';
  const flag = { global: '🌍', portugal: '🇵🇹', luso: '🗣️' }[S.scope];
  document.getElementById('heroPt').innerHTML = no1
    ? `<a class="hp" href="${esc(safeUrl(no1.url))}" target="_blank" rel="noopener">${avHtml(no1)}<span class="hp-txt"><span class="hp-lbl">${flag} ${esc(t('no1'))}</span><span class="hp-n">${esc(no1.name)} <span class="tag">${plat(no1.platform)}</span></span><span class="hp-t" title="${esc(no1.title)}">${esc(no1.title)}</span></span><span class="hp-v"><b class="tnum">${fmt(no1.viewers)}</b><small>${esc(t('viewers_s'))}</small></span></a>`
    : `<div class="hp empty">${esc(t('pt_none'))}</div>`;
}

function renderNow() {
  const k = KEYS[S.scope];
  document.getElementById('nowTitle').textContent = t('now_title');
  document.getElementById('nowSub').textContent = t('now_sub');
  const tot = seriesTotal(k.v), now = totalNow('V');
  const stored = srcAll() ? S.history.peaks?.[S.scope] : null;
  let peak = Math.max(0, ...tot, now || 0), peakTs = points()[tot.indexOf(peak)]?.ts;
  if (stored && stored.v > peak) { peak = stored.v; peakTs = stored.ts; }
  const peakWhen = peakTs ? dt(peakTs, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t('live');
  let fourth;
  if (S.scope === 'global') {
    const rank = (S.liveOk && S.live.twitch?.rank) || [...points()].reverse().find((p) => p.twitch?.rank)?.twitch.rank;
    fourth = rank ? [t('k_rank'), rank, t('k_rank_note'), (n) => (S.lang === 'pt' ? 'nº ' : '#') + Math.max(1, Math.round(n))] : null;
  } else {
    const g = ALL.reduce((sum, p) => {
      if (S.liveOk && S.live?.[p] && p !== 'youtube') return sum + (S.live[p].viewers || 0);
      const lp = [...points()].reverse().find((x) => x[p]);
      return sum + (lp ? lp[p].v || 0 : 0);
    }, 0);
    fourth = [t('k_share'), now != null && g ? (now / g) : null, t('k_share_note'), (n) => pct(n, 1)];
  }
  const uniq = PLATFORMS.reduce((a, p) => a + (S.latest.unique_channels?.[p] || 0), 0);
  const tiles = [
    [t('k_peak'), peak || null, peakWhen],
    [t('k_hours'), hoursWatched(k.v) || null, t('k_hours_note'), null, 'hours'],
    [t('k_unique'), uniq || null, t('k_unique_note')],
    fourth || [t('k_streams'), totalNow('S'), t('k_streams_note')],
  ];
  const box = document.getElementById('kpis');
  if (box.children.length !== tiles.length) box.innerHTML = tiles.map(() => `<div class="kpi"><div class="label"></div><div class="value tnum"></div><div class="note"></div></div>`).join('');
  tiles.forEach(([l, v, n, f, info], i) => {
    const el = box.children[i];
    el.querySelector('.label').innerHTML = esc(l) + (info ? infoBtn(info) : ''); el.querySelector('.note').textContent = n || '';
    animate(el.querySelector('.value'), v, f || fmtC);
  });

  const pbox = document.getElementById('platforms');
  if (!pbox.children.length) pbox.innerHTML = CARDS.map((p) => `<div class="plat" data-p="${p}"><div class="top"><div class="name">${plat(p)}</div><span class="when"></span></div>
    <div><span class="value tnum"></span><span class="pct tnum"></span></div><div class="meta"></div><div class="spark"><canvas></canvas></div></div>`).join('');
  const sum = PLATFORMS.reduce((acc, p) => acc + (nowFor(p, 'V') || 0), 0);
  for (const p of CARDS) {
    const el = pbox.querySelector(`[data-p="${p}"]`);
    const v = nowFor(p, 'V'), st = nowFor(p, 'S');
    const isLive = S.liveOk && S.live[p] && p !== 'youtube';
    const w = el.querySelector('.when'); const lpp = [...points()].reverse().find((x) => x[p]); w.className = 'when' + (isLive ? ' live' : ''); w.textContent = isLive ? '● ' + t('live') : (lpp ? `${t('snap')} ${hhmm(lpp.ts)}` : '—');
    animate(el.querySelector('.value'), v);
    const counted = PLATFORMS.includes(p);
    el.classList.toggle('off', !counted);
    el.querySelector('.pct').textContent = counted ? (sum ? `${pct(v || 0, sum)} ${t('of_total')}` : '') : t('not_in_total');
    const tk = S.latest?.totals?.[p];
    const partial = p === 'kick' && tk && tk.complete === false;
    const lim = p === 'kick' ? (partial ? `${t('kick_partial')(fmt(tk.min_v || 0))}` : t('kick_full')) : t('all_streams');
    el.querySelector('.meta').innerHTML = `${esc(fmt(st))} ${st === 1 ? t('stream1') : t('streams')} · ${esc(lim)}${p === 'kick' ? infoBtn('kick') : ''}`;
    spark(el.querySelector('canvas'), p, inRange().map((pt) => pt[p]?.[k.v] ?? null));
  }

  const chips = [];
  const upd = S.history.updated && Date.now() - Date.parse(S.history.updated);
  if (upd && upd > 50 * 60e3) chips.push(`<span class="chip">${t('stale')}</span>`);
  for (const e of [...(S.latest.errors || []), ...((S.liveOk && S.live.errors) || [])]) chips.push(`<span class="chip" title="${esc(e)}">${esc(e.split(':')[0])}: ${t('err')}</span>`);
  document.getElementById('statusChips').innerHTML = [...new Set(chips)].join('');
}

/* ============================================================ gráficos */
Chart.defaults.color = css('--text-secondary');
Chart.defaults.borderColor = css('--grid');
Chart.defaults.font.family = css('--sans');
Chart.defaults.font.size = 12.5;
Chart.defaults.plugins.legend.display = false;
Object.assign(Chart.defaults.plugins.tooltip, {
  backgroundColor: '#0a0910', borderColor: css('--border'), borderWidth: 1, padding: 12, cornerRadius: 10,
  titleColor: css('--text-primary'), bodyColor: css('--text-secondary'), usePointStyle: true, boxPadding: 5, titleFont: { weight: '600' },
});
const launchLine = { id: 'launch', afterDatasetsDraw(ch) {
  const x = ch.scales.x; if (!x || x.type !== 'linear') return;
  const px = x.getPixelForValue(LAUNCH.getTime()); const { top, bottom, left, right } = ch.chartArea;
  if (px < left || px > right) return;
  const g = ch.ctx; g.save(); g.strokeStyle = css('--text-muted'); g.setLineDash([4, 4]); g.lineWidth = 1;
  g.beginPath(); g.moveTo(px, top); g.lineTo(px, bottom); g.stroke(); g.setLineDash([]);
  g.fillStyle = css('--text-secondary'); g.font = `600 12px ${css('--sans')}`;
  const lbl = `${S.lang === 'pt' ? 'Lançamento' : 'Launch'} ${dt(LAUNCH, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
  const w = g.measureText(lbl).width, flip = px + 6 + w > right; g.textAlign = flip ? 'right' : 'left'; g.fillText(lbl, flip ? px - 6 : px + 6, top + 12); g.restore();
} };
const tickFor = (xs) => { const span = xs.length > 1 ? xs[xs.length - 1] - xs[0] : 0;
  return (v) => dt(v, span <= 30 * 3600e3 ? { hour: '2-digit', minute: '2-digit' } : span <= 4 * 86400e3 ? { day: 'numeric', month: 'short', hour: '2-digit' } : { day: 'numeric', month: 'short' }); };
const timeTick = (v) => { const span = (Number(S.range) || 999) <= 48; return dt(v, span ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }); };
const charts = {};
function mkOrUpdate(id, cfg) {
  if (!document.getElementById(id)) return null;
  if (charts[id]) { charts[id].data = cfg.data; charts[id].options = cfg.options; charts[id].update('none'); return charts[id]; }
  return charts[id] = new Chart(document.getElementById(id), cfg);
}
function spark(canvas, p, data) {
  const key = 'spark_' + p;
  const cfg = { type: 'line', data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: COLOR[p], borderWidth: 2, pointRadius: 0, tension: .3, fill: true, backgroundColor: COLOR[p] + '1f' }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, spanGaps: true, plugins: { tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false, beginAtZero: true } } } };
  if (charts[key]) { charts[key].data = cfg.data; charts[key].update('none'); } else charts[key] = new Chart(canvas, cfg);
}
const baseLine = (xs, extra = {}) => ({ responsive: true, maintainAspectRatio: false, parsing: false, spanGaps: 3 * 3600e3, animation: false,
  interaction: { mode: 'nearest', axis: 'x', intersect: false },
  elements: { point: { radius: 0, hoverRadius: 5, hitRadius: 10, hoverBorderWidth: 2, hoverBorderColor: css('--surface-1') }, line: { borderWidth: 2, tension: .25 } },
  plugins: { tooltip: { callbacks: { title: (it) => dt(it[0].parsed.x, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), label: (c) => ` ${c.dataset.label}: ${fmt(c.parsed.y)}` } } },
  scales: { x: { type: 'linear', min: xs[0], max: xs[xs.length - 1], grid: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, callback: tickFor(xs) } },
            y: { beginAtZero: true, border: { display: false }, ticks: { callback: (v) => nf({ notation: 'compact', maximumFractionDigits: 1 }).format(v) } } }, ...extra });

function renderCharts() {
  const k = KEYS[S.scope], key = S.metric === 'v' ? k.v : k.s;
  const pts = inRange();
  const xs = pts.map((p) => Date.parse(p.ts));
  // previsão por plataforma (linha tracejada), só para espectadores e intervalos até 7 dias
  const showFc = S.metric === 'v' && S.range !== 'all' && Number(S.range) <= 168;
  const fcs = showFc ? Object.fromEntries(PLATFORMS.map((p) => [p, forecastPlatform(p, key)])) : {};
  const anyFc = Object.values(fcs).some(Boolean);
  const fcEnd = anyFc ? Math.max(...Object.values(fcs).filter(Boolean).map((f) => f[f.length - 1].ts)) : null;
  document.getElementById('tsLegend').innerHTML = PLATFORMS.map((p) => `<span>${plat(p)}</span>`).join('') + (anyFc ? `<span><i class="fc"></i>${t('forecast')}</span>` : '');
  const ds = PLATFORMS.map((p) => ({ label: NAMES[p], data: pts.map((pt, i) => ({ x: xs[i], y: pt[p]?.[key] ?? null })), borderColor: COLOR[p], backgroundColor: COLOR[p] }));
  for (const p of PLATFORMS) if (fcs[p]) {
    const lastReal = pts.length && pts[pts.length - 1][p]?.[key];
    ds.push({ label: `${NAMES[p]} (${t('forecast')})`, data: [...(lastReal != null ? [{ x: xs[xs.length - 1], y: lastReal }] : []), ...fcs[p].map((f) => ({ x: f.ts, y: f.v }))],
      borderColor: COLOR[p], backgroundColor: COLOR[p], borderDash: [5, 4], borderWidth: 1.5 });
  }
  mkOrUpdate('tsChart', { type: 'line', plugins: [launchLine], data: { datasets: ds }, options: baseLine(xs.concat(fcEnd ? [fcEnd] : [])) });

  // frase sobre o intervalo escolhido
  const tot = pts.map((pt) => totalOf(pt, k.v) || 0);
  if (tot.length > 1) {
    const mx = Math.max(...tot), i = tot.indexOf(mx), first = tot.find((v) => v > 0) || 0, lastV = tot[tot.length - 1];
    const ch = first ? (lastV - first) / first : 0;
    const when = dt(pts[i].ts, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    document.getElementById('tsInsight').innerHTML = S.lang === 'pt'
      ? `Neste período, o pico foi de <b>${fmt(mx)}</b> pessoas a ver ao mesmo tempo, ${esc(when)}. ${Math.abs(ch) > 0.05 ? `Desde o início do período, a audiência ${ch > 0 ? 'subiu' : 'desceu'} <b>${pct(Math.abs(ch), 1)}</b>.` : 'A audiência está estável face ao início do período.'}`
      : `In this period, the peak was <b>${fmt(mx)}</b> people watching at once, on ${esc(when)}. ${Math.abs(ch) > 0.05 ? `Since the start of the period, the audience is ${ch > 0 ? 'up' : 'down'} <b>${pct(Math.abs(ch), 1)}</b>.` : 'The audience is flat compared with the start of the period.'}`;
  } else document.getElementById('tsInsight').textContent = '';
  document.getElementById('tsH2').textContent = T().ts_h2[S.metric];

  const langs = Object.entries(S.latest.languages || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const dn = (() => { try { return new Intl.DisplayNames([T().locale], { type: 'language' }); } catch { return null; } })();
  const lname = (c) => { try { const n = dn?.of(c); return n ? n[0].toUpperCase() + n.slice(1) : c; } catch { return c; } };
  const highlight = S.scope !== 'global';
  mkOrUpdate('langChart', {
    type: 'bar',
    data: { labels: langs.map(([c]) => lname(c)), datasets: [{ label: t('viewers'), data: langs.map(([, v]) => v),
      backgroundColor: langs.map(([c]) => (highlight && c !== 'pt') ? COLOR.twitch + '55' : COLOR.twitch), borderRadius: 3, borderSkipped: 'start', maxBarThickness: 20 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { tooltip: { callbacks: { label: (c) => ` ${fmt(c.parsed.x)} ${t('viewers')}` } } },
      scales: { x: { beginAtZero: true, border: { display: false }, ticks: { callback: (v) => fmtC(v) } }, y: { grid: { display: false } } } },
  });
}

/* ============================================================ previsões */
function renderForecast() {
  const k = KEYS[S.scope];
  const fromTs = points().length ? Date.parse(lastPoint().ts) + 1 : Date.now();
  const f = forecastFor(k.v, fromTs, 24);
  const F = window.GTA_FORECAST;
  if (!f) {
    document.getElementById('fcInsight').textContent = t('fc_wait');
  } else {
    const pk = F.peakOf(f);
    document.getElementById('fcInsight').innerHTML = T().fc_insight(fmt(pk.v), esc(hhmm(pk.ts)), esc(dt(pk.ts, { weekday: 'long' })))
      + (f.partial ? ` <span class="fc-note">${esc(S.lang === 'pt' ? 'Previsão provisória: ainda há menos de 24 h de dados desde o lançamento. As horas que ainda não vimos ficam ao nível das últimas 3 horas.' : 'Provisional forecast: there are under 24 hours of data since launch. Hours we have not seen yet stay at the level of the last 3 hours.')}</span>` : '');
  }
  // histórico de previsões vs real
  const days = Object.entries(S.predictions?.days || {}).sort((a, b) => b[0].localeCompare(a[0]));
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date());
  const rows = days.filter(([d]) => d < today).slice(0, 7).map(([d, e]) => {
    const p = e[S.scope]; if (!p) return '';
    const dayPts = points().filter((pt) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date(pt.ts)) === d);
    if (!dayPts.length) return '';
    const vals = dayPts.map((pt) => totalOf(pt, k.v) || 0), mx = Math.max(...vals), at = dayPts[vals.indexOf(mx)].ts;
    const err = mx ? (p.peak - mx) / mx : 0;
    const label = new Date(d + 'T12:00:00Z').toLocaleDateString(T().locale, { weekday: 'short', day: 'numeric', month: 'short' });
    return `<tr><td>${esc(label)}</td><td class="r">${fmt(p.peak)} <span style="color:var(--text-muted)">${hhmm(p.at)}</span></td><td class="r">${fmt(mx)} <span style="color:var(--text-muted)">${hhmm(at)}</span></td><td class="r ${Math.abs(err) <= 0.15 ? 'err-good' : 'err-bad'}">${err > 0 ? '+' : ''}${nf({ style: 'percent', maximumFractionDigits: 0 }).format(err)}</td></tr>`;
  }).filter(Boolean);
  const th = T().fc_th;
  document.getElementById('fcTable').innerHTML = rows.length
    ? `<table class="fc-table"><thead><tr><th>${th[0]}</th><th class="r">${th[1]}</th><th class="r">${th[2]}</th><th class="r">${th[3]}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`
    : `<div class="empty">${t('fc_none')}</div>`;
}

/* ============================================================ listas */
function initials(n) { return esc(String(n || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?'); }
function renderBoard() {
  document.getElementById('boardTitle').textContent = t('board_title');
  document.getElementById('boardDesc').textContent = t('board_desc');
  const rows = leaderboard();
  document.getElementById('board').innerHTML = rows.length ? rows.map((r, i) => {
    const mins = r.started_at ? Math.max(0, (Date.now() - Date.parse(r.started_at)) / 60e3) : null;
    const dur = mins == null ? '' : mins >= 60 ? `${Math.floor(mins / 60)} h ${String(Math.floor(mins % 60)).padStart(2, '0')}` : `${Math.floor(mins)} min`;
    return `<a class="row" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">
      <span class="rank">${i + 1}</span>
      <span class="avatar" style="border-color:${COLOR[r.platform] || 'var(--border)'}">${safeImg(r.avatar) ? `<img src="${esc(safeImg(r.avatar))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : initials(r.name)}</span>
      <span class="who"><span class="n">${esc(r.name)} ${r.portugal ? '<span class="tag pt">PT</span>' : ''}<span class="tag">${plat(r.platform)}</span></span><span class="t" title="${esc(r.title)}">${esc(r.title)}</span></span>
      <span class="viewers">${fmt(r.viewers)}<small>${dur || t('viewers')}</small></span></a>`;
  }).join('') : `<div class="empty">${t('board_empty')}</div>`;

  document.getElementById('vidTitle').textContent = t('vid_title');
  document.getElementById('vidDesc').textContent = t('vid_desc');
  const vids = videoList().slice(0, 8);
  document.getElementById('videos').innerHTML = vids.length ? vids.map((v) => `<a class="video" href="${esc(safeUrl(v.url))}" target="_blank" rel="noopener">
      <div class="th" style="${safeImg(v.thumb) ? `background-image:url(&quot;${esc(safeImg(v.thumb))}&quot;)` : ''}"><b class="tnum">${fmtC(v.views)}</b></div>
      <div class="vt">${esc(v.title)}</div><div class="vc">${esc(v.channel)}${v.country === 'PT' ? ' <span class="tag pt">PT</span>' : ''}, ${fmt(v.views)} ${t('views')}</div></a>`).join('')
    : `<div class="empty" style="grid-column:1/-1">${t('no_videos')}</div>`;
}

/* ============================================================ YouTube (secção própria) */
function liveRow(r, i) {
  const mins = r.started_at ? Math.max(0, (Date.now() - Date.parse(r.started_at)) / 60e3) : null;
  const dur = mins == null ? '' : mins >= 60 ? `${Math.floor(mins / 60)} h ${String(Math.floor(mins % 60)).padStart(2, '0')}` : `${Math.floor(mins)} min`;
  return `<a class="row" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">
      <span class="rank">${i + 1}</span>
      <span class="avatar" style="border-color:${COLOR[r.platform] || 'var(--border)'}">${safeImg(r.avatar) ? `<img src="${esc(safeImg(r.avatar))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : initials(r.name)}</span>
      <span class="who"><span class="n">${esc(r.name)} ${r.portugal ? '<span class="tag pt">PT</span>' : ''}</span><span class="t" title="${esc(r.title)}">${esc(r.title)}</span></span>
      <span class="viewers">${fmt(r.viewers)}<small>${dur || t('viewers')}</small></span></a>`;
}
function renderYoutube() {
  const k = KEYS[S.scope];
  document.getElementById('ytH2').innerHTML = `<span style="display:inline-flex;align-items:center;gap:10px">${plat('youtube', false).replace('width="16" height="16"', 'width="16" height="16"')}YouTube</span>`;
  document.getElementById('ytSub').textContent = t('yt_sub');
  document.getElementById('ytLiveT').textContent = t('yt_live_title');
  document.getElementById('ytLiveD').textContent = T().yt_live_desc(S.latest?.totals?.youtube?.min_v ? fmt(S.latest.totals.youtube.min_v) : '');
  document.getElementById('ytBoardT').textContent = t('yt_board');
  const reads = points().filter((p) => p.youtube && !p.youtube.c);
  const last = reads[reads.length - 1];
  const tiles = [
    [t('yt_k_viewers'), last ? fmt(last.youtube[k.v]) : '—', last && S.latest?.totals?.youtube?.min_v ? t('yt_partial')(fmt(S.latest.totals.youtube.min_v)) : (last ? t('top50') : ''), 'yt_live'],
    [t('yt_k_lives'), last ? fmt(last.youtube[k.s]) : '—', S.scope === 'global' ? t('top50') : '', null],
    [t('yt_k_read'), last ? hhmm(last.ts) : '—', t('hourly'), 'yt_hourly'],
  ];
  document.getElementById('ytKpis').innerHTML = tiles.map(([l, v, n, info]) => `<div class="kpi"><div class="label">${esc(l)}${info ? infoBtn(info) : ''}</div><div class="value tnum">${esc(v)}</div><div class="note">${esc(n || '')}</div></div>`).join('');
  const yp = reads.filter((p) => Date.parse(p.ts) >= rangeStart());
  mkOrUpdate('ytLive', {
    type: 'line', plugins: [launchLine],
    data: { datasets: [{ label: t('viewers'), data: yp.map((p) => ({ x: Date.parse(p.ts), y: p.youtube[k.v] })), borderColor: COLOR.youtube, backgroundColor: COLOR.youtube + '22', fill: true, pointRadius: 3, pointHoverRadius: 6 }] },
    options: { ...baseLine(yp.length ? [Date.parse(yp[0].ts), Date.parse(yp[yp.length - 1].ts)] : [0, 1]), spanGaps: true },
  });
  const rows = (S.latest.youtube_live || []).filter((r) => S.scope === 'global' || (S.scope === 'luso' ? r.lang === 'pt' : r.portugal)).slice(0, 8);
  document.getElementById('ytBoard').innerHTML = rows.length ? rows.map(liveRow).join('') : `<div class="empty">${t('yt_board_empty')}</div>`;
  document.getElementById('ytDisc').textContent = t('yt_disc');
}

/* ============================================================ entradas e saídas de streams */
function renderFlow() {
  const pt = S.lang === 'pt', L = (x, y) => (pt ? x : y);
  const keys = { global: ['si', 'so', 's'], luso: ['psi', 'pso', 'ps'], portugal: ['ppsi', 'ppso', 'pps'] }[S.scope];
  document.getElementById('flowT').textContent = t('flow_title');
  const kFt = PLATFORMS.includes('kick') ? [...points()].reverse().find((p) => p.kick?.ft)?.kick.ft : null;
  document.getElementById('flowD').textContent = t('flow_desc') + (kFt ? L(`. Na Kick (só top 100) contam só canais com ${fmt(kFt)}+ espectadores.`, `. On Kick (top 100 only), only channels with ${fmt(kFt)}+ viewers count.`) : '');
  const pts = points().filter((p) => Date.parse(p.ts) >= rangeStart());
  const byH = new Map();
  for (const p of pts) {
    let has = false, i = 0, o = 0;
    for (const pl of ['twitch', 'kick']) if (PLATFORMS.includes(pl) && p[pl]?.[keys[0]] != null) { has = true; i += p[pl][keys[0]]; o += p[pl][keys[1]] || 0; }
    if (!has) continue;
    const h = Math.floor(Date.parse(p.ts) / 3600e3) * 3600e3, e = byH.get(h) || { i: 0, o: 0, n: 0 };
    e.i += i; e.o += o; e.n++; byH.set(h, e);
  }
  const hs = [...byH.keys()].sort((a, b) => a - b);
  // última hora (as recolhas dos últimos ~60 min com dados)
  const refTs = points().length ? Date.parse(lastPoint().ts) : Date.now();
  const recent = points().filter((p) => refTs - Date.parse(p.ts) <= 55 * 60e3);
  let ri = 0, ro = 0, rn = 0;
  for (const p of recent) for (const pl of ['twitch', 'kick']) if (PLATFORMS.includes(pl) && p[pl]?.[keys[0]] != null) { ri += p[pl][keys[0]]; ro += p[pl][keys[1]] || 0; rn++; }
  const live = ['twitch', 'kick'].filter((pl) => PLATFORMS.includes(pl)).reduce((a, pl) => a + (lastPoint()?.[pl]?.[keys[2]] || 0), 0);
  const UP = '#3987e5', DOWN = '#e8864a';
  const side = document.getElementById('flowSide');
  side.innerHTML = rn ? `<div class="fh">${L('Na última hora', 'In the last hour')}</div>
    <div class="fs"><span class="ic" style="color:${UP}">↑</span><span class="n tnum">${fmt(ri)}</span><span class="l">${L('começaram a transmitir', 'started streaming')}</span></div>
    <div class="fs"><span class="ic" style="color:${DOWN}">↓</span><span class="n tnum">${fmt(ro)}</span><span class="l">${L('terminaram', 'stopped')}</span></div>
    <div class="fs net"><span class="ic">=</span><span class="n tnum">${ri - ro >= 0 ? '+' : '−'}${fmt(Math.abs(ri - ro))}</span><span class="l">${live && ri ? L(`saldo · ${Math.round(ri / live * 100)}% dos ${fmt(live)} em direto começaram nesta hora`, `net · ${Math.round(ri / live * 100)}% of the ${fmt(live)} live started this hour`) : L('saldo de canais em direto', 'net change in live channels')}</span></div>`
    : `<div class="fh">${esc(t('flow_wait'))}</div>`;
  document.getElementById('flowChart').parentElement.hidden = !hs.length;
  // só horas completas para os destaques (a hora atual ainda está a meio)
  const full = hs.filter((h) => byH.get(h).n >= 5);
  const bi = full.length ? full.reduce((m, h) => (byH.get(h).i > byH.get(m).i ? h : m)) : null;
  const bo = full.length ? full.reduce((m, h) => (byH.get(h).o > byH.get(m).o ? h : m)) : null;
  const hh = (h) => dt(h, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  document.getElementById('flowInsight').innerHTML = full.length >= 2
    ? L(`A hora com mais estreias foi <b>${esc(hh(bi))}</b> (${fmt(byH.get(bi).i)} canais a começar). A que mais canais perdeu foi <b>${esc(hh(bo))}</b> (${fmt(byH.get(bo).o)} a terminar).`,
        `The busiest hour for new streams was <b>${esc(hh(bi))}</b> (${fmt(byH.get(bi).i)} started). The most channels stopped at <b>${esc(hh(bo))}</b> (${fmt(byH.get(bo).o)} ended).`)
    : '';
  if (!hs.length) return;
  document.getElementById('flowLegend').innerHTML = `<span><i class="dot" style="background:${UP}"></i>${esc(t('flow_in'))}</span><span><i class="dot" style="background:${DOWN}"></i>${esc(t('flow_out'))}</span><span><i class="dot" style="background:var(--text-primary)"></i>${esc(L('Saldo', 'Net'))}</span>`;
  const cur = (h) => byH.get(h).n < 5;   // hora ainda a decorrer: mais clara
  const alpha = (c, h) => (cur(h) ? c + '66' : c);
  mkOrUpdate('flowChart', {
    type: 'bar', plugins: [launchLine],
    data: { datasets: [
      { label: t('flow_in'), data: hs.map((h) => ({ x: h, y: byH.get(h).i })), backgroundColor: hs.map((h) => alpha(UP, h)), borderRadius: 4, borderSkipped: false, maxBarThickness: 22, stack: 'f', order: 2 },
      { label: t('flow_out'), data: hs.map((h) => ({ x: h, y: -byH.get(h).o })), backgroundColor: hs.map((h) => alpha(DOWN, h)), borderRadius: 4, borderSkipped: false, maxBarThickness: 22, stack: 'f', order: 2 },
      { type: 'line', label: L('Saldo', 'Net'), data: hs.map((h) => ({ x: h, y: byH.get(h).i - byH.get(h).o })), showLine: false, pointRadius: 4.5, pointHoverRadius: 6, pointBackgroundColor: '#f3f1f7', pointBorderColor: '#17151f', pointBorderWidth: 2, order: 1 },
    ] },
    options: { responsive: true, maintainAspectRatio: false, parsing: false, animation: false, interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        title: (it) => dt(it[0].parsed.x, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + (cur(it[0].parsed.x) ? L(' (em curso)', ' (in progress)') : ''),
        label: (c) => c.datasetIndex === 2 ? ` ${c.dataset.label}: ${c.parsed.y >= 0 ? '+' : '−'}${fmt(Math.abs(c.parsed.y))}` : ` ${c.dataset.label}: ${fmt(Math.abs(c.parsed.y))}` } } },
      scales: { x: { type: 'linear', stacked: true, offset: true, min: hs[0] - 1800e3, max: hs[hs.length - 1] + 1800e3, grid: { display: false },
                  // marcas só nas horas certas (no máximo ~7)
                  afterBuildTicks: (ax) => { const k = Math.max(1, Math.ceil(hs.length / 7)); ax.ticks = hs.filter((_, i) => i % k === 0).map((value) => ({ value })); },
                  ticks: { maxRotation: 0, autoSkip: false, callback: tickFor(hs) } },
                y: { stacked: true, border: { display: false }, grid: { color: (c) => (c.tick.value === 0 ? '#4a4658' : '#26232f') }, ticks: { callback: (v) => fmtC(Math.abs(v)) } } } },
  });
}

/* ============================================================ contagem decrescente */
/* ============================================================ imagem para o LinkedIn */
function cardSpark(vals, t0, t1) {
  if (vals.length < 3) return '';
  t0 ??= Date.parse(points()[0].ts); t1 ??= Date.parse(points()[points().length - 1].ts);
  const W = 928, H = 130, max = Math.max(...vals) || 1;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * W, H - 4 - (v / max) * (H - 10)]);
  const d = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  // marcas de tempo gerais (início, meio e fim), na hora local de quem descarrega
  const tick = (f) => dt(t0 + (t1 - t0) * f, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const ticks = [[0, 'start'], [0.5, 'middle'], [1, 'end']].map(([f, a]) => `<text x="${f * W}" y="${H + 30}" text-anchor="${a}" fill="#8c8799" font-size="19">${esc(tick(f))}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H + 36}" width="${W}" height="${H + 36}" style="margin-top:24px;overflow:visible">
    <defs><linearGradient id="scg" x1="0" x2="1"><stop offset="0" stop-color="#6c4bff"/><stop offset=".55" stop-color="#ff4f9a"/><stop offset="1" stop-color="#ffc95c"/></linearGradient>
    <linearGradient id="scf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff4f9a" stop-opacity=".28"/><stop offset="1" stop-color="#ff4f9a" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L ${W} ${H} L 0 ${H} Z" fill="url(#scf)"/><path d="${d}" fill="none" stroke="url(#scg)" stroke-width="4" stroke-linejoin="round"/>
    <line x1="0" x2="${W}" y1="${H}" y2="${H}" stroke="#2b2836"/>${ticks}
  </svg>`;
}
function cardFoot(extra) {
  return `<div class="sc-foot"><span style="display:flex;align-items:center;gap:16px;color:var(--text-primary);font-size:24px"><span class="sc-mono">DR</span><span>${esc(t('credit_line'))} <b>${esc(AUTHOR)}</b><br><span style="color:var(--text-muted);font-size:20px">${esc(AUTHOR_URL.replace('https://www.', ''))}</span></span></span><span style="text-align:right">${esc(location.host || 'gta6-tracker')}<br>${esc(extra)}</span></div>`;
}
function buildCard() {
  if (S.cardMode === 'first24' && window.buildCard24) return window.buildCard24();
  const k = KEYS[S.scope], pt = S.lang === 'pt';
  const tot = seriesTotal(k.v), now = totalNow('V') || 0;
  // pico (inclui o recorde guardado, que não se perde com a compactação)
  const stored = srcAll() ? S.history.peaks?.[S.scope] : null;
  let peak = Math.max(0, ...tot, now), peakTs = points()[tot.indexOf(peak)]?.ts || null;
  if (stored && stored.v > peak) { peak = stored.v; peakTs = stored.ts; }
  const when = peakTs ? dt(peakTs, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  // top de sempre (recordes por streamer), não o top deste momento
  const inScope = (r) => PLATFORMS.includes(r.platform) && (S.scope === 'global' || (S.scope === 'luso' ? r.lang === 'pt' : !!r.portugal));
  const rows = Object.values(S.hall?.all || {}).filter(inScope).sort((x, y) => y.peak - x.peak).slice(0, 5);
  const uniq = PLATFORMS.reduce((a, p) => a + (S.latest.unique_channels?.[p] || 0), 0);
  const rank = S.scope === 'global' ? ((S.liveOk && S.live.twitch?.rank) || [...points()].reverse().find((p) => p.twitch?.rank)?.twitch.rank) : null;
  const ptNow = (() => { const lp = lastPoint(); const v = PLATFORMS.reduce((a, p) => a + (lp[p]?.pv || 0), 0), g = PLATFORMS.reduce((a, p) => a + (lp[p]?.v || 0), 0); return g ? v / g : null; })();
  const tiles = [
    [fmtC(now), t('k_now')],
    [fmtC(hoursWatched(k.v)), t('k_hours')],
    [fmtC(totalNow('S')), t('k_streams')],
    uniq ? [fmtC(uniq), t('k_unique')] : null,
    rank ? [(pt ? 'nº ' : '#') + rank, pt ? 'jogo mais visto na Twitch' : 'most watched game on Twitch'] : null,
    S.scope === 'global' && ptNow ? [pct(ptNow, 1), pt ? 'a ver em português' : 'watching in Portuguese'] : null,
  ].filter(Boolean).slice(0, 6);
  const stamp = dt(Date.now(), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  document.getElementById('shareCard').innerHTML = `
    <div class="sc-eyebrow"><i class="pulse"></i>${esc(t('sc_eyebrow'))}</div>
    <div class="sc-title" style="font-size:100px;margin:14px 0 2px"><span class="grad">GTA VI</span></div>
    <div class="sc-sub">${esc(PLATFORMS.map((p) => NAMES[p]).join(', '))}${S.src === 'twitch' ? '' : ' (' + esc(t('at_least')) + ')'}</div>
    <div class="sc-hero" style="margin-top:18px"><div class="n tnum" style="font-size:112px">${fmt(peak)}</div><div class="l">${esc(t('sc_peak'))}${when ? ` · ${esc(when)}` : ''}</div></div>
    <div class="sc-grid" style="margin-top:20px;gap:14px">${tiles.map(([n, l]) => `<div class="sc-tile" style="padding:16px 20px"><div class="n tnum" style="font-size:42px">${esc(n)}</div><div class="l">${esc(l)}</div></div>`).join('')}</div>
    ${cardSpark(tot)}
    <div class="sc-top" style="margin-top:14px;gap:8px"><div style="font-size:21px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.14em;font-weight:600">${esc(pt ? 'Recordes por streamer (desde sempre)' : 'Streamer records (all time)')}</div>
      ${rows.map((r, i) => `<div class="r" style="font-size:24px;padding-bottom:7px"><span><b style="color:var(--text-muted);font-weight:500">${i + 1}</b> ${esc(r.name)} <span style="font-size:19px;color:var(--text-muted);display:flex;align-items:center;gap:8px"><i class="dot" style="background:${COLOR[r.platform]};width:12px;height:12px"></i>${NAMES[r.platform]} · ${esc(dt(r.at, { day: 'numeric', month: 'short' }))}</span></span><span class="tnum">${fmt(r.peak)}</span></div>`).join('')}</div>
    ${cardFoot(stamp)}`;
}
function fitCard() { const box = document.getElementById('cardScale'); document.getElementById('shareCard').style.transform = `scale(${box.clientWidth / 1080})`; }
async function downloadCard() {
  const btn = document.getElementById('dlCard'); const label = btn.textContent; btn.textContent = t('downloading'); btn.disabled = true;
  try {
    if (!window.htmlToImage) await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'vendor/html-to-image.js'; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
    const node = document.getElementById('shareCard'); const prev = node.style.transform; node.style.transform = 'none';
    const url = await htmlToImage.toPng(node, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true });
    node.style.transform = prev;
    const a = document.createElement('a'); a.href = url; a.download = `gta6-tracker-duarte-rodrigues-${S.scope}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.png`; a.click();
  } catch (e) { alert(t('cant_render')); }
  finally { btn.textContent = label; btn.disabled = false; fitCard(); }
}

/* ============================================================ carregamento */
async function getJSON(url) { const r = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' }); if (!r.ok) throw new Error(r.status); return r.json(); }
// Os dados vêm de /api/data (branch "data" do GitHub); se não existir, usa os ficheiros estáticos em /data/
// Cada ficheiro é tratado à parte: um ficheiro que ainda não existe (ex.: previsões nas primeiras 24 h) não pode
// fazer o site trocar os dados ao vivo pela cópia estática antiga. Nunca se substitui o que já está carregado por algo mais velho.
// 3 caminhos, por ordem: /api/data (Vercel) → branch "data" diretamente no GitHub → ficheiro estático.
const DATA_REPO = /^[\w.-]+\/[\w.-]+$/.test(CFG.dataRepo || '') ? CFG.dataRepo : 'dragonduarte/gta6tracker';
async function getData(name) {
  try { return await getJSON(`api/data?f=${name}`); } catch { /* tenta o próximo */ }
  try { const r = await fetch(`https://raw.githubusercontent.com/${DATA_REPO}/data/public/data/${name}.json?t=${Math.floor(Date.now() / 60e3)}`, { credentials: 'omit' }); if (r.ok) return await r.json(); } catch { /* tenta o próximo */ }
  return getJSON(`data/${name}.json`);
}
const newer = (a, b) => !b || !b.updated || (a && a.updated && Date.parse(a.updated) >= Date.parse(b.updated));
async function loadHistory() {
  const [h, l, f, p] = await Promise.allSettled([getData('history'), getData('latest'), getData('hall'), getData('predictions')]);
  if (h.status === 'fulfilled' && (h.value.points || []).length && newer(h.value, S.history)) S.history = h.value;
  if (l.status === 'fulfilled' && newer(l.value, S.latest)) S.latest = l.value;
  if (f.status === 'fulfilled') S.hall = f.value;
  if (p.status === 'fulfilled') S.predictions = p.value;
}
async function loadLive() {
  try { const j = await getJSON('api/live'); S.live = j; S.liveOk = !!(j.twitch || j.kick); if (S.liveOk) S.liveAt = Date.parse(j.ts) || Date.now(); }
  catch { S.liveOk = false; }
}
function renderAll() {
  applyI18n(); renderHero(); renderVisitors();
  const empty = !points().length && !S.liveOk;
  document.querySelector('main').classList.toggle('nodata', empty);
  if (empty) { document.getElementById('kpis').innerHTML = `<div class="empty" style="grid-column:1/-1">${t('no_data')}</div>`; return; }
  renderNow();
  renderCharts(); renderForecast(); renderBoard(); renderYoutube(); renderFlow();
  try { window.renderExtras?.(); } catch (e) { console.error('extras', e); }
  if (document.getElementById('modal').classList.contains('open')) { buildCard(); fitCard(); }
}
function setState(patch) {
  Object.assign(S, patch);
  store.set('lang', S.lang); store.set('scope', S.scope); store.set('range', S.range); store.set('src', S.src); applySrc();
  const u = new URL(location.href); u.searchParams.set('lang', S.lang); u.searchParams.set('scope', S.scope); u.searchParams.set('range', S.range); u.searchParams.set('src', S.src); history.replaceState(null, '', u);
  if ('scope' in patch || 'lang' in patch || 'src' in patch) document.getElementById('kpis').innerHTML = '';
  renderAll();
}
const onSeg = (id, fn) => document.getElementById(id).onclick = (e) => { const b = e.target.closest('button'); if (b) fn(b); };
onSeg('scopeSeg', (b) => KEYS[b.dataset.scope] && setState({ scope: b.dataset.scope }));
onSeg('srcSeg', (b) => SRC_SETS[b.dataset.src] && setState({ src: b.dataset.src }));
onSeg('langSeg', (b) => I18N[b.dataset.lang] && setState({ lang: b.dataset.lang }));
onSeg('metricSeg', (b) => ['v', 's'].includes(b.dataset.metric) && setState({ metric: b.dataset.metric }));
onSeg('rangeSeg', (b) => RANGES.includes(b.dataset.range) && setState({ range: b.dataset.range }));
document.getElementById('openCard').onclick = () => { S.cardMode = 'now'; document.getElementById('modal').classList.add('open'); buildCard(); fitCard(); };
document.getElementById('closeCard').onclick = () => document.getElementById('modal').classList.remove('open');
document.getElementById('modal').onclick = (e) => { if (e.target.id === 'modal') e.currentTarget.classList.remove('open'); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open')); });
document.getElementById('dlCard').onclick = downloadCard;
function printPdf() { document.getElementById('modal').classList.remove('open'); applyI18n(); setTimeout(() => print(), 50); }
document.getElementById('printBtn').onclick = printPdf;
document.getElementById('pdfFromModal').onclick = printPdf;
addEventListener('beforeprint', () => Object.values(charts).forEach((c) => c.resize()));
addEventListener('afterprint', () => Object.values(charts).forEach((c) => c.resize()));
addEventListener('resize', fitCard);
// avatares que não carregam: mostra as iniciais (sem handlers inline, compatível com a CSP)
document.addEventListener('error', (e) => { const img = e.target; if (img && img.tagName === 'IMG' && img.closest('.avatar')) img.remove(); }, true);

/* ============================================================ pessoas no site */
const vis = { first: true, data: null, n: 0 };
const VIS_MAX_BEATS = 18;   // no máximo 18 batimentos (90 min) por separador aberto — poupa a quota grátis do Upstash
async function visitorsTick() {
  if (document.hidden || vis.off || vis.stop || Date.now() - (vis.at || 0) < 60e3) return;
  if (vis.n >= VIS_MAX_BEATS) { vis.stop = true; return; }
  vis.n++;
  vis.at = Date.now();
  try {
    const r = await fetch('api/visitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first: vis.first }), credentials: 'same-origin', keepalive: true });
    if (r.status === 404 || r.status === 429 || r.status >= 500) { vis.off = true; return; }
    vis.first = false;
    vis.data = await getJSON('api/visitors');
  } catch { /* opcional */ }
  renderVisitors();
}
function renderVisitors() {
  const el = document.getElementById('visitors');
  const d = vis.data;
  if (vis.off || !d || !d.online) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<i></i>${T().visitors(Math.max(1, d.online))}`;
  el.title = T().visitors_tip(fmt(d.today), fmt(d.total));
}

/* ============================================================ menu de secções */
function initSecnav() {
  const links = [...document.querySelectorAll('#secnav a')];
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }, { rootMargin: '-120px 0px -65% 0px' });
  for (const a of links) { const sec = document.querySelector(a.getAttribute('href')); if (sec) io.observe(sec); }
}

/* ============================================================ aviso inicial */
(function initNotice() {
  const m = document.getElementById('noticeModal');
  const close = () => { m.classList.remove('open'); store.set('notice_v1', '1'); };
  document.getElementById('noticeOk').onclick = close;
  m.onclick = (e) => { if (e.target === m) close(); };
  document.addEventListener('click', (e) => { if (e.target.closest?.('#noticeBtn')) m.classList.add('open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && m.classList.contains('open')) close(); });
  if (!store.get('notice_v1') && !params.get('card') && !params.get('nonotice')) setTimeout(() => m.classList.add('open'), 600);
})();

(async function boot() {
  renderAll();
  await Promise.all([loadHistory(), loadLive()]);
  if (!window.GTA_FORECAST) await new Promise((r) => setTimeout(r, 50));
  renderAll();
  if (params.get('card')) document.getElementById('openCard').click();
  initSecnav();
  visitorsTick(); setInterval(visitorsTick, VISIT_EVERY);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !vis.off) visitorsTick(); });
  setInterval(async () => { if (!document.hidden) { await loadLive(); renderAll(); } }, LIVE_EVERY);
  setInterval(async () => { if (!document.hidden) { await loadHistory(); renderAll(); } }, HISTORY_EVERY);
})();
