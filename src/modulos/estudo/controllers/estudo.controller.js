const estudoService = require("../services/estudo.service");
const gamificacaoService = require("../../progresso/services/gamificacao.service");

async function listarModulos(requisicao, resposta, proximo) {
  try {
    const modulos = await estudoService.listarModulosComProgresso(requisicao.usuario.id, requisicao.usuario.cargo);
    resposta.json({ modulos });
  } catch (erro) {
    proximo(erro);
  }
}

async function obterAula(requisicao, resposta, proximo) {
  try {
    const aula = await estudoService.obterAula(requisicao.params.id, requisicao.usuario.id);
    resposta.json(aula);
  } catch (erro) {
    proximo(erro);
  }
}

async function responderQuestao(requisicao, resposta, proximo) {
  try {
    const { alternativa } = requisicao.body || {};

    if (!["a", "b", "c", "d", "e"].includes(alternativa)) {
      return resposta.status(400).json({ erro: "Alternativa inválida" });
    }

    const resultado = await gamificacaoService.processarResposta({
      usuarioId: requisicao.usuario.id,
      questaoId: requisicao.params.id,
      alternativa,
    });

    if (resultado.aguardandoRevisao) {
      return resposta.status(403).json({
        erro: "Você já errou esta questão. Aguarde o horário de revisão liberado.",
        disponivelEm: resultado.disponivelEm,
      });
    }

    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

async function listarRevisao(requisicao, resposta, proximo) {
  try {
    const revisao = await estudoService.listarRevisaoObrigatoria(requisicao.usuario.id);
    resposta.json({ revisao });
  } catch (erro) {
    proximo(erro);
  }
}

async function responderDiscursiva(requisicao, resposta, proximo) {
  try {
    const { respostaTexto } = requisicao.body || {};

    if (!respostaTexto || !respostaTexto.trim()) {
      return resposta.status(400).json({ erro: "Escreva uma resposta antes de enviar" });
    }

    const resultado = await estudoService.responderDiscursiva(
      requisicao.usuario.id,
      requisicao.params.id,
      respostaTexto.trim(),
    );
    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

module.exports = { listarModulos, obterAula, responderQuestao, listarRevisao, responderDiscursiva };
