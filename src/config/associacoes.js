const Usuario = require("../modulos/autenticacao/models/usuario.model");
const TokenRecuperacaoSenha = require("../modulos/autenticacao/models/tokenRecuperacaoSenha.model");
const Modulo = require("../modulos/estudo/models/modulo.model");
const Aula = require("../modulos/estudo/models/aula.model");
const Questao = require("../modulos/estudo/models/questao.model");
const QuestaoDiscursiva = require("../modulos/estudo/models/questaoDiscursiva.model");
const RespostaDiscursiva = require("../modulos/estudo/models/respostaDiscursiva.model");
const ProgressoUsuario = require("../modulos/progresso/models/progressoUsuario.model");
const HistoricoErro = require("../modulos/progresso/models/historicoErro.model");
const AtividadeDiaria = require("../modulos/progresso/models/atividadeDiaria.model");
const Missao = require("../modulos/progresso/models/missao.model");
const Amizade = require("../modulos/autenticacao/models/amizade.model");
const RespostaQuestaoObjetiva = require("../modulos/progresso/models/respostaQuestaoObjetiva.model");
const Agencia = require("../modulos/catalogo/models/agencia.model");
const Trilha = require("../modulos/catalogo/models/trilha.model");
const Matricula = require("../modulos/catalogo/models/matricula.model");
const ModuloTrilha = require("../modulos/catalogo/models/moduloTrilha.model");
const InscricaoTrilha = require("../modulos/catalogo/models/inscricaoTrilha.model");
const EventoXp = require("../modulos/progresso/models/eventoXp.model");
const EventoMissao = require("../modulos/progresso/models/eventoMissao.model");
const Simulado = require("../modulos/estudo/models/simulado.model");
const SessaoEstudo = require("../modulos/estudo/models/sessaoEstudo.model");
const RelatorioErro = require("../modulos/progresso/models/relatorioErro.model");
const AnexoAula = require("../modulos/estudo/models/anexoAula.model");

