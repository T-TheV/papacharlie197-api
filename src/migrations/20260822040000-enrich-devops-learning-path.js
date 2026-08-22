"use strict";

const {
  modulosDevOps,
  criarGuiaEstudoDevOps,
  CONFIGURACAO_TRILHA_DEVOPS,
} = require("../dados/catalogoDevOps");

const SLUG_AGENCIA = "engenharia-de-software";
const SLUG_TRILHA = "devops";
const FALLBACKS = [
  "Executar diretamente em produção sem teste, evidência ou rollback.",
  "Centralizar o conhecimento em uma pessoa e omitir a documentação.",
  "Adicionar ferramentas antes de definir o problema e o sinal de sucesso.",
  "Ignorar falhas observadas desde que a execução termine com código zero.",
  "Versionar credenciais para tornar a reprodução do ambiente mais simples.",
  "Fazer mudanças grandes e irreversíveis para reduzir a quantidade de deploys.",
];

function primeiraLinha(resultado) {
  return resultado?.[0]?.[0] || null;
}

function idExterno(aula) {
  if (aula.tipo === "youtube") return `youtube:${aula.videoId}`;
  return `cadencia:devops-lab:${String(aula.titulo)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90)}`;
}

function alternativas(correta, candidatas, deslocamento) {
  const erradas = [...new Set([...candidatas, ...FALLBACKS].filter((item) => item && item !== correta))].slice(0, 4);
  const posicao = deslocamento % 5;
  const itens = [...erradas];
  itens.splice(posicao, 0, correta);
  return {
    alternativa_a: itens[0],
    alternativa_b: itens[1],
    alternativa_c: itens[2],
    alternativa_d: itens[3],
    alternativa_e: itens[4],
    alternativa_correta: ["a", "b", "c", "d", "e"][posicao],
  };
}

function criarQuestoes(aula, indice, todasAulas) {
  const outras = todasAulas.filter((item) => item.titulo !== aula.titulo);
  const valores = (campo, inicio) => Array.from({ length: 5 }, (_, passo) => {
    const outra = outras[(indice * 7 + inicio + passo) % outras.length];
    return outra?.[campo] || outra?.objetivo;
  });
  const conceitoCorreto = aula.conceitos.join(", ");
  const entregaCorreta = aula.tipo === "material"
    ? aula.entrega
    : `uma evidência prática que demonstre ${aula.objetivo}`;
  const validacaoCorreta = aula.tipo === "material"
    ? aula.validacao
    : `explicação própria, questões respondidas e aplicação verificável de ${aula.conceitos[0]}`;
  return [
    {
      enunciado: `Qual é o resultado de aprendizagem esperado em “${aula.titulo}”?`,
      ...alternativas(aula.objetivo, valores("objetivo", 0), indice),
      justificativa_erro: `O resultado esperado é: ${aula.objetivo}`,
    },
    {
      enunciado: `Qual conjunto reúne os conceitos centrais de “${aula.titulo}”?`,
      ...alternativas(conceitoCorreto, outras.slice(0, 6).map((item) => item.conceitos.join(", ")), indice + 1),
      justificativa_erro: `Os conceitos centrais são ${conceitoCorreto}.`,
    },
    {
      enunciado: `${aula.cenario} Qual decisão técnica é mais adequada?`,
      ...alternativas(aula.decisao, FALLBACKS, indice + 2),
      justificativa_erro: aula.decisao,
    },
    {
      enunciado: `Qual entrega comprova a aplicação prática de “${aula.titulo}”?`,
      ...alternativas(entregaCorreta, valores("entrega", 3), indice + 3),
      justificativa_erro: `A evidência esperada é ${entregaCorreta}.`,
    },
    {
      enunciado: `Como validar a aprendizagem ou o laboratório de “${aula.titulo}”?`,
      ...alternativas(validacaoCorreta, valores("validacao", 6), indice + 4),
      justificativa_erro: `A validação deve demonstrar ${validacaoCorreta}.`,
    },
  ];
}

function criarDiscursivas(aula) {
  return [
    {
      enunciado: `${aula.cenario} Elabore uma solução técnica, justifique as decisões e descreva como observaria falhas e faria rollback.`,
      criterios: `1) Relacionar ${aula.conceitos.join(", ")}. 2) Propor ${aula.decisao}. 3) Definir evidências e sinais de sucesso. 4) Identificar riscos. 5) Descrever rollback ou recuperação.`,
    },
    {
      enunciado: aula.tipo === "material"
        ? `Planeje a execução do laboratório “${aula.titulo}” de forma reproduzível. Detalhe preparação, incrementos, testes e evidências da entrega.`
        : `Explique como aplicaria os ensinamentos de “${aula.titulo}” em um projeto real, incluindo limites, validação e sinais operacionais.`,
      criterios: aula.tipo === "material"
        ? `1) Preparar ambiente isolado. 2) Dividir a construção de ${aula.entrega} em incrementos. 3) Comprovar ${aula.validacao}. 4) Versionar e documentar. 5) Testar falha e recuperação.`
        : `1) Explicar ${aula.conceitos.join(", ")}. 2) Relacionar os conceitos ao objetivo da aula. 3) Propor aplicação verificável. 4) Definir métricas ou evidências. 5) Reconhecer riscos e limites.`,
    },
  ];
}

