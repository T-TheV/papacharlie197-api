const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Amizade = sequelize.define(
  "Amizade",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    amigo_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("pendente", "aceito"), allowNull: false, defaultValue: "pendente" },
  },
  {
    tableName: "amizades",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Amizade;
