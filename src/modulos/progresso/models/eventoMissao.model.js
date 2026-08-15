const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const EventoMissao = sequelize.define(
  "EventoMissao",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    missao_id: { type: DataTypes.INTEGER, allowNull: false },
    chave: { type: DataTypes.STRING(160), allowNull: false },
  },
  { tableName: "eventos_missoes", underscored: true, timestamps: true },
);

module.exports = EventoMissao;
