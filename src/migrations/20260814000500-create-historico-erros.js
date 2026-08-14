"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("historico_erros", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
      },
      questao_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "questoes", key: "id" },
        onDelete: "CASCADE",
      },
      resolvido: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.addIndex("historico_erros", ["usuario_id", "resolvido"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("historico_erros");
  },
};
