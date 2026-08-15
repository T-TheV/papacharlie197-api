const autenticacaoService = require("../services/autenticacao.service");
const { ambiente } = require("../../../config/ambiente");
const fs = require("fs/promises");
const path = require("path");

const COOKIE_SESSAO = "pc197_sessao";
const PASTA_FOTOS = path.resolve(__dirname, "..", "..", "..", "..", "uploads", "fotos-perfil");

async function excluirFotoLocal(url) {
  if (!String(url || "").startsWith("/uploads/fotos-perfil/")) return;
  const arquivo = path.resolve(PASTA_FOTOS, path.basename(url));
  if (!arquivo.startsWith(`${PASTA_FOTOS}${path.sep}`)) return;
  await fs.unlink(arquivo).catch(() => undefined);
}

function definirCookieSessao(resposta, token) {
  resposta.cookie(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: ambiente === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

async function cadastrar(requisicao, resposta, proximo) {
  try {
    const { nome, sobrenome, email, senha, agenciaId, trilhaId } = requisicao.body || {};

    if (!nome || !sobrenome || !email || !senha) {
      if (requisicao.file) await excluirFotoLocal(`/uploads/fotos-perfil/${requisicao.file.filename}`);
      return resposta.status(400).json({ erro: "Nome, sobrenome, e-mail e senha são obrigatórios" });
    }
    if (String(senha).length < 8) {
      if (requisicao.file) await excluirFotoLocal(`/uploads/fotos-perfil/${requisicao.file.filename}`);
      return resposta.status(400).json({ erro: "A senha precisa ter pelo menos 8 caracteres" });
    }

    const fotoUrl = requisicao.file ? `/uploads/fotos-perfil/${requisicao.file.filename}` : null;

    const resultado = await autenticacaoService.registrar({
      nome,
      sobrenome,
      email,
      senha,
      fotoUrl,
      agenciaId: agenciaId || null,
      trilhaId: trilhaId || null,
    });
    definirCookieSessao(resposta, resultado.token);
    resposta.status(201).json({ usuario: resultado.usuario });
  } catch (erro) {
    if (requisicao.file) await excluirFotoLocal(`/uploads/fotos-perfil/${requisicao.file.filename}`);
    proximo(erro);
  }
}

async function entrar(requisicao, resposta, proximo) {
  try {
    const { email, senha } = requisicao.body || {};

    if (!email || !senha) {
      return resposta.status(400).json({ erro: "E-mail e senha são obrigatórios" });
    }

    const resultado = await autenticacaoService.login({ email, senha });
    definirCookieSessao(resposta, resultado.token);
    resposta.json({ usuario: resultado.usuario });
  } catch (erro) {
    proximo(erro);
  }
}

async function perfil(requisicao, resposta) {
  resposta.json({ usuario: autenticacaoService.paraDto(requisicao.usuario, requisicao.contextoCurso) });
}

async function sair(requisicao, resposta, proximo) {
  try {
    await autenticacaoService.revogarSessoes(requisicao.usuario.id);
  } catch (erro) {
    return proximo(erro);
  }
  resposta.clearCookie(COOKIE_SESSAO, { path: "/" });
  return resposta.status(204).send();
}

async function atualizarPerfil(requisicao, resposta, proximo) {
  const fotoAnterior = requisicao.usuario?.foto_url;
  try {
    const { nome, sobrenome, cargo, trilhaId, diasEstudo, arroba } = requisicao.body || {};
    const fotoUrl = requisicao.file ? `/uploads/fotos-perfil/${requisicao.file.filename}` : null;

    let diasEstudoParsed;
    if (diasEstudo !== undefined) {
      try {
        diasEstudoParsed = JSON.parse(diasEstudo);
      } catch {
        if (requisicao.file) await excluirFotoLocal(`/uploads/fotos-perfil/${requisicao.file.filename}`);
        return resposta.status(400).json({ erro: "Dias de estudo inválidos" });
      }
    }

    const usuario = await autenticacaoService.atualizarPerfil(requisicao.usuario.id, {
      nome,
      sobrenome,
      fotoUrl,
      cargo,
      trilhaId,
      diasEstudo: diasEstudoParsed,
      arroba,
    });

    if (fotoUrl) await excluirFotoLocal(fotoAnterior);

    resposta.json({ usuario });
  } catch (erro) {
    if (requisicao.file) await excluirFotoLocal(`/uploads/fotos-perfil/${requisicao.file.filename}`);
    proximo(erro);
  }
}

async function alterarSenha(requisicao, resposta, proximo) {
  try {
    const { senhaAtual, novaSenha } = requisicao.body || {};

    if (!senhaAtual || !novaSenha) {
      return resposta.status(400).json({ erro: "Senha atual e nova senha são obrigatórias" });
    }
    if (novaSenha.length < 8) {
      return resposta.status(400).json({ erro: "A nova senha precisa ter pelo menos 8 caracteres" });
    }

    await autenticacaoService.alterarSenha(requisicao.usuario.id, { senhaAtual, novaSenha });
    resposta.json({ sucesso: true });
  } catch (erro) {
    proximo(erro);
  }
}

async function esqueciSenha(requisicao, resposta, proximo) {
  try {
    const { email } = requisicao.body || {};
    if (!email) return resposta.status(400).json({ erro: "E-mail é obrigatório" });

    const resultado = await autenticacaoService.solicitarRecuperacao(email);

    const payload = {
      mensagem: "Se este e-mail existir na base, um link de recuperação foi gerado.",
    };

    if (ambiente === "development" && resultado.token) {
      payload.linkDev = `/resetar-senha?token=${resultado.token}`;
    }

    resposta.json(payload);
  } catch (erro) {
    proximo(erro);
  }
}

async function resetarSenha(requisicao, resposta, proximo) {
  try {
    const { token, novaSenha } = requisicao.body || {};

    if (!token || !novaSenha) {
      return resposta.status(400).json({ erro: "Token e nova senha são obrigatórios" });
    }
    if (novaSenha.length < 8) {
      return resposta.status(400).json({ erro: "A nova senha precisa ter pelo menos 8 caracteres" });
    }

    await autenticacaoService.resetarSenha(token, novaSenha);
    resposta.json({ sucesso: true });
  } catch (erro) {
    proximo(erro);
  }
}

module.exports = {
  cadastrar,
  entrar,
  sair,
  perfil,
  atualizarPerfil,
  alterarSenha,
  esqueciSenha,
  resetarSenha,
};
