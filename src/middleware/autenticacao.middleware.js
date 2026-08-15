const jwt = require("jsonwebtoken");
const { jwtSegredo } = require("../config/ambiente");
const Usuario = require("../modulos/autenticacao/models/usuario.model");
const { obterContextoAtivo } = require("../modulos/catalogo/services/catalogo.service");

function tokenDoCookie(cabecalhoCookie = "") {
  const item = cabecalhoCookie
    .split(";")
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith("pc197_sessao="));
  return item ? decodeURIComponent(item.slice("pc197_sessao=".length)) : null;
}

async function autenticar(requisicao, resposta, proximo) {
  try {
    const cabecalho = requisicao.headers.authorization || "";
    const [, tokenBearer] = cabecalho.split(" ");
    const token = tokenBearer || tokenDoCookie(requisicao.headers.cookie);

    if (!token) {
      return resposta.status(401).json({ erro: "Token não informado" });
    }

    const payload = jwt.verify(token, jwtSegredo);
    const usuario = await Usuario.findByPk(payload.id);

    if (!usuario || payload.versao !== usuario.versao_token) {
      return resposta.status(401).json({ erro: "Usuário não encontrado" });
    }

    requisicao.usuario = usuario;
    requisicao.contextoCurso = await obterContextoAtivo(usuario.id);
    proximo();
  } catch (erro) {
    resposta.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

module.exports = autenticar;
