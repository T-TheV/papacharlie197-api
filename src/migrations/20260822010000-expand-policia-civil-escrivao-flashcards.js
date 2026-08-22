"use strict";

const { randomUUID } = require("node:crypto");
const {
  modulosComplementaresEscrivao,
  flashcardsPoliciaCivil,
} = require("../dados/catalogoPoliciaCivil");

const MODULOS_COMUNS = [
  "Direito Penal",
  "Noções de Informática",
  "Direito Constitucional",
  "Língua Portuguesa",
  "Raciocínio Lógico-Matemático",
  "Noções de Administração",
  "Noções de Contabilidade",
  "Direito Processual Penal",
  "Legislação Penal e Processual Penal Extravagante",
  "Direito Administrativo",
  "Medicina Legal",
];

async function primeiraLinha(sequelize, sql, replacements, transaction) {
  const [linhas] = await sequelize.query(sql, { replacements, transaction });
  return linhas[0] || null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sequelize = queryInterface.sequelize;
      const agencia = await primeiraLinha(
        sequelize,
        "SELECT id FROM agencias WHERE slug = 'policia-civil' LIMIT 1",
        {},
        transaction,
      );
      if (!agencia) return;

      const [trilhas] = await sequelize.query(
        "SELECT id, slug FROM trilhas WHERE agencia_id = :agenciaId",
        { replacements: { agenciaId: agencia.id }, transaction },
      );
      const trilhaPorSlug = Object.fromEntries(trilhas.map((trilha) => [trilha.slug, trilha.id]));
      if (!trilhaPorSlug.escrivao) return;

      await sequelize.query(
        `UPDATE trilhas
            SET descricao = COALESCE(descricao, 'Núcleo comum da Polícia Civil com formação complementar para a rotina do escrivão.'),
                updated_at = NOW()
          WHERE id = :escrivaoId`,
        { replacements: { escrivaoId: trilhaPorSlug.escrivao }, transaction },
      );

      const [modulosComuns] = await sequelize.query(
        `SELECT id, titulo
           FROM modulos
          WHERE agencia_id = :agenciaId
            AND titulo IN (:titulos)`,
        { replacements: { agenciaId: agencia.id, titulos: MODULOS_COMUNS }, transaction },
      );

      for (const modulo of modulosComuns) {
        for (const slug of ["agente", "escrivao", "delegado"]) {
          if (!trilhaPorSlug[slug]) continue;
          await sequelize.query(
            `INSERT INTO modulos_trilhas (modulo_id, trilha_id, created_at, updated_at)
             VALUES (:moduloId, :trilhaId, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            { replacements: { moduloId: modulo.id, trilhaId: trilhaPorSlug[slug] }, transaction },
          );
        }
        await sequelize.query(
          `UPDATE modulos
              SET cargos_alvo = ARRAY['agente', 'escrivao', 'delegado']::varchar[],
                  updated_at = NOW()
            WHERE id = :moduloId`,
          { replacements: { moduloId: modulo.id }, transaction },
        );
      }

      const maiorOrdem = await primeiraLinha(
        sequelize,
        "SELECT COALESCE(MAX(ordem), 0) AS ordem FROM modulos WHERE agencia_id = :agenciaId",
        { agenciaId: agencia.id },
        transaction,
      );
      let ordemModulo = Number(maiorOrdem.ordem);

      for (const definicao of modulosComplementaresEscrivao) {
        let modulo = await primeiraLinha(
          sequelize,
          "SELECT id FROM modulos WHERE agencia_id = :agenciaId AND titulo = :titulo LIMIT 1",
          { agenciaId: agencia.id, titulo: definicao.titulo },
          transaction,
        );
        if (!modulo) {
          ordemModulo += 1;
          modulo = await primeiraLinha(
            sequelize,
            `INSERT INTO modulos
              (agencia_id, titulo, cor_destaque, ordem, cargos_alvo, peso_edital, created_at, updated_at)
             VALUES
              (:agenciaId, :titulo, '#F3C623', :ordem, ARRAY['escrivao']::varchar[], :pesoEdital, NOW(), NOW())
             RETURNING id`,
            {
              agenciaId: agencia.id,
              titulo: definicao.titulo,
              ordem: ordemModulo,
              pesoEdital: definicao.pesoEdital,
            },
            transaction,
          );
        }

        await sequelize.query(
          `INSERT INTO modulos_trilhas (modulo_id, trilha_id, created_at, updated_at)
           VALUES (:moduloId, :trilhaId, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          { replacements: { moduloId: modulo.id, trilhaId: trilhaPorSlug.escrivao }, transaction },
        );

        for (const [indice, aulaDef] of definicao.aulas.entries()) {
          let aula = await primeiraLinha(
            sequelize,
            "SELECT id FROM aulas WHERE modulo_id = :moduloId AND titulo = :titulo LIMIT 1",
            { moduloId: modulo.id, titulo: aulaDef.titulo },
            transaction,
          );
          if (!aula) {
            aula = await primeiraLinha(
              sequelize,
              `INSERT INTO aulas
                (modulo_id, titulo, youtube_iframe_url, tipo_conteudo, resumo_texto, ordem, created_at, updated_at)
               VALUES
                (:moduloId, :titulo, NULL, 'material', :resumo, :ordem, NOW(), NOW())
               RETURNING id`,
              {
                moduloId: modulo.id,
                titulo: aulaDef.titulo,
                resumo: aulaDef.resumo,
                ordem: indice + 1,
              },
              transaction,
            );
          }

          const questaoExistente = await primeiraLinha(
            sequelize,
            "SELECT id FROM questoes WHERE aula_id = :aulaId AND origem = 'estudo' LIMIT 1",
            { aulaId: aula.id },
            transaction,
          );
          if (!questaoExistente) {
            await sequelize.query(
              `INSERT INTO questoes
                (aula_id, modulo_id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d,
                 alternativa_correta, justificativa_erro, origem, created_at, updated_at)
               VALUES
                (:aulaId, :moduloId, :enunciado, :a, :b, :c, :d, :correta, :justificativa, 'estudo', NOW(), NOW())`,
              {
                replacements: {
                  aulaId: aula.id,
                  moduloId: modulo.id,
                  enunciado: aulaDef.objetiva.enunciado,
                  a: aulaDef.objetiva.alternativas[0],
                  b: aulaDef.objetiva.alternativas[1],
                  c: aulaDef.objetiva.alternativas[2],
                  d: aulaDef.objetiva.alternativas[3],
                  correta: aulaDef.objetiva.correta,
                  justificativa: aulaDef.objetiva.justificativa,
                },
                transaction,
              },
            );
          }

          const discursivaExistente = await primeiraLinha(
            sequelize,
            "SELECT id FROM questoes_discursivas WHERE aula_id = :aulaId LIMIT 1",
            { aulaId: aula.id },
            transaction,
          );
          if (!discursivaExistente) {
            await sequelize.query(
              `INSERT INTO questoes_discursivas
                (aula_id, enunciado, criterios_avaliacao, ordem, created_at, updated_at)
               VALUES
                (:aulaId, :enunciado, :criterios, 1, NOW(), NOW())`,
              {
                replacements: {
                  aulaId: aula.id,
                  enunciado: aulaDef.discursiva,
                  criterios: "Resposta clara, tecnicamente correta, organizada e aplicada à rotina cartorária descrita na aula.",
                },
                transaction,
              },
            );
          }
        }
      }

      const [modulos] = await sequelize.query(
        "SELECT id, titulo FROM modulos WHERE agencia_id = :agenciaId",
        { replacements: { agenciaId: agencia.id }, transaction },
      );
      const moduloPorTitulo = Object.fromEntries(modulos.map((modulo) => [modulo.titulo, modulo.id]));
      const [usuarios] = await sequelize.query(
        `SELECT DISTINCT i.usuario_id
           FROM inscricoes_trilhas i
           JOIN trilhas t ON t.id = i.trilha_id
          WHERE t.agencia_id = :agenciaId`,
        { replacements: { agenciaId: agencia.id }, transaction },
      );
      const registros = [];
      for (const usuario of usuarios) {
        for (const card of flashcardsPoliciaCivil) {
          const moduloId = moduloPorTitulo[card.moduloTitulo];
          if (!moduloId) continue;
          registros.push({
            id: randomUUID(),
            usuario_id: usuario.usuario_id,
            agencia_id: agencia.id,
            trilha_id: card.trilhaSlug ? trilhaPorSlug[card.trilhaSlug] || null : null,
            modulo_id: moduloId,
            aula_id: null,
            frente: card.frente,
            verso: card.verso,
            origem: "aula",
            chave_origem: card.chaveOrigem,
            ativo: true,
            repeticoes: 0,
            intervalo_dias: 0,
            fator_facilidade: 2.5,
            proxima_revisao_em: new Date(),
            revisado_em: null,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
      if (registros.length) await queryInterface.bulkInsert("flashcards", registros, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sequelize = queryInterface.sequelize;
      await sequelize.query(
        "DELETE FROM flashcards WHERE chave_origem LIKE 'catalogo-policia-civil:%'",
        { transaction },
      );
      await sequelize.query(
        `DELETE FROM modulos
          WHERE titulo IN (:titulos)
            AND agencia_id = (SELECT id FROM agencias WHERE slug = 'policia-civil' LIMIT 1)`,
        { replacements: { titulos: modulosComplementaresEscrivao.map((modulo) => modulo.titulo) }, transaction },
      );
    });
  },
};
