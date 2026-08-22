const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizarConfiguracao,
  minutosDisponiveis,
  selecionarAgenda,
} = require("../src/modulos/aprendizagem/services/agendaAdaptativa.service");

test("normaliza preferências dentro dos limites", () => {
  assert.deepEqual(normalizarConfiguracao({ minutosPorDia: 120, metaQuestoesPorSessao: 20 }), {
    minutosPorDia: 120,
    metaQuestoesPorSessao: 20,
    disponibilidadePorDia: {},
  });
  assert.equal(normalizarConfiguracao({ minutosPorDia: 999 }).minutosPorDia, 480);
});

test("respeita dias de estudo e disponibilidade específica", () => {
  const segunda = new Date(2026, 7, 24);
  assert.equal(minutosDisponiveis({ minutosPorDia: 90 }, segunda, [2, 4]), 0);
  assert.equal(minutosDisponiveis({ minutosPorDia: 90, disponibilidadePorDia: { 1: 45 } }, segunda, [2, 4]), 45);
});

test("monta agenda por prioridade sem ultrapassar o tempo disponível", () => {
  const resultado = selecionarAgenda([
    { tipo: "aula", titulo: "Aula", minutosEstimados: 75, prioridade: 80 },
    { tipo: "revisao", titulo: "Revisão", minutosEstimados: 15, prioridade: 100 },
    { tipo: "questoes", titulo: "Questões", minutosEstimados: 20, prioridade: 50 },
  ], 90);
  assert.equal(resultado.itens[0].tipo, "revisao");
  assert.equal(resultado.minutosPlanejados, 90);
  assert.equal(resultado.itens[1].minutosPlanejados, 75);
  assert.equal(resultado.minutosLivres, 0);
});
