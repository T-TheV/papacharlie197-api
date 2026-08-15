"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "sequencia_atual", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("usuarios", "melhor_sequencia", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("usuarios", "ultima_atividade_em", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn("usuarios", "congelamentos_disponiveis", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("usuarios", "congelamentos_disponiveis");
    await queryInterface.removeColumn("usuarios", "ultima_atividade_em");
    await queryInterface.removeColumn("usuarios", "melhor_sequencia");
    await queryInterface.removeColumn("usuarios", "sequencia_atual");
  },
};
