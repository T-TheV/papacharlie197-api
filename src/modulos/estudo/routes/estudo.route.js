const { Router } = require("express");
const autenticar = require("../../../middleware/autenticacao.middleware");
const estudoController = require("../controllers/estudo.controller");

const rotas = Router();

rotas.use(autenticar);

rotas.get("/modulos", estudoController.listarModulos);
rotas.get("/revisao", estudoController.listarRevisao);
rotas.get("/aulas/:id", estudoController.obterAula);
rotas.post("/aulas/:id/mapa-mental/aprimorar", estudoController.aprimorarMapaMental);
rotas.get("/aulas/:id/sessoes/ativa", estudoController.obterSessaoAtiva);
rotas.post("/aulas/:id/sessoes", estudoController.criarSessaoEstudo);
rotas.patch("/aulas/:id/duracao-video", estudoController.registrarDuracaoVideo);
rotas.patch("/sessoes/:id/iniciar", estudoController.iniciarSessao);
rotas.patch("/sessoes/:id/interromper", estudoController.interromperSessao);
rotas.patch("/sessoes/:id/progresso", estudoController.registrarProgressoSessao);
rotas.patch("/sessoes/:id/concluir", estudoController.concluirSessao);
rotas.post("/questoes/:id/responder", estudoController.responderQuestao);
rotas.patch("/aulas/:id/concluir", estudoController.alternarConclusaoAula);
rotas.post("/aulas/:id/reportar-erro", estudoController.reportarErroAula);
rotas.post("/discursivas/:id/responder", estudoController.responderDiscursiva);
rotas.get("/banco-questoes/modulos", estudoController.listarModulosBanco);
rotas.get("/banco-questoes", estudoController.listarBancoQuestoes);
rotas.post("/banco-questoes/:id/responder", estudoController.responderQuestaoBanco);
rotas.get("/simulado/gerar", estudoController.gerarSimulado);
rotas.post("/simulado/corrigir", estudoController.corrigirSimulado);
rotas.get("/mensagem-do-dia", estudoController.obterMensagemDoDia);

module.exports = rotas;
