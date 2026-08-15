"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("missoes", "agencia_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "agencias", key: "id" },
      onDelete: "CASCADE",
    });
    await queryInterface.addColumn("missoes", "trilha_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "trilhas", key: "id" },
      onDelete: "CASCADE",
    });

    await queryInterface.addIndex("missoes", ["usuario_id", "tipo", "periodo_inicio", "agencia_id", "trilha_id"], {
      name: "missoes_usuario_tipo_periodo_curso_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("missoes", "missoes_usuario_tipo_periodo_curso_idx");
    await queryInterface.removeColumn("missoes", "trilha_id");
    await queryInterface.removeColumn("missoes", "agencia_id");
  },
};
