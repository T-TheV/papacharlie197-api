const { Router } = require("express");
const autenticar = require("../../../middleware/autenticacao.middleware");
const controller = require("../controllers/aprendizagem.controller");

const rotas = Router();
rotas.use(autenticar);

rotas.get("/plano-hoje", controller.planoHoje);
rotas.patch("/plano-hoje/itens/:id", controller.atualizarItemPlano);
rotas.get("/preferencias", controller.obterPreferencias);
rotas.patch("/preferencias", controller.atualizarPreferencias);
rotas.get("/flashcards", controller.listarFlashcards);
rotas.post("/flashcards", controller.criarFlashcard);
rotas.post("/flashcards/gerar-erros", controller.gerarFlashcardsDosErros);
rotas.post("/aulas/:aulaId/flashcards/gerar", controller.gerarFlashcards);
rotas.patch("/flashcards/:id", controller.atualizarFlashcard);
rotas.post("/flashcards/:id/revisar", controller.revisarFlashcard);
rotas.get("/mapa-edital", controller.mapaEdital);
rotas.get("/evolucao", controller.evolucao);

module.exports = rotas;
