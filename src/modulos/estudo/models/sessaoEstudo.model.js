const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const SessaoEstudo = sequelize.define(
  "SessaoEstudo",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chave_cliente: { type: DataTypes.UUID, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    agencia_id: { type: DataTypes.INTEGER, allowNull: false },
    trilha_id: { type: DataTypes.INTEGER, allowNull: true },
    modulo_id: { type: DataTypes.INTEGER, allowNull: false },
    aula_id: { type: DataTypes.INTEGER, allowNull: false },
    tempo_estimado_segundos: { type: DataTypes.INTEGER, allowNull: false },
    tempo_planejado_segundos: { type: DataTypes.INTEGER, allowNull: false },
    tempo_efetivo_segundos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    duracao_video_segundos: { type: DataTypes.INTEGER, allowNull: true },
    questoes_objetivas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    questoes_discursivas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    margem_segundos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    regras: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    ciclos_planejados: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    estado_timer: { type: DataTypes.JSONB, allowNull: true },
    status: {
      type: DataTypes.ENUM("planejada", "em_andamento", "interrompida", "concluida", "cancelada"),
      allowNull: false,
      defaultValue: "planejada",
    },
    iniciada_em: { type: DataTypes.DATE, allowNull: true },
    interrompida_em: { type: DataTypes.DATE, allowNull: true },
    concluida_em: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "sessoes_estudo",
    underscored: true,
    timestamps: true,
  },
);

module.exports = SessaoEstudo;
