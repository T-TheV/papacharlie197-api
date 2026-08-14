"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("questoes_discursivas", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      aula_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "aulas", key: "id" },
        onDelete: "CASCADE",
      },
      enunciado: { type: Sequelize.TEXT, allowNull: false },
      criterios_avaliacao: { type: Sequelize.TEXT, allowNull: false },
      ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.addIndex("questoes_discursivas", ["aula_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("questoes_discursivas");
  },
};
