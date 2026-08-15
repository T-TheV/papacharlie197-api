const { Router } = require("express");
const autenticar = require("../../../middleware/autenticacao.middleware");
const { exigirSuperadmin } = require("../../../middleware/autorizacao.middleware");
const adminController = require("../controllers/admin.controller");
const rotasCatalogoAdmin = require("../../catalogo/routes/catalogoAdmin.route");
const { uploadAnexoAula } = require("../../../middleware/upload.middleware");

const rotas = Router();

rotas.use(autenticar, exigirSuperadmin);
rotas.use("/catalogo", rotasCatalogoAdmin);

rotas.get("/conteudo", adminController.listarConteudo);

rotas.get("/relatorios-erro", adminController.listarRelatoriosErro);
rotas.patch("/relatorios-erro/:id", adminController.atualizarStatusRelatorioErro);

rotas.post("/modulos", adminController.criarModulo);
rotas.patch("/modulos/:id", adminController.atualizarModulo);
rotas.delete("/modulos/:id", adminController.excluirModulo);

rotas.post("/aulas", adminController.criarAula);
rotas.patch("/aulas/:id", adminController.atualizarAula);
rotas.delete("/aulas/:id", adminController.excluirAula);
rotas.post("/aulas/:id/anexos", uploadAnexoAula.single("arquivo"), adminController.criarAnexoArquivo);
rotas.post("/aulas/:id/anexos/link", adminController.criarAnexoLink);
rotas.delete("/anexos/:id", adminController.excluirAnexo);

rotas.post("/questoes", adminController.criarQuestao);
rotas.patch("/questoes/:id", adminController.atualizarQuestao);
rotas.delete("/questoes/:id", adminController.excluirQuestao);
rotas.post("/questoes/:id/gerar-variacoes", adminController.gerarVariacoesComIa);

rotas.post("/discursivas", adminController.criarDiscursiva);
rotas.patch("/discursivas/:id", adminController.atualizarDiscursiva);
rotas.delete("/discursivas/:id", adminController.excluirDiscursiva);

module.exports = rotas;
