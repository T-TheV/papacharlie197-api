const service = require("../services/aprendizagem.service");

async function planoHoje(requisicao, resposta, proximo) {
  try {
    resposta.json({ plano: await service.obterPlanoHoje(requisicao.usuario.id, requisicao.contextoCurso) });
  } catch (erro) { proximo(erro); }
}

async function atualizarItemPlano(requisicao, resposta, proximo) {
  try {
    const item = await service.atualizarItemPlano(
      requisicao.usuario.id,
      requisicao.contextoCurso,
      requisicao.params.id,
      requisicao.body?.status,
    );
    resposta.json({ item });
  } catch (erro) { proximo(erro); }
}

async function obterPreferencias(requisicao, resposta, proximo) {
  try {
    resposta.json(await service.obterPreferencias(requisicao.usuario.id, requisicao.contextoCurso));
  } catch (erro) { proximo(erro); }
}

async function atualizarPreferencias(requisicao, resposta, proximo) {
  try {
    resposta.json(await service.atualizarPreferencias(
      requisicao.usuario.id,
      requisicao.contextoCurso,
      requisicao.body || {},
    ));
  } catch (erro) { proximo(erro); }
}

async function listarFlashcards(requisicao, resposta, proximo) {
  try {
    resposta.json(await service.listarFlashcards(requisicao.usuario.id, requisicao.contextoCurso, {
      vencidos: requisicao.query.vencidos !== "false",
      moduloId: requisicao.query.moduloId,
      aulaId: requisicao.query.aulaId,
    }));
  } catch (erro) { proximo(erro); }
}

async function criarFlashcard(requisicao, resposta, proximo) {
  try {
    const flashcard = await service.criarFlashcard(
      requisicao.usuario.id,
      requisicao.contextoCurso,
      requisicao.body || {},
    );
    resposta.status(201).json({ flashcard });
  } catch (erro) { proximo(erro); }
}

async function gerarFlashcards(requisicao, resposta, proximo) {
  try {
    const resultado = await service.gerarFlashcardsDaAula(
      requisicao.usuario.id,
      requisicao.contextoCurso,
      requisicao.params.aulaId,
      requisicao.body?.quantidade,
    );
    resposta.status(resultado.existentes ? 200 : 201).json(resultado);
  } catch (erro) { proximo(erro); }
}

async function gerarFlashcardsDosErros(requisicao, resposta, proximo) {
  try {
    const resultado = await service.gerarFlashcardsDosErros(
      requisicao.usuario.id,
      requisicao.contextoCurso,
      requisicao.body?.quantidade,
    );
    resposta.status(resultado.criados ? 201 : 200).json(resultado);
  } catch (erro) { proximo(erro); }
}

async function atualizarFlashcard(requisicao, resposta, proximo) {
  try {
    const flashcard = await service.atualizarFlashcard(
      requisicao.usuario.id,
      requisicao.contextoCurso,
      requisicao.params.id,
      requisicao.body || {},
    );
    resposta.json({ flashcard });
  } catch (erro) { proximo(erro); }
}

async function revisarFlashcard(requisicao, resposta, proximo) {
  try {
    const flashcard = await service.revisarFlashcard(
      requisicao.usuario.id,
      requisicao.contextoCurso,
      requisicao.params.id,
      requisicao.body?.avaliacao,
    );
    resposta.json({ flashcard });
  } catch (erro) { proximo(erro); }
}

async function mapaEdital(requisicao, resposta, proximo) {
  try {
    resposta.json({ mapa: await service.obterMapaEdital(requisicao.usuario.id, requisicao.contextoCurso) });
  } catch (erro) { proximo(erro); }
}

async function evolucao(requisicao, resposta, proximo) {
  try {
    resposta.json({ evolucao: await service.obterEvolucao(
      requisicao.usuario.id,
      requisicao.contextoCurso,
      requisicao.query.dias,
    ) });
  } catch (erro) { proximo(erro); }
}

module.exports = {
  planoHoje,
  atualizarItemPlano,
  obterPreferencias,
  atualizarPreferencias,
  listarFlashcards,
  criarFlashcard,
  gerarFlashcards,
  gerarFlashcardsDosErros,
  atualizarFlashcard,
  revisarFlashcard,
  mapaEdital,
  evolucao,
};
