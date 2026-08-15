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
    versao_token: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    papel: {
      type: DataTypes.ENUM("aluno", "superadmin"),
      allowNull: false,
      defaultValue: "aluno",
    },
    cargo: {
      type: DataTypes.ENUM("agente", "escrivao", "delegado"),
      allowNull: true,
    },
    sequencia_atual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    melhor_sequencia: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ultima_atividade_em: { type: DataTypes.DATEONLY, allowNull: true },
    congelamentos_disponiveis: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    mensagem_dia_texto: { type: DataTypes.TEXT, allowNull: true },
    mensagem_dia_data: { type: DataTypes.DATEONLY, allowNull: true },
    mensagem_dia_contexto: { type: DataTypes.STRING(80), allowNull: true },
    // Dias da semana (0=domingo..6=sábado) que o usuário se compromete a estudar.
    // Vazio = todo dia conta (comportamento padrão/antigo).
    dias_estudo: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false, defaultValue: [] },
    // 'YYYY-MM' do último mês em que o bônus de 4 congelamentos foi concedido — evita conceder 2x no mesmo mês.
    congelamento_bonus_mes: { type: DataTypes.STRING(7), allowNull: true },
    // Handle único (sem o "@") pra ser encontrado por amigos, ex: "david.jardim".
    arroba: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    // Snapshot do XP no início da semana corrente, pra calcular XP ganho na semana no ranking de amigos.
    xp_inicio_semana: { type: DataTypes.INTEGER, allowNull: true },
    // 'YYYY-MM-DD' da segunda-feira da semana referente ao snapshot acima — se não bater com a semana atual, reseta.
    semana_referencia_xp: { type: DataTypes.STRING(10), allowNull: true },
  },
  {
    tableName: "usuarios",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Usuario;
