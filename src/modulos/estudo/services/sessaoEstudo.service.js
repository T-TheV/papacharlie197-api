const { Op } = require("sequelize");
const { sequelize } = require("../../../config/configDB");
const Aula = require("../models/aula.model");
const Questao = require("../models/questao.model");
const QuestaoDiscursiva = require("../models/questaoDiscursiva.model");
const SessaoEstudo = require("../models/sessaoEstudo.model");
const { obterAulaVisivel } = require("./acessoConteudo.service");
const {
  calcularPlanoEstudo,
  criarEtapas,
  obterRegrasDoContexto,
} = require("./planejamentoEstudo.service");

const STATUS_ATIVOS = ["planejada", "em_andamento", "interrompida"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function criarErro(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function sanitizarEstadoTimer(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== "object" || Array.isArray(valor)) throw criarErro("Estado do timer inválido");
  if (JSON.stringify(valor).length > 12000) throw criarErro("Estado do timer excede o limite permitido");
  return valor;
}

async function contarQuestoes(aulaId, transaction) {
  const [objetivas, discursivas] = await Promise.all([
    Questao.count({ where: { aula_id: aulaId, origem: "estudo" }, transaction }),
    QuestaoDiscursiva.count({ where: { aula_id: aulaId }, transaction }),
  ]);
  return { objetivas, discursivas };
}

async function montarPlanoAula(aula, contexto, { transaction } = {}) {
  const contagem = await contarQuestoes(aula.id, transaction);
  return calcularPlanoEstudo({
    duracaoVideoSegundos: aula.duracao_video_segundos,
    possuiVideo: aula.tipo_conteudo !== "material" && Boolean(aula.youtube_iframe_url || aula.url_externa),
    quantidadeObjetivas: contagem.objetivas,
    quantidadeDiscursivas: contagem.discursivas,
    regras: obterRegrasDoContexto(contexto),
  });
}

function dtoSessao(sessao) {
  if (!sessao) return null;
  return {
    id: sessao.id,
    chaveCliente: sessao.chave_cliente,
    usuarioId: sessao.usuario_id,
    agenciaId: sessao.agencia_id,
    trilhaId: sessao.trilha_id,
    moduloId: sessao.modulo_id,
    aulaId: sessao.aula_id,
    tempoEstimadoSegundos: sessao.tempo_estimado_segundos,
    tempoPlanejadoSegundos: sessao.tempo_planejado_segundos,
    tempoEfetivoSegundos: sessao.tempo_efetivo_segundos,
    duracaoVideoSegundos: sessao.duracao_video_segundos,
    questoesObjetivas: sessao.questoes_objetivas,
    questoesDiscursivas: sessao.questoes_discursivas,
    margemSegundos: sessao.margem_segundos,
    regras: sessao.regras,
    etapas: sessao.ciclos_planejados,
    estadoTimer: sessao.estado_timer,
    status: sessao.status,
    iniciadaEm: sessao.iniciada_em,
    interrompidaEm: sessao.interrompida_em,
    concluidaEm: sessao.concluida_em,
  };
}

async function criarSessao({ usuarioId, aulaId, contexto, chaveCliente, tempoPlanejadoMinutos }) {
  if (!UUID.test(String(chaveCliente || ""))) throw criarErro("Identificador da sessão inválido");

  return sequelize.transaction(async (transaction) => {
    const existente = await SessaoEstudo.findOne({
      where: { usuario_id: usuarioId, chave_cliente: chaveCliente },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existente) {
      if (
        Number(existente.aula_id) !== Number(aulaId)
        || Number(existente.agencia_id) !== Number(contexto.agenciaId)
        || Number(existente.trilha_id || 0) !== Number(contexto.trilhaId || 0)
      ) {
        throw criarErro("Este identificador já pertence a outra sessão", 409);
      }
      return dtoSessao(existente);
    }

    const aula = await obterAulaVisivel(aulaId, usuarioId, contexto, { transaction });
    const plano = await montarPlanoAula(aula, contexto, { transaction });
    const intervalo = plano.regras.arredondamentoMinutos;
    const solicitado = tempoPlanejadoMinutos === undefined || tempoPlanejadoMinutos === null
      ? plano.totalEstimadoMinutos
      : Number(tempoPlanejadoMinutos);
    if (!Number.isFinite(solicitado) || solicitado <= 0) {
      throw criarErro("Defina um tempo de estudo maior que zero");
    }
    const planejado = Math.ceil(solicitado / intervalo) * intervalo;
    if (planejado > plano.regras.maximoPlanejadoMinutos) {
      throw criarErro(`O tempo planejado deve ter no máximo ${plano.regras.maximoPlanejadoMinutos} minutos`);
    }

    const sessao = await SessaoEstudo.create(
      {
        chave_cliente: chaveCliente,
        usuario_id: usuarioId,
        agencia_id: contexto.agenciaId,
        trilha_id: contexto.trilhaId || null,
        modulo_id: aula.modulo_id,
        aula_id: aula.id,
        tempo_estimado_segundos: plano.totalEstimadoSegundos,
        tempo_planejado_segundos: planejado * 60,
        duracao_video_segundos: aula.duracao_video_segundos,
        questoes_objetivas: plano.objetivas.quantidade,
        questoes_discursivas: plano.discursivas.quantidade,
        margem_segundos: plano.margem.segundos,
        regras: plano.regras,
        ciclos_planejados: criarEtapas(planejado, plano.regras),
      },
      { transaction },
    );
    return dtoSessao(sessao);
  });
}

async function obterSessaoDoUsuario(id, usuarioId, contexto, { transaction, lock } = {}) {
  const sessao = await SessaoEstudo.findOne({
    where: {
      id,
      usuario_id: usuarioId,
      agencia_id: contexto.agenciaId,
      trilha_id: contexto.trilhaId || null,
    },
    transaction,
    lock,
  });
  if (!sessao) throw criarErro("Sessão de estudo não encontrada neste curso", 404);
  return sessao;
}

function tempoEfetivoSeguro(sessao, valor) {
  const numero = Math.floor(Number(valor));
  if (!Number.isFinite(numero) || numero < 0) return sessao.tempo_efetivo_segundos;
  return Math.min(
    sessao.tempo_planejado_segundos,
    Math.max(sessao.tempo_efetivo_segundos, numero),
  );
}

async function atualizarSessao({ id, usuarioId, contexto, acao, tempoEfetivoSegundos, estadoTimer }) {
  return sequelize.transaction(async (transaction) => {
    const sessao = await obterSessaoDoUsuario(id, usuarioId, contexto, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (sessao.status === "concluida") {
      return { ...dtoSessao(sessao), conclusaoIdempotente: true, xpConcedido: 0 };
    }
    if (sessao.status === "cancelada") throw criarErro("Esta sessão foi cancelada", 409);

    const agora = new Date();
    const atualizacao = {
      tempo_efetivo_segundos: tempoEfetivoSeguro(sessao, tempoEfetivoSegundos),
    };
    if (estadoTimer !== undefined) atualizacao.estado_timer = sanitizarEstadoTimer(estadoTimer);

    if (acao === "iniciar") {
      atualizacao.status = "em_andamento";
      atualizacao.iniciada_em = sessao.iniciada_em || agora;
      atualizacao.interrompida_em = null;
    } else if (acao === "interromper") {
      atualizacao.status = "interrompida";
      atualizacao.interrompida_em = agora;
    } else if (acao === "concluir") {
      atualizacao.status = "concluida";
      atualizacao.concluida_em = agora;
      atualizacao.interrompida_em = null;
    }

    await sessao.update(atualizacao, { transaction });
    return {
      ...dtoSessao(sessao),
      conclusaoIdempotente: false,
      // Sessões não geram XP por tempo. O XP continua vindo das ações de estudo já validadas.
      xpConcedido: 0,
    };
  });
}

async function obterSessaoAtiva({ usuarioId, aulaId, contexto }) {
  await obterAulaVisivel(aulaId, usuarioId, contexto);
  const sessao = await SessaoEstudo.findOne({
    where: {
      usuario_id: usuarioId,
      aula_id: aulaId,
      agencia_id: contexto.agenciaId,
      trilha_id: contexto.trilhaId || null,
      status: { [Op.in]: STATUS_ATIVOS },
    },
    order: [["created_at", "DESC"]],
  });
  return dtoSessao(sessao);
}

async function registrarDuracaoVideo({ usuarioId, aulaId, contexto, duracaoSegundos }) {
  const duracao = Math.round(Number(duracaoSegundos));
  if (!Number.isFinite(duracao) || duracao < 1 || duracao > 12 * 60 * 60) {
    throw criarErro("Duração de vídeo inválida");
  }
  const aula = await obterAulaVisivel(aulaId, usuarioId, contexto);
  if (!aula.youtube_iframe_url) throw criarErro("Esta aula não possui vídeo");

  if (!aula.duracao_video_segundos) {
    await Aula.update(
      {
        duracao_video_segundos: duracao,
        duracao_video_fonte: "youtube_iframe_api",
        duracao_video_atualizada_em: new Date(),
      },
      { where: { id: aula.id, duracao_video_segundos: null } },
    );
  }
  await aula.reload();
  return {
    duracaoVideoSegundos: aula.duracao_video_segundos,
    planoEstudo: await montarPlanoAula(aula, contexto),
  };
}

module.exports = {
  montarPlanoAula,
  criarSessao,
  obterSessaoAtiva,
  atualizarSessao,
  registrarDuracaoVideo,
};
