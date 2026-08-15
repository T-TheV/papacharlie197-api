const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Matricula = sequelize.define(
  "Matricula",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    agencia_id: { type: DataTypes.INTEGER, allowNull: false },
    trilha_id: { type: DataTypes.INTEGER, allowNull: true },
    ativa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    data_prova: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { tableName: "matriculas", underscored: true, timestamps: true },
);

module.exports = Matricula;
