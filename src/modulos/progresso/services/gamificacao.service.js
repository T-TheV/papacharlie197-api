const { Op } = require("sequelize");
const Aula = require("../../estudo/models/aula.model");
const Modulo = require("../../estudo/models/modulo.model");
const Questao = require("../../estudo/models/questao.model");
const Usuario = require("../../autenticacao/models/usuario.model");
const ProgressoUsuario = require("../models/progressoUsuario.model");
const HistoricoErro = require("../models/historicoErro.model");
const { registrarAtividadeDiaria } = require("./streak.service");
const { registrarConclusaoAula, registrarRespostaQuestao } = require("./missao.service");
const RespostaQuestaoObjetiva = require("../models/respostaQuestaoObjetiva.model");
const { sequelize } = require("../../../config/configDB");
const { concederXp } = require("./xp.service");
const {
  listarModulosVisiveis,
  obterAulaVisivel,
  obterQuestaoDeAulaAcessivel,
  encontrarProximaAulaVisivel,
} = require("../../estudo/services/acessoConteudo.service");

const XP_POR_ACERTO = 10;
const INTERVALOS_REVISAO_HORAS = [24, 72, 168, 336]; // 1d, 3d, 7d, 14d

async function definirProgresso(usuarioId, aulaId, dados, transaction) {
  const [progresso] = await ProgressoUsuario.findOrCreate({
    where: { usuario_id: usuarioId, aula_id: aulaId },
    defaults: { usuario_id: usuarioId, aula_id: aulaId, ...dados },
    transaction,
  });
  await progresso.update(dados, { transaction });
  return progresso;
}

