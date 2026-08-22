const { Op } = require("sequelize");
const { sequelize } = require("../../../config/configDB");
const Usuario = require("../../autenticacao/models/usuario.model");
const Aula = require("../../estudo/models/aula.model");
const Modulo = require("../../estudo/models/modulo.model");
const Questao = require("../../estudo/models/questao.model");
const ProgressoUsuario = require("../../progresso/models/progressoUsuario.model");
const HistoricoErro = require("../../progresso/models/historicoErro.model");
const RespostaQuestaoObjetiva = require("../../progresso/models/respostaQuestaoObjetiva.model");
const SessaoEstudo = require("../../estudo/models/sessaoEstudo.model");
const Simulado = require("../../estudo/models/simulado.model");
const Flashcard = require("../models/flashcard.model");
const RevisaoFlashcard = require("../models/revisaoFlashcard.model");
const ItemPlanoDiario = require("../models/itemPlanoDiario.model");
const { hojeISO } = require("../../progresso/services/streak.service");
const { garantirProgressoInicial } = require("../../progresso/services/gamificacao.service");
const { listarModulosVisiveis, obterAulaVisivel } = require("../../estudo/services/acessoConteudo.service");
const { montarPlanoAula } = require("../../estudo/services/sessaoEstudo.service");
const { gerarFlashcards: gerarFlashcardsComIa } = require("../../ia/services/gemini.service");
const {
  normalizarConfiguracao,
  minutosDisponiveis,
  selecionarAgenda,
} = require("./agendaAdaptativa.service");
const {
  escopoFlashcardsWhere,
  garantirFlashcardsCatalogo,
} = require("./flashcardsCatalogo.service");

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const AVALIACOES = new Set(["errei", "dificil", "bom", "facil"]);

function erro(mensagem, status = 400) {
  const e = new Error(mensagem);
  e.status = status;
  return e;
}

function contextoWhere(contexto) {
  return { agencia_id: contexto.agenciaId, trilha_id: contexto.trilhaId || null };
}

function limitesDoDia(data = new Date()) {
  const inicio = new Date(data);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio.getTime() + UM_DIA_MS);
  return { inicio, fim };
}

function dataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function configuracaoDoContexto(usuario, contexto) {
  const raiz = usuario.configuracao_planejamento || {};
  const chave = `${contexto.agenciaId}:${contexto.trilhaId || "geral"}`;
  return normalizarConfiguracao({ ...raiz, ...(raiz.porCurso?.[chave] || {}) });
}

function dtoItemPlano(item) {
  return {
    id: item.id,
    tipo: item.tipo,
    titulo: item.titulo,
    detalhe: item.detalhe,
    moduloId: item.modulo_id,
    aulaId: item.aula_id,
    minutosEstimados: item.minutos_estimados,
    minutosPlanejados: item.minutos_planejados,
    status: item.status,
    prioridade: item.prioridade,
    concluidoEm: item.concluido_em,
  };
}

function dtoFlashcard(card) {
  return {
    id: card.id,
    frente: card.frente,
    verso: card.verso,
    origem: card.origem,
    moduloId: card.modulo_id,
    moduloTitulo: card.modulo?.titulo || null,
    aulaId: card.aula_id,
    aulaTitulo: card.aula?.titulo || null,
    repeticoes: card.repeticoes,
    intervaloDias: card.intervalo_dias,
    fatorFacilidade: Number(card.fator_facilidade),
    proximaRevisaoEm: card.proxima_revisao_em,
    revisadoEm: card.revisado_em,
    vencido: new Date(card.proxima_revisao_em) <= new Date(),
    ativo: card.ativo,
  };
}

async function errosVisiveis(usuarioId, contexto, { somenteVencidos = false, transaction } = {}) {
  const modulos = await listarModulosVisiveis(contexto, { incluirAulas: false, transaction });
  const moduloIds = new Set(modulos.map((modulo) => Number(modulo.id)));
  const registros = await HistoricoErro.findAll({
    where: {
      usuario_id: usuarioId,
      resolvido: false,
      ...(somenteVencidos && {
        [Op.or]: [{ disponivel_em: null }, { disponivel_em: { [Op.lte]: new Date() } }],
      }),
    },
    include: [{
      model: Questao,
      as: "questao",
      include: [{ model: Aula, as: "aula", include: [{ model: Modulo, as: "modulo" }] }],
    }],
    transaction,
  });
  return registros.filter((registro) => moduloIds.has(Number(registro.questao?.aula?.modulo_id)));
}

