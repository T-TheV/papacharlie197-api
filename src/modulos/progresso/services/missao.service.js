const { Op } = require("sequelize");
const { sequelize } = require("../../../config/configDB");
const Missao = require("../models/missao.model");
const Modulo = require("../../estudo/models/modulo.model");
const Aula = require("../../estudo/models/aula.model");
const ProgressoUsuario = require("../models/progressoUsuario.model");
const Usuario = require("../../autenticacao/models/usuario.model");
const EventoMissao = require("../models/eventoMissao.model");
const { concederXp } = require("./xp.service");
const { listarModulosVisiveis } = require("../../estudo/services/acessoConteudo.service");
const { gerarMissoes } = require("../../ia/services/gemini.service");

const RÓTULO_CARGO = {
  agente: "Agente de Polícia Civil",
  escrivao: "Escrivão de Polícia Civil",
  delegado: "Delegado de Polícia Civil",
};

const XP_RECOMPENSA = { mensal: 150, semanal: 60, diaria: 20 };
const QUANTIDADE_POR_TIPO = { mensal: 1, semanal: 1, diaria: 3 };
const CONGELAMENTO_BONUS_MENSAL = 4;
const CONGELAMENTO_MAXIMO = 6;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function paraISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function periodoAtual(tipo) {
  const hoje = new Date();
  if (tipo === "mensal") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return { inicio: paraISO(inicio), fim: paraISO(fim) };
  }
  if (tipo === "semanal") {
    const diaSemana = hoje.getDay(); // 0=domingo
    const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana; // segunda-feira como início da semana
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() + deslocamento);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return { inicio: paraISO(inicio), fim: paraISO(fim) };
  }
  const iso = paraISO(hoje);
  return { inicio: iso, fim: iso };
}

async function obterModulosIncompletos(usuarioId, contexto, transaction) {
  const visiveis = await listarModulosVisiveis(contexto, { transaction });

  const progressos = await ProgressoUsuario.findAll({
    where: { usuario_id: usuarioId, status: "concluido" },
    transaction,
  });
  const concluidasSet = new Set(progressos.map((p) => p.aula_id));

  return visiveis
    .map((m) => ({
      id: m.id,
      titulo: m.titulo,
      aulasPendentes: m.aulas.filter((a) => !concluidasSet.has(a.id)).length,
    }))
    .filter((m) => m.aulasPendentes > 0);
}

async function concederBonusMensal(usuario, transaction) {
  const mesAtual = paraISO(new Date()).slice(0, 7);
  if (usuario.congelamento_bonus_mes === mesAtual) return;

  usuario.congelamentos_disponiveis = Math.min(
    usuario.congelamentos_disponiveis + CONGELAMENTO_BONUS_MENSAL,
    CONGELAMENTO_MAXIMO,
  );
  usuario.congelamento_bonus_mes = mesAtual;
  await usuario.save({ transaction });
}

async function gerarMissoesDoPeriodo(usuario, contexto, tipo, transaction) {
  const modulosIncompletos = await obterModulosIncompletos(usuario.id, contexto, transaction);
  const { inicio, fim } = periodoAtual(tipo);

  const geradas = await gerarMissoes({
    tipo,
    quantidade: QUANTIDADE_POR_TIPO[tipo],
    nome: usuario.nome,
    cargoLabel: contexto.trilha?.nome || "ainda não definido",
    sequenciaAtual: usuario.sequencia_atual,
    modulosIncompletos,
  });

  if (geradas.length === 0) return;

  await Missao.bulkCreate(
    geradas.map((m) => ({
      usuario_id: usuario.id,
      tipo,
      titulo: m.titulo,
      descricao: m.descricao,
      tipo_meta: m.tipoMeta,
      meta_valor: m.metaValor,
      modulo_id: m.moduloId,
      agencia_id: contexto.agenciaId,
      trilha_id: contexto.trilhaId,
      recompensa_xp: XP_RECOMPENSA[tipo],
      periodo_inicio: inicio,
      periodo_fim: fim,
    })),
    { transaction },
  );
}

