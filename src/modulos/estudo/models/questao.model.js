const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Questao = sequelize.define(
  "Questao",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    aula_id: { type: DataTypes.INTEGER, allowNull: true },
    modulo_id: { type: DataTypes.INTEGER, allowNull: true },
    enunciado: { type: DataTypes.TEXT, allowNull: false },
    alternativa_a: { type: DataTypes.TEXT, allowNull: false },
    alternativa_b: { type: DataTypes.TEXT, allowNull: false },
    alternativa_c: { type: DataTypes.TEXT, allowNull: false },
    alternativa_d: { type: DataTypes.TEXT, allowNull: false },
    alternativa_e: { type: DataTypes.TEXT, allowNull: true },
    alternativa_correta: {
      type: DataTypes.ENUM("a", "b", "c", "d", "e"),
      allowNull: false,
    },
    justificativa_erro: { type: DataTypes.TEXT, allowNull: true },
    // Metadados de origem — preenchidos apenas para questões reais de provas anteriores.
    banca: { type: DataTypes.STRING(100), allowNull: true },
    ano: { type: DataTypes.INTEGER, allowNull: true },
    prova: { type: DataTypes.STRING(150), allowNull: true },
    numero_original: { type: DataTypes.INTEGER, allowNull: true },
    origem: {
      type: DataTypes.ENUM("estudo", "banco_questoes", "ia_gerada"),
      allowNull: false,
      defaultValue: "estudo",
    },
  },
  {
    tableName: "questoes",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Questao;
