const { Router } = require("express");
const autenticar = require("../../../middleware/autenticacao.middleware");
const { exigirSuperadmin } = require("../../../middleware/autorizacao.middleware");
const adminController = require("../controllers/admin.controller");

const rotas = Router();

rotas.use(autenticar, exigirSuperadmin);

rotas.get("/conteudo", adminController.listarConteudo);

rotas.post("/modulos", adminController.criarModulo);
rotas.patch("/modulos/:id", adminController.atualizarModulo);
rotas.delete("/modulos/:id", adminController.excluirModulo);

rotas.post("/aulas", adminController.criarAula);
rotas.patch("/aulas/:id", adminController.atualizarAula);
rotas.delete("/aulas/:id", adminController.excluirAula);

rotas.post("/questoes", adminController.criarQuestao);
rotas.patch("/questoes/:id", adminController.atualizarQuestao);
rotas.delete("/questoes/:id", adminController.excluirQuestao);

rotas.post("/discursivas", adminController.criarDiscursiva);
rotas.patch("/discursivas/:id", adminController.atualizarDiscursiva);
rotas.delete("/discursivas/:id", adminController.excluirDiscursiva);

module.exports = rotas;
