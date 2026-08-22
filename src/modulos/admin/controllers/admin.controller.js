const adminService = require("../services/admin.service");

function dtoModulo(modulo) {
  return {
    id: modulo.id,
    titulo: modulo.titulo,
    corDestaque: modulo.cor_destaque,
    ordem: modulo.ordem,
    pesoEdital: Number(modulo.peso_edital || 1),
    cargosAlvo: modulo.cargos_alvo,
    agenciaId: modulo.agencia_id,
    agenciaNome: modulo.agencia?.nome || null,
    trilhaIds: (modulo.trilhas || []).map((trilha) => trilha.id),
    aulas: (modulo.aulas || []).map(dtoAula),
  };
}

function dtoAula(aula) {
  return {
    id: aula.id,
    moduloId: aula.modulo_id,
    titulo: aula.titulo,
    youtubeIframeUrl: aula.youtube_iframe_url,
    tipoConteudo: aula.tipo_conteudo,
    provedorExterno: aula.provedor_externo,
    urlExterna: aula.url_externa,
    idExterno: aula.id_externo,
    duracaoVideoSegundos: aula.duracao_video_segundos,
    duracaoVideoFonte: aula.duracao_video_fonte,
    resumoTexto: aula.resumo_texto,
    ordem: aula.ordem,
    transcricaoTexto: aula.transcricao_texto,
    transcricaoGeradaEm: aula.transcricao_gerada_em,
    questoes: (aula.questoes || []).map(dtoQuestao),
    discursivas: (aula.discursivas || []).map(dtoDiscursiva),
    anexos: (aula.anexos || []).map(dtoAnexo),
  };
}

function dtoAnexo(anexo) {
  return {
    id: anexo.id,
    aulaId: anexo.aula_id,
    nomeOriginal: anexo.nome_original,
    nomeExibicao: anexo.nome_exibicao,
    caminhoArquivo: anexo.caminho_arquivo,
    urlExterna: anexo.url_externa,
    mimeType: anexo.mime_type,
    tamanhoBytes: anexo.tamanho_bytes ? Number(anexo.tamanho_bytes) : null,
    origem: anexo.origem,
    ordem: anexo.ordem,
  };
}

function dtoDiscursiva(discursiva) {
  return {
    id: discursiva.id,
    aulaId: discursiva.aula_id,
    enunciado: discursiva.enunciado,
    criteriosAvaliacao: discursiva.criterios_avaliacao,
    ordem: discursiva.ordem,
  };
}

function dtoQuestao(questao) {
  return {
    id: questao.id,
    aulaId: questao.aula_id,
    moduloId: questao.modulo_id,
    enunciado: questao.enunciado,
    alternativaA: questao.alternativa_a,
    alternativaB: questao.alternativa_b,
    alternativaC: questao.alternativa_c,
    alternativaD: questao.alternativa_d,
    alternativaE: questao.alternativa_e,
    alternativaCorreta: questao.alternativa_correta,
    justificativaErro: questao.justificativa_erro,
    origem: questao.origem,
  };
}

async function listarConteudo(requisicao, resposta, proximo) {
  try {
    const modulos = await adminService.listarConteudo();
    resposta.json({ modulos: modulos.map(dtoModulo) });
  } catch (erro) {
    proximo(erro);
  }
}

