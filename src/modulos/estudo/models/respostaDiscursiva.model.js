const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const RespostaDiscursiva = sequelize.define(
  "RespostaDiscursiva",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    questao_discursiva_id: { type: DataTypes.INTEGER, allowNull: false },
    resposta_texto: { type: DataTypes.TEXT, allowNull: false },
    pontos_atendidos: { type: DataTypes.JSONB, allowNull: true },
    pontos_incorretos: { type: DataTypes.JSONB, allowNull: true },
    pontos_faltando: { type: DataTypes.JSONB, allowNull: true },
    parecer: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "respostas_discursivas",
    underscored: true,
    timestamps: true,
  },
);

module.exports = RespostaDiscursiva;
