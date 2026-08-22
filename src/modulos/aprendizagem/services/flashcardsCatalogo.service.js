const { Op } = require("sequelize");
const Flashcard = require("../models/flashcard.model");
const Modulo = require("../../estudo/models/modulo.model");
const Aula = require("../../estudo/models/aula.model");
const { flashcardsPoliciaCivil } = require("../../../dados/catalogoPoliciaCivil");
const { flashcardsDevOps } = require("../../../dados/catalogoDevOps");

const CATALOGOS_POR_AGENCIA = {
  "policia-civil": flashcardsPoliciaCivil,
  "engenharia-de-software": flashcardsDevOps,
};

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
  const catalogo = CATALOGOS_POR_AGENCIA[contexto.agencia?.slug];
  if (!catalogo) return 0;

  const trilhaSlug = contexto.trilha?.slug || null;
  const definicoes = catalogo.filter(
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
  const titulosAulas = [...new Set(definicoes.map((card) => card.aulaTitulo).filter(Boolean))];
  const aulas = titulosAulas.length
    ? await Aula.findAll({
        where: {
          modulo_id: { [Op.in]: modulos.map((modulo) => modulo.id) },
          titulo: { [Op.in]: titulosAulas },
        },
        attributes: ["id", "modulo_id", "titulo"],
        transaction,
      })
    : [];
  const aulaPorModuloETitulo = new Map(
    aulas.map((aula) => [`${aula.modulo_id}:${aula.titulo}`, aula.id]),
  );
  const registros = definicoes
    .filter((card) => moduloPorTitulo.has(card.moduloTitulo))
    .map((card) => {
      const moduloId = moduloPorTitulo.get(card.moduloTitulo);
      return {
        usuario_id: usuarioId,
        agencia_id: contexto.agenciaId,
        trilha_id: card.trilhaSlug ? contexto.trilhaId : null,
        modulo_id: moduloId,
        aula_id: card.aulaTitulo
          ? aulaPorModuloETitulo.get(`${moduloId}:${card.aulaTitulo}`) || null
          : null,
        frente: card.frente,
        verso: card.verso,
        origem: "aula",
        chave_origem: card.chaveOrigem,
      };
    });

  if (registros.length) {
    await Flashcard.bulkCreate(registros, { ignoreDuplicates: true, transaction });
  }
  return registros.length;
}

module.exports = { escopoFlashcardsWhere, garantirFlashcardsCatalogo };
