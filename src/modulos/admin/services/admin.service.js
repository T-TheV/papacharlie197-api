const Modulo = require("../../estudo/models/modulo.model");
const Aula = require("../../estudo/models/aula.model");
const Questao = require("../../estudo/models/questao.model");
const QuestaoDiscursiva = require("../../estudo/models/questaoDiscursiva.model");
const { gerarQuestoesSimilares, gerarConteudoAulaComTranscricao } = require("../../ia/services/gemini.service");
const {
  buscarTranscricaoBruta,
  formatarTranscricaoAutomatica,
} = require("../../ia/services/youtubeTranscricao.service");
const Agencia = require("../../catalogo/models/agencia.model");
const Trilha = require("../../catalogo/models/trilha.model");
const { sequelize } = require("../../../config/configDB");
const { obterAgenciaPadrao } = require("../../catalogo/services/catalogo.service");
const RelatorioErro = require("../../progresso/models/relatorioErro.model");
const Usuario = require("../../autenticacao/models/usuario.model");
const AnexoAula = require("../../estudo/models/anexoAula.model");
const fs = require("fs/promises");
const path = require("path");
const { normalizarMapaMental, hashConteudoAula } = require("../../estudo/services/mapaMental.util");

function naoEncontrado(entidade) {
  const erro = new Error(`${entidade} não encontrado(a)`);
  erro.status = 404;
  throw erro;
}

async function listarConteudo() {
  return Modulo.findAll({
    include: [
      { model: Agencia, as: "agencia" },
      { model: Trilha, as: "trilhas", through: { attributes: [] }, required: false },
      {
        model: Aula,
        as: "aulas",
        include: [
          { model: Questao, as: "questoes" },
          { model: QuestaoDiscursiva, as: "discursivas" },
          { model: AnexoAula, as: "anexos" },
        ],
      },
    ],
    order: [
      ["ordem", "ASC"],
      [{ model: Aula, as: "aulas" }, "ordem", "ASC"],
    ],
  });
}

function validarUrlExterna(url) {
  if (!url) return;
  try {
    const analisada = new URL(url);
    if (!new Set(["http:", "https:"]).has(analisada.protocol)) throw new Error();
  } catch {
    const erro = new Error("Use uma URL externa HTTP ou HTTPS válida");
    erro.status = 400;
    throw erro;
  }
}

function validarTipoConteudo(tipo) {
  if (!new Set(["youtube", "externo", "material"]).has(tipo)) {
    const erro = new Error("Tipo de conteúdo inválido");
    erro.status = 400;
    throw erro;
  }
}

async function criarModulo(dados, trilhaIds = []) {
  return sequelize.transaction(async (transaction) => {
    if (!dados.agencia_id) {
      const padrao = await obterAgenciaPadrao({ transaction });
      dados.agencia_id = padrao?.id;
    }
    if (!dados.agencia_id) {
      const erro = new Error("Informe a agência do módulo");
      erro.status = 400;
      throw erro;
    }
    const modulo = await Modulo.create(dados, { transaction });
    if (trilhaIds.length) {
      const trilhas = await Trilha.findAll({
        where: { id: trilhaIds, agencia_id: modulo.agencia_id },
        transaction,
      });
      if (trilhas.length !== trilhaIds.length) {
        const erro = new Error("Uma ou mais trilhas não pertencem à agência do módulo");
        erro.status = 400;
        throw erro;
      }
      await modulo.setTrilhas(trilhas, { transaction });
    }
    return modulo;
  });
}

async function atualizarModulo(id, dados, trilhaIds) {
  const modulo = await Modulo.findByPk(id);
  if (!modulo) naoEncontrado("Módulo");
  await sequelize.transaction(async (transaction) => {
    await modulo.update(dados, { transaction });
    if (trilhaIds !== undefined) {
      const trilhas = await Trilha.findAll({
        where: { id: trilhaIds, agencia_id: modulo.agencia_id },
        transaction,
      });
      if (trilhas.length !== trilhaIds.length) {
        const erro = new Error("Uma ou mais trilhas não pertencem à agência do módulo");
        erro.status = 400;
        throw erro;
      }
      await modulo.setTrilhas(trilhas, { transaction });
    }
  });
  return modulo;
}

