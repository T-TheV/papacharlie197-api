const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const TokenRecuperacaoSenha = sequelize.define(
  "TokenRecuperacaoSenha",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    expira_em: { type: DataTypes.DATE, allowNull: false },
    usado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "tokens_recuperacao_senha",
    underscored: true,
    timestamps: true,
  },
);

module.exports = TokenRecuperacaoSenha;
