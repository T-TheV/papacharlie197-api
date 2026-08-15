"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("aulas", "transcricao_texto", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("aulas", "transcricao_gerada_em", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("aulas", "transcricao_texto");
    await queryInterface.removeColumn("aulas", "transcricao_gerada_em");
  },
};