async function excluirModulo(id) {
  const modulo = await Modulo.findByPk(id);
  if (!modulo) naoEncontrado("Módulo");
  await modulo.destroy();
}

function ehVideoValido(url) {
  return Boolean(url) && !url.includes("PLACEHOLDER_AULA");
}

function validarUrlVideo(url) {
  if (!url) return;
  if (String(url).includes("PLACEHOLDER_AULA")) return;
  try {
    const analisada = new URL(url);
    const hostPermitido = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com"]
      .includes(analisada.hostname);
    if (!hostPermitido || !/^\/embed\/[A-Za-z0-9_-]{6,}$/.test(analisada.pathname)) throw new Error();
  } catch {
    const erro = new Error("Use uma URL de incorporação válida do YouTube");
    erro.status = 400;
    throw erro;
  }
}

// Aulas mais densas (transcrição mais longa) merecem mais de uma questão/discursiva pra exercitar
// conceitos diferentes do vídeo, em vez de uma única pergunta rasa cobrindo um vídeo de 40+ minutos.
function determinarQuantidades(transcricaoBruta) {
  const tamanho = transcricaoBruta.length;
  if (tamanho < 8000) return { questoes: 5, discursivas: 2 };
  if (tamanho < 25000) return { questoes: 6, discursivas: 2 };
  if (tamanho < 60000) return { questoes: 8, discursivas: 3 };
  return { questoes: 10, discursivas: 3 };
}

// Atualiza os registros existentes (na ordem) com os novos dados, preservando os ids que já existiam
// (para não perder histórico de resposta ligado a um questao_id específico), criando os que faltarem
// e apagando o excedente caso a nova quantidade seja menor que a anterior.
async function reconciliarRegistros(Modelo, existentes, novosDados, transaction) {
  const atualizados = [];
  for (let i = 0; i < novosDados.length; i += 1) {
    if (existentes[i]) {
      await existentes[i].update(novosDados[i], { transaction });
      atualizados.push(existentes[i]);
    } else {
      atualizados.push(await Modelo.create(novosDados[i], { transaction }));
    }
  }
  if (existentes.length > novosDados.length) {
    await Modelo.destroy({
      where: { id: existentes.slice(novosDados.length).map((item) => item.id) },
      transaction,
    });
  }
  return atualizados;
}

