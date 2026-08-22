const { Op } = require("sequelize");
const { sequelize } = require("../../../config/configDB");
const Modulo = require("../models/modulo.model");
const Aula = require("../models/aula.model");
const Questao = require("../models/questao.model");
const QuestaoDiscursiva = require("../models/questaoDiscursiva.model");
const RespostaDiscursiva = require("../models/respostaDiscursiva.model");
const ProgressoUsuario = require("../../progresso/models/progressoUsuario.model");
const HistoricoErro = require("../../progresso/models/historicoErro.model");
const Usuario = require("../../autenticacao/models/usuario.model");
const { garantirProgressoInicial } = require("../../progresso/services/gamificacao.service");
const { registrarAtividadeDiaria, hojeISO } = require("../../progresso/services/streak.service");
const {
  registrarRespostaQuestao,
  registrarRespostaDiscursiva,
  registrarSimuladoCompleto,
} = require("../../progresso/services/missao.service");
const { avaliarRespostaDiscursiva, gerarMensagemDoDia } = require("../../ia/services/gemini.service");
const Simulado = require("../models/simulado.model");
const RespostaQuestaoObjetiva = require("../../progresso/models/respostaQuestaoObjetiva.model");
const RelatorioErro = require("../../progresso/models/relatorioErro.model");
const AnexoAula = require("../models/anexoAula.model");
const {
  moduloVisivel,
  incluirTrilhas,
  listarModulosVisiveis,
  obterModuloVisivel,
  obterAulaVisivel,
  obterDiscursivaAcessivel,
} = require("./acessoConteudo.service");
const { montarPlanoAula } = require("./sessaoEstudo.service");
const {
  garantirMapaMentalBasico,
  aprimorarMapaMental: aprimorarMapaMentalDaAula,
} = require("./mapaMental.service");

const RÓTULO_CARGO = {
  agente: "Agente de Polícia Civil",
  escrivao: "Escrivão de Polícia Civil",
  delegado: "Delegado de Polícia Civil",
};

function periodoDoDia() {
  const hora = new Date().getHours();
  if (hora < 12) return "manhã";
  if (hora < 18) return "tarde";
  return "noite";
}

async function listarModulosComProgresso(usuarioId, contexto) {
  await garantirProgressoInicial(usuarioId, contexto);
  const modulos = await listarModulosVisiveis(contexto);

  const progressos = await ProgressoUsuario.findAll({ where: { usuario_id: usuarioId } });
  const statusPorAula = new Map(progressos.map((p) => [p.aula_id, p.status]));

  return modulos.map((modulo) => ({
    id: modulo.id,
    titulo: modulo.titulo,
    corDestaque: modulo.cor_destaque,
    ordem: modulo.ordem,
    aulas: modulo.aulas.map((aula) => ({
      id: aula.id,
      titulo: aula.titulo,
      ordem: aula.ordem,
      status: statusPorAula.get(aula.id) || "bloqueado",
    })),
  }));
}

