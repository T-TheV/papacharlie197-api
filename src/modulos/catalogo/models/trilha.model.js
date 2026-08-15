const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Trilha = sequelize.define(
  "Trilha",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    agencia_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING(120), allowNull: false },
    nome_curto: { type: DataTypes.STRING(80), allowNull: true },
    slug: { type: DataTypes.STRING(80), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    configuracao_estudo: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ativa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "trilhas", underscored: true, timestamps: true },
);

module.exports = Trilha;
