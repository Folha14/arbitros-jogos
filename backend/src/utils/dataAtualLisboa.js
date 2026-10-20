function obterDataAtualLisboa(instante = new Date()) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instante);
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));

  return `${valores.year}-${valores.month}-${valores.day}`;
}

module.exports = { obterDataAtualLisboa };
