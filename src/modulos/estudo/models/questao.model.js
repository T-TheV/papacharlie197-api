const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Questao = sequelize.define(
  "Questao",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    aula_id: { type: DataTypes.INTEGER, allowNull: false },
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
  },
  {
    tableName: "questoes",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Questao;
