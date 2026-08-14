"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("aulas", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      modulo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "modulos", key: "id" },
        onDelete: "CASCADE",
      },
      titulo: { type: Sequelize.STRING(255), allowNull: false },
      youtube_iframe_url: { type: Sequelize.STRING(500), allowNull: false },
      resumo_texto: { type: Sequelize.TEXT, allowNull: false },
      ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });

    await queryInterface.addIndex("aulas", ["modulo_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("aulas");
  },
};
