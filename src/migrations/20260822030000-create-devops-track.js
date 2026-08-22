"use strict";

const { modulosDevOps } = require("../dados/catalogoDevOps");
const { criarMapaMentalBasico, hashConteudoAula } = require("../modulos/estudo/services/mapaMental.util");

const SLUG_AGENCIA = "engenharia-de-software";
const SLUG_TRILHA = "devops";
const COR_DEVOPS = "#0EA5E9";
const DISTRATORES_DECISAO = [
  "Executar a mudança manualmente em produção e documentar apenas se ocorrer uma falha.",
  "Adicionar uma nova ferramenta sem definir objetivo, medição, responsabilidade ou fluxo de trabalho.",
  "Aumentar recursos preventivamente e ignorar logs, métricas, testes e sinais do usuário.",
  "Concentrar todo o processo em uma única pessoa e evitar revisão para reduzir o tempo de entrega.",
];

function resumoHtml(aula) {
  const base = [
    `<p><strong>Objetivo:</strong> ${aula.objetivo}</p>`,
    `<p><strong>Conceitos-chave:</strong> ${aula.conceitos.join(", ")}.</p>`,
  ];
  if (aula.tipo === "material") {
    base.push(`<p><strong>Entrega do laboratório:</strong> ${aula.entrega}.</p>`);
    base.push(`<p><strong>Validação:</strong> ${aula.validacao}.</p>`);
  } else {
    base.push(`<p>Curadoria gratuita do canal <strong>${aula.canal}</strong>, organizada para a trilha DevOps do Cadência.</p>`);
  }
  return base.join("");
}

