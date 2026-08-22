const { Router } = require("express");
const autenticar = require("../../../middleware/autenticacao.middleware");
const controller = require("../controllers/catalogo.controller");

const rotas = Router();
rotas.get("/agencias/publico", controller.listarPublico);
rotas.use(autenticar);
rotas.get("/agencias", controller.listar);
rotas.get("/trilhas/:trilhaId/progresso", controller.obterProgressoTrilha);
rotas.post("/inscricoes", controller.inscrever);
rotas.patch("/ativo", controller.ativar);
rotas.patch("/data-prova", controller.definirDataProva);

module.exports = rotas;
