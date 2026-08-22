const estudoService = require("../services/estudo.service");
const gamificacaoService = require("../../progresso/services/gamificacao.service");
const sessaoEstudoService = require("../services/sessaoEstudo.service");

async function listarModulos(requisicao, resposta, proximo) {
  try {
    const modulos = await estudoService.listarModulosComProgresso(requisicao.usuario.id, requisicao.contextoCurso);
    resposta.json({ modulos });
  } catch (erro) {
    proximo(erro);
  }
}

async function obterAula(requisicao, resposta, proximo) {
  try {
    const aula = await estudoService.obterAula(requisicao.params.id, requisicao.usuario.id, requisicao.contextoCurso);
    resposta.json(aula);
  } catch (erro) {
    proximo(erro);
  }
}

async function aprimorarMapaMental(requisicao, resposta, proximo) {
  try {
    const mapaMental = await estudoService.aprimorarMapaMental(
      requisicao.params.id,
      requisicao.usuario.id,
      requisicao.contextoCurso,
    );
    resposta.json({ mapaMental });
  } catch (erro) {
    proximo(erro);
  }
}

async function responderQuestao(requisicao, resposta, proximo) {
  try {
    const { alternativa } = requisicao.body || {};

    if (!["a", "b", "c", "d", "e"].includes(alternativa)) {
      return resposta.status(400).json({ erro: "Alternativa inválida" });
    }

    const resultado = await gamificacaoService.processarResposta({
      usuarioId: requisicao.usuario.id,
      questaoId: requisicao.params.id,
      alternativa,
      contexto: requisicao.contextoCurso,
    });

    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

async function alternarConclusaoAula(requisicao, resposta, proximo) {
  try {
    const resultado = await gamificacaoService.alternarConclusaoManual(
      requisicao.usuario.id,
      requisicao.params.id,
      requisicao.contextoCurso,
    );
    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

async function listarRevisao(requisicao, resposta, proximo) {
  try {
    const revisao = await estudoService.listarRevisaoObrigatoria(requisicao.usuario.id, requisicao.contextoCurso);
    resposta.json({ revisao });
  } catch (erro) {
    proximo(erro);
  }
}

async function responderDiscursiva(requisicao, resposta, proximo) {
  try {
    const { respostaTexto } = requisicao.body || {};

    if (!respostaTexto || !respostaTexto.trim()) {
      return resposta.status(400).json({ erro: "Escreva uma resposta antes de enviar" });
    }

    const resultado = await estudoService.responderDiscursiva(
      requisicao.usuario.id,
      requisicao.params.id,
      respostaTexto.trim(),
      requisicao.contextoCurso,
    );
    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

async function listarModulosBanco(requisicao, resposta, proximo) {
  try {
    const modulos = await estudoService.listarModulosComQuestoesBanco(requisicao.contextoCurso);
    resposta.json({ modulos });
  } catch (erro) {
    proximo(erro);
  }
}

async function listarBancoQuestoes(requisicao, resposta, proximo) {
  try {
    const { moduloId, banca, ano, pagina, limite } = requisicao.query;
    const dados = await estudoService.listarBancoQuestoes(requisicao.usuario.id, requisicao.contextoCurso, {
      moduloId,
      banca,
      ano,
      pagina,
      limite,
    });
    resposta.json(dados);
  } catch (erro) {
    proximo(erro);
  }
}

async function responderQuestaoBanco(requisicao, resposta, proximo) {
  try {
    const { alternativa } = requisicao.body || {};

    if (!["a", "b", "c", "d", "e"].includes(alternativa)) {
      return resposta.status(400).json({ erro: "Alternativa inválida" });
    }

    const resultado = await estudoService.responderQuestaoBanco(
      requisicao.usuario.id,
      requisicao.params.id,
      alternativa,
      requisicao.contextoCurso,
    );
    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

async function reportarErroAula(requisicao, resposta, proximo) {
  try {
    const { descricao } = requisicao.body || {};
    const resultado = await estudoService.reportarErroAula(
      requisicao.usuario.id,
      requisicao.params.id,
      descricao,
      requisicao.contextoCurso,
    );
    resposta.status(201).json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

async function gerarSimulado(requisicao, resposta, proximo) {
  try {
    const { modo, moduloId } = requisicao.query;

    if (!["progresso", "modulo", "completo", "revisao"].includes(modo)) {
      return resposta.status(400).json({ erro: "Modo de simulado inválido" });
    }
    if (modo === "modulo" && !moduloId) {
      return resposta.status(400).json({ erro: "Informe o módulo para este modo de simulado" });
    }

    const simulado = await estudoService.gerarSimulado(requisicao.usuario.id, requisicao.contextoCurso, {
      modo,
      moduloId,
    });
    resposta.json(simulado);
  } catch (erro) {
    proximo(erro);
  }
}

async function corrigirSimulado(requisicao, resposta, proximo) {
  try {
    const { simuladoId, respostas } = requisicao.body || {};

    if (!Array.isArray(respostas) || respostas.length === 0) {
      return resposta.status(400).json({ erro: "Envie as respostas do simulado" });
    }
    if (!simuladoId) return resposta.status(400).json({ erro: "Informe o simulado que será corrigido" });

    const resultado = await estudoService.corrigirSimulado(
      requisicao.usuario.id,
      simuladoId,
      respostas,
      requisicao.contextoCurso,
    );
    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

async function obterMensagemDoDia(requisicao, resposta, proximo) {
  try {
    const dados = await estudoService.obterMensagemDoDia(requisicao.usuario.id, requisicao.contextoCurso);
    resposta.json(dados);
  } catch (erro) {
    proximo(erro);
  }
}

async function criarSessaoEstudo(requisicao, resposta, proximo) {
  try {
    const sessao = await sessaoEstudoService.criarSessao({
      usuarioId: requisicao.usuario.id,
      aulaId: requisicao.params.id,
      contexto: requisicao.contextoCurso,
      chaveCliente: requisicao.body?.chaveCliente,
      tempoPlanejadoMinutos: requisicao.body?.tempoPlanejadoMinutos,
    });
    resposta.status(201).json({ sessao });
  } catch (erro) {
    proximo(erro);
  }
}

async function obterSessaoAtiva(requisicao, resposta, proximo) {
  try {
    const sessao = await sessaoEstudoService.obterSessaoAtiva({
      usuarioId: requisicao.usuario.id,
      aulaId: requisicao.params.id,
      contexto: requisicao.contextoCurso,
    });
    resposta.json({ sessao });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarSessao(acao, requisicao, resposta, proximo) {
  try {
    const sessao = await sessaoEstudoService.atualizarSessao({
      id: requisicao.params.id,
      usuarioId: requisicao.usuario.id,
      contexto: requisicao.contextoCurso,
      acao,
      tempoEfetivoSegundos: requisicao.body?.tempoEfetivoSegundos,
      estadoTimer: requisicao.body?.estadoTimer,
    });
    resposta.json({ sessao });
  } catch (erro) {
    proximo(erro);
  }
}

function iniciarSessao(requisicao, resposta, proximo) {
  return atualizarSessao("iniciar", requisicao, resposta, proximo);
}

function interromperSessao(requisicao, resposta, proximo) {
  return atualizarSessao("interromper", requisicao, resposta, proximo);
}

function registrarProgressoSessao(requisicao, resposta, proximo) {
  return atualizarSessao("progresso", requisicao, resposta, proximo);
}

function concluirSessao(requisicao, resposta, proximo) {
  return atualizarSessao("concluir", requisicao, resposta, proximo);
}

async function registrarDuracaoVideo(requisicao, resposta, proximo) {
  try {
    const resultado = await sessaoEstudoService.registrarDuracaoVideo({
      usuarioId: requisicao.usuario.id,
      aulaId: requisicao.params.id,
      contexto: requisicao.contextoCurso,
      duracaoSegundos: requisicao.body?.duracaoSegundos,
    });
    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

module.exports = {
  listarModulos,
  obterAula,
  aprimorarMapaMental,
  responderQuestao,
  alternarConclusaoAula,
  listarRevisao,
  responderDiscursiva,
  listarModulosBanco,
  listarBancoQuestoes,
  responderQuestaoBanco,
  reportarErroAula,
  gerarSimulado,
  corrigirSimulado,
  obterMensagemDoDia,
  criarSessaoEstudo,
  obterSessaoAtiva,
  iniciarSessao,
  interromperSessao,
  registrarProgressoSessao,
  concluirSessao,
  registrarDuracaoVideo,
};
