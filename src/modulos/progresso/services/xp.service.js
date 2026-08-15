const { Op, fn, col } = require("sequelize");
const { sequelize } = require("../../../config/configDB");
const Usuario = require("../../autenticacao/models/usuario.model");
const EventoXp = require("../models/eventoXp.model");

async function concederXpInterno(usuarioId, quantidade, { tipo, chave, transaction }) {
  const [, criado] = await EventoXp.findOrCreate({
    where: { usuario_id: usuarioId, chave },
    defaults: { usuario_id: usuarioId, tipo, chave, quantidade },
    transaction,
  });
  if (!criado) return 0;
  await Usuario.increment("xp", { by: quantidade, where: { id: usuarioId }, transaction });
  return quantidade;
}

async function concederXp(usuarioId, quantidade, { tipo, chave, transaction } = {}) {
  if (!tipo || !chave || !Number.isInteger(quantidade) || quantidade <= 0) {
    throw new Error("Evento de XP inválido");
  }
  if (transaction) return concederXpInterno(usuarioId, quantidade, { tipo, chave, transaction });
  return sequelize.transaction((novaTransaction) =>
    concederXpInterno(usuarioId, quantidade, { tipo, chave, transaction: novaTransaction }),
  );
}

async function xpDesde(usuarioIds, inicio) {
  const registros = await EventoXp.findAll({
    where: { usuario_id: usuarioIds, created_at: { [Op.gte]: inicio } },
    attributes: ["usuario_id", [fn("SUM", col("quantidade")), "total"]],
    group: ["usuario_id"],
    raw: true,
  });
  return new Map(registros.map((registro) => [Number(registro.usuario_id), Number(registro.total)]));
}

module.exports = { concederXp, xpDesde };
