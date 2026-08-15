const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const ModuloTrilha = sequelize.define(
  "ModuloTrilha",
  {
    modulo_id: { type: DataTypes.INTEGER, primaryKey: true },
    trilha_id: { type: DataTypes.INTEGER, primaryKey: true },
  },
  { tableName: "modulos_trilhas", underscored: true, timestamps: true },
);

module.exports = ModuloTrilha;
