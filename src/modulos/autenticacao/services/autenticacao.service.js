const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Usuario = require("../models/usuario.model");
const TokenRecuperacaoSenha = require("../models/tokenRecuperacaoSenha.model");
const { jwtSegredo, jwtExpiracao } = require("../../../config/ambiente");
const { hojeISO } = require("../../progresso/services/streak.service");
const { sequelize } = require("../../../config/configDB");
const {
  garantirMatriculaPadrao,
  matricularNaTrilhaEscolhida,
  obterContextoAtivo,
  ativarAgenciaTrilha,
  inscreverTrilha,
  dtoAgencia,
  dtoTrilha,
} = require("../../catalogo/services/catalogo.service");

const HORAS_VALIDADE_TOKEN_RECUPERACAO = 1;

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, versao: usuario.versao_token }, jwtSegredo, { expiresIn: jwtExpiracao });
}

function paraDto(usuario, contexto = null) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    sobrenome: usuario.sobrenome,
    email: usuario.email,
    arroba: usuario.arroba,
    fotoUrl: usuario.foto_url,
    xp: usuario.xp,
    papel: usuario.papel,
    cargo: contexto?.trilha?.slug || usuario.cargo,
    agencia: contexto?.agencia ? dtoAgencia(contexto.agencia) : null,
    trilha: contexto?.trilha ? dtoTrilha(contexto.trilha) : null,
    dataProva: contexto?.dataProva || null,
    sequenciaAtual: usuario.sequencia_atual,
    melhorSequencia: usuario.melhor_sequencia,
    congelamentosDisponiveis: usuario.congelamentos_disponiveis,
    ativoHoje: usuario.ultima_atividade_em === hojeISO(),
    diasEstudo: usuario.dias_estudo || [],
  };
}

async function registrar({ nome, sobrenome, email, senha, fotoUrl, agenciaId, trilhaId }) {
  const jaExiste = await Usuario.findOne({ where: { email } });
  if (jaExiste) {
    const erro = new Error("Já existe uma conta com este e-mail");
    erro.status = 409;
    throw erro;
  }

  return sequelize.transaction(async (transaction) => {
    const senhaHash = await bcrypt.hash(senha, 12);
    const usuario = await Usuario.create({
      nome: String(nome).trim(),
      sobrenome: String(sobrenome).trim(),
      email,
      senha_hash: senhaHash,
      foto_url: fotoUrl || null,
    }, { transaction });
    if (agenciaId && trilhaId) {
      await matricularNaTrilhaEscolhida(usuario.id, agenciaId, trilhaId, transaction);
    } else {
      await garantirMatriculaPadrao(usuario.id, transaction);
    }
    const contexto = await obterContextoAtivo(usuario.id, { transaction });
    return { usuario: paraDto(usuario, contexto), token: gerarToken(usuario) };
  });
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

  const contexto = await obterContextoAtivo(usuario.id);
  return { usuario: paraDto(usuario, contexto), token: gerarToken(usuario) };
}

const CARGOS_VALIDOS = ["agente", "escrivao", "delegado"];
const REGEX_ARROBA = /^[a-z0-9._]{3,20}$/;

