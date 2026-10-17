const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

router.get('/', async (req, res) => {
  const { pesquisa, data, casaGrib, ano, mes } = req.query;

  try {
    const condicoes = [];

    if (pesquisa) {
      condicoes.push({
        OR: [
          { equipaCasa: { contains: pesquisa, mode: 'insensitive' } },
          { equipaFora: { contains: pesquisa, mode: 'insensitive' } },
        ],
      });
    }

    if (data) {
      condicoes.push({ dataJogo: data });
    }

    if (ano && mes) {
      const mesFormatado = String(mes).padStart(2, '0');
      condicoes.push({ dataJogo: { startsWith: `${ano}-${mesFormatado}` } });
    }

    if (casaGrib === 'true') {
      condicoes.push({
        OR: [
          { equipaCasa: { contains: 'GRIB', mode: 'insensitive' } },
          { equipaCasa: { contains: 'Brandoense', mode: 'insensitive' } },
        ],
      });
    }

    const jogos = await prisma.jogoFPB.findMany({
      where: condicoes.length > 0 ? { AND: condicoes } : undefined,
      include: { competicao: true },
      orderBy: { dataJogo: 'asc' },
      take: condicoes.length > 0 ? undefined : 20,
    });

    res.json(jogos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar jogos' });
  }
});

module.exports = router;