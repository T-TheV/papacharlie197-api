"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("modulos", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: { type: Sequelize.STRING(255), allowNull: false },
      cor_destaque: { type: Sequelize.STRING(7), allowNull: false, defaultValue: "#F3C623" },
      ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("modulos");
  },
};
