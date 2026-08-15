"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("amizades", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
      },
      amigo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
      },
      status: { type: Sequelize.ENUM("pendente", "aceito"), allowNull: false, defaultValue: "pendente" },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("amizades", ["usuario_id", "amigo_id"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("amizades");
  },
};
