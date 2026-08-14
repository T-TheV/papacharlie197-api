const jwt = require("jsonwebtoken");
const { jwtSegredo } = require("../config/ambiente");
const Usuario = require("../modulos/autenticacao/models/usuario.model");

async function autenticar(requisicao, resposta, proximo) {
  try {
    const cabecalho = requisicao.headers.authorization || "";
    const [, token] = cabecalho.split(" ");

    if (!token) {
      return resposta.status(401).json({ erro: "Token não informado" });
    }

    const payload = jwt.verify(token, jwtSegredo);
    const usuario = await Usuario.findByPk(payload.id);

    if (!usuario) {
      return resposta.status(401).json({ erro: "Usuário não encontrado" });
    }

    requisicao.usuario = usuario;
    proximo();
  } catch (erro) {
    resposta.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

module.exports = autenticar;
