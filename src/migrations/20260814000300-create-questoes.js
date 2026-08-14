"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("questoes", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      aula_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "aulas", key: "id" },
        onDelete: "CASCADE",
      },
      enunciado: { type: Sequelize.TEXT, allowNull: false },
      alternativa_a: { type: Sequelize.TEXT, allowNull: false },
      alternativa_b: { type: Sequelize.TEXT, allowNull: false },
      alternativa_c: { type: Sequelize.TEXT, allowNull: false },
      alternativa_d: { type: Sequelize.TEXT, allowNull: false },
      alternativa_e: { type: Sequelize.TEXT, allowNull: true },
      alternativa_correta: {
        type: Sequelize.ENUM("a", "b", "c", "d", "e"),
        allowNull: false,
      },
      justificativa_erro: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.addIndex("questoes", ["aula_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("questoes");
  },
};
