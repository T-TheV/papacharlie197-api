const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const armazenamento = multer.diskStorage({
  destination: path.resolve(__dirname, "..", "..", "uploads", "fotos-perfil"),
  filename(requisicao, arquivo, callback) {
    const sufixo = crypto.randomBytes(16).toString("hex");
    callback(null, `${sufixo}${path.extname(arquivo.originalname)}`);
  },
});

function filtroDeImagem(requisicao, arquivo, callback) {
  if (!arquivo.mimetype.startsWith("image/")) {
    return callback(new Error("Arquivo precisa ser uma imagem"));
  }
  callback(null, true);
}

const uploadFoto = multer({
  storage: armazenamento,
  fileFilter: filtroDeImagem,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = uploadFoto;