function slugificar(valor) {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function primeiraLinha(resultado) {
  return resultado?.[0]?.[0] || null;
}

function opcoes(correta, distratores, posicaoCorreta) {
  const candidatas = [...new Set(distratores.filter((item) => item && item !== correta))];
  for (const fallback of DISTRATORES_DECISAO) {
    if (candidatas.length >= 3) break;
    if (fallback !== correta && !candidatas.includes(fallback)) candidatas.push(fallback);
  }
  const alternativas = candidatas.slice(0, 3);
  alternativas.splice(posicaoCorreta % 4, 0, correta);
  return {
    a: alternativas[0],
    b: alternativas[1],
    c: alternativas[2],
    d: alternativas[3],
    correta: ["a", "b", "c", "d"][posicaoCorreta % 4],
  };
}

function criarQuestoes(aula, indiceGlobal, todasAulas) {
  const outras = todasAulas.filter((item) => item.titulo !== aula.titulo);
  const deslocada = (passo) => outras[(indiceGlobal * 5 + passo) % outras.length];
  const questaoObjetivo = opcoes(
    aula.objetivo,
    [deslocada(1).objetivo, deslocada(2).objetivo, deslocada(3).objetivo],
    indiceGlobal,
  );
  const questaoConceito = opcoes(
    aula.conceitos[0],
    [deslocada(4).conceitos[0], deslocada(5).conceitos[0], deslocada(6).conceitos[0]],
    indiceGlobal + 1,
  );
  const questaoCenario = opcoes(aula.decisao, DISTRATORES_DECISAO, indiceGlobal + 2);
  return [
    {
      enunciado: `Qual resultado de aprendizagem melhor representa a aula “${aula.titulo}”?`,
      ...questaoObjetivo,
      justificativa: `A aula foi selecionada para que o estudante consiga: ${aula.objetivo}`,
    },
    {
      enunciado: `Qual conceito é central para o conteúdo da aula “${aula.titulo}”?`,
      ...questaoConceito,
      justificativa: `O conceito central é “${aula.conceitos[0]}”, relacionado também a ${aula.conceitos.slice(1).join(", ")}.`,
    },
    {
      enunciado: `${aula.cenario} Qual é a resposta técnica mais adequada?`,
      ...questaoCenario,
      justificativa: aula.decisao,
    },
  ];
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sequelize = queryInterface.sequelize;
      let agencia = primeiraLinha(await sequelize.query(
        "SELECT id FROM agencias WHERE slug = :slug LIMIT 1",
        { replacements: { slug: SLUG_AGENCIA }, transaction },
      ));
      if (!agencia) {
        agencia = primeiraLinha(await sequelize.query(
          `INSERT INTO agencias
            (nome, slug, descricao, rotulo_trilha, logo_url, cor_primaria, cor_secundaria,
             cor_fundo, cor_superficie, padrao_fundo, configuracao_tema, configuracao_estudo,
             padrao, ativa, created_at, updated_at)
           VALUES
            ('Engenharia de Software', :slug, 'Formação prática em desenvolvimento, infraestrutura e operação de software.',
             'Trilha', '/assets/agencias/engenharia-software.svg', '#512BD4', '#201547', '#F5F3FA', '#FFFFFF',
             'academico', '{}'::jsonb, '{}'::jsonb, false, true, NOW(), NOW())
           RETURNING id`,
          { replacements: { slug: SLUG_AGENCIA }, transaction },
        ));
      }

      let trilha = primeiraLinha(await sequelize.query(
        "SELECT id FROM trilhas WHERE agencia_id = :agenciaId AND slug = :slug LIMIT 1",
        { replacements: { agenciaId: agencia.id, slug: SLUG_TRILHA }, transaction },
      ));
      if (!trilha) {
        trilha = primeiraLinha(await sequelize.query(
          `INSERT INTO trilhas
            (agencia_id, nome, nome_curto, slug, descricao, ordem, ativa, configuracao_estudo, created_at, updated_at)
           VALUES
            (:agenciaId, 'DevOps', 'DevOps', :slug,
             'Formação completa em entrega contínua, containers, nuvem, infraestrutura como código, observabilidade, SRE, segurança e GitOps.',
             2, true, '{"fallbackVideoMinutos": 30}'::jsonb, NOW(), NOW())
           RETURNING id`,
          { replacements: { agenciaId: agencia.id, slug: SLUG_TRILHA }, transaction },
        ));
      } else {
        await sequelize.query(
          `UPDATE trilhas
              SET nome = 'DevOps', nome_curto = 'DevOps',
                  descricao = 'Formação completa em entrega contínua, containers, nuvem, infraestrutura como código, observabilidade, SRE, segurança e GitOps.',
                  ordem = 2, ativa = true, updated_at = NOW()
            WHERE id = :id`,
          { replacements: { id: trilha.id }, transaction },
        );
      }

      const todasAulas = modulosDevOps.flatMap((modulo) => modulo.aulas);
      let indiceGlobal = 0;
      for (const [indiceModulo, moduloDef] of modulosDevOps.entries()) {
        let modulo = primeiraLinha(await sequelize.query(
          "SELECT id FROM modulos WHERE agencia_id = :agenciaId AND titulo = :titulo LIMIT 1",
          { replacements: { agenciaId: agencia.id, titulo: moduloDef.titulo }, transaction },
        ));
        if (!modulo) {
          modulo = primeiraLinha(await sequelize.query(
            `INSERT INTO modulos
              (agencia_id, titulo, cor_destaque, ordem, cargos_alvo, peso_edital, created_at, updated_at)
             VALUES
              (:agenciaId, :titulo, :cor, :ordem, ARRAY[:trilhaSlug]::varchar[], 1, NOW(), NOW())
             RETURNING id`,
            {
              replacements: {
                agenciaId: agencia.id,
                titulo: moduloDef.titulo,
                cor: COR_DEVOPS,
                ordem: indiceModulo + 1,
                trilhaSlug: SLUG_TRILHA,
              },
              transaction,
            },
          ));
        } else {
          await sequelize.query(
            `UPDATE modulos
                SET cor_destaque = :cor, ordem = :ordem,
                    cargos_alvo = ARRAY[:trilhaSlug]::varchar[], updated_at = NOW()
              WHERE id = :id`,
            {
              replacements: {
                id: modulo.id,
                cor: COR_DEVOPS,
                ordem: indiceModulo + 1,
                trilhaSlug: SLUG_TRILHA,
              },
              transaction,
            },
          );
        }
        await sequelize.query(
          `INSERT INTO modulos_trilhas (modulo_id, trilha_id, created_at, updated_at)
           VALUES (:moduloId, :trilhaId, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          { replacements: { moduloId: modulo.id, trilhaId: trilha.id }, transaction },
        );

        for (const [indiceAula, aulaDef] of moduloDef.aulas.entries()) {
          const ehVideo = aulaDef.tipo === "youtube";
          const idExterno = ehVideo
            ? `youtube:${aulaDef.videoId}`
            : `cadencia:devops-lab:${slugificar(aulaDef.titulo)}`;
          const iframe = ehVideo ? `https://www.youtube.com/embed/${aulaDef.videoId}` : null;
          const urlExterna = ehVideo ? `https://www.youtube.com/watch?v=${aulaDef.videoId}` : null;
          const provedor = ehVideo ? "YouTube" : "Cadência";
          const resumo = resumoHtml(aulaDef);
          let registroAula = primeiraLinha(await sequelize.query(
            "SELECT id FROM aulas WHERE modulo_id = :moduloId AND id_externo = :idExterno LIMIT 1",
            { replacements: { moduloId: modulo.id, idExterno }, transaction },
          ));
          if (!registroAula) {
            registroAula = primeiraLinha(await sequelize.query(
              `INSERT INTO aulas
                (modulo_id, titulo, youtube_iframe_url, tipo_conteudo, provedor_externo, url_externa, id_externo,
                 resumo_texto, ordem, created_at, updated_at)
               VALUES
                (:moduloId, :titulo, :iframe, :tipo, :provedor, :urlExterna, :idExterno,
                 :resumo, :ordem, NOW(), NOW())
               RETURNING id`,
              {
                replacements: {
                  moduloId: modulo.id,
                  titulo: aulaDef.titulo,
                  iframe,
                  tipo: aulaDef.tipo,
                  provedor,
                  urlExterna,
                  idExterno,
                  resumo,
                  ordem: indiceAula + 1,
                },
                transaction,
              },
            ));
          } else {
            await sequelize.query(
              `UPDATE aulas
                  SET titulo = :titulo, youtube_iframe_url = :iframe, tipo_conteudo = :tipo,
                      provedor_externo = :provedor, url_externa = :urlExterna,
                      resumo_texto = :resumo, ordem = :ordem, updated_at = NOW()
                WHERE id = :id`,
              {
                replacements: {
                  id: registroAula.id,
                  titulo: aulaDef.titulo,
                  iframe,
                  tipo: aulaDef.tipo,
                  provedor,
                  urlExterna,
                  resumo,
                  ordem: indiceAula + 1,
                },
                transaction,
              },
            );
          }

          const questoes = criarQuestoes(aulaDef, indiceGlobal, todasAulas);
          for (const questao of questoes) {
            const existente = primeiraLinha(await sequelize.query(
              "SELECT id FROM questoes WHERE aula_id = :aulaId AND enunciado = :enunciado LIMIT 1",
              { replacements: { aulaId: registroAula.id, enunciado: questao.enunciado }, transaction },
            ));
            if (!existente) {
              await sequelize.query(
                `INSERT INTO questoes
                  (aula_id, modulo_id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d,
                   alternativa_correta, justificativa_erro, origem, created_at, updated_at)
                 VALUES
                  (:aulaId, :moduloId, :enunciado, :a, :b, :c, :d, :correta, :justificativa, 'estudo', NOW(), NOW())`,
                {
                  replacements: {
                    aulaId: registroAula.id,
                    moduloId: modulo.id,
                    enunciado: questao.enunciado,
                    a: questao.a,
                    b: questao.b,
                    c: questao.c,
                    d: questao.d,
                    correta: questao.correta,
                    justificativa: questao.justificativa,
                  },
                  transaction,
                },
              );
            }
          }

          const enunciadoDiscursivo = `${aulaDef.cenario} Elabore uma solução técnica, explique as decisões e descreva como validaria o resultado.`;
          const discursivaExistente = primeiraLinha(await sequelize.query(
            "SELECT id FROM questoes_discursivas WHERE aula_id = :aulaId AND enunciado = :enunciado LIMIT 1",
            { replacements: { aulaId: registroAula.id, enunciado: enunciadoDiscursivo }, transaction },
          ));
          if (!discursivaExistente) {
            await sequelize.query(
              `INSERT INTO questoes_discursivas
                (aula_id, enunciado, criterios_avaliacao, ordem, created_at, updated_at)
               VALUES (:aulaId, :enunciado, :criterios, 1, NOW(), NOW())`,
              {
                replacements: {
                  aulaId: registroAula.id,
                  enunciado: enunciadoDiscursivo,
                  criterios: `A resposta deve abordar ${aulaDef.conceitos.join(", ")}; propor “${aulaDef.decisao}”; incluir validação, observabilidade, riscos e possibilidade de rollback.`,
                },
                transaction,
              },
            );
          }

          const referencia = aulaDef.referencia || moduloDef.referencia;
          const anexoExistente = primeiraLinha(await sequelize.query(
            "SELECT id FROM anexos_aulas WHERE aula_id = :aulaId AND url_externa = :url LIMIT 1",
            { replacements: { aulaId: registroAula.id, url: referencia }, transaction },
          ));
          if (!anexoExistente) {
            await sequelize.query(
              `INSERT INTO anexos_aulas
                (aula_id, nome_exibicao, url_externa, origem, ordem, created_at, updated_at)
               VALUES (:aulaId, 'Referência oficial do módulo', :url, 'referencia', 1, NOW(), NOW())`,
              { replacements: { aulaId: registroAula.id, url: referencia }, transaction },
            );
          }

          const conteudoMapa = {
            titulo: aulaDef.titulo,
            resumoTexto: resumo,
            transcricaoTexto: null,
            questoes: questoes.map((questao) => questao.enunciado),
            discursivas: [enunciadoDiscursivo],
          };
          await sequelize.query(
            `UPDATE aulas
                SET mapa_mental = CAST(:mapa AS jsonb), mapa_mental_fonte = 'estrutura',
                    mapa_mental_hash = :hash, mapa_mental_gerado_em = NOW(), mapa_mental_tentativa_em = NULL
              WHERE id = :id`,
            {
              replacements: {
                id: registroAula.id,
                mapa: JSON.stringify(criarMapaMentalBasico(conteudoMapa)),
                hash: hashConteudoAula(conteudoMapa),
              },
              transaction,
            },
          );
          indiceGlobal += 1;
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sequelize = queryInterface.sequelize;
      const agencia = primeiraLinha(await sequelize.query(
        "SELECT id FROM agencias WHERE slug = :slug LIMIT 1",
        { replacements: { slug: SLUG_AGENCIA }, transaction },
      ));
      if (!agencia) return;
      const trilha = primeiraLinha(await sequelize.query(
        "SELECT id FROM trilhas WHERE agencia_id = :agenciaId AND slug = :slug LIMIT 1",
        { replacements: { agenciaId: agencia.id, slug: SLUG_TRILHA }, transaction },
      ));
      if (!trilha) return;
      await sequelize.query(
        `DELETE FROM questoes
          WHERE modulo_id IN (SELECT modulo_id FROM modulos_trilhas WHERE trilha_id = :trilhaId)`,
        { replacements: { trilhaId: trilha.id }, transaction },
      );
      await sequelize.query(
        `DELETE FROM modulos
          WHERE agencia_id = :agenciaId
            AND id IN (SELECT modulo_id FROM modulos_trilhas WHERE trilha_id = :trilhaId)`,
        { replacements: { agenciaId: agencia.id, trilhaId: trilha.id }, transaction },
      );
      await sequelize.query("DELETE FROM trilhas WHERE id = :id", {
        replacements: { id: trilha.id },
        transaction,
      });
    });
  },
};
