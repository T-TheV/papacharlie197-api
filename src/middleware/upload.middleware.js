const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

function criarArmazenamento(pasta) {
  return multer.diskStorage({
    destination: path.resolve(__dirname, "..", "..", "uploads", pasta),
    filename(requisicao, arquivo, callback) {
      const sufixo = crypto.randomBytes(16).toString("hex");
      callback(null, `${sufixo}${path.extname(arquivo.originalname).toLowerCase()}`);
    },
  });
}

function filtroDeImagem(requisicao, arquivo, callback) {
  const permitidos = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!permitidos.has(arquivo.mimetype)) {
    const erro = new Error("Use uma imagem JPG, PNG ou WebP");
    erro.status = 400;
    return callback(erro);
  }
  callback(null, true);
}

const uploadFoto = multer({
  storage: criarArmazenamento("fotos-perfil"),
  fileFilter: filtroDeImagem,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadLogo = multer({
  storage: criarArmazenamento("logos-agencias"),
  fileFilter: filtroDeImagem,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function filtroDeAnexo(requisicao, arquivo, callback) {
  const extensao = path.extname(arquivo.originalname).toLowerCase();
  const extensoesPermitidas = new Set([
    ".pdf", ".txt", ".md", ".csv", ".zip", ".rar", ".7z",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".jpg", ".jpeg", ".png", ".webp", ".json", ".xml",
    ".cs", ".sln", ".csproj",
  ]);
  if (!extensoesPermitidas.has(extensao)) {
    const erro = new Error("Formato de anexo não permitido");
    erro.status = 400;
    return callback(erro);
  }
  callback(null, true);
}

const uploadAnexoAula = multer({
  storage: criarArmazenamento("anexos-aulas"),
  fileFilter: filtroDeAnexo,
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = uploadFoto;
module.exports.uploadLogo = uploadLogo;
module.exports.uploadAnexoAula = uploadAnexoAula;
