"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "usuarios",
        "versao_token",
        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        { transaction },
      );
      await queryInterface.addColumn(
        "usuarios",
        "mensagem_dia_contexto",
        { type: Sequelize.STRING(80), allowNull: true },
        { transaction },
      );

      await queryInterface.createTable(
        "eventos_xp",
        {
          id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
          usuario_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "usuarios", key: "id" },
            onDelete: "CASCADE",
          },
          tipo: { type: Sequelize.STRING(50), allowNull: false },
          chave: { type: Sequelize.STRING(160), allowNull: false },
          quantidade: { type: Sequelize.INTEGER, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("eventos_xp", ["usuario_id", "chave"], { unique: true, transaction });
      await queryInterface.addIndex("eventos_xp", ["usuario_id", "created_at"], { transaction });

      await queryInterface.createTable(
        "eventos_missoes",
        {
          id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
          missao_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "missoes", key: "id" },
            onDelete: "CASCADE",
          },
          chave: { type: Sequelize.STRING(160), allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("eventos_missoes", ["missao_id", "chave"], { unique: true, transaction });

      await queryInterface.createTable(
        "simulados",
        {
          id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          usuario_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "usuarios", key: "id" },
            onDelete: "CASCADE",
          },
          agencia_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "agencias", key: "id" },
            onDelete: "CASCADE",
          },
          trilha_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "trilhas", key: "id" },
            onDelete: "SET NULL",
          },
          modo: { type: Sequelize.ENUM("progresso", "modulo", "completo"), allowNull: false },
          questao_ids: { type: Sequelize.JSONB, allowNull: false },
          concluido_em: { type: Sequelize.DATE, allowNull: true },
          expira_em: { type: Sequelize.DATE, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("simulados", ["usuario_id", "created_at"], { transaction });

      await queryInterface.addIndex("questoes", ["origem", "modulo_id", "ano"], {
        name: "questoes_banco_filtros",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("questoes", "questoes_banco_filtros", { transaction });
      await queryInterface.dropTable("simulados", { transaction });
      await queryInterface.dropTable("eventos_missoes", { transaction });
      await queryInterface.dropTable("eventos_xp", { transaction });
      await queryInterface.removeColumn("usuarios", "versao_token", { transaction });
      await queryInterface.removeColumn("usuarios", "mensagem_dia_contexto", { transaction });
    });
  },
};
