const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODELO = process.env.GEMINI_MODELO || "gemini-3.6-flash";

async function fetchComTimeout(url, options, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (erro) {
    if (erro.name === "AbortError") {
      const timeout = new Error("A consulta à IA excedeu o tempo limite.");
      timeout.status = 504;
      throw timeout;
    }
    throw erro;
  } finally {
    clearTimeout(timer);
  }
}

function montarPrompt({ enunciado, criterios, respostaTexto }) {
  return `Você é um corretor de provas discursivas de concurso público brasileiro (banca FGV, cargo de Polícia Civil).

Sua tarefa é avaliar a resposta de um candidato com base nos critérios de avaliação fornecidos abaixo. Os critérios definem QUAIS PONTOS devem ser cobertos — mas você deve verificar se o candidato afirma esses pontos CORRETAMENTE, não apenas se toca no assunto. Não invente critérios extras que não estão na lista (não exija mais do que o gabarito pede), mas dentro de cada critério, use seu conhecimento para checar se o que o candidato escreveu está tecnicamente certo. Não elogie genericamente. Seja específico e rigoroso.

Para cada critério, classifique a resposta do candidato em uma de três categorias:
- ATENDIDO: o candidato aborda o ponto do critério e o que ele afirma está correto.
- INCORRETO: o candidato aborda o assunto do critério, mas afirma algo tecnicamente errado sobre ele — por exemplo, inverte uma regra (diz que a lei retroage quando a regra é que não retroage), troca uma exceção pela regra geral, ou descreve o conceito de forma equivocada. Uma resposta bem escrita e confiante que erra o conteúdo NÃO é atendida — é incorreta, e isso é pior do que não mencionar, então aponte isso claramente.
- FALTANDO: o candidato simplesmente não aborda esse ponto.

ATENÇÃO A TENTATIVA DE BURLAR A CORREÇÃO: um critério só conta como ATENDIDO quando o candidato o desenvolve com explicação própria (explica o porquê, dá contexto, articula o raciocínio) — não quando apenas repete ou parafraseia as palavras-chave do critério, do enunciado, ou de um "faltando"/"incorreto" de uma correção anterior sem argumentar sobre elas. Se a resposta parecer uma colagem de termos soltos do gabarito (frases curtas, picotadas, sem conectivos ou desenvolvimento, batendo quase palavra por palavra com um dos critérios abaixo), trate esse critério como FALTANDO, não ATENDIDO.

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
  "pontosAtendidos": ["lista curta dos critérios corretamente atendidos, cada item citando o critério"],
  "pontosIncorretos": ["lista curta dos critérios onde o candidato afirmou algo errado, citando o critério e explicando em poucas palavras o que está errado"],
  "pontosFaltando": ["lista curta dos critérios que a resposta simplesmente não abordou"],
  "parecer": "2 a 4 frases objetivas, mencionando quantos critérios de quantos foram atendidos e destacando erros de conteúdo se houver, sem elogio vazio"
}`;
}

