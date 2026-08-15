"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("missoes", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
      },
      tipo: { type: Sequelize.ENUM("mensal", "semanal", "diaria"), allowNull: false },
      titulo: { type: Sequelize.STRING(255), allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: false },
      tipo_meta: {
        type: Sequelize.ENUM(
          "concluir_aulas",
          "concluir_aulas_modulo",
          "responder_questoes",
          "manter_sequencia",
          "concluir_discursiva",
          "fazer_simulado",
        ),
        allowNull: false,
      },
      meta_valor: { type: Sequelize.INTEGER, allowNull: false },
      modulo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "modulos", key: "id" },
        onDelete: "CASCADE",
      },
      progresso_atual: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      concluida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      concluida_em: { type: Sequelize.DATE, allowNull: true },
      recompensa_xp: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      periodo_inicio: { type: Sequelize.DATEONLY, allowNull: false },
      periodo_fim: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("missoes", ["usuario_id", "tipo", "periodo_inicio"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("missoes");
  },
};
