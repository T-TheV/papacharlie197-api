const adminService = require("../services/admin.service");

function dtoModulo(modulo) {
  return {
    id: modulo.id,
    titulo: modulo.titulo,
    corDestaque: modulo.cor_destaque,
    ordem: modulo.ordem,
    cargosAlvo: modulo.cargos_alvo,
    aulas: (modulo.aulas || []).map(dtoAula),
  };
}

function dtoAula(aula) {
  return {
    id: aula.id,
    moduloId: aula.modulo_id,
    titulo: aula.titulo,
    youtubeIframeUrl: aula.youtube_iframe_url,
    resumoTexto: aula.resumo_texto,
    ordem: aula.ordem,
    questoes: (aula.questoes || []).map(dtoQuestao),
    discursivas: (aula.discursivas || []).map(dtoDiscursiva),
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
    enunciado: questao.enunciado,
    alternativaA: questao.alternativa_a,
    alternativaB: questao.alternativa_b,
    alternativaC: questao.alternativa_c,
    alternativaD: questao.alternativa_d,
    alternativaE: questao.alternativa_e,
    alternativaCorreta: questao.alternativa_correta,
    justificativaErro: questao.justificativa_erro,
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
    const { titulo, corDestaque, ordem, cargosAlvo } = requisicao.body || {};
    if (!titulo) return resposta.status(400).json({ erro: "Título é obrigatório" });

    const modulo = await adminService.criarModulo({
      titulo,
      cor_destaque: corDestaque || "#F3C623",
      ordem: ordem ?? 0,
      cargos_alvo: Array.isArray(cargosAlvo) ? cargosAlvo : [],
    });
    resposta.status(201).json({ modulo: dtoModulo(modulo) });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarModulo(requisicao, resposta, proximo) {
  try {
    const { titulo, corDestaque, ordem, cargosAlvo } = requisicao.body || {};
    const modulo = await adminService.atualizarModulo(requisicao.params.id, {
      ...(titulo !== undefined && { titulo }),
      ...(corDestaque !== undefined && { cor_destaque: corDestaque }),
      ...(ordem !== undefined && { ordem }),
      ...(cargosAlvo !== undefined && { cargos_alvo: Array.isArray(cargosAlvo) ? cargosAlvo : [] }),
    });
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
    const { moduloId, titulo, youtubeIframeUrl, resumoTexto, ordem } = requisicao.body || {};
    if (!moduloId || !titulo || !youtubeIframeUrl) {
      return resposta.status(400).json({ erro: "Módulo, título e URL do YouTube são obrigatórios" });
    }

    const aula = await adminService.criarAula({
      modulo_id: moduloId,
      titulo,
      youtube_iframe_url: youtubeIframeUrl,
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
    const { titulo, youtubeIframeUrl, resumoTexto, ordem } = requisicao.body || {};
    const aula = await adminService.atualizarAula(requisicao.params.id, {
      ...(titulo !== undefined && { titulo }),
      ...(youtubeIframeUrl !== undefined && { youtube_iframe_url: youtubeIframeUrl }),
      ...(resumoTexto !== undefined && { resumo_texto: resumoTexto }),
      ...(ordem !== undefined && { ordem }),
    });
    resposta.json({ aula: dtoAula(aula) });
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

module.exports = {
  listarConteudo,
  criarModulo,
  atualizarModulo,
  excluirModulo,
  criarAula,
  atualizarAula,
  excluirAula,
  criarQuestao,
  atualizarQuestao,
  excluirQuestao,
  criarDiscursiva,
  atualizarDiscursiva,
  excluirDiscursiva,
};
