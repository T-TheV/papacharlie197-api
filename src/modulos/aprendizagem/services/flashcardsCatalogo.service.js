const { Op } = require("sequelize");
const Flashcard = require("../models/flashcard.model");
const Modulo = require("../../estudo/models/modulo.model");
const { flashcardsPoliciaCivil } = require("../../../dados/catalogoPoliciaCivil");

function escopoFlashcardsWhere(contexto) {
  const agenciaId = contexto.agenciaId;
  const trilhaId = contexto.trilhaId || null;
  return trilhaId
    ? {
        agencia_id: agenciaId,
        [Op.or]: [{ trilha_id: trilhaId }, { trilha_id: null }],
      }
    : { agencia_id: agenciaId, trilha_id: null };
}

async function garantirFlashcardsCatalogo(usuarioId, contexto, { transaction } = {}) {
  if (contexto.agencia?.slug !== "policia-civil") return 0;

  const trilhaSlug = contexto.trilha?.slug || null;
  const definicoes = flashcardsPoliciaCivil.filter(
    (card) => card.trilhaSlug === null || card.trilhaSlug === trilhaSlug,
  );
  if (!definicoes.length) return 0;

  const modulos = await Modulo.findAll({
    where: {
      agencia_id: contexto.agenciaId,
      titulo: { [Op.in]: [...new Set(definicoes.map((card) => card.moduloTitulo))] },
    },
    attributes: ["id", "titulo"],
    transaction,
  });
  const moduloPorTitulo = new Map(modulos.map((modulo) => [modulo.titulo, modulo.id]));
  const registros = definicoes
    .filter((card) => moduloPorTitulo.has(card.moduloTitulo))
    .map((card) => ({
      usuario_id: usuarioId,
      agencia_id: contexto.agenciaId,
      trilha_id: card.trilhaSlug ? contexto.trilhaId : null,
      modulo_id: moduloPorTitulo.get(card.moduloTitulo),
      aula_id: null,
      frente: card.frente,
      verso: card.verso,
      origem: "aula",
      chave_origem: card.chaveOrigem,
    }));

  if (registros.length) {
    await Flashcard.bulkCreate(registros, { ignoreDuplicates: true, transaction });
  }
  return registros.length;
}

module.exports = { escopoFlashcardsWhere, garantirFlashcardsCatalogo };