async function obterAula(aulaId, usuarioId, contexto) {
  await garantirProgressoInicial(usuarioId, contexto);
  const aula = await Aula.findByPk(aulaId, {
    include: [
      { model: Modulo, as: "modulo", include: [incluirTrilhas] },
      { model: Questao, as: "questoes", where: { origem: "estudo" }, required: false },
      { model: QuestaoDiscursiva, as: "discursivas" },
      { model: AnexoAula, as: "anexos" },
    ],
  });

  if (!aula || !moduloVisivel(aula.modulo, contexto)) {
    const erro = new Error("Aula não disponível para a agência e trilha ativas");
    erro.status = 403;
    throw erro;
  }

  const progresso = await ProgressoUsuario.findOne({ where: { usuario_id: usuarioId, aula_id: aulaId } });
  const status = progresso?.status || "bloqueado";

  if (status === "bloqueado") {
    return { bloqueada: true, titulo: aula.titulo, moduloTitulo: aula.modulo.titulo };
  }

  await registrarAtividadeDiaria(usuarioId);
  const planoEstudo = await montarPlanoAula(aula, contexto);
  const mapaMental = await garantirMapaMentalBasico(aula);

  const respostasAnteriores = await RespostaDiscursiva.findAll({
    where: {
      usuario_id: usuarioId,
      questao_discursiva_id: aula.discursivas.map((d) => d.id),
    },
    order: [["created_at", "DESC"]],
  });
  const ultimaRespostaPorQuestao = new Map();
  for (const resposta of respostasAnteriores) {
    if (!ultimaRespostaPorQuestao.has(resposta.questao_discursiva_id)) {
      ultimaRespostaPorQuestao.set(resposta.questao_discursiva_id, resposta);
    }
  }

  return {
    bloqueada: false,
    concluida: status === "concluido",
    id: aula.id,
    titulo: aula.titulo,
    moduloTitulo: aula.modulo.titulo,
    youtubeIframeUrl: aula.youtube_iframe_url,
    tipoConteudo: aula.tipo_conteudo,
    provedorExterno: aula.provedor_externo,
    urlExterna: aula.url_externa,
    duracaoVideoSegundos: aula.duracao_video_segundos,
    duracaoVideoFonte: aula.duracao_video_fonte,
    planoEstudo,
    resumoTexto: aula.resumo_texto,
    transcricaoTexto: aula.transcricao_texto,
    guiaEstudo: aula.guia_estudo,
    mapaMental,
    anexos: aula.anexos.map((anexo) => ({
      id: anexo.id,
      nome: anexo.nome_exibicao,
      url: anexo.caminho_arquivo || anexo.url_externa,
      mimeType: anexo.mime_type,
      tamanhoBytes: anexo.tamanho_bytes ? Number(anexo.tamanho_bytes) : null,
      origem: anexo.origem,
    })),
    questoes: aula.questoes.map((questao) => ({
      id: questao.id,
      enunciado: questao.enunciado,
      alternativas: {
        a: questao.alternativa_a,
        b: questao.alternativa_b,
        c: questao.alternativa_c,
        d: questao.alternativa_d,
        e: questao.alternativa_e,
      },
    })),
    discursivas: aula.discursivas.map((discursiva) => {
      const ultima = ultimaRespostaPorQuestao.get(discursiva.id);
      return {
        id: discursiva.id,
        enunciado: discursiva.enunciado,
        respostaAnterior: ultima
          ? {
              respostaTexto: ultima.resposta_texto,
              pontosAtendidos: ultima.pontos_atendidos,
              pontosIncorretos: ultima.pontos_incorretos,
              pontosFaltando: ultima.pontos_faltando,
              parecer: ultima.parecer,
            }
          : null,
      };
    }),
  };
}

async function aprimorarMapaMental(aulaId, usuarioId, contexto) {
  return aprimorarMapaMentalDaAula({ aulaId, usuarioId, contexto });
}

async function responderDiscursiva(usuarioId, questaoDiscursivaId, respostaTexto, contexto) {
  const questao = await obterDiscursivaAcessivel(questaoDiscursivaId, usuarioId, contexto);

  const avaliacao = await avaliarRespostaDiscursiva({
    enunciado: questao.enunciado,
    criterios: questao.criterios_avaliacao,
    respostaTexto,
  });

  const registro = await sequelize.transaction(async (transaction) => {
    await registrarAtividadeDiaria(usuarioId, { transaction });
    const criado = await RespostaDiscursiva.create({
      usuario_id: usuarioId,
      questao_discursiva_id: questaoDiscursivaId,
      resposta_texto: respostaTexto,
      pontos_atendidos: avaliacao.pontosAtendidos,
      pontos_incorretos: avaliacao.pontosIncorretos,
      pontos_faltando: avaliacao.pontosFaltando,
      parecer: avaliacao.parecer,
    }, { transaction });
    await registrarRespostaDiscursiva(usuarioId, criado.id, transaction);
    return criado;
  });

  return {
    respostaTexto: registro.resposta_texto,
    pontosAtendidos: registro.pontos_atendidos,
    pontosIncorretos: registro.pontos_incorretos,
    pontosFaltando: registro.pontos_faltando,
    parecer: registro.parecer,
  };
}

