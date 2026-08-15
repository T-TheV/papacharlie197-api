const Aula = require("../models/aula.model");
const Modulo = require("../models/modulo.model");
const Questao = require("../models/questao.model");
const QuestaoDiscursiva = require("../models/questaoDiscursiva.model");
const Trilha = require("../../catalogo/models/trilha.model");
const ProgressoUsuario = require("../../progresso/models/progressoUsuario.model");

function moduloVisivel(modulo, contexto) {
  if (!modulo || Number(modulo.agencia_id) !== Number(contexto.agenciaId)) return false;
  const trilhas = modulo.trilhas || [];
  if (trilhas.length === 0) return true;
  return Boolean(contexto.trilhaId) && trilhas.some((trilha) => Number(trilha.id) === Number(contexto.trilhaId));
}

const incluirTrilhas = {
  model: Trilha,
  as: "trilhas",
  attributes: ["id", "nome", "slug"],
  through: { attributes: [] },
  required: false,
};

async function listarModulosVisiveis(contexto, { incluirAulas = true, transaction } = {}) {
  const include = [incluirTrilhas];
  if (incluirAulas) include.push({ model: Aula, as: "aulas" });
  const modulos = await Modulo.findAll({
    where: { agencia_id: contexto.agenciaId },
    include,
    order: incluirAulas
      ? [["ordem", "ASC"], [{ model: Aula, as: "aulas" }, "ordem", "ASC"]]
      : [["ordem", "ASC"]],
    transaction,
  });
  return modulos.filter((modulo) => moduloVisivel(modulo, contexto));
}

async function obterModuloVisivel(moduloId, contexto, { incluirAulas = true, transaction } = {}) {
  const include = [incluirTrilhas];
  if (incluirAulas) include.push({ model: Aula, as: "aulas" });
  const modulo = await Modulo.findByPk(moduloId, { include, transaction });
  if (!modulo || !moduloVisivel(modulo, contexto)) {
    const erro = new Error("Módulo não disponível para a agência e trilha ativas");
    erro.status = 403;
    throw erro;
  }
  return modulo;
}

async function obterAulaVisivel(aulaId, usuarioId, contexto, { exigirDesbloqueada = true, transaction } = {}) {
  const aula = await Aula.findByPk(aulaId, {
    include: [{ model: Modulo, as: "modulo", include: [incluirTrilhas] }],
    transaction,
  });
  if (!aula || !moduloVisivel(aula.modulo, contexto)) {
    const erro = new Error("Aula não disponível para a agência e trilha ativas");
    erro.status = 403;
    throw erro;
  }
  if (exigirDesbloqueada) {
    const progresso = await ProgressoUsuario.findOne({
      where: { usuario_id: usuarioId, aula_id: aula.id },
      transaction,
    });
    if (!progresso || progresso.status === "bloqueado") {
      const erro = new Error("Esta aula ainda está bloqueada");
      erro.status = 403;
      throw erro;
    }
    aula.progressoDoUsuario = progresso;
  }
  return aula;
}

async function obterQuestaoDeAulaAcessivel(questaoId, usuarioId, contexto, { transaction } = {}) {
  const questao = await Questao.findOne({
    where: { id: questaoId, origem: "estudo" },
    include: [{ model: Aula, as: "aula", include: [{ model: Modulo, as: "modulo", include: [incluirTrilhas] }] }],
    transaction,
  });
  if (!questao || !questao.aula || !moduloVisivel(questao.aula.modulo, contexto)) {
    const erro = new Error("Questão não disponível para a agência e trilha ativas");
    erro.status = 403;
    throw erro;
  }
  const progresso = await ProgressoUsuario.findOne({
    where: { usuario_id: usuarioId, aula_id: questao.aula_id },
    transaction,
  });
  if (!progresso || progresso.status === "bloqueado") {
    const erro = new Error("A questão pertence a uma aula bloqueada");
    erro.status = 403;
    throw erro;
  }
  return questao;
}

async function obterDiscursivaAcessivel(id, usuarioId, contexto, { transaction } = {}) {
  const questao = await QuestaoDiscursiva.findByPk(id, {
    include: [{ model: Aula, as: "aula", include: [{ model: Modulo, as: "modulo", include: [incluirTrilhas] }] }],
    transaction,
  });
  if (!questao || !questao.aula || !moduloVisivel(questao.aula.modulo, contexto)) {
    const erro = new Error("Questão discursiva não disponível para a agência e trilha ativas");
    erro.status = 403;
    throw erro;
  }
  const progresso = await ProgressoUsuario.findOne({
    where: { usuario_id: usuarioId, aula_id: questao.aula_id },
    transaction,
  });
  if (!progresso || progresso.status === "bloqueado") {
    const erro = new Error("A questão pertence a uma aula bloqueada");
    erro.status = 403;
    throw erro;
  }
  return questao;
}

async function encontrarProximaAulaVisivel(aulaAtual, contexto, { transaction } = {}) {
  const modulos = await listarModulosVisiveis(contexto, { incluirAulas: true, transaction });
  const aulas = modulos.flatMap((modulo) => modulo.aulas);
  const indice = aulas.findIndex((aula) => Number(aula.id) === Number(aulaAtual.id));
  return indice >= 0 ? aulas[indice + 1] || null : null;
}

module.exports = {
  moduloVisivel,
  incluirTrilhas,
  listarModulosVisiveis,
  obterModuloVisivel,
  obterAulaVisivel,
  obterQuestaoDeAulaAcessivel,
  obterDiscursivaAcessivel,
  encontrarProximaAulaVisivel,
};
