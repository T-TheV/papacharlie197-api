require("dotenv").config();

if (!process.env.JWT_SEGREDO) {
  throw new Error("JWT_SEGREDO não definido no .env — configure antes de iniciar o servidor.");
}

module.exports = {
  porta: process.env.PORTA || 3333,
  ambiente: process.env.NODE_ENV || "development",
  jwtSegredo: process.env.JWT_SEGREDO,
  jwtExpiracao: process.env.JWT_EXPIRACAO || "7d",
};
