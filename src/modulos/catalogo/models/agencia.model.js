const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Agencia = sequelize.define(
  "Agencia",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    rotulo_trilha: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "Cargo pretendido" },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    cor_primaria: { type: DataTypes.STRING(7), allowNull: false, defaultValue: "#F3C623" },
    cor_secundaria: { type: DataTypes.STRING(7), allowNull: false, defaultValue: "#1A1A1A" },
    cor_fundo: { type: DataTypes.STRING(7), allowNull: false, defaultValue: "#F4F5F7" },
    cor_superficie: { type: DataTypes.STRING(7), allowNull: false, defaultValue: "#FFFFFF" },
    padrao_fundo: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "policia-civil" },
    configuracao_tema: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    configuracao_estudo: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    padrao: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ativa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "agencias", underscored: true, timestamps: true },
);

module.exports = Agencia;
