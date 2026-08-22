const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

const Aula = sequelize.define(
  "Aula",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    modulo_id: { type: DataTypes.INTEGER, allowNull: false },
    titulo: { type: DataTypes.STRING(255), allowNull: false },
    youtube_iframe_url: { type: DataTypes.STRING(500), allowNull: true },
    tipo_conteudo: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "youtube" },
    provedor_externo: { type: DataTypes.STRING(50), allowNull: true },
    url_externa: { type: DataTypes.STRING(1000), allowNull: true },
    id_externo: { type: DataTypes.STRING(120), allowNull: true },
    duracao_video_segundos: { type: DataTypes.INTEGER, allowNull: true },
    duracao_video_fonte: { type: DataTypes.STRING(30), allowNull: true },
    duracao_video_atualizada_em: { type: DataTypes.DATE, allowNull: true },
    resumo_texto: { type: DataTypes.TEXT, allowNull: false },
    ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    transcricao_texto: { type: DataTypes.TEXT, allowNull: true },
    transcricao_gerada_em: { type: DataTypes.DATE, allowNull: true },
    guia_estudo: { type: DataTypes.JSONB, allowNull: true },
    mapa_mental: { type: DataTypes.JSONB, allowNull: true },
    mapa_mental_fonte: { type: DataTypes.STRING(30), allowNull: true },
    mapa_mental_hash: { type: DataTypes.STRING(64), allowNull: true },
    mapa_mental_gerado_em: { type: DataTypes.DATE, allowNull: true },
    mapa_mental_tentativa_em: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "aulas",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Aula;
