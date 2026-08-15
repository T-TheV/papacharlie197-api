const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const rotas = require("./routes/index.route");
const tratadorDeErro = require("./middleware/erro.middleware");
const configurarAssociacoes = require("./config/associacoes");
const { porta, origensCors } = require("./config/ambiente");
const { conectarBanco, sequelize } = require("./config/configDB");
const fs = require("fs");

class App {
  constructor() {
    configurarAssociacoes();
    fs.mkdirSync(path.resolve(__dirname, "..", "uploads", "fotos-perfil"), { recursive: true });
    fs.mkdirSync(path.resolve(__dirname, "..", "uploads", "logos-agencias"), { recursive: true });
    fs.mkdirSync(path.resolve(__dirname, "..", "uploads", "anexos-aulas"), { recursive: true });
    this.express = express();
    this.middlewares();
    this.express.use(
      "/uploads",
      express.static(path.resolve(__dirname, "..", "uploads")),
    );
    this.express.use("/assets", express.static(path.resolve(__dirname, "assets")));
    this.express.use("/api", rotas);
    this.express.use(tratadorDeErro);
  }

  middlewares() {
    this.express.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    this.express.set("trust proxy", 1);
    this.express.use(
      cors({
        origin(origem, callback) {
          if (!origem || origensCors.includes(origem)) return callback(null, true);
          return callback(new Error("Origem não permitida pelo CORS"));
        },
        credentials: true,
      }),
    );
    this.express.use(express.json({ limit: "1mb" }));
  }

  async start() {
    await conectarBanco();
    return new Promise((resolve) => {
      this.servidor = this.express.listen(porta, () => {
        console.log(`Papa Charlie 197 backend rodando na porta ${porta}`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      this.servidor.close(async (erro) => {
        if (erro) return reject(erro);
        await sequelize.close();
        resolve();
      });
    });
  }
}

module.exports = App;
