"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "mensagem_dia_texto", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("usuarios", "mensagem_dia_data", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("usuarios", "mensagem_dia_data");
    await queryInterface.removeColumn("usuarios", "mensagem_dia_texto");
  },
};
