// Como distinguimos Portugal 🇵🇹 do Brasil 🇧🇷?
// Twitch e Kick só dizem a LÍNGUA da stream ("pt"), nunca o país. Por isso o tracker junta vários sinais:
//  1) criadores desta lista contam SEMPRE como Portugal (em qualquer plataforma);
//  2) criadores que o tracker já reconheceu como portugueses (aprende sozinho, ver data/portugal-learned.json);
//  3) títulos e tags com marcas de Portugal ("PT-PT", "🇵🇹", "tuga"...) ou de português europeu
//     ("a jogar", "connosco", "malta", "bué"...), que no Brasil quase não se usam;
//  4) no YouTube: país do canal = PT ou áudio marcado como "pt-PT".
//
// ➜ Para acrescentar alguém: escreve o login tal como aparece no link (twitch.tv/<login>, kick.com/<login>)
//   ou o @ do canal do YouTube. Guarda no GitHub e a próxima recolha já o usa.
export default {
  twitch: [
    'ricfazeres', 'wuant', 'sirkazzio', 'fer0m0nas', 'd4rkframe', 'tiagovski', 'windoh',
    'move_mind', 'zorlak', 'moraishd', 'joliveira10', 'rtparena', 'tugaz',
  ],
  kick: [
    'ricfazeres', 'wuant', 'sirkazzio', 'move_mind', 'zorlak', 'moraishd',
  ],
  // Canais do YouTube (o @ do canal, ou o ID que começa por UC). O tracker vê os vídeos e as lives
  // mais recentes destes canais diretamente, mesmo que não apareçam na pesquisa geral do YouTube.
  youtube: [
    '@RicFazeres', '@wuant', '@SirKazzio', '@Fer0m0nas', '@D4rkFrame', '@Tiagovski', '@Windoh',
    '@MoveMind', '@Zorlak', '@MoraisHD', '@JOliveira10', '@Tugaz', '@RTPArena', '@KazzioTV', '@ClipsdoWuant',
  ],
  // Marcas explícitas de Portugal
  keywords: [
    'portugal', 'pt-pt', 'ptpt', 'pt_pt', '[pt]', '(pt)', 'português de portugal', 'portugues de portugal',
    'tuga', 'tugas', '🇵🇹', 'lisboa',
  ],
  // Expressões típicas de português europeu (Brasil diz "jogando", "conosco", "galera"...)
  ptpt: [
    'a jogar', 'a explorar', 'a fazer', 'a testar', 'a tentar', 'a ver ', 'a conduzir', 'a roubar', 'a correr',
    'connosco', 'malta', 'bué', 'bue fixe', 'fixe', 'directo', 'em direto', 'telemóvel', 'ecrã', 'equipa',
    'miúdos', 'pá', 'carago', 'vamos lá malta', 'subscrever', 'sub ao canal',
  ],
};
