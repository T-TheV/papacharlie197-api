const catalogoService = require("../services/catalogo.service");

async function listarPublico(requisicao, resposta, proximo) {
  try {
    const agencias = await catalogoService.listarAgenciasPublico();
    resposta.json({ agencias });
  } catch (erro) {
    proximo(erro);
  }
}

async function listar(requisicao, resposta, proximo) {
  try {
    const agencias = await catalogoService.listarAgenciasDoUsuario(requisicao.usuario.id);
    resposta.json({ agencias });
  } catch (erro) {
    proximo(erro);
  }
}

async function ativar(requisicao, resposta, proximo) {
  try {
    const { agenciaId, trilhaId } = requisicao.body || {};
    if (!agenciaId) return resposta.status(400).json({ erro: "Informe a agência" });
    const contexto = await catalogoService.ativarAgenciaTrilha(requisicao.usuario.id, agenciaId, trilhaId || null);
    const agencias = await catalogoService.listarAgenciasDoUsuario(requisicao.usuario.id);
    resposta.json({
      agencia: agencias.find((agencia) => Number(agencia.id) === Number(contexto.agenciaId)),
      trilha: catalogoService.dtoTrilha(contexto.trilha, { inscrito: true }),
      agencias,
    });
  } catch (erro) {
    proximo(erro);
  }
}

async function inscrever(requisicao, resposta, proximo) {
  try {
    const { agenciaId, trilhaId } = requisicao.body || {};
    if (!agenciaId || !trilhaId) {
      return resposta.status(400).json({ erro: "Informe a agência e a trilha" });
    }
    const { contexto, criada } = await catalogoService.inscreverTrilha(
      requisicao.usuario.id,
      agenciaId,
      trilhaId,
    );
    const agencias = await catalogoService.listarAgenciasDoUsuario(requisicao.usuario.id);
    return resposta.status(criada ? 201 : 200).json({
      agencia: agencias.find((agencia) => Number(agencia.id) === Number(contexto.agenciaId)),
      trilha: catalogoService.dtoTrilha(contexto.trilha, { inscrito: true }),
      agencias,
    });
  } catch (erro) {
    return proximo(erro);
  }
}

async function definirDataProva(requisicao, resposta, proximo) {
  try {
    const { dataProva } = requisicao.body || {};
    await catalogoService.definirDataProva(requisicao.usuario.id, dataProva || null);
    const contexto = await catalogoService.obterContextoAtivo(requisicao.usuario.id);
    resposta.json({ dataProva: contexto.dataProva });
  } catch (erro) {
    proximo(erro);
  }
}

module.exports = { listarPublico, listar, ativar, inscrever, definirDataProva };