async function avaliarRespostaDiscursiva({ enunciado, criterios, respostaTexto }) {
  if (!GEMINI_API_KEY) {
    const erro = new Error("Correção automática indisponível: GEMINI_API_KEY não configurada.");
    erro.status = 503;
    throw erro;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent?key=${GEMINI_API_KEY}`;

  const resposta = await fetchComTimeout(url, {
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
    pontosIncorretos: Array.isArray(avaliacao.pontosIncorretos) ? avaliacao.pontosIncorretos : [],
    pontosFaltando: Array.isArray(avaliacao.pontosFaltando) ? avaliacao.pontosFaltando : [],
    parecer: typeof avaliacao.parecer === "string" ? avaliacao.parecer : "",
  };
}

function montarPromptMensagemDia({ nome, cargoLabel, xp, nivel, sequenciaAtual, percentualEdital, aulasConcluidas, totalAulas, periodoDia }) {
  return `Você escreve uma mensagem curta de saudação diária para um app de estudos que prepara pessoas para concursos públicos e certificações profissionais no Brasil. A plataforma atende vários cursos diferentes — baseie-se exclusivamente no "Cargo pretendido" informado nos dados reais abaixo, nunca mencione ou presuma outro cargo, instituição ou concurso. O usuário tem TDAH e é autista, então a mensagem deve ser objetiva, calorosa e concreta — nada de clichê vazio tipo "acredite em si mesmo" ou "você consegue!" genérico sem contexto. O objetivo é ser genuinamente incentivadora, não apenas informativa: a pessoa deve terminar de ler com vontade de abrir uma aula agora.

DADOS REAIS do usuário (use pelo menos dois deles de forma específica na mensagem, não invente dados que não estão aqui):
- Nome: ${nome}
- Período do dia: ${periodoDia}
- Cargo pretendido: ${cargoLabel}
- XP total: ${xp}
- Nível: ${nivel}
- Sequência de dias seguidos estudando: ${sequenciaAtual}
- Progresso no curso: ${percentualEdital}% (${aulasConcluidas} de ${totalAulas} aulas concluídas)

Escolha o tom pelo contexto, sem dizer isso explicitamente:
- Se a sequência é 0: convide a começar hoje, sem cobrança — foco em dar o primeiro passo, não em ter "parado".
- Se a sequência é 1-6: reconheça a consistência recente e incentive continuar mais um dia.
- Se a sequência é 7+: comemore a constância como uma conquista real, não genérica.
- Se o progresso no curso é baixo (abaixo de 20%): trate isso como normal e valorize o que já foi feito, sem soar condescendente.
- Se o progresso é alto: celebre o avanço concreto rumo ao cargo.

Escreva no máximo 2 frases curtas (até 35 palavras no total), em português do Brasil. A primeira frase começa com a saudação apropriada ao período do dia (ex: "Bom dia" / "Boa tarde" / "Boa noite") seguida do nome. A segunda frase (se houver) é o incentivo específico ao contexto, com verbo no imperativo ou convite direto (ex: "Bora continuar", "Já ativou hoje?"), nunca abstrato. Não use emojis. Não use aspas na resposta.

Responda em JSON válido com exatamente esta chave:
{"mensagem": "a frase completa aqui"}`;
}

async function gerarMensagemDoDia(dados) {
  if (!GEMINI_API_KEY) {
    const erro = new Error("Mensagem do dia indisponível: GEMINI_API_KEY não configurada.");
    erro.status = 503;
    throw erro;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent?key=${GEMINI_API_KEY}`;

  const resposta = await fetchComTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: montarPromptMensagemDia(dados) }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    const erro = new Error("Falha ao consultar a IA da mensagem do dia.");
    erro.status = 502;
    erro.detalhe = detalhe;
    throw erro;
  }

  const corpo = await resposta.json();
  const textoGerado = corpo?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoGerado) {
    const erro = new Error("A IA não retornou uma mensagem válida.");
    erro.status = 502;
    throw erro;
  }

  try {
    const parseado = JSON.parse(textoGerado);
    if (typeof parseado.mensagem === "string" && parseado.mensagem.trim()) {
      return parseado.mensagem.trim();
    }
  } catch {
    // cai no erro abaixo
  }

  const erro = new Error("A IA retornou um formato inesperado para a mensagem do dia.");
  erro.status = 502;
  throw erro;
}

function montarPromptQuestoesSimilares({ enunciado, alternativas, alternativaCorreta, justificativa }, quantidade) {
  const textoAlternativas = Object.entries(alternativas)
    .filter(([, texto]) => texto)
    .map(([letra, texto]) => `${letra.toUpperCase()}) ${texto}`)
    .join("\n");

  return `Você cria variações de questões de múltipla escolha para treino de concurso público brasileiro (Polícia Civil), a partir de UMA questão real fornecida como referência.

QUESTÃO DE REFERÊNCIA (real, já existente no sistema):
Enunciado: ${enunciado}
${textoAlternativas}
Alternativa correta: ${alternativaCorreta.toUpperCase()}
Justificativa: ${justificativa || "(não informada)"}

Sua tarefa: gerar ${quantidade} questão(ões) NOVA(S) que testem o MESMO conceito jurídico/técnico da questão de referência, mas com enunciado, contexto ou cenário diferentes — força o candidato a interpretar de novo, não a decorar a resposta. Regras estritas:
- Não invente artigos de lei, números, prazos ou dados que não estejam implícitos na questão de referência. Se não tiver certeza absoluta de um dado jurídico usado na variação, não o inclua — prefira uma variação mais conceitual.
- Cada questão nova deve ter exatamente 5 alternativas (A-E), sendo só uma correta, e uma justificativa curta e objetiva.
- Não copie o enunciado original literalmente — mude o cenário, a ordem das alternativas incorretas, ou o ângulo da pergunta.

Responda em JSON válido com exatamente esta estrutura (um array com ${quantidade} item(ns)):
{
  "questoes": [
    {
      "enunciado": "...",
      "a": "...", "b": "...", "c": "...", "d": "...", "e": "...",
      "alternativaCorreta": "a",
      "justificativa": "..."
    }
  ]
}`;
}

