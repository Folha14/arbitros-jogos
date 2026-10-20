const crypto = require('crypto');

function gerarHashJogo({ dataJogo, equipaCasa, equipaFora, horaJogo, competicaoId }) {
  const base = [dataJogo, horaJogo || '', equipaCasa, equipaFora, competicaoId].join('|');
  return crypto.createHash('sha256').update(base).digest('hex');
}

module.exports = { gerarHashJogo };
