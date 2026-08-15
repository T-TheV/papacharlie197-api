const test = require("node:test");
const assert = require("node:assert/strict");
const {
  REGRAS_PADRAO,
  calcularPlanoEstudo,
  criarEtapas,
  obterRegrasDoContexto,
} = require("../src/modulos/estudo/services/planejamentoEstudo.service");

test("calcula o exemplo de 42 minutos como 75 minutos e 3 ciclos", () => {
  const plano = calcularPlanoEstudo({
    duracaoVideoSegundos: 42 * 60,
    possuiVideo: true,
    quantidadeObjetivas: 6,
    quantidadeDiscursivas: 1,
  });

  assert.equal(plano.objetivas.minutos, 12);
  assert.equal(plano.discursivas.minutos, 12);
  assert.equal(plano.margem.minutos, 7);
  assert.equal(plano.totalEstimadoMinutos, 75);
  assert.equal(plano.quantidadeCiclos, 3);
  assert.deepEqual(
    plano.etapas.map(({ tipo, duracaoMinutos }) => [tipo, duracaoMinutos]),
    [["foco", 25], ["pausa", 5], ["foco", 25], ["pausa", 5], ["foco", 25]],
  );
});

test("usa fallback sinalizado quando o vídeo ainda não tem duração", () => {
  const plano = calcularPlanoEstudo({ possuiVideo: true, quantidadeObjetivas: 0, quantidadeDiscursivas: 0 });
  assert.equal(plano.estadoDuracao, "estimada");
  assert.equal(plano.video.minutos, REGRAS_PADRAO.fallbackVideoMinutos);
  assert.equal(plano.video.estimada, true);
});

test("trata aula sem vídeo e sem questões sem inventar uma sessão", () => {
  const plano = calcularPlanoEstudo({ possuiVideo: false });
  assert.equal(plano.estadoDuracao, "sem_video");
  assert.equal(plano.totalEstimadoMinutos, 0);
  assert.equal(plano.quantidadeCiclos, 0);
  assert.deepEqual(plano.etapas, []);
});

test("o último ciclo pode ser menor que 25 minutos", () => {
  assert.deepEqual(
    criarEtapas(55, REGRAS_PADRAO).map(({ tipo, duracaoMinutos }) => [tipo, duracaoMinutos]),
    [["foco", 25], ["pausa", 5], ["foco", 25], ["pausa", 5], ["foco", 5]],
  );
});

test("a configuração da trilha prevalece sobre a da agência", () => {
  const regras = obterRegrasDoContexto({
    agencia: { configuracao_estudo: { minutosQuestaoObjetiva: 3, pausaMinutos: 6 } },
    trilha: { configuracao_estudo: { minutosQuestaoObjetiva: 4 } },
  });
  assert.equal(regras.minutosQuestaoObjetiva, 4);
  assert.equal(regras.pausaMinutos, 6);
});
