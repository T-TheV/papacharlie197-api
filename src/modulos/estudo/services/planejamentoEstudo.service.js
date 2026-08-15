const REGRAS_PADRAO = Object.freeze({
  minutosQuestaoObjetiva: 2,
  minutosQuestaoDiscursiva: 12,
  margemPercentual: 10,
  arredondamentoMinutos: 5,
  focoMaximoMinutos: 25,
  pausaMinutos: 5,
  fallbackVideoMinutos: 30,
  maximoPlanejadoMinutos: 480,
});

const CAMPOS_REGRAS = Object.keys(REGRAS_PADRAO);

function inteiroPositivo(valor, fallback, { permiteZero = false } = {}) {
  const numero = Number(valor);
  const minimo = permiteZero ? 0 : 1;
  if (!Number.isFinite(numero) || numero < minimo) return fallback;
  return Math.round(numero);
}

function normalizarRegras(configuracao = {}) {
  const regras = { ...REGRAS_PADRAO };
  for (const campo of CAMPOS_REGRAS) {
    if (configuracao[campo] === undefined) continue;
    regras[campo] = inteiroPositivo(configuracao[campo], regras[campo], {
      permiteZero: campo === "margemPercentual",
    });
  }
  return regras;
}

function obterRegrasDoContexto(contexto = {}) {
  return normalizarRegras({
    ...(contexto.agencia?.configuracao_estudo || {}),
    ...(contexto.trilha?.configuracao_estudo || {}),
  });
}

function criarEtapas(tempoFocoMinutos, regras = REGRAS_PADRAO) {
  const total = Math.max(0, Math.round(Number(tempoFocoMinutos) || 0));
  const focoMaximo = regras.focoMaximoMinutos;
  const etapas = [];
  let restante = total;

  while (restante > 0) {
    const duracaoFoco = Math.min(focoMaximo, restante);
    etapas.push({ tipo: "foco", duracaoMinutos: duracaoFoco, duracaoSegundos: duracaoFoco * 60 });
    restante -= duracaoFoco;
    if (restante > 0) {
      etapas.push({
        tipo: "pausa",
        duracaoMinutos: regras.pausaMinutos,
        duracaoSegundos: regras.pausaMinutos * 60,
      });
    }
  }
  return etapas;
}

function calcularPlanoEstudo({
  duracaoVideoSegundos,
  possuiVideo,
  quantidadeObjetivas = 0,
  quantidadeDiscursivas = 0,
  regras = REGRAS_PADRAO,
}) {
  const regrasNormalizadas = normalizarRegras(regras);
  const duracaoConfirmada = Number.isFinite(Number(duracaoVideoSegundos)) && Number(duracaoVideoSegundos) > 0;
  const segundosVideo = duracaoConfirmada
    ? Math.round(Number(duracaoVideoSegundos))
    : possuiVideo
      ? regrasNormalizadas.fallbackVideoMinutos * 60
      : 0;
  const objetivas = Math.max(0, Math.round(Number(quantidadeObjetivas) || 0));
  const discursivas = Math.max(0, Math.round(Number(quantidadeDiscursivas) || 0));
  const segundosObjetivas = objetivas * regrasNormalizadas.minutosQuestaoObjetiva * 60;
  const segundosDiscursivas = discursivas * regrasNormalizadas.minutosQuestaoDiscursiva * 60;
  const segundosBase = segundosVideo + segundosObjetivas + segundosDiscursivas;
  const margemSegundos = Math.ceil(segundosBase * (regrasNormalizadas.margemPercentual / 100));
  const intervaloSegundos = regrasNormalizadas.arredondamentoMinutos * 60;
  const totalEstimadoSegundos = segundosBase === 0
    ? 0
    : Math.ceil((segundosBase + margemSegundos) / intervaloSegundos) * intervaloSegundos;
  const totalEstimadoMinutos = totalEstimadoSegundos / 60;
  const etapas = criarEtapas(totalEstimadoMinutos, regrasNormalizadas);

  return {
    estadoDuracao: !possuiVideo ? "sem_video" : duracaoConfirmada ? "confirmada" : "estimada",
    video: {
      segundos: segundosVideo,
      minutos: Math.ceil(segundosVideo / 60),
      fonte: duracaoConfirmada ? "youtube" : possuiVideo ? "fallback" : null,
      estimada: Boolean(possuiVideo && !duracaoConfirmada),
    },
    objetivas: {
      quantidade: objetivas,
      minutos: segundosObjetivas / 60,
    },
    discursivas: {
      quantidade: discursivas,
      minutos: segundosDiscursivas / 60,
    },
    margem: {
      percentual: regrasNormalizadas.margemPercentual,
      segundos: margemSegundos,
      minutos: Math.ceil(margemSegundos / 60),
    },
    totalEstimadoSegundos,
    totalEstimadoMinutos,
    quantidadeCiclos: etapas.filter((etapa) => etapa.tipo === "foco").length,
    etapas,
    regras: regrasNormalizadas,
  };
}

module.exports = {
  REGRAS_PADRAO,
  normalizarRegras,
  obterRegrasDoContexto,
  criarEtapas,
  calcularPlanoEstudo,
};
