"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("atividades_diarias", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
      },
      data: { type: Sequelize.DATEONLY, allowNull: false },
      congelada: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint("atividades_diarias", {
      fields: ["usuario_id", "data"],
      type: "unique",
      name: "atividades_diarias_usuario_data_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("atividades_diarias");
  },
};
