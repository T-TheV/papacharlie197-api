const { Router } = require("express");
const rotasAutenticacao = require("../modulos/autenticacao/routes/autenticacao.route");
const rotasEstudo = require("../modulos/estudo/routes/estudo.route");
const rotasAdmin = require("../modulos/admin/routes/admin.route");

const rotas = Router();

rotas.get("/health", (requisicao, resposta) => {
  resposta.json({ status: "ok", servico: "papa-charlie-197-backend" });
});

rotas.use("/auth", rotasAutenticacao);
rotas.use("/estudo", rotasEstudo);
rotas.use("/admin", rotasAdmin);

module.exports = rotas;
