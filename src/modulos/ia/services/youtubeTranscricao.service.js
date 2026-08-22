const { YoutubeTranscript } = require("youtube-transcript");

function extrairVideoId(youtubeIframeUrl) {
  const match = youtubeIframeUrl?.match(/embed\/([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

async function buscarTranscricaoBruta(youtubeIframeUrl) {
  const videoId = extrairVideoId(youtubeIframeUrl);

  if (!videoId || videoId === "PLACEHOLDER_AULA") {
    const erro = new Error("Esta aula ainda não tem um vídeo real do YouTube cadastrado.");
    erro.status = 400;
    throw erro;
  }

  let segmentos;
  try {
    segmentos = await Promise.race([
      YoutubeTranscript.fetchTranscript(videoId, { lang: "pt" }),
      new Promise((_, rejeitar) => setTimeout(() => rejeitar(new Error("Tempo limite da transcrição excedido")), 30000)),
    ]);
  } catch {
    try {
      segmentos = await Promise.race([
        YoutubeTranscript.fetchTranscript(videoId),
        new Promise((_, rejeitar) => setTimeout(() => rejeitar(new Error("Tempo limite da transcrição excedido")), 30000)),
      ]);
    } catch (erroSemLang) {
      const erro = new Error(
        "Não foi possível obter a transcrição deste vídeo (pode não ter legendas disponíveis).",
      );
      erro.status = 502;
      erro.detalhe = erroSemLang.message;
      throw erro;
    }
  }

  if (!segmentos || segmentos.length === 0) {
    const erro = new Error("Este vídeo não tem legendas/transcrição disponível no YouTube.");
    erro.status = 404;
    throw erro;
  }

  return segmentos.map((s) => s.text).join(" ");
}

function formatarTranscricaoAutomatica(texto) {
  const limpo = String(texto || "")
    .replace(/\[(music|música|applause|aplausos)\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!limpo) return "";

  const frases = limpo.split(/(?<=[.!?])\s+/);
  const unidades = frases.length > 4 ? frases : limpo.split(" ");
  const paragrafos = [];
  let atual = "";
  for (const unidade of unidades) {
    const separador = atual ? " " : "";
    if (atual.length + separador.length + unidade.length > 900 && atual.length >= 450) {
      paragrafos.push(atual.trim());
      atual = unidade;
    } else {
      atual += `${separador}${unidade}`;
    }
  }
  if (atual.trim()) paragrafos.push(atual.trim());
  return paragrafos.join("\n\n");
}

module.exports = { buscarTranscricaoBruta, formatarTranscricaoAutomatica };