function configurarAssociacoes() {
  Agencia.hasMany(Trilha, { foreignKey: "agencia_id", as: "trilhas" });
  Trilha.belongsTo(Agencia, { foreignKey: "agencia_id", as: "agencia" });

  Agencia.hasMany(Modulo, { foreignKey: "agencia_id", as: "modulos" });
  Modulo.belongsTo(Agencia, { foreignKey: "agencia_id", as: "agencia" });

  Modulo.belongsToMany(Trilha, {
    through: ModuloTrilha,
    foreignKey: "modulo_id",
    otherKey: "trilha_id",
    as: "trilhas",
  });
  Trilha.belongsToMany(Modulo, {
    through: ModuloTrilha,
    foreignKey: "trilha_id",
    otherKey: "modulo_id",
    as: "modulos",
  });

  Usuario.hasMany(Matricula, { foreignKey: "usuario_id", as: "matriculas" });
  Matricula.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
  Agencia.hasMany(Matricula, { foreignKey: "agencia_id", as: "matriculas" });
  Matricula.belongsTo(Agencia, { foreignKey: "agencia_id", as: "agencia" });
  Trilha.hasMany(Matricula, { foreignKey: "trilha_id", as: "matriculas" });
  Matricula.belongsTo(Trilha, { foreignKey: "trilha_id", as: "trilha" });

  Usuario.hasMany(InscricaoTrilha, { foreignKey: "usuario_id", as: "inscricoesTrilhas" });
  InscricaoTrilha.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
  Trilha.hasMany(InscricaoTrilha, { foreignKey: "trilha_id", as: "inscricoes" });
  InscricaoTrilha.belongsTo(Trilha, { foreignKey: "trilha_id", as: "trilha" });

  Modulo.hasMany(Aula, { foreignKey: "modulo_id", as: "aulas" });
  Aula.belongsTo(Modulo, { foreignKey: "modulo_id", as: "modulo" });

  Aula.hasMany(Questao, { foreignKey: "aula_id", as: "questoes" });
  Questao.belongsTo(Aula, { foreignKey: "aula_id", as: "aula" });

  Aula.hasMany(AnexoAula, { foreignKey: "aula_id", as: "anexos" });
  AnexoAula.belongsTo(Aula, { foreignKey: "aula_id", as: "aula" });

  Modulo.hasMany(Questao, { foreignKey: "modulo_id", as: "questoesBanco" });
  Questao.belongsTo(Modulo, { foreignKey: "modulo_id", as: "modulo" });

  Usuario.hasMany(ProgressoUsuario, { foreignKey: "usuario_id", as: "progressos" });
  ProgressoUsuario.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

  Aula.hasMany(ProgressoUsuario, { foreignKey: "aula_id", as: "progressos" });
  ProgressoUsuario.belongsTo(Aula, { foreignKey: "aula_id", as: "aula" });

  Usuario.hasMany(HistoricoErro, { foreignKey: "usuario_id", as: "erros" });
  HistoricoErro.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

  Usuario.hasMany(AtividadeDiaria, { foreignKey: "usuario_id", as: "atividadesDiarias" });
  AtividadeDiaria.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

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

  Usuario.hasMany(Missao, { foreignKey: "usuario_id", as: "missoes" });
  Missao.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

  Modulo.hasMany(Missao, { foreignKey: "modulo_id", as: "missoes" });
  Missao.belongsTo(Modulo, { foreignKey: "modulo_id", as: "modulo" });

  Usuario.hasMany(Amizade, { foreignKey: "usuario_id", as: "amizadesEnviadas" });
  Amizade.belongsTo(Usuario, { foreignKey: "usuario_id", as: "solicitante" });

  Usuario.hasMany(Amizade, { foreignKey: "amigo_id", as: "amizadesRecebidas" });
  Amizade.belongsTo(Usuario, { foreignKey: "amigo_id", as: "destinatario" });

  Usuario.hasMany(RespostaQuestaoObjetiva, { foreignKey: "usuario_id", as: "questoesAcertadas" });
  RespostaQuestaoObjetiva.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

  Questao.hasMany(RespostaQuestaoObjetiva, { foreignKey: "questao_id", as: "acertos" });
  RespostaQuestaoObjetiva.belongsTo(Questao, { foreignKey: "questao_id", as: "questao" });

  Usuario.hasMany(EventoXp, { foreignKey: "usuario_id", as: "eventosXp" });
  EventoXp.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
  Missao.hasMany(EventoMissao, { foreignKey: "missao_id", as: "eventos" });
  EventoMissao.belongsTo(Missao, { foreignKey: "missao_id", as: "missao" });

  Usuario.hasMany(Simulado, { foreignKey: "usuario_id", as: "simulados" });
  Simulado.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
  Agencia.hasMany(Simulado, { foreignKey: "agencia_id", as: "simulados" });
  Simulado.belongsTo(Agencia, { foreignKey: "agencia_id", as: "agencia" });
  Trilha.hasMany(Simulado, { foreignKey: "trilha_id", as: "simulados" });
  Simulado.belongsTo(Trilha, { foreignKey: "trilha_id", as: "trilha" });

  Usuario.hasMany(SessaoEstudo, { foreignKey: "usuario_id", as: "sessoesEstudo" });
  SessaoEstudo.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
  Agencia.hasMany(SessaoEstudo, { foreignKey: "agencia_id", as: "sessoesEstudo" });
  SessaoEstudo.belongsTo(Agencia, { foreignKey: "agencia_id", as: "agencia" });
  Trilha.hasMany(SessaoEstudo, { foreignKey: "trilha_id", as: "sessoesEstudo" });
  SessaoEstudo.belongsTo(Trilha, { foreignKey: "trilha_id", as: "trilha" });
  Modulo.hasMany(SessaoEstudo, { foreignKey: "modulo_id", as: "sessoesEstudo" });
  SessaoEstudo.belongsTo(Modulo, { foreignKey: "modulo_id", as: "modulo" });
  Aula.hasMany(SessaoEstudo, { foreignKey: "aula_id", as: "sessoesEstudo" });
  SessaoEstudo.belongsTo(Aula, { foreignKey: "aula_id", as: "aula" });

  Usuario.hasMany(RelatorioErro, { foreignKey: "usuario_id", as: "relatoriosErro" });
  RelatorioErro.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
  Aula.hasMany(RelatorioErro, { foreignKey: "aula_id", as: "relatoriosErro" });
  RelatorioErro.belongsTo(Aula, { foreignKey: "aula_id", as: "aula" });
}

module.exports = configurarAssociacoes;
