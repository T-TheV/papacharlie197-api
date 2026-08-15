"use strict";

// Conteúdo baseado nos sub-tópicos REAIS do edital da PCRN (planilha "Edital Estratégico"
// da Estratégia Concursos, extraída pelo usuário), não mais em conhecimento geral.
// Cada bloco abaixo corresponde a um "assunto" real listado na planilha oficial.
// Vídeos ficam como placeholder — curadoria real fica pra uma próxima passada (como
// foi feito na task #42 para os módulos anteriores).

function aspas(texto) {
  return texto.replace(/'/g, "''");
}

const NOVAS_AULAS_POR_MODULO = {
  "Língua Portuguesa": [
    {
      titulo: "Gêneros textuais e interpretação",
      resumo:
        "Um texto pode ser literário (busca efeito estético) ou não literário (informa, argumenta ou instrui), e seu sentido depende tanto do que está escrito quanto da organização interna das ideias — introdução, desenvolvimento e conclusão. Interpretar corretamente exige identificar a ideia central, distinguindo-a de detalhes secundários e de opiniões do autor.",
      questao: {
        enunciado:
          "O gênero textual predominante em um texto que apresenta fatos organizados cronologicamente, com personagens e ações, é:",
        a: "Narrativo",
        b: "Descritivo",
        c: "Argumentativo",
        d: "Dissertativo-expositivo",
        e: "Injuntivo",
        correta: "a",
        justificativa:
          "O texto narrativo relata fatos e ações organizados em sequência temporal, com personagens — diferente do descritivo (detalha características) e do argumentativo (defende um ponto de vista).",
      },
    },
    {
      titulo: "Semântica e classes gramaticais",
      resumo:
        "Semântica estuda o sentido das palavras — uma mesma palavra pode ter sentido denotativo (literal) ou conotativo (figurado). Morfologia estuda a estrutura das palavras: classes gramaticais (substantivo, verbo, adjetivo etc.) e processos de formação como derivação e composição.",
      questao: {
        enunciado:
          "Assinale a alternativa em que a expressão destacada está empregada em sentido conotativo (figurado):",
        a: "\"O sol nasceu às 6h.\"",
        b: "\"Ele tem um coração de pedra.\"",
        c: "\"A pedra caiu do telhado.\"",
        d: "\"Comprei uma casa nova.\"",
        e: "\"O rio corre para o mar.\"",
        correta: "b",
        justificativa:
          "\"Coração de pedra\" é uma metáfora (sentido figurado, indicando insensibilidade) — as demais alternativas empregam as palavras em sentido literal.",
      },
    },
    {
      titulo: "Concordância verbal e nominal",
      resumo:
        "Concordância verbal é a regra pela qual o verbo se ajusta em número e pessoa ao sujeito. Casos especiais incluem verbos impessoais: \"fazer\" indicando tempo decorrido e \"haver\" no sentido de existir ficam sempre na 3ª pessoa do singular, sem flexionar para concordar com o termo seguinte.",
      questao: {
        enunciado: "Assinale a alternativa com concordância verbal CORRETA:",
        a: "Fazem dois anos que ele saiu.",
        b: "Faz dois anos que ele saiu.",
        c: "Houveram muitos problemas na reunião.",
        d: "Existe várias soluções para o problema.",
        e: "Deve haverem soluções para o caso.",
        correta: "b",
        justificativa:
          "\"Fazer\" indicando tempo decorrido é verbo impessoal e fica sempre na 3ª pessoa do singular (\"faz\"), assim como \"haver\" no sentido de existir (\"houve\", nunca \"houveram\").",
      },
    },
  ],

  "Raciocínio Lógico-Matemático": [
    {
      titulo: "Equações do primeiro grau",
      resumo:
        "Uma equação do primeiro grau tem a forma ax + b = 0 (a≠0), e resolvê-la significa isolar x através de operações inversas (soma/subtração, multiplicação/divisão) aplicadas aos dois lados da igualdade.",
      questao: {
        enunciado: "Qual o valor de x na equação 3x + 6 = 18?",
        a: "2",
        b: "4",
        c: "6",
        d: "8",
        e: "12",
        correta: "b",
        justificativa: "3x + 6 = 18 → 3x = 12 → x = 4.",
      },
    },
    {
      titulo: "Princípio fundamental da contagem",
      resumo:
        "O princípio fundamental da contagem estabelece que, se uma decisão pode ser tomada de m maneiras e outra decisão independente de n maneiras, o total de combinações possíveis é m × n. É a base para calcular arranjos, permutações e probabilidades simples.",
      questao: {
        enunciado:
          "Uma pessoa tem 3 camisas e 4 calças diferentes. De quantas formas distintas ela pode se vestir combinando uma camisa e uma calça?",
        a: "7",
        b: "12",
        c: "3",
        d: "4",
        e: "34",
        correta: "b",
        justificativa: "Pelo princípio fundamental da contagem: 3 × 4 = 12 combinações possíveis.",
      },
    },
  ],

  "Noções de Informática": [
    {
      titulo: "Componentes de hardware: processador e memória",
      resumo:
        "O processador (CPU) executa instruções e cálculos, sendo o \"cérebro\" do computador. A memória RAM armazena dados temporariamente enquanto o computador está ligado (é volátil), enquanto dispositivos como HD e SSD guardam dados permanentemente mesmo desligados.",
      questao: {
        enunciado: "Qual dispositivo perde todo o seu conteúdo quando o computador é desligado?",
        a: "HD (disco rígido)",
        b: "SSD",
        c: "Memória RAM",
        d: "Pen drive",
        e: "Cartão de memória",
        correta: "c",
        justificativa: "A memória RAM é volátil: seu conteúdo é apagado quando o computador é desligado.",
      },
    },
    {
      titulo: "Formatos de arquivo e o Windows 10",
      resumo:
        "Cada tipo de arquivo digital (documento, planilha, imagem, som, vídeo) tem formatos identificados pela extensão (.docx, .xlsx, .pdf, .mp3). O formato PDF é amplamente usado por preservar a formatação original do documento em qualquer dispositivo.",
      questao: {
        enunciado:
          "Qual formato de arquivo é conhecido por preservar a formatação original de um documento, independentemente do programa ou dispositivo usado para abri-lo?",
        a: "DOCX",
        b: "TXT",
        c: "PDF",
        d: "RTF",
        e: "CSV",
        correta: "c",
        justificativa: "O PDF (Portable Document Format) foi criado justamente para preservar a formatação original em qualquer plataforma.",
      },
    },
    {
      titulo: "Edição e formatação de documentos de texto",
      resumo:
        "Editores de texto permitem formatar fontes, aplicar estilos, e usar o \"controle de alterações\", que registra e destaca as modificações feitas por um revisor, permitindo aceitar ou rejeitar cada uma individualmente.",
      questao: {
        enunciado:
          "A função de um editor de texto que registra e destaca todas as modificações feitas por um revisor no documento, permitindo aceitar ou rejeitar cada uma, é chamada de:",
        a: "Localizar e substituir",
        b: "Controle de alterações",
        c: "Formatação condicional",
        d: "Mala direta",
        e: "Verificação ortográfica",
        correta: "b",
        justificativa: "O \"Controle de Alterações\" (Track Changes) registra as edições de revisores para posterior aceitação ou rejeição.",
      },
    },
    {
      titulo: "Fórmulas e funções em planilhas eletrônicas",
      resumo:
        "Planilhas eletrônicas usam fórmulas (iniciadas com =) para cálculos automáticos, e funções prontas como SOMA, MÉDIA e SE facilitam operações comuns. Gráficos podem ser gerados a partir dos dados para facilitar a visualização.",
      questao: {
        enunciado: "Em uma planilha eletrônica, qual função é usada para somar automaticamente um intervalo de células?",
        a: "=MÉDIA()",
        b: "=CONT.SE()",
        c: "=SOMA()",
        d: "=SE()",
        e: "=PROCV()",
        correta: "c",
        justificativa: "=SOMA() é a função padrão para somar valores de um intervalo de células.",
      },
    },
    {
      titulo: "E-mail e transferência de arquivos na internet",
      resumo:
        "O envio de e-mails permite anexar arquivos e usar cópia (CC) ou cópia oculta (CCO) para outros destinatários. Upload é o envio de arquivos do computador para a internet, enquanto download é o recebimento — ambos dependem da velocidade (banda) da conexão.",
      questao: {
        enunciado: "O envio de um arquivo do seu computador para um servidor na internet é chamado de:",
        a: "Download",
        b: "Upload",
        c: "Streaming",
        d: "Cache",
        e: "Backup",
        correta: "b",
        justificativa: "Upload é o envio de dados do dispositivo local para um servidor remoto; download é o processo inverso.",
      },
    },
  ],

  "Noções de Administração": [
    {
      titulo: "Comportamento organizacional: motivação e liderança",
      resumo:
        "O comportamento organizacional estuda como indivíduos e grupos agem dentro das empresas: motivação, comprometimento organizacional e liderança. O controle organizacional pode ocorrer em nível estratégico, tático ou operacional, cada um com foco e prazo distintos.",
      questao: {
        enunciado:
          "O nível de controle organizacional voltado para o dia a dia das operações, com foco em curto prazo e atividades específicas, é o controle:",
        a: "Estratégico",
        b: "Tático",
        c: "Operacional",
        d: "Institucional",
        e: "Corporativo",
        correta: "c",
        justificativa: "O controle operacional foca no curto prazo e nas atividades cotidianas específicas da organização.",
      },
    },
  ],

  "Noções de Contabilidade": [
    {
      titulo: "Escrituração contábil e regimes de reconhecimento",
      resumo:
        "Escrituração é o registro cronológico dos fatos contábeis, seguindo o método das partidas dobradas (todo débito tem um crédito correspondente). O regime de competência reconhece receitas e despesas quando ocorrem, independente do pagamento; o regime de caixa reconhece só quando há recebimento ou pagamento efetivo.",
      questao: {
        enunciado:
          "No regime contábil em que receitas e despesas são reconhecidas no momento em que ocorrem, independentemente do recebimento ou pagamento efetivo, trata-se do regime de:",
        a: "Caixa",
        b: "Competência",
        c: "Misto",
        d: "Diferido",
        e: "Provisão",
        correta: "b",
        justificativa: "O regime de competência reconhece o fato contábil no momento em que ocorre, e não quando há movimentação financeira.",
      },
    },
    {
      titulo: "Depreciação e balancete de verificação",
      resumo:
        "Depreciação é a perda de valor de um bem do ativo imobilizado pelo uso ou desgaste, registrada periodicamente como despesa. O balancete de verificação lista todas as contas contábeis com seus saldos, usado para conferir o equilíbrio entre débitos e créditos antes das demonstrações financeiras.",
      questao: {
        enunciado:
          "O relatório contábil que lista todas as contas com seus respectivos saldos, usado para verificar o equilíbrio entre débitos e créditos antes de elaborar as demonstrações financeiras, é chamado de:",
        a: "Balanço patrimonial",
        b: "Balancete de verificação",
        c: "Demonstração de resultado",
        d: "Fluxo de caixa",
        e: "Livro razão",
        correta: "b",
        justificativa: "O balancete de verificação serve justamente para checar se os lançamentos estão equilibrados antes de fechar as demonstrações.",
      },
    },
    {
      titulo: "Balanço patrimonial e demonstração de resultado",
      resumo:
        "O balanço patrimonial retrata a situação financeira da entidade numa data específica (Ativo, Passivo e Patrimônio Líquido). A Demonstração de Resultado do Exercício (DRE) mostra o desempenho num período, confrontando receitas, custos e despesas para apurar lucro ou prejuízo.",
      questao: {
        enunciado:
          "O demonstrativo contábil que apura o lucro ou prejuízo de uma entidade ao longo de um período, confrontando receitas e despesas, é:",
        a: "Balanço patrimonial",
        b: "Demonstração de Resultado do Exercício (DRE)",
        c: "Balancete de verificação",
        d: "Livro diário",
        e: "Plano de contas",
        correta: "b",
        justificativa: "A DRE é o demonstrativo que apura o resultado (lucro ou prejuízo) do período, diferente do balanço, que é uma \"fotografia\" estática do patrimônio.",
      },
    },
  ],

  "Direito Constitucional": [
    {
      titulo: "Direitos e garantias fundamentais: remédios constitucionais",
      resumo:
        "A Constituição prevê remédios constitucionais para proteger direitos: habeas corpus (protege a liberdade de locomoção), habeas data (acesso/retificação de dados pessoais), mandado de segurança (protege direito líquido e certo não amparado por HC/HD), mandado de injunção (supre omissão legislativa) e ação popular (anula ato lesivo ao patrimônio público).",
      questao: {
        enunciado:
          "O remédio constitucional destinado a proteger a liberdade de locomoção de uma pessoa que sofre ou está ameaçada de sofrer violência ou coação ilegal é o:",
        a: "Mandado de segurança",
        b: "Habeas data",
        c: "Habeas corpus",
        d: "Mandado de injunção",
        e: "Ação popular",
        correta: "c",
        justificativa: "O habeas corpus (art. 5º, LXVIII, CF/88) protege especificamente a liberdade de locomoção.",
      },
    },
    {
      titulo: "Organização político-administrativa do Estado",
      resumo:
        "A Constituição organiza o Brasil em União, Estados, Distrito Federal e Municípios, cada um com competências próprias (privativas, comuns ou concorrentes), formando a Federação. Nacionalidade pode ser originária (nato) ou secundária (naturalizado).",
      questao: {
        enunciado:
          "A forma de organização político-administrativa do Brasil, que divide o poder entre União, Estados, Distrito Federal e Municípios com autonomia própria, é denominada:",
        a: "Estado unitário",
        b: "Federação",
        c: "Confederação",
        d: "Monarquia constitucional",
        e: "Parlamentarismo",
        correta: "b",
        justificativa: "O Brasil é uma Federação (art. 1º, CF/88), com entes federativos autônomos e competências constitucionalmente distribuídas.",
      },
    },
    {
      titulo: "Segurança pública na Constituição Federal",
      resumo:
        "O art. 144 da CF/88 define a segurança pública como dever do Estado e responsabilidade de todos, exercida através de órgãos como polícia federal, polícias civis, polícias militares e corpos de bombeiros militares. As polícias civis exercem funções de polícia judiciária e apuração de infrações penais, exceto as militares.",
      questao: {
        enunciado: "Segundo o art. 144 da CF/88, a apuração de infrações penais, exceto as militares, é função da:",
        a: "Polícia Militar",
        b: "Polícia Civil",
        c: "Guarda Municipal",
        d: "Polícia Federal Rodoviária",
        e: "Corpo de Bombeiros",
        correta: "b",
        justificativa: "O art. 144, §4º, CF/88 atribui às polícias civis as funções de polícia judiciária e a apuração de infrações penais, exceto as militares.",
      },
    },
    {
      titulo: "Constituição do Estado do Rio Grande do Norte",
      resumo:
        "A Constituição Estadual do RN organiza os poderes e a administração pública no âmbito estadual, respeitando os princípios da Constituição Federal — fenômeno conhecido como princípio da simetria. Ela trata da organização da segurança pública estadual, incluindo a Polícia Civil do RN, dentro dos limites da CF/88.",
      questao: {
        enunciado:
          "As Constituições Estaduais, como a do RN, devem obrigatoriamente respeitar os princípios e normas da Constituição Federal, fenômeno conhecido como princípio da:",
        a: "Simetria",
        b: "Subsidiariedade",
        c: "Reserva legal",
        d: "Legalidade estrita",
        e: "Anterioridade",
        correta: "a",
        justificativa: "O princípio da simetria exige que as Constituições Estaduais reproduzam o modelo organizacional e os princípios estabelecidos pela Constituição Federal.",
      },
    },
  ],

  "Direito Penal": [
    {
      titulo: "Dolo, culpa e tentativa",
      resumo:
        "Dolo é a vontade consciente de praticar a conduta criminosa (o agente quer ou assume o risco do resultado); culpa é a violação de um dever de cuidado, sem intenção, por imprudência, negligência ou imperícia. Tentativa ocorre quando o agente inicia a execução do crime mas não o consuma por circunstâncias alheias à sua vontade.",
      questao: {
        enunciado:
          "Quando o agente, embora não queira diretamente o resultado, assume o risco de produzi-lo, o Código Penal classifica essa conduta como:",
        a: "Culpa consciente",
        b: "Dolo eventual",
        c: "Culpa imprópria",
        d: "Dolo direto",
        e: "Erro de tipo",
        correta: "b",
        justificativa: "O dolo eventual (art. 18, I, 2ª parte, CP) é quando o agente assume o risco de produzir o resultado, mesmo sem querê-lo diretamente.",
      },
    },
  ],

  "Direito Processual Penal": [
    {
      titulo: "Prisão em flagrante e prisão preventiva",
      resumo:
        "A prisão em flagrante ocorre quando alguém é surpreendido cometendo o crime, ou é perseguido/encontrado logo depois com indícios de autoria — dispensa ordem judicial prévia, mas exige comunicação imediata ao juiz. A prisão preventiva é decretada pelo juiz quando presentes requisitos como garantia da ordem pública ou conveniência da instrução criminal.",
      questao: {
        enunciado:
          "A modalidade de prisão que pode ser realizada por qualquer pessoa do povo ou por autoridade policial, sem necessidade de ordem judicial prévia, quando o agente é surpreendido cometendo a infração penal, é a prisão:",
        a: "Preventiva",
        b: "Temporária",
        c: "Em flagrante",
        d: "Civil",
        e: "Administrativa",
        correta: "c",
        justificativa: "A prisão em flagrante (art. 301, CPP) dispensa ordem judicial prévia justamente por capturar o agente no momento da infração.",
      },
    },
  ],

  "Legislação Penal e Processual Penal Extravagante": [
    {
      titulo: "Estatuto do Desarmamento (Lei nº 10.826/2003)",
      resumo:
        "O Estatuto do Desarmamento disciplina registro, posse e comercialização de armas de fogo no Brasil, distinguindo posse (manter a arma em casa ou local de trabalho, com registro) de porte (portar a arma fora de casa, exigindo autorização específica). Porte ilegal é crime, com penas variando conforme o uso da arma seja permitido ou restrito.",
      questao: {
        enunciado:
          "Segundo o Estatuto do Desarmamento, manter uma arma de fogo registrada dentro da residência, sem autorização para circular com ela em via pública, caracteriza:",
        a: "Porte ilegal",
        b: "Posse de arma de fogo",
        c: "Comércio ilegal",
        d: "Tráfico internacional de armas",
        e: "Disparo de arma de fogo",
        correta: "b",
        justificativa: "Posse é manter a arma dentro de casa ou local de trabalho com registro; porte exige autorização específica para circular armado em via pública.",
      },
    },
  ],

  "Direito Administrativo": [
    {
      titulo: "Atributos do ato administrativo",
      resumo:
        "O ato administrativo possui atributos que o diferenciam dos atos privados: presunção de legitimidade (presume-se válido até prova em contrário), autoexecutoriedade (a Administração pode executá-lo sem prévia autorização judicial, em certos casos) e imperatividade (impõe-se unilateralmente aos administrados).",
      questao: {
        enunciado:
          "O atributo do ato administrativo que permite à Administração Pública executar suas decisões diretamente, sem necessidade de prévia autorização do Poder Judiciário, é a:",
        a: "Presunção de legitimidade",
        b: "Autoexecutoriedade",
        c: "Tipicidade",
        d: "Discricionariedade",
        e: "Vinculação",
        correta: "b",
        justificativa: "A autoexecutoriedade permite à Administração executar seus próprios atos sem depender do Judiciário, presente em situações como a apreensão de mercadorias irregulares.",
      },
    },
    {
      titulo: "Improbidade Administrativa (Lei nº 8.429/1992)",
      resumo:
        "A Lei de Improbidade Administrativa classifica os atos ímprobos em três categorias: os que causam enriquecimento ilícito, os que causam prejuízo ao erário, e os que atentam contra os princípios da Administração Pública. As sanções podem incluir perda da função pública, suspensão dos direitos políticos e multa civil.",
      questao: {
        enunciado:
          "Um agente público que recebe vantagem indevida em razão do cargo pratica ato de improbidade administrativa que causa:",
        a: "Prejuízo ao erário apenas",
        b: "Enriquecimento ilícito",
        c: "Violação a princípios apenas",
        d: "Dano moral coletivo",
        e: "Abuso de autoridade exclusivamente",
        correta: "b",
        justificativa: "Receber vantagem indevida em razão do cargo é o exemplo clássico de ato de improbidade que causa enriquecimento ilícito (art. 9º da Lei 8.429/1992).",
      },
    },
    {
      titulo: "Princípios e modalidades de licitação",
      resumo:
        "Licitação é o procedimento administrativo obrigatório para a Administração Pública contratar obras, serviços e compras, garantindo igualdade de condições a todos os concorrentes. Rege-se por princípios como legalidade, impessoalidade, publicidade e julgamento objetivo, sendo dispensada ou inexigível apenas nas hipóteses previstas em lei.",
      questao: {
        enunciado:
          "A licitação é, como regra geral, obrigatória para contratações públicas, sendo dispensada ou inexigível apenas nas hipóteses expressamente previstas em lei. Essa obrigatoriedade decorre principalmente do princípio da:",
        a: "Eficiência",
        b: "Legalidade",
        c: "Economicidade",
        d: "Publicidade exclusivamente",
        e: "Continuidade do serviço público",
        correta: "b",
        justificativa: "A obrigatoriedade da licitação decorre do princípio da legalidade — a Administração só pode agir conforme autorizado por lei, e a licitação é a regra legal geral para contratar.",
      },
    },
  ],

  "Medicina Legal": [
    {
      titulo: "Corpo de delito e perícia médico-legal",
      resumo:
        "Corpo de delito é o conjunto de vestígios materiais deixados pela infração penal, sendo indispensável para as infrações que deixam vestígios (art. 158 do CPP). A perícia é realizada por peritos oficiais, que elaboram laudo técnico descrevendo os achados de forma objetiva e imparcial.",
      questao: {
        enunciado: "Segundo o art. 158 do CPP, quando a infração penal deixar vestígios, será indispensável o exame de:",
        a: "Testemunhas",
        b: "Corpo de delito",
        c: "Antecedentes do réu",
        d: "Confissão",
        e: "Perfil psicológico",
        correta: "b",
        justificativa: "O art. 158 do CPP exige o exame de corpo de delito sempre que a infração deixar vestígios materiais, direto ou indireto.",
      },
    },
    {
      titulo: "Asfixias mecânicas",
      resumo:
        "Asfixias mecânicas são causadas por impedimento físico da respiração, classificadas conforme o mecanismo: enforcamento (constrição do pescoço pelo peso do próprio corpo), estrangulamento (constrição por força externa, sem peso corporal), esganadura (constrição manual) e sufocação (obstrução das vias aéreas).",
      questao: {
        enunciado:
          "A asfixia mecânica causada pela constrição do pescoço exercida pelo peso do próprio corpo da vítima, geralmente com uso de um laço, é denominada:",
        a: "Esganadura",
        b: "Estrangulamento",
        c: "Enforcamento",
        d: "Sufocação",
        e: "Soterramento",
        correta: "c",
        justificativa: "O enforcamento se caracteriza justamente pela constrição do pescoço usando o peso do próprio corpo da vítima como força constritora.",
      },
    },
    {
      titulo: "Imputabilidade penal e doença mental",
      resumo:
        "Imputabilidade é a capacidade de entender o caráter ilícito do fato e de se determinar conforme esse entendimento. O art. 26 do CP prevê a inimputabilidade quando, por doença mental ou desenvolvimento mental incompleto/retardado, o agente era inteiramente incapaz dessa compreensão ao tempo do crime.",
      questao: {
        enunciado:
          "Segundo o art. 26 do Código Penal, o agente que, por doença mental, era inteiramente incapaz de entender o caráter ilícito do fato ao tempo da conduta é considerado:",
        a: "Semi-imputável",
        b: "Inimputável",
        c: "Plenamente imputável",
        d: "Reincidente",
        e: "Culpado com atenuante",
        correta: "b",
        justificativa: "O art. 26, caput, do CP declara inimputável quem, por doença mental, era inteiramente incapaz de entender o caráter ilícito do fato ou de se determinar conforme esse entendimento.",
      },
    },
  ],
};

module.exports = {
  async up(queryInterface) {
    const agora = new Date();

    for (const [moduloTitulo, aulas] of Object.entries(NOVAS_AULAS_POR_MODULO)) {
      const [modulos] = await queryInterface.sequelize.query(
        `SELECT id FROM modulos WHERE titulo = '${aspas(moduloTitulo)}' LIMIT 1;`,
      );
      if (modulos.length === 0) {
        throw new Error(`Módulo não encontrado: ${moduloTitulo}`);
      }
      const moduloId = modulos[0].id;

      const [maxOrdemRows] = await queryInterface.sequelize.query(
        `SELECT COALESCE(MAX(ordem), 0) AS max FROM aulas WHERE modulo_id = ${moduloId};`,
      );
      let ordem = Number(maxOrdemRows[0].max);

      for (const aula of aulas) {
        ordem += 1;

        const [aulasCriadas] = await queryInterface.sequelize.query(
          `INSERT INTO aulas (modulo_id, titulo, youtube_iframe_url, resumo_texto, ordem, created_at, updated_at) VALUES
            (${moduloId}, '${aspas(aula.titulo)}', 'https://www.youtube.com/embed/PLACEHOLDER_AULA', '${aspas(aula.resumo)}', ${ordem}, NOW(), NOW())
          RETURNING id;`,
        );
        const aulaId = aulasCriadas[0].id;

        const q = aula.questao;
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
            origem: "estudo",
            created_at: agora,
            updated_at: agora,
          },
        ]);
      }
    }
  },

  async down(queryInterface) {
    const titulosAulas = Object.values(NOVAS_AULAS_POR_MODULO)
      .flat()
      .map((a) => `'${aspas(a.titulo)}'`)
      .join(",");

    const [aulasParaRemover] = await queryInterface.sequelize.query(
      `SELECT id FROM aulas WHERE titulo IN (${titulosAulas});`,
    );
    const ids = aulasParaRemover.map((a) => a.id);

    if (ids.length > 0) {
      await queryInterface.sequelize.query(`DELETE FROM questoes WHERE aula_id IN (${ids.join(",")});`);
      await queryInterface.sequelize.query(`DELETE FROM aulas WHERE id IN (${ids.join(",")});`);
    }
  },
};