async function reconciliarQuestoes(sequelize, aulaId, moduloId, questoes, transaction) {
  const [existentes] = await sequelize.query(
    "SELECT id FROM questoes WHERE aula_id = :aulaId AND origem = 'estudo' ORDER BY id",
    { replacements: { aulaId }, transaction },
  );
  for (const [indice, questao] of questoes.entries()) {
    const valores = {
      aulaId,
      moduloId,
      ...questao,
    };
    if (existentes[indice]) {
      await sequelize.query(
        `UPDATE questoes SET
           modulo_id=:moduloId, enunciado=:enunciado, alternativa_a=:alternativa_a,
           alternativa_b=:alternativa_b, alternativa_c=:alternativa_c, alternativa_d=:alternativa_d,
           alternativa_e=:alternativa_e, alternativa_correta=:alternativa_correta,
           justificativa_erro=:justificativa_erro, updated_at=NOW()
         WHERE id=:id`,
        { replacements: { ...valores, id: existentes[indice].id }, transaction },
      );
    } else {
      await sequelize.query(
        `INSERT INTO questoes
          (aula_id, modulo_id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d,
           alternativa_e, alternativa_correta, justificativa_erro, origem, created_at, updated_at)
         VALUES
          (:aulaId, :moduloId, :enunciado, :alternativa_a, :alternativa_b, :alternativa_c, :alternativa_d,
           :alternativa_e, :alternativa_correta, :justificativa_erro, 'estudo', NOW(), NOW())`,
        { replacements: valores, transaction },
      );
    }
  }
}

async function reconciliarDiscursivas(sequelize, aulaId, discursivas, transaction) {
  const [existentes] = await sequelize.query(
    "SELECT id FROM questoes_discursivas WHERE aula_id = :aulaId ORDER BY ordem, id",
    { replacements: { aulaId }, transaction },
  );
  for (const [indice, discursiva] of discursivas.entries()) {
    const valores = { aulaId, ordem: indice + 1, ...discursiva };
    if (existentes[indice]) {
      await sequelize.query(
        `UPDATE questoes_discursivas SET enunciado=:enunciado, criterios_avaliacao=:criterios,
           ordem=:ordem, updated_at=NOW() WHERE id=:id`,
        { replacements: { ...valores, id: existentes[indice].id }, transaction },
      );
    } else {
      await sequelize.query(
        `INSERT INTO questoes_discursivas
          (aula_id, enunciado, criterios_avaliacao, ordem, created_at, updated_at)
         VALUES (:aulaId, :enunciado, :criterios, :ordem, NOW(), NOW())`,
        { replacements: valores, transaction },
      );
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn("aulas", "guia_estudo", {
        type: Sequelize.JSONB,
        allowNull: true,
      }, { transaction });

      const sequelize = queryInterface.sequelize;
      const trilha = primeiraLinha(await sequelize.query(
        `SELECT t.id FROM trilhas t
          JOIN agencias a ON a.id=t.agencia_id
         WHERE a.slug=:agenciaSlug AND t.slug=:trilhaSlug LIMIT 1`,
        { replacements: { agenciaSlug: SLUG_AGENCIA, trilhaSlug: SLUG_TRILHA }, transaction },
      ));
      if (!trilha) return;

      await sequelize.query(
        `UPDATE trilhas SET configuracao_estudo=COALESCE(configuracao_estudo, '{}'::jsonb) || CAST(:config AS jsonb),
          updated_at=NOW() WHERE id=:id`,
        { replacements: { id: trilha.id, config: JSON.stringify(CONFIGURACAO_TRILHA_DEVOPS) }, transaction },
      );

      const todasAulas = modulosDevOps.flatMap((modulo) => modulo.aulas);
      let indiceGlobal = 0;
      for (const [indiceModulo, modulo] of modulosDevOps.entries()) {
        for (const aula of modulo.aulas) {
          const registro = primeiraLinha(await sequelize.query(
            `SELECT a.id, a.modulo_id FROM aulas a
              JOIN modulos_trilhas mt ON mt.modulo_id=a.modulo_id
             WHERE mt.trilha_id=:trilhaId AND a.id_externo=:idExterno LIMIT 1`,
            { replacements: { trilhaId: trilha.id, idExterno: idExterno(aula) }, transaction },
          ));
          if (!registro) {
            indiceGlobal += 1;
            continue;
          }

          const guia = criarGuiaEstudoDevOps(modulo, aula, indiceModulo);
          await sequelize.query(
            "UPDATE aulas SET guia_estudo=CAST(:guia AS jsonb), updated_at=NOW() WHERE id=:id",
            { replacements: { id: registro.id, guia: JSON.stringify(guia) }, transaction },
          );
          await reconciliarQuestoes(
            sequelize,
            registro.id,
            registro.modulo_id,
            criarQuestoes(aula, indiceGlobal, todasAulas),
            transaction,
          );
          await reconciliarDiscursivas(sequelize, registro.id, criarDiscursivas(aula), transaction);
          indiceGlobal += 1;
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("aulas", "guia_estudo", { transaction });
    });
  },
};
