const prisma = require('../config/database');
const { gerarCsv } = require('../utils/exportCsv');

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/masculinos|masculino|masc/g, 'masc')
    .replace(/femininos|feminino|fem/g, 'fem')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')
    .replace(/[^\p{L}\p{N}|]/gu, '');
}

function normalizarEquipa(texto) {
  const nome = normalizar(texto);

  if (
    nome.includes('brandoense') ||
    nome.includes('grib') ||
    nome.includes('duvalli')
  ) {
    return 'brandoense';
  }

  return nome;
}

function construirFiltroRegistos(req) {
  const { data, competicao, funcao, utilizador } = req.query;
  const isAdmin = req.utilizador?.role === 'admin';

  const where = {
    ...(isAdmin ? {} : { utilizadorId: req.utilizador.id }),
    ...(data && { dataJogo: data }),
    ...(funcao && { funcao }),
    ...(competicao && {
      competicao: { nome: { contains: competicao, mode: 'insensitive' } },
    }),
  };

  if (isAdmin && utilizador) {
    where.utilizadorId = parseInt(utilizador, 10);
  }

  return where;
}

function obterLetraEquipa(equipaCasa) {
  const match = equipaCasa.match(/\b([A-C])\b/i);
  return match ? match[1].toLowerCase() : '';
}

async function obterValorAutomatico(jogo, funcao) {
  const equipaJogo = normalizarEquipa(jogo.equipaCasa);
  const letraJogo = obterLetraEquipa(jogo.equipaCasa);
  const escalaoBase = normalizar(jogo.competicao?.escalao);
  const escalaoJogo = escalaoBase + letraJogo;

  const valores = await prisma.escalaoValor.findMany();

  // 1. Correspondência exata (escalão + letra)
  const registoExato = valores.find((item) => {
    const equipaItem = normalizarEquipa(item.equipa);
    const escalaoItem = normalizar(item.escalao);
    return equipaItem === equipaJogo && escalaoItem === escalaoJogo;
  });

  // 2. Correspondência parcial (um começa pelo outro)
  const registoParcial = valores.find((item) => {
    const equipaItem = normalizarEquipa(item.equipa);
    const escalaoItem = normalizar(item.escalao);
    return (
      equipaItem === equipaJogo &&
      escalaoItem &&
      (escalaoJogo.startsWith(escalaoItem) || escalaoItem.startsWith(escalaoJogo))
    );
  });

  const registoValor = registoExato || registoParcial;

  if (!registoValor) {
    return null;
  }

  return funcao === 'mesa'
    ? parseFloat(registoValor.valorMesa)
    : parseFloat(registoValor.valorArbitro);
}

async function criarRegisto(req, res) {
  const { jogo_id, funcao, valor, observacoes } = req.body;
  const isAdmin = req.utilizador?.role === 'admin';

  if (!jogo_id || !funcao) {
    return res.status(400).json({ erro: 'Campos obrigatórios em falta.' });
  }

  if (!['arbitro1', 'mesa'].includes(funcao)) {
    return res.status(400).json({ erro: 'Função inválida. Use "arbitro1" ou "mesa".' });
  }

  try {
    const jogo = await prisma.jogoFPB.findUnique({
      where: { id: parseInt(jogo_id) },
      include: { competicao: true },
    });

    if (!jogo) {
      return res.status(404).json({ erro: 'Jogo não encontrado.' });
    }

    let valorFinal = null;

    if (isAdmin && valor != null && !Number.isNaN(parseFloat(valor))) {
      valorFinal = parseFloat(valor);
    } else {
      valorFinal = await obterValorAutomatico(jogo, funcao);
    }

    if (valorFinal == null || Number.isNaN(valorFinal)) {
      return res.status(400).json({
        erro: 'Não foi encontrado um valor automático para esta equipa e escalão.',
      });
    }

    const registo = await prisma.registoArbitragem.create({
      data: {
        utilizadorId: req.utilizador.id,
        jogoFpbId: jogo.id,
        dataJogo: jogo.dataJogo,
        horaJogo: jogo.horaJogo || null,
        competicaoId: jogo.competicaoId || null,
        equipaCasa: jogo.equipaCasa,
        equipaFora: jogo.equipaFora,
        pavilhao: jogo.pavilhao || null,
        funcao,
        observacoes: observacoes || null,
        valor: valorFinal,
      },
      include: {
        competicao: true,
        utilizador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(registo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar registo.' });
  }
}

async function listarRegistos(req, res) {
  try {
    const registos = await prisma.registoArbitragem.findMany({
      where: construirFiltroRegistos(req),
      include: {
        competicao: true,
        utilizador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: [{ dataJogo: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ resultados: registos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar registos.' });
  }
}

async function exportarRegistos(req, res) {
  try {
    const registos = await prisma.registoArbitragem.findMany({
      where: construirFiltroRegistos(req),
      include: {
        competicao: true,
        utilizador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: [{ dataJogo: 'desc' }, { createdAt: 'desc' }],
    });

    const csv = gerarCsv(registos);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="registos_arbitragem.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao exportar registos.' });
  }
}

module.exports = { criarRegisto, listarRegistos, exportarRegistos };