const prisma = require('../config/database');

async function listarJogos(req, res) {
  const { pesquisa } = req.query;

  try {
    const jogos = await prisma.jogoFPB.findMany({
      where: pesquisa
        ? {
            OR: [
              { equipaCasa: { contains: pesquisa, mode: 'insensitive' } },
              { equipaFora: { contains: pesquisa, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { competicao: true },
      orderBy: { dataJogo: 'desc' },
      take: 20,
    });

    res.json(jogos);
  } catch (erro) {
    console.error('Erro ao listar jogos:', erro);
    res.status(500).json({ erro: 'Erro ao pesquisar jogos.' });
  }
}

module.exports = { listarJogos };