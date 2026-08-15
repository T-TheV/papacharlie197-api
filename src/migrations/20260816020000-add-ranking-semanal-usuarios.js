"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "xp_inicio_semana", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("usuarios", "semana_referencia_xp", {
      type: Sequelize.STRING(10),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("usuarios", "xp_inicio_semana");
    await queryInterface.removeColumn("usuarios", "semana_referencia_xp");
  },
};
