"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("progresso_usuarios", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
      },
      aula_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "aulas", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("bloqueado", "em_andamento", "concluido"),
        allowNull: false,
        defaultValue: "bloqueado",
      },
      xp_ganho: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.addIndex("progresso_usuarios", ["usuario_id", "aula_id"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("progresso_usuarios");
  },
};
