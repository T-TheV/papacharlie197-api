const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODELO = process.env.GEMINI_MODELO || "gemini-2.5-flash";

function montarPrompt({ enunciado, criterios, respostaTexto }) {
  return `Você é um corretor de provas discursivas de concurso público brasileiro (banca FGV, cargo de Polícia Civil).

Sua tarefa é avaliar a resposta de um candidato ESTRITAMENTE com base nos critérios de avaliação fornecidos abaixo. Não use seu próprio conhecimento jurídico para julgar se algo está certo ou errado — use apenas os critérios dados. Se um critério não aparece na resposta do candidato, ele NÃO foi atendido, mesmo que a resposta esteja bem escrita ou pareça convincente. Não invente critérios que não estão na lista. Não elogie genericamente. Seja específico e rigoroso.

ENUNCIADO DA QUESTÃO:
"""
${enunciado}
"""

CRITÉRIOS DE AVALIAÇÃO (gabarito definido pelo professor):
"""
${criterios}
"""

RESPOSTA DO CANDIDATO:
"""
${respostaTexto}
"""

Responda em JSON válido com exatamente estas chaves:
{
  "pontosAtendidos": ["lista curta dos critérios que a resposta atendeu, cada item citando o critério"],
  "pontosFaltando": ["lista curta dos critérios que a resposta NÃO atendeu ou atendeu parcialmente"],
  "parecer": "2 a 4 frases objetivas, mencionando quantos critérios de quantos foram atendidos, sem elogio vazio"
}`;
}

async function avaliarRespostaDiscursiva({ enunciado, criterios, respostaTexto }) {
  if (!GEMINI_API_KEY) {
    const erro = new Error("Correção automática indisponível: GEMINI_API_KEY não configurada.");
    erro.status = 503;
    throw erro;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent?key=${GEMINI_API_KEY}`;

  const resposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: montarPrompt({ enunciado, criterios, respostaTexto }) }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    const erro = new Error("Falha ao consultar a IA de correção. Tente novamente em instantes.");
    erro.status = 502;
    erro.detalhe = detalhe;
    throw erro;
  }

  const dados = await resposta.json();
  const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textoGerado) {
    const erro = new Error("A IA não retornou uma avaliação válida. Tente novamente.");
    erro.status = 502;
    throw erro;
  }

  let avaliacao;
  try {
    avaliacao = JSON.parse(textoGerado);
  } catch {
    const erro = new Error("A IA retornou um formato inesperado. Tente novamente.");
    erro.status = 502;
    throw erro;
  }

  return {
    pontosAtendidos: Array.isArray(avaliacao.pontosAtendidos) ? avaliacao.pontosAtendidos : [],
    pontosFaltando: Array.isArray(avaliacao.pontosFaltando) ? avaliacao.pontosFaltando : [],
    parecer: typeof avaliacao.parecer === "string" ? avaliacao.parecer : "",
  };
}

module.exports = { avaliarRespostaDiscursiva };
