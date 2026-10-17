const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const verificarToken = require('../middlewares/authMiddleware');
const apenasAdmin = require('../middlewares/apenasAdmin');

router.use(verificarToken);
router.use(apenasAdmin);

router.get('/', async (req, res) => {
  try {
    // Atualização automática de contas criadas anteriormente sem flag de confirmação
    await prisma.utilizador.updateMany({
      where: { emailConfirmado: false, tokenConfirmacaoEmail: null },
      data: { emailConfirmado: true },
    });

    const utilizadores = await prisma.utilizador.findMany({
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        role: true,
        funcaoPadrao: true,
        emailConfirmado: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'desc' },
        { nome: 'asc' },
      ],
    });

    return res.json({ resultados: utilizadores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar utilizadores.' });
  }
});

router.patch('/:id/promover', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ erro: 'ID invalido.' });
  }

  try {
    const utilizador = await prisma.utilizador.findUnique({
      where: { id },
    });

    if (!utilizador) {
      return res.status(404).json({ erro: 'Utilizador nao encontrado.' });
    }

    if (utilizador.role === 'admin') {
      return res.status(400).json({ erro: 'Este utilizador ja e admin.' });
    }

    const atualizado = await prisma.utilizador.update({
      where: { id },
      data: { role: 'admin' },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        role: true,
        funcaoPadrao: true,
        createdAt: true,
      },
    });

    return res.json(atualizado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao promover utilizador.' });
  }
});

router.patch('/:id/funcao-padrao', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const funcaoPadrao = String(req.body.funcaoPadrao || '').toLowerCase().trim();

  if (Number.isNaN(id)) {
    return res.status(400).json({ erro: 'ID invalido.' });
  }

  if (!['arbitro', 'mesa'].includes(funcaoPadrao)) {
    return res.status(400).json({ erro: 'funcaoPadrao deve ser "arbitro" ou "mesa".' });
  }

  try {
    const utilizador = await prisma.utilizador.findUnique({ where: { id } });

    if (!utilizador) {
      return res.status(404).json({ erro: 'Utilizador nao encontrado.' });
    }

    const atualizado = await prisma.utilizador.update({
      where: { id },
      data: { funcaoPadrao },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        role: true,
        funcaoPadrao: true,
        createdAt: true,
      },
    });

    return res.json(atualizado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar funcao padrao.' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }

  if (req.utilizador && req.utilizador.id === id) {
    return res.status(400).json({ erro: 'Não pode eliminar a sua própria conta.' });
  }

  try {
    const utilizador = await prisma.utilizador.findUnique({ where: { id } });

    if (!utilizador) {
      return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    }

    // Primeiro, apagar os registos de arbitragem associados para evitar erro de FK
    await prisma.registoArbitragem.deleteMany({
      where: { utilizadorId: id }
    });

    await prisma.utilizador.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao remover utilizador.' });
  }
});

module.exports = router;