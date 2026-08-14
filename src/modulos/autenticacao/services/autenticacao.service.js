const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Usuario = require("../models/usuario.model");
const TokenRecuperacaoSenha = require("../models/tokenRecuperacaoSenha.model");
const { jwtSegredo, jwtExpiracao } = require("../../../config/ambiente");

const HORAS_VALIDADE_TOKEN_RECUPERACAO = 1;

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id }, jwtSegredo, { expiresIn: jwtExpiracao });
}

function paraDto(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    sobrenome: usuario.sobrenome,
    email: usuario.email,
    fotoUrl: usuario.foto_url,
    xp: usuario.xp,
    papel: usuario.papel,
    cargo: usuario.cargo,
  };
}

async function registrar({ nome, sobrenome, email, senha, fotoUrl }) {
  const jaExiste = await Usuario.findOne({ where: { email } });
  if (jaExiste) {
    const erro = new Error("Já existe uma conta com este e-mail");
    erro.status = 409;
    throw erro;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await Usuario.create({
    nome,
    sobrenome,
    email,
    senha_hash: senhaHash,
    foto_url: fotoUrl || null,
  });

  return { usuario: paraDto(usuario), token: gerarToken(usuario) };
}

async function login({ email, senha }) {
  const usuario = await Usuario.findOne({ where: { email: String(email || "").toLowerCase().trim() } });
  const credenciaisInvalidas = () => {
    const erro = new Error("E-mail ou senha inválidos");
    erro.status = 401;
    return erro;
  };

  if (!usuario) throw credenciaisInvalidas();

  const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaConfere) throw credenciaisInvalidas();

  return { usuario: paraDto(usuario), token: gerarToken(usuario) };
}

const CARGOS_VALIDOS = ["agente", "escrivao", "delegado"];

async function atualizarPerfil(usuarioId, { nome, sobrenome, fotoUrl, cargo }) {
  const usuario = await Usuario.findByPk(usuarioId);

  if (nome) usuario.nome = nome;
  if (sobrenome) usuario.sobrenome = sobrenome;
  if (fotoUrl) usuario.foto_url = fotoUrl;
  if (cargo !== undefined) {
    if (cargo !== "" && !CARGOS_VALIDOS.includes(cargo)) {
      const erro = new Error("Cargo inválido");
      erro.status = 400;
      throw erro;
    }
    usuario.cargo = cargo || null;
  }

  await usuario.save();
  return paraDto(usuario);
}

async function alterarSenha(usuarioId, { senhaAtual, novaSenha }) {
  const usuario = await Usuario.findByPk(usuarioId);

  const senhaConfere = await bcrypt.compare(senhaAtual, usuario.senha_hash);
  if (!senhaConfere) {
    const erro = new Error("Senha atual incorreta");
    erro.status = 400;
    throw erro;
  }

  usuario.senha_hash = await bcrypt.hash(novaSenha, 10);
  await usuario.save();
}

async function solicitarRecuperacao(email) {
  const usuario = await Usuario.findOne({ where: { email: String(email || "").toLowerCase().trim() } });

  if (!usuario) {
    return { enviado: true };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + HORAS_VALIDADE_TOKEN_RECUPERACAO * 60 * 60 * 1000);

  await TokenRecuperacaoSenha.create({
    usuario_id: usuario.id,
    token,
    expira_em: expiraEm,
  });

  return { enviado: true, token };
}

async function resetarSenha(token, novaSenha) {
  const credenciaisInvalidas = () => {
    const erro = new Error("Link de recuperação inválido ou expirado");
    erro.status = 400;
    return erro;
  };

  const registro = await TokenRecuperacaoSenha.findOne({ where: { token, usado: false } });
  if (!registro || registro.expira_em < new Date()) throw credenciaisInvalidas();

  const usuario = await Usuario.findByPk(registro.usuario_id);
  if (!usuario) throw credenciaisInvalidas();

  usuario.senha_hash = await bcrypt.hash(novaSenha, 10);
  await usuario.save();

  registro.usado = true;
  await registro.save();
}

module.exports = {
  registrar,
  login,
  paraDto,
  atualizarPerfil,
  alterarSenha,
  solicitarRecuperacao,
  resetarSenha,
};
