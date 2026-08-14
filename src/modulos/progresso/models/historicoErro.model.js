const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const HistoricoErro = sequelize.define(
  "HistoricoErro",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    questao_id: { type: DataTypes.INTEGER, allowNull: false },
    resolvido: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    disponivel_em: { type: DataTypes.DATE, allowNull: true },
    tentativas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "historico_erros",
    underscored: true,
    timestamps: true,
  },
);

module.exports = HistoricoErro;
