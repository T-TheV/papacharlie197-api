"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "papel", {
      type: Sequelize.ENUM("aluno", "superadmin"),
      allowNull: false,
      defaultValue: "aluno",
    });

    await queryInterface.sequelize.query(
      `UPDATE usuarios SET papel = 'superadmin' WHERE email = 'djardim322@gmail.com';`,
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("usuarios", "papel");
  },
};