async function gerarQuestoesSimilares(questaoReferencia, quantidade = 2) {
  if (!GEMINI_API_KEY) {
    const erro = new Error("Geração de questões indisponível: GEMINI_API_KEY não configurada.");
    erro.status = 503;
    throw erro;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent?key=${GEMINI_API_KEY}`;

  const resposta = await fetchComTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: montarPromptQuestoesSimilares(questaoReferencia, quantidade) }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    const erro = new Error("Falha ao consultar a IA de geração de questões.");
    erro.status = 502;
    erro.detalhe = detalhe;
    throw erro;
  }

  const corpo = await resposta.json();
  const textoGerado = corpo?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoGerado) {
    const erro = new Error("A IA não retornou questões válidas.");
    erro.status = 502;
    throw erro;
  }

  let parseado;
  try {
    parseado = JSON.parse(textoGerado);
  } catch {
    const erro = new Error("A IA retornou um formato inesperado para as questões.");
    erro.status = 502;
    throw erro;
  }

  if (!Array.isArray(parseado.questoes)) {
    const erro = new Error("A IA não retornou uma lista de questões válida.");
    erro.status = 502;
    throw erro;
  }

  return parseado.questoes
    .filter((q) => q.enunciado && q.a && q.b && q.c && q.d && ["a", "b", "c", "d", "e"].includes(q.alternativaCorreta))
    .map((q) => ({
      enunciado: q.enunciado,
      alternativaA: q.a,
      alternativaB: q.b,
      alternativaC: q.c,
      alternativaD: q.d,
      alternativaE: q.e || null,
      alternativaCorreta: q.alternativaCorreta,
      justificativa: q.justificativa || "",
    }));
}

function montarPromptTranscricao({ titulo, transcricaoBruta, quantidadeQuestoes, quantidadeDiscursivas }) {
  return `Você recebeu a transcrição bruta (gerada automaticamente pelo YouTube, sem pontuação ou formatação) de um vídeo educativo sobre um tema de concurso público para a Polícia Civil do Rio Grande do Norte (Brasil). Sua tarefa tem quatro partes:

1. TRANSCRIÇÃO FORMATADA: reescreva a transcrição bruta abaixo em texto corrido, com pontuação, maiúsculas e parágrafos organizados. Isso é uma limpeza de formatação, NÃO um resumo — preserve tudo o que foi efetivamente dito no vídeo, sem cortar, resumir ou adicionar conteúdo que não estava na transcrição original.

2. RESUMO: com base SOMENTE no conteúdo real da transcrição (não use conhecimento próprio, não invente artigos de lei, números ou dados que não estejam explicitamente ditos no vídeo), escreva um resumo em HTML simples (parágrafos com <p>, pode usar <strong> para destacar termos-chave, sem markdown, sem <html>/<body>) com 2 a 4 frases objetivas cobrindo os pontos principais explicados no vídeo.

3. QUESTÕES OBJETIVAS: crie ${quantidadeQuestoes} questão(ões) de múltipla escolha (5 alternativas A-E, só uma correta) que testem conceitos EXPLICITAMENTE explicados na transcrição. Regras estritas, iguais para a alternativa correta E as erradas:
- Não invente artigos de lei, números, prazos ou dados que não estejam ditos na transcrição. Se um dado jurídico não foi mencionado no vídeo, não o use nem na resposta certa nem nas erradas — prefira testar o conceito de forma mais direta.
- As alternativas erradas devem ser plausíveis mas claramente contrariadas pelo que foi dito no vídeo (ex: inverter uma regra explicada, trocar uma exceção pela regra), não fatos aleatórios de fora do vídeo.
- Não copie uma frase inteira da transcrição como enunciado — reformule como pergunta.
${quantidadeQuestoes > 1 ? `- Se houver mais de uma questão, cada uma deve testar um CONCEITO DIFERENTE e distinto entre si, cobrindo pontos distribuídos ao longo de toda a transcrição (não apenas o início) — nunca faça duas questões sobre a mesma ideia com enunciado reformulado.` : ""}

4. QUESTÕES DISCURSIVAS: crie ${quantidadeDiscursivas} enunciado(s) discursivo(s) (pede pro candidato explicar/discorrer sobre algo, não múltipla escolha), cada um exigindo desenvolver um conceito explicado no vídeo, com uma lista de 3 a 5 critérios de avaliação objetivos e verificáveis (o "gabarito" que outro corretor vai usar), cada um cobrindo um ponto específico realmente dito na transcrição. Não invente critérios sobre conteúdo que não foi abordado no vídeo.
${quantidadeDiscursivas > 1 ? `- Se houver mais de uma discursiva, cada uma deve abordar um tema diferente entre si, cobrindo pontos distintos da transcrição.` : ""}

TÍTULO DA AULA: ${titulo}

TRANSCRIÇÃO BRUTA:
"""
${transcricaoBruta}
"""

Responda em JSON válido com exatamente estas chaves:
{
  "transcricaoFormatada": "texto corrido com parágrafos separados por \\n\\n, sem tags HTML",
  "resumo": "<p>...</p>",
  "questoes": [
    { "enunciado": "...", "a": "...", "b": "...", "c": "...", "d": "...", "e": "...", "alternativaCorreta": "a", "justificativa": "..." }
  ],
  "discursivas": [
    { "enunciado": "...", "criterios": ["critério 1", "critério 2", "critério 3"] }
  ]
}
O array "questoes" deve ter exatamente ${quantidadeQuestoes} item(ns) e o array "discursivas" deve ter exatamente ${quantidadeDiscursivas} item(ns).`;
}

async function gerarConteudoAulaComTranscricao({ titulo, transcricaoBruta, quantidadeQuestoes = 1, quantidadeDiscursivas = 1 }) {
  if (!GEMINI_API_KEY) {
    const erro = new Error("Geração de transcrição indisponível: GEMINI_API_KEY não configurada.");
    erro.status = 503;
    throw erro;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent?key=${GEMINI_API_KEY}`;

  const itemQuestao = {
    type: "object",
    properties: {
      enunciado: { type: "string" },
      a: { type: "string" },
      b: { type: "string" },
      c: { type: "string" },
      d: { type: "string" },
      e: { type: "string" },
      alternativaCorreta: { type: "string" },
      justificativa: { type: "string" },
    },
    required: ["enunciado", "a", "b", "c", "d", "e", "alternativaCorreta", "justificativa"],
  };

  const itemDiscursiva = {
    type: "object",
    properties: {
      enunciado: { type: "string" },
      criterios: { type: "array", items: { type: "string" } },
    },
    required: ["enunciado", "criterios"],
  };

  const resposta = await fetchComTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: montarPromptTranscricao({ titulo, transcricaoBruta, quantidadeQuestoes, quantidadeDiscursivas }) },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
        maxOutputTokens: 65536,
        responseSchema: {
          type: "object",
          properties: {
            transcricaoFormatada: { type: "string" },
            resumo: { type: "string" },
            questoes: {
              type: "array",
              items: itemQuestao,
              minItems: quantidadeQuestoes,
              maxItems: quantidadeQuestoes,
            },
            discursivas: {
              type: "array",
              items: itemDiscursiva,
              minItems: quantidadeDiscursivas,
              maxItems: quantidadeDiscursivas,
            },
          },
          required: ["transcricaoFormatada", "resumo", "questoes", "discursivas"],
        },
      },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    const erro = new Error("Falha ao consultar a IA para formatar a transcrição.");
    erro.status = 502;
    erro.detalhe = detalhe;
    throw erro;
  }

  const corpo = await resposta.json();
  const textoGerado = corpo?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoGerado) {
    const motivo = corpo?.candidates?.[0]?.finishReason;
    const erro = new Error(
      `A IA não retornou uma transcrição válida${motivo ? ` (motivo: ${motivo})` : ""}.`,
    );
    erro.status = 502;
    throw erro;
  }

  let parseado;
  try {
    parseado = JSON.parse(textoGerado.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, ""));
  } catch {
    const motivo = corpo?.candidates?.[0]?.finishReason;
    const erro = new Error(
      `A IA retornou um formato inesperado para a transcrição${motivo === "MAX_TOKENS" ? " (resposta cortada por limite de tamanho)" : ""}.`,
    );
    erro.status = 502;
    throw erro;
  }

  const questoesValidas = Array.isArray(parseado.questoes)
    ? parseado.questoes.filter(
        (q) => q && q.enunciado && q.a && q.b && q.c && q.d && q.e
          && ["a", "b", "c", "d", "e"].includes(q.alternativaCorreta),
      )
    : [];

  const discursivasValidas = Array.isArray(parseado.discursivas)
    ? parseado.discursivas.filter((d) => d && d.enunciado && Array.isArray(d.criterios) && d.criterios.length >= 2)
    : [];

  if (!parseado.transcricaoFormatada || !parseado.resumo || questoesValidas.length === 0 || discursivasValidas.length === 0) {
    const erro = new Error("A IA não retornou transcrição, resumo, questões e discursivas válidas.");
    erro.status = 502;
    throw erro;
  }

  if (
    questoesValidas.length !== quantidadeQuestoes
    || discursivasValidas.length !== quantidadeDiscursivas
  ) {
    const erro = new Error(
      `A IA retornou ${questoesValidas.length}/${quantidadeQuestoes} objetivas e `
      + `${discursivasValidas.length}/${quantidadeDiscursivas} discursivas.`,
    );
    erro.status = 502;
    throw erro;
  }

  return {
    transcricaoFormatada: parseado.transcricaoFormatada,
    resumo: parseado.resumo,
    questoes: questoesValidas.map((q) => ({
      enunciado: q.enunciado,
      alternativaA: q.a,
      alternativaB: q.b,
      alternativaC: q.c,
      alternativaD: q.d,
      alternativaE: q.e || null,
      alternativaCorreta: q.alternativaCorreta,
      justificativa: q.justificativa || "",
    })),
    discursivas: discursivasValidas.map((d) => ({
      enunciado: d.enunciado,
      criteriosAvaliacao: d.criterios.map((c, i) => `${i + 1}) ${c}`).join(" "),
    })),
  };
}

