"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        "aulas",
        "youtube_iframe_url",
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "aulas",
        "duracao_video_segundos",
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "aulas",
        "duracao_video_fonte",
        { type: Sequelize.STRING(30), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "aulas",
        "duracao_video_atualizada_em",
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "agencias",
        "configuracao_estudo",
        { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        { transaction },
      );
      await queryInterface.addColumn(
        "trilhas",
        "configuracao_estudo",
        { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        { transaction },
      );

      await queryInterface.createTable(
        "sessoes_estudo",
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
          chave_cliente: { type: Sequelize.UUID, allowNull: false },
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
            allowNull: false,
            references: { model: "modulos", key: "id" },
            onDelete: "CASCADE",
          },
          aula_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "aulas", key: "id" },
            onDelete: "CASCADE",
          },
          tempo_estimado_segundos: { type: Sequelize.INTEGER, allowNull: false },
          tempo_planejado_segundos: { type: Sequelize.INTEGER, allowNull: false },
          tempo_efetivo_segundos: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          duracao_video_segundos: { type: Sequelize.INTEGER, allowNull: true },
          questoes_objetivas: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          questoes_discursivas: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          margem_segundos: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          regras: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
          ciclos_planejados: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
          estado_timer: { type: Sequelize.JSONB, allowNull: true },
          status: {
            type: Sequelize.ENUM("planejada", "em_andamento", "interrompida", "concluida", "cancelada"),
            allowNull: false,
            defaultValue: "planejada",
          },
          iniciada_em: { type: Sequelize.DATE, allowNull: true },
          interrompida_em: { type: Sequelize.DATE, allowNull: true },
          concluida_em: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("sessoes_estudo", ["usuario_id", "chave_cliente"], {
        unique: true,
        transaction,
      });
      await queryInterface.addIndex("sessoes_estudo", ["usuario_id", "aula_id", "created_at"], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("sessoes_estudo", { transaction });
      await queryInterface.removeColumn("trilhas", "configuracao_estudo", { transaction });
      await queryInterface.removeColumn("agencias", "configuracao_estudo", { transaction });
      await queryInterface.removeColumn("aulas", "duracao_video_atualizada_em", { transaction });
      await queryInterface.removeColumn("aulas", "duracao_video_fonte", { transaction });
      await queryInterface.removeColumn("aulas", "duracao_video_segundos", { transaction });
      await queryInterface.changeColumn(
        "aulas",
        "youtube_iframe_url",
        { type: Sequelize.STRING(500), allowNull: false },
        { transaction },
      );
    });
  },
};
