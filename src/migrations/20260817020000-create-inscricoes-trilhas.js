"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "inscricoes_trilhas",
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          usuario_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "usuarios", key: "id" },
            onDelete: "CASCADE",
          },
          trilha_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "trilhas", key: "id" },
            onDelete: "CASCADE",
          },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("inscricoes_trilhas", ["usuario_id", "trilha_id"], {
        unique: true,
        transaction,
      });
      await queryInterface.sequelize.query(
        `INSERT INTO inscricoes_trilhas (usuario_id, trilha_id, created_at, updated_at)
         SELECT usuario_id, trilha_id, NOW(), NOW()
         FROM matriculas
         WHERE trilha_id IS NOT NULL
         ON CONFLICT (usuario_id, trilha_id) DO NOTHING`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("inscricoes_trilhas");
  },
};
