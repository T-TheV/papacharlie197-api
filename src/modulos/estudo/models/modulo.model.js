const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Modulo = sequelize.define(
  "Modulo",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    agencia_id: { type: DataTypes.INTEGER, allowNull: false },
    titulo: { type: DataTypes.STRING(255), allowNull: false },
    cor_destaque: { type: DataTypes.STRING(7), allowNull: false, defaultValue: "#F3C623" },
    ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    // Array vazio = módulo aparece para todos os cargos.
    cargos_alvo: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    peso_edital: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 1 },
  },
  {
    tableName: "modulos",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Modulo;
