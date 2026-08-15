const Usuario = require("../../autenticacao/models/usuario.model");
const AtividadeDiaria = require("../models/atividadeDiaria.model");
const { registrarDiaDeSequencia } = require("./missao.service");
const { sequelize } = require("../../../config/configDB");

const CONGELAMENTOS_MAXIMOS = 6;
const LIMITE_BUSCA_DIAS = 30;

function hojeISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function paraData(iso) {
  return new Date(`${iso}T12:00:00Z`);
}

function diaDaSemana(iso) {
  return paraData(iso).getUTCDay(); // 0=domingo ... 6=sábado
}

function diaAnteriorISO(iso) {
  const data = paraData(iso);
  data.setUTCDate(data.getUTCDate() - 1);
  return data.toISOString().slice(0, 10);
}

// Vazio = todo dia conta como dia de estudo (comportamento padrão).
function ehDiaDeEstudo(iso, diasEstudo) {
  if (!diasEstudo || diasEstudo.length === 0) return true;
  return diasEstudo.includes(diaDaSemana(iso));
}

// Anda pra trás a partir de (mas sem incluir) `iso` até achar o dia de estudo mais recente.
function diaDeEstudoAnteriorA(iso, diasEstudo) {
  let cursor = diaAnteriorISO(iso);
  for (let i = 0; i < LIMITE_BUSCA_DIAS; i += 1) {
    if (ehDiaDeEstudo(cursor, diasEstudo)) return cursor;
    cursor = diaAnteriorISO(cursor);
  }
  return cursor;
}

// Chamada sempre que o usuário faz qualquer ação que conta como "estudou hoje"
// (ver uma aula, responder questão, terminar simulado, enviar discursiva). Idempotente.
// A sequência só quebra se faltar atividade num dia marcado como dia de estudo —
// dias fora da configuração do usuário são ignorados no cálculo (nem ajudam nem atrapalham).
async function registrarAtividadeDiariaInterna(usuarioId, transaction) {
  const hoje = hojeISO();

  const usuario = await Usuario.findByPk(usuarioId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!usuario) return;

  const jaRegistrouHoje = await AtividadeDiaria.findOne({
    where: { usuario_id: usuarioId, data: hoje },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (jaRegistrouHoje) return;

  const diasEstudo = usuario.dias_estudo || [];
  if (!ehDiaDeEstudo(hoje, diasEstudo)) {
    await AtividadeDiaria.create({ usuario_id: usuarioId, data: hoje }, { transaction });
    return;
  }
  const ultimoDiaExigidoAntesDeHoje = diaDeEstudoAnteriorA(hoje, diasEstudo);

  if (!usuario.ultima_atividade_em) {
    usuario.sequencia_atual = 1;
  } else if (usuario.ultima_atividade_em >= ultimoDiaExigidoAntesDeHoje) {
    // Teve atividade cobrindo o último dia de estudo exigido (seja ontem, seja antes do fim de semana).
    usuario.sequencia_atual += 1;
  } else {
    // Faltou exatamente um dia de estudo exigido? Congelamento pode cobrir.
    const diaExigidoAnterior = diaDeEstudoAnteriorA(ultimoDiaExigidoAntesDeHoje, diasEstudo);
    const perdeuApenasUmDiaExigido = usuario.ultima_atividade_em >= diaExigidoAnterior;

    if (perdeuApenasUmDiaExigido && usuario.congelamentos_disponiveis > 0) {
      usuario.congelamentos_disponiveis -= 1;
      await AtividadeDiaria.create({
        usuario_id: usuarioId,
        data: ultimoDiaExigidoAntesDeHoje,
        congelada: true,
      }, { transaction });
      usuario.sequencia_atual += 1;
    } else {
      usuario.sequencia_atual = 1;
    }
  }

  await AtividadeDiaria.create({ usuario_id: usuarioId, data: hoje }, { transaction });

  usuario.ultima_atividade_em = hoje;
  usuario.melhor_sequencia = Math.max(usuario.melhor_sequencia, usuario.sequencia_atual);

  if (
    usuario.sequencia_atual > 0 &&
    usuario.sequencia_atual % 7 === 0 &&
    usuario.congelamentos_disponiveis < CONGELAMENTOS_MAXIMOS
  ) {
    usuario.congelamentos_disponiveis += 1;
  }

  await usuario.save({ transaction });
  await registrarDiaDeSequencia(usuarioId, hoje, transaction);
}

async function registrarAtividadeDiaria(usuarioId, { transaction } = {}) {
  if (transaction) return registrarAtividadeDiariaInterna(usuarioId, transaction);
  return sequelize.transaction((novaTransaction) => registrarAtividadeDiariaInterna(usuarioId, novaTransaction));
}

module.exports = { registrarAtividadeDiaria, hojeISO };
