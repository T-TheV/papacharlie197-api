const { Router } = require("express");
const autenticar = require("../../../middleware/autenticacao.middleware");
const progressoController = require("../controllers/progresso.controller");

const rotas = Router();

rotas.use(autenticar);

rotas.get("/missoes", progressoController.listarMissoes);

module.exports = rotas;