async function listarRevisaoObrigatoria(usuarioId, contexto) {
  const erros = await HistoricoErro.findAll({
    where: { usuario_id: usuarioId, resolvido: false },
    include: [
      {
        model: Questao,
        as: "questao",
        include: [{ model: Aula, as: "aula", include: [{ model: Modulo, as: "modulo", include: [incluirTrilhas] }] }],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return erros.filter((erro) => erro.questao?.aula && moduloVisivel(erro.questao.aula.modulo, contexto)).map((erro) => ({
    id: erro.id,
    questaoId: erro.questao.id,
    enunciado: erro.questao.enunciado,
    aulaId: erro.questao.aula.id,
    aulaTitulo: erro.questao.aula.titulo,
    disponivelEm: erro.disponivel_em,
    liberada: !erro.disponivel_em || erro.disponivel_em <= new Date(),
    tentativas: erro.tentativas,
  }));
}

const ORIGENS_BANCO = ["estudo", "banco_questoes", "ia_gerada"];

async function listarModulosComQuestoesBanco(contexto) {
  const modulos = await listarModulosVisiveis(contexto, { incluirAulas: false });
  const contagens = await Questao.findAll({
    where: { modulo_id: modulos.map((modulo) => modulo.id), origem: { [Op.in]: ORIGENS_BANCO } },
    attributes: ["modulo_id", [sequelize.fn("COUNT", sequelize.col("id")), "total"]],
    group: ["modulo_id"],
    raw: true,
  });
  const porModulo = new Map(contagens.map((item) => [Number(item.modulo_id), Number(item.total)]));
  return modulos
    .filter((modulo) => porModulo.has(modulo.id))
    .map((modulo) => ({
      id: modulo.id,
      titulo: modulo.titulo,
      corDestaque: modulo.cor_destaque,
      totalQuestoes: porModulo.get(modulo.id),
    }));
}

async function listarBancoQuestoes(usuarioId, contexto, filtros) {
  const { moduloId, banca, ano } = filtros;
  const pagina = Math.max(1, Number(filtros.pagina) || 1);
  const limite = Math.min(50, Math.max(1, Number(filtros.limite) || 20));
  const modulos = await listarModulosVisiveis(contexto, { incluirAulas: false });
  const moduloIdsVisiveis = modulos.map((modulo) => modulo.id);
  if (moduloId && !moduloIdsVisiveis.includes(Number(moduloId))) {
    const erro = new Error("Módulo não disponível para a agência e trilha ativas");
    erro.status = 403;
    throw erro;
  }

  const ondeQuestao = {
    origem: { [Op.in]: ORIGENS_BANCO },
    modulo_id: moduloId ? Number(moduloId) : moduloIdsVisiveis,
  };
  if (banca) ondeQuestao.banca = banca;
  if (ano) ondeQuestao.ano = Number(ano);

  // Prioriza questões que o usuário ainda não acertou — quem já respondeu certo aparece só depois,
  // pra sempre entregar o que falta primeiro, mas sem esconder pra sempre (útil pra revisão).
  const jaRespondidaCorretamente = sequelize.literal(
    `EXISTS (SELECT 1 FROM respostas_questoes_objetivas rqo WHERE rqo.questao_id = "Questao"."id" AND rqo.usuario_id = ${Number(usuarioId)})`,
  );

  const { rows: questoes, count: total } = await Questao.findAndCountAll({
    where: ondeQuestao,
    include: [
      { model: Modulo, as: "modulo", attributes: ["id", "titulo", "cor_destaque", "agencia_id"] },
      { model: Aula, as: "aula", attributes: ["titulo"], required: false },
    ],
    order: [[jaRespondidaCorretamente, "ASC"], ["ano", "DESC"], ["numero_original", "ASC"]],
    limit: limite,
    offset: (pagina - 1) * limite,
    distinct: true,
  });

  const idsRespondidos = await RespostaQuestaoObjetiva.findAll({
    where: { usuario_id: usuarioId, questao_id: questoes.map((questao) => questao.id) },
    attributes: ["questao_id"],
  }).then((linhas) => new Set(linhas.map((linha) => linha.questao_id)));

  return {
    questoes: questoes.map((questao) => ({
      id: questao.id,
      moduloId: questao.modulo.id,
      moduloTitulo: questao.modulo.titulo,
      corDestaque: questao.modulo.cor_destaque,
      enunciado: questao.enunciado,
      alternativaA: questao.alternativa_a,
      alternativaB: questao.alternativa_b,
      alternativaC: questao.alternativa_c,
      alternativaD: questao.alternativa_d,
      alternativaE: questao.alternativa_e,
      banca: questao.banca,
      ano: questao.ano,
      prova: questao.prova,
      numeroOriginal: questao.numero_original,
      origem: questao.origem,
      aulaTitulo: questao.aula?.titulo || null,
      respondidaCorretamente: idsRespondidos.has(questao.id),
    })),
    paginacao: { pagina, limite, total, totalPaginas: Math.ceil(total / limite) },
  };
}

async function responderQuestaoBanco(usuarioId, questaoId, alternativa, contexto) {
  const questao = await Questao.findOne({
    where: { id: questaoId, origem: { [Op.in]: ORIGENS_BANCO } },
    include: [{ model: Modulo, as: "modulo", include: [incluirTrilhas] }],
  });
  if (!questao || !moduloVisivel(questao.modulo, contexto)) {
    const erro = new Error("Questão não disponível para a agência e trilha ativas");
    erro.status = 403;
    throw erro;
  }

  const correta = questao.alternativa_correta === alternativa;

  await sequelize.transaction(async (transaction) => {
    await registrarAtividadeDiaria(usuarioId, { transaction });
    await registrarRespostaQuestao(usuarioId, questao.id, transaction);
    if (correta) {
      await RespostaQuestaoObjetiva.findOrCreate({
        where: { usuario_id: usuarioId, questao_id: questao.id },
        transaction,
      });
    }
  });

  return {
    correta,
    alternativaCorreta: questao.alternativa_correta,
    justificativa: questao.justificativa_erro,
  };
}

async function reportarErroAula(usuarioId, aulaId, descricao, contexto) {
  const textoDescricao = (descricao || "").trim();
  if (!textoDescricao) {
    const erro = new Error("Descreva o problema encontrado antes de enviar");
    erro.status = 400;
    throw erro;
  }

  const aula = await obterAulaVisivel(aulaId, usuarioId, contexto, { exigirDesbloqueada: false });

  const relatorio = await RelatorioErro.create({
    usuario_id: usuarioId,
    aula_id: aula.id,
    descricao: textoDescricao,
  });

  return { id: relatorio.id, status: relatorio.status };
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const LIMITE_SIMULADO_COMPLETO = 50;
const LIMITE_SIMULADO_REVISAO = 30;

async function gerarSimulado(usuarioId, contexto, { modo, moduloId }) {
  let questoes = [];
  const modulosVisiveis =
    modo === "modulo"
      ? [await obterModuloVisivel(moduloId, contexto)]
      : await listarModulosVisiveis(contexto);
  const aulaIdsVisiveis = modulosVisiveis.flatMap((modulo) => modulo.aulas.map((aula) => aula.id));

  if (modo === "progresso") {
    const progressos = await ProgressoUsuario.findAll({
      where: { usuario_id: usuarioId, status: "concluido", aula_id: aulaIdsVisiveis },
    });
    const aulaIds = progressos.map((p) => p.aula_id);
    if (aulaIds.length === 0) return { modo, questoes: [] };

    questoes = await Questao.findAll({
      where: { aula_id: aulaIds, origem: "estudo" },
      include: [
        {
          model: Aula,
          as: "aula",
          attributes: ["titulo"],
          include: [{ model: Modulo, as: "modulo", attributes: ["titulo"] }],
        },
      ],
    });
  } else if (modo === "revisao") {
    // Modo revisão: prioriza questões já erradas (histórico de erro não resolvido) e completa
    // com questões ainda não acertadas dentro das aulas já concluídas — nada de conteúdo novo.
    const erros = await HistoricoErro.findAll({
      where: { usuario_id: usuarioId, resolvido: false },
      include: [
        {
          model: Questao,
          as: "questao",
          include: [{ model: Aula, as: "aula", include: [{ model: Modulo, as: "modulo", include: [incluirTrilhas] }] }],
        },
      ],
    });
    const questoesErradas = erros
      .filter((erro) => erro.questao?.aula && moduloVisivel(erro.questao.aula.modulo, contexto))
      .map((erro) => erro.questao);
    const idsJaIncluidos = new Set(questoesErradas.map((q) => q.id));

    const aulaIdsConcluidas = (
      await ProgressoUsuario.findAll({
        where: { usuario_id: usuarioId, status: "concluido", aula_id: aulaIdsVisiveis },
      })
    ).map((p) => p.aula_id);

    const idsRespondidos = await RespostaQuestaoObjetiva.findAll({
      where: { usuario_id: usuarioId },
      attributes: ["questao_id"],
    }).then((linhas) => new Set(linhas.map((linha) => linha.questao_id)));

    const questoesRevisao = aulaIdsConcluidas.length
      ? await Questao.findAll({
          where: { aula_id: aulaIdsConcluidas, origem: "estudo", id: { [Op.notIn]: [...idsJaIncluidos] } },
          include: [
            {
              model: Aula,
              as: "aula",
              attributes: ["titulo"],
              include: [{ model: Modulo, as: "modulo", attributes: ["titulo"] }],
            },
          ],
        }).then((lista) => lista.filter((q) => !idsRespondidos.has(q.id)))
      : [];

    if (questoesErradas.length === 0 && questoesRevisao.length === 0) return { modo, questoes: [] };

    questoes = [...embaralhar(questoesErradas), ...embaralhar(questoesRevisao)].slice(0, LIMITE_SIMULADO_REVISAO);
  } else {
    const aulaIds = modulosVisiveis.flatMap((m) => m.aulas.map((a) => a.id));
    const moduloIds = modulosVisiveis.map((m) => m.id);
    if (aulaIds.length === 0 && moduloIds.length === 0) return { modo, questoes: [] };

    // O simulado ("completo" ou "por módulo") combina questões das aulas com o Banco de Questões
    const [questoesAula, questoesBanco] = await Promise.all([
      aulaIds.length
        ? Questao.findAll({
            where: { aula_id: aulaIds, origem: "estudo" },
            include: [
              {
                model: Aula,
                as: "aula",
                attributes: ["titulo"],
                include: [{ model: Modulo, as: "modulo", attributes: ["titulo"] }],
              },
            ],
          })
        : [],
      moduloIds.length
        ? Questao.findAll({
            where: { modulo_id: moduloIds, origem: { [Op.in]: ["banco_questoes", "ia_gerada"] } },
            include: [{ model: Modulo, as: "modulo", attributes: ["titulo"] }],
          })
        : [],
    ]);
    questoes = [...questoesAula, ...questoesBanco];
  }

  let selecionadas = embaralhar(questoes);
  if (modo === "completo" && selecionadas.length > LIMITE_SIMULADO_COMPLETO) {
    // Ao cortar pro limite, prioriza questões ainda não acertadas pelo usuário —
    // mantém o mesmo espírito do Banco de Questões (não esconde as já feitas, só dá menos peso).
    const idsRespondidos = await RespostaQuestaoObjetiva.findAll({
      where: { usuario_id: usuarioId, questao_id: selecionadas.map((q) => q.id) },
      attributes: ["questao_id"],
    }).then((linhas) => new Set(linhas.map((linha) => linha.questao_id)));
    const naoRespondidas = selecionadas.filter((q) => !idsRespondidos.has(q.id));
    const jaRespondidas = selecionadas.filter((q) => idsRespondidos.has(q.id));
    selecionadas = [...naoRespondidas, ...jaRespondidas].slice(0, LIMITE_SIMULADO_COMPLETO);
  }

  const itens = selecionadas.map((q) => ({
    id: q.id,
    enunciado: q.enunciado,
    moduloTitulo: q.aula ? q.aula.modulo.titulo : q.modulo.titulo,
    alternativas: {
      a: q.alternativa_a,
      b: q.alternativa_b,
      c: q.alternativa_c,
      d: q.alternativa_d,
      e: q.alternativa_e,
    },
  }));
  if (itens.length === 0) return { modo, simuladoId: null, questoes: [] };

  const simulado = await Simulado.create({
    usuario_id: usuarioId,
    agencia_id: contexto.agenciaId,
    trilha_id: contexto.trilhaId,
    modo,
    questao_ids: itens.map((item) => item.id),
    expira_em: new Date(Date.now() + 4 * 60 * 60 * 1000),
  });

  return {
    modo,
    simuladoId: simulado.id,
    questoes: itens,
  };
}

async function corrigirSimulado(usuarioId, simuladoId, respostas, contexto) {
  return sequelize.transaction(async (transaction) => {
    const simulado = await Simulado.findOne({
      where: { id: simuladoId, usuario_id: usuarioId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!simulado) {
      const erro = new Error("Simulado não encontrado");
      erro.status = 404;
      throw erro;
    }
    if (simulado.concluido_em) {
      const erro = new Error("Este simulado já foi corrigido");
      erro.status = 409;
      throw erro;
    }
    if (simulado.expira_em < new Date()) {
      const erro = new Error("Este simulado expirou. Gere um novo.");
      erro.status = 410;
      throw erro;
    }
    if (
      Number(simulado.agencia_id) !== Number(contexto.agenciaId) ||
      Number(simulado.trilha_id || 0) !== Number(contexto.trilhaId || 0)
    ) {
      const erro = new Error("Ative a agência e a trilha usadas para gerar este simulado");
      erro.status = 409;
      throw erro;
    }

    const esperados = simulado.questao_ids.map(Number);
    const ids = respostas.map((item) => Number(item.questaoId));
    const idsUnicos = new Set(ids);
    const alternativasValidas = respostas.every((item) => ["a", "b", "c", "d", "e"].includes(item.alternativa));
    const conjuntoValido =
      ids.length === esperados.length &&
      idsUnicos.size === ids.length &&
      alternativasValidas &&
      esperados.every((id) => idsUnicos.has(id));
    if (!conjuntoValido) {
      const erro = new Error("As respostas não correspondem ao simulado gerado");
      erro.status = 400;
      throw erro;
    }

    const questoes = await Questao.findAll({ where: { id: esperados }, transaction });
    if (questoes.length !== esperados.length) {
      const erro = new Error("O conteúdo do simulado mudou. Gere um novo.");
      erro.status = 409;
      throw erro;
    }
    const mapa = new Map(questoes.map((questao) => [questao.id, questao]));
    let acertos = 0;
    const detalhes = respostas.map((item) => {
      const questao = mapa.get(Number(item.questaoId));
      const correta = questao.alternativa_correta === item.alternativa;
      if (correta) acertos += 1;
      return {
        questaoId: questao.id,
        enunciado: questao.enunciado,
        suaResposta: item.alternativa,
        alternativaCorreta: questao.alternativa_correta,
        correta,
        justificativa: questao.justificativa_erro,
      };
    });

    await registrarAtividadeDiaria(usuarioId, { transaction });
    for (const questaoId of esperados) {
      await registrarRespostaQuestao(usuarioId, questaoId, transaction);
    }
    await registrarSimuladoCompleto(usuarioId, simulado.id, transaction);
    await simulado.update({ concluido_em: new Date() }, { transaction });

    return {
      total: respostas.length,
      acertos,
      percentual: Math.round((acertos / respostas.length) * 100),
      detalhes,
    };
  });
}

async function obterMensagemDoDia(usuarioId, contexto) {
  const usuario = await Usuario.findByPk(usuarioId);
  const hoje = hojeISO();
  const chaveContexto = `${contexto.agenciaId}:${contexto.trilhaId || 0}`;

  if (
    usuario.mensagem_dia_data === hoje &&
    usuario.mensagem_dia_contexto === chaveContexto &&
    usuario.mensagem_dia_texto
  ) {
    return { mensagem: usuario.mensagem_dia_texto, periodo: periodoDoDia() };
  }

  const modulosVisiveis = await listarModulosVisiveis(contexto);
  const aulaIds = modulosVisiveis.flatMap((m) => m.aulas.map((a) => a.id));
  const totalAulas = aulaIds.length;
  const aulasConcluidas = await ProgressoUsuario.count({
    where: { usuario_id: usuarioId, aula_id: aulaIds, status: "concluido" },
  });
  const percentualEdital = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;
  const nivel = Math.floor((usuario.xp || 0) / 100) + 1;

  const mensagem = await gerarMensagemDoDia({
    nome: usuario.nome,
    cargoLabel: contexto.trilha?.nome || "ainda não escolhido",
    xp: usuario.xp,
    nivel,
    sequenciaAtual: usuario.sequencia_atual,
    percentualEdital,
    aulasConcluidas,
    totalAulas,
    periodoDia: periodoDoDia(),
  });

  usuario.mensagem_dia_texto = mensagem;
  usuario.mensagem_dia_data = hoje;
  usuario.mensagem_dia_contexto = chaveContexto;
  await usuario.save();

  return { mensagem, periodo: periodoDoDia() };
}

module.exports = {
  listarModulosComProgresso,
  obterAula,
  aprimorarMapaMental,
  listarRevisaoObrigatoria,
  responderDiscursiva,
  listarModulosComQuestoesBanco,
  listarBancoQuestoes,
  responderQuestaoBanco,
  reportarErroAula,
  gerarSimulado,
  corrigirSimulado,
  obterMensagemDoDia,
};