async function sincronizarItensAutomaticos(itens, usuarioId, contexto, transaction) {
  const aulaIds = itens.filter((item) => item.tipo === "aula" && item.aula_id).map((item) => item.aula_id);
  const concluidas = aulaIds.length
    ? await ProgressoUsuario.findAll({
        where: { usuario_id: usuarioId, aula_id: aulaIds, status: "concluido" },
        attributes: ["aula_id"],
        transaction,
      })
    : [];
  const concluidasSet = new Set(concluidas.map((item) => Number(item.aula_id)));
  const precisaRevisao = itens.some((item) => item.tipo === "revisao" && item.status === "pendente");
  const precisaFlashcards = itens.some((item) => item.tipo === "flashcards" && item.status === "pendente");
  const [errosVencidos, flashcardsVencidos] = await Promise.all([
    precisaRevisao ? errosVisiveis(usuarioId, contexto, { somenteVencidos: true, transaction }) : [],
    precisaFlashcards
      ? Flashcard.count({
          where: {
            usuario_id: usuarioId,
            ...escopoFlashcardsWhere(contexto),
            ativo: true,
            proxima_revisao_em: { [Op.lte]: new Date() },
          },
          transaction,
        })
      : 0,
  ]);

  for (const item of itens) {
    if (item.status !== "pendente") continue;
    if (item.tipo === "aula" && concluidasSet.has(Number(item.aula_id))) {
      await item.update({ status: "concluido", concluido_em: new Date() }, { transaction });
    } else if (item.tipo === "revisao" && errosVencidos.length === 0) {
      await item.update({ status: "concluido", concluido_em: new Date() }, { transaction });
    } else if (item.tipo === "flashcards" && flashcardsVencidos === 0) {
      await item.update({ status: "concluido", concluido_em: new Date() }, { transaction });
    }
  }
}

async function candidatosDoPlano(usuario, contexto, config, transaction) {
  await garantirProgressoInicial(usuario.id, contexto, transaction);
  await garantirFlashcardsCatalogo(usuario.id, contexto, { transaction });
  const [modulos, progressos, erros, flashcardsVencidos] = await Promise.all([
    listarModulosVisiveis(contexto, { transaction }),
    ProgressoUsuario.findAll({ where: { usuario_id: usuario.id }, transaction }),
    errosVisiveis(usuario.id, contexto, { somenteVencidos: true, transaction }),
    Flashcard.count({
      where: {
        usuario_id: usuario.id,
        ...escopoFlashcardsWhere(contexto),
        ativo: true,
        proxima_revisao_em: { [Op.lte]: new Date() },
      },
      transaction,
    }),
  ]);
  const statusPorAula = new Map(progressos.map((p) => [Number(p.aula_id), p.status]));
  const candidatos = [];

  if (erros.length > 0) {
    candidatos.push({
      tipo: "revisao",
      chaveReferencia: `revisao:${hojeISO()}`,
      titulo: "Reforçar pontos pendentes",
      detalhe: `${erros.length} questão(ões) que já estão no momento ideal de revisão`,
      minutosEstimados: Math.min(25, Math.max(5, erros.length * 2)),
      prioridade: 100,
    });
  }
  if (flashcardsVencidos > 0) {
    candidatos.push({
      tipo: "flashcards",
      chaveReferencia: `flashcards:${hojeISO()}`,
      titulo: "Revisar flashcards",
      detalhe: `${flashcardsVencidos} cartão(ões) disponíveis para revisão espaçada`,
      minutosEstimados: Math.min(20, Math.max(5, flashcardsVencidos)),
      prioridade: 90,
    });
  }

  const aulasPendentes = modulos.flatMap((modulo) => modulo.aulas
    .filter((aula) => {
      const status = statusPorAula.get(Number(aula.id));
      return status && status !== "bloqueado" && status !== "concluido";
    })
    .map((aula) => ({ aula, modulo })));

  for (const [indice, { aula, modulo }] of aulasPendentes.slice(0, 3).entries()) {
    const plano = await montarPlanoAula(aula, contexto, { transaction });
    const estimado = Math.max(15, plano.totalEstimadoMinutos || 25);
    candidatos.push({
      tipo: "aula",
      chaveReferencia: `aula:${aula.id}`,
      titulo: aula.titulo,
      detalhe: `${modulo.titulo} · ${plano.quantidadeCiclos || 1} ciclo(s) de foco`,
      moduloId: modulo.id,
      aulaId: aula.id,
      minutosEstimados: estimado,
      prioridade: 80 - indice,
    });
  }

  const errosPorModulo = new Map();
  for (const registro of erros) {
    const moduloId = Number(registro.questao?.aula?.modulo_id);
    errosPorModulo.set(moduloId, (errosPorModulo.get(moduloId) || 0) + 1);
  }
  const moduloQuestoes = [...modulos].sort(
    (a, b) => (errosPorModulo.get(Number(b.id)) || 0) - (errosPorModulo.get(Number(a.id)) || 0),
  )[0];
  if (moduloQuestoes) {
    const diasAteProva = contexto.dataProva
      ? Math.ceil((new Date(`${contexto.dataProva}T23:59:59`) - new Date()) / UM_DIA_MS)
      : null;
    candidatos.push({
      tipo: "questoes",
      chaveReferencia: `questoes:${moduloQuestoes.id}:${hojeISO()}`,
      titulo: `Praticar ${moduloQuestoes.titulo}`,
      detalhe: `${config.metaQuestoesPorSessao} questões para consolidar o conteúdo`,
      moduloId: moduloQuestoes.id,
      minutosEstimados: config.metaQuestoesPorSessao * 2,
      prioridade: diasAteProva !== null && diasAteProva <= 30 ? 85 : 55,
    });
  }
  return candidatos;
}

