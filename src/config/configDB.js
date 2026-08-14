const { Sequelize } = require("sequelize");
const configuracoes = require("./config");

const ambiente = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(configuracoes[ambiente]);

async function conectarBanco() {
  await sequelize.authenticate();
  console.log("Conexão com o PostgreSQL estabelecida.");
}

module.exports = {
  sequelize,
  conectarBanco,
};
