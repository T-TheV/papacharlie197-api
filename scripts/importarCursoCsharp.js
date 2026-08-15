"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { sequelize } = require("../src/config/configDB");
const configurarAssociacoes = require("../src/config/associacoes");
const Agencia = require("../src/modulos/catalogo/models/agencia.model");
const Trilha = require("../src/modulos/catalogo/models/trilha.model");
const Modulo = require("../src/modulos/estudo/models/modulo.model");
const Aula = require("../src/modulos/estudo/models/aula.model");
const ModuloTrilha = require("../src/modulos/catalogo/models/moduloTrilha.model");
const InscricaoTrilha = require("../src/modulos/catalogo/models/inscricaoTrilha.model");
const Matricula = require("../src/modulos/catalogo/models/matricula.model");
const Usuario = require("../src/modulos/autenticacao/models/usuario.model");
const AnexoAula = require("../src/modulos/estudo/models/anexoAula.model");
const curso = require("../src/dados/cursoCsharpUdemy");
const linksAulas = require("../src/dados/cursoCsharpUdemyLinks");

const SLUG_AGENCIA = "engenharia-de-software";
const SLUG_TRILHA = "desenvolvedor-csharp-dotnet";
const EMAIL_ALUNO = process.env.IMPORTAR_CURSO_EMAIL || "djardim322@gmail.com";
const PASTA_ANEXOS = path.resolve(__dirname, "..", "uploads", "anexos-aulas", "curso-csharp");

function arquivosPorAula() {
  if (!fs.existsSync(PASTA_ANEXOS)) return new Map();
  const mapa = new Map();
  for (const nome of fs.readdirSync(PASTA_ANEXOS)) {
    const separador = nome.indexOf("--");
    if (separador < 1) continue;
    const identificador = nome.slice(0, separador).replaceAll("_", "-");
    const chave = identificador.replace(/^curriculum-item-/, "curriculum-item-");
    const lista = mapa.get(chave) || [];
    lista.push(nome);
    mapa.set(chave, lista);
  }
  return mapa;
}

function nomeExibicaoArquivo(nome) {
  return nome.slice(nome.indexOf("--") + 2);
}

function validarMapeamentoCurriculo() {
  const chavesCurriculo = curso.secoes.flatMap((secao) => secao.aulas.map((aula) => aula.idExterno));
  const chavesMapeadas = Object.keys(linksAulas);
  const ausentes = chavesCurriculo.filter((chave) => !linksAulas[chave]);
  const extras = chavesMapeadas.filter((chave) => !chavesCurriculo.includes(chave));

  if (ausentes.length || extras.length || new Set(chavesCurriculo).size !== chavesCurriculo.length) {
    throw new Error(
      `Mapeamento Udemy inconsistente. Ausentes: ${ausentes.join(", ") || "nenhum"}. `
      + `Extras: ${extras.join(", ") || "nenhum"}.`,
    );
  }
}