async function calcularRitmo(usuarioId, contexto, config, diasEstudo, transaction) {
  const modulos = await listarModulosVisiveis(contexto, { transaction });
  const aulaIds = modulos.flatMap((modulo) => modulo.aulas.map((aula) => aula.id));
  const concluidas = aulaIds.length
    ? await ProgressoUsuario.count({ where: { usuario_id: usuarioId, aula_id: aulaIds, status: "concluido" }, transaction })
    : 0;
  const pendentes = Math.max(0, aulaIds.length - concluidas);
  if (!contexto.dataProva) return { dataProva: null, diasAteProva: null, aulasPendentes: pendentes, aulasPorDiaEstudo: null, nivel: "sem_data" };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prova = new Date(`${contexto.dataProva}T00:00:00`);
  const diasAteProva = Math.max(0, Math.ceil((prova - hoje) / UM_DIA_MS));
  let diasDisponiveis = 0;
  for (let indice = 0; indice <= Math.min(730, diasAteProva); indice += 1) {
    const data = new Date(hoje.getTime() + indice * UM_DIA_MS);
    if (minutosDisponiveis(config, data, diasEstudo) > 0) diasDisponiveis += 1;
  }
  const aulasPorDiaEstudo = diasDisponiveis ? Number((pendentes / diasDisponiveis).toFixed(1)) : null;
  return {
    dataProva: contexto.dataProva,
    diasAteProva,
    aulasPendentes: pendentes,
    diasDisponiveis,
    aulasPorDiaEstudo,
    nivel: aulasPorDiaEstudo === null ? "sem_disponibilidade" : aulasPorDiaEstudo > 2 ? "intensivo" : aulasPorDiaEstudo > 1 ? "atencao" : "adequado",
  };
}

