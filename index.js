const App = require("./src/app");

const app = new App();

app.start().catch((erro) => {
  console.error("Erro ao inicializar o servidor:", erro);
  process.exit(1);
});

let encerrando = false;
async function encerrar(sinal) {
  if (encerrando) return;
  encerrando = true;
  try {
    await app.stop();
    process.exit(0);
  } catch (erro) {
    console.error(`Erro ao encerrar após ${sinal}:`, erro);
    process.exit(1);
  }
}

process.on("SIGTERM", () => encerrar("SIGTERM"));
process.on("SIGINT", () => encerrar("SIGINT"));
