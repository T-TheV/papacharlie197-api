const test = require("node:test");
const assert = require("node:assert/strict");
const { Op } = require("sequelize");
const {
  modulosComplementaresEscrivao,
  flashcardsPoliciaCivil,
} = require("../src/dados/catalogoPoliciaCivil");
const {
  encontrarAulaParaContinuar,
} = require("../src/modulos/progresso/services/gamificacao.service");
const {
  escopoFlashcardsWhere,
} = require("../src/modulos/aprendizagem/services/flashcardsCatalogo.service");

test("o complemento de Escrivão contém três módulos e dezoito aulas exercitáveis", () => {
  assert.equal(modulosComplementaresEscrivao.length, 3);
  assert.equal(modulosComplementaresEscrivao.reduce((total, modulo) => total + modulo.aulas.length, 0), 18);
  for (const modulo of modulosComplementaresEscrivao) {
    for (const aula of modulo.aulas) {
      assert.equal(aula.objetiva.alternativas.length, 4);
      assert.match(aula.objetiva.correta, /^[a-d]$/);
      assert.ok(aula.discursiva.length >= 20);
    }
  }
});

test("o catálogo possui flashcards únicos comuns e específicos por trilha", () => {
  assert.equal(flashcardsPoliciaCivil.length, 66);
  assert.equal(new Set(flashcardsPoliciaCivil.map((card) => card.chaveOrigem)).size, 66);
  assert.ok(flashcardsPoliciaCivil.some((card) => card.trilhaSlug === null));
  assert.ok(flashcardsPoliciaCivil.some((card) => card.trilhaSlug === "escrivao"));
  assert.ok(flashcardsPoliciaCivil.some((card) => card.trilhaSlug === "delegado"));
});

test("ao trocar de trilha, libera a primeira aula ainda não concluída", () => {
  const aulas = [{ id: 10 }, { id: 20 }, { id: 30 }];
  const progressos = [
    { aula_id: 10, status: "concluido" },
    { aula_id: 20, status: "concluido" },
  ];
  assert.equal(encontrarAulaParaContinuar(aulas, progressos).id, 30);
});

test("não abre outra aula quando já existe uma aula visível em andamento", () => {
  const aulas = [{ id: 10 }, { id: 20 }, { id: 30 }];
  const progressos = [
    { aula_id: 10, status: "concluido" },
    { aula_id: 20, status: "em_andamento" },
  ];
  assert.equal(encontrarAulaParaContinuar(aulas, progressos), null);
});

test("flashcards comuns e da trilha ativa compartilham o mesmo escopo de leitura", () => {
  const where = escopoFlashcardsWhere({ agenciaId: 1, trilhaId: 2 });
  assert.equal(where.agencia_id, 1);
  assert.deepEqual(where[Op.or], [{ trilha_id: 2 }, { trilha_id: null }]);
  assert.deepEqual(
    escopoFlashcardsWhere({ agenciaId: 1, trilhaId: null }),
    { agencia_id: 1, trilha_id: null },
  );
});
