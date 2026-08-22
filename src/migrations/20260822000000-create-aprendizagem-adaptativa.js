"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "usuarios",
        "configuracao_planejamento",
        { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        { transaction },
      );
      await queryInterface.addColumn(
        "modulos",
        "peso_edital",
        { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 1 },
        { transaction },
      );

      await queryInterface.createTable(
        "flashcards",
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
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
          modulo_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "modulos", key: "id" },
            onDelete: "CASCADE",
          },
          aula_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "aulas", key: "id" },
            onDelete: "CASCADE",
          },
          frente: { type: Sequelize.TEXT, allowNull: false },
          verso: { type: Sequelize.TEXT, allowNull: false },
          origem: {
            type: Sequelize.ENUM("manual", "aula", "erro"),
            allowNull: false,
            defaultValue: "manual",
          },
          chave_origem: { type: Sequelize.STRING(180), allowNull: true },
          ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          repeticoes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          intervalo_dias: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          fator_facilidade: { type: Sequelize.DECIMAL(4, 2), allowNull: false, defaultValue: 2.5 },
          proxima_revisao_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          revisado_em: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("flashcards", ["usuario_id", "chave_origem"], {
        unique: true,
        transaction,
      });
      await queryInterface.addIndex(
        "flashcards",
        ["usuario_id", "agencia_id", "trilha_id", "proxima_revisao_em"],
        { transaction },
      );

      await queryInterface.createTable(
        "revisoes_flashcards",
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
          usuario_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "usuarios", key: "id" },
            onDelete: "CASCADE",
          },
          flashcard_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "flashcards", key: "id" },
            onDelete: "CASCADE",
          },
          avaliacao: {
            type: Sequelize.ENUM("errei", "dificil", "bom", "facil"),
            allowNull: false,
          },
          intervalo_anterior_dias: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          intervalo_novo_dias: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("revisoes_flashcards", ["usuario_id", "created_at"], { transaction });

      await queryInterface.createTable(
        "itens_plano_diario",
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
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
          modulo_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "modulos", key: "id" },
            onDelete: "CASCADE",
          },
          aula_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "aulas", key: "id" },
            onDelete: "CASCADE",
          },
          data: { type: Sequelize.DATEONLY, allowNull: false },
          tipo: {
            type: Sequelize.ENUM("aula", "revisao", "flashcards", "questoes"),
            allowNull: false,
          },
          chave_referencia: { type: Sequelize.STRING(180), allowNull: false },
          titulo: { type: Sequelize.STRING(255), allowNull: false },
          detalhe: { type: Sequelize.TEXT, allowNull: true },
          minutos_estimados: { type: Sequelize.INTEGER, allowNull: false },
          minutos_planejados: { type: Sequelize.INTEGER, allowNull: false },
          prioridade: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          status: {
            type: Sequelize.ENUM("pendente", "concluido", "ignorado"),
            allowNull: false,
            defaultValue: "pendente",
          },
          origem: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "automatico" },
          concluido_em: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex(
        "itens_plano_diario",
        ["usuario_id", "agencia_id", "trilha_id", "data", "chave_referencia"],
        { unique: true, transaction },
      );
      await queryInterface.addIndex("itens_plano_diario", ["usuario_id", "data", "status"], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("itens_plano_diario", { transaction });
      await queryInterface.dropTable("revisoes_flashcards", { transaction });
      await queryInterface.dropTable("flashcards", { transaction });
      await queryInterface.removeColumn("modulos", "peso_edital", { transaction });
      await queryInterface.removeColumn("usuarios", "configuracao_planejamento", { transaction });
    });
  },
};
