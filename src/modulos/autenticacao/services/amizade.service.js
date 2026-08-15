const { Op } = require("sequelize");
const Usuario = require("../models/usuario.model");
const Amizade = require("../models/amizade.model");
const Modulo = require("../../estudo/models/modulo.model");
const Aula = require("../../estudo/models/aula.model");
const ProgressoUsuario = require("../../progresso/models/progressoUsuario.model");
const { xpDesde } = require("../../progresso/services/xp.service");

function naoEncontrado(entidade) {
  const erro = new Error(`${entidade} não encontrado(a)`);
  erro.status = 404;
  throw erro;
}

async function buscarUsuarios(usuarioId, termo) {
  if (!termo || termo.trim().length < 2) return [];

  const termoLimpo = termo.trim().replace(/^@/, "");
  const termoBusca = `%${termoLimpo}%`;
  const usuarios = await Usuario.findAll({
    where: {
      id: { [Op.ne]: usuarioId },
      [Op.or]: [
        { nome: { [Op.iLike]: termoBusca } },
        { sobrenome: { [Op.iLike]: termoBusca } },
        { arroba: { [Op.iLike]: termoBusca } },
      ],
    },
    attributes: ["id", "nome", "sobrenome", "foto_url", "cargo", "arroba"],
    limit: 20,
  });

  const amizades = await Amizade.findAll({
    where: {
      [Op.or]: [
        { usuario_id: usuarioId, amigo_id: usuarios.map((u) => u.id) },
        { amigo_id: usuarioId, usuario_id: usuarios.map((u) => u.id) },
      ],
    },
  });

  const statusPorUsuario = new Map();
  for (const amizade of amizades) {
    const outroId = amizade.usuario_id === usuarioId ? amizade.amigo_id : amizade.usuario_id;
    statusPorUsuario.set(outroId, amizade.status === "aceito" ? "amigo" : "pendente");
  }

  return usuarios.map((u) => ({
    id: u.id,
    nome: u.nome,
    sobrenome: u.sobrenome,
    fotoUrl: u.foto_url,
    cargo: u.cargo,
    arroba: u.arroba,
    status: statusPorUsuario.get(u.id) || "nenhum",
  }));
}

async function listarAmigos(usuarioId) {
  const amizades = await Amizade.findAll({
    where: {
      status: "aceito",
      [Op.or]: [{ usuario_id: usuarioId }, { amigo_id: usuarioId }],
    },
    include: [
      { model: Usuario, as: "solicitante", attributes: ["id", "nome", "sobrenome", "foto_url", "cargo"] },
      { model: Usuario, as: "destinatario", attributes: ["id", "nome", "sobrenome", "foto_url", "cargo"] },
    ],
    order: [["updated_at", "DESC"]],
  });

  return amizades.map((amizade) => {
    const amigo = amizade.usuario_id === usuarioId ? amizade.destinatario : amizade.solicitante;
    return {
      id: amigo.id,
      nome: amigo.nome,
      sobrenome: amigo.sobrenome,
      fotoUrl: amigo.foto_url,
      cargo: amigo.cargo,
    };
  });
}

async function listarSolicitacoesPendentes(usuarioId) {
  const pendentes = await Amizade.findAll({
    where: { amigo_id: usuarioId, status: "pendente" },
    include: [{ model: Usuario, as: "solicitante", attributes: ["id", "nome", "sobrenome", "foto_url", "cargo"] }],
    order: [["created_at", "DESC"]],
  });

  return pendentes.map((p) => ({
    id: p.id,
    usuario: {
      id: p.solicitante.id,
      nome: p.solicitante.nome,
      sobrenome: p.solicitante.sobrenome,
      fotoUrl: p.solicitante.foto_url,
      cargo: p.solicitante.cargo,
    },
  }));
}

async function solicitarAmizade(usuarioId, amigoId) {
  if (Number(usuarioId) === Number(amigoId)) {
    const erro = new Error("Você não pode adicionar a si mesmo");
    erro.status = 400;
    throw erro;
  }

  const alvo = await Usuario.findByPk(amigoId);
  if (!alvo) naoEncontrado("Usuário");

  const existente = await Amizade.findOne({
    where: {
      [Op.or]: [
        { usuario_id: usuarioId, amigo_id: amigoId },
        { usuario_id: amigoId, amigo_id: usuarioId },
      ],
    },
  });

  if (existente) {
    const erro = new Error(
      existente.status === "aceito" ? "Vocês já são amigos" : "Já existe uma solicitação pendente entre vocês",
    );
    erro.status = 409;
    throw erro;
  }

  return Amizade.create({ usuario_id: usuarioId, amigo_id: amigoId, status: "pendente" });
}

async function aceitarSolicitacao(usuarioId, solicitacaoId) {
  const amizade = await Amizade.findByPk(solicitacaoId);
  if (!amizade || amizade.amigo_id !== usuarioId) naoEncontrado("Solicitação");
  if (amizade.status === "aceito") return amizade;

  await amizade.update({ status: "aceito" });
  return amizade;
}

