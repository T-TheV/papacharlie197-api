const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Simulado = sequelize.define(
  "Simulado",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    agencia_id: { type: DataTypes.INTEGER, allowNull: false },
    trilha_id: { type: DataTypes.INTEGER, allowNull: true },
    modo: { type: DataTypes.ENUM("progresso", "modulo", "completo"), allowNull: false },
    questao_ids: { type: DataTypes.JSONB, allowNull: false },
    concluido_em: { type: DataTypes.DATE, allowNull: true },
    expira_em: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: "simulados", underscored: true, timestamps: true },
);

module.exports = Simulado;
