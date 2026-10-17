const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const autenticar = require('../middlewares/authMiddleware');
const apenasAdmin = require('../middlewares/apenasAdmin');

function formatar(item) {
  return {
    id: item.id,
    equipa: item.equipa,
    escalao: item.escalao,
    valor_arbitro: item.valorArbitro,
    valor_mesa: item.valorMesa,
  };
}

router.get('/', autenticar, async (req, res) => {
  try {
    const valores = await prisma.escalaoValor.findMany({
      orderBy: [{ equipa: 'asc' }, { escalao: 'asc' }],
    });
    res.json(valores.map(formatar));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao obter valores.' });
  }
});

router.post('/', autenticar, apenasAdmin, async (req, res) => {
  const { equipa, escalao, valor_arbitro, valor_mesa } = req.body;

  if (!equipa || !escalao || valor_arbitro == null || valor_mesa == null) {
    return res.status(400).json({ erro: 'Equipa, escalao, valor do arbitro e valor da mesa sao obrigatorios.' });
  }

  const valorArbitroNum = parseFloat(valor_arbitro);
  const valorMesaNum = parseFloat(valor_mesa);

  if (isNaN(valorArbitroNum) || isNaN(valorMesaNum)) {
    return res.status(400).json({ erro: 'Os valores devem ser numeros validos.' });
  }

  try {
    const novo = await prisma.escalaoValor.create({
      data: {
        equipa: equipa.trim(),
        escalao: escalao.trim(),
        valorArbitro: valorArbitroNum,
        valorMesa: valorMesaNum,
      },
    });
    res.status(201).json(formatar(novo));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ erro: 'Ja existe um valor definido para esta equipa e escalao.' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar escalao.' });
  }
});

router.put('/:id', autenticar, apenasAdmin, async (req, res) => {
  const { equipa, escalao, valor_arbitro, valor_mesa } = req.body;

  if (!equipa || !escalao || valor_arbitro == null || valor_mesa == null) {
    return res.status(400).json({ erro: 'Equipa, escalao, valor do arbitro e valor da mesa sao obrigatorios.' });
  }

  const valorArbitroNum = parseFloat(valor_arbitro);
  const valorMesaNum = parseFloat(valor_mesa);

  if (isNaN(valorArbitroNum) || isNaN(valorMesaNum)) {
    return res.status(400).json({ erro: 'Os valores devem ser numeros validos.' });
  }

  try {
    const atualizado = await prisma.escalaoValor.update({
      where: { id: parseInt(req.params.id) },
      data: {
        equipa: equipa.trim(),
        escalao: escalao.trim(),
        valorArbitro: valorArbitroNum,
        valorMesa: valorMesaNum,
      },
    });
    res.json(formatar(atualizado));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ erro: 'Ja existe um valor definido para esta equipa e escalao.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Registo nao encontrado.' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar registo.' });
  }
});

router.delete('/:id', autenticar, apenasAdmin, async (req, res) => {
  try {
    await prisma.escalaoValor.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Registo nao encontrado.' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao apagar registo.' });
  }
});

module.exports = router;