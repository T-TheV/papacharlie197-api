const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

// Reporte de um usuário sinalizando um problema no conteúdo de uma aula (vídeo errado,
// questão mal formulada, etc). Fica pendente até o admin marcar como resolvido.
const RelatorioErro = sequelize.define(
  "RelatorioErro",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    aula_id: { type: DataTypes.INTEGER, allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM("pendente", "resolvido"), allowNull: false, defaultValue: "pendente" },
  },
  {
    tableName: "relatorios_erro",
    underscored: true,
    timestamps: true,
  },
);

module.exports = RelatorioErro;