async function atualizarPerfil(usuarioId, { nome, sobrenome, fotoUrl, cargo, trilhaId, diasEstudo, arroba }) {
  const usuario = await Usuario.findByPk(usuarioId);

  if (nome) usuario.nome = nome;
  if (sobrenome) usuario.sobrenome = sobrenome;
  if (fotoUrl) usuario.foto_url = fotoUrl;
  if (arroba !== undefined) {
    const limpo = String(arroba || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

    if (limpo === "") {
      usuario.arroba = null;
    } else {
      if (!REGEX_ARROBA.test(limpo)) {
        const erro = new Error("O @ deve ter de 3 a 20 caracteres: letras minúsculas, números, ponto ou underscore.");
        erro.status = 400;
        throw erro;
      }
      const jaExiste = await Usuario.findOne({ where: { arroba: limpo } });
      if (jaExiste && jaExiste.id !== usuario.id) {
        const erro = new Error("Esse @ já está em uso por outra pessoa.");
        erro.status = 409;
        throw erro;
      }
      usuario.arroba = limpo;
    }
  }
  if (cargo !== undefined) {
    if (cargo !== "" && !CARGOS_VALIDOS.includes(cargo)) {
      const erro = new Error("Cargo inválido");
      erro.status = 400;
      throw erro;
    }
    usuario.cargo = cargo || null;
  }
  if (diasEstudo !== undefined) {
    const valido =
      Array.isArray(diasEstudo) && diasEstudo.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (!valido) {
      const erro = new Error("Dias de estudo inválidos");
      erro.status = 400;
      throw erro;
    }
    usuario.dias_estudo = diasEstudo;
  }

  await usuario.save();
  let contexto = await obterContextoAtivo(usuario.id);
  const trilhaAlvo = trilhaId || (cargo ? contexto.agencia.trilhas?.find?.((t) => t.slug === cargo)?.id : null);
  if (trilhaId !== undefined || cargo !== undefined) {
    if (cargo && !trilhaAlvo) {
      const Trilha = require("../../catalogo/models/trilha.model");
      const trilhaLegada = await Trilha.findOne({ where: { agencia_id: contexto.agenciaId, slug: cargo } });
      if (trilhaLegada) await inscreverTrilha(usuario.id, contexto.agenciaId, trilhaLegada.id);
    } else {
      if (trilhaAlvo) {
        await inscreverTrilha(usuario.id, contexto.agenciaId, trilhaAlvo);
      } else {
        await ativarAgenciaTrilha(usuario.id, contexto.agenciaId, null);
      }
    }
    contexto = await obterContextoAtivo(usuario.id);
  }
  return paraDto(usuario, contexto);
}

async function alterarSenha(usuarioId, { senhaAtual, novaSenha }) {
  const usuario = await Usuario.findByPk(usuarioId);

  const senhaConfere = await bcrypt.compare(senhaAtual, usuario.senha_hash);
  if (!senhaConfere) {
    const erro = new Error("Senha atual incorreta");
    erro.status = 400;
    throw erro;
  }

  usuario.senha_hash = await bcrypt.hash(novaSenha, 12);
  usuario.versao_token += 1;
  await usuario.save();
}

async function revogarSessoes(usuarioId) {
  await Usuario.increment("versao_token", { by: 1, where: { id: usuarioId } });
}

async function solicitarRecuperacao(email) {
  const usuario = await Usuario.findOne({ where: { email: String(email || "").toLowerCase().trim() } });

  if (!usuario) {
    return { enviado: true };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiraEm = new Date(Date.now() + HORAS_VALIDADE_TOKEN_RECUPERACAO * 60 * 60 * 1000);

  await sequelize.transaction(async (transaction) => {
    await TokenRecuperacaoSenha.update(
      { usado: true },
      { where: { usuario_id: usuario.id, usado: false }, transaction },
    );
    await TokenRecuperacaoSenha.create({
      usuario_id: usuario.id,
      token: tokenHash,
      expira_em: expiraEm,
    }, { transaction });
  });

  return { enviado: true, token };
}

async function resetarSenha(token, novaSenha) {
  const credenciaisInvalidas = () => {
    const erro = new Error("Link de recuperação inválido ou expirado");
    erro.status = 400;
    return erro;
  };

  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
  await sequelize.transaction(async (transaction) => {
    const registro = await TokenRecuperacaoSenha.findOne({
      where: { token: tokenHash, usado: false },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!registro || registro.expira_em < new Date()) throw credenciaisInvalidas();

    const usuario = await Usuario.findByPk(registro.usuario_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!usuario) throw credenciaisInvalidas();

    usuario.senha_hash = await bcrypt.hash(novaSenha, 12);
    usuario.versao_token += 1;
    await usuario.save({ transaction });
    await registro.update({ usado: true }, { transaction });
  });
}

module.exports = {
  registrar,
  login,
  paraDto,
  atualizarPerfil,
  alterarSenha,
  revogarSessoes,
  solicitarRecuperacao,
  resetarSenha,
};
