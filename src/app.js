const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const rotas = require("./routes/index.route");
const tratadorDeErro = require("./middleware/erro.middleware");
const configurarAssociacoes = require("./config/associacoes");
const { porta } = require("./config/ambiente");

class App {
  constructor() {
    configurarAssociacoes();
    this.express = express();
    this.middlewares();
    this.express.use(
      "/uploads",
      express.static(path.resolve(__dirname, "..", "uploads")),
    );
    this.express.use("/api", rotas);
    this.express.use(tratadorDeErro);
  }

  middlewares() {
    this.express.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    this.express.use(cors());
    this.express.use(express.json());
  }

  start() {
    return new Promise((resolve) => {
      this.servidor = this.express.listen(porta, () => {
        console.log(`Papa Charlie 197 backend rodando na porta ${porta}`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      this.servidor.close((erro) => (erro ? reject(erro) : resolve()));
    });
  }
}

module.exports = App;
