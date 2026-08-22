const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Flashcard = sequelize.define(
  "Flashcard",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    agencia_id: { type: DataTypes.INTEGER, allowNull: false },
    trilha_id: { type: DataTypes.INTEGER, allowNull: true },
    modulo_id: { type: DataTypes.INTEGER, allowNull: true },
    aula_id: { type: DataTypes.INTEGER, allowNull: true },
    frente: { type: DataTypes.TEXT, allowNull: false },
    verso: { type: DataTypes.TEXT, allowNull: false },
    origem: { type: DataTypes.ENUM("manual", "aula", "erro"), allowNull: false, defaultValue: "manual" },
    chave_origem: { type: DataTypes.STRING(180), allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    repeticoes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    intervalo_dias: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    fator_facilidade: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 2.5 },
    proxima_revisao_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    revisado_em: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "flashcards", underscored: true, timestamps: true },
);

module.exports = Flashcard;
