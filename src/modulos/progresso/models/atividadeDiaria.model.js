const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const AtividadeDiaria = sequelize.define(
  "AtividadeDiaria",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.DATEONLY, allowNull: false },
    // true quando o dia foi coberto por um congelamento de ofensiva, não por atividade real.
    congelada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "atividades_diarias",
    underscored: true,
    timestamps: true,
  },
);

module.exports = AtividadeDiaria;