async function gerarConteudoDoVideo(aula) {
  const transcricaoExistente = aula.transcricao_texto?.trim();
  const transcricaoBruta = transcricaoExistente || await buscarTranscricaoBruta(aula.youtube_iframe_url);
  const transcricaoFormatada = transcricaoExistente || formatarTranscricaoAutomatica(transcricaoBruta);
  if (!transcricaoExistente) {
    await aula.update({
      transcricao_texto: transcricaoFormatada,
      transcricao_gerada_em: new Date(),
    });
  }
  const { questoes: quantidadeQuestoes, discursivas: quantidadeDiscursivas } = determinarQuantidades(transcricaoBruta);
  const { resumo, questoes, discursivas, mapaMental } = await gerarConteudoAulaComTranscricao({
    titulo: aula.titulo,
    transcricaoBruta,
    quantidadeQuestoes,
    quantidadeDiscursivas,
  });

  await sequelize.transaction(async (transaction) => {
    await aula.update({
      transcricao_texto: transcricaoFormatada,
      transcricao_gerada_em: new Date(),
      resumo_texto: resumo,
      mapa_mental: normalizarMapaMental(mapaMental, aula.titulo),
      mapa_mental_fonte: "ia",
      mapa_mental_hash: hashConteudoAula({
        titulo: aula.titulo,
        resumoTexto: resumo,
        transcricaoTexto: transcricaoFormatada,
      }),
      mapa_mental_gerado_em: new Date(),
      mapa_mental_tentativa_em: new Date(),
    }, { transaction });

    const dadosQuestoes = questoes.map((questao) => ({
      aula_id: aula.id,
      modulo_id: aula.modulo_id,
      enunciado: questao.enunciado,
      alternativa_a: questao.alternativaA,
      alternativa_b: questao.alternativaB,
      alternativa_c: questao.alternativaC,
      alternativa_d: questao.alternativaD,
      alternativa_e: questao.alternativaE,
      alternativa_correta: questao.alternativaCorreta,
      justificativa_erro: questao.justificativa,
      origem: "estudo",
    }));
    const objetivasExistentes = await Questao.findAll({
      where: { aula_id: aula.id, origem: "estudo" },
      order: [["id", "ASC"]],
      transaction,
    });
    await reconciliarRegistros(Questao, objetivasExistentes, dadosQuestoes, transaction);

    const dadosDiscursivas = discursivas.map((discursiva) => ({
      aula_id: aula.id,
      enunciado: discursiva.enunciado,
      criterios_avaliacao: discursiva.criteriosAvaliacao,
    }));
    const discursivasExistentes = await QuestaoDiscursiva.findAll({
      where: { aula_id: aula.id },
      order: [["id", "ASC"]],
      transaction,
    });
    await reconciliarRegistros(QuestaoDiscursiva, discursivasExistentes, dadosDiscursivas, transaction);
  });
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tentarGerarConteudoDoVideo(aula, tentativas = 2) {
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      await gerarConteudoDoVideo(aula);
      return;
    } catch (erro) {
      const ultimaTentativa = tentativa === tentativas;
      console.error(
        `[transcrição automática] falhou para a aula ${aula.id} (${aula.titulo}), tentativa ${tentativa}/${tentativas}:`,
        erro.message,
      );
      if (!ultimaTentativa) await esperar(2000);
    }
  }
}

async function criarAula(dados) {
  validarTipoConteudo(dados.tipo_conteudo || "youtube");
  validarUrlVideo(dados.youtube_iframe_url);
  validarUrlExterna(dados.url_externa);
  const aula = await Aula.create(dados);
  if (ehVideoValido(aula.youtube_iframe_url)) {
    await tentarGerarConteudoDoVideo(aula);
  }
  return Aula.findByPk(aula.id, {
    include: [
      { model: Questao, as: "questoes" },
      { model: QuestaoDiscursiva, as: "discursivas" },
      { model: AnexoAula, as: "anexos" },
    ],
  });
}

async function atualizarAula(id, dados) {
  const aula = await Aula.findByPk(id);
  if (!aula) naoEncontrado("Aula");

  const urlAntiga = aula.youtube_iframe_url;
  const urlExternaAntiga = aula.url_externa;
  if (dados.tipo_conteudo !== undefined) validarTipoConteudo(dados.tipo_conteudo);
  if (dados.youtube_iframe_url !== undefined) validarUrlVideo(dados.youtube_iframe_url);
  if (dados.url_externa !== undefined) validarUrlExterna(dados.url_externa);
  const fonteMudou = (
    (dados.youtube_iframe_url !== undefined && dados.youtube_iframe_url !== urlAntiga)
    || (dados.url_externa !== undefined && dados.url_externa !== urlExternaAntiga)
  );
  if (fonteMudou && dados.duracao_video_segundos === undefined) {
    dados.duracao_video_segundos = null;
    dados.duracao_video_fonte = null;
    dados.duracao_video_atualizada_em = null;
  }
  await aula.update(dados);

  const urlMudou = dados.youtube_iframe_url !== undefined && dados.youtube_iframe_url !== urlAntiga;
  if (urlMudou && ehVideoValido(aula.youtube_iframe_url)) {
    await tentarGerarConteudoDoVideo(aula);
  }

  return Aula.findByPk(aula.id, {
    include: [
      { model: Questao, as: "questoes" },
      { model: QuestaoDiscursiva, as: "discursivas" },
      { model: AnexoAula, as: "anexos" },
    ],
  });
}

