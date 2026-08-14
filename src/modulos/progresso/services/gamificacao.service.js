const { Op } = require("sequelize");
const Aula = require("../../estudo/models/aula.model");
const Modulo = require("../../estudo/models/modulo.model");
const Questao = require("../../estudo/models/questao.model");
const Usuario = require("../../autenticacao/models/usuario.model");
const ProgressoUsuario = require("../models/progressoUsuario.model");
const HistoricoErro = require("../models/historicoErro.model");

const XP_POR_ACERTO = 10;
const INTERVALOS_REVISAO_HORAS = [24, 72, 168, 336]; // 1d, 3d, 7d, 14d

async function definirProgresso(usuarioId, aulaId, dados) {
  const [progresso] = await ProgressoUsuario.findOrCreate({
    where: { usuario_id: usuarioId, aula_id: aulaId },
    defaults: { usuario_id: usuarioId, aula_id: aulaId, ...dados },
  });
  await progresso.update(dados);
  return progresso;
}

async function definirErro(usuarioId, questaoId) {
  const existente = await HistoricoErro.findOne({
    where: { usuario_id: usuarioId, questao_id: questaoId, resolvido: false },
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
  });
  await registro.update({ disponivel_em: disponivelEm, tentativas });
  return registro;
}

async function garantirProgressoInicial(usuarioId) {
  const jaTemProgresso = await ProgressoUsuario.findOne({ where: { usuario_id: usuarioId } });
  if (jaTemProgresso) return;

  const primeiraAula = await Aula.findOne({
    include: [{ model: Modulo, as: "modulo" }],
    order: [
      [{ model: Modulo, as: "modulo" }, "ordem", "ASC"],
      ["ordem", "ASC"],
    ],
  });

  if (primeiraAula) {
    await ProgressoUsuario.create({
      usuario_id: usuarioId,
      aula_id: primeiraAula.id,
      status: "em_andamento",
    });
  }
}

async function encontrarProximaAula(aulaAtual) {
  const proximaNoMesmoModulo = await Aula.findOne({
    where: { modulo_id: aulaAtual.modulo_id, ordem: { [Op.gt]: aulaAtual.ordem } },
    order: [["ordem", "ASC"]],
  });
  if (proximaNoMesmoModulo) return proximaNoMesmoModulo;

  const moduloAtual = await Modulo.findByPk(aulaAtual.modulo_id);
  const proximoModulo = await Modulo.findOne({
    where: { ordem: { [Op.gt]: moduloAtual.ordem } },
    order: [["ordem", "ASC"]],
  });
  if (!proximoModulo) return null;

  return Aula.findOne({ where: { modulo_id: proximoModulo.id }, order: [["ordem", "ASC"]] });
}

async function processarResposta({ usuarioId, questaoId, alternativa }) {
  const bloqueioAtivo = await HistoricoErro.findOne({
    where: { usuario_id: usuarioId, questao_id: questaoId, resolvido: false },
  });

  if (bloqueioAtivo?.disponivel_em && bloqueioAtivo.disponivel_em > new Date()) {
    return { aguardandoRevisao: true, disponivelEm: bloqueioAtivo.disponivel_em };
  }

  const questao = await Questao.findByPk(questaoId, { include: [{ model: Aula, as: "aula" }] });
  if (!questao) {
    const erro = new Error("Questão não encontrada");
    erro.status = 404;
    throw erro;
  }

  const acertou = questao.alternativa_correta === alternativa;
  const aulaAtual = questao.aula;
  const proximaAula = await encontrarProximaAula(aulaAtual);

  if (acertou) {
    await definirProgresso(usuarioId, aulaAtual.id, { status: "concluido", xp_ganho: XP_POR_ACERTO });

    await Usuario.increment("xp", { by: XP_POR_ACERTO, where: { id: usuarioId } });

    await HistoricoErro.update(
      { resolvido: true },
      { where: { usuario_id: usuarioId, questao_id: questaoId, resolvido: false } },
    );

    if (proximaAula) {
      const progressoProxima = await ProgressoUsuario.findOne({
        where: { usuario_id: usuarioId, aula_id: proximaAula.id },
      });
      if (!progressoProxima || progressoProxima.status === "bloqueado") {
        await definirProgresso(usuarioId, proximaAula.id, { status: "em_andamento" });
      }
    }

    return {
      correto: true,
      xpGanho: XP_POR_ACERTO,
      proximaAulaLiberada: Boolean(proximaAula),
      proximaAulaId: proximaAula?.id || null,
    };
  }

  await definirErro(usuarioId, questaoId);

  if (proximaAula) {
    await definirProgresso(usuarioId, proximaAula.id, { status: "bloqueado" });
  }

  return {
    correto: false,
    justificativa: questao.justificativa_erro,
    proximaAulaBloqueada: Boolean(proximaAula),
  };
}

module.exports = { garantirProgressoInicial, processarResposta, XP_POR_ACERTO };
