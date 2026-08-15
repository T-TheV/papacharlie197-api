"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "agencias",
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          nome: { type: Sequelize.STRING(120), allowNull: false },
          slug: { type: Sequelize.STRING(80), allowNull: false, unique: true },
          descricao: { type: Sequelize.TEXT, allowNull: true },
          rotulo_trilha: { type: Sequelize.STRING(80), allowNull: false, defaultValue: "Cargo pretendido" },
          logo_url: { type: Sequelize.STRING(500), allowNull: true },
          cor_primaria: { type: Sequelize.STRING(7), allowNull: false, defaultValue: "#F3C623" },
          cor_secundaria: { type: Sequelize.STRING(7), allowNull: false, defaultValue: "#1A1A1A" },
          cor_fundo: { type: Sequelize.STRING(7), allowNull: false, defaultValue: "#F4F5F7" },
          cor_superficie: { type: Sequelize.STRING(7), allowNull: false, defaultValue: "#FFFFFF" },
          padrao_fundo: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "policia-civil" },
          configuracao_tema: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
          padrao: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          ativa: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );

      await queryInterface.createTable(
        "trilhas",
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          agencia_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "agencias", key: "id" },
            onDelete: "CASCADE",
          },
          nome: { type: Sequelize.STRING(120), allowNull: false },
          nome_curto: { type: Sequelize.STRING(80), allowNull: true },
          slug: { type: Sequelize.STRING(80), allowNull: false },
          descricao: { type: Sequelize.TEXT, allowNull: true },
          ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          ativa: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("trilhas", ["agencia_id", "slug"], { unique: true, transaction });

      await queryInterface.createTable(
        "matriculas",
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
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
          ativa: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );
      await queryInterface.addIndex("matriculas", ["usuario_id", "agencia_id"], { unique: true, transaction });
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX matriculas_usuario_ativa_unique ON matriculas (usuario_id) WHERE ativa = true;',
        { transaction },
      );

      await queryInterface.addColumn(
        "modulos",
        "agencia_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "agencias", key: "id" },
          onDelete: "CASCADE",
        },
        { transaction },
      );

      await queryInterface.createTable(
        "modulos_trilhas",
        {
          modulo_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: { model: "modulos", key: "id" },
            onDelete: "CASCADE",
          },
          trilha_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: { model: "trilhas", key: "id" },
            onDelete: "CASCADE",
          },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        },
        { transaction },
      );

      const [agencias] = await queryInterface.sequelize.query(
        `INSERT INTO agencias
          (nome, slug, descricao, rotulo_trilha, logo_url, cor_primaria, cor_secundaria,
           cor_fundo, cor_superficie, padrao_fundo, configuracao_tema, padrao, ativa, created_at, updated_at)
         VALUES
          ('Polícia Civil', 'policia-civil', 'Preparação para carreiras da Polícia Civil.',
           'Cargo pretendido', NULL, '#F3C623', '#1A1A1A', '#F4F5F7', '#FFFFFF',
           'policia-civil', '{}', true, true, NOW(), NOW())
         RETURNING id;`,
        { transaction },
      );
      const agenciaId = agencias[0].id;

      const [trilhas] = await queryInterface.sequelize.query(
        `INSERT INTO trilhas
          (agencia_id, nome, nome_curto, slug, descricao, ordem, ativa, created_at, updated_at)
         VALUES
          (:agenciaId, 'Agente de Polícia Civil', 'Agente', 'agente', NULL, 1, true, NOW(), NOW()),
          (:agenciaId, 'Escrivão de Polícia Civil', 'Escrivão', 'escrivao', NULL, 2, true, NOW(), NOW()),
          (:agenciaId, 'Delegado de Polícia Civil', 'Delegado', 'delegado', NULL, 3, true, NOW(), NOW())
         RETURNING id, slug;`,
        { replacements: { agenciaId }, transaction },
      );
      const trilhaPorSlug = Object.fromEntries(trilhas.map((trilha) => [trilha.slug, trilha.id]));

      await queryInterface.sequelize.query(
        "UPDATE modulos SET agencia_id = :agenciaId WHERE agencia_id IS NULL;",
        { replacements: { agenciaId }, transaction },
      );
      await queryInterface.changeColumn(
        "modulos",
        "agencia_id",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "agencias", key: "id" },
          onDelete: "CASCADE",
        },
        { transaction },
      );
      await queryInterface.addIndex("modulos", ["agencia_id", "ordem"], { transaction });

      for (const [slug, trilhaId] of Object.entries(trilhaPorSlug)) {
        await queryInterface.sequelize.query(
          `INSERT INTO modulos_trilhas (modulo_id, trilha_id, created_at, updated_at)
           SELECT id, :trilhaId, NOW(), NOW()
             FROM modulos
            WHERE :slug = ANY(cargos_alvo)
           ON CONFLICT DO NOTHING;`,
          { replacements: { slug, trilhaId }, transaction },
        );
      }

      await queryInterface.sequelize.query(
        `INSERT INTO matriculas
          (usuario_id, agencia_id, trilha_id, ativa, created_at, updated_at)
         SELECT u.id, :agenciaId,
                CASE u.cargo
                  WHEN 'agente' THEN :agenteId
                  WHEN 'escrivao' THEN :escrivaoId
                  WHEN 'delegado' THEN :delegadoId
                  ELSE NULL
                END,
                true, NOW(), NOW()
           FROM usuarios u
         ON CONFLICT (usuario_id, agencia_id) DO NOTHING;`,
        {
          replacements: {
            agenciaId,
            agenteId: trilhaPorSlug.agente,
            escrivaoId: trilhaPorSlug.escrivao,
            delegadoId: trilhaPorSlug.delegado,
          },
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("modulos_trilhas", { transaction });
      await queryInterface.removeColumn("modulos", "agencia_id", { transaction });
      await queryInterface.dropTable("matriculas", { transaction });
      await queryInterface.dropTable("trilhas", { transaction });
      await queryInterface.dropTable("agencias", { transaction });
    });
  },
};
