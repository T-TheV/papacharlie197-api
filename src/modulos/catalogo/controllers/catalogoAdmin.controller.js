const service = require("../services/catalogo.service");
const fs = require("fs/promises");
const path = require("path");

const PASTA_LOGOS = path.resolve(__dirname, "..", "..", "..", "..", "uploads", "logos-agencias");

async function excluirLogoLocal(url) {
  if (!String(url || "").startsWith("/uploads/logos-agencias/")) return;
  const arquivo = path.resolve(PASTA_LOGOS, path.basename(url));
  if (!arquivo.startsWith(`${PASTA_LOGOS}${path.sep}`)) return;
  await fs.unlink(arquivo).catch(() => undefined);
}

async function listar(requisicao, resposta, proximo) {
  try {
    const agencias = await service.listarTodasAgencias();
    resposta.json({ agencias: agencias.map((agencia) => service.dtoAgencia(agencia)) });
  } catch (erro) {
    proximo(erro);
  }
}

async function criarAgencia(requisicao, resposta, proximo) {
  try {
    const agencia = await service.criarAgencia(requisicao.body || {});
    resposta.status(201).json({ agencia: service.dtoAgencia(agencia) });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarAgencia(requisicao, resposta, proximo) {
  try {
    const agencia = await service.atualizarAgencia(requisicao.params.id, requisicao.body || {});
    resposta.json({ agencia: service.dtoAgencia(agencia) });
  } catch (erro) {
    proximo(erro);
  }
}

async function definirPadrao(requisicao, resposta, proximo) {
  try {
    const agencia = await service.definirAgenciaPadrao(requisicao.params.id);
    resposta.json({ agencia: service.dtoAgencia(agencia) });
  } catch (erro) {
    proximo(erro);
  }
}

async function enviarLogo(requisicao, resposta, proximo) {
  if (!requisicao.file) return resposta.status(400).json({ erro: "Envie o arquivo do logo" });
  const novaUrl = `/uploads/logos-agencias/${requisicao.file.filename}`;
  try {
    const agencias = await service.listarTodasAgencias();
    const atual = agencias.find((agencia) => Number(agencia.id) === Number(requisicao.params.id));
    if (!atual) {
      await excluirLogoLocal(novaUrl);
      return resposta.status(404).json({ erro: "Agência não encontrada" });
    }
    const agencia = await service.atualizarAgencia(atual.id, { logoUrl: novaUrl });
    await excluirLogoLocal(atual.logo_url);
    return resposta.json({ agencia: service.dtoAgencia(agencia) });
  } catch (erro) {
    await excluirLogoLocal(novaUrl);
    return proximo(erro);
  }
}

async function criarTrilha(requisicao, resposta, proximo) {
  try {
    const trilha = await service.criarTrilha(requisicao.params.agenciaId, requisicao.body || {});
    resposta.status(201).json({ trilha: service.dtoTrilha(trilha) });
  } catch (erro) {
    proximo(erro);
  }
}

async function atualizarTrilha(requisicao, resposta, proximo) {
  try {
    const trilha = await service.atualizarTrilha(requisicao.params.id, requisicao.body || {});
    resposta.json({ trilha: service.dtoTrilha(trilha) });
  } catch (erro) {
    proximo(erro);
  }
}

module.exports = {
  listar,
  criarAgencia,
  atualizarAgencia,
  enviarLogo,
  definirPadrao,
  criarTrilha,
  atualizarTrilha,
};
