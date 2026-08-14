"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("respostas_discursivas", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
      },
      questao_discursiva_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "questoes_discursivas", key: "id" },
        onDelete: "CASCADE",
      },
      resposta_texto: { type: Sequelize.TEXT, allowNull: false },
      pontos_atendidos: { type: Sequelize.JSONB, allowNull: true },
      pontos_faltando: { type: Sequelize.JSONB, allowNull: true },
      parecer: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.addIndex("respostas_discursivas", ["usuario_id", "questao_discursiva_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("respostas_discursivas");
  },
};
