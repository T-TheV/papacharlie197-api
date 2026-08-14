const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Aula = sequelize.define(
  "Aula",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    modulo_id: { type: DataTypes.INTEGER, allowNull: false },
    titulo: { type: DataTypes.STRING(255), allowNull: false },
    youtube_iframe_url: { type: DataTypes.STRING(500), allowNull: false },
    resumo_texto: { type: DataTypes.TEXT, allowNull: false },
    ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "aulas",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Aula;
