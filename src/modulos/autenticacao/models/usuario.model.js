const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Usuario = sequelize.define(
  "Usuario",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(255), allowNull: false },
    sobrenome: { type: DataTypes.STRING(255), allowNull: false },
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(valor) {
        this.setDataValue(
          "email",
          String(valor || "")
            .toLowerCase()
            .trim(),
        );
      },
    },
    senha_hash: { type: DataTypes.STRING(255), allowNull: false },
    foto_url: { type: DataTypes.STRING(500), allowNull: true },
    xp: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    papel: {
      type: DataTypes.ENUM("aluno", "superadmin"),
      allowNull: false,
      defaultValue: "aluno",
    },
    cargo: {
      type: DataTypes.ENUM("agente", "escrivao", "delegado"),
      allowNull: true,
    },
  },
  {
    tableName: "usuarios",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Usuario;