async function recusarOuCancelar(usuarioId, solicitacaoId) {
  const amizade = await Amizade.findByPk(solicitacaoId);
  if (!amizade || (amizade.amigo_id !== usuarioId && amizade.usuario_id !== usuarioId)) {
    naoEncontrado("Solicitação");
  }
  await amizade.destroy();
}

async function obterProgressoResumo(amigoId, cargo) {
  const todosModulos = await Modulo.findAll({
    include: [{ model: Aula, as: "aulas" }],
    order: [["ordem", "ASC"]],
  });
  const modulos = todosModulos.filter(
    (modulo) => modulo.cargos_alvo.length === 0 || (cargo && modulo.cargos_alvo.includes(cargo)),
  );

  const aulaIds = modulos.flatMap((m) => m.aulas.map((a) => a.id));
  const progressos = await ProgressoUsuario.findAll({
    where: { usuario_id: amigoId, aula_id: aulaIds, status: "concluido" },
  });
  const concluidasPorAula = new Set(progressos.map((p) => p.aula_id));

  let totalAulas = 0;
  let aulasConcluidas = 0;
  let moduloAtual = null;
  for (const modulo of modulos) {
    const totalModulo = modulo.aulas.length;
    if (totalModulo === 0) continue;
    const concluidasModulo = modulo.aulas.filter((a) => concluidasPorAula.has(a.id)).length;
    totalAulas += totalModulo;
    aulasConcluidas += concluidasModulo;
    if (!moduloAtual && concluidasModulo < totalModulo) {
      moduloAtual = { id: modulo.id, titulo: modulo.titulo, corDestaque: modulo.cor_destaque };
    }
  }

  return {
    aulasConcluidas,
    totalAulas,
    percentual: totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0,
    moduloAtual,
  };
}

async function obterPerfilDeAmigo(usuarioId, amigoId) {
  const amizade = await Amizade.findOne({
    where: {
      status: "aceito",
      [Op.or]: [
        { usuario_id: usuarioId, amigo_id: amigoId },
        { usuario_id: amigoId, amigo_id: usuarioId },
      ],
    },
  });
  if (!amizade) {
    const erro = new Error("Vocês não são amigos");
    erro.status = 403;
    throw erro;
  }

  const amigo = await Usuario.findByPk(amigoId, {
    attributes: ["id", "nome", "sobrenome", "foto_url", "cargo", "xp", "sequencia_atual", "melhor_sequencia"],
  });
  if (!amigo) naoEncontrado("Usuário");

  const progresso = await obterProgressoResumo(amigoId, amigo.cargo);

  return {
    id: amigo.id,
    nome: amigo.nome,
    sobrenome: amigo.sobrenome,
    fotoUrl: amigo.foto_url,
    cargo: amigo.cargo,
    xp: amigo.xp,
    sequenciaAtual: amigo.sequencia_atual,
    melhorSequencia: amigo.melhor_sequencia,
    progresso,
  };
}

function inicioSemanaISO() {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = domingo
  const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1;
  const segunda = new Date(agora);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(segunda.getDate() - deslocamento);
  const ano = segunda.getFullYear();
  const mes = String(segunda.getMonth() + 1).padStart(2, "0");
  const dia = String(segunda.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

async function obterRankingSemanal(usuarioId) {
  const amizades = await Amizade.findAll({
    where: {
      status: "aceito",
      [Op.or]: [{ usuario_id: usuarioId }, { amigo_id: usuarioId }],
    },
  });
  const idsAmigos = amizades.map((a) => (a.usuario_id === usuarioId ? a.amigo_id : a.usuario_id));
  const idsParticipantes = [usuarioId, ...idsAmigos];

  const usuarios = await Usuario.findAll({ where: { id: idsParticipantes } });
  const semanaAtual = inicioSemanaISO();
  const xpPorUsuario = await xpDesde(idsParticipantes, new Date(`${semanaAtual}T00:00:00`));

  const ranking = usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      fotoUrl: usuario.foto_url,
      cargo: usuario.cargo,
      xp: usuario.xp,
      xpSemana: xpPorUsuario.get(usuario.id) || 0,
      voce: usuario.id === Number(usuarioId),
    }));

  // Empate no XP da semana desempata pelo XP total (histórico) e depois por id, pra ordem sempre estável.
  ranking.sort((a, b) => b.xpSemana - a.xpSemana || b.xp - a.xp || a.id - b.id);
  return ranking.map(({ xp: _xp, ...item }, indice) => ({ ...item, posicao: indice + 1 }));
}

async function desfazerAmizade(usuarioId, amigoId) {
  const amizade = await Amizade.findOne({
    where: {
      status: "aceito",
      [Op.or]: [
        { usuario_id: usuarioId, amigo_id: amigoId },
        { usuario_id: amigoId, amigo_id: usuarioId },
      ],
    },
  });
  if (!amizade) naoEncontrado("Amizade");
  await amizade.destroy();
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
