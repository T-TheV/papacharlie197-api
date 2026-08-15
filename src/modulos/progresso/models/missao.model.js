const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Missao = sequelize.define(
  "Missao",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.ENUM("mensal", "semanal", "diaria"), allowNull: false },
    titulo: { type: DataTypes.STRING(255), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: false },
    tipo_meta: {
      type: DataTypes.ENUM(
        "concluir_aulas",
        "concluir_aulas_modulo",
        "responder_questoes",
        "manter_sequencia",
        "concluir_discursiva",
        "fazer_simulado",
      ),
      allowNull: false,
    },
    meta_valor: { type: DataTypes.INTEGER, allowNull: false },
    modulo_id: { type: DataTypes.INTEGER, allowNull: true },
    agencia_id: { type: DataTypes.INTEGER, allowNull: true },
    trilha_id: { type: DataTypes.INTEGER, allowNull: true },
    progresso_atual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    concluida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    concluida_em: { type: DataTypes.DATE, allowNull: true },
    recompensa_xp: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    periodo_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    periodo_fim: { type: DataTypes.DATEONLY, allowNull: false },
  },
  {
    tableName: "missoes",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Missao;
