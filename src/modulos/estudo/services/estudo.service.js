const Modulo = require("../models/modulo.model");
const Aula = require("../models/aula.model");
const Questao = require("../models/questao.model");
const QuestaoDiscursiva = require("../models/questaoDiscursiva.model");
const RespostaDiscursiva = require("../models/respostaDiscursiva.model");
const ProgressoUsuario = require("../../progresso/models/progressoUsuario.model");
const HistoricoErro = require("../../progresso/models/historicoErro.model");
const { garantirProgressoInicial } = require("../../progresso/services/gamificacao.service");
const { avaliarRespostaDiscursiva } = require("../../ia/services/gemini.service");

async function listarModulosComProgresso(usuarioId, cargoUsuario) {
  await garantirProgressoInicial(usuarioId);

  const todosModulos = await Modulo.findAll({
    include: [{ model: Aula, as: "aulas" }],
    order: [
      ["ordem", "ASC"],
      [{ model: Aula, as: "aulas" }, "ordem", "ASC"],
    ],
  });

  const modulos = todosModulos.filter(
    (modulo) => modulo.cargos_alvo.length === 0 || (cargoUsuario && modulo.cargos_alvo.includes(cargoUsuario)),
  );

  const progressos = await ProgressoUsuario.findAll({ where: { usuario_id: usuarioId } });
  const statusPorAula = new Map(progressos.map((p) => [p.aula_id, p.status]));

  return modulos.map((modulo) => ({
    id: modulo.id,
    titulo: modulo.titulo,
    corDestaque: modulo.cor_destaque,
    ordem: modulo.ordem,
    aulas: modulo.aulas.map((aula) => ({
      id: aula.id,
      titulo: aula.titulo,
      ordem: aula.ordem,
      status: statusPorAula.get(aula.id) || "bloqueado",
    })),
  }));
}

async function obterAula(aulaId, usuarioId) {
  const aula = await Aula.findByPk(aulaId, {
    include: [
      { model: Modulo, as: "modulo" },
      { model: Questao, as: "questoes" },
      { model: QuestaoDiscursiva, as: "discursivas" },
    ],
  });

  if (!aula) {
    const erro = new Error("Aula não encontrada");
    erro.status = 404;
    throw erro;
  }

  const progresso = await ProgressoUsuario.findOne({ where: { usuario_id: usuarioId, aula_id: aulaId } });
  const status = progresso?.status || "bloqueado";

  if (status === "bloqueado") {
    return { bloqueada: true, titulo: aula.titulo, moduloTitulo: aula.modulo.titulo };
  }

  const respostasAnteriores = await RespostaDiscursiva.findAll({
    where: {
      usuario_id: usuarioId,
      questao_discursiva_id: aula.discursivas.map((d) => d.id),
    },
    order: [["created_at", "DESC"]],
  });
  const ultimaRespostaPorQuestao = new Map();
  for (const resposta of respostasAnteriores) {
    if (!ultimaRespostaPorQuestao.has(resposta.questao_discursiva_id)) {
      ultimaRespostaPorQuestao.set(resposta.questao_discursiva_id, resposta);
    }
  }

  return {
    bloqueada: false,
    id: aula.id,
    titulo: aula.titulo,
    moduloTitulo: aula.modulo.titulo,
    youtubeIframeUrl: aula.youtube_iframe_url,
    resumoTexto: aula.resumo_texto,
    questoes: aula.questoes.map((questao) => ({
      id: questao.id,
      enunciado: questao.enunciado,
      alternativas: {
        a: questao.alternativa_a,
        b: questao.alternativa_b,
        c: questao.alternativa_c,
        d: questao.alternativa_d,
        e: questao.alternativa_e,
      },
    })),
    discursivas: aula.discursivas.map((discursiva) => {
      const ultima = ultimaRespostaPorQuestao.get(discursiva.id);
      return {
        id: discursiva.id,
        enunciado: discursiva.enunciado,
        respostaAnterior: ultima
          ? {
              respostaTexto: ultima.resposta_texto,
              pontosAtendidos: ultima.pontos_atendidos,
              pontosFaltando: ultima.pontos_faltando,
              parecer: ultima.parecer,
            }
          : null,
      };
    }),
  };
}

async function responderDiscursiva(usuarioId, questaoDiscursivaId, respostaTexto) {
  const questao = await QuestaoDiscursiva.findByPk(questaoDiscursivaId);
  if (!questao) {
    const erro = new Error("Questão discursiva não encontrada");
    erro.status = 404;
    throw erro;
  }

  const avaliacao = await avaliarRespostaDiscursiva({
    enunciado: questao.enunciado,
    criterios: questao.criterios_avaliacao,
    respostaTexto,
  });

  const registro = await RespostaDiscursiva.create({
    usuario_id: usuarioId,
    questao_discursiva_id: questaoDiscursivaId,
    resposta_texto: respostaTexto,
    pontos_atendidos: avaliacao.pontosAtendidos,
    pontos_faltando: avaliacao.pontosFaltando,
    parecer: avaliacao.parecer,
  });

  return {
    respostaTexto: registro.resposta_texto,
    pontosAtendidos: registro.pontos_atendidos,
    pontosFaltando: registro.pontos_faltando,
    parecer: registro.parecer,
  };
}

async function listarRevisaoObrigatoria(usuarioId) {
  const erros = await HistoricoErro.findAll({
    where: { usuario_id: usuarioId, resolvido: false },
    include: [{ model: Questao, as: "questao", include: [{ model: Aula, as: "aula" }] }],
    order: [["created_at", "DESC"]],
  });

  return erros.map((erro) => ({
    id: erro.id,
    questaoId: erro.questao.id,
    enunciado: erro.questao.enunciado,
    aulaId: erro.questao.aula.id,
    aulaTitulo: erro.questao.aula.titulo,
    disponivelEm: erro.disponivel_em,
    liberada: !erro.disponivel_em || erro.disponivel_em <= new Date(),
    tentativas: erro.tentativas,
  }));
}

module.exports = {
  listarModulosComProgresso,
  obterAula,
  listarRevisaoObrigatoria,
  responderDiscursiva,
};
