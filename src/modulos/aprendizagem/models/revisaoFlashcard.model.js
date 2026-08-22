const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const RevisaoFlashcard = sequelize.define(
  "RevisaoFlashcard",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    flashcard_id: { type: DataTypes.UUID, allowNull: false },
    avaliacao: { type: DataTypes.ENUM("errei", "dificil", "bom", "facil"), allowNull: false },
    intervalo_anterior_dias: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    intervalo_novo_dias: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "revisoes_flashcards", underscored: true, timestamps: true },
);

module.exports = RevisaoFlashcard;
