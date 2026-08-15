const { Router } = require("express");
const rotasAutenticacao = require("../modulos/autenticacao/routes/autenticacao.route");
const rotasEstudo = require("../modulos/estudo/routes/estudo.route");
const rotasAdmin = require("../modulos/admin/routes/admin.route");
const rotasProgresso = require("../modulos/progresso/routes/progresso.route");
const rotasAmizade = require("../modulos/autenticacao/routes/amizade.route");
const rotasCatalogo = require("../modulos/catalogo/routes/catalogo.route");
const { sequelize } = require("../config/configDB");

const rotas = Router();

rotas.get("/health", async (requisicao, resposta) => {
  try {
    await sequelize.authenticate();
    resposta.json({ status: "ok", servico: "papa-charlie-197-backend", banco: "ok" });
  } catch {
    resposta.status(503).json({ status: "indisponivel", servico: "papa-charlie-197-backend", banco: "erro" });
  }
});

rotas.use("/auth", rotasAutenticacao);
rotas.use("/estudo", rotasEstudo);
rotas.use("/admin", rotasAdmin);
rotas.use("/progresso", rotasProgresso);
rotas.use("/social", rotasAmizade);
rotas.use("/catalogo", rotasCatalogo);

module.exports = rotas;
