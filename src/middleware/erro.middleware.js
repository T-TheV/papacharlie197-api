function tratadorDeErro(erro, requisicao, resposta, proximo) {
  console.error(erro);
  const erroDeValidacao = erro.name === "SequelizeValidationError" || erro.name === "SequelizeUniqueConstraintError";
  const status = erro.status || (erroDeValidacao ? 400 : 500);
  const mensagem = status >= 500 ? "Erro interno do servidor" : erro.message;
  resposta.status(status).json({ erro: mensagem || "Erro interno do servidor" });
}

module.exports = tratadorDeErro;
