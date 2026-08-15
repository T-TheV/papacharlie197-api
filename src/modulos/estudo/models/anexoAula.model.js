const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const AnexoAula = sequelize.define(
  "AnexoAula",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    aula_id: { type: DataTypes.INTEGER, allowNull: false },
    nome_original: { type: DataTypes.STRING(255), allowNull: true },
    nome_exibicao: { type: DataTypes.STRING(255), allowNull: false },
    caminho_arquivo: { type: DataTypes.STRING(500), allowNull: true },
    url_externa: { type: DataTypes.STRING(1000), allowNull: true },
    mime_type: { type: DataTypes.STRING(120), allowNull: true },
    tamanho_bytes: { type: DataTypes.BIGINT, allowNull: true },
    origem: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "upload" },
    ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "anexos_aulas", underscored: true, timestamps: true },
);

module.exports = AnexoAula;
