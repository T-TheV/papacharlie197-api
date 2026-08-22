const Aula = require("../models/aula.model");
const Questao = require("../models/questao.model");
const QuestaoDiscursiva = require("../models/questaoDiscursiva.model");
const { obterAulaVisivel } = require("./acessoConteudo.service");
const { gerarMapaMental } = require("../../ia/services/gemini.service");
const {
  textoLimpo,
  hashConteudoAula,
  normalizarMapaMental,
  criarMapaMentalBasico,
} = require("./mapaMental.util");

const INTERVALO_NOVA_TENTATIVA_MS = 6 * 60 * 60 * 1000;

function dadosConteudo(aula) {
  return {
    titulo: aula.titulo,
    resumoTexto: aula.resumo_texto,
    transcricaoTexto: aula.transcricao_texto,
    questoes: (aula.questoes || []).map((questao) => questao.enunciado),
    discursivas: (aula.discursivas || []).map((questao) => questao.enunciado),
  };
}

function possuiFonteSuficiente(aula) {
  return textoLimpo(aula.transcricao_texto || aula.resumo_texto).length >= 50
    || (aula.questoes || []).length + (aula.discursivas || []).length > 0;
}

function podeAprimorar(aula) {
  if (aula.mapa_mental_fonte === "ia" || !possuiFonteSuficiente(aula)) return false;
  if (!aula.mapa_mental_tentativa_em) return true;
  return Date.now() - new Date(aula.mapa_mental_tentativa_em).getTime() >= INTERVALO_NOVA_TENTATIVA_MS;
}

function dtoMapaMental(aula, aviso = null) {
  return {
    estrutura: normalizarMapaMental(aula.mapa_mental, aula.titulo),
    fonte: aula.mapa_mental_fonte || "estrutura",
    atualizadoEm: aula.mapa_mental_gerado_em,
    podeAprimorar: podeAprimorar(aula),
    aviso,
  };
}

async function garantirMapaMentalBasico(aula, { transaction } = {}) {
  const conteudo = dadosConteudo(aula);
  const hash = hashConteudoAula(conteudo);
  if (aula.mapa_mental && aula.mapa_mental_hash === hash) return dtoMapaMental(aula);
  const mapa = criarMapaMentalBasico(conteudo);
  await aula.update({
    mapa_mental: mapa,
    mapa_mental_fonte: "estrutura",
    mapa_mental_hash: hash,
    mapa_mental_gerado_em: new Date(),
    mapa_mental_tentativa_em: null,
  }, { transaction });
  return dtoMapaMental(aula);
}

async function aprimorarMapaMental({ aulaId, usuarioId, contexto }) {
  await obterAulaVisivel(aulaId, usuarioId, contexto);
  const aula = await Aula.findByPk(aulaId, {
    include: [
      { model: Questao, as: "questoes", where: { origem: "estudo" }, required: false },
      { model: QuestaoDiscursiva, as: "discursivas", required: false },
    ],
  });
  await garantirMapaMentalBasico(aula);
  if (aula.mapa_mental_fonte === "ia" || !podeAprimorar(aula)) return dtoMapaMental(aula);

  const tentativaEm = new Date();
  try {
    const conteudo = dadosConteudo(aula);
    const gerado = await gerarMapaMental({
      titulo: conteudo.titulo,
      resumo: conteudo.resumoTexto,
      transcricao: conteudo.transcricaoTexto,
      questoes: conteudo.questoes,
      discursivas: conteudo.discursivas,
    });
    await aula.update({
      mapa_mental: normalizarMapaMental(gerado, aula.titulo),
      mapa_mental_fonte: "ia",
      mapa_mental_hash: hashConteudoAula(conteudo),
      mapa_mental_gerado_em: new Date(),
      mapa_mental_tentativa_em: tentativaEm,
    });
    return dtoMapaMental(aula);
  } catch (erro) {
    await aula.update({ mapa_mental_tentativa_em: tentativaEm });
    console.error(`[mapa mental] não foi possível aprimorar a aula ${aula.id}:`, erro.message);
    return dtoMapaMental(aula, "O mapa inicial está disponível; o aprimoramento automático será tentado novamente mais tarde.");
  }
}

module.exports = {
  dadosConteudo,
  dtoMapaMental,
  garantirMapaMentalBasico,
  aprimorarMapaMental,
};
