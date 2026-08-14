const rateLimit = require("express-rate-limit");

const limitadorAutenticacao = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

module.exports = limitadorAutenticacao;
