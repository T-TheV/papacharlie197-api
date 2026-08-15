"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("relatorios_erro", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
      },
      aula_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "aulas", key: "id" },
        onDelete: "CASCADE",
      },
      descricao: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM("pendente", "resolvido"), allowNull: false, defaultValue: "pendente" },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("relatorios_erro", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("relatorios_erro");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_relatorios_erro_status";');
  },
};
