const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const ItemPlanoDiario = sequelize.define(
  "ItemPlanoDiario",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    agencia_id: { type: DataTypes.INTEGER, allowNull: false },
    trilha_id: { type: DataTypes.INTEGER, allowNull: true },
    modulo_id: { type: DataTypes.INTEGER, allowNull: true },
    aula_id: { type: DataTypes.INTEGER, allowNull: true },
    data: { type: DataTypes.DATEONLY, allowNull: false },
    tipo: { type: DataTypes.ENUM("aula", "revisao", "flashcards", "questoes"), allowNull: false },
    chave_referencia: { type: DataTypes.STRING(180), allowNull: false },
    titulo: { type: DataTypes.STRING(255), allowNull: false },
    detalhe: { type: DataTypes.TEXT, allowNull: true },
    minutos_estimados: { type: DataTypes.INTEGER, allowNull: false },
    minutos_planejados: { type: DataTypes.INTEGER, allowNull: false },
    prioridade: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM("pendente", "concluido", "ignorado"), allowNull: false, defaultValue: "pendente" },
    origem: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "automatico" },
    concluido_em: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "itens_plano_diario", underscored: true, timestamps: true },
);

module.exports = ItemPlanoDiario;
