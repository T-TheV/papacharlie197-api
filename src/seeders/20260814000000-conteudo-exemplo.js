"use strict";

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    const agora = new Date();

    const [modulos] = await queryInterface.sequelize.query(
      `INSERT INTO modulos (titulo, cor_destaque, ordem, created_at, updated_at) VALUES
        ('Direito Penal', '#F3C623', 1, NOW(), NOW()),
        ('Informática', '#1A1A1A', 2, NOW(), NOW())
      RETURNING id, titulo;`,
    );

    const idDireitoPenal = modulos.find((m) => m.titulo === "Direito Penal").id;
    const idInformatica = modulos.find((m) => m.titulo === "Informática").id;

    const [aulas] = await queryInterface.sequelize.query(
      `INSERT INTO aulas (modulo_id, titulo, youtube_iframe_url, resumo_texto, ordem, created_at, updated_at) VALUES
        (${idDireitoPenal}, 'Princípio da Legalidade', 'https://www.youtube.com/embed/PLACEHOLDER_AULA_1', 'O princípio da legalidade (art. 1º do CP) estabelece que não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal. É a base do Direito Penal garantista.', 1, NOW(), NOW()),
        (${idDireitoPenal}, 'Crimes contra a Pessoa', 'https://www.youtube.com/embed/PLACEHOLDER_AULA_2', 'Os crimes contra a pessoa (Título I da Parte Especial do CP) protegem a vida, a integridade física e a honra. O homicídio simples tem pena de 6 a 20 anos.', 2, NOW(), NOW()),
        (${idInformatica}, 'Segurança da Informação', 'https://www.youtube.com/embed/PLACEHOLDER_AULA_3', 'Os três pilares da segurança da informação são Confidencialidade, Integridade e Disponibilidade (tríade CIA), fundamentais para provas de informática em concursos.', 1, NOW(), NOW())
      RETURNING id, titulo;`,
    );

    const idAulaLegalidade = aulas.find((a) => a.titulo === "Princípio da Legalidade").id;
    const idAulaCrimes = aulas.find((a) => a.titulo === "Crimes contra a Pessoa").id;
    const idAulaSeguranca = aulas.find((a) => a.titulo === "Segurança da Informação").id;

    await queryInterface.bulkInsert("questoes", [
      {
        aula_id: idAulaLegalidade,
        enunciado: "Segundo o princípio da legalidade previsto no art. 1º do Código Penal, é correto afirmar que:",
        alternativa_a: "A analogia pode ser usada livremente para criar crimes",
        alternativa_b: "Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal",
        alternativa_c: "Costumes podem substituir a lei penal",
        alternativa_d: "A pena pode ser aplicada retroativamente para prejudicar o réu",
        alternativa_e: "O juiz pode criar tipos penais por analogia in malam partem",
        alternativa_correta: "b",
        justificativa_erro: "O art. 1º do CP consagra o princípio 'nullum crimen, nulla poena sine praevia lege' — não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.",
        created_at: agora,
        updated_at: agora,
      },
      {
        aula_id: idAulaCrimes,
        enunciado: "Qual a pena prevista para o homicídio simples (art. 121, caput, do CP)?",
        alternativa_a: "Detenção de 1 a 3 anos",
        alternativa_b: "Reclusão de 2 a 6 anos",
        alternativa_c: "Reclusão de 6 a 20 anos",
        alternativa_d: "Reclusão de 12 a 30 anos",
        alternativa_e: "Multa apenas",
        alternativa_correta: "c",
        justificativa_erro: "O homicídio simples (art. 121, caput, CP) tem pena de reclusão de 6 a 20 anos.",
        created_at: agora,
        updated_at: agora,
      },
      {
        aula_id: idAulaSeguranca,
        enunciado: "Os três pilares clássicos da segurança da informação (tríade CIA) são:",
        alternativa_a: "Confidencialidade, Integridade e Disponibilidade",
        alternativa_b: "Criptografia, Internet e Antivírus",
        alternativa_c: "Confiabilidade, Investigação e Auditoria",
        alternativa_d: "Compressão, Indexação e Arquivamento",
        alternativa_e: "Certificação, Inspeção e Autenticação",
        alternativa_correta: "a",
        justificativa_erro: "A tríade CIA (Confidentiality, Integrity, Availability) é o modelo clássico: Confidencialidade, Integridade e Disponibilidade.",
        created_at: agora,
        updated_at: agora,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("questoes", null, {});
    await queryInterface.bulkDelete("aulas", null, {});
    await queryInterface.bulkDelete("modulos", null, {});
  },
};
