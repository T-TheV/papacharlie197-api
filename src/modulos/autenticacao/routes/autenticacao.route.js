const { Router } = require("express");
const uploadFoto = require("../../../middleware/upload.middleware");
const autenticar = require("../../../middleware/autenticacao.middleware");
const limitadorAutenticacao = require("../../../middleware/limitadorAutenticacao.middleware");
const autenticacaoController = require("../controllers/autenticacao.controller");

const rotas = Router();

rotas.post("/cadastro", limitadorAutenticacao, uploadFoto.single("foto"), autenticacaoController.cadastrar);
rotas.post("/login", limitadorAutenticacao, autenticacaoController.entrar);
rotas.post("/logout", autenticar, autenticacaoController.sair);
rotas.get("/me", autenticar, autenticacaoController.perfil);
rotas.patch("/me", autenticar, uploadFoto.single("foto"), autenticacaoController.atualizarPerfil);
rotas.patch("/me/senha", autenticar, autenticacaoController.alterarSenha);
rotas.post("/esqueci-senha", limitadorAutenticacao, autenticacaoController.esqueciSenha);
rotas.post("/resetar-senha", limitadorAutenticacao, autenticacaoController.resetarSenha);

module.exports = rotas;
