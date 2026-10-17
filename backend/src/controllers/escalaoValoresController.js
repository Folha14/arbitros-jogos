const prisma = require('../config/database');

async function listarEscaloes(req, res) {
  try {
    const escaloes = await prisma.escalaoValor.findMany({
      orderBy: [{ equipa: 'asc' }, { escalao: 'asc' }],
    });
    res.json(escaloes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar escaloes' });
  }
}

async function criarEscalao(req, res) {
  const { equipa, escalao, valorArbitro, valorMesa } = req.body;

  if (!equipa || !escalao || valorArbitro == null || valorMesa == null) {
    return res.status(400).json({ erro: 'Campos obrigatorios em falta' });
  }

  try {
    const novo = await prisma.escalaoValor.create({
      data: {
        equipa: String(equipa).trim(),
        escalao: String(escalao).trim(),
        valorArbitro: parseFloat(valorArbitro),
        valorMesa: parseFloat(valorMesa),
      },
    });
    res.status(201).json(novo);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ erro: 'Ja existe um valor definido para esta equipa e escalao.' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar escalao' });
  }
}

async function atualizarEscalao(req, res) {
  const { valorArbitro, valorMesa } = req.body;

  try {
    const atualizado = await prisma.escalaoValor.update({
      where: { id: Number(req.params.id) },
      data: {
        valorArbitro: parseFloat(valorArbitro),
        valorMesa: parseFloat(valorMesa),
      },
    });
    res.json(atualizado);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Registo nao encontrado.' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar escalao' });
  }
}

async function removerEscalao(req, res) {
  try {
    await prisma.escalaoValor.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Registo nao encontrado.' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao remover escalao' });
  }
}

module.exports = { listarEscaloes, criarEscalao, atualizarEscalao, removerEscalao };