async function obterOuGerarMissoes(usuarioId, contexto) {
  for (const tipo of ["mensal", "semanal", "diaria"]) {
    const { inicio } = periodoAtual(tipo);
    try {
      await sequelize.transaction(async (transaction) => {
        const chaveLock = `missoes:${usuarioId}:${tipo}:${inicio}:${contexto.agenciaId}:${contexto.trilhaId}`;
        await sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:chaveLock))", {
          replacements: { chaveLock },
          transaction,
        });
        const existentes = await Missao.count({
          where: {
            usuario_id: usuarioId,
            tipo,
            periodo_inicio: inicio,
            agencia_id: contexto.agenciaId,
            trilha_id: contexto.trilhaId,
          },
          transaction,
        });
        if (existentes > 0) return;

        const usuario = await Usuario.findByPk(usuarioId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!usuario) return;
        if (tipo === "mensal") await concederBonusMensal(usuario, transaction);
        await gerarMissoesDoPeriodo(usuario, contexto, tipo, transaction);
      });
    } catch (erro) {
      console.error(`[missões] falha ao gerar missão ${tipo} para usuário ${usuarioId}:`, erro.message);
    }
  }

  return Missao.findAll({
    where: {
      usuario_id: usuarioId,
      agencia_id: contexto.agenciaId,
      trilha_id: contexto.trilhaId,
      [Op.or]: [
        { tipo: "mensal", periodo_inicio: periodoAtual("mensal").inicio },
        { tipo: "semanal", periodo_inicio: periodoAtual("semanal").inicio },
        { tipo: "diaria", periodo_inicio: periodoAtual("diaria").inicio },
      ],
    },
    include: [{ model: Modulo, as: "modulo", attributes: ["titulo"] }],
    order: [
      ["tipo", "ASC"],
      ["id", "ASC"],
    ],
  });
}

async function registrarProgresso(
  usuarioId,
  tipoMeta,
  { moduloId = null, incremento = 1, chaveEvento, transaction } = {},
) {
  const hoje = paraISO(new Date());
  const missoes = await Missao.findAll({
    where: {
      usuario_id: usuarioId,
      tipo_meta: tipoMeta,
      concluida: false,
      periodo_inicio: { [Op.lte]: hoje },
      periodo_fim: { [Op.gte]: hoje },
    },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  for (const missao of missoes) {
    if (missao.modulo_id && missao.modulo_id !== moduloId) continue;

    if (chaveEvento) {
      const [, criado] = await EventoMissao.findOrCreate({
        where: { missao_id: missao.id, chave: chaveEvento },
        defaults: { missao_id: missao.id, chave: chaveEvento },
        transaction,
      });
      if (!criado) continue;
    }

    missao.progresso_atual = Math.min(missao.progresso_atual + incremento, missao.meta_valor);
    if (missao.progresso_atual >= missao.meta_valor) {
      missao.concluida = true;
      missao.concluida_em = new Date();
      await concederXp(usuarioId, missao.recompensa_xp, {
        tipo: "missao",
        chave: `missao:${missao.id}`,
        transaction,
      });
    }
    await missao.save({ transaction });
  }
}

async function registrarConclusaoAula(usuarioId, moduloId, aulaId, transaction) {
  const chaveEvento = `aula:${aulaId}`;
  await registrarProgresso(usuarioId, "concluir_aulas", { chaveEvento, transaction });
  if (moduloId) {
    await registrarProgresso(usuarioId, "concluir_aulas_modulo", { moduloId, chaveEvento, transaction });
  }
}

async function registrarRespostaQuestao(usuarioId, questaoId, transaction) {
  await registrarProgresso(usuarioId, "responder_questoes", {
    chaveEvento: `questao:${questaoId}`,
    transaction,
  });
}

async function registrarRespostaDiscursiva(usuarioId, respostaId, transaction) {
  await registrarProgresso(usuarioId, "concluir_discursiva", {
    chaveEvento: `discursiva:${respostaId}`,
    transaction,
  });
}

async function registrarSimuladoCompleto(usuarioId, simuladoId, transaction) {
  await registrarProgresso(usuarioId, "fazer_simulado", {
    chaveEvento: `simulado:${simuladoId}`,
    transaction,
  });
}

async function registrarDiaDeSequencia(usuarioId, data, transaction) {
  await registrarProgresso(usuarioId, "manter_sequencia", {
    chaveEvento: `sequencia:${data}`,
    transaction,
  });
}

module.exports = {
  obterOuGerarMissoes,
  registrarConclusaoAula,
  registrarRespostaQuestao,
  registrarRespostaDiscursiva,
  registrarSimuladoCompleto,
  registrarDiaDeSequencia,
};