async function obterPlanoHoje(usuarioId, contexto) {
  return sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:chave))", {
      replacements: { chave: `plano-hoje:${usuarioId}:${contexto.agenciaId}:${contexto.trilhaId || 0}:${hojeISO()}` },
      transaction,
    });
    const usuario = await Usuario.findByPk(usuarioId, { transaction, lock: transaction.LOCK.UPDATE });
    const config = configuracaoDoContexto(usuario, contexto);
    const minutosHoje = minutosDisponiveis(config, new Date(), usuario.dias_estudo || []);
    let itens = await ItemPlanoDiario.findAll({
      where: { usuario_id: usuarioId, ...contextoWhere(contexto), data: hojeISO() },
      order: [["prioridade", "DESC"], ["created_at", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (itens.length === 0 && minutosHoje > 0) {
      const candidatos = await candidatosDoPlano(usuario, contexto, config, transaction);
      const agenda = selecionarAgenda(candidatos, minutosHoje);
      await ItemPlanoDiario.bulkCreate(agenda.itens.map((item) => ({
        usuario_id: usuarioId,
        ...contextoWhere(contexto),
        modulo_id: item.moduloId || null,
        aula_id: item.aulaId || null,
        data: hojeISO(),
        tipo: item.tipo,
        chave_referencia: item.chaveReferencia,
        titulo: item.titulo,
        detalhe: item.detalhe,
        minutos_estimados: item.minutosEstimados,
        minutos_planejados: item.minutosPlanejados,
        prioridade: item.prioridade,
      })), { transaction, ignoreDuplicates: true });
      itens = await ItemPlanoDiario.findAll({
        where: { usuario_id: usuarioId, ...contextoWhere(contexto), data: hojeISO() },
        order: [["prioridade", "DESC"], ["created_at", "ASC"]],
        transaction,
      });
    }

    await sincronizarItensAutomaticos(itens, usuarioId, contexto, transaction);
    const pendenciasAnteriores = await ItemPlanoDiario.count({
      where: {
        usuario_id: usuarioId,
        ...contextoWhere(contexto),
        data: { [Op.lt]: hojeISO(), [Op.gte]: dataISO(new Date(Date.now() - 30 * UM_DIA_MS)) },
        status: "pendente",
      },
      transaction,
    });
    const planejados = itens.reduce((soma, item) => soma + item.minutos_planejados, 0);
    const concluidos = itens.filter((item) => item.status === "concluido").length;
    const ritmo = await calcularRitmo(usuarioId, contexto, config, usuario.dias_estudo || [], transaction);
    return {
      data: hojeISO(),
      minutosDisponiveis: minutosHoje,
      minutosPlanejados: planejados,
      itensConcluidos: concluidos,
      totalItens: itens.filter((item) => item.status !== "ignorado").length,
      pendenciasReplanejadas: pendenciasAnteriores,
      diaDeEstudo: minutosHoje > 0,
      configuracao: config,
      ritmo,
      contexto: { agencia: contexto.agencia?.nome, trilha: contexto.trilha?.nome },
      itens: itens.map(dtoItemPlano),
    };
  });
}

async function atualizarItemPlano(usuarioId, contexto, id, status) {
  if (!["pendente", "concluido", "ignorado"].includes(status)) throw erro("Status do plano inválido");
  const item = await ItemPlanoDiario.findOne({
    where: { id, usuario_id: usuarioId, ...contextoWhere(contexto) },
  });
  if (!item) throw erro("Item do plano não encontrado neste curso", 404);
  await item.update({ status, concluido_em: status === "concluido" ? new Date() : null });
  return dtoItemPlano(item);
}

async function obterPreferencias(usuarioId, contexto) {
  const usuario = await Usuario.findByPk(usuarioId);
  return { configuracao: configuracaoDoContexto(usuario, contexto), diasEstudo: usuario.dias_estudo || [] };
}

async function atualizarPreferencias(usuarioId, contexto, dados) {
  const usuario = await Usuario.findByPk(usuarioId);
  const atual = usuario.configuracao_planejamento || {};
  const recebida = normalizarConfiguracao(dados);
  if (dados.aplicarAoCurso) {
    const chave = `${contexto.agenciaId}:${contexto.trilhaId || "geral"}`;
    usuario.configuracao_planejamento = {
      ...atual,
      porCurso: { ...(atual.porCurso || {}), [chave]: recebida },
    };
  } else {
    usuario.configuracao_planejamento = { ...atual, ...recebida };
  }
  usuario.changed("configuracao_planejamento", true);
  await usuario.save();
  return obterPreferencias(usuarioId, contexto);
}

async function listarFlashcards(usuarioId, contexto, filtros = {}) {
  await garantirFlashcardsCatalogo(usuarioId, contexto);
  const escopo = escopoFlashcardsWhere(contexto);
  const where = { usuario_id: usuarioId, ...escopo, ativo: true };
  if (filtros.vencidos !== false) where.proxima_revisao_em = { [Op.lte]: new Date() };
  if (filtros.moduloId) where.modulo_id = filtros.moduloId;
  if (filtros.aulaId) where.aula_id = filtros.aulaId;
  const cards = await Flashcard.findAll({
    where,
    include: [
      { model: Modulo, as: "modulo", attributes: ["id", "titulo"], required: false },
      { model: Aula, as: "aula", attributes: ["id", "titulo"], required: false },
    ],
    order: [["proxima_revisao_em", "ASC"], ["created_at", "ASC"]],
    limit: 200,
  });
  const total = await Flashcard.count({ where: { usuario_id: usuarioId, ...escopo, ativo: true } });
  const vencidos = await Flashcard.count({
    where: { usuario_id: usuarioId, ...escopo, ativo: true, proxima_revisao_em: { [Op.lte]: new Date() } },
  });
  return { flashcards: cards.map(dtoFlashcard), total, vencidos };
}

async function validarEscopoFlashcard(usuarioId, contexto, { moduloId, aulaId }) {
  if (aulaId) {
    const aula = await obterAulaVisivel(aulaId, usuarioId, contexto, { exigirDesbloqueada: false });
    if (moduloId && Number(aula.modulo_id) !== Number(moduloId)) throw erro("A aula não pertence ao módulo informado");
    return { moduloId: aula.modulo_id, aulaId: aula.id, aula };
  }
  if (moduloId) {
    const modulos = await listarModulosVisiveis(contexto, { incluirAulas: false });
    if (!modulos.some((modulo) => Number(modulo.id) === Number(moduloId))) throw erro("Módulo indisponível neste curso", 403);
  }
  return { moduloId: moduloId || null, aulaId: null, aula: null };
}

async function criarFlashcard(usuarioId, contexto, dados) {
  const frente = String(dados.frente || "").trim();
  const verso = String(dados.verso || "").trim();
  if (frente.length < 3 || verso.length < 3) throw erro("Preencha frente e verso do flashcard");
  if (frente.length > 2000 || verso.length > 6000) throw erro("O conteúdo do flashcard excede o limite permitido");
  const escopo = await validarEscopoFlashcard(usuarioId, contexto, dados);
  const card = await Flashcard.create({
    usuario_id: usuarioId,
    ...contextoWhere(contexto),
    modulo_id: escopo.moduloId,
    aula_id: escopo.aulaId,
    frente,
    verso,
    origem: "manual",
  });
  return dtoFlashcard(card);
}

function limparHtml(texto) {
  return String(texto || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function fallbackFlashcards(aula, quantidade) {
  const fonte = limparHtml(aula.resumo_texto || aula.transcricao_texto);
  const frases = fonte.split(/(?<=[.!?])\s+/).filter((frase) => frase.length >= 30).slice(0, quantidade);
  return frases.map((frase, indice) => ({
    frente: `Qual é o ponto ${indice + 1} que você precisa lembrar de “${aula.titulo}”?`,
    verso: frase,
  }));
}

async function gerarFlashcardsDaAula(usuarioId, contexto, aulaId, quantidade = 6) {
  const escopo = await validarEscopoFlashcard(usuarioId, contexto, { aulaId });
  const aula = escopo.aula;
  const trilhasDoModulo = aula.modulo?.trilhas || [];
  const trilhaIdDoCard = trilhasDoModulo.length === 1 ? trilhasDoModulo[0].id : null;
  const escopoDosCards = escopoFlashcardsWhere(contexto);
  const limite = Math.max(3, Math.min(10, Math.round(Number(quantidade) || 6)));
  const existentes = await Flashcard.findAll({
    where: { usuario_id: usuarioId, ...escopoDosCards, aula_id: aula.id, origem: "aula", ativo: true },
    order: [["created_at", "ASC"]],
  });
  if (existentes.length > 0) return { flashcards: existentes.map(dtoFlashcard), existentes: true, geradosPorIa: false };

  let gerados = [];
  let geradosPorIa = false;
  try {
    gerados = await gerarFlashcardsComIa({
      titulo: aula.titulo,
      resumo: limparHtml(aula.resumo_texto),
      transcricao: aula.transcricao_texto,
      quantidade: limite,
    });
    geradosPorIa = gerados.length > 0;
  } catch (e) {
    gerados = fallbackFlashcards(aula, limite);
  }
  if (gerados.length === 0) throw erro("A aula ainda não possui texto suficiente para gerar flashcards", 422);

  await Flashcard.bulkCreate(gerados.slice(0, limite).map((card, indice) => ({
    usuario_id: usuarioId,
    agencia_id: contexto.agenciaId,
    trilha_id: trilhaIdDoCard,
    modulo_id: aula.modulo_id,
    aula_id: aula.id,
    frente: card.frente,
    verso: card.verso,
    origem: "aula",
    chave_origem: `aula:${aula.id}:${indice + 1}`,
  })), { ignoreDuplicates: true });
  const criados = await Flashcard.findAll({
    where: { usuario_id: usuarioId, ...escopoDosCards, aula_id: aula.id, origem: "aula", ativo: true },
    order: [["created_at", "ASC"]],
  });
  return { flashcards: criados.map(dtoFlashcard), existentes: false, geradosPorIa };
}

async function gerarFlashcardsDosErros(usuarioId, contexto, quantidade = 10) {
  const limite = Math.max(1, Math.min(20, Math.round(Number(quantidade) || 10)));
  const registros = (await errosVisiveis(usuarioId, contexto)).slice(0, limite);
  if (registros.length === 0) return { flashcards: [], criados: 0 };
  await Flashcard.bulkCreate(registros.map((registro) => ({
    usuario_id: usuarioId,
    ...contextoWhere(contexto),
    modulo_id: registro.questao?.aula?.modulo_id || registro.questao?.modulo_id || null,
    aula_id: registro.questao?.aula_id || null,
    frente: registro.questao.enunciado,
    verso: registro.questao.justificativa_erro || "Revise a alternativa correta e explique por que as demais não se aplicam.",
    origem: "erro",
    chave_origem: `erro:${registro.questao_id}`,
  })), { ignoreDuplicates: true });
  const cards = await Flashcard.findAll({
    where: {
      usuario_id: usuarioId,
      ...escopoFlashcardsWhere(contexto),
      chave_origem: registros.map((registro) => `erro:${registro.questao_id}`),
      ativo: true,
    },
    order: [["created_at", "ASC"]],
  });
  return { flashcards: cards.map(dtoFlashcard), criados: cards.length };
}

async function atualizarFlashcard(usuarioId, contexto, id, dados) {
  const card = await Flashcard.findOne({ where: { id, usuario_id: usuarioId, ...escopoFlashcardsWhere(contexto) } });
  if (!card) throw erro("Flashcard não encontrado neste curso", 404);
  const frente = dados.frente === undefined ? card.frente : String(dados.frente).trim();
  const verso = dados.verso === undefined ? card.verso : String(dados.verso).trim();
  if (frente.length < 3 || verso.length < 3) throw erro("Preencha frente e verso do flashcard");
  await card.update({ frente, verso, ...(dados.ativo !== undefined && { ativo: Boolean(dados.ativo) }) });
  return dtoFlashcard(card);
}

function calcularRevisao(card, avaliacao) {
  const anterior = Number(card.intervalo_dias) || 0;
  let repeticoes = Number(card.repeticoes) || 0;
  let facilidade = Number(card.fator_facilidade) || 2.5;
  let intervalo;
  if (avaliacao === "errei") {
    repeticoes = 0;
    intervalo = 1;
    facilidade = Math.max(1.3, facilidade - 0.2);
  } else if (avaliacao === "dificil") {
    repeticoes += 1;
    intervalo = Math.max(1, Math.ceil((anterior || 1) * 1.2));
    facilidade = Math.max(1.3, facilidade - 0.15);
  } else if (avaliacao === "facil") {
    repeticoes += 1;
    intervalo = anterior === 0 ? 4 : Math.max(4, Math.ceil(anterior * facilidade * 1.3));
    facilidade = Math.min(3.2, facilidade + 0.15);
  } else {
    repeticoes += 1;
    intervalo = repeticoes === 1 ? 1 : repeticoes === 2 ? 6 : Math.max(2, Math.ceil(anterior * facilidade));
  }
  return { anterior, repeticoes, facilidade: Number(facilidade.toFixed(2)), intervalo: Math.min(365, intervalo) };
}

async function revisarFlashcard(usuarioId, contexto, id, avaliacao) {
  if (!AVALIACOES.has(avaliacao)) throw erro("Avaliação do flashcard inválida");
  return sequelize.transaction(async (transaction) => {
    const card = await Flashcard.findOne({
      where: { id, usuario_id: usuarioId, ...escopoFlashcardsWhere(contexto), ativo: true },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!card) throw erro("Flashcard não encontrado neste curso", 404);
    const calculo = calcularRevisao(card, avaliacao);
    const agora = new Date();
    const proxima = new Date(agora.getTime() + calculo.intervalo * UM_DIA_MS);
    await card.update({
      repeticoes: calculo.repeticoes,
      intervalo_dias: calculo.intervalo,
      fator_facilidade: calculo.facilidade,
      proxima_revisao_em: proxima,
      revisado_em: agora,
    }, { transaction });
    await RevisaoFlashcard.create({
      usuario_id: usuarioId,
      flashcard_id: card.id,
      avaliacao,
      intervalo_anterior_dias: calculo.anterior,
      intervalo_novo_dias: calculo.intervalo,
    }, { transaction });
    return dtoFlashcard(card);
  });
}

async function obterMapaEdital(usuarioId, contexto) {
  await garantirProgressoInicial(usuarioId, contexto);
  const [modulos, progressos, errosAbertos, todosErros] = await Promise.all([
    listarModulosVisiveis(contexto),
    ProgressoUsuario.findAll({ where: { usuario_id: usuarioId } }),
    errosVisiveis(usuarioId, contexto),
    HistoricoErro.findAll({ where: { usuario_id: usuarioId }, include: [{ model: Questao, as: "questao" }] }),
  ]);
  const statusPorAula = new Map(progressos.map((p) => [Number(p.aula_id), p.status]));
  const idsModulos = new Set(modulos.map((m) => Number(m.id)));
  const errosValidos = todosErros.filter((item) => idsModulos.has(Number(item.questao?.modulo_id)) || item.questao?.aula_id);
  const pesoTotal = modulos.reduce((soma, modulo) => soma + Number(modulo.peso_edital || 1), 0) || 1;
  const resultado = [];

  for (const modulo of modulos) {
    const aulasIds = modulo.aulas.map((aula) => Number(aula.id));
    const questoes = await Questao.findAll({
      where: { origem: { [Op.in]: ["estudo", "banco_questoes", "ia_gerada"] }, [Op.or]: [{ modulo_id: modulo.id }, { aula_id: aulasIds }] },
      attributes: ["id"],
    });
    const questoesIds = questoes.map((q) => Number(q.id));
    const acertos = questoesIds.length
      ? await RespostaQuestaoObjetiva.count({ where: { usuario_id: usuarioId, questao_id: questoesIds } })
      : 0;
    const errosModulo = errosValidos.filter((item) => questoesIds.includes(Number(item.questao_id))).length;
    const errosPendentes = errosAbertos.filter((item) => aulasIds.includes(Number(item.questao?.aula_id))).length;
    const concluidas = modulo.aulas.filter((aula) => statusPorAula.get(Number(aula.id)) === "concluido").length;
    const emAndamento = modulo.aulas.some((aula) => statusPorAula.get(Number(aula.id)) === "em_andamento");
    const total = modulo.aulas.length;
    const desempenho = acertos + errosModulo > 0 ? Math.round((acertos / (acertos + errosModulo)) * 100) : null;
    const status = total > 0 && concluidas === total
      ? "concluido"
      : errosPendentes >= 2 || (desempenho !== null && desempenho < 60)
        ? "fraco"
        : errosPendentes > 0
          ? "revisao_pendente"
          : emAndamento || concluidas > 0
            ? "em_andamento"
            : "nao_iniciado";
    resultado.push({
      id: modulo.id,
      titulo: modulo.titulo,
      corDestaque: modulo.cor_destaque,
      peso: Number(modulo.peso_edital || 1),
      pesoPercentual: Math.round((Number(modulo.peso_edital || 1) / pesoTotal) * 100),
      status,
      totalAulas: total,
      aulasConcluidas: concluidas,
      progressoPercentual: total ? Math.round((concluidas / total) * 100) : 0,
      desempenhoPercentual: desempenho,
      revisoesPendentes: errosPendentes,
      totalQuestoes: questoesIds.length,
      aulas: modulo.aulas.map((aula) => ({
        id: aula.id,
        titulo: aula.titulo,
        status: statusPorAula.get(Number(aula.id)) || "bloqueado",
      })),
    });
  }
  const totalAulas = resultado.reduce((soma, modulo) => soma + modulo.totalAulas, 0);
  const concluidas = resultado.reduce((soma, modulo) => soma + modulo.aulasConcluidas, 0);
  return {
    agencia: contexto.agencia?.nome,
    trilha: contexto.trilha?.nome,
    progressoGeral: totalAulas ? Math.round((concluidas / totalAulas) * 100) : 0,
    totalAulas,
    aulasConcluidas: concluidas,
    modulos: resultado,
  };
}

async function obterEvolucao(usuarioId, contexto, dias = 30) {
  const periodo = Math.max(7, Math.min(90, Math.round(Number(dias) || 30)));
  const { inicio: hojeInicio } = limitesDoDia();
  const desde = new Date(hojeInicio.getTime() - (periodo - 1) * UM_DIA_MS);
  const escopo = { usuario_id: usuarioId, ...contextoWhere(contexto) };
  const [sessoes, respostas, revisoes, progressos, simulados, itensPlano, usuario, flashcardsVencidos] = await Promise.all([
    SessaoEstudo.findAll({ where: { ...escopo, created_at: { [Op.gte]: desde } } }),
    RespostaQuestaoObjetiva.findAll({ where: { usuario_id: usuarioId, created_at: { [Op.gte]: desde } } }),
    RevisaoFlashcard.findAll({ where: { usuario_id: usuarioId, created_at: { [Op.gte]: desde } } }),
    ProgressoUsuario.findAll({ where: { usuario_id: usuarioId, status: "concluido", updated_at: { [Op.gte]: desde } } }),
    Simulado.findAll({ where: { ...escopo, concluido_em: { [Op.gte]: desde } } }),
    ItemPlanoDiario.findAll({ where: { ...escopo, data: { [Op.gte]: dataISO(desde) } } }),
    Usuario.findByPk(usuarioId),
    Flashcard.count({
      where: {
        usuario_id: usuarioId,
        ...escopoFlashcardsWhere(contexto),
        ativo: true,
        proxima_revisao_em: { [Op.lte]: new Date() },
      },
    }),
  ]);
  const serie = [];
  for (let indice = 0; indice < periodo; indice += 1) {
    const data = new Date(desde.getTime() + indice * UM_DIA_MS);
    serie.push({ data: dataISO(data), minutos: 0, questoes: 0, flashcards: 0, aulas: 0 });
  }
  const porData = new Map(serie.map((item) => [item.data, item]));
  for (const sessao of sessoes) {
    const item = porData.get(dataISO(new Date(sessao.createdAt)));
    if (item) item.minutos += Math.round((sessao.tempo_efetivo_segundos || 0) / 60);
  }
  for (const resposta of respostas) {
    const item = porData.get(dataISO(new Date(resposta.createdAt)));
    if (item) item.questoes += 1;
  }
  for (const revisao of revisoes) {
    const item = porData.get(dataISO(new Date(revisao.createdAt)));
    if (item) item.flashcards += 1;
  }
  for (const progresso of progressos) {
    const item = porData.get(dataISO(new Date(progresso.updatedAt)));
    if (item) item.aulas += 1;
  }
  const planoValidos = itensPlano.filter((item) => item.status !== "ignorado");
  const aderencia = planoValidos.length
    ? Math.round((planoValidos.filter((item) => item.status === "concluido").length / planoValidos.length) * 100)
    : 0;
  const minutosTotal = serie.reduce((soma, item) => soma + item.minutos, 0);
  return {
    periodoDias: periodo,
    serie,
    resumo: {
      minutosEstudados: minutosTotal,
      horasEstudadas: Number((minutosTotal / 60).toFixed(1)),
      questoesRespondidas: respostas.length,
      flashcardsRevisados: revisoes.length,
      aulasConcluidas: progressos.length,
      simuladosConcluidos: simulados.length,
      aderenciaPlanoPercentual: aderencia,
      sequenciaAtual: usuario.sequencia_atual,
      revisoesPendentes: flashcardsVencidos,
    },
  };
}

module.exports = {
  obterPlanoHoje,
  atualizarItemPlano,
  obterPreferencias,
  atualizarPreferencias,
  listarFlashcards,
  criarFlashcard,
  gerarFlashcardsDaAula,
  gerarFlashcardsDosErros,
  atualizarFlashcard,
  revisarFlashcard,
  calcularRevisao,
  obterMapaEdital,
  obterEvolucao,
};