function caminhoPublicoAnexo(nomeArquivo) {
  return `/uploads/anexos-aulas/${nomeArquivo}`;
}

async function criarAnexoArquivo(aulaId, arquivo, { nomeExibicao, ordem = 0 } = {}) {
  const aula = await Aula.findByPk(aulaId);
  if (!aula) naoEncontrado("Aula");
  if (!arquivo) {
    const erro = new Error("Selecione um arquivo para anexar");
    erro.status = 400;
    throw erro;
  }
  return AnexoAula.create({
    aula_id: aula.id,
    nome_original: arquivo.originalname,
    nome_exibicao: String(nomeExibicao || arquivo.originalname).trim(),
    caminho_arquivo: caminhoPublicoAnexo(arquivo.filename),
    mime_type: arquivo.mimetype || null,
    tamanho_bytes: arquivo.size || null,
    origem: "upload",
    ordem: Number(ordem) || 0,
  });
}

async function criarAnexoLink(aulaId, { nomeExibicao, urlExterna, ordem = 0, origem = "link" }) {
  const aula = await Aula.findByPk(aulaId);
  if (!aula) naoEncontrado("Aula");
  if (!String(nomeExibicao || "").trim()) {
    const erro = new Error("Informe o nome do anexo");
    erro.status = 400;
    throw erro;
  }
  validarUrlExterna(urlExterna);
  if (!urlExterna) {
    const erro = new Error("Informe a URL do anexo");
    erro.status = 400;
    throw erro;
  }
  return AnexoAula.create({
    aula_id: aula.id,
    nome_exibicao: String(nomeExibicao).trim(),
    url_externa: urlExterna,
    origem: origem === "udemy" ? "udemy" : "link",
    ordem: Number(ordem) || 0,
  });
}

async function excluirAnexo(id) {
  const anexo = await AnexoAula.findByPk(id);
  if (!anexo) naoEncontrado("Anexo");
  const caminho = anexo.caminho_arquivo;
  await anexo.destroy();
  if (!caminho) return;

  const pastaAnexos = path.resolve(__dirname, "..", "..", "..", "..", "uploads", "anexos-aulas");
  const alvo = path.resolve(__dirname, "..", "..", "..", "..", caminho.replace(/^[/\\]uploads[/\\]anexos-aulas[/\\]/, "uploads/anexos-aulas/"));
  if (!alvo.startsWith(`${pastaAnexos}${path.sep}`)) return;
  await fs.unlink(alvo).catch((erro) => {
    if (erro.code !== "ENOENT") throw erro;
  });
}

async function excluirAula(id) {
  const aula = await Aula.findByPk(id);
  if (!aula) naoEncontrado("Aula");
  await aula.destroy();
}

async function criarQuestao(dados) {
  if (dados.aula_id && !dados.modulo_id) {
    const aula = await Aula.findByPk(dados.aula_id);
    if (aula) dados.modulo_id = aula.modulo_id;
  }
  return Questao.create(dados);
}

async function atualizarQuestao(id, dados) {
  const questao = await Questao.findByPk(id);
  if (!questao) naoEncontrado("Questão");
  await questao.update(dados);
  return questao;
}

async function excluirQuestao(id) {
  const questao = await Questao.findByPk(id);
  if (!questao) naoEncontrado("Questão");
  await questao.destroy();
}

async function criarDiscursiva(dados) {
  return QuestaoDiscursiva.create(dados);
}

async function atualizarDiscursiva(id, dados) {
  const discursiva = await QuestaoDiscursiva.findByPk(id);
  if (!discursiva) naoEncontrado("Questão discursiva");
  await discursiva.update(dados);
  return discursiva;
}

async function excluirDiscursiva(id) {
  const discursiva = await QuestaoDiscursiva.findByPk(id);
  if (!discursiva) naoEncontrado("Questão discursiva");
  await discursiva.destroy();
}

