"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("respostas_questoes_objetivas", {
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
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("respostas_questoes_objetivas", ["usuario_id", "questao_id"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("respostas_questoes_objetivas");
  },
};
