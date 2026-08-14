"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "cargo", {
      type: Sequelize.ENUM("agente", "escrivao", "delegado"),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("usuarios", "cargo");
  },
};
