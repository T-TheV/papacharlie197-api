const { Router } = require("express");
const { uploadLogo } = require("../../../middleware/upload.middleware");
const controller = require("../controllers/catalogoAdmin.controller");

const rotas = Router();
rotas.get("/agencias", controller.listar);
rotas.post("/agencias", controller.criarAgencia);
rotas.patch("/agencias/:id", controller.atualizarAgencia);
rotas.post("/agencias/:id/logo", uploadLogo.single("logo"), controller.enviarLogo);
rotas.post("/agencias/:id/padrao", controller.definirPadrao);
rotas.post("/agencias/:agenciaId/trilhas", controller.criarTrilha);
rotas.patch("/trilhas/:id", controller.atualizarTrilha);

module.exports = rotas;