async function definirErro(usuarioId, questaoId, transaction) {
  const existente = await HistoricoErro.findOne({
    where: { usuario_id: usuarioId, questao_id: questaoId, resolvido: false },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  const tentativas = (existente?.tentativas || 0) + 1;
  const horas = INTERVALOS_REVISAO_HORAS[Math.min(tentativas - 1, INTERVALOS_REVISAO_HORAS.length - 1)];
  const disponivelEm = new Date(Date.now() + horas * 60 * 60 * 1000);

  const [registro] = await HistoricoErro.findOrCreate({
    where: { usuario_id: usuarioId, questao_id: questaoId, resolvido: false },
    defaults: {
      usuario_id: usuarioId,
      questao_id: questaoId,
      resolvido: false,
      disponivel_em: disponivelEm,
      tentativas,
    },
    transaction,
  });
  await registro.update({ disponivel_em: disponivelEm, tentativas }, { transaction });
  return registro;
}

async function garantirProgressoInicial(usuarioId, contexto, transaction) {
  const modulos = await listarModulosVisiveis(contexto, { transaction });
  const aulaIdsVisiveis = modulos.flatMap((modulo) => modulo.aulas.map((aula) => aula.id));
  const jaTemProgresso = await ProgressoUsuario.findOne({
    where: { usuario_id: usuarioId, aula_id: aulaIdsVisiveis },
    transaction,
  });
  if (jaTemProgresso) return;

  const primeiraAula = modulos.flatMap((modulo) => modulo.aulas)[0];

  if (primeiraAula) {
    await ProgressoUsuario.create({
      usuario_id: usuarioId,
      aula_id: primeiraAula.id,
      status: "em_andamento",
    }, { transaction });
  }
}

async function processarResposta({ usuarioId, questaoId, alternativa, contexto }) {
  return sequelize.transaction(async (transaction) => {
  const questao = await obterQuestaoDeAulaAcessivel(questaoId, usuarioId, contexto, { transaction });
  await registrarAtividadeDiaria(usuarioId, { transaction });

  const acertou = questao.alternativa_correta === alternativa;
  const aulaAtual = questao.aula;

  await registrarRespostaQuestao(usuarioId, questao.id, transaction);

  if (!acertou) {
    // Erro não bloqueia mais a próxima aula — só agenda um lembrete de revisão espaçada,
    // como reforço de memória de longo prazo. O candidato pode tentar de novo na hora.
    await definirErro(usuarioId, questaoId, transaction);
    return {
      correto: false,
      justificativa: questao.justificativa_erro,
    };
  }

  // Registro idempotente: só concede XP na primeira vez que ESTA questão específica é acertada
  const [, criouAgora] = await RespostaQuestaoObjetiva.findOrCreate({
    where: { usuario_id: usuarioId, questao_id: questaoId },
    defaults: { usuario_id: usuarioId, questao_id: questaoId },
    transaction,
  });
  const xpGanho = criouAgora
    ? await concederXp(usuarioId, XP_POR_ACERTO, {
        tipo: "acerto_questao",
        chave: `questao:${questaoId}`,
        transaction,
      })
    : 0;

  await HistoricoErro.update(
    { resolvido: true },
    { where: { usuario_id: usuarioId, questao_id: questaoId, resolvido: false }, transaction },
  );

  // A aula só é marcada como concluída quando TODAS as suas questões objetivas
  // já tiverem sido acertadas pelo usuário — não basta acertar a primeira.
  const questoesDaAula = await Questao.findAll({
    where: { aula_id: aulaAtual.id, origem: "estudo" },
    attributes: ["id"],
    transaction,
  });
  const idsQuestoesDaAula = questoesDaAula.map((q) => q.id);
  const acertadasNaAula = await RespostaQuestaoObjetiva.count({
    where: { usuario_id: usuarioId, questao_id: idsQuestoesDaAula },
    transaction,
  });
  const aulaCompleta = idsQuestoesDaAula.length > 0 && acertadasNaAula >= idsQuestoesDaAula.length;

  let proximaAula = null;
  if (aulaCompleta) {
    const progressoAtual = await ProgressoUsuario.findOne({
      where: { usuario_id: usuarioId, aula_id: aulaAtual.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const primeiraConclusao = progressoAtual?.status !== "concluido" && (progressoAtual?.xp_ganho || 0) === 0;
    await definirProgresso(usuarioId, aulaAtual.id, {
      status: "concluido",
      xp_ganho: Math.max(progressoAtual?.xp_ganho || 0, XP_POR_ACERTO),
    }, transaction);
    if (primeiraConclusao) {
      await registrarConclusaoAula(usuarioId, aulaAtual.modulo_id, aulaAtual.id, transaction);
    }

    proximaAula = await encontrarProximaAulaVisivel(aulaAtual, contexto, { transaction });
    if (proximaAula) {
      const progressoProxima = await ProgressoUsuario.findOne({
        where: { usuario_id: usuarioId, aula_id: proximaAula.id },
        transaction,
      });
      if (!progressoProxima || progressoProxima.status === "bloqueado") {
        await definirProgresso(usuarioId, proximaAula.id, { status: "em_andamento" }, transaction);
      }
    }
  }

  return {
    correto: true,
    xpGanho,
    aulaConcluida: aulaCompleta,
    progressoAula: { respondidas: acertadasNaAula, total: idsQuestoesDaAula.length },
    proximaAulaLiberada: Boolean(proximaAula),
    proximaAulaId: proximaAula?.id || null,
  };
  });
}

async function alternarConclusaoManual(usuarioId, aulaId, contexto) {
  return sequelize.transaction(async (transaction) => {
  const aula = await obterAulaVisivel(aulaId, usuarioId, contexto, { transaction });

  const progresso = await ProgressoUsuario.findOne({
    where: { usuario_id: usuarioId, aula_id: aulaId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!progresso || progresso.status === "bloqueado") {
    const erro = new Error("Esta aula ainda está bloqueada");
    erro.status = 403;
    throw erro;
  }

  if (progresso.status === "concluido") {
    await progresso.update({ status: "em_andamento" }, { transaction });
    return { concluida: false, xpGanho: 0 };
  }

  const jaTinhaXp = progresso.xp_ganho > 0;
  await progresso.update(
    { status: "concluido", xp_ganho: jaTinhaXp ? progresso.xp_ganho : XP_POR_ACERTO },
    { transaction },
  );
  if (!jaTinhaXp) {
    await concederXp(usuarioId, XP_POR_ACERTO, {
      tipo: "conclusao_manual",
      chave: `aula-manual:${aulaId}`,
      transaction,
    });
  }

  await registrarAtividadeDiaria(usuarioId, { transaction });
  if (!jaTinhaXp) await registrarConclusaoAula(usuarioId, aula.modulo_id, aula.id, transaction);

  const proximaAula = await encontrarProximaAulaVisivel(aula, contexto, { transaction });
  if (proximaAula) {
    const progressoProxima = await ProgressoUsuario.findOne({
      where: { usuario_id: usuarioId, aula_id: proximaAula.id },
      transaction,
    });
    if (!progressoProxima || progressoProxima.status === "bloqueado") {
      await definirProgresso(usuarioId, proximaAula.id, { status: "em_andamento" }, transaction);
    }
  }

  return { concluida: true, xpGanho: jaTinhaXp ? 0 : XP_POR_ACERTO, proximaAulaId: proximaAula?.id || null };
  });
}

module.exports = {
  garantirProgressoInicial,
  processarResposta,
  alternarConclusaoManual,
  XP_POR_ACERTO,
};