async function criarModulo(requisicao, resposta, proximo) {
  try {
    const { titulo, corDestaque, ordem, pesoEdital, agenciaId, trilhaIds, cargosAlvo } = requisicao.body || {};
    if (!titulo) return resposta.status(400).json({ erro: "Título é obrigatório" });

    const modulo = await adminService.criarModulo({
      titulo,
      agencia_id: agenciaId || undefined,
      cor_destaque: corDestaque || "#F3C623",
      ordem: ordem ?? 0,
      peso_edital: Math.max(0.01, Number(pesoEdital) || 1),
      cargos_alvo: Array.isArray(cargosAlvo) ? cargosAlvo : [],
    }, Array.isArray(trilhaIds) ? trilhaIds.map(Number) : []);
    resposta.status(201).json({ modulo: dtoModulo(modulo) });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarModulo(requisicao, resposta, proximo) {
  try {
    const { titulo, corDestaque, ordem, pesoEdital, agenciaId, trilhaIds, cargosAlvo } = requisicao.body || {};
    const modulo = await adminService.atualizarModulo(requisicao.params.id, {
      ...(titulo !== undefined && { titulo }),
      ...(corDestaque !== undefined && { cor_destaque: corDestaque }),
      ...(ordem !== undefined && { ordem }),
      ...(pesoEdital !== undefined && { peso_edital: Math.max(0.01, Number(pesoEdital) || 1) }),
      ...(cargosAlvo !== undefined && { cargos_alvo: Array.isArray(cargosAlvo) ? cargosAlvo : [] }),
      ...(agenciaId !== undefined && { agencia_id: agenciaId }),
    }, trilhaIds === undefined ? undefined : Array.isArray(trilhaIds) ? trilhaIds.map(Number) : []);
    resposta.json({ modulo: dtoModulo(modulo) });
  } catch (erro) {
    proximo(erro);
  }
}

async function excluirModulo(requisicao, resposta, proximo) {
  try {
    await adminService.excluirModulo(requisicao.params.id);
    resposta.status(204).send();
  } catch (erro) {
    proximo(erro);
  }
}

async function criarAula(requisicao, resposta, proximo) {
  try {
    const {
      moduloId,
      titulo,
      tipoConteudo = "youtube",
      youtubeIframeUrl,
      provedorExterno,
      urlExterna,
      idExterno,
      duracaoVideoMinutos,
      resumoTexto,
      ordem,
    } = requisicao.body || {};
    if (!moduloId || !titulo) {
      return resposta.status(400).json({ erro: "Módulo e título são obrigatórios" });
    }

    const aula = await adminService.criarAula({
      modulo_id: moduloId,
      titulo,
      tipo_conteudo: tipoConteudo,
      youtube_iframe_url: youtubeIframeUrl || null,
      provedor_externo: provedorExterno || null,
      url_externa: urlExterna || null,
      id_externo: idExterno || null,
      duracao_video_segundos: duracaoVideoMinutos ? Math.round(Number(duracaoVideoMinutos) * 60) : null,
      duracao_video_fonte: duracaoVideoMinutos ? "admin" : null,
      duracao_video_atualizada_em: duracaoVideoMinutos ? new Date() : null,
      resumo_texto: resumoTexto || "",
      ordem: ordem ?? 0,
    });
    resposta.status(201).json({ aula: dtoAula(aula) });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarAula(requisicao, resposta, proximo) {
  try {
    const {
      titulo,
      tipoConteudo,
      youtubeIframeUrl,
      provedorExterno,
      urlExterna,
      idExterno,
      duracaoVideoMinutos,
      resumoTexto,
      ordem,
    } = requisicao.body || {};
    const aula = await adminService.atualizarAula(requisicao.params.id, {
      ...(titulo !== undefined && { titulo }),
      ...(tipoConteudo !== undefined && { tipo_conteudo: tipoConteudo }),
      ...(youtubeIframeUrl !== undefined && { youtube_iframe_url: youtubeIframeUrl || null }),
      ...(provedorExterno !== undefined && { provedor_externo: provedorExterno || null }),
      ...(urlExterna !== undefined && { url_externa: urlExterna || null }),
      ...(idExterno !== undefined && { id_externo: idExterno || null }),
      ...(duracaoVideoMinutos !== undefined && {
        duracao_video_segundos: duracaoVideoMinutos ? Math.round(Number(duracaoVideoMinutos) * 60) : null,
        duracao_video_fonte: duracaoVideoMinutos ? "admin" : null,
        duracao_video_atualizada_em: duracaoVideoMinutos ? new Date() : null,
      }),
      ...(resumoTexto !== undefined && { resumo_texto: resumoTexto }),
      ...(ordem !== undefined && { ordem }),
    });
    resposta.json({ aula: dtoAula(aula) });
  } catch (erro) {
    proximo(erro);
  }
}

async function criarAnexoArquivo(requisicao, resposta, proximo) {
  try {
    const anexo = await adminService.criarAnexoArquivo(requisicao.params.id, requisicao.file, requisicao.body);
    resposta.status(201).json({ anexo: dtoAnexo(anexo) });
  } catch (erro) {
    proximo(erro);
  }
}

async function criarAnexoLink(requisicao, resposta, proximo) {
  try {
    const anexo = await adminService.criarAnexoLink(requisicao.params.id, requisicao.body || {});
    resposta.status(201).json({ anexo: dtoAnexo(anexo) });
  } catch (erro) {
    proximo(erro);
  }
}

async function excluirAnexo(requisicao, resposta, proximo) {
  try {
    await adminService.excluirAnexo(requisicao.params.id);
    resposta.status(204).send();
  } catch (erro) {
    proximo(erro);
  }
}

async function excluirAula(requisicao, resposta, proximo) {
  try {
    await adminService.excluirAula(requisicao.params.id);
    resposta.status(204).send();
  } catch (erro) {
    proximo(erro);
  }
}

async function criarQuestao(requisicao, resposta, proximo) {
  try {
    const {
      aulaId,
      enunciado,
      alternativaA,
      alternativaB,
      alternativaC,
      alternativaD,
      alternativaE,
      alternativaCorreta,
      justificativaErro,
    } = requisicao.body || {};

    if (!aulaId || !enunciado || !alternativaA || !alternativaB || !alternativaC || !alternativaD) {
      return resposta.status(400).json({ erro: "Preencha aula, enunciado e as alternativas A a D" });
    }
    if (!["a", "b", "c", "d", "e"].includes(alternativaCorreta)) {
      return resposta.status(400).json({ erro: "Alternativa correta inválida" });
    }

    const questao = await adminService.criarQuestao({
      aula_id: aulaId,
      enunciado,
      alternativa_a: alternativaA,
      alternativa_b: alternativaB,
      alternativa_c: alternativaC,
      alternativa_d: alternativaD,
      alternativa_e: alternativaE || null,
      alternativa_correta: alternativaCorreta,
      justificativa_erro: justificativaErro || null,
    });
    resposta.status(201).json({ questao: dtoQuestao(questao) });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarQuestao(requisicao, resposta, proximo) {
  try {
    const {
      enunciado,
      alternativaA,
      alternativaB,
      alternativaC,
      alternativaD,
      alternativaE,
      alternativaCorreta,
      justificativaErro,
    } = requisicao.body || {};

    const questao = await adminService.atualizarQuestao(requisicao.params.id, {
      ...(enunciado !== undefined && { enunciado }),
      ...(alternativaA !== undefined && { alternativa_a: alternativaA }),
      ...(alternativaB !== undefined && { alternativa_b: alternativaB }),
      ...(alternativaC !== undefined && { alternativa_c: alternativaC }),
      ...(alternativaD !== undefined && { alternativa_d: alternativaD }),
      ...(alternativaE !== undefined && { alternativa_e: alternativaE }),
      ...(alternativaCorreta !== undefined && { alternativa_correta: alternativaCorreta }),
      ...(justificativaErro !== undefined && { justificativa_erro: justificativaErro }),
    });
    resposta.json({ questao: dtoQuestao(questao) });
  } catch (erro) {
    proximo(erro);
  }
}

async function excluirQuestao(requisicao, resposta, proximo) {
  try {
    await adminService.excluirQuestao(requisicao.params.id);
    resposta.status(204).send();
  } catch (erro) {
    proximo(erro);
  }
}

async function criarDiscursiva(requisicao, resposta, proximo) {
  try {
    const { aulaId, enunciado, criteriosAvaliacao, ordem } = requisicao.body || {};
    if (!aulaId || !enunciado || !criteriosAvaliacao) {
      return resposta.status(400).json({ erro: "Aula, enunciado e critérios de avaliação são obrigatórios" });
    }

    const discursiva = await adminService.criarDiscursiva({
      aula_id: aulaId,
      enunciado,
      criterios_avaliacao: criteriosAvaliacao,
      ordem: ordem ?? 0,
    });
    resposta.status(201).json({ discursiva: dtoDiscursiva(discursiva) });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarDiscursiva(requisicao, resposta, proximo) {
  try {
    const { enunciado, criteriosAvaliacao, ordem } = requisicao.body || {};
    const discursiva = await adminService.atualizarDiscursiva(requisicao.params.id, {
      ...(enunciado !== undefined && { enunciado }),
      ...(criteriosAvaliacao !== undefined && { criterios_avaliacao: criteriosAvaliacao }),
      ...(ordem !== undefined && { ordem }),
    });
    resposta.json({ discursiva: dtoDiscursiva(discursiva) });
  } catch (erro) {
    proximo(erro);
  }
}

async function excluirDiscursiva(requisicao, resposta, proximo) {
  try {
    await adminService.excluirDiscursiva(requisicao.params.id);
    resposta.status(204).send();
  } catch (erro) {
    proximo(erro);
  }
}

async function gerarVariacoesComIa(requisicao, resposta, proximo) {
  try {
    const quantidade = Math.min(Number(requisicao.body?.quantidade) || 2, 5);
    const questoes = await adminService.gerarVariacoesComIa(requisicao.params.id, quantidade);
    resposta.status(201).json({ questoes: questoes.map(dtoQuestao) });
  } catch (erro) {
    proximo(erro);
  }
}

async function listarRelatoriosErro(requisicao, resposta, proximo) {
  try {
    const relatorios = await adminService.listarRelatoriosErro();
    resposta.json({ relatorios });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarStatusRelatorioErro(requisicao, resposta, proximo) {
  try {
    const { status } = requisicao.body || {};
    const relatorio = await adminService.atualizarStatusRelatorioErro(requisicao.params.id, status);
    resposta.json({ id: relatorio.id, status: relatorio.status });
  } catch (erro) {
    proximo(erro);
  }
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
};
