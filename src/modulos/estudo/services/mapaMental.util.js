const { createHash } = require("node:crypto");

const ROTULOS_RAMOS = [
  "Ponto de partida",
  "Conceitos centrais",
  "Relações importantes",
  "Aplicação prática",
  "Síntese para revisão",
];
const VERSAO_ESTRUTURA = 2;

function textoLimpo(valor) {
  return String(valor || "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|ul|ol)>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<(?:p|div|h[1-6]|li|ul|ol)[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function limitar(texto, tamanho) {
  const limpo = textoLimpo(texto);
  if (limpo.length <= tamanho) return limpo;
  const cortado = limpo.slice(0, tamanho + 1);
  const ultimoEspaco = cortado.lastIndexOf(" ");
  return `${cortado.slice(0, ultimoEspaco > tamanho * 0.65 ? ultimoEspaco : tamanho).trim()}…`;
}

function hashConteudoAula({ titulo, resumoTexto, transcricaoTexto }) {
  return createHash("sha256")
    .update(`mapa-v${VERSAO_ESTRUTURA}\n${[titulo, resumoTexto, transcricaoTexto]
      .map((item) => String(item || "").trim()).join("\n---\n")}`)
    .digest("hex");
}

function extrairTrechos({ resumoTexto, transcricaoTexto, questoes = [], discursivas = [] }) {
  const fontePrincipal = textoLimpo(transcricaoTexto || resumoTexto);
  const blocos = fontePrincipal
    .split(/\n+|(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9])/)
    .map((trecho) => limitar(trecho, 190))
    .filter((trecho) => trecho.length >= 18);
  const complementos = [...questoes, ...discursivas]
    .map((item) => limitar(typeof item === "string" ? item : item?.enunciado, 170))
    .filter((trecho) => trecho.length >= 18);
  const vistos = new Set();
  return [...blocos, ...complementos].filter((trecho) => {
    const chave = trecho.toLocaleLowerCase("pt-BR").replace(/\W/g, "");
    if (!chave || vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  }).slice(0, 18);
}

function normalizarMapaMental(mapa, tituloFallback = "Mapa da aula") {
  const titulo = limitar(mapa?.titulo || tituloFallback, 100) || tituloFallback;
  const sintese = limitar(mapa?.sintese, 220);
  const ramos = (Array.isArray(mapa?.ramos) ? mapa.ramos : [])
    .map((ramo, indice) => ({
      id: `ramo-${indice + 1}`,
      titulo: limitar(ramo?.titulo || ROTULOS_RAMOS[indice] || `Tópico ${indice + 1}`, 70),
      resumo: limitar(ramo?.resumo, 180),
      topicos: (Array.isArray(ramo?.topicos) ? ramo.topicos : [])
        .map((topico) => limitar(typeof topico === "string" ? topico : topico?.texto, 180))
        .filter(Boolean)
        .slice(0, 5),
    }))
    .filter((ramo) => ramo.resumo || ramo.topicos.length)
    .slice(0, 6);
  return { versao: VERSAO_ESTRUTURA, titulo, sintese, ramos };
}

function criarMapaMentalBasico({ titulo, resumoTexto, transcricaoTexto, questoes = [], discursivas = [] }) {
  let trechos = extrairTrechos({ resumoTexto, transcricaoTexto, questoes, discursivas });
  if (trechos.length === 0) {
    trechos = [
      `A aula apresenta os fundamentos de ${titulo}.`,
      "Revise o resumo e os materiais para identificar conceitos, regras e aplicações.",
    ];
  }
  const apoios = [
    "Identifique no resumo as definições e ideias apresentadas pelo professor.",
    "Relacione o tema aos exemplos, regras ou aplicações mencionados na aula.",
    "Use as atividades e os materiais para revisar os pontos centrais.",
  ];
  while (trechos.length < 3) trechos.push(apoios[trechos.length]);
  const quantidadeRamos = Math.max(3, Math.min(5, Math.ceil(trechos.length / 3)));
  const tamanhoGrupo = Math.ceil(trechos.length / quantidadeRamos);
  const ramos = [];
  for (let indice = 0; indice < quantidadeRamos; indice += 1) {
    const grupo = trechos.slice(indice * tamanhoGrupo, (indice + 1) * tamanhoGrupo);
    if (!grupo.length) continue;
    ramos.push({
      titulo: ROTULOS_RAMOS[indice],
      resumo: grupo[0],
      topicos: grupo.slice(1),
    });
  }
  const resumoLimpo = textoLimpo(resumoTexto);
  return normalizarMapaMental({
    titulo,
    sintese: resumoLimpo ? limitar(resumoLimpo, 220) : `Estrutura de revisão da aula ${titulo}.`,
    ramos,
  }, titulo);
}

module.exports = {
  textoLimpo,
  hashConteudoAula,
  normalizarMapaMental,
  criarMapaMentalBasico,
};
