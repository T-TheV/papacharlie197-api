"use strict";

function aula({ titulo, videoId, canal, objetivo, conceitos, cenario, decisao, referencia }) {
  return { tipo: "youtube", titulo, videoId, canal, objetivo, conceitos, cenario, decisao, referencia };
}

function laboratorio({ titulo, entrega, validacao, conceitos, referencia }) {
  return {
    tipo: "material",
    titulo,
    canal: "Cadência · laboratório guiado",
    objetivo: `Aplicar o conteúdo do módulo em uma atividade prática e produzir ${entrega}.`,
    conceitos,
    cenario: `No laboratório, você deverá produzir ${entrega} com decisões reproduzíveis, documentação suficiente e sem depender de passos ocultos.`,
    decisao: `Versionar a solução, executar em etapas pequenas e comprovar o resultado por meio de ${validacao}.`,
    referencia,
    entrega,
    validacao,
  };
}

const modulosDevOps = [
  {
    titulo: "Fundamentos de DevOps e fluxo de entrega",
    referencia: "https://dora.dev/guides/dora-metrics-four-keys/",
    aulas: [
      aula({
        titulo: "DevOps na prática: cultura, fluxo e relação com SRE",
        videoId: "0yWAtQ6wYNM",
        canal: "TechWorld with Nana",
        objetivo: "Compreender DevOps como um modelo sociotécnico que aproxima desenvolvimento e operações para entregar mudanças pequenas, frequentes e confiáveis.",
        conceitos: ["cultura e colaboração", "feedback contínuo", "automação do fluxo de entrega", "DevOps e SRE"],
        cenario: "Um produto sofre com repasses entre equipes, releases grandes e correções demoradas em produção.",
        decisao: "Criar responsabilidade compartilhada, encurtar o ciclo de feedback e automatizar etapas repetíveis da entrega.",
      }),
      aula({
        titulo: "Roadmap DevOps: competências e ordem de aprendizagem",
        videoId: "9pZ2xmsSDdo",
        canal: "TechWorld with Nana",
        objetivo: "Organizar a jornada DevOps conectando Linux, redes, Git, CI/CD, nuvem, containers, orquestração, observabilidade e infraestrutura como código.",
        conceitos: ["roadmap incremental", "fundamentos antes das ferramentas", "competências em T", "aprendizado orientado a projetos"],
        cenario: "Uma pessoa iniciante tenta aprender muitas ferramentas isoladas e não consegue montar um fluxo completo.",
        decisao: "Seguir uma sequência de fundamentos e consolidar cada etapa em projetos integrados e verificáveis.",
      }),
    ],
  },
  {
    titulo: "Linux, terminal e automação com Bash",
    referencia: "https://www.gnu.org/software/bash/manual/bash.html",
    aulas: [
      aula({
        titulo: "Linux para DevOps: sistema, arquivos, processos e pacotes",
        videoId: "ROjZy1WbCIA",
        canal: "freeCodeCamp.org",
        objetivo: "Operar um ambiente Linux entendendo hierarquia de arquivos, permissões, processos, serviços, pacotes e recursos do sistema.",
        conceitos: ["filesystem Linux", "usuários e permissões", "processos e serviços", "gerenciamento de pacotes"],
        cenario: "Uma aplicação funciona localmente, mas o serviço falha ao iniciar em um servidor Linux.",
        decisao: "Inspecionar serviço, processo, permissões, logs e dependências antes de alterar a aplicação.",
      }),
      aula({
        titulo: "Bash scripting: automatizando rotinas operacionais",
        videoId: "tK9Oc6AEnR4",
        canal: "freeCodeCamp.org",
        objetivo: "Criar scripts Bash seguros e reutilizáveis com variáveis, condicionais, laços, funções, códigos de saída e tratamento de falhas.",
        conceitos: ["shebang e execução", "pipes e redirecionamentos", "set -euo pipefail", "códigos de saída"],
        cenario: "Uma rotina manual de backup precisa executar diariamente e interromper imediatamente se alguma etapa falhar.",
        decisao: "Automatizar a rotina com script idempotente, validação de entradas, logs e propagação correta de erros.",
      }),
    ],
  },
  {
    titulo: "Redes, DNS, HTTP e diagnóstico",
    referencia: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work",
    aulas: [
      aula({
        titulo: "Fundamentos de redes para ambientes modernos",
        videoId: "fQbBPa0ADvs",
        canal: "freeCodeCamp.org",
        objetivo: "Entender camadas, endereçamento IP, sub-redes, roteamento, portas, protocolos e equipamentos usados na comunicação entre serviços.",
        conceitos: ["modelos OSI e TCP/IP", "IP e CIDR", "TCP e UDP", "roteamento e portas"],
        cenario: "Dois serviços estão ativos, mas não conseguem se comunicar entre sub-redes diferentes.",
        decisao: "Verificar resolução, rota, regras de firewall, porta de destino e escuta do processo em cada camada.",
      }),
      aula({
        titulo: "Como a Internet funciona: DNS, HTTP, TLS e entrega",
        videoId: "zN8YNNHcaZc",
        canal: "freeCodeCamp.org",
        objetivo: "Acompanhar uma requisição ponta a ponta, da resolução DNS ao estabelecimento de conexão, negociação TLS e resposta HTTP.",
        conceitos: ["resolução DNS", "requisição e resposta HTTP", "TLS e certificados", "CDN e cache"],
        cenario: "Um domínio resolve corretamente em uma rede, mas apresenta certificado inválido e resposta antiga em outra região.",
        decisao: "Diagnosticar separadamente DNS, cadeia TLS, origem, CDN e políticas de cache.",
      }),
    ],
  },
  {
    titulo: "Git e colaboração em código",
    referencia: "https://git-scm.com/book/pt-br/v2",
    aulas: [
      aula({
        titulo: "Git e GitHub completo: do commit ao pull request",
        videoId: "kB5e-gTAl_s",
        canal: "Dev Aprender | Jhonatan de Souza",
        objetivo: "Usar Git e GitHub no fluxo profissional com commits claros, branches, merge, pull request, histórico e arquivos ignorados.",
        conceitos: ["working tree, stage e commit", "branches e merge", "push e pull", "pull request e revisão"],
        cenario: "Duas pessoas alteraram o mesmo trecho e precisam integrar o trabalho preservando histórico e revisão.",
        decisao: "Atualizar a branch, resolver o conflito conscientemente, validar e integrar por pull request revisado.",
      }),
      aula({
        titulo: "Git por dentro: histórico, branches e recuperação",
        videoId: "RGOj5yH7evk",
        canal: "freeCodeCamp.org",
        objetivo: "Consolidar o modelo mental do Git para navegar no histórico, comparar alterações, desfazer erros e colaborar sem perder trabalho.",
        conceitos: ["grafo de commits", "HEAD e referências", "merge e rebase", "revert e reset"],
        cenario: "Um commit defeituoso já foi compartilhado e precisa ser desfeito sem reescrever o histórico da equipe.",
        decisao: "Criar um revert do commit problemático e publicar a correção de forma auditável.",
      }),
    ],
  },
  {
    titulo: "Integração e entrega contínuas",
    referencia: "https://docs.github.com/pt/actions",
    aulas: [
      aula({
        titulo: "GitHub Actions: pipeline CI/CD com Docker",
        videoId: "R8_veQiYBjI",
        canal: "TechWorld with Nana",
        objetivo: "Construir workflows acionados por eventos que testam, empacotam e publicam aplicações com GitHub Actions e Docker.",
        conceitos: ["workflow, job e step", "runners", "secrets e variáveis", "artefatos e imagens"],
        cenario: "Uma aplicação deve executar testes em todo pull request e publicar uma imagem apenas após merge na main.",
        decisao: "Separar validação e publicação em jobs com gatilhos, permissões e dependências explícitas.",
      }),
      aula({
        titulo: "GitLab CI/CD: pipeline completo até o deploy",
        videoId: "qP8kir2GUgo",
        canal: "TechWorld with Nana",
        objetivo: "Modelar estágios, jobs, runners, variáveis e ambientes em um pipeline GitLab que testa, constrói imagem e realiza deploy.",
        conceitos: [".gitlab-ci.yml", "stages e jobs", "runners e executors", "variáveis protegidas"],
        cenario: "O mesmo pipeline precisa promover uma versão testada por desenvolvimento, homologação e produção.",
        decisao: "Produzir um artefato imutável e promovê-lo entre ambientes com gates e credenciais protegidas.",
      }),
      aula({
        titulo: "Jenkins do zero ao pipeline como código",
        videoId: "6YZvp2GwT0A",
        canal: "DevOps Journey",
        objetivo: "Configurar Jenkins e transformar tarefas manuais em um Jenkinsfile versionado, reproduzível e observável.",
        conceitos: ["controller e agents", "Jenkinsfile", "pipeline declarativo", "credenciais e plugins"],
        cenario: "Jobs configurados apenas pela interface divergem entre ambientes e não passam por revisão de código.",
        decisao: "Migrar a configuração para Jenkinsfile, reduzir plugins e versionar o pipeline junto ao projeto.",
      }),
    ],
  },
  {
    titulo: "Containers com Docker",
    referencia: "https://docs.docker.com/get-started/",
    aulas: [
      aula({
        titulo: "Docker completo: imagens, containers, Compose e volumes",
        videoId: "3c-iBn73dDE",
        canal: "TechWorld with Nana",
        objetivo: "Containerizar uma aplicação, compor serviços, persistir dados, depurar containers e publicar imagens em um registry.",
        conceitos: ["imagem e container", "Dockerfile", "Docker Compose", "volumes e redes"],
        cenario: "Uma aplicação de três serviços precisa rodar de forma igual nas máquinas do time e no pipeline.",
        decisao: "Definir imagens reproduzíveis e um Compose com configuração externa, redes e volumes explícitos.",
      }),
      aula({
        titulo: "Instalação e primeiros passos com Docker",
        videoId: "4XwzR9vXT5s",
        canal: "LINUXtips",
        objetivo: "Preparar o ambiente Docker e validar daemon, cliente, execução, isolamento e ciclo de vida dos primeiros containers.",
        conceitos: ["Docker Engine", "daemon e cliente", "ciclo de vida do container", "namespaces e cgroups"],
        cenario: "O cliente Docker está instalado, mas não consegue se conectar ao daemon em uma máquina Linux.",
        decisao: "Verificar serviço, socket, permissões do usuário e contexto ativo antes de reinstalar a ferramenta.",
      }),
      aula({
        titulo: "Dockerfile: criando imagens pequenas e seguras",
        videoId: "bJUccjvkPg4",
        canal: "LINUXtips",
        objetivo: "Escrever Dockerfiles eficientes usando cache, contexto adequado, usuário não privilegiado e builds em múltiplos estágios.",
        conceitos: ["camadas e cache", "multi-stage build", ".dockerignore", "usuário não root"],
        cenario: "A imagem da aplicação ficou enorme, lenta para publicar e executa como root.",
        decisao: "Aplicar multi-stage build, base mínima, contexto enxuto e usuário dedicado na imagem final.",
      }),
    ],
  },
  {
    titulo: "Kubernetes e empacotamento com Helm",
    referencia: "https://kubernetes.io/pt-br/docs/tutorials/kubernetes-basics/",
    aulas: [
      aula({
        titulo: "Kubernetes completo: arquitetura, workloads, rede e dados",
        videoId: "X48VuDVv0do",
        canal: "TechWorld with Nana",
        objetivo: "Implantar e operar workloads no Kubernetes entendendo control plane, Pods, Deployments, Services, Ingress, configuração e persistência.",
        conceitos: ["control plane e nodes", "Pod e Deployment", "Service e Ingress", "ConfigMap, Secret e volumes"],
        cenario: "Uma aplicação no cluster precisa escalar, receber tráfego externo e sobreviver à recriação de Pods.",
        decisao: "Usar Deployment, Service/Ingress, probes, configuração externa e armazenamento persistente conforme o estado da aplicação.",
      }),
      aula({
        titulo: "Helm: charts, templates e releases Kubernetes",
        videoId: "-ykwb1d0DXU",
        canal: "TechWorld with Nana",
        objetivo: "Empacotar recursos Kubernetes em charts parametrizáveis e administrar instalação, atualização e rollback como releases.",
        conceitos: ["chart e templates", "values", "release", "upgrade e rollback"],
        cenario: "O mesmo conjunto de manifests é copiado e editado manualmente para cada ambiente.",
        decisao: "Criar um chart único com values por ambiente, revisão das mudanças e rollback de release.",
      }),
    ],
  },
  {
    titulo: "Infraestrutura como código e configuração",
    referencia: "https://developer.hashicorp.com/terraform/tutorials",
    aulas: [
      aula({
        titulo: "Terraform: fundamentos de infraestrutura declarativa",
        videoId: "l5k1ai_GBDE",
        canal: "TechWorld with Nana",
        objetivo: "Entender providers, recursos, estado, plano e aplicação no fluxo declarativo do Terraform.",
        conceitos: ["infraestrutura declarativa", "providers e resources", "state", "plan e apply"],
        cenario: "Ambientes criados manualmente apresentam diferenças e não há revisão prévia do impacto de uma mudança.",
        decisao: "Descrever recursos em código, revisar o plan e manter o estado remoto protegido e bloqueável.",
      }),
      aula({
        titulo: "Ansible do básico ao avançado",
        videoId: "lhFvMsy6VX8",
        canal: "TechWorld with Nana",
        objetivo: "Automatizar configuração e deploy com inventários, módulos, playbooks, variáveis, roles e execução idempotente.",
        conceitos: ["inventário", "playbooks e módulos", "idempotência", "variáveis e roles"],
        cenario: "Dezenas de servidores precisam receber a mesma configuração sem comandos manuais divergentes.",
        decisao: "Expressar o estado desejado em roles idempotentes, testar em subconjunto e aplicar de forma controlada.",
      }),
    ],
  },
  {
    titulo: "Nuvem pública: AWS e Azure",
    referencia: "https://aws.amazon.com/pt/getting-started/",
    aulas: [
      aula({
        titulo: "AWS Cloud Practitioner: serviços e arquitetura essenciais",
        videoId: "NhDYbskXRgc",
        canal: "freeCodeCamp.org",
        objetivo: "Reconhecer os serviços fundamentais de computação, rede, armazenamento, bancos, identidade, segurança, observabilidade e custos na AWS.",
        conceitos: ["regiões e zonas", "IAM e responsabilidade compartilhada", "EC2, S3 e RDS", "custos e alta disponibilidade"],
        cenario: "Uma aplicação precisa começar pequena, armazenar arquivos duráveis e crescer sem depender de um único datacenter.",
        decisao: "Combinar serviços gerenciados, múltiplas zonas, IAM de menor privilégio e monitoramento de custo.",
      }),
      aula({
        titulo: "Azure Fundamentals: identidade, recursos e governança",
        videoId: "5abffC-K40c",
        canal: "freeCodeCamp.org",
        objetivo: "Entender a organização do Azure, serviços centrais, Microsoft Entra ID, governança, segurança, custos e modelos de responsabilidade.",
        conceitos: ["subscriptions e resource groups", "Entra ID e RBAC", "compute, storage e networking", "Policy e custos"],
        cenario: "Vários times usam uma assinatura Azure e precisam separar custos e impedir recursos fora dos padrões corporativos.",
        decisao: "Estruturar escopos, RBAC, tags, budgets e Azure Policy com responsabilidades bem definidas.",
        referencia: "https://learn.microsoft.com/pt-br/training/paths/azure-fundamentals-describe-cloud-concepts/",
      }),
    ],
  },
  {
    titulo: "Observabilidade e confiabilidade",
    referencia: "https://opentelemetry.io/docs/concepts/observability-primer/",
    aulas: [
      aula({
        titulo: "Prometheus: métricas, coleta e alertas",
        videoId: "h4Sl21AKiDg",
        canal: "TechWorld with Nana",
        objetivo: "Compreender o modelo de métricas do Prometheus, descoberta de alvos, coleta pull, PromQL, armazenamento e integração com alertas.",
        conceitos: ["targets e scraping", "métricas e labels", "PromQL", "Alertmanager"],
        cenario: "A equipe só descobre degradações depois de reclamações e não consegue relacionar sintomas a recursos.",
        decisao: "Instrumentar indicadores úteis, coletar séries com labels controladas e alertar sobre sintomas acionáveis.",
        referencia: "https://prometheus.io/docs/introduction/overview/",
      }),
      aula({
        titulo: "OpenTelemetry: traces, métricas e logs correlacionados",
        videoId: "dfpGU9al_i4",
        canal: "Is it Observable",
        objetivo: "Instrumentar e transportar telemetria independente de fornecedor usando APIs, SDKs, Collector e contexto distribuído.",
        conceitos: ["traces, metrics e logs", "context propagation", "Collector", "instrumentação"],
        cenario: "Uma requisição atravessa vários microsserviços e o log isolado de cada serviço não revela onde está a latência.",
        decisao: "Propagar contexto, gerar spans e correlacionar traces com métricas e logs por identificadores comuns.",
      }),
      aula({
        titulo: "SRE: SLOs, error budgets, incidentes e toil",
        videoId: "eopc_ijIfLg",
        canal: "Google Cloud Events",
        objetivo: "Aplicar práticas de SRE para equilibrar velocidade e confiabilidade por meio de SLIs, SLOs, error budgets, redução de toil e post-mortems sem culpa.",
        conceitos: ["SLI, SLO e SLA", "error budget", "toil", "incidente e post-mortem"],
        cenario: "O time busca disponibilidade absoluta, bloqueia mudanças e ainda sofre incidentes recorrentes sem aprendizado estruturado.",
        decisao: "Definir SLO baseado no usuário, usar o error budget para decisões e transformar incidentes em ações sistêmicas.",
        referencia: "https://sre.google/resources/",
      }),
    ],
  },
  {
    titulo: "DevSecOps e GitOps",
    referencia: "https://owasp.org/www-project-devsecops-guideline/",
    aulas: [
      aula({
        titulo: "DevSecOps: segurança integrada ao ciclo de entrega",
        videoId: "JfiWi8RjN-8",
        canal: "freeCodeCamp.org",
        objetivo: "Integrar segurança desde o planejamento até produção com threat modeling, análise de código, dependências, imagens, APIs e controles automatizados.",
        conceitos: ["shift left e shift everywhere", "SAST, DAST e SCA", "segurança de APIs", "governança no pipeline"],
        cenario: "Vulnerabilidades só são avaliadas perto do release, quando a correção é cara e o prazo incentiva exceções.",
        decisao: "Distribuir verificações proporcionais ao risco ao longo do pipeline e tratar achados com feedback rápido e rastreável.",
      }),
      aula({
        titulo: "Argo CD: entrega contínua com GitOps no Kubernetes",
        videoId: "MeU5_k9ssrs",
        canal: "TechWorld with Nana",
        objetivo: "Usar Git como fonte de verdade e Argo CD para reconciliar continuamente o estado desejado de aplicações Kubernetes.",
        conceitos: ["Git como fonte de verdade", "reconciliação", "drift", "sync e rollback"],
        cenario: "Alterações manuais no cluster criam drift e não existe trilha clara de quem mudou a configuração em produção.",
        decisao: "Versionar o estado desejado e permitir que o controlador detecte e reconcilie desvios de forma auditável.",
        referencia: "https://argo-cd.readthedocs.io/en/stable/getting_started/",
      }),
    ],
  },
  {
    titulo: "Projeto integrador DevOps",
    referencia: "https://github.com/chainguard-dev/learning-labs",
    aulas: [
      aula({
        titulo: "Projeto guiado: Docker e Kubernetes para engenharia",
        videoId: "WhzQG9ki8Xo",
        canal: "LINUXtips",
        objetivo: "Conectar construção de imagens, execução de containers e orquestração Kubernetes em um fluxo de engenharia reproduzível.",
        conceitos: ["build reproduzível", "registry", "deploy Kubernetes", "validação operacional"],
        cenario: "Uma aplicação precisa sair do repositório e chegar a um ambiente Kubernetes com versão identificável e rollback possível.",
        decisao: "Gerar imagem imutável, publicar com tag rastreável e implantar por manifest versionado com verificações de saúde.",
      }),
      aula({
        titulo: "Capstone: montando o ecossistema DevOps completo",
        videoId: "cx3qg-xDPuk",
        canal: "LINUXtips",
        objetivo: "Integrar repositório, pipeline, imagens, infraestrutura, Kubernetes, observabilidade e segurança em uma entrega ponta a ponta.",
        conceitos: ["pipeline ponta a ponta", "infraestrutura automatizada", "observabilidade por padrão", "segurança e evidências"],
        cenario: "O projeto final deve demonstrar entrega repetível, operação observável e recuperação sem depender de passos ocultos.",
        decisao: "Documentar arquitetura e runbook, automatizar a entrega, medir o serviço e demonstrar falha, rollback e recuperação.",
      }),
    ],
  },
];

