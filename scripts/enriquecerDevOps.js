"use strict";

require("dotenv").config();
require("../src/config/associacoes");

const { Op } = require("sequelize");
const { sequelize } = require("../src/config/configDB");
const Aula = require("../src/modulos/estudo/models/aula.model");
const { gerarConteudoDoVideo } = require("../src/modulos/admin/services/admin.service");

function argumento(nome, fallback = null) {
  const prefixo = `--${nome}=`;
  const valor = process.argv.find((item) => item.startsWith(prefixo));
  return valor ? valor.slice(prefixo.length) : fallback;
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function idsDasAulasDevOps() {
  const [linhas] = await sequelize.query(
    `SELECT a.id
       FROM aulas a
       JOIN modulos_trilhas mt ON mt.modulo_id=a.modulo_id
       JOIN trilhas t ON t.id=mt.trilha_id
       JOIN agencias ag ON ag.id=t.agencia_id
      WHERE ag.slug='engenharia-de-software' AND t.slug='devops'
        AND a.tipo_conteudo='youtube'
      ORDER BY a.modulo_id, a.ordem`,
  );
  return linhas.map((linha) => linha.id);
}

async function enriquecerComTentativas(aula, tentativas = 3) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      await gerarConteudoDoVideo(aula);
      return;
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa < tentativas) await esperar(tentativa * 4000);
    }
  }
  throw ultimoErro;
}

async function executar() {
  const forcar = process.argv.includes("--force");
  const limite = Number(argumento("limit", 0)) || null;
  const aulaId = Number(argumento("aula", 0)) || null;
  const atraso = Number(argumento("delay", 2500));
  const concorrencia = Math.max(1, Math.min(3, Number(argumento("concurrency", 1)) || 1));
  let ids = await idsDasAulasDevOps();
  if (aulaId) ids = ids.filter((id) => Number(id) === aulaId);
  if (limite) ids = ids.slice(0, limite);
  const aulas = await Aula.findAll({
    where: { id: { [Op.in]: ids } },
    order: [["modulo_id", "ASC"], ["ordem", "ASC"]],
  });

  const resultado = { total: aulas.length, enriquecidas: 0, ignoradas: 0, falhas: [] };
  let proximoIndice = 0;
  async function trabalhador() {
    while (proximoIndice < aulas.length) {
      const indice = proximoIndice;
      proximoIndice += 1;
      const aula = aulas[indice];
      if (!forcar && aula.transcricao_texto?.trim() && aula.mapa_mental_fonte === "ia") {
        resultado.ignoradas += 1;
        console.log(`[${indice + 1}/${aulas.length}] já enriquecida: ${aula.titulo}`);
        continue;
      }
      console.log(`[${indice + 1}/${aulas.length}] enriquecendo: ${aula.titulo}`);
      try {
        await enriquecerComTentativas(aula);
        resultado.enriquecidas += 1;
        console.log(`  ok: ${aula.titulo}`);
      } catch (erro) {
        resultado.falhas.push({ aulaId: aula.id, titulo: aula.titulo, erro: erro.message });
        console.error(`  falhou: ${erro.message}`);
      }
      if (proximoIndice < aulas.length && atraso > 0) await esperar(atraso);
    }
  }
  await Promise.all(Array.from({ length: concorrencia }, () => trabalhador()));

  console.log(JSON.stringify(resultado, null, 2));
  if (resultado.falhas.length) process.exitCode = 1;
}

executar()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
