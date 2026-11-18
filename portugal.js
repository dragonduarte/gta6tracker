// Como distinguimos Portugal 🇵🇹 do Brasil 🇧🇷?
// Twitch e Kick só dizem a LÍNGUA da stream ("pt"), não o país. Por isso:
//  1) canais listados aqui contam SEMPRE como Portugal;
//  2) streams em "pt" cujo título ou tags tenham uma destas palavras também contam.
// No YouTube usamos o país declarado do canal (mais fiável).
//
// ➜ Acrescenta aqui os logins dos streamers portugueses que conheces (o que aparece no link:
//   twitch.tv/<login>, kick.com/<login>). Depois de guardares, o Vercel atualiza sozinho.
export default {
  twitch: [
    // 'exemplo_login',
  ],
  kick: [
    // 'exemplo_login',
  ],
  keywords: [
    'portugal', 'pt-pt', 'ptpt', 'pt_pt', '[pt-pt]', 'português de portugal', 'portugues de portugal',
    'portuguêsdeportugal', 'tuga', 'tugas', '🇵🇹',
  ],
};