const laboratoriosPorModulo = {
  "Fundamentos de DevOps e fluxo de entrega": [
    laboratorio({
      titulo: "Laboratório: mapear o fluxo de valor de uma entrega",
      entrega: "um value stream map do commit até produção, com esperas, repasses, riscos e oportunidades de automação",
      validacao: "lead time estimado, gargalos identificados e três melhorias priorizadas",
      conceitos: ["value stream", "lead time", "feedback", "gargalos"],
    }),
    laboratorio({
      titulo: "Desafio: definir métricas DORA para um time",
      entrega: "uma ficha de medição das quatro métricas DORA com fontes, frequência e responsáveis",
      validacao: "fórmulas, exemplos e ausência de metas que incentivem manipulação",
      conceitos: ["deployment frequency", "lead time for changes", "change failure rate", "recovery time"],
    }),
    laboratorio({
      titulo: "Checkpoint: desenhar o primeiro plano de evolução DevOps",
      entrega: "um roadmap de 90 dias com fundamentos, práticas, ferramentas e resultados esperados",
      validacao: "dependências claras, marcos mensuráveis e um projeto integrador",
      conceitos: ["roadmap", "maturidade", "resultado", "aprendizado incremental"],
    }),
  ],
  "Linux, terminal e automação com Bash": [
    laboratorio({
      titulo: "Laboratório: administrar serviço e permissões no Linux",
      entrega: "um serviço systemd não privilegiado com usuário dedicado, variáveis externas e diretórios protegidos",
      validacao: "status do serviço, permissões mínimas e logs consultáveis no journal",
      conceitos: ["systemd", "usuários", "permissões", "journald"],
    }),
    laboratorio({
      titulo: "Laboratório: script de backup idempotente",
      entrega: "um script Bash de backup com rotação, checksum, logs e tratamento de falhas",
      validacao: "duas execuções seguras, código de saída e restauração de um arquivo",
      conceitos: ["Bash", "idempotência", "checksum", "retenção"],
    }),
    laboratorio({
      titulo: "Diagnóstico: servidor Linux sob pressão",
      entrega: "um runbook para investigar CPU, memória, disco, processos, portas e arquivos de log",
      validacao: "comandos explicados, hipótese registrada e evidência antes da correção",
      conceitos: ["top e ps", "memória e disco", "ss e portas", "logs"],
    }),
  ],
  "Redes, DNS, HTTP e diagnóstico": [
    laboratorio({
      titulo: "Laboratório: sub-redes e conectividade entre serviços",
      entrega: "um plano de endereçamento CIDR com duas sub-redes e regras mínimas de comunicação",
      validacao: "faixas sem sobreposição, rotas coerentes e testes de porta",
      conceitos: ["CIDR", "sub-redes", "roteamento", "firewall"],
    }),
    laboratorio({
      titulo: "Laboratório: publicar HTTPS com DNS e proxy reverso",
      entrega: "um serviço publicado por domínio com proxy reverso, certificado TLS e redirecionamento HTTPS",
      validacao: "resolução DNS, cadeia do certificado e resposta HTTP esperada",
      conceitos: ["DNS", "proxy reverso", "TLS", "HTTP"],
    }),
    laboratorio({
      titulo: "Diagnóstico: localizar uma falha de rede por camadas",
      entrega: "uma árvore de decisão para investigar resolução, rota, conexão, TLS e aplicação",
      validacao: "evidência coletada em cada camada sem tentativas aleatórias",
      conceitos: ["dig", "traceroute", "curl", "openssl s_client"],
    }),
  ],
  "Git e colaboração em código": [
    laboratorio({
      titulo: "Laboratório: fluxo de branches e pull request",
      entrega: "um repositório com branch curta, commits semânticos, conflito resolvido e pull request revisado",
      validacao: "histórico legível, checks verdes e revisão registrada",
      conceitos: ["branch", "commit", "merge", "pull request"],
    }),
    laboratorio({
      titulo: "Laboratório: desfazer erros sem perder histórico",
      entrega: "uma sequência demonstrando restore, revert e reset em cenários seguros",
      validacao: "histórico antes e depois e justificativa da escolha de cada comando",
      conceitos: ["restore", "revert", "reset", "reflog"],
    }),
    laboratorio({
      titulo: "Checkpoint: política de colaboração Git",
      entrega: "um CONTRIBUTING com convenção de commits, proteção de branch, revisão e estratégia de releases",
      validacao: "regras executáveis e compatíveis com integração contínua",
      conceitos: ["branch protection", "code review", "conventional commits", "tags"],
    }),
  ],
  "Integração e entrega contínuas": [
    laboratorio({
      titulo: "Laboratório: pipeline CI com qualidade e artefato",
      entrega: "um pipeline que instala dependências, executa lint/testes, gera artefato e publica evidências",
      validacao: "falha rápida, cache seguro e artefato rastreável ao commit",
      conceitos: ["CI", "quality gate", "cache", "artefato imutável"],
    }),
    laboratorio({
      titulo: "Desafio: promoção segura entre ambientes",
      entrega: "um fluxo de promoção do mesmo artefato por desenvolvimento, homologação e produção",
      validacao: "aprovações, secrets por ambiente, rollback e trilha de auditoria",
      conceitos: ["CD", "environments", "secrets", "rollback"],
    }),
  ],
  "Containers com Docker": [
    laboratorio({
      titulo: "Laboratório: containerizar uma API com banco",
      entrega: "uma API e um banco executados por Compose com healthchecks, rede e persistência",
      validacao: "build limpo, inicialização previsível e dados preservados após recriação",
      conceitos: ["Dockerfile", "Compose", "healthcheck", "volume"],
    }),
    laboratorio({
      titulo: "Desafio: otimizar e endurecer uma imagem",
      entrega: "uma imagem multi-stage mínima, executada sem root e com dependências fixadas",
      validacao: "comparação de tamanho, scan de vulnerabilidades e execução funcional",
      conceitos: ["multi-stage", "non-root", "SBOM", "image scanning"],
    }),
  ],
  "Kubernetes e empacotamento com Helm": [
    laboratorio({
      titulo: "Laboratório: implantar aplicação no Kubernetes",
      entrega: "manifests de Deployment, Service, ConfigMap, Secret e Ingress para uma aplicação",
      validacao: "rollout saudável, probes, acesso externo e configuração sem rebuild",
      conceitos: ["Deployment", "Service", "Ingress", "probes"],
    }),
    laboratorio({
      titulo: "Laboratório: persistência e atualização sem indisponibilidade",
      entrega: "um workload com volume persistente, estratégia de rollout e limites de recursos",
      validacao: "dados preservados, rollback testado e ausência de downtime perceptível",
      conceitos: ["PVC", "rolling update", "requests e limits", "rollback"],
    }),
    laboratorio({
      titulo: "Desafio: transformar manifests em Helm chart",
      entrega: "um chart Helm com templates, values por ambiente e documentação de instalação",
      validacao: "helm lint, renderização comparada e upgrade/rollback executados",
      conceitos: ["chart", "templates", "values", "release"],
    }),
  ],
  "Infraestrutura como código e configuração": [
    laboratorio({
      titulo: "Laboratório: provisionar infraestrutura com Terraform",
      entrega: "um módulo Terraform reutilizável com variáveis, outputs e recursos de rede e computação",
      validacao: "fmt, validate, plan revisável e apply/destroy controlados",
      conceitos: ["module", "variables", "outputs", "plan"],
    }),
    laboratorio({
      titulo: "Laboratório: state remoto e colaboração",
      entrega: "uma configuração de backend remoto com bloqueio, separação de ambientes e proteção de segredos",
      validacao: "concorrência simulada, state recuperável e nenhum segredo versionado",
      conceitos: ["remote state", "locking", "workspaces", "segredos"],
    }),
    laboratorio({
      titulo: "Desafio: configurar servidores com Ansible",
      entrega: "uma role Ansible idempotente que instala, configura e inicia uma aplicação",
      validacao: "segunda execução sem mudanças, handlers corretos e inventário separado",
      conceitos: ["role", "inventory", "handlers", "idempotência"],
    }),
  ],
  "Nuvem pública: AWS e Azure": [
    laboratorio({
      titulo: "Laboratório: arquitetura web resiliente na nuvem",
      entrega: "um diagrama de aplicação web multi-AZ com rede, balanceamento, computação, banco e storage",
      validacao: "fluxos, limites de confiança, pontos de falha e estimativa de custo",
      conceitos: ["alta disponibilidade", "VPC/VNet", "load balancer", "serviços gerenciados"],
    }),
    laboratorio({
      titulo: "Laboratório: identidade e menor privilégio",
      entrega: "uma matriz de acesso e políticas para pessoas, pipeline e workload sem credenciais permanentes",
      validacao: "negação por padrão, escopo mínimo e rotação ou federação de identidade",
      conceitos: ["IAM", "RBAC", "federação", "menor privilégio"],
    }),
    laboratorio({
      titulo: "Desafio: custos, tags e guardrails",
      entrega: "uma política de tags, budgets, alertas e controles preventivos para uma conta de projeto",
      validacao: "centro de custo identificável e alerta antes de ultrapassar o orçamento",
      conceitos: ["FinOps", "tags", "budgets", "policy"],
    }),
  ],
  "Observabilidade e confiabilidade": [
    laboratorio({
      titulo: "Laboratório: instrumentar e observar um serviço",
      entrega: "um serviço com métricas RED, traces distribuídos e logs estruturados correlacionados",
      validacao: "dashboard, trace ponta a ponta e busca por correlation ID",
      conceitos: ["metrics", "traces", "logs", "correlation ID"],
    }),
    laboratorio({
      titulo: "Desafio SRE: SLO, alerta e post-mortem",
      entrega: "um SLO com SLI, error budget, alertas por burn rate e modelo de post-mortem",
      validacao: "medição centrada no usuário e alerta acionável antes de esgotar o orçamento",
      conceitos: ["SLI", "SLO", "burn rate", "post-mortem"],
    }),
  ],
  "DevSecOps e GitOps": [
    laboratorio({
      titulo: "Laboratório: pipeline DevSecOps em camadas",
      entrega: "um pipeline com análise de segredo, SAST, SCA, scan de imagem e política de severidade",
      validacao: "achados rastreáveis, exceção com prazo e bloqueio proporcional ao risco",
      conceitos: ["secret scanning", "SAST", "SCA", "container scanning"],
    }),
    laboratorio({
      titulo: "Laboratório: GitOps com reconciliação e rollback",
      entrega: "um repositório de configuração sincronizado pelo Argo CD com promoção e rollback por Git",
      validacao: "drift detectado, sync auditável e recuperação por reversão de commit",
      conceitos: ["GitOps", "reconciliation", "drift", "rollback"],
    }),
    laboratorio({
      titulo: "Desafio: threat model da cadeia de entrega",
      entrega: "um threat model do commit ao runtime com ativos, ameaças, controles e evidências",
      validacao: "riscos priorizados e controles associados a responsáveis e sinais de detecção",
      conceitos: ["threat modeling", "supply chain", "proveniência", "policy as code"],
    }),
  ],
  "Projeto integrador DevOps": [
    laboratorio({
      titulo: "Capstone I: arquitetura e repositórios",
      entrega: "a arquitetura do projeto, ADRs, estratégia de repositórios e backlog de entrega",
      validacao: "decisões justificadas, limites claros e critérios de aceite executáveis",
      conceitos: ["arquitetura", "ADR", "repositórios", "backlog"],
    }),
    laboratorio({
      titulo: "Capstone II: entrega automatizada e plataforma",
      entrega: "infraestrutura como código, pipeline, imagens e implantação Kubernetes do projeto",
      validacao: "execução repetível do zero, promoção e rollback demonstrados",
      conceitos: ["IaC", "CI/CD", "containers", "Kubernetes"],
    }),
    laboratorio({
      titulo: "Capstone III: operação, segurança e apresentação",
      entrega: "dashboards, SLO, alertas, controles de segurança, runbook e demonstração final",
      validacao: "incidente simulado, recuperação medida e evidências reunidas no portfólio",
      conceitos: ["observabilidade", "SRE", "DevSecOps", "runbook"],
    }),
  ],
};

for (const modulo of modulosDevOps) {
  modulo.aulas.push(...(laboratoriosPorModulo[modulo.titulo] || []).map((item) => ({
    ...item,
    referencia: item.referencia || modulo.referencia,
  })));
}

module.exports = { modulosDevOps };
