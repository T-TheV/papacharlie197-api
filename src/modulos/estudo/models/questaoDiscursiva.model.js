const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const QuestaoDiscursiva = sequelize.define(
  "QuestaoDiscursiva",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    aula_id: { type: DataTypes.INTEGER, allowNull: false },
    enunciado: { type: DataTypes.TEXT, allowNull: false },
    criterios_avaliacao: { type: DataTypes.TEXT, allowNull: false },
    ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "questoes_discursivas",
    underscored: true,
    timestamps: true,
  },
);

module.exports = QuestaoDiscursiva;
