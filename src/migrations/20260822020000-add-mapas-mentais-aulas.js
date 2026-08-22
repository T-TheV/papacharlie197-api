"use strict";

const { criarMapaMentalBasico, hashConteudoAula } = require("../modulos/estudo/services/mapaMental.util");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn("aulas", "mapa_mental", { type: Sequelize.JSONB, allowNull: true }, { transaction });
      await queryInterface.addColumn("aulas", "mapa_mental_fonte", { type: Sequelize.STRING(30), allowNull: true }, { transaction });
      await queryInterface.addColumn("aulas", "mapa_mental_hash", { type: Sequelize.STRING(64), allowNull: true }, { transaction });
      await queryInterface.addColumn("aulas", "mapa_mental_gerado_em", { type: Sequelize.DATE, allowNull: true }, { transaction });
      await queryInterface.addColumn("aulas", "mapa_mental_tentativa_em", { type: Sequelize.DATE, allowNull: true }, { transaction });

      const [aulas] = await queryInterface.sequelize.query(
        `SELECT id, titulo, resumo_texto, transcricao_texto FROM aulas ORDER BY id`,
        { transaction },
      );
      const [objetivas] = await queryInterface.sequelize.query(
        `SELECT aula_id, enunciado FROM questoes WHERE aula_id IS NOT NULL AND origem = 'estudo' ORDER BY id`,
        { transaction },
      );
      const [discursivas] = await queryInterface.sequelize.query(
        `SELECT aula_id, enunciado FROM questoes_discursivas ORDER BY id`,
        { transaction },
      );
      const agrupar = (registros) => registros.reduce((mapa, item) => {
        if (!mapa.has(item.aula_id)) mapa.set(item.aula_id, []);
        mapa.get(item.aula_id).push(item.enunciado);
        return mapa;
      }, new Map());
      const objetivasPorAula = agrupar(objetivas);
      const discursivasPorAula = agrupar(discursivas);

      for (const aula of aulas) {
        const conteudo = {
          titulo: aula.titulo,
          resumoTexto: aula.resumo_texto,
          transcricaoTexto: aula.transcricao_texto,
          questoes: objetivasPorAula.get(aula.id) || [],
          discursivas: discursivasPorAula.get(aula.id) || [],
        };
        await queryInterface.sequelize.query(
          `UPDATE aulas
              SET mapa_mental = CAST(:mapa AS JSONB),
                  mapa_mental_fonte = 'estrutura',
                  mapa_mental_hash = :hash,
                  mapa_mental_gerado_em = NOW(),
                  updated_at = updated_at
            WHERE id = :id`,
          {
            replacements: {
              id: aula.id,
              mapa: JSON.stringify(criarMapaMentalBasico(conteudo)),
              hash: hashConteudoAula(conteudo),
            },
            transaction,
          },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("aulas", "mapa_mental_tentativa_em", { transaction });
      await queryInterface.removeColumn("aulas", "mapa_mental_gerado_em", { transaction });
      await queryInterface.removeColumn("aulas", "mapa_mental_hash", { transaction });
      await queryInterface.removeColumn("aulas", "mapa_mental_fonte", { transaction });
      await queryInterface.removeColumn("aulas", "mapa_mental", { transaction });
    });
  },
};
