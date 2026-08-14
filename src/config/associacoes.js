const Usuario = require("../modulos/autenticacao/models/usuario.model");
const TokenRecuperacaoSenha = require("../modulos/autenticacao/models/tokenRecuperacaoSenha.model");
const Modulo = require("../modulos/estudo/models/modulo.model");
const Aula = require("../modulos/estudo/models/aula.model");
const Questao = require("../modulos/estudo/models/questao.model");
const QuestaoDiscursiva = require("../modulos/estudo/models/questaoDiscursiva.model");
const RespostaDiscursiva = require("../modulos/estudo/models/respostaDiscursiva.model");
const ProgressoUsuario = require("../modulos/progresso/models/progressoUsuario.model");
const HistoricoErro = require("../modulos/progresso/models/historicoErro.model");

function configurarAssociacoes() {
  Modulo.hasMany(Aula, { foreignKey: "modulo_id", as: "aulas" });
  Aula.belongsTo(Modulo, { foreignKey: "modulo_id", as: "modulo" });

  Aula.hasMany(Questao, { foreignKey: "aula_id", as: "questoes" });
  Questao.belongsTo(Aula, { foreignKey: "aula_id", as: "aula" });

  Usuario.hasMany(ProgressoUsuario, { foreignKey: "usuario_id", as: "progressos" });
  ProgressoUsuario.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

  Aula.hasMany(ProgressoUsuario, { foreignKey: "aula_id", as: "progressos" });
  ProgressoUsuario.belongsTo(Aula, { foreignKey: "aula_id", as: "aula" });

  Usuario.hasMany(HistoricoErro, { foreignKey: "usuario_id", as: "erros" });
  HistoricoErro.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

  Questao.hasMany(HistoricoErro, { foreignKey: "questao_id", as: "erros" });
  HistoricoErro.belongsTo(Questao, { foreignKey: "questao_id", as: "questao" });

  Usuario.hasMany(TokenRecuperacaoSenha, { foreignKey: "usuario_id", as: "tokensRecuperacao" });
  TokenRecuperacaoSenha.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

  Aula.hasMany(QuestaoDiscursiva, { foreignKey: "aula_id", as: "discursivas" });
  QuestaoDiscursiva.belongsTo(Aula, { foreignKey: "aula_id", as: "aula" });

  QuestaoDiscursiva.hasMany(RespostaDiscursiva, { foreignKey: "questao_discursiva_id", as: "respostas" });
  RespostaDiscursiva.belongsTo(QuestaoDiscursiva, { foreignKey: "questao_discursiva_id", as: "questaoDiscursiva" });

  Usuario.hasMany(RespostaDiscursiva, { foreignKey: "usuario_id", as: "respostasDiscursivas" });
  RespostaDiscursiva.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
}

module.exports = configurarAssociacoes;
