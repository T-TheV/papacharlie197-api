const { Op } = require("sequelize");
const { sequelize } = require("../../../config/configDB");
const Agencia = require("../models/agencia.model");
const Trilha = require("../models/trilha.model");
const Matricula = require("../models/matricula.model");
const InscricaoTrilha = require("../models/inscricaoTrilha.model");

const REGEX_COR = /^#[0-9a-f]{6}$/i;
const PADROES_FUNDO = ["policia-civil", "militar", "academico", "neutro"];

function erro(mensagem, status = 400) {
  const e = new Error(mensagem);
  e.status = status;
  throw e;
}

function slugificar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function dtoTrilha(trilha, { inscrito = false } = {}) {
  if (!trilha) return null;
  return {
    id: trilha.id,
    agenciaId: trilha.agencia_id,
    nome: trilha.nome,
    nomeCurto: trilha.nome_curto,
    slug: trilha.slug,
    descricao: trilha.descricao,
    ordem: trilha.ordem,
    ativa: trilha.ativa,
    inscrito,
  };
}

function dtoAgencia(agencia, { matricula = null, trilhaIdsInscritos = new Set() } = {}) {
  return {
    id: agencia.id,
    nome: agencia.nome,
    slug: agencia.slug,
    descricao: agencia.descricao,
    rotuloTrilha: agencia.rotulo_trilha,
    logoUrl: agencia.logo_url,
    tema: {
      corPrimaria: agencia.cor_primaria,
      corSecundaria: agencia.cor_secundaria,
      corFundo: agencia.cor_fundo,
      corSuperficie: agencia.cor_superficie,
      padraoFundo: agencia.padrao_fundo,
      ...(agencia.configuracao_tema || {}),
    },
    padrao: agencia.padrao,
    ativa: agencia.ativa,
    trilhas: (agencia.trilhas || []).map((trilha) =>
      dtoTrilha(trilha, { inscrito: trilhaIdsInscritos.has(Number(trilha.id)) })),
    matriculado: Boolean(matricula),
    trilhaSelecionadaId: matricula?.trilha_id || null,
    cursoAtivo: Boolean(matricula?.ativa),
  };
}

async function obterAgenciaPadrao(options = {}) {
  return Agencia.findOne({ where: { padrao: true, ativa: true }, ...options });
}

