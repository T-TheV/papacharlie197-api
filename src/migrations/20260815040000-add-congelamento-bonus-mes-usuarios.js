"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "congelamento_bonus_mes", {
      type: Sequelize.STRING(7),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("usuarios", "congelamento_bonus_mes");
  },
};
