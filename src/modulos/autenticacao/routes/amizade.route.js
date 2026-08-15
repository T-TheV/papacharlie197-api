const { Router } = require("express");
const autenticar = require("../../../middleware/autenticacao.middleware");
const amizadeController = require("../controllers/amizade.controller");

const rotas = Router();

rotas.use(autenticar);

rotas.get("/buscar", amizadeController.buscarUsuarios);
rotas.get("/amigos", amizadeController.listarAmigos);
rotas.get("/solicitacoes", amizadeController.listarSolicitacoesPendentes);
rotas.post("/solicitar", amizadeController.solicitarAmizade);
rotas.post("/:id/aceitar", amizadeController.aceitarSolicitacao);
rotas.delete("/:id/recusar", amizadeController.recusarOuCancelar);
rotas.get("/amigos/:amigoId/perfil", amizadeController.obterPerfilDeAmigo);
rotas.delete("/amigos/:amigoId", amizadeController.desfazerAmizade);
rotas.get("/ranking-semanal", amizadeController.obterRankingSemanal);

module.exports = rotas;
