const { Router } = require("express");
const autenticar = require("../../../middleware/autenticacao.middleware");
const estudoController = require("../controllers/estudo.controller");

const rotas = Router();

rotas.use(autenticar);

rotas.get("/modulos", estudoController.listarModulos);
rotas.get("/revisao", estudoController.listarRevisao);
rotas.get("/aulas/:id", estudoController.obterAula);
rotas.post("/questoes/:id/responder", estudoController.responderQuestao);
rotas.post("/discursivas/:id/responder", estudoController.responderDiscursiva);

module.exports = rotas;
