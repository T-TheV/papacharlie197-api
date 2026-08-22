const test = require("node:test");
const assert = require("node:assert/strict");
const {
  textoLimpo,
  hashConteudoAula,
  normalizarMapaMental,
  criarMapaMentalBasico,
} = require("../src/modulos/estudo/services/mapaMental.util");

test("remove HTML do resumo sem juntar os conceitos", () => {
  assert.equal(
    textoLimpo("<p>Primeiro conceito.</p><ul><li>Regra principal</li><li>Exceção</li></ul>"),
    "Primeiro conceito.\n\nRegra principal\nExceção",
  );
});

test("monta um mapa inicial baseado na transcrição e nas atividades", () => {
  const mapa = criarMapaMentalBasico({
    titulo: "Inquérito policial",
    resumoTexto: "<p>A aula apresenta a finalidade do inquérito.</p>",
    transcricaoTexto: "O inquérito reúne elementos informativos. Ele busca esclarecer materialidade e autoria. A instauração pode ocorrer por diferentes formas. Os autos precisam ser organizados. O relatório encerra as diligências realizadas.",
    questoes: ["Qual é a finalidade do inquérito policial?"],
    discursivas: ["Explique a organização dos autos."],
  });
  assert.equal(mapa.titulo, "Inquérito policial");
  assert.ok(mapa.ramos.length >= 3);
  assert.ok(mapa.ramos.some((ramo) => ramo.resumo.includes("elementos informativos")));
});

test("aula curta ainda recebe um mapa com três ramos úteis", () => {
  const mapa = criarMapaMentalBasico({ titulo: "Tema curto", resumoTexto: "Uma síntese breve da aula." });
  assert.equal(mapa.ramos.length, 3);
});

test("normaliza e limita a estrutura retornada pela IA", () => {
  const mapa = normalizarMapaMental({
    titulo: "Tema",
    sintese: "Síntese",
    ramos: Array.from({ length: 8 }, (_, indice) => ({
      titulo: `Ramo ${indice}`,
      resumo: "Resumo",
      topicos: Array.from({ length: 8 }, (__, topico) => `Tópico ${topico}`),
    })),
  });
  assert.equal(mapa.ramos.length, 6);
  assert.equal(mapa.ramos[0].topicos.length, 5);
});

test("o hash muda quando a transcrição é atualizada", () => {
  const base = { titulo: "Aula", resumoTexto: "Resumo", transcricaoTexto: "Versão um" };
  assert.notEqual(hashConteudoAula(base), hashConteudoAula({ ...base, transcricaoTexto: "Versão dois" }));
});
