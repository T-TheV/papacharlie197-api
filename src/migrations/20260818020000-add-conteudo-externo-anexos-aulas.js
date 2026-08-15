"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "aulas",
        "tipo_conteudo",
        { type: Sequelize.STRING(30), allowNull: false, defaultValue: "youtube" },
        { transaction },
      );
      await queryInterface.addColumn(
        "aulas",
        "provedor_externo",
        { type: Sequelize.STRING(50), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "aulas",
        "url_externa",
        { type: Sequelize.STRING(1000), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "aulas",
        "id_externo",
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE aulas
            SET tipo_conteudo = CASE
              WHEN youtube_iframe_url IS NOT NULL THEN 'youtube'
              ELSE 'material'
            END`,
        { transaction },
      );

      await queryInterface.createTable(
        "anexos_aulas",
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          aula_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "aulas", key: "id" },
            onDelete: "CASCADE",
          },
          nome_original: { type: Sequelize.STRING(255), allowNull: true },
          nome_exibicao: { type: Sequelize.STRING(255), allowNull: false },
          caminho_arquivo: { type: Sequelize.STRING(500), allowNull: true },
          url_externa: { type: Sequelize.STRING(1000), allowNull: true },
          mime_type: { type: Sequelize.STRING(120), allowNull: true },
          tamanho_bytes: { type: Sequelize.BIGINT, allowNull: true },
          origem: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "upload" },
          ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("anexos_aulas", ["aula_id", "ordem"], { transaction });
      await queryInterface.addIndex("aulas", ["provedor_externo", "id_externo"], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("anexos_aulas", { transaction });
      await queryInterface.removeColumn("aulas", "id_externo", { transaction });
      await queryInterface.removeColumn("aulas", "url_externa", { transaction });
      await queryInterface.removeColumn("aulas", "provedor_externo", { transaction });
      await queryInterface.removeColumn("aulas", "tipo_conteudo", { transaction });
    });
  },
};
