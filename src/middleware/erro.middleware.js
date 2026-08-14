function tratadorDeErro(erro, requisicao, resposta, proximo) {
  console.error(erro);
  const status = erro.status || 500;
  resposta.status(status).json({ erro: erro.message || "Erro interno do servidor" });
}

module.exports = tratadorDeErro;
