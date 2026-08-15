"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("questoes", "aula_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("questoes", "modulo_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "modulos", key: "id" },
    });

    await queryInterface.addColumn("questoes", "banca", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("questoes", "ano", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("questoes", "prova", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });

    await queryInterface.addColumn("questoes", "numero_original", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("questoes", "origem", {
      type: Sequelize.ENUM("estudo", "banco_questoes", "ia_gerada"),
      allowNull: false,
      defaultValue: "estudo",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("questoes", "origem");
    await queryInterface.removeColumn("questoes", "numero_original");
    await queryInterface.removeColumn("questoes", "prova");
    await queryInterface.removeColumn("questoes", "ano");
    await queryInterface.removeColumn("questoes", "banca");
    await queryInterface.removeColumn("questoes", "modulo_id");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_questoes_origem";');
    await queryInterface.changeColumn("questoes", "aula_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