async function gerarVariacoesComIa(questaoOrigemId, quantidade = 2) {
  const questaoOrigem = await Questao.findByPk(questaoOrigemId, { include: [{ model: Aula, as: "aula" }] });
  if (!questaoOrigem) naoEncontrado("Questão");

  const moduloId = questaoOrigem.modulo_id || questaoOrigem.aula?.modulo_id;
  if (!moduloId) {
    const erro = new Error("Não foi possível determinar o módulo desta questão para gerar variações.");
    erro.status = 400;
    throw erro;
  }

  const geradas = await gerarQuestoesSimilares(
    {
      enunciado: questaoOrigem.enunciado,
      alternativas: {
        a: questaoOrigem.alternativa_a,
        b: questaoOrigem.alternativa_b,
        c: questaoOrigem.alternativa_c,
        d: questaoOrigem.alternativa_d,
        e: questaoOrigem.alternativa_e,
      },
      alternativaCorreta: questaoOrigem.alternativa_correta,
      justificativa: questaoOrigem.justificativa_erro,
    },
    quantidade,
  );

  if (geradas.length === 0) {
    const erro = new Error("A IA não conseguiu gerar variações válidas para esta questão. Tente novamente.");
    erro.status = 502;
    throw erro;
  }

  const criadas = await Questao.bulkCreate(
    geradas.map((q) => ({
      modulo_id: moduloId,
      aula_id: null,
      enunciado: q.enunciado,
      alternativa_a: q.alternativaA,
      alternativa_b: q.alternativaB,
      alternativa_c: q.alternativaC,
      alternativa_d: q.alternativaD,
      alternativa_e: q.alternativaE,
      alternativa_correta: q.alternativaCorreta,
      justificativa_erro: q.justificativa,
      origem: "ia_gerada",
    })),
  );

  return criadas;
}

async function listarRelatoriosErro() {
  const relatorios = await RelatorioErro.findAll({
    include: [
      { model: Usuario, as: "usuario", attributes: ["id", "nome", "email", "arroba"] },
      {
        model: Aula,
        as: "aula",
        attributes: ["id", "titulo"],
        include: [{ model: Modulo, as: "modulo", attributes: ["id", "titulo"] }],
      },
    ],
    order: [
      ["status", "ASC"],
      ["created_at", "DESC"],
    ],
  });

  return relatorios.map((relatorio) => ({
    id: relatorio.id,
    descricao: relatorio.descricao,
    status: relatorio.status,
    criadoEm: relatorio.createdAt,
    usuario: relatorio.usuario
      ? { id: relatorio.usuario.id, nome: relatorio.usuario.nome, arroba: relatorio.usuario.arroba }
      : null,
    aulaId: relatorio.aula?.id,
    aulaTitulo: relatorio.aula?.titulo,
    moduloTitulo: relatorio.aula?.modulo?.titulo,
  }));
}

async function atualizarStatusRelatorioErro(id, status) {
  if (!["pendente", "resolvido"].includes(status)) {
    const erro = new Error("Status inválido");
    erro.status = 400;
    throw erro;
  }
  const relatorio = await RelatorioErro.findByPk(id);
  if (!relatorio) naoEncontrado("Relatório de erro");
  relatorio.status = status;
  await relatorio.save();
  return relatorio;
}

module.exports = {
  listarConteudo,
  listarRelatoriosErro,
  atualizarStatusRelatorioErro,
  criarModulo,
  atualizarModulo,
  excluirModulo,
  criarAula,
  atualizarAula,
  excluirAula,
  criarAnexoArquivo,
  criarAnexoLink,
  excluirAnexo,
  criarQuestao,
  atualizarQuestao,
  excluirQuestao,
  criarDiscursiva,
  atualizarDiscursiva,
  excluirDiscursiva,
  gerarVariacoesComIa,
  gerarConteudoDoVideo,
};
