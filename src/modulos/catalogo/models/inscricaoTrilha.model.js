const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const InscricaoTrilha = sequelize.define(
  "InscricaoTrilha",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    trilha_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "inscricoes_trilhas", underscored: true, timestamps: true },
);

module.exports = InscricaoTrilha;