const TIPOS_META_DESCRICAO = {
  concluir_aulas: "concluir N aulas de qualquer matéria (informe metaValor)",
  concluir_aulas_modulo:
    "concluir N aulas de UM módulo específico (informe metaValor E moduloId de um módulo da lista de pendentes)",
  responder_questoes: "responder N questões objetivas, de aula, banco de questões ou simulado (informe metaValor)",
  manter_sequencia: "manter a sequência (ofensiva) de estudo ativa por mais N dias a partir de agora (informe metaValor)",
  concluir_discursiva: "enviar N respostas discursivas pra correção (informe metaValor)",
  fazer_simulado: "completar N simulados inteiros (informe metaValor)",
};

function montarPromptMissoes({ tipo, quantidade, nome, cargoLabel, sequenciaAtual, modulosIncompletos }) {
  const modulosTexto =
    modulosIncompletos.length > 0
      ? modulosIncompletos.map((m) => `- id ${m.id}: ${m.titulo} (${m.aulasPendentes} aula(s) pendente(s))`).join("\n")
      : "(nenhum — todos os módulos visíveis já foram concluídos)";

  const explicacaoPeriodo = {
    mensal: "mensal — objetivo maior, para ser cumprido ao longo do mês inteiro",
    semanal: "semanal — objetivo de uma semana",
    diaria: "diária — objetivo pequeno e rápido, cumprível em um único dia",
  }[tipo];

  return `Você cria missões gamificadas para um app de estudos que prepara pessoas para concursos públicos e certificações profissionais no Brasil, para um usuário com TDAH e autismo se manter engajado sem se sentir pressionado. A plataforma atende vários cursos diferentes — baseie-se exclusivamente no "Cargo pretendido" informado nos dados reais abaixo, nunca mencione ou presuma outro cargo, instituição ou concurso.

TIPOS DE META DISPONÍVEIS (escolha SEMPRE um destes, nunca invente um tipo novo):
${Object.entries(TIPOS_META_DESCRICAO)
  .map(([chave, desc]) => `- ${chave}: ${desc}`)
  .join("\n")}

DADOS REAIS DO USUÁRIO (use para calibrar a dificuldade e contextualizar; não invente números que não estão aqui):
- Nome: ${nome}
- Cargo pretendido: ${cargoLabel}
- Sequência atual de dias seguidos estudando: ${sequenciaAtual}
- Módulos com aulas pendentes:
${modulosTexto}

PERÍODO DA MISSÃO: ${explicacaoPeriodo}

Gere exatamente ${quantidade} missão(ões) do tipo "${tipo}". Regras estritas:
- metaValor deve ser realista pro período (uma missão diária não deve pedir 10 aulas; uma mensal pode pedir mais).
- Se usar "concluir_aulas_modulo", moduloId TEM que ser um dos ids de módulos pendentes listados acima — nunca invente um id.
- Se não houver módulos pendentes, não use "concluir_aulas_modulo".
- titulo curto (até 8 palavras, sem ponto final). descricao: 1 frase objetiva e acolhedora explicando a missão, sem tom de cobrança ou culpa.
- Não repita o mesmo tipoMeta em todas as missões do mesmo período, quando possível — varie.

Responda em JSON válido com exatamente esta chave:
{
  "missoes": [
    { "titulo": "...", "descricao": "...", "tipoMeta": "concluir_aulas", "metaValor": 2, "moduloId": null }
  ]
}`;
}

