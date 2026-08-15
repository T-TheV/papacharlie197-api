const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const EventoXp = sequelize.define(
  "EventoXp",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.STRING(50), allowNull: false },
    chave: { type: DataTypes.STRING(160), allowNull: false },
    quantidade: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "eventos_xp", underscored: true, timestamps: true },
);

module.exports = EventoXp;
