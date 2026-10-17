function gerarCsv(registos) {
  const temUtilizador = registos.some((r) => r.utilizador);

  const cabecalho = [];
  if (temUtilizador) {
    cabecalho.push('Utilizador');
  }
  cabecalho.push('Data', 'Hora', 'Equipa Casa', 'Equipa Fora', 'Pavilhao', 'Competicao', 'Funcao', 'Valor (EUR)', 'Observacoes');

  const linhas = registos.map((r) => {
    const linha = [];
    if (temUtilizador) {
      linha.push(r.utilizador ? `${r.utilizador.nome} (${r.utilizador.email})` : '');
    }
    linha.push(
      r.dataJogo,
      r.horaJogo || '',
      r.equipaCasa,
      r.equipaFora,
      r.pavilhao || '',
      r.competicao?.nome || r.competicao?.escalao || '',
      r.funcao === 'arbitro1' ? 'Arbitro' : r.funcao === 'mesa' ? 'Mesa' : r.funcao,
      r.valor != null ? `${r.valor}` : '',
      (r.observacoes || '').replace(/[\r\n]+/g, ' ')
    );
    return linha;
  });

  const escapar = (valor) => `"${String(valor).replace(/"/g, '""')}"`;

  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map(escapar).join(';'))
    .join('\r\n');

  return '\uFEFF' + csv;
}

module.exports = { gerarCsv };