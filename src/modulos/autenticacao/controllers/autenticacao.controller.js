const autenticacaoService = require("../services/autenticacao.service");
const { ambiente } = require("../../../config/ambiente");

async function cadastrar(requisicao, resposta, proximo) {
  try {
    const { nome, sobrenome, email, senha } = requisicao.body || {};

    if (!nome || !sobrenome || !email || !senha) {
      return resposta.status(400).json({ erro: "Nome, sobrenome, e-mail e senha são obrigatórios" });
    }

    const fotoUrl = requisicao.file ? `/uploads/fotos-perfil/${requisicao.file.filename}` : null;

    const resultado = await autenticacaoService.registrar({ nome, sobrenome, email, senha, fotoUrl });
    resposta.status(201).json(resultado);
  } catch (erro) {
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
    resposta.json(resultado);
  } catch (erro) {
    proximo(erro);
  }
}

async function perfil(requisicao, resposta) {
  resposta.json({ usuario: autenticacaoService.paraDto(requisicao.usuario) });
}

async function atualizarPerfil(requisicao, resposta, proximo) {
  try {
    const { nome, sobrenome, cargo } = requisicao.body || {};
    const fotoUrl = requisicao.file ? `/uploads/fotos-perfil/${requisicao.file.filename}` : null;

    const usuario = await autenticacaoService.atualizarPerfil(requisicao.usuario.id, {
      nome,
      sobrenome,
      fotoUrl,
      cargo,
    });

    resposta.json({ usuario });
  } catch (erro) {
    proximo(erro);
  }
}

async function alterarSenha(requisicao, resposta, proximo) {
  try {
    const { senhaAtual, novaSenha } = requisicao.body || {};

    if (!senhaAtual || !novaSenha) {
      return resposta.status(400).json({ erro: "Senha atual e nova senha são obrigatórias" });
    }
    if (novaSenha.length < 6) {
      return resposta.status(400).json({ erro: "A nova senha precisa ter pelo menos 6 caracteres" });
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
    if (novaSenha.length < 6) {
      return resposta.status(400).json({ erro: "A nova senha precisa ter pelo menos 6 caracteres" });
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
  perfil,
  atualizarPerfil,
  alterarSenha,
  esqueciSenha,
  resetarSenha,
};
