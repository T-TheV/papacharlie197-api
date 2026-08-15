"use strict";

// Grade de matérias baseada no edital real da PCRN (FGV, 2021):
// Agente e Escrivão compartilham o mesmo edital (9 matérias "noções de").
// Delegado tem edital próprio: matérias de Direito em profundidade + 4 exclusivas
// (Direito Financeiro e Tributário, Direito Ambiental, Criminalística, Criminologia).
// Fonte: tecconcursos.com.br "edital verticalizado" PC-RN 2020, cruzado com
// estrategiaconcursos.com.br/blog/edital-pc-rn (pesquisa registrada na task #40).

function aspas(texto) {
  return texto.replace(/'/g, "''");
}

const NOVOS_MODULOS = [
  {
    titulo: "Língua Portuguesa",
    cor: "#4A90D9",
    cargos: ["agente", "escrivao"],
    aula: {
      titulo: "Crase: quando usar o acento grave",
      resumo:
        "A crase é a fusão da preposição “a” com o artigo feminino “a(s)” ou com o “a” inicial de pronomes demonstrativos (aquele, aquilo). Ocorre antes de palavras femininas que admitem o artigo “a”, como em “Refiro-me à proposta apresentada”. Não se usa crase antes de verbos, de palavras masculinas ou antes de pronomes pessoais.",
    },
    questao: {
      enunciado: "Assinale a alternativa em que o emprego do acento grave (crase) está CORRETO:",
      a: "Refiro-me à proposta enviada ontem.",
      b: "Vou à Recife amanhã.",
      c: "Não vou à lugar nenhum.",
      d: "Cheguei à trabalhar cedo.",
      e: "Isso é igual à ele.",
      correta: "a",
      justificativa:
        "Em “Refiro-me à proposta”, o verbo “referir-se” exige a preposição “a”, e “proposta” é substantivo feminino que admite artigo definido — por isso ocorre a crase. As demais opções trazem crase indevida antes de topônimo sem artigo, palavra masculina, verbo e pronome pessoal.",
    },
  },
  {
    titulo: "Raciocínio Lógico-Matemático",
    cor: "#7B61FF",
    cargos: ["agente", "escrivao"],
    aula: {
      titulo: "Proposições e conectivos lógicos",
      resumo:
        "Uma proposição é uma sentença declarativa julgada como verdadeira (V) ou falsa (F), nunca as duas ao mesmo tempo. Os principais conectivos lógicos são: negação, conjunção “e” (verdadeira só quando ambas as proposições são V), disjunção “ou” (verdadeira quando pelo menos uma é V) e condicional “se... então” (falsa apenas quando o antecedente é V e o consequente é F).",
    },
    questao: {
      enunciado: "Considerando a proposição composta “p e q”, em que p é falsa e q é verdadeira, o valor lógico de “p e q” é:",
      a: "Verdadeiro, porque q é verdadeira",
      b: "Falso, porque a conjunção exige que ambas as proposições sejam verdadeiras",
      c: "Indeterminado, pois depende do contexto",
      d: "Verdadeiro, pois basta uma ser verdadeira",
      e: "Falso, porque nenhuma das duas é verdadeira",
      correta: "b",
      justificativa:
        "Na conjunção, o resultado só é verdadeiro quando ambas as proposições são verdadeiras. Como p é falsa, “p e q” é falsa, independentemente do valor de q.",
    },
  },
  {
    titulo: "Noções de Administração",
    cor: "#2E8B57",
    cargos: ["agente", "escrivao"],
    aula: {
      titulo: "Funções administrativas clássicas (PODC)",
      resumo:
        "Segundo a Teoria Clássica da Administração (Henri Fayol), a administração se desenvolve através de quatro funções básicas, resumidas na sigla PODC: Planejamento (definir objetivos), Organização (distribuir recursos e tarefas), Direção (liderar e motivar pessoas) e Controle (verificar se os resultados batem com o planejado, corrigindo desvios).",
    },
    questao: {
      enunciado:
        "A função administrativa responsável por comparar o desempenho realizado com os objetivos planejados, identificando desvios e propondo correções, é conhecida como:",
      a: "Planejamento",
      b: "Organização",
      c: "Direção",
      d: "Controle",
      e: "Coordenação",
      correta: "d",
      justificativa:
        "O Controle é a função administrativa que mede o desempenho executado, compara com os padrões planejados e promove ações corretivas quando necessário, fechando o ciclo PODC.",
    },
  },
  {
    titulo: "Noções de Contabilidade",
    cor: "#D9822B",
    cargos: ["agente", "escrivao"],
    aula: {
      titulo: "Equação fundamental do patrimônio",
      resumo:
        "A equação fundamental da contabilidade estabelece que Ativo = Passivo + Patrimônio Líquido. O Ativo representa os bens e direitos da entidade; o Passivo representa as obrigações com terceiros; e o Patrimônio Líquido é a diferença entre Ativo e Passivo.",
    },
    questao: {
      enunciado:
        "Uma empresa possui Ativo total de R$ 100.000 e Passivo (obrigações com terceiros) de R$ 40.000. O valor do seu Patrimônio Líquido é:",
      a: "R$ 140.000",
      b: "R$ 60.000",
      c: "R$ 40.000",
      d: "R$ 100.000",
      e: "R$ 20.000",
      correta: "b",
      justificativa:
        "Pela equação fundamental Ativo = Passivo + Patrimônio Líquido, temos PL = Ativo − Passivo = 100.000 − 40.000 = R$ 60.000.",
    },
  },
  {
    titulo: "Direito Processual Penal",
    cor: "#F3C623",
    cargos: [],
    aula: {
      titulo: "Inquérito policial: conceito e natureza",
      resumo:
        "O inquérito policial é o procedimento administrativo, de natureza inquisitorial, presidido pela autoridade policial, destinado a apurar a materialidade e a autoria de uma infração penal, reunindo elementos de informação para subsidiar a ação penal pelo Ministério Público. É dispensável quando o titular da ação penal já dispõe de elementos suficientes (art. 12 e 39, §5º, do CPP).",
    },
    questao: {
      enunciado: "Sobre o inquérito policial, é correto afirmar que:",
      a: "É indispensável para o oferecimento de denúncia pelo Ministério Público",
      b: "Tem natureza jurisdicional, garantindo ampla defesa e contraditório",
      c: "É presidido pela autoridade policial e tem caráter inquisitorial",
      d: "Somente pode ser instaurado mediante requisição do juiz competente",
      e: "Sua conclusão vincula obrigatoriamente a decisão do Ministério Público",
      correta: "c",
      justificativa:
        "O inquérito policial é procedimento administrativo presidido pelo Delegado de Polícia, com caráter inquisitorial, servindo para reunir elementos de informação. Não é imprescindível à ação penal (art. 12 c/c art. 39, §5º, CPP) nem vincula o MP.",
    },
  },
  {
    titulo: "Legislação Penal e Processual Penal Extravagante",
    cor: "#C9A227",
    cargos: [],
    aula: {
      titulo: "Lei Maria da Penha: medidas protetivas de urgência",
      resumo:
        "A Lei nº 11.340/2006 (Lei Maria da Penha) cria mecanismos para coibir a violência doméstica e familiar contra a mulher, prevendo medidas protetivas de urgência — como o afastamento do agressor do lar — e vedando a aplicação de penas de cesta básica ou outras de prestação pecuniária isolada.",
    },
    questao: {
      enunciado: "De acordo com a Lei nº 11.340/2006 (Lei Maria da Penha), é correto afirmar que:",
      a: "Permite a aplicação de penas de cesta básica aos agressores",
      b: "Admite a suspensão condicional do processo em qualquer hipótese",
      c: "Prevê medidas protetivas de urgência, como o afastamento do agressor do lar",
      d: "Aplica-se exclusivamente a mulheres casadas civilmente",
      e: "Exige representação da vítima para todos os crimes cometidos no contexto de violência doméstica",
      correta: "c",
      justificativa:
        "A Lei Maria da Penha prevê expressamente medidas protetivas de urgência (art. 22), como o afastamento do agressor do lar. A lei veda penas de cesta básica (art. 17) e se aplica a qualquer relação íntima de afeto, não só ao casamento civil.",
    },
  },
  {
    titulo: "Direito Administrativo",
    cor: "#5C6BC0",
    cargos: [],
    aula: {
      titulo: "Princípios da Administração Pública (LIMPE)",
      resumo:
        "O art. 37, caput, da Constituição Federal elenca os princípios expressos da Administração Pública, resumidos na sigla LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência. Pelo princípio da legalidade, o administrador só pode agir conforme autorizado ou determinado por lei.",
    },
    questao: {
      enunciado:
        "O princípio constitucional da Administração Pública segundo o qual o administrador só pode agir conforme autorizado ou determinado por lei é o princípio da:",
      a: "Impessoalidade",
      b: "Moralidade",
      c: "Legalidade",
      d: "Publicidade",
      e: "Eficiência",
      correta: "c",
      justificativa:
        "O princípio da legalidade (art. 37, caput, CF/88) estabelece que, na Administração Pública, o agente público só pode agir dentro do que a lei expressamente autoriza ou determina — diferente do particular, que pode fazer tudo que a lei não proíbe.",
    },
  },
  {
    titulo: "Medicina Legal",
    cor: "#E05263",
    cargos: [],
    aula: {
      titulo: "Tanatologia forense: sinais de morte",
      resumo:
        "A Tanatologia Forense estuda a morte e seus fenômenos. Os sinais abióticos consecutivos (tardios) confirmam a morte com maior certeza: livores hipostáticos (surgem entre 2 e 3h após a morte), rigidez cadavérica — rigor mortis (inicia-se cerca de 2 a 4h após o óbito) e resfriamento do corpo (algor mortis).",
    },
    questao: {
      enunciado:
        "Em Medicina Legal, o fenômeno cadavérico caracterizado pelo enrijecimento progressivo da musculatura após a morte, iniciando-se poucas horas após o óbito, é denominado:",
      a: "Livor mortis",
      b: "Rigor mortis",
      c: "Algor mortis",
      d: "Espasmo cadavérico",
      e: "Mancha verde abdominal",
      correta: "b",
      justificativa:
        "O rigor mortis (rigidez cadavérica) é o enrijecimento da musculatura decorrente de alterações bioquímicas post mortem, iniciando-se cerca de 2 a 4 horas após a morte, sendo um dos sinais abióticos consecutivos usados para estimar o tempo de morte.",
    },
  },
  {
    titulo: "Direito Financeiro e Tributário",
    cor: "#1F8A70",
    cargos: ["delegado"],
    aula: {
      titulo: "Conceito de tributo (art. 3º do CTN)",
      resumo:
        "Segundo o art. 3º do Código Tributário Nacional, tributo é toda prestação pecuniária compulsória, em moeda ou cujo valor nela se possa exprimir, que não constitua sanção de ato ilícito, instituída em lei e cobrada mediante atividade administrativa plenamente vinculada.",
    },
    questao: {
      enunciado: "De acordo com o art. 3º do CTN, é característica essencial do tributo:",
      a: "Ser uma prestação facultativa, dependente de anuência do contribuinte",
      b: "Poder constituir sanção por ato ilícito",
      c: "Ser cobrado mediante atividade administrativa discricionária",
      d: "Ser instituído em lei e ter caráter compulsório",
      e: "Ser exigível apenas por meio de contrato administrativo",
      correta: "d",
      justificativa:
        "O art. 3º do CTN define tributo como prestação pecuniária compulsória (independe da vontade do contribuinte), instituída em lei, que não constitui sanção de ato ilícito e é cobrada por atividade administrativa vinculada.",
    },
  },
  {
    titulo: "Direito Ambiental",
    cor: "#43A047",
    cargos: ["delegado"],
    aula: {
      titulo: "Princípio do poluidor-pagador",
      resumo:
        "O princípio do poluidor-pagador, previsto na Lei nº 6.938/1981 e amparado pelo art. 225, §3º, da CF/88, estabelece que quem explora recursos naturais ou causa degradação ambiental deve arcar com os custos de prevenção, reparação e repressão dos danos causados, evitando que a coletividade suporte esses custos.",
    },
    questao: {
      enunciado:
        "O princípio de Direito Ambiental segundo o qual o responsável pela poluição deve arcar com os custos de prevenção e reparação do dano ambiental causado é denominado:",
      a: "Princípio da precaução",
      b: "Princípio da prevenção",
      c: "Princípio do poluidor-pagador",
      d: "Princípio do desenvolvimento sustentável",
      e: "Princípio da função socioambiental da propriedade",
      correta: "c",
      justificativa:
        "O princípio do poluidor-pagador impõe ao causador da degradação ambiental o dever de arcar com os custos de prevenção e reparação, internalizando o custo ambiental em sua atividade.",
    },
  },
  {
    titulo: "Criminalística",
    cor: "#8D6E63",
    cargos: ["delegado"],
    aula: {
      titulo: "Local de crime: conceito e preservação",
      resumo:
        "Local de crime é o espaço físico onde ocorreu a infração penal e onde se encontram os vestígios materiais relacionados a ela. A preservação do local (art. 6º, I, do CPP) é essencial para garantir a idoneidade da perícia, evitando a contaminação, alteração ou perda de vestígios antes da chegada da equipe de perícia criminal.",
    },
    questao: {
      enunciado:
        "Segundo o art. 6º, inciso I, do Código de Processo Penal, ao tomar conhecimento da infração penal, a autoridade policial deverá dirigir-se ao local, providenciando para que:",
      a: "O local seja imediatamente liberado para o trânsito de pessoas",
      b: "Os vestígios sejam recolhidos apenas por familiares da vítima",
      c: "Não se alterem o estado e a conservação das coisas, até a chegada dos peritos",
      d: "A perícia seja dispensada quando houver testemunhas oculares",
      e: "O corpo de delito seja descartado antes do exame pericial",
      correta: "c",
      justificativa:
        "O art. 6º, I, do CPP determina que a autoridade policial deve providenciar para que não se alterem o estado e a conservação das coisas até a chegada dos peritos criminais, preservando a idoneidade dos vestígios para o exame de corpo de delito.",
    },
  },
  {
    titulo: "Criminologia",
    cor: "#6D4C41",
    cargos: ["delegado"],
    aula: {
      titulo: "Conceito e objeto da Criminologia",
      resumo:
        "Criminologia é a ciência empírica e interdisciplinar que estuda o crime, o criminoso, a vítima e o controle social do comportamento desviante. Diferencia-se do Direito Penal, que é uma ciência normativa (do dever-ser), enquanto a Criminologia analisa o fenômeno criminal sob a ótica causal-explicativa (do ser).",
    },
    questao: {
      enunciado: "A Criminologia se diferencia do Direito Penal principalmente porque:",
      a: "Ambas têm a mesma metodologia normativa",
      b: "A Criminologia é uma ciência do dever-ser, assim como o Direito Penal",
      c: "A Criminologia é uma ciência empírica que estuda as causas do crime, enquanto o Direito Penal é uma ciência normativa",
      d: "O Direito Penal não possui relação alguma com o estudo do crime",
      e: "A Criminologia se ocupa exclusivamente da cominação de penas",
      correta: "c",
      justificativa:
        "O Direito Penal é uma ciência normativa (do dever-ser), que define crimes e penas por meio de normas jurídicas. A Criminologia é uma ciência empírica (do ser), que investiga o crime como fenômeno social, suas causas, o criminoso, a vítima e o controle social.",
    },
  },
];

module.exports = {
  async up(queryInterface) {
    const agora = new Date();

    // Corrige o módulo "Informática" já existente: pelo edital real da PCRN,
    // essa matéria pertence ao bloco Agente/Escrivão, não ao Delegado.
    await queryInterface.sequelize.query(
      `UPDATE modulos
       SET titulo = 'Noções de Informática', cargos_alvo = ARRAY['agente','escrivao'], updated_at = NOW()
       WHERE titulo = 'Informática';`,
    );

    const [ultimoModulo] = await queryInterface.sequelize.query(
      `SELECT COALESCE(MAX(ordem), 0) AS max FROM modulos;`,
    );
    let ordem = Number(ultimoModulo[0].max);

    for (const item of NOVOS_MODULOS) {
      ordem += 1;
      const cargosSql =
        item.cargos.length === 0 ? "ARRAY[]::varchar[]" : `ARRAY[${item.cargos.map((c) => `'${c}'`).join(",")}]`;

      const [modulosCriados] = await queryInterface.sequelize.query(
        `INSERT INTO modulos (titulo, cor_destaque, ordem, cargos_alvo, created_at, updated_at) VALUES
          ('${aspas(item.titulo)}', '${item.cor}', ${ordem}, ${cargosSql}, NOW(), NOW())
        RETURNING id;`,
      );
      const moduloId = modulosCriados[0].id;

      const [aulasCriadas] = await queryInterface.sequelize.query(
        `INSERT INTO aulas (modulo_id, titulo, youtube_iframe_url, resumo_texto, ordem, created_at, updated_at) VALUES
          (${moduloId}, '${aspas(item.aula.titulo)}', 'https://www.youtube.com/embed/PLACEHOLDER_AULA', '${aspas(item.aula.resumo)}', 1, NOW(), NOW())
        RETURNING id;`,
      );
      const aulaId = aulasCriadas[0].id;

      const q = item.questao;
      await queryInterface.bulkInsert("questoes", [
        {
          aula_id: aulaId,
          enunciado: q.enunciado,
          alternativa_a: q.a,
          alternativa_b: q.b,
          alternativa_c: q.c,
          alternativa_d: q.d,
          alternativa_e: q.e,
          alternativa_correta: q.correta,
          justificativa_erro: q.justificativa,
          created_at: agora,
          updated_at: agora,
        },
      ]);
    }
  },

  async down(queryInterface) {
    const titulos = NOVOS_MODULOS.map((m) => `'${aspas(m.titulo)}'`).join(",");
    const [modulosParaRemover] = await queryInterface.sequelize.query(
      `SELECT id FROM modulos WHERE titulo IN (${titulos});`,
    );
    const idsModulos = modulosParaRemover.map((m) => m.id);

    if (idsModulos.length > 0) {
      const [aulasParaRemover] = await queryInterface.sequelize.query(
        `SELECT id FROM aulas WHERE modulo_id IN (${idsModulos.join(",")});`,
      );
      const idsAulas = aulasParaRemover.map((a) => a.id);

      if (idsAulas.length > 0) {
        await queryInterface.sequelize.query(`DELETE FROM questoes WHERE aula_id IN (${idsAulas.join(",")});`);
        await queryInterface.sequelize.query(`DELETE FROM aulas WHERE id IN (${idsAulas.join(",")});`);
      }
      await queryInterface.sequelize.query(`DELETE FROM modulos WHERE id IN (${idsModulos.join(",")});`);
    }

    await queryInterface.sequelize.query(
      `UPDATE modulos
       SET titulo = 'Informática', cargos_alvo = ARRAY['delegado'], updated_at = NOW()
       WHERE titulo = 'Noções de Informática';`,
    );
  },
};