async function garantirMatriculaPadrao(usuarioId, transaction) {
  let matricula = await Matricula.findOne({
    where: { usuario_id: usuarioId, ativa: true },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (matricula) return matricula;

  const agencia = await obterAgenciaPadrao({ transaction });
  if (!agencia) erro("Nenhuma agência padrão está configurada", 503);

  [matricula] = await Matricula.findOrCreate({
    where: { usuario_id: usuarioId, agencia_id: agencia.id },
    defaults: { usuario_id: usuarioId, agencia_id: agencia.id, trilha_id: null, ativa: true },
    transaction,
  });
  if (!matricula.ativa) await matricula.update({ ativa: true }, { transaction });
  return matricula;
}

async function obterContextoAtivo(usuarioId, { transaction } = {}) {
  const matricula = await garantirMatriculaPadrao(usuarioId, transaction);
  const completa = await Matricula.findByPk(matricula.id, {
    include: [
      {
        model: Agencia,
        as: "agencia",
        include: [{ model: Trilha, as: "trilhas", where: { ativa: true }, required: false }],
      },
      { model: Trilha, as: "trilha", required: false },
    ],
    transaction,
  });
  return {
    matricula: completa,
    agencia: completa.agencia,
    trilha: completa.trilha,
    agenciaId: completa.agencia_id,
    trilhaId: completa.trilha_id,
    dataProva: completa.data_prova,
  };
}

async function definirDataProva(usuarioId, dataProva) {
  if (dataProva !== null && dataProva !== undefined) {
    const data = new Date(dataProva);
    if (Number.isNaN(data.getTime())) erro("Data da prova inválida");
  }
  const matricula = await garantirMatriculaPadrao(usuarioId);
  await matricula.update({ data_prova: dataProva || null });
  return matricula;
}

async function listarAgenciasPublico() {
  const agencias = await Agencia.findAll({
    where: { ativa: true },
    include: [{ model: Trilha, as: "trilhas", where: { ativa: true }, required: false }],
    order: [["padrao", "DESC"], ["nome", "ASC"], [{ model: Trilha, as: "trilhas" }, "ordem", "ASC"]],
  });
  return agencias.map((agencia) => dtoAgencia(agencia));
}

async function matricularNaTrilhaEscolhida(usuarioId, agenciaId, trilhaId, transaction) {
  const agencia = await Agencia.findOne({ where: { id: agenciaId, ativa: true }, transaction });
  if (!agencia) erro("Curso selecionado não foi encontrado", 400);

  const trilha = await Trilha.findOne({
    where: { id: trilhaId, agencia_id: agencia.id, ativa: true },
    transaction,
  });
  if (!trilha) erro("Trilha selecionada não pertence ao curso escolhido", 400);

  await InscricaoTrilha.findOrCreate({
    where: { usuario_id: usuarioId, trilha_id: trilha.id },
    defaults: { usuario_id: usuarioId, trilha_id: trilha.id },
    transaction,
  });

  await Matricula.update({ ativa: false }, { where: { usuario_id: usuarioId }, transaction });
  const [matricula] = await Matricula.findOrCreate({
    where: { usuario_id: usuarioId, agencia_id: agencia.id },
    defaults: { usuario_id: usuarioId, agencia_id: agencia.id, trilha_id: trilha.id, ativa: true },
    transaction,
  });
  if (matricula.trilha_id !== trilha.id || !matricula.ativa) {
    await matricula.update({ trilha_id: trilha.id, ativa: true }, { transaction });
  }
  return matricula;
}

async function listarAgenciasDoUsuario(usuarioId) {
  const [agencias, matriculas, inscricoes] = await Promise.all([
    Agencia.findAll({
      where: { ativa: true },
      include: [{ model: Trilha, as: "trilhas", where: { ativa: true }, required: false }],
      order: [["padrao", "DESC"], ["nome", "ASC"], [{ model: Trilha, as: "trilhas" }, "ordem", "ASC"]],
    }),
    Matricula.findAll({ where: { usuario_id: usuarioId } }),
    InscricaoTrilha.findAll({ where: { usuario_id: usuarioId }, attributes: ["trilha_id"] }),
  ]);
  const porAgencia = new Map(matriculas.map((m) => [m.agencia_id, m]));
  const trilhaIdsInscritos = new Set(inscricoes.map((inscricao) => Number(inscricao.trilha_id)));
  return agencias.map((agencia) =>
    dtoAgencia(agencia, { matricula: porAgencia.get(agencia.id), trilhaIdsInscritos }));
}

async function ativarAgenciaTrilha(usuarioId, agenciaId, trilhaId) {
  return sequelize.transaction(async (transaction) => {
    const agencia = await Agencia.findOne({ where: { id: agenciaId, ativa: true }, transaction });
    if (!agencia) erro("Agência não encontrada", 404);

    let matricula = await Matricula.findOne({
      where: { usuario_id: usuarioId, agencia_id: agencia.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!matricula) erro("Você ainda não está inscrito em uma trilha desta agência", 403);

    let trilha = null;
    if (trilhaId) {
      trilha = await Trilha.findOne({
        where: { id: trilhaId, agencia_id: agencia.id, ativa: true },
        transaction,
      });
      if (!trilha) erro("A trilha não pertence à agência selecionada", 400);
      const inscricao = await InscricaoTrilha.findOne({
        where: { usuario_id: usuarioId, trilha_id: trilha.id },
        transaction,
      });
      if (!inscricao) erro("Você ainda não está inscrito nesta trilha", 403);
    } else {
      const inscricoes = await InscricaoTrilha.findAll({
        where: { usuario_id: usuarioId },
        include: [{ model: Trilha, as: "trilha", where: { agencia_id: agencia.id, ativa: true } }],
        order: [[{ model: Trilha, as: "trilha" }, "ordem", "ASC"]],
        transaction,
      });
      const trilhaSelecionada = inscricoes.find(
        (inscricao) => Number(inscricao.trilha_id) === Number(matricula.trilha_id),
      );
      trilha = (trilhaSelecionada || inscricoes[0])?.trilha || null;
      if (!trilha) erro("Você ainda não está inscrito em uma trilha desta agência", 403);
    }

    await Matricula.update({ ativa: false }, { where: { usuario_id: usuarioId }, transaction });
    await matricula.update({ trilha_id: trilha.id, ativa: true }, { transaction });
    return obterContextoAtivo(usuarioId, { transaction });
  });
}

async function inscreverTrilha(usuarioId, agenciaId, trilhaId) {
  return sequelize.transaction(async (transaction) => {
    const trilha = await Trilha.findOne({
      where: { id: trilhaId, agencia_id: agenciaId, ativa: true },
      include: [{ model: Agencia, as: "agencia", where: { ativa: true } }],
      transaction,
    });
    if (!trilha) erro("Trilha não encontrada nesta agência", 404);

    const [, criada] = await InscricaoTrilha.findOrCreate({
      where: { usuario_id: usuarioId, trilha_id: trilha.id },
      defaults: { usuario_id: usuarioId, trilha_id: trilha.id },
      transaction,
    });
    let [matricula] = await Matricula.findOrCreate({
      where: { usuario_id: usuarioId, agencia_id: trilha.agencia_id },
      defaults: {
        usuario_id: usuarioId,
        agencia_id: trilha.agencia_id,
        trilha_id: trilha.id,
        ativa: false,
      },
      transaction,
    });
    await Matricula.update({ ativa: false }, { where: { usuario_id: usuarioId }, transaction });
    await matricula.update({ trilha_id: trilha.id, ativa: true }, { transaction });
    const contexto = await obterContextoAtivo(usuarioId, { transaction });
    return { contexto, criada };
  });
}

function validarTema(dados) {
  for (const campo of ["corPrimaria", "corSecundaria", "corFundo", "corSuperficie"]) {
    if (dados[campo] !== undefined && !REGEX_COR.test(dados[campo])) erro(`Cor inválida em ${campo}`);
  }
  if (dados.padraoFundo !== undefined && !PADROES_FUNDO.includes(dados.padraoFundo)) {
    erro("Padrão de fundo inválido");
  }
}

function dadosAgencia(dados) {
  validarTema(dados);
  for (const [campo, rotulo] of [["logoUrl", "logo"], ["fundoUrl", "plano de fundo"]]) {
    if (!dados[campo]) continue;
    try {
      const url = new URL(dados[campo], "http://local");
      if (!/^https?:$/.test(url.protocol) && !String(dados[campo]).startsWith("/uploads/")) throw new Error();
    } catch {
      erro(`URL do ${rotulo} inválida`);
    }
  }
  const nome = dados.nome?.trim();
  const slug = dados.slug !== undefined ? slugificar(dados.slug) : nome ? slugificar(nome) : undefined;
  return {
    ...(nome !== undefined && { nome }),
    ...(slug !== undefined && { slug }),
    ...(dados.descricao !== undefined && { descricao: dados.descricao?.trim() || null }),
    ...(dados.rotuloTrilha !== undefined && { rotulo_trilha: dados.rotuloTrilha.trim() }),
    ...(dados.logoUrl !== undefined && { logo_url: dados.logoUrl || null }),
    ...(dados.corPrimaria !== undefined && { cor_primaria: dados.corPrimaria }),
    ...(dados.corSecundaria !== undefined && { cor_secundaria: dados.corSecundaria }),
    ...(dados.corFundo !== undefined && { cor_fundo: dados.corFundo }),
    ...(dados.corSuperficie !== undefined && { cor_superficie: dados.corSuperficie }),
    ...(dados.padraoFundo !== undefined && { padrao_fundo: dados.padraoFundo }),
    ...((dados.configuracaoTema !== undefined || dados.fundoUrl !== undefined) && {
      configuracao_tema: {
        ...(dados.configuracaoTema || {}),
        ...(dados.fundoUrl !== undefined && { fundoUrl: dados.fundoUrl || null }),
      },
    }),
    ...(dados.ativa !== undefined && { ativa: Boolean(dados.ativa) }),
  };
}

async function listarTodasAgencias() {
  return Agencia.findAll({
    include: [{ model: Trilha, as: "trilhas", required: false }],
    order: [["padrao", "DESC"], ["nome", "ASC"], [{ model: Trilha, as: "trilhas" }, "ordem", "ASC"]],
  });
}

async function criarAgencia(dados) {
  const normalizados = dadosAgencia(dados);
  if (!normalizados.nome || !normalizados.slug) erro("Nome e slug da agência são obrigatórios");
  return Agencia.create(normalizados);
}

async function atualizarAgencia(id, dados) {
  const agencia = await Agencia.findByPk(id);
  if (!agencia) erro("Agência não encontrada", 404);
  await agencia.update(dadosAgencia(dados));
  return agencia;
}

async function definirAgenciaPadrao(id) {
  return sequelize.transaction(async (transaction) => {
    const agencia = await Agencia.findByPk(id, { transaction });
    if (!agencia) erro("Agência não encontrada", 404);
    await Agencia.update({ padrao: false }, { where: { id: { [Op.ne]: agencia.id } }, transaction });
    await agencia.update({ padrao: true, ativa: true }, { transaction });
    return agencia;
  });
}

async function criarTrilha(agenciaId, dados) {
  const agencia = await Agencia.findByPk(agenciaId);
  if (!agencia) erro("Agência não encontrada", 404);
  const nome = dados.nome?.trim();
  const slug = slugificar(dados.slug || nome);
  if (!nome || !slug) erro("Nome da trilha é obrigatório");
  return Trilha.create({
    agencia_id: agencia.id,
    nome,
    nome_curto: dados.nomeCurto?.trim() || null,
    slug,
    descricao: dados.descricao?.trim() || null,
    ordem: Number(dados.ordem) || 0,
    ativa: dados.ativa !== false,
  });
}

async function atualizarTrilha(id, dados) {
  const trilha = await Trilha.findByPk(id);
  if (!trilha) erro("Trilha não encontrada", 404);
  await trilha.update({
    ...(dados.nome !== undefined && { nome: dados.nome.trim() }),
    ...(dados.nomeCurto !== undefined && { nome_curto: dados.nomeCurto?.trim() || null }),
    ...(dados.slug !== undefined && { slug: slugificar(dados.slug) }),
    ...(dados.descricao !== undefined && { descricao: dados.descricao?.trim() || null }),
    ...(dados.ordem !== undefined && { ordem: Number(dados.ordem) || 0 }),
    ...(dados.ativa !== undefined && { ativa: Boolean(dados.ativa) }),
  });
  return trilha;
}

module.exports = {
  dtoAgencia,
  dtoTrilha,
  obterAgenciaPadrao,
  obterContextoAtivo,
  garantirMatriculaPadrao,
  definirDataProva,
  listarAgenciasPublico,
  matricularNaTrilhaEscolhida,
  listarAgenciasDoUsuario,
  ativarAgenciaTrilha,
  inscreverTrilha,
  listarTodasAgencias,
  criarAgencia,
  atualizarAgencia,
  definirAgenciaPadrao,
  criarTrilha,
  atualizarTrilha,
};
