const amizadeService = require("../services/amizade.service");

async function buscarUsuarios(requisicao, resposta, proximo) {
  try {
    const usuarios = await amizadeService.buscarUsuarios(requisicao.usuario.id, requisicao.query.q);
    resposta.json({ usuarios });
  } catch (erro) {
    proximo(erro);
  }
}

async function listarAmigos(requisicao, resposta, proximo) {
  try {
    const amigos = await amizadeService.listarAmigos(requisicao.usuario.id);
    resposta.json({ amigos });
  } catch (erro) {
    proximo(erro);
  }
}

async function listarSolicitacoesPendentes(requisicao, resposta, proximo) {
  try {
    const solicitacoes = await amizadeService.listarSolicitacoesPendentes(requisicao.usuario.id);
    resposta.json({ solicitacoes });
  } catch (erro) {
    proximo(erro);
  }
}

async function solicitarAmizade(requisicao, resposta, proximo) {
  try {
    const { amigoId } = requisicao.body || {};
    if (!amigoId) return resposta.status(400).json({ erro: "Informe o usuário para adicionar" });

    await amizadeService.solicitarAmizade(requisicao.usuario.id, amigoId);
    resposta.status(201).json({ sucesso: true });
  } catch (erro) {
    proximo(erro);
  }
}

async function aceitarSolicitacao(requisicao, resposta, proximo) {
  try {
    await amizadeService.aceitarSolicitacao(requisicao.usuario.id, requisicao.params.id);
    resposta.json({ sucesso: true });
  } catch (erro) {
    proximo(erro);
  }
}

async function recusarOuCancelar(requisicao, resposta, proximo) {
  try {
    await amizadeService.recusarOuCancelar(requisicao.usuario.id, requisicao.params.id);
    resposta.status(204).send();
  } catch (erro) {
    proximo(erro);
  }
}

async function obterPerfilDeAmigo(requisicao, resposta, proximo) {
  try {
    const perfil = await amizadeService.obterPerfilDeAmigo(requisicao.usuario.id, requisicao.params.amigoId);
    resposta.json({ perfil });
  } catch (erro) {
    proximo(erro);
  }
}

async function desfazerAmizade(requisicao, resposta, proximo) {
  try {
    await amizadeService.desfazerAmizade(requisicao.usuario.id, requisicao.params.amigoId);
    resposta.status(204).send();
  } catch (erro) {
    proximo(erro);
  }
}

async function obterRankingSemanal(requisicao, resposta, proximo) {
  try {
    const ranking = await amizadeService.obterRankingSemanal(requisicao.usuario.id);
    resposta.json({ ranking });
  } catch (erro) {
    proximo(erro);
  }
}

module.exports = {
  buscarUsuarios,
  listarAmigos,
  listarSolicitacoesPendentes,
  solicitarAmizade,
  aceitarSolicitacao,
  recusarOuCancelar,
  obterPerfilDeAmigo,
  desfazerAmizade,
  obterRankingSemanal,
};
