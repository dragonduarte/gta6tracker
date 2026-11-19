// ⚙️ CONFIGURAÇÃO DO SITE — é só este ficheiro que precisas de editar.
// Depois de guardares no GitHub, o Vercel publica a alteração em ~1 minuto.
window.SITE_CONFIG = {
  // Autor (aparece no site, nas imagens, no PDF e no widget incorporável)
  author: 'Duarte Rodrigues',
  authorUrl: 'https://www.linkedin.com/in/duartenrodrigues26/',

  // true = qualquer visitante pode descarregar a imagem/PDF (sempre com os teus créditos)
  // false = o botão só aparece se abrires o site com ?owner=1 no fim do link
  publicDownloads: true,

  // Hora do lançamento (UTC). Meia-noite de 19/11 na Nova Zelândia = 11:00 de 18/11 em Lisboa.
  launch: '2026-11-18T11:00:00Z',

  // 💸 BANNER "COMPRA O GTA VI" — o teu link de afiliado da Instant Gaming (só aceita links instant-gaming.com).
  // Se apagares o link ou deixares "COLOCA_AQUI", o banner fica escondido.
  sponsor: {
    url: 'https://www.instant-gaming.com/pt/l/gta6?igr=dragonduarte',
    name: 'Instant Gaming',
  },

  // Repositório do GitHub onde está o branch "data" (utilizador/repositorio)
  dataRepo: 'dragonduarte/gta6tracker',

  // Google Trends: termo a comparar
  trendsKeyword: 'GTA 6',
};
