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
  // Fontes: rankings de streamers de Portugal (Streams Charts / RTP Arena 2023–2025), streamerradar.com
  // (filtro país = Portugal) e o grupo "Twitch Portugal". Ordem ≈ audiência média.
  twitch: [
    // os maiores
    'jotta', 'jottapdrr', 'rayderzaoo', 'fragger_sandropt', 'move_mind', 'tiagovski555yt', 'tiagovski555', 'godmota', 'ricfazeres', 'wb3nji', 'roman', 'windoh',
    'joliveira10', 'kamuslol', 'oruipinto', 'shrcs', 'impakt', 'impakttv', 'wuant', 'invicpedro', 'seals311', 'omendigotv',
    'jotta', 'daronco01', '16_peter', 'moraishd', 'moraisgaming', 'foxcs', 'skyziinfps', 'djcristianadematos', 'prcs',
    'zorlakoka', 'bennys2k_', 'runah', 'runah1996', 'tavinnst', 'jamiedrakehd', 'alvini98', 'torres14x', 'n0vaisj', 'joaos92',
    'official__pro', 'tekagaming_', 'autotronic10', 'veexzyfps', 'morgamix', 'garciap', 'jafonsogv', 'senimj', 'k0mpa',
    'fioterratv', 'anaisableal', 'joacofreitascs', 'jogasimples', 'valek', 'karii', 'pipachasqueira', 'cesarvsc',
    'sirkazzio', 'fer0m0nas', 'd4rkframe', 'tugaz', 'jonbosstv', 'glermzz',
    // canais de media portugueses
    'rtparena', 'rtparenacs', 'rtparenacsgo',
    // comunidade Twitch Portugal
    'officialfoxcn', 'shouwshouw', 'jesskilled', 'rizzaimer', 'zanasofs', 'hitentv', 'stadodo', 'muchapt', 'scriptzon',
    'pestanacsgo', 'mutirisgo', 'chentric1337', 's1rpent', 'pizituh', 'iron_va', 'xoxudocs', 'formiga50', 'courela_tv',
    'dkrazy', 'tadenight', 'darkzonee', 'obalazio', 'itsmacau', 'ikhalessi', 'mamadotv', 'tugatv', 'meetthemyth',
    'tiaguitos', 'dangoms', 'carlos_canada', 'zetheone', 'kronixgg', 'shootsgud', 'thetji', 'helena_santos',
    'theremedylive', 'bhoficial', 'solrac_gaming', 'psychopt', 'justpaulo27',
  ],
  // Na Kick só nomes distintivos (nomes genéricos podem ser outra pessoa)
  kick: [
    'ricfazeres', 'wuant', 'sirkazzio', 'move_mind', 'zorlakoka', 'moraishd', 'fragger_sandropt', 'godmota', 'tiagovski555',
    'windoh', 'joliveira10', 'oruipinto', 'omendigotv', 'fer0m0nas', 'd4rkframe', 'tugaz', 'jotta', 'jottapdrr', 'rayderzaoo',
  ],
  // Canais do YouTube (o @ do canal, ou o ID que começa por UC). O tracker vê os vídeos e as lives
  // mais recentes destes canais diretamente, mesmo que não apareçam na pesquisa geral do YouTube.
  // Um @ que não exista é simplesmente ignorado. Cada canal gasta 1 unidade de quota por hora.
  youtube: [
    '@RicFazeres', '@wuant', '@SirKazzio', '@KazzioTV', '@Fer0m0nas', '@D4rkFrame', '@Tiagovski', '@Windoh', '@Tugaz',
    '@MoveMind', '@zorlaKOKA', '@MoraisHD', '@JOliveira10', '@RTPArena', '@ClipsdoWuant', '@godmota', '@FraggerSandro',
    '@Rayderzaoo', '@jottapdrr', '@oRuiPinto', '@impaKt', '@CesarVSC', '@imHugoLeandro', '@MikeCherry',
  ],
  // Canais que NÃO são de Portugal, mesmo que o tracker os apanhe (por ex. canal do YouTube com país "Portugal").
  // Escreve o nome como aparece no site (ou o login / @ / ID UC...). Maiúsculas, espaços e @ não contam.
  // Ficam de fora de Portugal em todas as tabelas a partir da próxima recolha.
  nao_portugal: [
    'maxMRM GAMEPLAY',
  ],
  // Marcas explícitas de Portugal no TÍTULO (nas tags não contam como fortes: há brasileiros que põem a tag "Portugal")
  keywords: [
    'portugal', 'pt-pt', 'ptpt', 'pt_pt', '[pt]', '(pt)', 'português de portugal', 'portugues de portugal',
    'tuga', 'tugas', '🇵🇹', 'lisboa', 'mbway', 'mb way',
  ],
  // Expressões só de português europeu: uma chega
  ptpt: [
    'connosco', 'malta', 'bué', 'bue', 'fixe', 'directo', 'em direto', 'telemóvel', 'ecrã', 'miúdos', 'pá', 'carago',
    'vamos lá malta', 'subscrever', 'sub ao canal', 'giro', 'porreiro', 'gajo', 'gajos', 'gaja', 'até a barraca abana',
  ],
  // Expressões comuns em Portugal mas que também aparecem no Brasil ("primeiro a jogar"): precisam de 2 diferentes
  ptpt_soft: [
    'a jogar', 'a explorar', 'a fazer', 'a testar', 'a tentar', 'a ver', 'a conduzir', 'a roubar', 'a correr', 'equipa', 'pequeno-almoço',
  ],
  // Marcas do Brasil: anulam os sinais fracos (e uma bandeira 🇧🇷 junto de 🇵🇹 deixa a stream de fora)
  brazil: [
    'brasil', 'brazil', '🇧🇷', 'br', 'ptbr', 'pt-br', 'pt_br', '(br)', '[br]', 'pix', 'galera', 'mano', 'você', 'voce', 'vc', 'pra', 'tá',
    'cara', 'nóis', 'nois', 'parça', 'massa', 'ao vivão', 'livepix',
  ],
};
