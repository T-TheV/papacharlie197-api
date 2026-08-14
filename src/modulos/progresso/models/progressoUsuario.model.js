const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const ProgressoUsuario = sequelize.define(
  "ProgressoUsuario",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    aula_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("bloqueado", "em_andamento", "concluido"),
      allowNull: false,
      defaultValue: "bloqueado",
    },
    xp_ganho: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "progresso_usuarios",
    underscored: true,
    timestamps: true,
  },
);

module.exports = ProgressoUsuario;
