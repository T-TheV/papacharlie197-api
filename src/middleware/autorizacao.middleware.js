function exigirSuperadmin(requisicao, resposta, proximo) {
  if (requisicao.usuario?.papel !== "superadmin") {
    return resposta.status(403).json({ erro: "Acesso restrito a superadmin" });
  }
  proximo();
}

module.exports = { exigirSuperadmin };
