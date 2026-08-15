const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/configDB");

// Registra que um usuário já acertou uma questão objetiva específica pelo menos uma vez.
// Usado pra saber se TODAS as questões de uma aula já foram respondidas corretamente
// (aula só é marcada como concluída quando 100% das suas questões estão aqui) e pra
// não conceder XP de novo por acertar a mesma questão outra vez.
const RespostaQuestaoObjetiva = sequelize.define(
  "RespostaQuestaoObjetiva",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    questao_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "respostas_questoes_objetivas",
    underscored: true,
    timestamps: true,
  },
);

module.exports = RespostaQuestaoObjetiva;
