const test = require("node:test");
const assert = require("node:assert/strict");
const { modulosDevOps } = require("../src/dados/catalogoDevOps");

test("catálogo DevOps possui currículo completo e vídeos únicos", () => {
  const aulas = modulosDevOps.flatMap((modulo) => modulo.aulas);
  const videos = aulas.filter((aula) => aula.tipo === "youtube");
  const laboratorios = aulas.filter((aula) => aula.tipo === "material");
  assert.equal(modulosDevOps.length, 12);
  assert.equal(aulas.length, 60);
  assert.equal(videos.length, 27);
  assert.equal(laboratorios.length, 33);
  assert.equal(new Set(videos.map((aula) => aula.videoId)).size, videos.length);
  assert.equal(new Set(modulosDevOps.map((modulo) => modulo.titulo)).size, modulosDevOps.length);
});

test("cada aula DevOps contém insumos para resumo, avaliação, mapa e material", () => {
  for (const modulo of modulosDevOps) {
    assert.match(modulo.referencia, /^https:\/\//);
    assert.equal(modulo.aulas.length, 5);
    for (const aula of modulo.aulas) {
      assert.ok(["youtube", "material"].includes(aula.tipo));
      if (aula.tipo === "youtube") assert.match(aula.videoId, /^[\w-]{11}$/);
      else {
        assert.ok(aula.entrega.length >= 40);
        assert.ok(aula.validacao.length >= 30);
      }
      assert.ok(aula.canal.length >= 3);
      assert.ok(aula.objetivo.length >= 60);
      assert.ok(aula.conceitos.length >= 4);
      assert.ok(aula.cenario.length >= 60);
      assert.ok(aula.decisao.length >= 60);
      if (aula.referencia) assert.match(aula.referencia, /^https:\/\//);
    }
  }
});
