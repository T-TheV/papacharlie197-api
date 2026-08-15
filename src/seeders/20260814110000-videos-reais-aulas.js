"use strict";

// Vídeos reais do YouTube, pesquisados e verificados um a um (título, canal e
// visualizações conferidos na própria página do vídeo) na task #42. Substitui
// os placeholders — incluindo a aula 4 (Direito Constitucional), que estava
// apontando por engano pro vídeo do Rick Astley.
const VIDEOS_POR_AULA = {
  "Princípio da Legalidade": "j4oAaM_m3zM",
  "Crimes contra a Pessoa": "2XfcAmOK6rY",
  "Segurança da Informação": "Gfh2bxe3hGU",
  "Princípios Fundamentais": "ypNuEbiWysw",
  "Crase: quando usar o acento grave": "yUpRa62vcSI",
  "Proposições e conectivos lógicos": "izFMVR8CkQ4",
  "Funções administrativas clássicas (PODC)": "X9j2xGTELbs",
  "Equação fundamental do patrimônio": "54kh8Ie--f8",
  "Inquérito policial: conceito e natureza": "MFBv7pOB3hA",
  "Lei Maria da Penha: medidas protetivas de urgência": "bAvc4i9Shtk",
  "Princípios da Administração Pública (LIMPE)": "Y_m2s4TXPyM",
  "Tanatologia forense: sinais de morte": "sxWXrh4XC2M",
  "Conceito de tributo (art. 3º do CTN)": "TZ_EBhm8RKU",
  "Princípio do poluidor-pagador": "DjXiOaJ5J-Q",
  "Local de crime: conceito e preservação": "ze5l_R4fUf0",
  "Conceito e objeto da Criminologia": "BTizII8lZ1c",
};

module.exports = {
  async up(queryInterface) {
    for (const [titulo, videoId] of Object.entries(VIDEOS_POR_AULA)) {
      await queryInterface.sequelize.query(
        `UPDATE aulas SET youtube_iframe_url = :url, updated_at = NOW() WHERE titulo = :titulo;`,
        {
          replacements: { url: `https://www.youtube.com/embed/${videoId}`, titulo },
        },
      );
    }
  },

  async down(queryInterface) {
    for (const titulo of Object.keys(VIDEOS_POR_AULA)) {
      await queryInterface.sequelize.query(
        `UPDATE aulas SET youtube_iframe_url = 'https://www.youtube.com/embed/PLACEHOLDER_AULA', updated_at = NOW() WHERE titulo = :titulo;`,
        { replacements: { titulo } },
      );
    }
  },
};