async function gerarMissoes(dados) {
  if (!GEMINI_API_KEY) {
    const erro = new Error("Geração de missões indisponível: GEMINI_API_KEY não configurada.");
    erro.status = 503;
    throw erro;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELO}:generateContent?key=${GEMINI_API_KEY}`;

  const resposta = await fetchComTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: montarPromptMissoes(dados) }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    const erro = new Error("Falha ao consultar a IA para gerar missões.");
    erro.status = 502;
    erro.detalhe = detalhe;
    throw erro;
  }

  const corpo = await resposta.json();
  const textoGerado = corpo?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoGerado) {
    const erro = new Error("A IA não retornou missões válidas.");
    erro.status = 502;
    throw erro;
  }

  let parseado;
  try {
    parseado = JSON.parse(textoGerado.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, ""));
  } catch {
    const erro = new Error("A IA retornou um formato inesperado para as missões.");
    erro.status = 502;
    throw erro;
  }

  if (!Array.isArray(parseado.missoes)) {
    const erro = new Error("A IA não retornou uma lista de missões válida.");
    erro.status = 502;
    throw erro;
  }

  const tiposValidos = Object.keys(TIPOS_META_DESCRICAO);
  const idsValidos = new Set(dados.modulosIncompletos.map((m) => m.id));

  return parseado.missoes
    .filter((m) => m.titulo && m.descricao && tiposValidos.includes(m.tipoMeta) && Number(m.metaValor) > 0)
    .map((m) => ({
      titulo: m.titulo,
      descricao: m.descricao,
      tipoMeta: m.tipoMeta,
      metaValor: Math.round(Number(m.metaValor)),
      moduloId: m.tipoMeta === "concluir_aulas_modulo" && idsValidos.has(m.moduloId) ? m.moduloId : null,
    }))
    .filter((m) => m.tipoMeta !== "concluir_aulas_modulo" || m.moduloId !== null);
}

module.exports = {
  avaliarRespostaDiscursiva,
  gerarMensagemDoDia,
  gerarQuestoesSimilares,
  gerarConteudoAulaComTranscricao,
  gerarMissoes,
};
