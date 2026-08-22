const CONFIGURACAO_PADRAO = Object.freeze({
  minutosPorDia: 90,
  metaQuestoesPorSessao: 10,
  disponibilidadePorDia: {},
});

function limitarInteiro(valor, fallback, minimo, maximo) {
  const numero = Math.round(Number(valor));
  if (!Number.isFinite(numero)) return fallback;
  return Math.max(minimo, Math.min(maximo, numero));
}

function normalizarConfiguracao(configuracao = {}) {
  const disponibilidadePorDia = {};
  for (let dia = 0; dia <= 6; dia += 1) {
    if (configuracao.disponibilidadePorDia?.[dia] === undefined) continue;
    disponibilidadePorDia[dia] = limitarInteiro(
      configuracao.disponibilidadePorDia[dia],
      CONFIGURACAO_PADRAO.minutosPorDia,
      0,
      480,
    );
  }
  return {
    minutosPorDia: limitarInteiro(configuracao.minutosPorDia, CONFIGURACAO_PADRAO.minutosPorDia, 15, 480),
    metaQuestoesPorSessao: limitarInteiro(
      configuracao.metaQuestoesPorSessao,
      CONFIGURACAO_PADRAO.metaQuestoesPorSessao,
      5,
      100,
    ),
    disponibilidadePorDia,
  };
}

function minutosDisponiveis(configuracao, data = new Date(), diasEstudo = []) {
  const config = normalizarConfiguracao(configuracao);
  const dia = data.getDay();
  if (Object.prototype.hasOwnProperty.call(config.disponibilidadePorDia, dia)) {
    return config.disponibilidadePorDia[dia];
  }
  if (Array.isArray(diasEstudo) && diasEstudo.length > 0 && !diasEstudo.includes(dia)) return 0;
  return config.minutosPorDia;
}

function selecionarAgenda(candidatos, totalDisponivel) {
  let restante = Math.max(0, Math.round(Number(totalDisponivel) || 0));
  const selecionados = [];
  const ordenados = [...candidatos].sort((a, b) => b.prioridade - a.prioridade);

  for (const candidato of ordenados) {
    if (restante < 5) break;
    const estimado = Math.max(5, Math.round(Number(candidato.minutosEstimados) || 5));
    const minimoUtil = candidato.tipo === "aula" ? Math.min(25, estimado) : Math.min(5, estimado);
    if (restante < minimoUtil) continue;
    const planejado = Math.min(estimado, restante);
    selecionados.push({ ...candidato, minutosEstimados: estimado, minutosPlanejados: planejado });
    restante -= planejado;
  }

  return { itens: selecionados, minutosPlanejados: totalDisponivel - restante, minutosLivres: restante };
}

module.exports = {
  CONFIGURACAO_PADRAO,
  normalizarConfiguracao,
  minutosDisponiveis,
  selecionarAgenda,
};
