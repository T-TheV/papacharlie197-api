const Modulo = require("../../estudo/models/modulo.model");
const Aula = require("../../estudo/models/aula.model");
const Questao = require("../../estudo/models/questao.model");
const QuestaoDiscursiva = require("../../estudo/models/questaoDiscursiva.model");

function naoEncontrado(entidade) {
  const erro = new Error(`${entidade} não encontrado(a)`);
  erro.status = 404;
  throw erro;
}

async function listarConteudo() {
  return Modulo.findAll({
    include: [
      {
        model: Aula,
        as: "aulas",
        include: [
          { model: Questao, as: "questoes" },
          { model: QuestaoDiscursiva, as: "discursivas" },
        ],
      },
    ],
    order: [
      ["ordem", "ASC"],
      [{ model: Aula, as: "aulas" }, "ordem", "ASC"],
    ],
  });
}

async function criarModulo(dados) {
  return Modulo.create(dados);
}

async function atualizarModulo(id, dados) {
  const modulo = await Modulo.findByPk(id);
  if (!modulo) naoEncontrado("Módulo");
  await modulo.update(dados);
  return modulo;
}

async function excluirModulo(id) {
  const modulo = await Modulo.findByPk(id);
  if (!modulo) naoEncontrado("Módulo");
  await modulo.destroy();
}

async function criarAula(dados) {
  return Aula.create(dados);
}

async function atualizarAula(id, dados) {
  const aula = await Aula.findByPk(id);
  if (!aula) naoEncontrado("Aula");
  await aula.update(dados);
  return aula;
}

async function excluirAula(id) {
  const aula = await Aula.findByPk(id);
  if (!aula) naoEncontrado("Aula");
  await aula.destroy();
}

async function criarQuestao(dados) {
  return Questao.create(dados);
}

async function atualizarQuestao(id, dados) {
  const questao = await Questao.findByPk(id);
  if (!questao) naoEncontrado("Questão");
  await questao.update(dados);
  return questao;
}

async function excluirQuestao(id) {
  const questao = await Questao.findByPk(id);
  if (!questao) naoEncontrado("Questão");
  await questao.destroy();
}

async function criarDiscursiva(dados) {
  return QuestaoDiscursiva.create(dados);
}

async function atualizarDiscursiva(id, dados) {
  const discursiva = await QuestaoDiscursiva.findByPk(id);
  if (!discursiva) naoEncontrado("Questão discursiva");
  await discursiva.update(dados);
  return discursiva;
}

async function excluirDiscursiva(id) {
  const discursiva = await QuestaoDiscursiva.findByPk(id);
  if (!discursiva) naoEncontrado("Questão discursiva");
  await discursiva.destroy();
}

module.exports = {
  listarConteudo,
  criarModulo,
  atualizarModulo,
  excluirModulo,
  criarAula,
  atualizarAula,
  excluirAula,
  criarQuestao,
  atualizarQuestao,
  excluirQuestao,
  criarDiscursiva,
  atualizarDiscursiva,
  excluirDiscursiva,
};
