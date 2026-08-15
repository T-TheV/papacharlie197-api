const missaoService = require("../services/missao.service");

function dtoMissao(missao) {
  return {
    id: missao.id,
    tipo: missao.tipo,
    titulo: missao.titulo,
    descricao: missao.descricao,
    tipoMeta: missao.tipo_meta,
    metaValor: missao.meta_valor,
    progressoAtual: missao.progresso_atual,
    concluida: missao.concluida,
    recompensaXp: missao.recompensa_xp,
    moduloTitulo: missao.modulo?.titulo || null,
    periodoFim: missao.periodo_fim,
  };
}

async function listarMissoes(requisicao, resposta, proximo) {
  try {
    const missoes = await missaoService.obterOuGerarMissoes(requisicao.usuario.id, requisicao.contextoCurso);
    resposta.json({ missoes: missoes.map(dtoMissao) });
  } catch (erro) {
    proximo(erro);
  }
}

module.exports = { listarMissoes };