async function executar() {
  validarMapeamentoCurriculo();
  configurarAssociacoes();
  await sequelize.authenticate();
  const anexosLocais = arquivosPorAula();
  let totalAulas = 0;
  let totalAnexos = 0;

  await sequelize.transaction(async (transaction) => {
    const [agencia] = await Agencia.findOrCreate({
      where: { slug: SLUG_AGENCIA },
      defaults: {
        nome: "Engenharia de Software",
        descricao: "Formação prática em desenvolvimento de software e tecnologia.",
        rotulo_trilha: "Trilha",
        logo_url: "/assets/agencias/engenharia-software.svg",
        cor_primaria: "#512BD4",
        cor_secundaria: "#201547",
        cor_fundo: "#F5F3FA",
        cor_superficie: "#FFFFFF",
        padrao_fundo: "academico",
        configuracao_tema: {},
        configuracao_estudo: {},
        padrao: false,
        ativa: true,
      },
      transaction,
    });
    await agencia.update({
      nome: "Engenharia de Software",
      descricao: "Formação prática em desenvolvimento de software e tecnologia.",
      rotulo_trilha: "Trilha",
      logo_url: "/assets/agencias/engenharia-software.svg",
      cor_primaria: "#512BD4",
      cor_secundaria: "#201547",
      cor_fundo: "#F5F3FA",
      cor_superficie: "#FFFFFF",
      padrao_fundo: "academico",
      ativa: true,
    }, { transaction });

    const [trilha] = await Trilha.findOrCreate({
      where: { agencia_id: agencia.id, slug: SLUG_TRILHA },
      defaults: {
        nome: "Desenvolvedor C#/.NET",
        nome_curto: "C#/.NET",
        descricao: curso.titulo,
        ordem: 1,
        ativa: true,
        configuracao_estudo: {},
      },
      transaction,
    });
    await trilha.update({
      nome: "Desenvolvedor C#/.NET",
      nome_curto: "C#/.NET",
      descricao: curso.titulo,
      ordem: 1,
      ativa: true,
    }, { transaction });

    for (const secao of curso.secoes) {
      const [modulo] = await Modulo.findOrCreate({
        where: { agencia_id: agencia.id, titulo: secao.titulo },
        defaults: {
          cor_destaque: "#512BD4",
          ordem: secao.ordem,
          cargos_alvo: [],
        },
        transaction,
      });
      await modulo.update({
        cor_destaque: "#512BD4",
        ordem: secao.ordem,
      }, { transaction });
      await ModuloTrilha.findOrCreate({
        where: { modulo_id: modulo.id, trilha_id: trilha.id },
        defaults: { modulo_id: modulo.id, trilha_id: trilha.id },
        transaction,
      });

      for (const item of secao.aulas) {
        const idExterno = `udemy:${item.idExterno}`;
        const urlExterna = linksAulas[item.idExterno];
        const dadosAula = {
          modulo_id: modulo.id,
          titulo: item.titulo,
          tipo_conteudo: item.tipoConteudo,
          youtube_iframe_url: null,
          provedor_externo: "Udemy",
          url_externa: urlExterna,
          id_externo: idExterno,
          duracao_video_segundos: item.tipoConteudo === "externo" && item.duracaoMinutos
            ? item.duracaoMinutos * 60
            : null,
          duracao_video_fonte: item.tipoConteudo === "externo" && item.duracaoMinutos
            ? "udemy_curriculo"
            : null,
          duracao_video_atualizada_em: item.tipoConteudo === "externo" && item.duracaoMinutos
            ? new Date()
            : null,
          resumo_texto: `<p>Conteúdo vinculado ao curso <strong>${curso.titulo}</strong>, hospedado na Udemy.</p>`,
          ordem: item.ordem,
        };
        let aula = await Aula.findOne({
          where: { provedor_externo: "Udemy", id_externo: idExterno },
          transaction,
        });
        if (aula) await aula.update(dadosAula, { transaction });
        else aula = await Aula.create(dadosAula, { transaction });
        totalAulas += 1;

        const prefixo = item.idExterno;
        const nomesArquivos = anexosLocais.get(prefixo) || [];
        for (const nomeArquivo of nomesArquivos) {
          const caminhoArquivo = `/uploads/anexos-aulas/curso-csharp/${encodeURIComponent(nomeArquivo)}`;
          const caminhoFisico = path.join(PASTA_ANEXOS, nomeArquivo);
          const stats = fs.statSync(caminhoFisico);
          await AnexoAula.findOrCreate({
            where: { aula_id: aula.id, caminho_arquivo: caminhoArquivo },
            defaults: {
              nome_original: nomeExibicaoArquivo(nomeArquivo),
              nome_exibicao: nomeExibicaoArquivo(nomeArquivo),
              mime_type: path.extname(nomeArquivo).toLowerCase() === ".pdf" ? "application/pdf" : "text/plain",
              tamanho_bytes: stats.size,
              origem: "udemy",
              ordem: totalAnexos,
            },
            transaction,
          });
          totalAnexos += 1;
        }
      }
    }

    const usuario = await Usuario.findOne({ where: { email: EMAIL_ALUNO }, transaction });
    if (usuario) {
      await InscricaoTrilha.findOrCreate({
        where: { usuario_id: usuario.id, trilha_id: trilha.id },
        defaults: { usuario_id: usuario.id, trilha_id: trilha.id },
        transaction,
      });
      const [matricula] = await Matricula.findOrCreate({
        where: { usuario_id: usuario.id, agencia_id: agencia.id },
        defaults: {
          trilha_id: trilha.id,
          ativa: false,
        },
        transaction,
      });
      if (!matricula.trilha_id) await matricula.update({ trilha_id: trilha.id }, { transaction });
    }
  });

  console.log(`Importação concluída: ${curso.secoes.length} módulos, ${totalAulas} aulas e ${totalAnexos} anexos locais.`);
}

executar()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
